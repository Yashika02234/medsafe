const OPENFDA_BASE = "https://api.fda.gov/drug/label.json";
const TIMEOUT_MS = 5000;

// Module-level cache — FDA label text rarely changes, no need to refetch within a process lifetime.
const labelTextCache = new Map<string, string | null>();

interface OpenFdaLabelResponse {
  results?: Array<{
    drug_interactions?: string[];
  }>;
}

/** Fetches the `drug_interactions` label text for a drug's generic name. Returns null if not found. */
export async function getInteractionLabelText(genericName: string): Promise<string | null> {
  const key = genericName.trim().toLowerCase();
  if (labelTextCache.has(key)) return labelTextCache.get(key) ?? null;

  const query = `openfda.generic_name:"${key}"`;
  const url = `${OPENFDA_BASE}?search=${encodeURIComponent(query)}&limit=1`;

  let text: string | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      const data = (await res.json()) as OpenFdaLabelResponse;
      text = data.results?.[0]?.drug_interactions?.[0] ?? null;
    }
  } catch {
    text = null;
  }

  labelTextCache.set(key, text);
  return text;
}
