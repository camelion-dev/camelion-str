import AdminPortal from "./AdminPortal";
import { getAllCatalogProducts } from "@/lib/catalog";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <AdminPortal initialProducts={await getAllCatalogProducts()} />;
}
