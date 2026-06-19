import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: "OCR service is not configured", code: "OCR_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { success: false, error: "No image file provided", code: "MISSING_FILE" },
      { status: 400 }
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", file, "scan.jpg");

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${backendUrl}/ocr/scan`, {
      method: "POST",
      body: upstreamForm,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Couldn't reach the scan service. Please try again.", code: "OCR_UNREACHABLE" },
      { status: 502 }
    );
  }

  const body = await upstreamRes.json();

  if (!upstreamRes.ok) {
    return NextResponse.json(
      { success: false, error: body.message ?? "Scan failed. Please try again.", code: (body.error ?? "OCR_ERROR").toUpperCase() },
      { status: upstreamRes.status }
    );
  }

  return NextResponse.json({ success: true, data: body });
}
