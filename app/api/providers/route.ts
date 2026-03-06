import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get("specialty") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const providers = store.getProviders(specialty, name);
  return NextResponse.json(providers);
}
