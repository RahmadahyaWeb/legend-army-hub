"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  ExternalLink,
  Search,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import {
  fetchAdminValkyrieRegistrations,
  fetchAdminValkyrieRegistrationDetail,
  reviewValkyrieRegistration,
  deleteValkyrieRegistration,
} from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/ToastProvider";

const PAGE_SIZE_OPTIONS = [15, 30, 50];

/**
 * Admin Valkyrie Cup Registrations Management Page
 *
 * Why this exists:
 * The command interface for guild leadership to review, approve, or reject incoming
 * 8-player Valkyrie Cup tournament squads, audit player Discord tags, and provide rejection feedback.
 *
 * Tricky logic:
 * Real-time optimistic review states to prevent accidental duplicate approvals,
 * and seamless opening of full roster inspection modals with Discord contact information.
 *
 * @returns {JSX.Element} Rendered admin registrations management console
 */
export default function AdminValkyrieCupPage() {
  const { success, error: toastError } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    legendArmy1: 0,
    legendArmy2: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [guildFilter, setGuildFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedRoster, setSelectedRoster] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectId, setTargetRejectId] = useState(null);
  const [targetRejectTeamName, setTargetRejectTeamName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetchAdminValkyrieRegistrations({}, true);
      setRegistrations(res.registrations || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
      toastError("Load Error", "Failed to retrieve tournament registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      if (statusFilter !== "all" && reg.status !== statusFilter) {
        return false;
      }
      if (guildFilter !== "all" && reg.guild !== guildFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const teamMatch = (reg.teamName || "").toLowerCase().includes(query);
        const captainMatch = (reg.captain || "").toLowerCase().includes(query);
        const membersMatch = (reg.allNicknames || "")
          .toLowerCase()
          .includes(query);
        if (!teamMatch && !captainMatch && !membersMatch) {
          return false;
        }
      }
      return true;
    });
  }, [registrations, statusFilter, guildFilter, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRegistrations.length / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, page, pageSize]);

  // Open detail view for a registration
  const handleOpenDetail = async (reg) => {
    setSelectedReg(reg);
    setSelectedRoster([]);
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetchAdminValkyrieRegistrationDetail(reg.id);
      if (res.registration) {
        setSelectedReg(res.registration);
      }
      setSelectedRoster(res.roster || []);
    } catch (err) {
      console.error("Failed to load registration roster:", err);
      toastError("Roster Error", "Failed to load complete player details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Process approval
  const handleApprove = async (id, teamName) => {
    setActionLoading(true);
    try {
      const res = await reviewValkyrieRegistration(id, { action: "approve" });
      success(
        "Registration Approved",
        `Team "${teamName}" is now confirmed in the tournament bracket.`
      );

      // Update local state
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "approved",
                reviewedBy: res.registration?.reviewedBy || "Admin",
                reviewedAt: res.registration?.reviewedAt || new Date().toISOString(),
                rejectionReason: "",
              }
            : r
        )
      );

      if (selectedReg && selectedReg.id === id) {
        setSelectedReg((prev) => ({
          ...prev,
          status: "approved",
          reviewedBy: res.registration?.reviewedBy || "Admin",
          reviewedAt: res.registration?.reviewedAt || new Date().toISOString(),
          rejectionReason: "",
        }));
      }

      loadData(true);
    } catch (err) {
      console.error("Approve error:", err);
      toastError("Approval Failed", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject dialog
  const handleOpenRejectDialog = (id, teamName) => {
    setTargetRejectId(id);
    setTargetRejectTeamName(teamName);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  // Confirm rejection
  const handleConfirmReject = async () => {
    if (!targetRejectId) return;
    setActionLoading(true);

    try {
      const res = await reviewValkyrieRegistration(targetRejectId, {
        action: "reject",
        rejectionReason: rejectionReason.trim(),
      });

      success(
        "Registration Rejected",
        `Team "${targetRejectTeamName}" has been rejected.`
      );

      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === targetRejectId
            ? {
                ...r,
                status: "rejected",
                reviewedBy: res.registration?.reviewedBy || "Admin",
                reviewedAt: res.registration?.reviewedAt || new Date().toISOString(),
                rejectionReason: rejectionReason.trim(),
              }
            : r
        )
      );

      if (selectedReg && selectedReg.id === targetRejectId) {
        setSelectedReg((prev) => ({
          ...prev,
          status: "rejected",
          reviewedBy: res.registration?.reviewedBy || "Admin",
          reviewedAt: res.registration?.reviewedAt || new Date().toISOString(),
          rejectionReason: rejectionReason.trim(),
        }));
      }

      setRejectModalOpen(false);
      setTargetRejectId(null);
      loadData(true);
    } catch (err) {
      console.error("Reject error:", err);
      toastError("Rejection Failed", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete registration
  const handleDelete = async (id, teamName) => {
    if (
      !confirm(
        `Are you sure you want to delete the registration for "${teamName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteValkyrieRegistration(id);
      success("Registration Deleted", `"${teamName}" removed from records.`);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      if (selectedReg && selectedReg.id === id) {
        setDetailModalOpen(false);
      }
      loadData(true);
    } catch (err) {
      console.error("Delete error:", err);
      toastError("Delete Failed", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Valkyrie Cup Registrations
            </h1>
            <Badge variant="brand" size="sm">
              {summary.total} Registered
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Review and approve 8-player squad entries for the Valkyrie Cup tournament
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/valkyrie-cup/teams"
            target="_blank"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
          >
            <ExternalLink className="size-3.5" />
            <span>Public Directory</span>
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="p-4 bg-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
            Pending Review
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-600">
            {summary.pending}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Action required
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Approved
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600">
            {summary.approved}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Bracket confirmed
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
            Rejected
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-red-600">
            {summary.rejected}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            Denied submissions
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Guild Distribution
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-800 space-y-0.5">
            <div>LegendArmy1: <strong className="font-mono">{summary.legendArmy1}</strong></div>
            <div>LegendArmy2: <strong className="font-mono">{summary.legendArmy2}</strong></div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <Input
            icon={Search}
            placeholder="Search by team, captain, or player..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            containerClassName="w-full"
            className="!h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="!h-9 !py-0 text-xs font-medium"
          >
            <option value="all">All Status ({summary.total})</option>
            <option value="pending">Pending ({summary.pending})</option>
            <option value="approved">Approved ({summary.approved})</option>
            <option value="rejected">Rejected ({summary.rejected})</option>
          </Select>

          {/* Guild Filter */}
          <Select
            value={guildFilter}
            onChange={(e) => {
              setGuildFilter(e.target.value);
              setPage(1);
            }}
            className="!h-9 !py-0 text-xs font-medium"
          >
            <option value="all">All Guilds</option>
            <option value="LegendArmy1">LegendArmy1</option>
            <option value="LegendArmy2">LegendArmy2</option>
          </Select>

          {/* Page Size */}
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="!h-9 !py-0 text-xs font-medium"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* REGISTRATIONS TABLE */}
      {loading ? (
        <Loading message="Loading registrations..." />
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          title="No registrations found"
          description={
            search || statusFilter !== "all" || guildFilter !== "all"
              ? "No team registrations match your selected filter criteria."
              : "No team registrations have been submitted yet."
          }
        />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Guild</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead className="text-center">Players</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right w-44">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRegistrations.map((reg, index) => {
                const globalIndex = (page - 1) * pageSize + index + 1;
                const isApproved = reg.status === "approved";
                const isRejected = reg.status === "rejected";

                return (
                  <TableRow key={reg.id || globalIndex}>
                    <TableCell className="text-center font-mono text-zinc-400 text-xs font-semibold">
                      {globalIndex}
                    </TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(reg)}
                        className="font-bold text-zinc-900 text-xs sm:text-sm hover:underline text-left"
                      >
                        {reg.teamName}
                      </button>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={reg.guild === "LegendArmy1" ? "brand" : "info"}
                        size="xs"
                      >
                        {reg.guild}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-zinc-900 text-xs flex items-center gap-1">
                        <Crown className="size-3 text-amber-500 shrink-0" />
                        <span>{reg.captain}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-semibold text-zinc-700">
                      {reg.totalPlayers || 8} / 8
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500 font-mono">
                      <span className="truncate block max-w-[120px]" title={reg.userId}>
                        {reg.userId?.startsWith("usr_")
                          ? reg.userId.slice(0, 12) + "..."
                          : reg.userId || "Public"}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500">
                      {formatDate(reg.createdAt)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={
                          isApproved
                            ? "success"
                            : isRejected
                            ? "danger"
                            : "warning"
                        }
                        size="xs"
                        dot
                      >
                        {reg.status.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Detail Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(reg)}
                          className="flex size-7.5 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
                          title="View Registration Detail & Roster"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {/* Quick Approve Button */}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApprove(reg.id, reg.teamName)}
                            className="flex size-7.5 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="Approve Team"
                          >
                            <Check className="size-3.5" />
                          </button>
                        )}

                        {/* Quick Reject Button */}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenRejectDialog(reg.id, reg.teamName)
                            }
                            className="flex size-7.5 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 transition"
                            title="Reject Team"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(reg.id, reg.teamName)}
                          className="flex size-7.5 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Registration"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs shadow-2xs">
              <span className="text-zinc-500 font-medium">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredRegistrations.length)} of{" "}
                <strong className="text-zinc-900 font-bold">
                  {filteredRegistrations.length}
                </strong>{" "}
                registrations
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Prev
                </Button>

                <span className="px-2 font-bold font-mono text-zinc-700">
                  {page} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL WITH FULL ROSTER & DISCORD IDs */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedReg?.teamName || "Registration Detail"}
        description={`Guild: ${selectedReg?.guild || ""} · Submitted ${formatDate(selectedReg?.createdAt)}`}
        icon={Trophy}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedReg?.status === "approved"
                    ? "success"
                    : selectedReg?.status === "rejected"
                    ? "danger"
                    : "warning"
                }
                size="sm"
                dot
              >
                {selectedReg?.status?.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {selectedReg?.status !== "approved" && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  icon={CheckCircle2}
                  onClick={() =>
                    handleApprove(selectedReg.id, selectedReg.teamName)
                  }
                >
                  Approve Registration
                </Button>
              )}

              {selectedReg?.status !== "rejected" && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={actionLoading}
                  icon={XCircle}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  onClick={() =>
                    handleOpenRejectDialog(
                      selectedReg.id,
                      selectedReg.teamName
                    )
                  }
                >
                  Reject Registration
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        }
      >
        {selectedReg && (
          <div className="space-y-4 py-1 text-xs">
            {/* AUDIT / REVIEW INFO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div>
                <div className="text-[10px] uppercase font-semibold text-zinc-400">
                  Guild
                </div>
                <div className="font-bold text-zinc-900 mt-0.5">
                  {selectedReg.guild}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-zinc-400">
                  Submitted By
                </div>
                <div className="font-mono text-zinc-700 mt-0.5 truncate" title={selectedReg.userId}>
                  {selectedReg.userId || "Public"}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-zinc-400">
                  Reviewed By
                </div>
                <div className="font-semibold text-zinc-800 mt-0.5">
                  {selectedReg.reviewedBy || "Pending"}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-zinc-400">
                  Reviewed At
                </div>
                <div className="text-zinc-600 mt-0.5">
                  {selectedReg.reviewedAt
                    ? formatDate(selectedReg.reviewedAt)
                    : "—"}
                </div>
              </div>
            </div>

            {/* REJECTION REASON IF PRESENT */}
            {selectedReg.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                <span className="font-bold">Rejection Reason:</span>{" "}
                {selectedReg.rejectionReason}
              </div>
            )}

            {/* FULL ROSTER TABLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 text-xs">
                  Full Roster & Discord Tags
                </h4>
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedRoster.length} Players
                </span>
              </div>

              {detailLoading ? (
                <Loading message="Loading roster details..." />
              ) : (
                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Nickname</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Discord ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRoster.map((player, idx) => {
                        const isCaptain = player.role === "captain";

                        return (
                          <TableRow key={player.id || idx}>
                            <TableCell className="text-center font-mono text-zinc-400 text-xs font-semibold">
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                {isCaptain && (
                                  <Crown className="size-3 text-amber-500 shrink-0" />
                                )}
                                <span>{player.nickname}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {isCaptain ? (
                                <Badge variant="warning" size="xs">
                                  Captain
                                </Badge>
                              ) : (
                                <Badge variant="neutral" size="xs">
                                  Member
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="font-mono text-xs font-semibold text-zinc-800">
                              {player.discordId || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT CONFIRMATION MODAL */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject "${targetRejectTeamName}"`}
        description="Provide optional feedback or reason for rejecting this squad registration."
        icon={XCircle}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              loading={actionLoading}
              className="text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <label className="block text-xs font-medium text-zinc-700">
            Rejection Reason (Optional feedback to participant)
          </label>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Incomplete Discord tags, duplicate combatant in another squad, or ineligible guild affiliation."
            className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
          />
        </div>
      </Modal>
    </div>
  );
}
