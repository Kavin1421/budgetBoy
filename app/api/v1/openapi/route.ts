import { NextResponse } from "next/server";
import { openApiV1Document } from "@/lib/openapi/v1Spec";

export async function GET() {
  return NextResponse.json(openApiV1Document, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
