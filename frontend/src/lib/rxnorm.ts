const RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST";
const TIMEOUT_MS = 5000;

export async function resolveRxCUI(saltName: string): Promise<string | null> {
  const encoded = encodeURIComponent(saltName.trim());
  const url = `${RXNORM_BASE}/rxcui.json?name=${encoded}&search=2`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      idGroup?: { rxnormId?: string[] };
    };

    return data.idGroup?.rxnormId?.[0] ?? null;
  } catch {
    return null;
  }
}
