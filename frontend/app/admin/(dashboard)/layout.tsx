"use client";

import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGate>
      <div className="flex h-screen overflow-hidden bg-[#ececec]">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 py-4">
            <p className="text-sm font-semibold text-brand-black/60">Espace administration</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-brand-black">Admin</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
                A
              </span>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </AdminAuthGate>
  );
}
