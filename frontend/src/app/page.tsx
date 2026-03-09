"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Waves,
  Sparkles,
  MapPin,
  Star,
  Utensils,
  Palmtree,
  Compass,
} from "lucide-react";

const wings = [
  {
    name: "Coral Wing",
    desc: "Direct oceanfront luxury with private beach access",
    icon: Waves,
    color: "from-cyan-500 to-blue-600",
  },
  {
    name: "Horizon Wing",
    desc: "Panoramic views from elevated premium suites",
    icon: Compass,
    color: "from-orange-400 to-pink-500",
  },
  {
    name: "Palm Wing",
    desc: "Family-friendly garden retreats with kids club",
    icon: Palmtree,
    color: "from-emerald-400 to-teal-600",
  },
  {
    name: "Reef Wing",
    desc: "Marina-side sunset rooms near water sports",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
  },
];

const amenities = [
  { icon: Waves, label: "Infinity Pools" },
  { icon: Utensils, label: "5 Restaurants" },
  { icon: Sparkles, label: "World-class Spa" },
  { icon: MapPin, label: "Private Beach" },
  { icon: Star, label: "Water Sports" },
  { icon: Palmtree, label: "Tropical Gardens" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen bg-resort-hero flex items-center justify-center">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[var(--navy)]" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-[var(--gold-light)] backdrop-blur-sm border border-white/10 mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Luxury Experience
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Grand Meridian
            <span className="block text-gold mt-2 text-3xl md:text-4xl font-light tracking-widest">
              RESORT & SPA
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Where crystal-clear waters meet world-class hospitality.
            120 luxury rooms across 4 unique wings — explore in immersive 3D.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Link
              href="/explore"
              className="rounded-full bg-[var(--gold)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all shadow-lg shadow-[var(--gold)]/20"
            >
              Explore in 3D
            </Link>
            <Link
              href="/rooms"
              className="rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              View Rooms
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="h-8 w-5 rounded-full border-2 border-white/30 flex justify-center pt-1">
            <div className="h-2 w-1 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* ═══ WINGS ═══ */}
      <section className="bg-sand py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--navy)]">
              Four Distinct Wings
            </h2>
            <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
              Each wing offers a unique atmosphere, crafted for every type of traveler
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wings.map((w, i) => (
              <motion.div
                key={w.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-black/5"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${w.color} text-white mb-4 group-hover:scale-110 transition-transform`}
                >
                  <w.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--navy)]">{w.name}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AMENITIES ═══ */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--navy)]">
              World-Class Amenities
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {amenities.map((a, i) => (
              <motion.div
                key={a.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="h-16 w-16 rounded-2xl bg-[var(--sand)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-colors">
                  <a.icon className="h-7 w-7 text-[var(--ocean)] group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">{a.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI CONCIERGE PROMO ═══ */}
      <section className="bg-resort-dark py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-[var(--gold-light)] mb-6 border border-white/10">
              <Sparkles className="h-4 w-4" />
              Powered by AI
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Your Personal AI Concierge
            </h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto text-lg">
              Chat with our AI-powered concierge to find the perfect room,
              get personalized recommendations, and make bookings — all through
              natural conversation. Try the chat button in the corner.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/explore"
                className="rounded-full bg-[var(--gold)] px-8 py-3 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
              >
                Explore 3D Resort
              </Link>
              <Link
                href="/rooms"
                className="rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                Browse All Rooms
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[var(--navy)] py-12 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Waves className="h-5 w-5 text-[var(--gold)]" />
          <span className="text-white font-bold">Grand Meridian Resort</span>
        </div>
        <p className="text-sm text-white/50">
          © 2026 Grand Meridian Resort & Spa. All rights reserved.
        </p>
        <p className="text-xs text-white/30 mt-2">
          AI Concierge + 3D Booking Platform — Mini Project
        </p>
      </footer>
    </div>
  );
}
