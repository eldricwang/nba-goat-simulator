import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("94790b5c8b9a1c4640da5ae08cc98758", {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
