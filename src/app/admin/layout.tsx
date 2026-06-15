export const dynamic = "force-dynamic";

import { SessionProvider } from "@/components/admin/SessionProvider";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOrderWatcher from "@/components/admin/AdminOrderWatcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Login page doesn't need sidebar
  const isLoginPage = !session;

  if (isLoginPage) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-kooqs-dark flex">
        <AdminSidebar />
        <AdminOrderWatcher />
        <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">{children}</main>
      </div>
    </SessionProvider>
  );
}
