import type { ScanResult } from "@/components/scan/CameraCapture";

const SCAN_RESULT_KEY = "medsafe:scanResult";

export function storeScanResult(result: ScanResult) {
  sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(result));
}

/** Reads and clears the pending scan result, if any. Safe to call once per mount. */
export function consumeScanResult(): ScanResult | null {
  const raw = sessionStorage.getItem(SCAN_RESULT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(SCAN_RESULT_KEY);
  try {
    return JSON.parse(raw) as ScanResult;
  } catch {
    return null;
  }
}
