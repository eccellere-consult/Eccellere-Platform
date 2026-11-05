import { Metadata } from "next";
import AdminFrame from "@/components/standard/AdminFrame";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
