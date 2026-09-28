import { NextResponse } from "next/server";
import { getAccountOverview, getCurrentAccount } from "@/lib/account-auth";

export async function GET() {
  const user = await getCurrentAccount();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user, ...(await getAccountOverview(user.id)) });
}
