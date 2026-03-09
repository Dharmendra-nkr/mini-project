"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, AlertCircle } from "lucide-react";
import { auth } from "../../../lib/api";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      sessionStorage.setItem("manager_token", res.access_token);
      sessionStorage.setItem("manager_name", res.manager_name);
      sessionStorage.setItem("manager_role", res.role);
      router.push("/manager/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-resort-dark flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--gold)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Manager Portal</h1>
          <p className="text-white/60 text-sm mt-1">Grand Meridian Resort Administration</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@grandmeridian.com"
                className="w-full text-sm px-4 py-2.5 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] disabled:opacity-50 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
