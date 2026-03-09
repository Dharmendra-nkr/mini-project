"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3, Users, BedDouble, Star,
  TrendingUp, LogOut, MessageSquare, Send,
  Loader2,
} from "lucide-react";
import { manager as managerApi } from "../../../lib/api";

interface DashboardData {
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  total_guests: number;
  total_bookings: number;
  revenue_total: number;
  avg_rating: number;
  bookings_by_status: Record<string, number>;
  top_wings: { wing: string; bookings: number }[];
  recent_bookings: Record<string, unknown>[];
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [managerName, setManagerName] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Insights
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Sections
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "guests" | "reviews">("overview");
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("manager_token");
    const n = sessionStorage.getItem("manager_name");
    if (!t) {
      router.push("/manager/login");
      return;
    }
    setToken(t);
    setManagerName(n || "Manager");
  }, [router]);

  useEffect(() => {
    if (!token) return;
    managerApi
      .dashboard(token)
      .then((res) => setData(res as unknown as DashboardData))
      .catch(() => router.push("/manager/login"))
      .finally(() => setLoading(false));
  }, [token, router]);

  const loadTab = useCallback(
    async (tab: typeof activeTab) => {
      setActiveTab(tab);
      if (tab === "overview") return;
      setTableLoading(true);
      try {
        if (tab === "bookings") {
          const res = await managerApi.bookings(token);
          setTableData(res.bookings);
        } else if (tab === "guests") {
          const res = await managerApi.guests(token);
          setTableData(res.guests);
        } else if (tab === "reviews") {
          const res = await managerApi.reviews(token);
          setTableData(res.reviews);
        }
      } catch {
        setTableData([]);
      }
      setTableLoading(false);
    },
    [token]
  );

  const askAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    setAiLoading(true);
    setAiInsight("");
    try {
      const res = await managerApi.aiInsights(token, aiQuestion.trim());
      setAiInsight(res.insight);
    } catch {
      setAiInsight("Unable to generate insights at this time.");
    }
    setAiLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("manager_token");
    sessionStorage.removeItem("manager_name");
    sessionStorage.removeItem("manager_role");
    router.push("/manager/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sand)]">
        <div className="w-10 h-10 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: "Occupancy",
      value: `${data.occupancy_rate?.toFixed(1) || 0}%`,
      sub: `${data.occupied_rooms}/${data.total_rooms} rooms`,
      icon: BedDouble,
      color: "text-[var(--ocean)]",
    },
    {
      label: "Total Guests",
      value: data.total_guests?.toLocaleString() || "0",
      sub: "registered guests",
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Bookings",
      value: data.total_bookings?.toLocaleString() || "0",
      sub: "all-time total",
      icon: BarChart3,
      color: "text-[var(--gold)]",
    },
    {
      label: "Avg Rating",
      value: data.avg_rating?.toFixed(1) || "N/A",
      sub: "guest satisfaction",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Revenue",
      value: `$${(data.revenue_total || 0).toLocaleString()}`,
      sub: "total revenue",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--sand)] pt-20">
      {/* Header */}
      <div className="bg-[var(--navy)] px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-white/60 text-sm">Welcome back, {managerName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white flex items-center gap-2 text-sm transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-black/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={18} className={s.color} />
                <span className="text-xs text-[var(--muted)]">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-[var(--navy)]">{s.value}</p>
              <p className="text-[10px] text-[var(--muted)]">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 w-fit shadow-sm border border-black/5">
          {(["overview", "bookings", "guests", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => loadTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-[var(--gold)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--navy)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings by Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="font-bold text-[var(--navy)] mb-4">Bookings by Status</h3>
              <div className="space-y-3">
                {Object.entries(data.bookings_by_status || {}).map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(data.bookings_by_status || {}));
                  const pct = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-[var(--foreground)]">{status}</span>
                        <span className="font-bold">{count as number}</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--sand)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--gold)] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Wings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
              <h3 className="font-bold text-[var(--navy)] mb-4">Top Wings</h3>
              <div className="space-y-3">
                {(data.top_wings || []).map((w) => {
                  const maxB = Math.max(...(data.top_wings || []).map((x) => x.bookings));
                  const pct = maxB > 0 ? (w.bookings / maxB) * 100 : 0;
                  return (
                    <div key={w.wing}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--foreground)]">{w.wing}</span>
                        <span className="font-bold">{w.bookings} bookings</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--sand)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--ocean)] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5 lg:col-span-2">
              <h3 className="font-bold text-[var(--navy)] mb-4">Recent Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-black/5">
                      <th className="pb-2 font-medium">Ref</th>
                      <th className="pb-2 font-medium">Guest</th>
                      <th className="pb-2 font-medium">Room</th>
                      <th className="pb-2 font-medium">Check-in</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {(data.recent_bookings || []).slice(0, 10).map((b, i) => (
                      <tr key={i}>
                        <td className="py-2 font-mono text-xs">{String(b.booking_ref || "")}</td>
                        <td className="py-2">{String(b.guest_name || "")}</td>
                        <td className="py-2">{String(b.room_number || "")}</td>
                        <td className="py-2">{String(b.check_in || "")}</td>
                        <td className="py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              b.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : b.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {String(b.status || "")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Table view for bookings/guests/reviews */}
        {activeTab !== "overview" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
            {tableLoading ? (
              <div className="text-center py-10">
                <Loader2 size={24} className="animate-spin mx-auto text-[var(--gold)]" />
              </div>
            ) : tableData.length === 0 ? (
              <p className="text-center text-[var(--muted)] py-10">No data found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-black/5">
                      {Object.keys(tableData[0]).slice(0, 8).map((key) => (
                        <th key={key} className="pb-2 pr-4 font-medium capitalize whitespace-nowrap">
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {tableData.slice(0, 50).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).slice(0, 8).map((val, j) => (
                          <td key={j} className="py-2 pr-4 whitespace-nowrap">
                            {val == null ? "—" : String(val).substring(0, 60)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AI Insights */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-black/5">
          <h3 className="font-bold text-[var(--navy)] mb-2 flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--gold)]" />
            AI Business Insights
          </h3>
          <p className="text-xs text-[var(--muted)] mb-4">
            Ask the AI agent to analyze resort data and provide actionable insights.
          </p>

          <div className="flex gap-2">
            <input
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="e.g., What are the revenue trends? Which wing needs attention?"
              className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none transition"
            />
            <button
              onClick={askAI}
              disabled={aiLoading}
              className="px-4 py-2.5 rounded-lg bg-[var(--gold)] text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] disabled:opacity-50 transition flex items-center gap-2"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {aiInsight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-[var(--sand)] rounded-lg text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap"
            >
              {aiInsight}
            </motion.div>
          )}

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "Revenue summary for this quarter",
              "Room occupancy trends by wing",
              "Guest satisfaction analysis",
              "Recommended pricing adjustments",
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setAiQuestion(q);
                }}
                className="text-[10px] px-3 py-1 rounded-full border border-[var(--gold)]/30 text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
