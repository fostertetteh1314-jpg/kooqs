"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, Clock, Phone, MapPin, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getStatusInfo, getNextStatus, formatPrice, ORDER_STATUSES } from "@/lib/utils";
import type { Order } from "@/types";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 5 s for new orders
  useEffect(() => {
    const id = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o)));
      toast.success(`Order updated to ${newStatus.replace(/_/g, " ")}`);
    } else {
      toast.error("Failed to update order");
    }
    setUpdatingId(null);
  }

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-14 lg:mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-black text-2xl sm:text-3xl">Orders</h1>
          <p className="text-kooqs-text-dim text-sm mt-1">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-xl bg-kooqs-card border border-kooqs-border hover:border-kooqs-red transition-colors text-kooqs-text-dim hover:text-white">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kooqs-text-dim" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kooqs-text-dim" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input pl-9 pr-8 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-kooqs-text-dim pointer-events-none" />
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-kooqs-red" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-kooqs-text-dim">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const nextStatus = getNextStatus(order.status);
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} className="card p-5 hover:border-kooqs-border/80 transition-all">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">{order.customerName}</span>
                      <span className="text-kooqs-red font-mono text-xs bg-kooqs-red/10 px-2 py-0.5 rounded-full">{order.orderNumber}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-kooqs-text-dim text-xs">
                      <span>{format(new Date(order.createdAt), "MMM d, h:mm a")}</span>
                      <span className="flex items-center gap-1"><Phone size={11} />{order.phone}</span>
                      <span>{order.orderType === "delivery" ? "🚗 Delivery" : "🏃 Pickup"}</span>
                    </div>
                    {order.address && (
                      <p className="text-kooqs-text-dim text-xs mt-1 flex items-center gap-1">
                        <MapPin size={11} /> {order.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-black text-lg">{formatPrice(order.total)}</p>
                    {order.estimatedTime && (
                      <p className="text-kooqs-text-dim text-xs flex items-center gap-1 justify-end">
                        <Clock size={11} /> {order.estimatedTime}min
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-kooqs-muted/40 rounded-xl p-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span key={item.id} className="text-kooqs-text text-xs bg-kooqs-card border border-kooqs-border px-2 py-1 rounded-lg">
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="text-kooqs-orange text-xs mt-2 border-t border-kooqs-border pt-2">
                      📝 {order.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {nextStatus && order.status !== "cancelled" && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      disabled={isUpdating}
                      className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                      Mark as {nextStatus.replace(/_/g, " ")} →
                    </button>
                  )}
                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    <button
                      onClick={() => updateStatus(order.id, "cancelled")}
                      disabled={isUpdating}
                      className="btn-secondary text-sm py-2 px-3 text-red-400 hover:bg-red-500/10"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
