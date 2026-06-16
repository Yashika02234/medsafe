"use client";

import { useState, useEffect, useCallback } from "react";
import { MedicineCard } from "@/components/medicines/MedicineCard";
import { AddMedicineSheet } from "@/components/medicines/AddMedicineSheet";

type FilterKey = "all" | "expiring_soon" | "expired";

interface Ingredient {
  id: string;
  salt_name: string;
  rxcui: string | null;
}

interface Medicine {
  id: string;
  brand_name: string;
  generic_name: string | null;
  expiry_date: string;
  quantity: number | null;
  dosage_schedule: string | null;
  resolution_status: string;
  ingredients: Ingredient[];
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expiring_soon", label: "Expiring" },
  { key: "expired", label: "Expired" },
];

function getStatus(expiryDate: string) {
  const d = new Date(expiryDate);
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  if (d < now) return "expired";
  if (d <= in30) return "expiring_soon";
  return "safe";
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicines");
      const data = await res.json();
      if (data.success) setMedicines(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  function handleDelete(id: string) {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered =
    filter === "all"
      ? medicines
      : medicines.filter((m) => getStatus(m.expiry_date) === filter);

  return (
    <>
      <div className="px-5 pt-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
            Medicine Cabinet
          </h1>
          <span className="text-[13px] text-[var(--ms-txt3)]">
            {medicines.length} medicines
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-[7px] rounded-full border text-[13px] font-medium transition-colors ${
                filter === key
                  ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
                  : "bg-transparent border-[var(--ms-bord)] text-[var(--ms-txt3)]"
              }`}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({medicines.filter((m) => getStatus(m.expiry_date) === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Medicine list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[76px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} onAdd={() => setSheetOpen(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((med) => (
              <MedicineCard key={med.id} medicine={med} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* FAB to open sheet */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Add medicine"
        className="fixed bottom-[98px] right-5 w-14 h-14 rounded-full bg-[var(--ms-acc)] flex items-center justify-center shadow-lg z-30 max-w-lg"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>

      <AddMedicineSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={loadMedicines}
      />
    </>
  );
}

function EmptyState({
  filter,
  onAdd,
}: {
  filter: FilterKey;
  onAdd: () => void;
}) {
  if (filter !== "all") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[15px] font-semibold text-[var(--ms-txt)]">
          No {filter === "expired" ? "expired" : "expiring"} medicines
        </p>
        <p className="text-[13px] text-[var(--ms-txt3)]">
          {filter === "expired" ? "Nothing has expired." : "Nothing expiring in the next 30 days."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="w-20 h-20 rounded-3xl bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--ms-acc)" opacity="0.6">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">
          Your cabinet is empty
        </p>
        <p className="text-[13px] text-[var(--ms-txt3)] max-w-[240px] mx-auto leading-relaxed">
          Tap the + button to add your first medicine and start tracking expiry dates.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="bg-[var(--ms-acc)] text-white rounded-2xl px-8 py-[14px] text-[15px] font-semibold"
      >
        Add first medicine
      </button>
    </div>
  );
}
