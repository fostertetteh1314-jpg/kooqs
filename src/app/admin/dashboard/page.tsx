import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice, getStatusInfo } from "@/lib/utils";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  TrendingUp, ShoppingBag, Users, DollarSign,
  Clock, ChevronRight, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardRefresher from "@/components/admin/DashboardRefresher";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfDay(subDays(now, 7));

  const [todayOrders, weekOrders, totalCustomers, recentOrders, pendingCount, ordersByStatus] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" } },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart }, status: { not: "cancelled" } },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({ distinct: ["phone"], select: { phone: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: { take: 1, select: { name: true } } },
      }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);

  const stats = [
    {
      label: "Today's Revenue",
      value: formatPrice(todayRevenue),
      sub: `${todayOrders.length} orders today`,
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Weekly Revenue",
      value: formatPrice(weekRevenue),
      sub: `${weekOrders.length} orders this week`,
      icon: TrendingUp,
      color: "text-kooqs-orange",
      bg: "bg-kooqs-orange/10",
    },
    {
      label: "Total Customers",
      value: totalCustomers.length.toString(),
      sub: "Unique customers",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Pending Orders",
      value: pendingCount.toString(),
      sub: "Awaiting confirmation",
      icon: Clock,
      color: pendingCount > 0 ? "text-kooqs-red" : "text-kooqs-text-dim",
      bg: pendingCount > 0 ? "bg-kooqs-red/10" : "bg-kooqs-muted",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-14 lg:mt-0">
      <DashboardRefresher />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl">Dashboard</h1>
          <p className="text-kooqs-text-dim text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        {pendingCount > 0 && (
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center gap-2 bg-kooqs-red/10 border border-kooqs-red/20 text-kooqs-red px-3 py-2 rounded-xl text-sm font-bold hover:bg-kooqs-red/20 transition-colors animate-pulse-red"
          >
            <ShoppingBag size={14} />
            {pendingCount} new
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <ArrowUpRight size={14} className="text-kooqs-text-dim" />
            </div>
            <p className="text-white font-black text-xl sm:text-2xl">{stat.value}</p>
            <p className="text-kooqs-text-dim text-xs mt-1">{stat.label}</p>
            <p className="text-kooqs-text-dim text-xs mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts weekOrders={weekOrders.map(o => ({ total: o.total, createdAt: o.createdAt.toISOString() }))} ordersByStatus={ordersByStatus.map(s => ({ status: s.status, count: s._count.status }))} />

      {/* Recent orders */}
      <div className="card mt-6">
        <div className="flex items-center justify-between p-5 border-b border-kooqs-border">
          <h2 className="text-white font-bold text-lg">Recent Orders</h2>
          <Link href="/admin/orders" className="text-kooqs-red text-sm font-medium hover:underline flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-kooqs-border">
          {recentOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <Link
                key={order.id}
                href={`/admin/orders`}
                className="flex items-center gap-4 p-4 hover:bg-kooqs-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{order.customerName}</p>
                    <span className="text-kooqs-red text-xs font-mono">{order.orderNumber}</span>
                  </div>
                  <p className="text-kooqs-text-dim text-xs mt-0.5">{order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm">{formatPrice(order.total)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
