import type { Metadata } from "next";
import { AdminClientLayout } from "@/components/admin/AdminWorkspace";
import "./admin.css";

export const metadata: Metadata = {
  title: "管理画面 | 神社御縁",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
