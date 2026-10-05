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
 * Valkyrie Cup Tournament Overview Page
 *
 * Why this exists:
 * The public landing portal for the Valkyrie Cup tournament. Introduces the competition rules,
 * displays high-level team registration stats, guides participants to register their 8-player roster,
 * and spotlights recent team submissions.
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <ValkyrieHeader />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-800 mb-4">
              <Trophy className="size-3.5 text-amber-500" />
              <span>Official Guild Tournament</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950">
              Valkyrie Cup
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
              Competitive 8v8 team tournament between Legend Army combatants. Assemble your 8-player roster,
              designate your Captain, select your guild, and battle for guild supremacy.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/valkyrie-cup/register">
                <Button variant="primary" size="md" icon={UserPlus}>
                  Register Team
                </Button>
              </Link>
              <Link href="/valkyrie-cup/teams">
                <Button variant="secondary" size="md" icon={Users}>
                  Registered Teams
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
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-10 flex-1 w-full">
        {/* SUMMARY STATS GRID */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Tournament Roster Summary
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            <Card className="p-4 bg-white">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Teams
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-900 font-mono">
                {summary.totalTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Registered squads
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                Approved
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-600 font-mono">
                {summary.approvedTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Confirmed in bracket
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                Pending
              </div>
              <div className="mt-1 text-2xl font-black text-amber-600 font-mono">
                {summary.pendingTeams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Awaiting admin review
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                LegendArmy1
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-900 font-mono">
                {summary.legendArmy1Teams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Guild 1 teams
              </div>
            </Card>

            <Card className="p-4 bg-white col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                LegendArmy2
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-900 font-mono">
                {summary.legendArmy2Teams}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Guild 2 teams
              </div>
            </Card>
          </div>
        </section>

        {/* TOURNAMENT RULES & FORMAT */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 mb-3">
                <Users className="size-4.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Strict 8-Player Roster
              </h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                Each team must submit exactly 8 players: 1 designated Team Captain and 7 active team members.
                Submissions with fewer or more players will be rejected.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
              1 Captain + 7 Members = 8 Total
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 mb-3">
                <Shield className="size-4.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Guild Exclusivity
              </h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                Every team represents an official Legend Army chapter. Teams must select either
                <strong className="text-zinc-900"> LegendArmy1</strong> or
                <strong className="text-zinc-900"> LegendArmy2</strong> upon registration.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
              LegendArmy1 or LegendArmy2
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 mb-3">
                <UserCheck className="size-4.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Admin Review & Approval
              </h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                All submissions start in <strong className="text-amber-700 font-semibold">Pending</strong> status.
                Guild administrators review roster eligibility, Discord tags, and verify member rosters before granting
                <strong className="text-emerald-700 font-semibold"> Approved</strong> status.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
              Pending → Approved / Rejected
            </div>
          </Card>
        </section>

        {/* RECENT REGISTERED TEAMS PREVIEW */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Registered Squads
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Teams currently approved or awaiting review for the Valkyrie Cup bracket
              </p>
            </div>

            <Link
              href="/valkyrie-cup/teams"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition"
            >
              <span>View All ({summary.totalTeams})</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <Loading message="Loading tournament teams..." />
          ) : previewTeams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center space-y-3">
              <Trophy className="mx-auto size-8 text-zinc-300" />
              <div className="text-sm font-semibold text-zinc-800">
                No teams registered yet
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Be the first squad to register your 8-player roster for the Valkyrie Cup!
              </p>
              <div>
                <Link href="/valkyrie-cup/register">
                  <Button variant="primary" size="sm" icon={UserPlus}>
                    Register Team
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
                    className="flex flex-col justify-between p-4 sm:p-5 hover:border-zinc-300 transition-colors"
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

                      <h3 className="mt-3 text-sm font-bold text-zinc-900 line-clamp-1">
                        {team.teamName}
                      </h3>

                      <div className="mt-2.5 space-y-1 text-xs text-zinc-500">
                        <div>
                          Captain:{" "}
                          <strong className="text-zinc-900 font-semibold">
                            {team.captain}
                          </strong>
                        </div>
                        <div>
                          Roster:{" "}
                          <span className="font-mono font-semibold text-zinc-700">
                            {team.totalPlayers || 8} / 8 players
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Registered {formatDate(team.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <Link
                        href={`/valkyrie-cup/teams/${team.id}`}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                      >
                        View Roster
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
      <footer className="mt-12 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Legend Army"
              className="size-7 object-contain"
            />
            <span className="text-xs font-bold text-zinc-900">
              Valkyrie Cup · Legend Army Hub
            </span>
          </div>

          <div className="text-xs text-zinc-400">
            Tournament Management & Team Rosters
          </div>
        </div>
      </footer>
    </div>
  );
}
