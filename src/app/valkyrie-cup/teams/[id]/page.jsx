"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Crown,
} from "lucide-react";
import { fetchValkyrieTeamDetail } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import ValkyrieHeader from "@/components/valkyrie-cup/ValkyrieHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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

/**
 * Public Team Detail & Roster View with Retro Pixel Styling
 *
 * Why this exists:
 * Allows public visitors and tournament participants to view a registered team's verified
 * lineup and tournament details.
 *
 * Tricky logic:
 * Strictly respects the security rule that Discord IDs are omitted from public display.
 * Only if the visitor is the authenticated team owner or guild administrator will Discord IDs be shown.
 *
 * @returns {JSX.Element} Rendered public team detail view
 */
export default function ValkyrieTeamDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchValkyrieTeamDetail(id, true)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load team detail:", err);
        setError(err.message || "Failed to load team details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
        <ValkyrieHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <Loading message="Loading squad roster..." />
        </div>
      </div>
    );
  }

  if (error || !data?.team) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
        <ValkyrieHeader />
        <main className="mx-auto max-w-4xl p-6 sm:p-12 flex-1 w-full">
          <EmptyState
            title="Squad Not Found"
            description={
              error ||
              "The requested squad does not exist or has been removed from the tournament directory."
            }
            action={
              <Link href="/valkyrie-cup/teams">
                <Button variant="primary" size="sm" icon={ArrowLeft}>
                  Back to Squads
                </Button>
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const { team, roster } = data;
  const isApproved = team.status === "approved";
  const hasDiscordId = roster.some((m) => Boolean(m.discordId));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      <ValkyrieHeader />

      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
        {/* TOP BREADCRUMB / BACK */}
        <div className="flex items-center justify-between">
          <Link href="/valkyrie-cup/teams">
            <Button variant="secondary" size="xs" icon={ArrowLeft}>
              Back to Registered Squads
            </Button>
          </Link>

          <Link href="/valkyrie-cup/register">
            <Button variant="outline" size="xs">
              Register Another Squad
            </Button>
          </Link>
        </div>

        {/* TEAM INFORMATION CARD */}
        <Card className="p-4.5 sm:p-6 bg-white comic-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={isApproved ? "success" : "warning"}
                  size="sm"
                  dot
                >
                  {team.status.toUpperCase()}
                </Badge>
                <Badge
                  variant={team.guild === "LegendArmy1" ? "brand" : "info"}
                  size="sm"
                >
                  {team.guild}
                </Badge>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-black font-sans text-zinc-950 tracking-tight">
                {team.teamName}
              </h1>

              <p className="mt-1 text-xs font-mono text-zinc-600">
                Registered on {formatDate(team.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3 border-2 border-zinc-950 bg-zinc-50 p-3 sm:text-right comic-shadow-sm">
              <div>
                <div className="text-[10px] font-bold font-sans uppercase tracking-wider text-zinc-500">
                  Squad Captain
                </div>
                <div className="text-sm font-bold text-zinc-950 flex items-center gap-1.5 mt-0.5">
                  <Crown className="size-3.5 text-amber-600 shrink-0" />
                  <span>{team.captain}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* TEAM ROSTER SECTION */}
        <Card className="overflow-hidden bg-white comic-shadow">
          <div className="flex items-center justify-between border-b-2 border-zinc-950 bg-zinc-100 px-4 sm:px-6 py-3">
            <div>
              <h2 className="text-sm font-bold font-sans uppercase tracking-wide text-zinc-950">
                Squad Lineup
              </h2>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {roster.length} registered combatants (1 Captain + {roster.length - 1} Members)
              </p>
            </div>

            <Badge variant="neutral" size="xs">
              {roster.length} / 8 Players
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Player Nickname</TableHead>
                <TableHead>Designation</TableHead>
                {hasDiscordId && <TableHead>Discord Tag</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((player, index) => {
                const isCaptain = player.role === "captain";

                return (
                  <TableRow key={player.id || index}>
                    <TableCell className="text-center font-mono text-zinc-500 text-xs font-bold">
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-zinc-950 text-xs sm:text-sm flex items-center gap-1.5">
                        {isCaptain && (
                          <Crown className="size-3.5 text-amber-600 shrink-0" />
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

                    {hasDiscordId && (
                      <TableCell className="font-mono text-xs text-zinc-700">
                        {player.discordId || "—"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
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
              VALKYRIE CUP · SQUAD DETAIL
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
