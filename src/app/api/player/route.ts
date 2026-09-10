import { NextRequest, NextResponse } from "next/server";
import { verifyBgmiUidWithAluu } from "@/lib/aluu";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const uid = searchParams.get("uid") || "";

  const result = await verifyBgmiUidWithAluu(uid);

  if (!result.success) {
    const status = result.message?.includes("timed out") ? 504 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
