import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: { default: "Painel administrativo", template: "%s | Admin Domary" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="relative min-h-dvh bg-[#f3f3ef] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]" data-admin-shell>
      <ThemeToggle variant="floating" />
      <AdminSidebar name={admin.name} />
      <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
