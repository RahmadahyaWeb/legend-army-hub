"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Coins,
  Crown,
  Edit2,
  ExternalLink,
  Flame,
  Gavel,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  fetchAdminAuctionData,
  reviewAuctionSignup,
  deleteAuctionSignup,
  saveAuctionSlot,
  deleteAuctionSlot,
  saveAuctionItem,
  deleteAuctionItem,
  saveAuctionWinner,
  deleteAuctionWinner,
} from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Admin Arena Bid Management Command Console
 *
 * Why this exists:
 * Equips guild officers and administrators with complete oversight over auction
 * catalog items, slot assignments, registration approvals, and winning logs.
 *
 * Tricky logic:
 * When marking a slot as a winner, the admin can choose whether to automatically
 * shift all remaining queue slots up by 1 position to advance the queue line.
 *
 * @returns {JSX.Element} Rendered admin auction dashboard
 */
export default function AdminAuctionPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    items: [],
    signups: [],
    winners: [],
    summary: {
      pendingSignups: 0,
      approvedSignups: 0,
      rejectedSignups: 0,
      totalSignups: 0,
      totalActiveItems: 0,
      totalQueuedSlots: 0,
      totalWinners: 0,
    },
  });

  const [activeTab, setActiveTab] = useState("signups"); // 'signups' | 'items' | 'winners'
  const [signupStatusFilter, setSignupStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- MODALS ---
  // 1. Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [targetSignup, setTargetSignup] = useState(null);
  const [reviewAction, setReviewAction] = useState("approve");
  const [designatedSlot, setDesignatedSlot] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 2. Item Edit/Create Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    title: "",
    category: "card",
    hint: "",
    sortOrder: 0,
    isActive: true,
  });

  // 3. Slot Edit/Add Modal
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [targetItemId, setTargetItemId] = useState("");
  const [slotForm, setSlotForm] = useState({
    slotNumber: 1,
    nickname: "",
    discordTag: "",
    level: 100,
    note: "",
  });

  // 4. Winner Logging Modal
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerForm, setWinnerForm] = useState({
    itemId: "",
    itemTitle: "",
    nickname: "",
    note: "Guild Auction Session",
    vacateSlotNumber: "",
  });

  /**
   * Refreshes admin dataset from API.
   * @param {boolean} [silent=false]
   */
  const loadData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetchAdminAuctionData({
        status: signupStatusFilter,
        search: searchQuery,
      });
      setData(res);
    } catch (err) {
      console.error("Admin auction load error:", err);
      toastError("Failed to load auction data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [signupStatusFilter, searchQuery]);

  // Handle Review (Approve / Reject)
  const handleOpenReview = (signup, action) => {
    setTargetSignup(signup);
    setReviewAction(action);
    setDesignatedSlot("");
    setAdminNotes("");
    setReviewModalOpen(true);
  };

  const handleExecuteReview = async (e) => {
    e.preventDefault();
    if (!targetSignup) return;
    setActionLoading(true);
    try {
      await reviewAuctionSignup({
        signupId: targetSignup.id,
        action: reviewAction,
        adminNotes,
        designatedSlot: designatedSlot ? parseInt(designatedSlot, 10) : undefined,
      });

      setReviewModalOpen(false);
      success(
        reviewAction === "approve"
          ? `Registration for "${targetSignup.nickname}" approved successfully!`
          : `Registration for "${targetSignup.nickname}" rejected.`
      );
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to process review.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Signup
  const handleDeleteSignup = async (id, nick) => {
    if (!confirm(`Delete registration for "${nick}"?`)) return;
    try {
      await deleteAuctionSignup(id);
      success("Registration deleted successfully.");
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to delete registration.");
    }
  };

  // Item Create / Edit
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        title: item.title,
        category: item.category,
        hint: item.hint || "",
        sortOrder: item.sort_order || 0,
        isActive: Boolean(item.is_active),
      });
    } else {
      setEditingItem(null);
      setItemForm({
        title: "",
        category: "card",
        hint: "",
        sortOrder: 0,
        isActive: true,
      });
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await saveAuctionItem({
        id: editingItem?.id,
        ...itemForm,
      });
      setItemModalOpen(false);
      success(`Item "${itemForm.title}" saved successfully.`);
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to save item.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (id, title) => {
    if (!confirm(`Delete item "${title}" and all its queue slots?`)) return;
    try {
      await deleteAuctionItem(id);
      success(`Item "${title}" deleted successfully.`);
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to delete item.");
    }
  };

  // Slot Management
  const handleOpenSlotModal = (itemId, slotNumber = 1, currentSlot = null) => {
    setTargetItemId(itemId);
    if (currentSlot) {
      setSlotForm({
        slotNumber: currentSlot.slot_number,
        nickname: currentSlot.nickname,
        discordTag: currentSlot.discord_tag || "",
        level: currentSlot.level || 100,
        note: currentSlot.note || "",
      });
    } else {
      setSlotForm({
        slotNumber,
        nickname: "",
        discordTag: "",
        level: 100,
        note: "",
      });
    }
    setSlotModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await saveAuctionSlot({
        itemId: targetItemId,
        ...slotForm,
      });
      setSlotModalOpen(false);
      success(`Slot #${slotForm.slotNumber} updated successfully.`);
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to save slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (itemId, slotNumber, nick) => {
    if (!confirm(`Vacate Slot #${slotNumber} (${nick})?`)) return;
    try {
      await deleteAuctionSlot({ itemId, slotNumber });
      success(`Slot #${slotNumber} vacated successfully.`);
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to vacate slot.");
    }
  };

  // Mark as Winner
  const handleOpenWinnerFromSlot = (item, slot) => {
    setWinnerForm({
      itemId: item.id,
      itemTitle: item.title,
      nickname: slot.nickname,
      note: "Auction Winner",
      vacateSlotNumber: String(slot.slot_number),
    });
    setWinnerModalOpen(true);
  };

  const handleSaveWinner = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await saveAuctionWinner(winnerForm);
      setWinnerModalOpen(false);
      success(`Winner "${winnerForm.nickname}" recorded successfully!`);
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to record winner.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWinner = async (id, nick) => {
    if (!confirm(`Delete winner record for "${nick}"?`)) return;
    try {
      await deleteAuctionWinner(id);
      success("Winner record deleted successfully.");
      loadData(true);
    } catch (err) {
      toastError(err.message || "Failed to delete winner record.");
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading Auction Arena Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-zinc-950 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold uppercase text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5">
              Command Console
            </span>
            <Link
              href="/lelang"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-brand-600 font-mono"
            >
              <span>View Public Page</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans text-zinc-950 tracking-tight flex items-center gap-2">
            <Gavel className="size-7 text-brand-600" />
            <span>Auction Arena Management</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadData(false)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenItemModal()}
            className="!bg-brand-600 text-white hover:!bg-brand-700"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* SUMMARY TELEMETRY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-[2px_2px_0px_#18181b]">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase">
              Pending Approvals
            </span>
            <Flame className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {data.summary.pendingSignups}
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Awaiting admin review</span>
        </div>

        <div className="border-2 border-zinc-950 bg-white p-4 shadow-[2px_2px_0px_#18181b]">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase">
              Active Items
            </span>
            <Coins className="size-4 text-zinc-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-950">
            {data.summary.totalActiveItems}
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Listed in auction arena</span>
        </div>

        <div className="border-2 border-zinc-950 bg-white p-4 shadow-[2px_2px_0px_#18181b]">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase">
              Occupied Slots
            </span>
            <Users className="size-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-brand-700">
            {data.summary.totalQueuedSlots}
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Total queued players</span>
        </div>

        <div className="border-2 border-zinc-950 bg-white p-4 shadow-[2px_2px_0px_#18181b]">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase">
              Total Winners
            </span>
            <Trophy className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
            {data.summary.totalWinners}
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Auction distributions completed</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("signups")}
            className={`flex items-center gap-2 border-2 border-zinc-950 px-3.5 py-1.5 text-xs sm:text-sm font-bold uppercase ${
              activeTab === "signups"
                ? "bg-brand-600 text-white shadow-[2px_2px_0px_#18181b]"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <span>Registrations</span>
            {data.summary.pendingSignups > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] font-mono font-black px-1.5 py-0.2 rounded">
                {data.summary.pendingSignups}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 border-2 border-zinc-950 px-3.5 py-1.5 text-xs sm:text-sm font-bold uppercase ${
              activeTab === "items"
                ? "bg-brand-600 text-white shadow-[2px_2px_0px_#18181b]"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <span>Catalog & Queue Slots ({data.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("winners")}
            className={`flex items-center gap-2 border-2 border-zinc-950 px-3.5 py-1.5 text-xs sm:text-sm font-bold uppercase ${
              activeTab === "winners"
                ? "bg-amber-400 text-amber-950 shadow-[2px_2px_0px_#18181b]"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <span>Winners Log ({data.winners.length})</span>
          </button>
        </div>

        {/* Search for Signups or Items */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search player or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            size="sm"
          />
        </div>
      </div>

      {/* TAB 1: WEB SIGNUPS APPROVAL */}
      {activeTab === "signups" && (
        <div className="space-y-4">
          {/* Status Filter Badges */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All", count: data.summary.totalSignups },
              { id: "pending", label: "Pending", count: data.summary.pendingSignups },
              { id: "approved", label: "Approved", count: data.summary.approvedSignups },
              { id: "rejected", label: "Rejected", count: data.summary.rejectedSignups },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setSignupStatusFilter(id)}
                className={`border border-zinc-950 px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors ${
                  signupStatusFilter === id
                    ? "bg-zinc-900 text-white shadow-[1px_1px_0px_#18181b]"
                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="border-2 border-zinc-950 bg-white overflow-hidden shadow-[2.5px_2.5px_0px_#18181b]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Requested Item</TableHead>
                  <TableHead>Level / Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.signups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      No registrations match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.signups.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-bold text-zinc-950">{reg.nickname}</div>
                        <div className="font-mono text-[11px] text-zinc-500">
                          Discord: {reg.discord_tag}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-zinc-900">{reg.item_title}</div>
                        {reg.assigned_slot && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            Slot #{reg.assigned_slot}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-mono text-xs">
                          Lv {reg.level} · {reg.quantity}x
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                            reg.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                              : reg.status === "rejected"
                              ? "bg-red-100 text-red-800 border-red-500"
                              : "bg-amber-100 text-amber-800 border-amber-500"
                          }`}
                        >
                          {reg.status}
                        </span>
                        {reg.admin_notes && (
                          <div className="text-[10px] text-zinc-500 italic mt-0.5">
                            "{reg.admin_notes}"
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-zinc-500">
                        {formatDate(reg.created_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {reg.status === "pending" && (
                            <>
                              <Button
                                size="xs"
                                variant="primary"
                                icon={Check}
                                onClick={() => handleOpenReview(reg, "approve")}
                                className="!bg-emerald-600 hover:!bg-emerald-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                icon={X}
                                onClick={() => handleOpenReview(reg, "reject")}
                                className="!text-red-600 !border-red-600 hover:!bg-red-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => handleDeleteSignup(reg.id, reg.nickname)}
                            className="text-zinc-400 hover:text-red-600"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: ITEMS CATALOG & SLOTS MANAGER */}
      {activeTab === "items" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.items.map((item) => {
              const filledSlots = item.slots || [];
              const MIN_SLOTS = 10;
              const slots10 = [];
              for (let i = 1; i <= MIN_SLOTS; i++) {
                const match = filledSlots.find((s) => s.slot_number === i);
                slots10.push(match || { slot_number: i, is_empty: true });
              }

              return (
                <div
                  key={item.id}
                  className="border-2 border-zinc-950 bg-white shadow-[2.5px_2.5px_0px_#18181b] flex flex-col justify-between"
                >
                  {/* ITEM HEADER */}
                  <div className="border-b-2 border-zinc-950 p-3.5 bg-zinc-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded border border-zinc-950 bg-amber-100 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.category === "card" ? "🃏" : "💍"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-zinc-950 truncate">
                            {item.title}
                          </h3>
                          <span className="font-mono text-[9px] uppercase px-1.5 bg-zinc-200 text-zinc-700 font-bold border border-zinc-400">
                            {item.category}
                          </span>
                        </div>
                        {item.hint && (
                          <p className="text-[11px] font-mono text-zinc-500 truncate">
                            {item.hint}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Edit2}
                        onClick={() => handleOpenItemModal(item)}
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="text-zinc-400 hover:text-red-600"
                      />
                    </div>
                  </div>

                  {/* SLOTS LIST */}
                  <div className="p-3.5 space-y-1.5 max-h-[360px] overflow-y-auto">
                    {slots10.map((slot) => {
                      const isFilled = !slot.is_empty;
                      const isLeading = slot.slot_number === 1 && isFilled;

                      return (
                        <div
                          key={slot.slot_number}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded border transition-colors ${
                            isLeading
                              ? "bg-amber-100 border-amber-500 text-amber-950 font-bold"
                              : isFilled
                              ? "bg-zinc-100 border-zinc-300 text-zinc-900"
                              : "bg-zinc-50/50 border-dashed border-zinc-200 text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`size-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                isLeading
                                  ? "bg-amber-500 text-zinc-950"
                                  : isFilled
                                  ? "bg-zinc-900 text-white"
                                  : "bg-zinc-200 text-zinc-500"
                              }`}
                            >
                              {isLeading ? "👑" : slot.slot_number}
                            </span>

                            {isFilled ? (
                              <div className="min-w-0">
                                <span className="font-bold truncate block">
                                  {slot.nickname}
                                </span>
                                {slot.discord_tag && (
                                  <span className="text-[10px] font-mono text-zinc-500 block truncate">
                                    @{slot.discord_tag}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="italic text-zinc-400">Available Slot</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isFilled ? (
                              <>
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  icon={Crown}
                                  onClick={() => handleOpenWinnerFromSlot(item, slot)}
                                  className="!bg-amber-200 !text-amber-950 !border-amber-600 !p-1"
                                  title="Mark as Winner"
                                />
                                <Button
                                  size="xs"
                                  variant="outline"
                                  icon={Edit2}
                                  onClick={() =>
                                    handleOpenSlotModal(item.id, slot.slot_number, slot)
                                  }
                                  className="!p-1"
                                  title="Edit Slot"
                                />
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  icon={X}
                                  onClick={() =>
                                    handleDeleteSlot(item.id, slot.slot_number, slot.nickname)
                                  }
                                  className="!p-1 text-zinc-400 hover:text-red-600"
                                  title="Vacate Slot"
                                />
                              </>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                icon={UserPlus}
                                onClick={() => handleOpenSlotModal(item.id, slot.slot_number)}
                                className="!py-0.5 !px-2 text-[10px]"
                              >
                                + Fill
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM BUTTON */}
                  <div className="p-3 border-t border-zinc-200 bg-zinc-50">
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full font-mono text-[11px]"
                      onClick={() => handleOpenSlotModal(item.id, (filledSlots.length || 0) + 1)}
                    >
                      + Add Queue Slot Manually
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WINNERS LOG */}
      {activeTab === "winners" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setWinnerForm({
                  itemId: "",
                  itemTitle: "",
                  nickname: "",
                  note: "Guild Auction Session",
                  vacateSlotNumber: "",
                });
                setWinnerModalOpen(true);
              }}
              className="!bg-amber-500 hover:!bg-amber-600 text-zinc-950 font-bold"
            >
              + Record Winner Manually
            </Button>
          </div>

          <div className="border-2 border-zinc-950 bg-white overflow-hidden shadow-[2.5px_2.5px_0px_#18181b]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Item Won</TableHead>
                  <TableHead>Session Notes</TableHead>
                  <TableHead>Acquired Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.winners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No winners recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.winners.map((win) => (
                    <TableRow key={win.id}>
                      <TableCell className="font-bold text-zinc-950 flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{win.nickname}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-brand-700">
                        {win.item_title}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {win.note || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {formatDate(win.won_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => handleDeleteWinner(win.id, win.nickname)}
                          className="text-zinc-400 hover:text-red-600"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* REVIEW SIGNUP MODAL */}
      <Modal
        open={reviewModalOpen}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === "approve" ? "✔ Approve Registration" : "✗ Reject Registration"}
        description={`Confirm review action for registration by ${targetSignup?.nickname} (${targetSignup?.item_title}).`}
      >
        <form onSubmit={handleExecuteReview} className="space-y-4 pt-2">
          {reviewAction === "approve" && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Designated Slot Number (Optional)
              </label>
              <Input
                type="number"
                min={1}
                placeholder="Leave blank to automatically assign the next available slot"
                value={designatedSlot}
                onChange={(e) => setDesignatedSlot(e.target.value)}
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                If left blank, the system will automatically place the player in the next sequential slot.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Admin Notes (Optional)
            </label>
            <Input
              placeholder={reviewAction === "approve" ? "e.g., Priority Main Roster" : "Reason for rejection..."}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className={
                reviewAction === "approve"
                  ? "!bg-emerald-600 hover:!bg-emerald-700 text-white"
                  : "!bg-red-600 hover:!bg-red-700 text-white"
              }
            >
              {actionLoading
                ? "Processing..."
                : reviewAction === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ITEM CREATE/EDIT MODAL */}
      <Modal
        open={itemModalOpen}
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? "Edit Auction Item" : "Add New Auction Item"}
        description="Configure item title, category (Card / Gear / Relic), and search hints."
      >
        <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Orc Hero (Headwear)"
              value={itemForm.title}
              onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Category
              </label>
              <Select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              >
                <option value="card">🃏 Card</option>
                <option value="gear">💍 Gear</option>
                <option value="relic">🔮 Relic</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Sort Order
              </label>
              <Input
                type="number"
                value={itemForm.sortOrder}
                onChange={(e) =>
                  setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Search Hint / Description
            </label>
            <Input
              placeholder="e.g., MVP Card · Headwear / Accessory INT"
              value={itemForm.hint}
              onChange={(e) => setItemForm({ ...itemForm, hint: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className="!bg-brand-600 hover:!bg-brand-700 text-white"
            >
              {actionLoading ? "Saving..." : "Save Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SLOT EDIT/ADD MODAL */}
      <Modal
        open={slotModalOpen}
        isOpen={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title={`Manage Slot #${slotForm.slotNumber}`}
        description="Configure player name, Discord tag, level, and queue slot notes."
      >
        <form onSubmit={handleSaveSlot} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Slot Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={slotForm.slotNumber}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, slotNumber: parseInt(e.target.value, 10) || 1 })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Character Level
              </label>
              <Select
                value={String(slotForm.level)}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, level: parseInt(e.target.value, 10) || 100 })
                }
              >
                <option value="80">80</option>
                <option value="90">90</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Character Name (IGN) <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., ValkyraBeast"
              value={slotForm.nickname}
              onChange={(e) => setSlotForm({ ...slotForm, nickname: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Discord Tag
            </label>
            <Input
              placeholder="e.g., valkyra.beast"
              value={slotForm.discordTag}
              onChange={(e) => setSlotForm({ ...slotForm, discordTag: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Slot Notes (Optional)
            </label>
            <Input
              placeholder="e.g., Priority 1, Ready Zeny"
              value={slotForm.note}
              onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSlotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className="!bg-brand-600 hover:!bg-brand-700 text-white"
            >
              {actionLoading ? "Saving..." : "Save Slot"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* WINNER LOGGING MODAL */}
      <Modal
        open={winnerModalOpen}
        isOpen={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        title="👑 Record Auction Winner"
        description="Document player who successfully acquired this item in auction."
      >
        <form onSubmit={handleSaveWinner} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Item Won <span className="text-red-500">*</span>
            </label>
            <Input
              value={winnerForm.itemTitle}
              onChange={(e) => setWinnerForm({ ...winnerForm, itemTitle: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Winner Character Name (IGN) <span className="text-red-500">*</span>
            </label>
            <Input
              value={winnerForm.nickname}
              onChange={(e) => setWinnerForm({ ...winnerForm, nickname: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
              Session Notes / Source
            </label>
            <Input
              value={winnerForm.note}
              onChange={(e) => setWinnerForm({ ...winnerForm, note: e.target.value })}
              placeholder="e.g., Weekly Guild Raid, 45M Zeny"
            />
          </div>

          {winnerForm.vacateSlotNumber && (
            <div className="p-3 border-2 border-amber-500 bg-amber-50 text-amber-950 text-xs rounded">
              <span className="font-bold block mb-1">Automatic Queue Shift:</span>
              Slot #{winnerForm.vacateSlotNumber} will be vacated, and subsequent players will automatically advance up by 1 slot.
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWinnerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoading}
              className="!bg-amber-500 hover:!bg-amber-600 text-zinc-950 font-bold"
            >
              {actionLoading ? "Saving..." : "Record Winner"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
