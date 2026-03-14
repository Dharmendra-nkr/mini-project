"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, BedDouble, Star, DollarSign,
  TrendingUp, LogOut, MessageSquare, Send,
  Loader2, CalendarDays, Building2, Search,
  RefreshCw, Clock, CheckCircle2, XCircle,
  AlertTriangle, Hotel, Eye,
} from "lucide-react";
import { manager as managerApi } from "../../../lib/api";

/* ── Types ── */
interface DashboardData {
  manager: string;
  role: string;
  date: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  total_guests: number;
  total_bookings: number;
  total_revenue: number;
  avg_rating: number;
  bookings_by_status: Record<string, number>;
  top_wings: { wing: string; bookings: number }[];
  top_rooms: { room_name: string; room_number: string; wing: string; bookings: number; avg_rating: number }[];
  recent_bookings: Record<string, unknown>[];
  revenue_monthly: { month: string; revenue: number; bookings: number }[];
  by_wing: { wing: string; revenue: number; bookings: number }[];
}

type Tab = "overview" | "bookings" | "guests" | "reviews" | "analytics";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  checked_in: "bg-blue-100 text-blue-700",
  checked_out: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  confirmed: CheckCircle2,
  checked_in: Hotel,
  cancelled: XCircle,
  pending: Clock,
  checked_out: Eye,
};

/* ── Component ── */
export default function ManagerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /* ── Auth check ── */
  useEffect(() => {
    const t = sessionStorage.getItem("manager_token");
    const n = sessionStorage.getItem("manager_name");
    const r = sessionStorage.getItem("manager_role");
    if (!t) { router.push("/manager/login"); return; }
    setToken(t);
    setManagerName(n || "Manager");
    setManagerRole(r || "staff");
  }, [router]);

  /* ── Load dashboard ── */
  const loadDashboard = useCallback(async (t: string) => {
    try {
      const res = await managerApi.dashboard(t);
      setData(res as unknown as DashboardData);
    } catch {
      sessionStorage.removeItem("manager_token");
      router.push("/manager/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadDashboard(token);
  }, [token, loadDashboard]);

  /* ── Tab loader ── */
  const loadTab = useCallback(
    async (tab: Tab) => {
      setActiveTab(tab);
      if (tab === "overview" || tab === "analytics") { setTableData([]); return; }
      setTableLoading(true);
      setTableSearch("");
      setStatusFilter("");
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
      } catch { setTableData([]); }
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
    } catch { setAiInsight("Unable to generate insights at this time."); }
    setAiLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("manager_token");
    sessionStorage.removeItem("manager_name");
    sessionStorage.removeItem("manager_role");
    router.push("/manager/login");
  };

  const handleRefresh = () => { setRefreshing(true); loadDashboard(token); };

  /* ── Filtered table rows ── */
  const filteredTable = tableData.filter((row) => {
    const matchSearch = !tableSearch || Object.values(row).some(
      (v) => v != null && String(v).toLowerCase().includes(tableSearch.toLowerCase())
    );
    const matchStatus = !statusFilter || String(row.status || row.loyalty_tier || "") === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--navy)] to-[#0a1628]">
        <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: "Total Revenue", value: `$${(data.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "from-emerald-500 to-emerald-600", change: "+12.5%" },
    { label: "Occupancy Rate", value: `${(data.occupancy_rate || 0).toFixed(1)}%`, icon: BedDouble, color: "from-blue-500 to-blue-600", sub: `${data.occupied_rooms}/${data.total_rooms} rooms` },
    { label: "Total Bookings", value: (data.total_bookings || 0).toLocaleString(), icon: CalendarDays, color: "from-[#b8860b] to-[#daa520]", sub: "all time" },
    { label: "Total Guests", value: (data.total_guests || 0).toLocaleString(), icon: Users, color: "from-violet-500 to-violet-600", sub: "registered" },
    { label: "Avg Rating", value: (data.avg_rating || 0).toFixed(1), icon: Star, color: "from-amber-500 to-amber-600", sub: "out of 5.0" },
  ];

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "bookings", label: "Bookings", icon: CalendarDays },
    { key: "guests", label: "Guests", icon: Users },
    { key: "reviews", label: "Reviews", icon: Star },
    { key: "analytics", label: "AI Analytics", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--navy)] to-[#0a1628] border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#daa520] flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Grand Meridian Resort</h1>
              <p className="text-white/50 text-xs">Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">{managerName}</p>
              <p className="text-white/40 text-xs capitalize">{managerRole} &middot; {data.date}</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition" title="Refresh">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition text-sm">
              <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <s.icon size={15} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--navy)]">{s.value}</p>
              {s.sub && <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>}
              {s.change && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-medium">{s.change}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 shadow-sm border border-black/5 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => loadTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-[var(--navy)] text-white shadow-sm" : "text-gray-500 hover:text-[var(--navy)] hover:bg-gray-50"
              }`}>
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {/* === OVERVIEW === */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Booking Status */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                    <h3 className="font-bold text-[var(--navy)] mb-4 flex items-center gap-2">
                      <BarChart3 size={16} className="text-[var(--gold)]" /> Booking Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(data.bookings_by_status || {}).map(([status, count]) => {
                        const total = Object.values(data.bookings_by_status || {}).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                        const Icon = STATUS_ICONS[status] || AlertTriangle;
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500"}`}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize font-medium text-gray-700">{status.replace("_", " ")}</span>
                                <span className="font-bold text-[var(--navy)]">{count as number}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--gold)] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wing Performance + Revenue */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                    <h3 className="font-bold text-[var(--navy)] mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-[var(--gold)]" /> Wing Performance
                    </h3>
                    <div className="space-y-4">
                      {(data.top_wings || []).map((w, i) => {
                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];
                        const maxB = Math.max(...(data.top_wings || []).map((x) => x.bookings));
                        const pct = maxB > 0 ? (w.bookings / maxB) * 100 : 0;
                        return (
                          <div key={w.wing}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{w.wing}</span>
                              <span className="font-bold text-[var(--navy)]">{w.bookings} bookings</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[i % 4]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Revenue by Wing</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(data.by_wing || []).map((w) => (
                          <div key={w.wing} className="p-2 rounded-lg bg-gray-50">
                            <p className="text-[10px] text-gray-400">{w.wing}</p>
                            <p className="text-sm font-bold text-[var(--navy)]">${(w.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Revenue */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                    <h3 className="font-bold text-[var(--navy)] mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-[var(--gold)]" /> Monthly Revenue
                    </h3>
                    <div className="space-y-2">
                      {(data.revenue_monthly || []).slice(-6).map((m) => {
                        const maxRev = Math.max(...(data.revenue_monthly || []).slice(-6).map((x) => x.revenue));
                        const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                        const monthLabel = (() => { try { return new Date(m.month + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" }); } catch { return m.month; } })();
                        return (
                          <div key={m.month}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{monthLabel}</span>
                              <span className="font-semibold text-gray-700">${m.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.bookings} bookings</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Rooms */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                  <h3 className="font-bold text-[var(--navy)] mb-4 flex items-center gap-2">
                    <Star size={16} className="text-[var(--gold)]" /> Top Performing Rooms
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider">
                          <th className="pb-3 font-medium">#</th>
                          <th className="pb-3 font-medium">Room</th>
                          <th className="pb-3 font-medium">Wing</th>
                          <th className="pb-3 font-medium">Bookings</th>
                          <th className="pb-3 font-medium">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(data.top_rooms || []).map((r, i) => (
                          <tr key={r.room_number} className="hover:bg-gray-50/50 transition">
                            <td className="py-3 font-bold text-[var(--gold)]">{i + 1}</td>
                            <td className="py-3"><p className="font-medium text-[var(--navy)]">{r.room_name}</p><p className="text-[10px] text-gray-400">{r.room_number}</p></td>
                            <td className="py-3 text-gray-600">{r.wing}</td>
                            <td className="py-3 font-semibold text-[var(--navy)]">{r.bookings}</td>
                            <td className="py-3"><div className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><span className="font-medium">{r.avg_rating?.toFixed(1) || "—"}</span></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[var(--navy)] flex items-center gap-2">
                      <Clock size={16} className="text-[var(--gold)]" /> Recent Bookings
                    </h3>
                    <button onClick={() => loadTab("bookings")} className="text-xs text-[var(--gold)] hover:underline font-medium">View All →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider">
                          <th className="pb-3 font-medium">Reference</th>
                          <th className="pb-3 font-medium">Guest</th>
                          <th className="pb-3 font-medium">Room</th>
                          <th className="pb-3 font-medium">Check-in</th>
                          <th className="pb-3 font-medium">Check-out</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(data.recent_bookings || []).slice(0, 10).map((b, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition">
                            <td className="py-3 font-mono text-xs text-[var(--navy)] font-semibold">{String(b.booking_ref || "")}</td>
                            <td className="py-3"><p className="font-medium text-gray-700">{String(b.guest_name || "")}</p><p className="text-[10px] text-gray-400">{String(b.guest_email || "")}</p></td>
                            <td className="py-3"><p className="font-medium text-gray-700">{String(b.room_name || "")}</p><p className="text-[10px] text-gray-400">{String(b.room_number || "")} &middot; {String(b.room_type || "")}</p></td>
                            <td className="py-3 text-gray-600 whitespace-nowrap">{String(b.check_in || "")}</td>
                            <td className="py-3 text-gray-600 whitespace-nowrap">{String(b.check_out || "")}</td>
                            <td className="py-3 font-semibold text-[var(--navy)]">${Number(b.total_price || 0).toLocaleString()}</td>
                            <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[String(b.status)] || "bg-gray-100 text-gray-500"}`}>{String(b.status || "").replace("_", " ")}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* === TABLE VIEWS === */}
            {(activeTab === "bookings" || activeTab === "guests" || activeTab === "reviews") && (
              <div className="bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--navy)] capitalize">{activeTab} Management</h3>
                    <p className="text-xs text-gray-400">{filteredTable.length} records found</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder={`Search ${activeTab}...`}
                        className="w-full sm:w-60 text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--gold)] focus:outline-none transition" />
                    </div>
                    {activeTab === "bookings" && (
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--gold)] focus:outline-none transition text-gray-600">
                        <option value="">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="pending">Pending</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {tableLoading ? (
                    <div className="text-center py-16">
                      <Loader2 size={28} className="animate-spin mx-auto text-[var(--gold)] mb-2" />
                      <p className="text-sm text-gray-400">Loading {activeTab}...</p>
                    </div>
                  ) : filteredTable.length === 0 ? (
                    <div className="text-center py-16">
                      <Search size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-400">No {activeTab} found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider">
                            {Object.keys(filteredTable[0]).filter((k) => k !== "id").slice(0, 9).map((key) => (
                              <th key={key} className="pb-3 pr-4 font-medium whitespace-nowrap">{key.replace(/_/g, " ")}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredTable.slice(0, 50).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition">
                              {Object.entries(row).filter(([k]) => k !== "id").slice(0, 9).map(([key, val], j) => (
                                <td key={j} className="py-2.5 pr-4 whitespace-nowrap">
                                  {key === "status" ? (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[String(val)] || "bg-gray-100 text-gray-500"}`}>{String(val || "").replace("_", " ")}</span>
                                  ) : key === "overall_rating" ? (
                                    <div className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><span>{String(val)}</span></div>
                                  ) : key === "total_price" ? (
                                    <span className="font-semibold">${Number(val || 0).toLocaleString()}</span>
                                  ) : (
                                    <span className="text-gray-700">{val == null ? "—" : String(val).substring(0, 50)}</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === AI ANALYTICS === */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-black/5">
                  <h3 className="font-bold text-[var(--navy)] mb-2 flex items-center gap-2">
                    <MessageSquare size={18} className="text-[var(--gold)]" /> AI Business Intelligence
                  </h3>
                  <p className="text-xs text-gray-400 mb-5">Ask questions about resort performance, revenue trends, guest patterns, and get AI-powered actionable insights.</p>
                  <div className="flex gap-2 mb-4">
                    <input value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAI()}
                      placeholder="e.g., What are the revenue trends? Which wing needs attention?"
                      className="flex-1 text-sm px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--gold)] focus:outline-none transition" />
                    <button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}
                      className="px-5 py-3 rounded-xl bg-[var(--navy)] text-white hover:bg-[var(--navy)]/90 disabled:opacity-40 transition flex items-center gap-2 text-sm font-medium">
                      {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Analyze
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Full revenue and occupancy overview", "Which wing generates the most revenue?", "Guest satisfaction analysis", "Revenue trends — are we growing?", "Top performing rooms analysis", "Recommend pricing adjustments", "Seasonal booking patterns", "Cancellation rate analysis"].map((q) => (
                      <button key={q} onClick={() => setAiQuestion(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-[var(--gold)] hover:border-[var(--gold)] transition">{q}</button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {aiInsight && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400"><MessageSquare size={12} /> AI Analytics Agent Response</div>
                        {aiInsight}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-black/5">
                    <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Booking Mix</p>
                    {Object.entries(data.bookings_by_status || {}).map(([status, count]) => {
                      const total = Object.values(data.bookings_by_status || {}).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (((count as number) / total) * 100).toFixed(1) : "0";
                      return (<div key={status} className="flex justify-between py-1 text-sm"><span className="capitalize text-gray-600">{status.replace("_", " ")}</span><span className="font-medium text-[var(--navy)]">{pct}%</span></div>);
                    })}
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-black/5">
                    <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Revenue Breakdown</p>
                    {(data.by_wing || []).map((w) => (
                      <div key={w.wing} className="flex justify-between py-1 text-sm"><span className="text-gray-600">{w.wing}</span><span className="font-medium text-[var(--navy)]">${(w.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-black/5">
                    <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Key Metrics</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Rooms</span><span className="font-medium text-[var(--navy)]">{data.total_rooms}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Occupied Now</span><span className="font-medium text-[var(--navy)]">{data.occupied_rooms}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Avg Revenue/Booking</span><span className="font-medium text-[var(--navy)]">${data.total_bookings > 0 ? Math.round(data.total_revenue / data.total_bookings).toLocaleString() : "0"}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Guest Rating</span><span className="font-medium text-[var(--navy)]">{data.avg_rating?.toFixed(1)} / 5.0</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
