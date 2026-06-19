"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/utils/imageCompression";

export interface ScanResult {
  medicine_name: string | null;
  expiry_date: string | null;
  confidence_score: number;
}

interface CameraCaptureProps {
  onContinue: (result: ScanResult) => void;
  onCancel: () => void;
}

type Mode = "capturing" | "uploading" | "result" | "error";

const LOW_CONFIDENCE_THRESHOLD = 0.7;

export function CameraCapture({ onContinue, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("capturing");
  const [errorMessage, setErrorMessage] = useState("");
  const [allowFileFallback, setAllowFileFallback] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (mode !== "capturing") return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (cancelled) return;
        setAllowFileFallback(true);
        setErrorMessage(
          "Couldn't access the camera. You can upload a photo instead."
        );
        setMode("error");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function uploadBlob(blob: Blob) {
    setPreviewUrl(URL.createObjectURL(blob));
    setMode("uploading");

    try {
      const compressed = await compressImage(blob);
      const formData = new FormData();
      formData.set("file", compressed, "scan.jpg");

      const res = await fetch("/api/ocr/scan", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) {
        setAllowFileFallback(false);
        setErrorMessage(data.error ?? "Scan failed. Please try again.");
        setMode("error");
        return;
      }

      setResult(data.data);
      setMode("result");
    } catch {
      setAllowFileFallback(false);
      setErrorMessage("Something went wrong. Please try again.");
      setMode("error");
    }
  }

  async function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopStream();

    canvas.toBlob(
      (blob) => {
        if (blob) uploadBlob(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  function handleFileFallback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadBlob(file);
  }

  function handleRetake() {
    setResult(null);
    setErrorMessage("");
    setAllowFileFallback(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMode("capturing");
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--ms-page-bg)] flex flex-col max-w-lg mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={() => {
            stopStream();
            onCancel();
          }}
          aria-label="Close scanner"
          className="w-9 h-9 rounded-full bg-[var(--ms-surf)] flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ms-txt2)">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <p className="text-[15px] font-semibold text-[var(--ms-txt)]">Scan Medicine Strip</p>
        <div className="w-9" />
      </div>

      {mode === "capturing" && (
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[80%] h-[35%] border-2 border-[var(--ms-acc)] rounded-2xl overflow-hidden">
              <div className="absolute left-0 right-0 h-[2px] bg-[var(--ms-acc)] shadow-[0_0_8px_var(--ms-acc)] animate-[scanLine_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <p className="absolute bottom-[140px] left-0 right-0 text-center text-[13px] text-[var(--ms-txt2)] px-8">
            Line up the medicine name and expiry date inside the frame
          </p>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={handleCapture}
              aria-label="Capture photo"
              className="w-[70px] h-[70px] rounded-full bg-[var(--ms-acc)] border-4 border-[var(--ms-surf)] nav-fab-shadow"
            />
          </div>
        </div>
      )}

      {mode === "uploading" && (
        <div className="relative flex-1 overflow-hidden">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Captured medicine strip" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4">
            <div className="relative w-[80%] h-[35%]">
              <div className="absolute left-0 right-0 h-[2px] bg-[var(--ms-acc)] shadow-[0_0_8px_var(--ms-acc)] animate-[scanLine_2s_ease-in-out_infinite]" />
            </div>
            <p className="text-[14px] font-medium text-white">Reading your medicine strip…</p>
          </div>
        </div>
      )}

      {mode === "result" && result && (
        <div className="flex-1 flex flex-col px-5 pb-8 gap-4 overflow-y-auto">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Captured medicine strip"
              className="w-full h-[180px] object-cover rounded-2xl border border-[var(--ms-bord)]"
            />
          )}

          <div className="bg-[var(--ms-surf)] rounded-2xl border border-[var(--ms-bord)] p-4 flex flex-col gap-3">
            <ConfidenceBadge score={result.confidence_score} />

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--ms-txt3)] mb-1">
                Medicine name
              </p>
              <p className="text-[15px] font-semibold text-[var(--ms-txt)]">
                {result.medicine_name ?? "Not detected — enter manually"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--ms-txt3)] mb-1">
                Expiry date
              </p>
              <p className="text-[15px] font-semibold text-[var(--ms-txt)]">
                {result.expiry_date ?? "Not detected — enter manually"}
              </p>
            </div>
          </div>

          <p className="text-[12px] text-[var(--ms-txt3)]">
            You&apos;ll confirm and edit these details on the next screen before saving.
          </p>

          <div className="flex flex-col gap-3 mt-auto">
            <button
              type="button"
              onClick={() => onContinue(result)}
              className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[16px] text-[16px] font-semibold"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="w-full bg-[var(--ms-surf2)] text-[var(--ms-txt)] rounded-2xl py-[14px] text-[15px] font-medium"
            >
              Retake photo
            </button>
          </div>
        </div>
      )}

      {mode === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5 text-center">
          <p className="text-[15px] text-[var(--ms-txt)]">{errorMessage}</p>
          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <button
              type="button"
              onClick={handleRetake}
              className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[14px] text-[15px] font-semibold"
            >
              Try again
            </button>
            {allowFileFallback && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[var(--ms-surf2)] text-[var(--ms-txt)] rounded-2xl py-[14px] text-[15px] font-medium"
                >
                  Upload a photo instead
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileFallback}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const isLow = score < LOW_CONFIDENCE_THRESHOLD;
  return (
    <div
      className={`self-start px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
        isLow
          ? "bg-[var(--ms-amb-bg)] text-[var(--ms-amb)]"
          : "bg-[var(--ms-grn-bg)] text-[var(--ms-grn)]"
      }`}
    >
      {isLow ? "Low confidence — please check" : "Looks good"}
    </div>
  );
}
