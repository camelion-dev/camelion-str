import AdminPortal from "./AdminPortal";
import { getAllCatalogProducts } from "@/lib/catalog";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { PageTransition, pageTransitionProps } from "@/components/PageTransition";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return (
    <PageTransition key="admin" {...pageTransitionProps}>
      <AdminPortal initialProducts={await getAllCatalogProducts()} />
    </PageTransition>
  );
}
