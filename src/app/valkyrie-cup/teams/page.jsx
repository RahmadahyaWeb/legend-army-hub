"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
} from "lucide-react";
import { fetchValkyrieTeams } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import ValkyrieHeader from "@/components/valkyrie-cup/ValkyrieHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Public Registered Teams Page with Retro Pixel Styling
 *
 * Why this exists:
 * The public directory for all active (Approved and Pending) Valkyrie Cup team registrations.
 * Allows filtering by guild (LegendArmy1 / LegendArmy2) and approval status, with search capabilities
 * across Team Name and Captain Nickname.
 *
 * Tricky logic:
 * Excludes all rejected submissions from public view, and defaults sorting to prioritize
 * Approved teams first, followed by Pending teams, and then by latest submission date.
 *
 * @returns {JSX.Element} Rendered registered teams page
 */
export default function ValkyrieCupTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [summary, setSummary] = useState({
    totalTeams: 0,
    approvedTeams: 0,
    pendingTeams: 0,
    legendArmy1Teams: 0,
    legendArmy2Teams: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [guildFilter, setGuildFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadTeams = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetchValkyrieTeams({}, true);
      setTeams(res.teams || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load registered teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Filter teams on client
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Guild filter
      if (guildFilter !== "all" && t.guild !== guildFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }

      // Search query (team name or captain nickname)
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const teamMatch = (t.teamName || "").toLowerCase().includes(query);
        const captainMatch = (t.captain || "").toLowerCase().includes(query);
        if (!teamMatch && !captainMatch) {
          return false;
        }
      }

      return true;
    });
  }, [teams, guildFilter, statusFilter, search]);

  // Sort teams: Approved first, Pending second, then newest created_at DESC
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      const statusRank = { approved: 1, pending: 2 };
      const rankA = statusRank[a.status] || 3;
      const rankB = statusRank[b.status] || 3;
      if (rankA !== rankB) return rankA - rankB;

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredTeams]);

  // Pagination
  const totalPages = Math.ceil(sortedTeams.length / pageSize) || 1;
  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTeams.slice(start, start + pageSize);
  }, [sortedTeams, page, pageSize]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      <ValkyrieHeader />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-sans text-zinc-950 tracking-tight">
                Valkyrie Cup Squads
              </h1>
              <Badge variant="neutral" size="sm">
                {summary.totalTeams} Total Squads
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600">
              Verified tournament roster registrations and pending lineups
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/valkyrie-cup/register">
              <Button variant="primary" size="sm" icon={UserPlus}>
                Register Squad
              </Button>
            </Link>
          </div>
        </div>

        {/* SUMMARY METRICS CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          <Card className="p-3 sm:p-3.5 bg-white">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Total Registered
            </div>
            <div className="mt-1 text-xl font-black text-zinc-950 font-mono">
              {summary.totalTeams}
            </div>
            <div className="text-[10px] text-zinc-500">Public rosters</div>
          </Card>

          <Card className="p-3 sm:p-3.5 bg-white">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Approved Squads
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700 font-mono">
              {summary.approvedTeams}
            </div>
            <div className="text-[10px] text-zinc-500">Ready to battle</div>
          </Card>

          <Card className="p-3 sm:p-3.5 bg-white">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Pending Squads
            </div>
            <div className="mt-1 text-xl font-black text-amber-700 font-mono">
              {summary.pendingTeams}
            </div>
            <div className="text-[10px] text-zinc-500">In review</div>
          </Card>

          <Card className="p-3 sm:p-3.5 bg-white">
            <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
              LegendArmy1
            </div>
            <div className="mt-1 text-xl font-black text-zinc-950 font-mono">
              {summary.legendArmy1Teams}
            </div>
            <div className="text-[10px] text-zinc-500">Guild 1 squads</div>
          </Card>

          <Card className="p-3 sm:p-3.5 bg-white col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
              LegendArmy2
            </div>
            <div className="mt-1 text-xl font-black text-zinc-950 font-mono">
              {summary.legendArmy2Teams}
            </div>
            <div className="text-[10px] text-zinc-500">Guild 2 squads</div>
          </Card>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-3 sm:p-4 comic-shadow-sm">
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <Input
              icon={Search}
              placeholder="Search by Squad Name or Captain..."
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
            {/* Guild Filter */}
            <Select
              value={guildFilter}
              onChange={(e) => {
                setGuildFilter(e.target.value);
                setPage(1);
              }}
              className="!h-9 !py-0 text-xs font-bold"
            >
              <option value="all">All Guilds</option>
              <option value="LegendArmy1">LegendArmy1</option>
              <option value="LegendArmy2">LegendArmy2</option>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="!h-9 !py-0 text-xs font-bold"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </Select>

            {/* Page Size */}
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="!h-9 !py-0 text-xs font-bold"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* TEAMS TABLE */}
        {loading ? (
          <Loading message="Loading registered squads..." />
        ) : sortedTeams.length === 0 ? (
          <EmptyState
            title="No squads found"
            description={
              search || guildFilter !== "all" || statusFilter !== "all"
                ? "No registered squads match your selected filters."
                : "No squads have registered for Valkyrie Cup yet. Be the first to register!"
            }
            action={
              <Link href="/valkyrie-cup/register">
                <Button variant="primary" size="sm" icon={UserPlus}>
                  Register Squad
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Squad Name</TableHead>
                  <TableHead>Guild</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead className="text-center">Players</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeams.map((team, index) => {
                  const globalIndex = (page - 1) * pageSize + index + 1;
                  const isApproved = team.status === "approved";

                  return (
                    <TableRow key={team.id || globalIndex}>
                      <TableCell className="text-center font-mono text-zinc-500 text-xs font-bold">
                        {globalIndex}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/valkyrie-cup/teams/${team.id}`}
                          className="font-bold text-zinc-950 text-xs sm:text-sm hover:text-brand-700 font-sans"
                        >
                          {team.teamName}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            team.guild === "LegendArmy1" ? "brand" : "info"
                          }
                          size="xs"
                        >
                          {team.guild}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-zinc-950 text-xs">
                          {team.captain}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs font-bold text-zinc-800">
                        {team.totalPlayers || 8} / 8
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={isApproved ? "success" : "warning"}
                          size="xs"
                          dot
                        >
                          {team.status.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-zinc-600">
                        {formatDate(team.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/valkyrie-cup/teams/${team.id}`}>
                          <Button variant="secondary" size="xs">
                            Roster
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-2 border-zinc-950 bg-white px-4 py-2.5 text-xs pixel-shadow-sm">
                <span className="text-zinc-600 font-bold font-mono">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, sortedTeams.length)} of{" "}
                  <strong className="text-zinc-950 font-black">
                    {sortedTeams.length}
                  </strong>{" "}
                  squads
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={ChevronLeft}
                  >
                    Prev
                  </Button>

                  <span className="px-2 font-black font-mono text-zinc-900">
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
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t-2 border-zinc-950 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-6 shrink-0 items-center justify-center border border-zinc-950 bg-brand-600">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-5 object-contain"
              />
            </div>
            <span className="text-xs font-black tracking-wider text-zinc-950 font-sans uppercase">
              VALKYRIE CUP · SQUADS DIRECTORY
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            Legend Army · Guild Management
          </div>
        </div>
      </footer>
    </div>
  );
}
