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
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { fetchMembers, saveMember } from "@/lib/api";
import ImportMembersModal from "@/components/members/ImportMembersModal";
import EditMemberModal from "@/components/members/EditMemberModal";
import DeleteMemberModal from "@/components/members/DeleteMemberModal";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("gearScore");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await fetchMembers();
      setMembers(data);
      setError("");
    } catch (err) {
      console.error("Failed to load members:", err);
      setError(err.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
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
    try {
      const updatedStatus = !member.isActive;
      await saveMember({
        id: member.id,
        isActive: updatedStatus,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: updatedStatus } : m))
      );
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search
      const term = search.toLowerCase().trim();
      const matchNickname = member.nickname?.toLowerCase().includes(term);
      const matchClass = member.className?.toLowerCase().includes(term);
      const matchRole = member.role?.toLowerCase().includes(term);

      if (term && !matchNickname && !matchClass && !matchRole) {
        return false;
      }

      // Status
      if (statusFilter === "active") return member.isActive !== false;
      if (statusFilter === "inactive") return member.isActive === false;

      return true;
    });
  }, [members, search, statusFilter]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [filteredMembers, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedMembers.slice(start, start + pageSize);
  }, [sortedMembers, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Guild Members
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Total {members.length} registered guild members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <Upload className="size-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingMember({
                nickname: "",
                className: "",
                level: 60,
                gearScore: 700,
                role: "Member",
                isActive: true,
              })
            }
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-500"
          >
            <UserPlus className="size-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by player or class..."
            className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-red-600 focus:outline-none"
          >
            <option value="all">All Status ({members.length})</option>
            <option value="active">
              Active ({members.filter((m) => m.isActive !== false).length})
            </option>
            <option value="inactive">
              Inactive ({members.filter((m) => m.isActive === false).length})
            </option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-red-600 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-semibold">
              <tr>
                <th
                  onClick={() => handleSort("nickname")}
                  className="cursor-pointer px-4 py-3.5 hover:text-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Player</span>
                    {sortField === "nickname" && (
                      sortDirection === "asc" ? <ArrowUp className="size-3 text-red-600" /> : <ArrowDown className="size-3 text-red-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("className")}
                  className="cursor-pointer px-4 py-3.5 hover:text-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Class</span>
                    {sortField === "className" && (
                      sortDirection === "asc" ? <ArrowUp className="size-3 text-red-600" /> : <ArrowDown className="size-3 text-red-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("level")}
                  className="cursor-pointer px-4 py-3.5 hover:text-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Level</span>
                    {sortField === "level" && (
                      sortDirection === "asc" ? <ArrowUp className="size-3 text-red-600" /> : <ArrowDown className="size-3 text-red-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("gearScore")}
                  className="cursor-pointer px-4 py-3.5 hover:text-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Gear Score</span>
                    {sortField === "gearScore" && (
                      sortDirection === "asc" ? <ArrowUp className="size-3 text-red-600" /> : <ArrowDown className="size-3 text-red-600" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Loading members...
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No members match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr key={m.id} className="transition hover:bg-zinc-50/80">
                    <td className="px-4 py-3 font-bold text-zinc-900">
                      {m.nickname}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{m.className || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {m.level ? `Lv. ${m.level}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-900">
                      {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{m.role || "Member"}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(m)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          m.isActive !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            m.isActive !== false ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                        />
                        {m.isActive !== false ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMember(m)}
                          className="flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          title="Edit member"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMember(m)}
                          className="flex size-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Delete member"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-zinc-800">
              {sortedMembers.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-800">
              {Math.min(page * pageSize, sortedMembers.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-800">
              {sortedMembers.length}
            </span>{" "}
            members
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ImportMembersModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadMembers}
      />

      <EditMemberModal
        open={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={loadMembers}
      />

      <DeleteMemberModal
        open={Boolean(deletingMember)}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onSuccess={loadMembers}
      />
    </div>
  );
}
