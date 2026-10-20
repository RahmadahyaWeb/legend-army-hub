"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Flame,
  Gavel,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import {
  fetchAuctionBoard,
  fetchPublicAuctionSignups,
  submitAuctionSignup,
} from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Public Arena Bid & Guild Auction Hub
 *
 * Why this exists:
 * Provides a responsive, live public portal for guild members to browse
 * auction drops (MVP Cards, Royal Gear), view slot queues (1-10), inspect
 * Discord bid command syntax, and submit registration requests into the queue.
 *
 * Tricky logic:
 * Renders exactly 10 queue slots per item (padding with placeholder empty slots
 * if fewer than 10 are occupied), visually highlighting Slot #1 as the active crown
 * leading bidder, matching the reference behavior from army-lelang.pages.dev.
 *
 * @returns {JSX.Element} Rendered public auction page
 */
export default function PublicAuctionPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState({
    items: [],
    rules: [],
    winners: [],
    stats: { totalItems: 0, totalQueued: 0, totalSignups: 0 },
  });
  const [activeTab, setActiveTab] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [publicSignups, setPublicSignups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formNick, setFormNick] = useState("");
  const [formDiscord, setFormDiscord] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formLevel, setFormLevel] = useState("100");
  const [formQty, setFormQty] = useState(1);
  const [formErr, setFormErr] = useState("");

  // Copy helper feedback
  const [copiedCmd, setCopiedCmd] = useState(null);

  /**
   * Loads or refreshes the auction board and public signups feed.
   * @param {boolean} [silent=false]
   */
  const loadData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [board, signups] = await Promise.all([
        fetchAuctionBoard(true),
        fetchPublicAuctionSignups(15),
      ]);
      setBoardData(board);
      setPublicSignups(signups);
    } catch (err) {
      console.error("Auction load error:", err);
      if (!silent) toastError("Gagal memuat pembaruan arena bid.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 45 seconds when page is focused
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadData(true);
      }
    }, 45_000);

    return () => clearInterval(interval);
  }, []);

  // Filter items by category tab and search query
  const displayedItems = useMemo(() => {
    if (activeTab === "rules" || activeTab === "winners") return [];
    const items = boardData.items.filter((i) => i.category === activeTab);
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.hint && i.hint.toLowerCase().includes(q))
    );
  }, [boardData.items, activeTab, searchQuery]);

  // Counts for tabs
  const categoryCounts = useMemo(() => {
    const cardItems = boardData.items.filter((i) => i.category === "card");
    const gearItems = boardData.items.filter((i) => i.category === "gear");
    const cardQueued = cardItems.reduce((acc, i) => acc + (i.slots?.length || 0), 0);
    const gearQueued = gearItems.reduce((acc, i) => acc + (i.slots?.length || 0), 0);

    return {
      card: { items: cardItems.length, queued: cardQueued },
      gear: { items: gearItems.length, queued: gearQueued },
      winners: boardData.winners.length,
      rules: boardData.rules.length,
    };
  }, [boardData]);

  /**
   * Opens the Join Queue modal with preselected item.
   * @param {string} [itemTitle=""]
   */
  const openJoinModal = (itemTitle = "") => {
    setFormNick("");
    setFormDiscord("");
    const defaultItem = itemTitle || boardData.items[0]?.title || "";
    setFormItem(defaultItem);
    setFormLevel("100");
    setFormQty(1);
    setFormErr("");
    setModalOpen(true);
  };

  /**
   * Submits member's join queue request to the server.
   * @param {React.FormEvent} e
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErr("");

    const activeItem = formItem || boardData.items[0]?.title;

    if (!formNick.trim() || formNick.trim().length < 2) {
      setFormErr("In-game Name wajib diisi (minimal 2 huruf).");
      return;
    }

    if (!formDiscord.trim() || formDiscord.trim().length < 2) {
      setFormErr("Discord Name wajib diisi agar pengurus dapat mention giliran Anda.");
      return;
    }

    if (!activeItem) {
      setFormErr("Silakan pilih item yang ingin dibid.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedObj = boardData.items.find((i) => i.title === activeItem);
      await submitAuctionSignup({
        nickname: formNick.trim(),
        discordTag: formDiscord.trim(),
        itemTitle: activeItem,
        itemId: selectedObj?.id || null,
        level: parseInt(formLevel, 10) || 100,
        quantity: Math.max(1, parseInt(formQty, 10) || 1),
      });

      setModalOpen(false);
      success(
        "Pendaftaran Terkirim!",
        `${formNick} → ${activeItem}. Menunggu konfirmasi admin.`
      );
      loadData(true);
    } catch (err) {
      setFormErr(err.message || "Gagal mengirim pendaftaran.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Copies discord command syntax to clipboard.
   * @param {string} cmd
   */
  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  if (loading) {
    return <Loading fullScreen message="Memuat Arena Bid & Antrian Guild..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b-2 border-zinc-950 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-900 bg-brand-600 shadow-[1.5px_1.5px_0px_#18181b]">
                <img
                  src="/logo.png"
                  alt="Legend Army"
                  className="size-7 object-contain"
                />
              </div>
              <div>
                <span className="font-sans text-xs font-black tracking-wider text-zinc-950 block leading-tight uppercase">
                  LEGEND ARMY
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 block leading-tight">
                  Arena Bid
                </span>
              </div>
            </Link>

            {/* Live Indicator Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 rounded-full">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE GUILD QUEUE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              onClick={() => loadData(false)}
              disabled={refreshing}
              className={refreshing ? "opacity-50" : ""}
            >
              {refreshing ? "Memuat..." : "Refresh"}
            </Button>

            <Link href="/valkyrie-cup">
              <Button
                variant="secondary"
                size="xs"
                icon={Trophy}
                className="!border-amber-600 !bg-amber-50 !text-amber-950"
              >
                Valkyrie Cup
              </Button>
            </Link>

            <Link href="/admin/lelang">
              <Button variant="outline" size="xs" icon={Gavel}>
                Admin Lelang
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="border-b-2 border-zinc-950 bg-white comic-dots-bg relative">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 border-2 border-amber-600 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-950 mb-3 shadow-[1.5px_1.5px_0px_#d97706]">
                <Gavel className="size-3.5 text-amber-600 shrink-0" />
                <span>Arena Lelang & Antrian Bidding Item Drop</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-sans tracking-tight text-zinc-950 leading-tight">
                ⚔ ARENA BID — LIVE QUEUE
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-600 font-medium leading-relaxed">
                Antrian resmi lelang item guild Legend Army. Pilih slot item drop, daftar antrian langsung dari web, dan eksekusi bidding di Discord channel{" "}
                <span className="font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 border border-brand-200 rounded">
                  #info-bid-mingguan
                </span>.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="md"
                icon={Flame}
                onClick={() => openJoinModal()}
                className="!bg-brand-600 !text-white hover:!bg-brand-700 shadow-[3px_3px_0px_#18181b]"
              >
                + JOIN BID QUEUE
              </Button>
            </div>
          </div>

          {/* TELEMETRY STATS */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl">
            <div className="border-2 border-zinc-950 bg-white p-3 sm:p-4 shadow-[2px_2px_0px_#18181b]">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  ITEMS
                </span>
                <Coins className="size-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-950">
                {boardData.stats.totalItems || 0}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Card & Gear aktif</span>
            </div>

            <div className="border-2 border-zinc-950 bg-white p-3 sm:p-4 shadow-[2px_2px_0px_#18181b]">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  QUEUED
                </span>
                <Users className="size-4 text-brand-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-brand-700">
                {boardData.stats.totalQueued || 0}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Pemain mengantri</span>
            </div>

            <div className="border-2 border-zinc-950 bg-white p-3 sm:p-4 shadow-[2px_2px_0px_#18181b]">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  SIGNUPS
                </span>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                {boardData.stats.totalSignups || 0}
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Total pendaftaran web</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        {/* TABS NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("card")}
              className={`flex items-center gap-2 border-2 border-zinc-950 px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-transform ${
                activeTab === "card"
                  ? "bg-brand-600 text-white shadow-[2px_2px_0px_#18181b] -translate-y-0.5"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_#18181b]"
              }`}
            >
              <span>🃏 CARD</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                activeTab === "card"
                  ? "bg-brand-700 border-brand-500 text-white"
                  : "bg-zinc-100 border-zinc-300 text-zinc-700"
              }`}>
                {categoryCounts.card.items} item · {categoryCounts.card.queued} q
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gear")}
              className={`flex items-center gap-2 border-2 border-zinc-950 px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-transform ${
                activeTab === "gear"
                  ? "bg-brand-600 text-white shadow-[2px_2px_0px_#18181b] -translate-y-0.5"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_#18181b]"
              }`}
            >
              <span>💍 GEAR</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                activeTab === "gear"
                  ? "bg-brand-700 border-brand-500 text-white"
                  : "bg-zinc-100 border-zinc-300 text-zinc-700"
              }`}>
                {categoryCounts.gear.items} item · {categoryCounts.gear.queued} q
              </span>
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={`flex items-center gap-2 border-2 border-zinc-950 px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-transform ${
                activeTab === "rules"
                  ? "bg-brand-600 text-white shadow-[2px_2px_0px_#18181b] -translate-y-0.5"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_#18181b]"
              }`}
            >
              <span>📜 BID RULES</span>
            </button>

            <button
              onClick={() => setActiveTab("winners")}
              className={`flex items-center gap-2 border-2 border-zinc-950 px-4 py-2 text-xs sm:text-sm font-bold uppercase transition-transform ${
                activeTab === "winners"
                  ? "bg-amber-400 text-amber-950 shadow-[2px_2px_0px_#18181b] -translate-y-0.5"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_#18181b]"
              }`}
            >
              <span>🏆 WINNERS</span>
              {categoryCounts.winners > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-amber-200 border-amber-600 text-amber-950">
                  {categoryCounts.winners}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar for Card & Gear */}
          {(activeTab === "card" || activeTab === "gear") && (
            <div className="w-full sm:w-64">
              <Input
                placeholder="Cari item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* TAB CONTENT: CARD & GEAR CATALOG */}
        {(activeTab === "card" || activeTab === "gear") && (
          <div className="mt-6">
            {displayedItems.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="Tidak Ada Item Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada item yang cocok dengan "${searchQuery}".`
                    : "Katalog item belum memiliki daftar aktif."
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item) => {
                  const filledSlots = item.slots || [];
                  const MIN_SLOTS = 10;
                  // Prepare array of 10 slots
                  const rows = [];
                  for (let i = 1; i <= MIN_SLOTS; i++) {
                    const match = filledSlots.find((s) => s.slot_number === i);
                    rows.push(match || { slot_number: i, nickname: "", is_empty: true });
                  }

                  const fillPercentage = Math.min(
                    100,
                    Math.round((filledSlots.length / MIN_SLOTS) * 100)
                  );

                  return (
                    <div
                      key={item.id}
                      className="border-2 border-zinc-950 bg-white flex flex-col justify-between shadow-[2.5px_2.5px_0px_#18181b] hover:shadow-[3.5px_3.5px_0px_#18181b] transition-shadow rounded-none"
                    >
                      {/* CARD HEADER */}
                      <div className="border-b-2 border-zinc-950 p-3.5 bg-zinc-50 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-11 shrink-0 border-2 border-zinc-950 bg-amber-100 flex items-center justify-center font-bold text-xl shadow-[1.5px_1.5px_0px_#18181b]">
                            {item.category === "card" ? "🃏" : "💍"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-sans text-sm font-black text-zinc-950 truncate leading-snug">
                              {item.title}
                            </h3>
                            {item.hint && (
                              <p className="text-[11px] font-mono text-zinc-500 truncate">
                                {item.hint}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="shrink-0 border border-zinc-950 bg-brand-50 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-700">
                          {filledSlots.length} queued
                        </span>
                      </div>

                      {/* QUEUE SLOTS CONTAINER */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                          {rows.map((row) => {
                            const isFilled = Boolean(row.nickname);
                            const isFirst = row.slot_number === 1 && isFilled;

                            return (
                              <div
                                key={row.slot_number}
                                className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors ${
                                  isFirst
                                    ? "bg-amber-100 border border-amber-500 font-bold text-amber-950 shadow-[1px_1px_0px_#d97706]"
                                    : isFilled
                                    ? "bg-zinc-100 border border-zinc-300 text-zinc-900"
                                    : "bg-zinc-50/60 border border-dashed border-zinc-200 text-zinc-400"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`size-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                      isFirst
                                        ? "bg-amber-500 text-zinc-950"
                                        : isFilled
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-200 text-zinc-500"
                                    }`}
                                  >
                                    {isFirst ? "👑" : row.slot_number}
                                  </span>

                                  <span className="truncate font-medium">
                                    {isFilled ? row.nickname : "Slot Kosong"}
                                  </span>

                                  {isFilled && row.level && (
                                    <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1 rounded">
                                      Lv {row.level}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] font-mono text-zinc-500 shrink-0">
                                  {isFilled ? (
                                    <span className="text-zinc-600 font-semibold">{row.note || "Antri"}</span>
                                  ) : (
                                    <span className="italic">Ready</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="mt-3 pt-2 border-t border-zinc-200">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                            <span>Kapasitas Antrian</span>
                            <span>{fillPercentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-200 border border-zinc-400 overflow-hidden">
                            <div
                              className="h-full bg-brand-600 pixel-bar-pattern transition-all duration-300"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* JOIN BUTTON */}
                        <div className="mt-3">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full !bg-zinc-900 !text-white hover:!bg-brand-600 transition-colors"
                            onClick={() => openJoinModal(item.title)}
                          >
                            + JOIN QUEUE
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: BID RULES & DISCORD PROCEDURES */}
        {activeTab === "rules" && (
          <div className="mt-6 space-y-6">
            {/* Quick Command Reference Cards */}
            <div className="border-2 border-zinc-950 bg-amber-50 p-4 sm:p-5 shadow-[2.5px_2.5px_0px_#18181b]">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="size-4 text-amber-700" />
                <h3 className="font-bold text-sm sm:text-base text-amber-950 uppercase font-sans">
                  Format Perintah Bidding Discord (#info-bid-mingguan)
                </h3>
              </div>
              <p className="text-xs text-amber-900 mb-4 leading-relaxed">
                Salin format perintah berikut saat sesi lelang mingguan guild diumumkan di Discord. Klik perintah untuk menyalin teks secara otomatis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { cmd: "MauBid-[Nama Item]", desc: "Maju mengambil giliran bid item" },
                  { cmd: "CancelBid-[Nama Item]", desc: "Membatalkan diri dari antrian" },
                  { cmd: "SkipBid-[Nama Item]", desc: "Melewati giliran tanpa keluar antrian" },
                  { cmd: "DoneBid-[Nama Item]", desc: "Konfirmasi item telah berhasil diambil" },
                ].map(({ cmd, desc }) => (
                  <button
                    key={cmd}
                    onClick={() => copyCommand(cmd)}
                    className="flex flex-col text-left p-2.5 border-2 border-zinc-950 bg-white hover:bg-zinc-100 shadow-[1.5px_1.5px_0px_#18181b] active:translate-y-0.5 transition-all relative group"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-mono text-xs font-bold text-brand-700">
                        {cmd}
                      </span>
                      {copiedCmd === cmd ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3 text-zinc-400 group-hover:text-zinc-700" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Structured Rules Details */}
            <div className="space-y-4">
              {boardData.rules.map((rule, idx) => {
                const parseRuleLines = () => {
                  try {
                    return Array.isArray(rule.lines)
                      ? rule.lines
                      : JSON.parse(rule.lines || "[]");
                  } catch {
                    return [rule.lines];
                  }
                };
                const linesArr = parseRuleLines();

                return (
                  <details
                    key={rule.id}
                    open={idx === 0}
                    className="border-2 border-zinc-950 bg-white shadow-[2px_2px_0px_#18181b] group"
                  >
                    <summary className="cursor-pointer p-4 font-bold text-sm sm:text-base text-zinc-950 flex items-center justify-between select-none bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-brand-700 font-black">
                          {idx + 1}.
                        </span>
                        <span>{rule.title}</span>
                      </div>
                      <span className="text-zinc-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="p-4 border-t-2 border-zinc-950 space-y-2 text-xs sm:text-sm text-zinc-700 leading-relaxed bg-white">
                      {linesArr.map((line, lIdx) => (
                        <p key={lIdx} className="flex items-start gap-2">
                          <span className="text-brand-600 font-bold shrink-0">•</span>
                          <span>{line}</span>
                        </p>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: AUCTION WINNERS */}
        {activeTab === "winners" && (
          <div className="mt-6">
            {boardData.winners.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Belum Ada Catatan Pemenang"
                description="Catatan pemenang lelang akan tampil di sini setelah transaksi selesai diverifikasi oleh admin."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boardData.winners.map((winner) => (
                  <div
                    key={winner.id}
                    className="border-2 border-zinc-950 bg-white p-4 shadow-[2px_2px_0px_#18181b] flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-10 rounded border-2 border-amber-600 bg-amber-100 flex items-center justify-center text-xl shrink-0 shadow-[1px_1px_0px_#d97706]">
                        👑
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          WINNER
                        </span>
                        <h4 className="font-black text-sm text-zinc-950 truncate">
                          {winner.nickname}
                        </h4>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200 pt-2.5 mt-1 space-y-1">
                      <div className="text-xs font-bold text-zinc-800 truncate">
                        {winner.item_title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{formatDate(winner.won_at)}</span>
                        {winner.note && <span className="text-amber-700">{winner.note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PUBLIC WEB SIGNUPS ACTIVITY FEED */}
        <div className="mt-12 border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-[2.5px_2.5px_0px_#18181b]">
          <div className="flex items-center justify-between mb-3 border-b-2 border-zinc-950 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-brand-600" />
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 uppercase font-sans">
                Aktivitas Pendaftaran Web Terakhir
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 font-semibold">
              Live feed
            </span>
          </div>

          {publicSignups.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 italic">
              Belum ada pendaftaran antrian terbaru. Jadilah yang pertama mendaftar! ⚔
            </p>
          ) : (
            <div className="divide-y divide-zinc-200">
              {publicSignups.map((reg) => (
                <div
                  key={reg.id}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                        reg.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                          : reg.status === "rejected"
                          ? "bg-red-100 text-red-800 border-red-500"
                          : "bg-amber-100 text-amber-800 border-amber-500"
                      }`}
                    >
                      {reg.status === "approved"
                        ? "✔ QUEUED"
                        : reg.status === "rejected"
                        ? "✗ DITOLAK"
                        : "⏳ PENDING"}
                    </span>

                    <span className="font-bold text-zinc-950 truncate">
                      {reg.nickname}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <span className="font-semibold text-brand-700 truncate">
                      {reg.item_title}
                    </span>
                    {reg.quantity > 1 && (
                      <span className="font-mono text-zinc-500 text-[10px]">
                        ({reg.quantity}x)
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400">
                    {formatDate(reg.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: JOIN BID QUEUE */}
      <Modal
        open={modalOpen}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="⚔ JOIN BID QUEUE"
        description="Daftarkan diri Anda ke dalam antrian lelang item. Setelah disetujui admin, nama Anda akan langsung mengisi slot antrian berikutnya."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          {formErr && (
            <div className="p-3 border-2 border-red-500 bg-red-50 text-red-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <span>{formErr}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              PILIH ITEM LELANG <span className="text-red-500">*</span>
            </label>
            <Select
              value={formItem}
              onChange={(e) => setFormItem(e.target.value)}
              required
            >
              {boardData.items.length === 0 && (
                <option value="">Memuat item...</option>
              )}
              <optgroup label="🃏 CARD DROP">
                {boardData.items
                  .filter((i) => i.category === "card")
                  .map((i) => (
                    <option key={i.id} value={i.title}>
                      {i.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="💍 ROYAL GEAR">
                {boardData.items
                  .filter((i) => i.category === "gear")
                  .map((i) => (
                    <option key={i.id} value={i.title}>
                      {i.title}
                    </option>
                  ))}
              </optgroup>
              {boardData.items.filter((i) => i.category !== "card" && i.category !== "gear").length > 0 && (
                <optgroup label="🔮 ITEM LAINNYA">
                  {boardData.items
                    .filter((i) => i.category !== "card" && i.category !== "gear")
                    .map((i) => (
                      <option key={i.id} value={i.title}>
                        {i.title}
                      </option>
                    ))}
                </optgroup>
              )}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              IN-GAME NAME (IGN) <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: ValkyraBeast"
              value={formNick}
              onChange={(e) => setFormNick(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                ITEM LEVEL
              </label>
              <Select
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
              >
                <option value="80">Level 80</option>
                <option value="90">Level 90</option>
                <option value="100">Level 100</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                QUANTITY / SLOT
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              DISCORD USERNAME <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: valkyra.beast"
              value={formDiscord}
              onChange={(e) => setFormDiscord(e.target.value)}
              maxLength={40}
              required
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Wajib diisi agar admin & officer dapat mention saat giliran Anda tiba.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Check}
              disabled={submitting}
              className="!bg-brand-600 hover:!bg-brand-700 text-white"
            >
              {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* FOOTER */}
      <footer className="border-t-2 border-zinc-950 bg-white py-6 text-center text-xs text-zinc-500 font-mono">
        <p className="max-w-xl mx-auto leading-relaxed px-4">
          ⚔ LEGEND ARMY — Live Guild Auction Hub & Queue Arena.<br />
          Data otomatis diperbarui setelah persetujuan admin guild. Rekap mingguan tetap berlangsung di Discord #info-bid-mingguan.
        </p>
      </footer>
    </div>
  );
}
