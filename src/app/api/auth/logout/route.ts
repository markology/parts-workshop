import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  return NextResponse.redirect(`${baseUrl}/api/auth/signout?callbackUrl=/`);
}
