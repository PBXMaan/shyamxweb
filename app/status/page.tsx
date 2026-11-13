"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  Server,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import type { BotStatus } from "@/types/api";

type StatusResponse = {
  ok: boolean;
  data?: BotStatus;
  status?: string;
  message?: string;
  checkedAt?: string;
};

function formatNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-IN") : "—";
}

function formatLatency(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? `${Math.round(number)} ms` : "—";
}

export default function StatusPage() {
  const [data, setData] = useState<BotStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const result = (await response.json()) as StatusResponse;
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.message || "The ShyamX status service is currently unavailable.");
      }
      setData(result.data);
      setError(null);
      setLastChecked(result.checkedAt ? new Date(result.checkedAt) : new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retrieve live status.");
      setLastChecked(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 30_000);
    return () => window.clearInterval(interval);
  }, [checkStatus]);

  const online = Boolean(data && !error);
  const metrics = useMemo(() => [
    { label: "Gateway latency", value: formatLatency(data?.latency), icon: Gauge, detail: "Reported by the bot API" },
    { label: "Discord servers", value: formatNumber(data?.guild_count), icon: Server, detail: "Connected guilds" },
    { label: "Users reached", value: formatNumber(data?.user_count), icon: Users, detail: "Across connected guilds" },
    { label: "Active shards", value: data?.shards == null ? "Not reported" : formatNumber(data.shards), icon: Activity, detail: "Shard count from the bot API" },
  ], [data]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-5 pb-20 pt-12 text-slate-200 sm:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[440px] w-[440px] rounded-full bg-red-500/[0.07] blur-[150px]" />
        <div className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-orange-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <nav className="mb-14 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-500/20">
              <Bot className="h-5 w-5 text-white" />
            </span>
            <span>
              <span className="block font-outfit text-lg font-black tracking-tight text-white">ShyamX</span>
              <span className="block text-[9px] font-black uppercase tracking-[0.24em] text-red-400">System status</span>
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-red-500/30 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </nav>

        <section className="mb-10 grid gap-8 lg:grid-cols-[1.4fr_.6fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
              <Activity className="h-3.5 w-3.5" /> Live service monitor
            </div>
            <h1 className="font-outfit text-5xl font-black tracking-tight text-white sm:text-6xl">System <span className="italic text-red-500">status.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Real-time availability and live metrics reported by the ShyamX bot API. Status refreshes automatically every 30 seconds.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 lg:flex-none">
              <Clock3 className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Last checked</p>
                <p className="truncate text-xs font-bold text-slate-200">{lastChecked ? lastChecked.toLocaleTimeString() : "Checking…"}</p>
              </div>
            </div>
            <button onClick={() => void checkStatus(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-300 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing" : "Refresh now"}
            </button>
          </div>
        </section>

        <section className={`mb-7 overflow-hidden rounded-[30px] border p-6 shadow-2xl sm:p-8 ${online ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.09] via-slate-900/70 to-slate-900/70" : "border-red-500/20 bg-gradient-to-r from-red-500/[0.09] via-slate-900/70 to-slate-900/70"}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${online ? "border-emerald-400/20 bg-emerald-400/10" : "border-red-400/20 bg-red-400/10"}`}>
                {loading ? <RefreshCw className="h-6 w-6 animate-spin text-slate-300" /> : online ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> : <XCircle className="h-7 w-7 text-red-400" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">ShyamX bot</p>
                <h2 className="mt-1 font-outfit text-2xl font-black text-white">{loading ? "Checking services…" : online ? "All monitored checks operational" : "Service disruption detected"}</h2>
                <p className="mt-1 text-xs text-slate-400">{loading ? "Connecting to the live bot status endpoint." : online ? `Connected as ${data?.user || "ShyamX"}` : error}</p>
              </div>
            </div>
            <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300"}`}>
              <span className={`h-2 w-2 rounded-full ${online ? "animate-pulse bg-emerald-400" : "bg-red-400"}`} />
              {loading ? "Checking" : online ? "Operational" : "Offline / Unreachable"}
            </div>
          </div>
          {!loading && !online && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/15 bg-red-500/[0.06] p-4 text-xs leading-6 text-red-200/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error || "The status endpoint did not return a healthy response."} The monitor will retry automatically.</p>
            </div>
          )}
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="group rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-red-500/25 hover:bg-white/[0.04]">
              <div className="mb-7 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{metric.label}</span>
                <span className="rounded-xl border border-red-500/15 bg-red-500/[0.07] p-2.5 text-red-400"><metric.icon className="h-4 w-4" /></span>
              </div>
              <p className="font-outfit text-3xl font-black tracking-tight text-white">{loading ? "…" : metric.value}</p>
              <p className="mt-2 text-[10px] font-medium text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-xl border border-red-500/15 bg-red-500/[0.07] p-2.5 text-red-400"><Wifi className="h-4 w-4" /></span>
              <div>
                <h3 className="font-outfit text-lg font-bold text-white">Live service checks</h3>
                <p className="text-xs text-slate-500">Based on the latest successful bot status response</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <div><p className="text-sm font-bold text-slate-200">Bot status endpoint</p><p className="mt-1 text-[10px] text-slate-500">GET /api/v1/bot/status</p></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${online ? "text-emerald-400" : "text-red-400"}`}>{loading ? "Checking" : online ? "Reachable" : "Unreachable"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <div><p className="text-sm font-bold text-slate-200">Discord bot session</p><p className="mt-1 text-[10px] text-slate-500">Reported by the bot process</p></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${online ? "text-emerald-400" : "text-red-400"}`}>{loading ? "Checking" : online ? "Online" : "Unavailable"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-gradient-to-br from-red-500/[0.07] to-white/[0.015] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3"><span className="rounded-xl border border-red-500/15 bg-red-500/[0.07] p-2.5 text-red-400"><Activity className="h-4 w-4" /></span><h3 className="font-outfit text-lg font-bold text-white">Monitoring details</h3></div>
            <ul className="space-y-3 text-xs leading-6 text-slate-400">
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" /> Status is checked when this page opens and every 30 seconds afterward.</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" /> Use Refresh now to request an immediate live check.</li>
              <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" /> Historical uptime and incident timelines are not shown because no history feed is configured in this dashboard API.</li>
            </ul>
            <div className="mt-7 border-t border-white/[0.07] pt-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Need help?</p><Link href="/docs" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-red-300 transition hover:text-red-200">Visit ShyamX documentation <span aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 sm:flex-row">
          <span>© {new Date().getFullYear()} ShyamX · Live system status</span>
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Auto-refresh: 30 seconds</span>
        </footer>
      </div>
    </main>
  );
}
