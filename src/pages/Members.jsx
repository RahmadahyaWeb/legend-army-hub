import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Power,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

import { db } from "../lib/firebase";
import ImportMembersModal from "../components/members/ImportMembersModal";
import EditMemberModal from "../components/members/EditMemberModal";
import DeleteMemberModal from "../components/members/DeleteMemberModal";
import { useToast } from "../components/ui/ToastProvider";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const SORT_FIELDS = {
  nickname: {
    label: "Player",
    type: "string",
  },
  level: {
    label: "Lv.",
    type: "number",
  },
  gearScore: {
    label: "Gear Score",
    type: "number",
  },
  className: {
    label: "Class",
    type: "string",
  },
  title: {
    label: "Title",
    type: "string",
  },
  gender: {
    label: "Gender",
    type: "string",
  },
  position: {
    label: "Position",
    type: "string",
  },
  isActive: {
    label: "Status",
    type: "boolean",
  },
};

function SortIcon({ field, sortField, sortDirection }) {
  if (field !== sortField) {
    return <ArrowUpDown className="size-3.5 text-content-subtle" />;
  }

  if (sortDirection === "asc") {
    return <ArrowUp className="size-3.5 text-brand-600" />;
  }

  return <ArrowDown className="size-3.5 text-brand-600" />;
}

function SortableHeader({
  field,
  sortField,
  sortDirection,
  onSort,
  align = "left",
}) {
  const config = SORT_FIELDS[field];

  return (
    <th
      className={[
        "whitespace-nowrap px-4 py-3",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={[
          "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition hover:text-content-strong",
          field === sortField ? "text-brand-600" : "text-content-muted",
          align === "right" ? "flex-row-reverse" : "",
        ].join(" ")}
      >
        {config.label}

        <SortIcon
          field={field}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </button>
    </th>
  );
}

function MemberActions({
  member,
  open,
  onToggle,
  onEdit,
  onDelete,
  onStatus,
  statusLoading,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex size-8 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong"
        aria-label={`Actions for ${member.nickname}`}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-content transition hover:bg-surface-100"
          >
            <Pencil className="size-4 text-content-muted" />
            Edit member
          </button>

          <button
            type="button"
            onClick={onStatus}
            disabled={statusLoading}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Power className="size-4 text-content-muted" />

            {statusLoading
              ? "Updating..."
              : member.isActive
                ? "Set inactive"
                : "Set active"}
          </button>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            Delete member
          </button>
        </div>
      )}
    </div>
  );
}

export default function Members() {
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [importOpen, setImportOpen] = useState(false);

  const [editMember, setEditMember] = useState(null);

  const [deleteMember, setDeleteMember] = useState(null);

  const [actionMemberId, setActionMemberId] = useState(null);

  const [statusLoadingId, setStatusLoadingId] = useState(null);

  const [sortField, setSortField] = useState("nickname");

  const [sortDirection, setSortDirection] = useState("asc");

  const [pageSize, setPageSize] = useState(25);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const membersQuery = query(
      collection(db, "members"),
      orderBy("nickname", "asc"),
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setMembers(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Failed to load members.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const closeMenu = () => {
      setActionMemberId(null);
    };

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  const activeMembers = useMemo(
    () => members.filter((member) => member.isActive).length,
    [members],
  );

  const averageGearScore = useMemo(() => {
    const membersWithGearScore = members.filter(
      (member) => Number(member.gearScore) > 0,
    );

    if (membersWithGearScore.length === 0) {
      return 0;
    }

    const total = membersWithGearScore.reduce(
      (sum, member) => sum + Number(member.gearScore || 0),
      0,
    );

    return Math.round(total / membersWithGearScore.length);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return members;
    }

    return members.filter((member) => {
      const searchableValues = [
        member.nickname,
        member.className,
        member.title,
        member.gender,
        member.position,
        member.guild,
        member.level,
        member.gearScore,
        member.isActive ? "active" : "inactive",
      ];

      return searchableValues
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [members, search]);

  const sortedMembers = useMemo(() => {
    const config = SORT_FIELDS[sortField];

    if (!config) {
      return filteredMembers;
    }

    return [...filteredMembers].sort((firstMember, secondMember) => {
      const firstValue = firstMember[sortField];

      const secondValue = secondMember[sortField];

      let comparison = 0;

      if (config.type === "number") {
        comparison = (Number(firstValue) || 0) - (Number(secondValue) || 0);
      } else if (config.type === "boolean") {
        comparison = Number(Boolean(firstValue)) - Number(Boolean(secondValue));
      } else {
        comparison = String(firstValue ?? "").localeCompare(
          String(secondValue ?? ""),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        );
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredMembers, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, sortField, sortDirection]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return sortedMembers.slice(start, start + pageSize);
  }, [sortedMembers, currentPage, pageSize]);

  const paginationStart =
    sortedMembers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const paginationEnd = Math.min(currentPage * pageSize, sortedMembers.length);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);

    const end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    return Array.from(
      {
        length: end - start + 1,
      },
      (_, index) => start + index,
    );
  }, [currentPage, totalPages]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");

      return;
    }

    setSortField(field);

    const fieldType = SORT_FIELDS[field]?.type;

    setSortDirection(
      fieldType === "number" || fieldType === "boolean" ? "desc" : "asc",
    );
  };

  const handleToggleStatus = async (member) => {
    if (statusLoadingId) {
      return;
    }

    setStatusLoadingId(member.id);
    setActionMemberId(null);

    const newStatus = !member.isActive;

    try {
      await updateDoc(doc(db, "members", member.id), {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast.success(
        newStatus ? "Member activated" : "Member deactivated",
        `${member.nickname} is now ${newStatus ? "active" : "inactive"}.`,
      );
    } catch (statusError) {
      console.error("Failed to update member status:", statusError);

      toast.error(
        "Status update failed",
        `${member.nickname}'s status could not be updated.`,
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const formatNumber = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return number.toLocaleString();
  };

  const renderActions = (member) => (
    <div onClick={(event) => event.stopPropagation()}>
      <MemberActions
        member={member}
        open={actionMemberId === member.id}
        statusLoading={statusLoadingId === member.id}
        onToggle={() =>
          setActionMemberId(actionMemberId === member.id ? null : member.id)
        }
        onEdit={() => {
          setActionMemberId(null);
          setEditMember(member);
        }}
        onStatus={() => handleToggleStatus(member)}
        onDelete={() => {
          setActionMemberId(null);
          setDeleteMember(member);
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Legend Army</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
            Members
          </h1>

          <p className="mt-1 text-sm text-content-muted">
            Manage guild members and character information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Upload className="size-4" />
          Import CSV
        </button>
      </div>

      <div className="grid grid-cols-3 border-y border-line py-4">
        <div>
          <div className="text-xl font-semibold tabular-nums text-content-strong">
            {members.length}
          </div>

          <div className="mt-1 text-xs text-content-muted">Total members</div>
        </div>

        <div className="border-x border-line px-4 sm:px-6">
          <div className="text-xl font-semibold tabular-nums text-content-strong">
            {activeMembers}
          </div>

          <div className="mt-1 text-xs text-content-muted">Active</div>
        </div>

        <div className="pl-4 sm:pl-6">
          <div className="text-xl font-semibold tabular-nums text-content-strong">
            {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
          </div>

          <div className="mt-1 text-xs text-content-muted">Avg. Gear Score</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search nickname, class, position..."
            className="h-10 w-full rounded-lg border border-line-strong bg-white pl-9 pr-4 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-content-muted">Rows per page</span>

          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-9 rounded-lg border border-line-strong bg-white px-3 text-sm text-content-strong outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        </div>
      ) : sortedMembers.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center border-y border-line px-4 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-surface-200">
            <Users className="size-5 text-content-muted" />
          </div>

          <h2 className="mt-4 text-sm font-medium text-content-strong">
            {search ? "No members found" : "No members yet"}
          </h2>

          <p className="mt-1 max-w-sm text-sm text-content-muted">
            {search
              ? "Try searching with a different nickname, class, position, or gear score."
              : "Import your guild member data from a CSV file to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-xl border border-line bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-line bg-surface-100">
                  <tr>
                    <SortableHeader
                      field="nickname"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <SortableHeader
                      field="level"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                    />

                    <SortableHeader
                      field="gearScore"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      align="right"
                    />

                    <SortableHeader
                      field="className"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <SortableHeader
                      field="title"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <SortableHeader
                      field="gender"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <SortableHeader
                      field="position"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <SortableHeader
                      field="isActive"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />

                    <th className="w-12 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {paginatedMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="transition hover:bg-surface-100"
                    >
                      <td className="px-4 py-4">
                        <div className="max-w-52 truncate font-medium text-content-strong">
                          {member.nickname}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center text-sm tabular-nums text-content">
                        {member.level ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-content-strong">
                        {member.gearScore !== undefined
                          ? formatNumber(member.gearScore)
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-content">
                        {member.className || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-content">
                        {member.title || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-content">
                        {member.gender || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-content">
                        {member.position || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium",
                            member.isActive
                              ? "text-emerald-600"
                              : "text-content-muted",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "size-1.5 rounded-full",
                              member.isActive
                                ? "bg-emerald-500"
                                : "bg-content-subtle",
                            ].join(" ")}
                          />

                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-4">{renderActions(member)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-line border-y border-line lg:hidden">
            {paginatedMembers.map((member) => (
              <div key={member.id} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-content-strong">
                      {member.nickname}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-muted">
                      <span>{member.className || "Unknown class"}</span>

                      <span className="text-content-subtle">·</span>

                      <span>Lv. {member.level ?? "—"}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-base font-semibold tabular-nums text-content-strong">
                      {member.gearScore !== undefined
                        ? formatNumber(member.gearScore)
                        : "—"}
                    </div>

                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      Gear Score
                    </div>
                  </div>

                  <div className="shrink-0">{renderActions(member)}</div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      Title
                    </div>

                    <div className="mt-0.5 truncate text-xs text-content">
                      {member.title || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      Position
                    </div>

                    <div className="mt-0.5 truncate text-xs text-content">
                      {member.position || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      Gender
                    </div>

                    <div className="mt-0.5 text-xs text-content">
                      {member.gender || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      Status
                    </div>

                    <span
                      className={[
                        "mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium",
                        member.isActive
                          ? "text-emerald-600"
                          : "text-content-muted",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "size-1.5 rounded-full",
                          member.isActive
                            ? "bg-emerald-500"
                            : "bg-content-subtle",
                        ].join(" ")}
                      />

                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-content-muted">
              Showing{" "}
              <span className="font-medium text-content-strong">
                {paginationStart}
              </span>{" "}
              to{" "}
              <span className="font-medium text-content-strong">
                {paginationEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium text-content-strong">
                {sortedMembers.length}
              </span>{" "}
              members
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-line-strong bg-white text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      "size-9 rounded-lg text-sm font-medium transition",
                      currentPage === page
                        ? "bg-brand-600 text-white"
                        : "border border-line-strong bg-white text-content hover:bg-surface-100",
                    ].join(" ")}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <span className="px-2 text-sm text-content-muted sm:hidden">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-line-strong bg-white text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <ImportMembersModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <EditMemberModal
        open={Boolean(editMember)}
        member={editMember}
        onClose={() => setEditMember(null)}
      />

      <DeleteMemberModal
        open={Boolean(deleteMember)}
        member={deleteMember}
        onClose={() => setDeleteMember(null)}
      />
    </div>
  );
}
