"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Power,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { fetchMembers, saveMember } from "@/lib/api";
import { formatNumber } from "@/utils/formatters";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import ImportMembersModal from "@/components/members/ImportMembersModal";
import EditMemberModal from "@/components/members/EditMemberModal";
import DeleteMemberModal from "@/components/members/DeleteMemberModal";
import ResetMembersModal from "@/components/members/ResetMembersModal";
import { ClassBadge } from "@/utils/classColors";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/**
 * Guild Members Management Page
 *
 * Why this exists:
 * The single source of truth for all guild characters, power levels, gear scores,
 * roles, and attendance status. Enables CSV batch roster import, editing, and reset.
 */
export default function MembersPage() {
  const { success, error: toastError } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("gearScore");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  /**
   * Loads member list from the serverless Postgres API
   * @param {boolean} [silent=false]
   */
  const loadMembers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchMembers(silent);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members:", err);
      toastError("Failed to load members", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers(false);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleToggleActive = async (member) => {
    const updatedStatus = !member.isActive;
    // Optimistic toggle
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, isActive: updatedStatus } : m))
    );

    try {
      await saveMember({
        id: member.id,
        isActive: updatedStatus,
      });
      success(
        "Status updated",
        `${member.nickname} is now ${updatedStatus ? "Active" : "Inactive"}`
      );
      loadMembers(true);
    } catch (err) {
      console.error("Toggle active error:", err);
      toastError("Status update failed", err.message);
      loadMembers(true);
    }
  };

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const nickname = (member.nickname || "").toLowerCase();
        const className = (member.className || member.class || "").toLowerCase();
        const role = (member.role || "").toLowerCase();
        if (
          !nickname.includes(query) &&
          !className.includes(query) &&
          !role.includes(query)
        ) {
          return false;
        }
      }

      if (statusFilter === "active" && member.isActive === false) return false;
      if (statusFilter === "inactive" && member.isActive !== false) return false;

      return true;
    });
  }, [members, search, statusFilter]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "gearScore" || sortField === "level") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredMembers, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedMembers.slice(start, start + pageSize);
  }, [sortedMembers, page, pageSize]);

  const activeCount = members.filter((m) => m.isActive !== false).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Guild Members
            </h1>
            <Badge variant="brand" size="sm">
              {activeCount} Active / {members.length} Total
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage combat characters, job classes, and power levels for guild events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setResetModalOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            Reset
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => setImportModalOpen(true)}
          >
            Import CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() =>
              setEditingMember({
                nickname: "",
                level: 110,
                gearScore: 400000,
                className: "Paladin",
                role: "Member",
                isActive: true,
              })
            }
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <Input
            icon={Search}
            placeholder="Search nickname, class, or role..."
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
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="!h-9 !py-0 text-xs font-medium"
          >
            <option value="all">All Status ({members.length})</option>
            <option value="active">Active ({activeCount})</option>
            <option value="inactive">
              Inactive ({members.length - activeCount})
            </option>
          </Select>

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

      {/* MEMBERS TABLE */}
      {loading ? (
        <Loading message="Loading members..." />
      ) : sortedMembers.length === 0 ? (
        <EmptyState
          title="No members found"
          description={
            search || statusFilter !== "all"
              ? "No characters match your search filters."
              : "Import members via CSV or add a member to get started."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setImportModalOpen(true)}
            >
              Import Members
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead
                  onClick={() => handleSort("nickname")}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Character</span>
                    {sortField === "nickname" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-brand-600" />
                      ) : (
                        <ArrowDown className="size-3 text-brand-600" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-zinc-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("className")}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Class / Job</span>
                    {sortField === "className" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-brand-600" />
                      ) : (
                        <ArrowDown className="size-3 text-brand-600" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-zinc-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("level")}
                  className="cursor-pointer select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Level</span>
                    {sortField === "level" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-brand-600" />
                      ) : (
                        <ArrowDown className="size-3 text-brand-600" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-zinc-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("gearScore")}
                  className="cursor-pointer select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Gear Score</span>
                    {sortField === "gearScore" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-brand-600" />
                      ) : (
                        <ArrowDown className="size-3 text-brand-600" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-zinc-300" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.map((member, index) => {
                const globalIndex = (page - 1) * pageSize + index + 1;
                const isActive = member.isActive !== false;

                return (
                  <TableRow key={member.id || globalIndex}>
                    <TableCell className="text-center font-mono text-zinc-400 text-xs font-semibold">
                      {globalIndex}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                        {member.nickname}
                      </div>
                      {member.role && (
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-0.5">
                          {member.role}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <ClassBadge
                        className={member.className || member.class}
                        size="sm"
                      />
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs sm:text-sm font-semibold text-zinc-700">
                      {member.level ? `Lv. ${member.level}` : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs sm:text-sm font-bold text-zinc-900">
                      {member.gearScore > 0 ? formatNumber(member.gearScore) : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200"
                        }`}
                      >
                        <Power className="size-2.5" />
                        <span>{isActive ? "Active" : "Inactive"}</span>
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          className="flex size-7.5 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                          title="Edit member"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMember(member)}
                          className="flex size-7.5 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete member"
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
                {Math.min(page * pageSize, sortedMembers.length)} of{" "}
                <strong className="text-zinc-900 font-bold">
                  {sortedMembers.length}
                </strong>{" "}
                members
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

      {/* MODALS */}
      <ImportMembersModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          loadMembers(true);
          success("Import completed", "Member roster successfully imported.");
        }}
      />

      <EditMemberModal
        open={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={() => {
          loadMembers(true);
          success("Member saved", "Character data updated successfully.");
        }}
      />

      <DeleteMemberModal
        open={Boolean(deletingMember)}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onSuccess={() => {
          loadMembers(true);
          success("Member deleted", "Character removed from guild roster.");
        }}
      />

      <ResetMembersModal
        open={resetModalOpen}
        memberCount={members.length}
        onClose={() => setResetModalOpen(false)}
        onSuccess={() => {
          loadMembers(true);
          success("Roster reset", "All member records have been purged.");
        }}
      />
    </div>
  );
}
