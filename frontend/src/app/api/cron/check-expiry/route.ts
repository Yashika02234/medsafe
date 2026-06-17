import { NextRequest, NextResponse } from "next/server";
import { processExpiryAlerts } from "@/lib/services/expiryChecker";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Cron-Secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await processExpiryAlerts();
  return NextResponse.json({
    success: true,
    data: { ...result, timestamp: new Date().toISOString() },
  });
}
