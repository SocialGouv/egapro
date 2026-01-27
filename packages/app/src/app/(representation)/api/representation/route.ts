import { NextResponse } from "next/server";
import {
  findRepresentationBySirenYear,
  upsertRepresentation,
} from "../../repos/representationRepo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siren = searchParams.get("siren") || "";
  const year = Number(searchParams.get("year") || 0);
  if (!siren || !year)
    return NextResponse.json({ error: "siren/year required" }, { status: 400 });
  const data = await findRepresentationBySirenYear(siren, year);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { siren, year, data } = body || {};
  if (!siren || !year)
    return NextResponse.json({ error: "siren/year required" }, { status: 400 });
  const res = await upsertRepresentation(siren, year, data);
  return NextResponse.json(res);
}
