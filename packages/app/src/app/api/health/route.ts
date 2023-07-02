import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";

function handler() {
  return NextResponse.json({ message: "OK" }, { status: StatusCodes.OK });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
