import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminCustomers } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ customers: await getAdminCustomers() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load customers." }, { status: 500 });
  }
}