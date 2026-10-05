"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Crown,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { fetchMyValkyrieRegistrations } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import ValkyrieHeader from "@/components/valkyrie-cup/ValkyrieHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

/**
 * My Registration Portal Page
 *
 * Why this exists:
 * Private user portal enabling tournament participants to track their team's review progress,
 * view all 8 player Discord tags, and review administrative feedback if rejected.
 *
 * Tricky logic:
 * Uses the client's persistent user identity cookie and local storage to pull their submissions.
 * Offers a backup lookup modal by Team Name & Captain Discord ID in case the participant switched
 * browsers or devices.
 *
 * @returns {JSX.Element} Rendered user registrations portal
 */
export default function MyRegistrationPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupOpen, setLookupOpen] = useState(false);

  // Lookup form state
  const [lookupTeamName, setLookupTeamName] = useState("");
  const [lookupDiscordId, setLookupDiscordId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const loadMyRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetchMyValkyrieRegistrations({}, true);
      setRegistrations(res || []);
    } catch (err) {
      console.error("Failed to load my registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRegistrations();
  }, []);

  const handleLookupSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!lookupTeamName.trim() || !lookupDiscordId.trim()) {
      setLookupError("Both Team Name and Captain Discord ID are required.");
      return;
    }

    setLookupLoading(true);
    setLookupError("");

    try {
      const res = await fetchMyValkyrieRegistrations(
        {
          teamName: lookupTeamName.trim(),
          captainDiscordId: lookupDiscordId.trim(),
        },
        true
      );

      if (!res || res.length === 0) {
        setLookupError(
          "No registration found matching that Team Name and Captain Discord ID."
        );
      } else {
        setRegistrations(res);
        setLookupOpen(false);
        setLookupTeamName("");
        setLookupDiscordId("");
      }
    } catch (err) {
      setLookupError(err.message || "Failed to lookup registration.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <ValkyrieHeader />

      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                My Registration
              </h1>
              <Badge variant="brand" size="sm">
                Participant Portal
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              Track your squad review status, view private player Discord IDs, and read admin feedback
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Search}
              onClick={() => setLookupOpen(true)}
            >
              Look Up Team
            </Button>

            <Link href="/valkyrie-cup/register">
              <Button variant="primary" size="sm" icon={UserPlus}>
                Register Team
              </Button>
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <Loading message="Loading your registration details..." />
        ) : registrations.length === 0 ? (
          <EmptyState
            title="No Registrations Found"
            description="You have not submitted a team registration from this browser, or your session has expired."
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLookupOpen(true)}
                >
                  Look Up by Team Name
                </Button>
                <Link href="/valkyrie-cup/register">
                  <Button variant="primary" size="sm" icon={UserPlus}>
                    Register a Squad
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {registrations.map((reg) => {
              const isApproved = reg.status === "approved";
              const isRejected = reg.status === "rejected";
              const isPending = reg.status === "pending";

              return (
                <Card
                  key={reg.id}
                  className="overflow-hidden bg-white divide-y divide-zinc-100"
                >
                  {/* TOP HEADER */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              isApproved
                                ? "success"
                                : isRejected
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {reg.status.toUpperCase()}
                          </Badge>
                          <Badge
                            variant={
                              reg.guild === "LegendArmy1" ? "brand" : "info"
                            }
                            size="sm"
                          >
                            {reg.guild}
                          </Badge>
                        </div>

                        <h2 className="mt-2 text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                          {reg.teamName}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <div>Submitted {formatDate(reg.createdAt)}</div>
                          {reg.reviewedAt && (
                            <>
                              <span>•</span>
                              <div>
                                Reviewed by{" "}
                                <strong className="text-zinc-800 font-semibold">
                                  {reg.reviewedBy || "Admin"}
                                </strong>{" "}
                                on {formatDate(reg.reviewedAt)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/valkyrie-cup/teams/${reg.id}`}
                          className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
                        >
                          Public View
                        </Link>
                      </div>
                    </div>

                    {/* REJECTION REASON ALERT (IF REJECTED) */}
                    {isRejected && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 font-bold text-red-900">
                          <XCircle className="size-4 shrink-0 text-red-600" />
                          <span>Registration Rejected</span>
                        </div>
                        <p className="mt-1 text-red-700 leading-relaxed pl-5.5">
                          {reg.rejectionReason ||
                            "Your registration was rejected by administrators. Please contact leadership on Discord for clarification or submit a revised roster."}
                        </p>
                      </div>
                    )}

                    {/* PENDING NOTICE */}
                    {isPending && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 flex items-start gap-2">
                        <Clock className="size-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900">
                            Awaiting Administrative Review:
                          </span>{" "}
                          Your team is registered and appears in the public tournament directory.
                          An administrator will verify your 8 combatants shortly.
                        </div>
                      </div>
                    )}

                    {/* APPROVED NOTICE */}
                    {isApproved && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-900">
                            Squad Approved:
                          </span>{" "}
                          Your roster is officially locked in for the Valkyrie Cup bracket!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROSTER TABLE (INCLUDES DISCORD ID) */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">
                          Team Roster (Private Discord IDs)
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Discord IDs are strictly confidential and visible only to you and administrators
                        </p>
                      </div>

                      <Badge variant="neutral" size="xs">
                        {reg.roster?.length || 8} Players
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Nickname</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Discord ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reg.roster || []).map((player, index) => {
                          const isCaptain = player.role === "captain";

                          return (
                            <TableRow key={player.id || index}>
                              <TableCell className="text-center font-mono text-zinc-400 text-xs font-semibold">
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                <div className="font-bold text-zinc-900 text-xs sm:text-sm flex items-center gap-1.5">
                                  {isCaptain && (
                                    <Crown className="size-3.5 text-amber-500 shrink-0" />
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

                              <TableCell className="font-mono text-xs font-medium text-zinc-700">
                                {player.discordId || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* LOOKUP MODAL */}
      <Modal
        open={lookupOpen}
        onClose={() => setLookupOpen(false)}
        title="Find My Team Registration"
        description="Search for your submitted squad using your exact Team Name and Captain Discord ID."
        icon={Search}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={lookupLoading}
              onClick={() => setLookupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={lookupLoading}
              onClick={handleLookupSubmit}
            >
              Find Team
            </Button>
          </>
        }
      >
        <form onSubmit={handleLookupSubmit} className="space-y-4 py-1">
          <Input
            label="Team Name"
            placeholder="Exact team name used upon registration"
            value={lookupTeamName}
            onChange={(e) => setLookupTeamName(e.target.value)}
            required
          />

          <Input
            label="Captain Discord ID"
            placeholder="Discord ID entered for the captain"
            value={lookupDiscordId}
            onChange={(e) => setLookupDiscordId(e.target.value)}
            required
          />

          {lookupError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {lookupError}
            </div>
          )}
        </form>
      </Modal>

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
              Valkyrie Cup · My Registration
            </span>
          </div>

          <div className="text-xs text-zinc-400">
            Legend Army · Guild Management
          </div>
        </div>
      </footer>
    </div>
  );
}
