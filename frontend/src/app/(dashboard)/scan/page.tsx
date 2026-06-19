"use client";

import { useRouter } from "next/navigation";
import { CameraCapture, type ScanResult } from "@/components/scan/CameraCapture";
import { storeScanResult } from "@/lib/utils/scanHandoff";

export default function ScanPage() {
  const router = useRouter();

  function handleContinue(result: ScanResult) {
    storeScanResult(result);
    router.push("/medicines?scanned=1");
  }

  function handleCancel() {
    router.push("/medicines");
  }

  return <CameraCapture onContinue={handleContinue} onCancel={handleCancel} />;
}
