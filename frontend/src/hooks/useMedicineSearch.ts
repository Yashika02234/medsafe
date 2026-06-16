"use client";

import { useState, useRef, useCallback } from "react";
import Fuse from "fuse.js";

export interface CdscoEntry {
  name: string;
  mfr: string;
  salts: string[];
}

type FuseInstance = Fuse<CdscoEntry>;

// Module-level cache — built once, reused across component mounts
let fuseCache: FuseInstance | null = null;
let loadPromise: Promise<FuseInstance> | null = null;

async function getFuseIndex(): Promise<FuseInstance> {
  if (fuseCache) return fuseCache;
  if (loadPromise) return loadPromise;

  loadPromise = fetch("/data/cdsco.json")
    .then((res) => res.json() as Promise<CdscoEntry[]>)
    .then((data) => {
      fuseCache = new Fuse(data, {
        keys: ["name"],
        threshold: 0.35,
        minMatchCharLength: 3,
        distance: 200,
        includeScore: false,
      });
      return fuseCache;
    });

  return loadPromise;
}

export function useMedicineSearch() {
  const [results, setResults] = useState<CdscoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const fuse = await getFuseIndex();
        const hits = fuse.search(query, { limit: 8 });
        setResults(hits.map((h) => h.item));
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, search, clear, loading };
}
