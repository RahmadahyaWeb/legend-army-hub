"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { fetchValkyrieTeams } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import ValkyrieHeader from "@/components/valkyrie-cup/ValkyrieHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";

/**
 * Valkyrie Cup Tournament Overview Page with Retro Pixel Styling
 *
 * Why this exists:
 * The public landing portal for the Valkyrie Cup tournament. Introduces the competition rules,
 * displays high-level team registration stats, guides participants to register their 8-player roster,
 * and spotlights recent team submissions using Ragnarok Online tournament board styling.
 *
 * @returns {JSX.Element} Rendered tournament overview page
 */
export default function ValkyrieCupPage() {
  const [data, setData] = useState({ teams: [], summary: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValkyrieTeams()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load tournament info:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = data.summary || {
    totalTeams: 0,
    approvedTeams: 0,
    pendingTeams: 0,
    legendArmy1Teams: 0,
    legendArmy2Teams: 0,
  };

  const previewTeams = (data.teams || []).slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      <ValkyrieHeader />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b-2 border-zinc-950 bg-white comic-dots-bg">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border-2 border-amber-600 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950 mb-4 shadow-[1.5px_1.5px_0px_#d97706]">
              <Trophy className="size-3.5 text-amber-700" />
              <span>Official Guild Tournament Bracket</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-zinc-950 leading-tight">
              Valkyrie Cup
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-2xl font-medium">
              Competitive team tournament between Legend Army combatants. Assemble your squad (minimum 5, maximum 8 players),
              designate your Captain, select your guild division, and battle for glory.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/valkyrie-cup/register">
                <Button variant="primary" size="md" icon={UserPlus}>
                  Register Squad
                </Button>
              </Link>
              <Link href="/valkyrie-cup/teams">
                <Button variant="secondary" size="md" icon={Users}>
                  Registered Squads
                </Button>
              </Link>
              <Link href="/valkyrie-cup/my-registration">
                <Button variant="outline" size="md">
                  My Registration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 flex-1 w-full">
        {/* SUMMARY STATS GRID */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-sans">
            Tournament Roster Summary
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            <Card className="p-3.5 sm:p-4 bg-white">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Total Squads
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-950 font-mono">
                {summary.totalTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Registered squads
              </div>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-white">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Approved
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-700 font-mono">
                {summary.approvedTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Confirmed in bracket
              </div>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-white">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Pending
              </div>
              <div className="mt-1 text-2xl font-black text-amber-700 font-mono">
                {summary.pendingTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Awaiting review
              </div>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-white">
              <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                LegendArmy1
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-950 font-mono">
                {summary.legendArmy1Teams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Guild 1 squads
              </div>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-white col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                LegendArmy2
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-950 font-mono">
                {summary.legendArmy2Teams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Guild 2 squads
              </div>
            </Card>
          </div>
        </section>

        {/* TOURNAMENT RULES & FORMAT */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          <Card className="p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex size-8 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 mb-3 comic-shadow-sm">
                <Users className="size-4" />
              </div>
              <h3 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                5 to 8 Combatants Roster
              </h3>
              <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
                Each squad must submit between 5 and 8 players: 1 designated Team Captain and 4 to 7 active team members.
                Submissions with fewer than 5 or more than 8 players will be rejected.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-zinc-950 text-xs font-mono font-bold text-zinc-950">
              1 Captain + 4 to 7 Members = 5 to 8 Total
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex size-8 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 mb-3 comic-shadow-sm">
                <Shield className="size-4" />
              </div>
              <h3 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                Guild Affiliation
              </h3>
              <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
                Every team represents an official Legend Army chapter. Squads must select either
                <strong className="text-zinc-950"> LegendArmy1</strong> or
                <strong className="text-zinc-950"> LegendArmy2</strong> upon registration.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-zinc-950 text-xs font-mono font-bold text-zinc-950">
              LegendArmy1 or LegendArmy2
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              <div className="flex size-8 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 mb-3 comic-shadow-sm">
                <UserCheck className="size-4" />
              </div>
              <h3 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                Admin Review & Approval
              </h3>
              <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
                All submissions start in <strong className="text-amber-800 font-bold">Pending</strong> status.
                Guild administrators verify rosters, inspect Discord tags, and validate active status before approving.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t-2 border-zinc-950 text-xs font-mono font-bold text-zinc-950">
              Pending → Approved / Rejected
            </div>
          </Card>
        </section>

        {/* RECENT REGISTERED TEAMS PREVIEW */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-sans">
                Registered Squads
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Teams currently approved or awaiting review for the Valkyrie Cup bracket
              </p>
            </div>

            <Link
              href="/valkyrie-cup/teams"
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-brand-700 transition"
            >
              <span>View All ({summary.totalTeams})</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <Loading message="Loading tournament squads..." />
          ) : previewTeams.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-400 bg-white p-8 text-center space-y-3 comic-shadow-sm">
              <Trophy className="mx-auto size-8 text-zinc-400" />
              <div className="text-sm font-bold font-sans text-zinc-950">
                No Squads Registered Yet
              </div>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                Be the first squad to register your roster for the Valkyrie Cup!
              </p>
              <div>
                <Link href="/valkyrie-cup/register">
                  <Button variant="primary" size="sm" icon={UserPlus}>
                    Register Squad
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewTeams.map((team) => {
                const isApproved = team.status === "approved";
                return (
                  <Card
                    key={team.id}
                    className="flex flex-col justify-between p-4 sm:p-5 bg-white comic-shadow-sm hover:comic-shadow transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={isApproved ? "success" : "warning"}
                          size="xs"
                          dot
                        >
                          {team.status.toUpperCase()}
                        </Badge>
                        <Badge variant="neutral" size="xs">
                          {team.guild}
                        </Badge>
                      </div>

                      <h3 className="mt-3 text-sm font-bold font-sans text-zinc-950 line-clamp-1">
                        {team.teamName}
                      </h3>

                      <div className="mt-2.5 space-y-1 text-xs text-zinc-600">
                        <div>
                          Captain:{" "}
                          <strong className="text-zinc-950 font-bold">
                            {team.captain}
                          </strong>
                        </div>
                        <div>
                          Roster:{" "}
                          <span className="font-mono font-bold text-zinc-950">
                            {team.totalPlayers || 8} / 8 players
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          Registered {formatDate(team.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-zinc-950 flex items-center justify-between">
                      <Link
                        href={`/valkyrie-cup/teams/${team.id}`}
                        className="w-full"
                      >
                        <Button variant="secondary" size="sm" className="w-full">
                          View Roster
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
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
              VALKYRIE CUP · LEGEND ARMY
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            Tournament Management & Squad Lineups
          </div>
        </div>
      </footer>
    </div>
  );
}
