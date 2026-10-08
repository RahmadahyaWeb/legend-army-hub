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
 * My Registration Portal Page with Retro Pixel Styling
 *
 * Why this exists:
 * Private user portal enabling tournament participants to track their squad's review progress,
 * view all player Discord tags, and review administrative feedback if rejected.
 * Styled after classic Ragnarok Online tournament status logs.
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
      setLookupError("Both Squad Name and Captain Discord ID are required.");
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
          "No registration found matching that Squad Name and Captain Discord ID."
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
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      <ValkyrieHeader />

      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-sans text-zinc-950 tracking-tight">
                My Registration
              </h1>
              <Badge variant="brand" size="sm">
                Participant Portal
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600">
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
              Look Up Squad
            </Button>

            <Link href="/valkyrie-cup/register">
              <Button variant="primary" size="sm" icon={UserPlus}>
                Register Squad
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
            description="You have not submitted a squad registration from this browser, or your session has expired."
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLookupOpen(true)}
                >
                  Look Up by Squad Name
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
                  className="overflow-hidden bg-white divide-y-2 divide-zinc-950 comic-shadow"
                >
                  {/* TOP HEADER */}
                  <div className="p-4.5 sm:p-6 space-y-4">
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

                        <h2 className="mt-2 text-xl sm:text-2xl font-black font-sans text-zinc-950 tracking-tight">
                          {reg.teamName}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-600 font-mono">
                          <div>Submitted {formatDate(reg.createdAt)}</div>
                          {reg.reviewedAt && (
                            <>
                              <span>•</span>
                              <div>
                                Reviewed by{" "}
                                <strong className="text-zinc-950 font-bold">
                                  {reg.reviewedBy || "Admin"}
                                </strong>{" "}
                                on {formatDate(reg.reviewedAt)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/valkyrie-cup/teams/${reg.id}`}>
                          <Button variant="secondary" size="xs">
                            Public View
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* REJECTION REASON ALERT (IF REJECTED) */}
                    {isRejected && (
                      <div className="border-2 border-red-700 bg-red-50 p-3.5 text-xs text-red-900 space-y-1 comic-shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold font-sans text-red-950 uppercase tracking-wide">
                          <XCircle className="size-4 shrink-0 text-red-700" />
                          <span>Registration Rejected</span>
                        </div>
                        <p className="mt-1 text-red-800 leading-relaxed pl-5.5">
                          {reg.rejectionReason ||
                            "Your registration was rejected by administrators. Please contact leadership on Discord for clarification or submit a revised roster."}
                        </p>
                      </div>
                    )}

                    {/* PENDING NOTICE */}
                    {isPending && (
                      <div className="border-2 border-amber-600 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2 comic-shadow-sm">
                        <Clock className="size-4 shrink-0 text-amber-700 mt-0.5" />
                        <div>
                          <span className="font-bold font-sans uppercase text-amber-950">
                            Awaiting Administrative Review:
                          </span>{" "}
                          Your squad is registered and appears in the public tournament directory.
                          An administrator will verify your 8 combatants shortly.
                        </div>
                      </div>
                    )}

                    {/* APPROVED NOTICE */}
                    {isApproved && (
                      <div className="border-2 border-emerald-700 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2 comic-shadow-sm">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-700 mt-0.5" />
                        <div>
                          <span className="font-bold font-sans uppercase text-emerald-950">
                            Squad Approved:
                          </span>{" "}
                          Your roster is officially locked in for the Valkyrie Cup tournament bracket!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROSTER TABLE (INCLUDES DISCORD ID) */}
                  <div className="p-4.5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold font-sans uppercase tracking-wide text-zinc-950">
                          Squad Roster (Confidential Discord Tags)
                        </h3>
                        <p className="text-[11px] text-zinc-500">
                          Discord tags are strictly private and visible only to you and administrators
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
                          <TableHead>Character Nickname</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Discord Tag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reg.roster || []).map((player, index) => {
                          const isCaptain = player.role === "captain";

                          return (
                            <TableRow key={player.id || index}>
                              <TableCell className="text-center font-mono text-zinc-500 text-xs font-bold">
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                <div className="font-bold text-zinc-950 text-xs sm:text-sm flex items-center gap-1.5 font-sans">
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

                              <TableCell className="font-mono text-xs font-bold text-zinc-800">
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
        title="Find My Squad Registration"
        description="Search for your submitted squad using your exact Squad Name and Captain Discord Tag."
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
              Find Squad
            </Button>
          </>
        }
      >
        <form onSubmit={handleLookupSubmit} className="space-y-4 py-1">
          <Input
            label="Squad Name"
            placeholder="Exact squad name used upon registration"
            value={lookupTeamName}
            onChange={(e) => setLookupTeamName(e.target.value)}
            required
          />

          <Input
            label="Captain Discord Tag"
            placeholder="Discord ID entered for the captain"
            value={lookupDiscordId}
            onChange={(e) => setLookupDiscordId(e.target.value)}
            required
          />

          {lookupError && (
            <div className="border-2 border-red-700 bg-red-50 p-3 text-xs font-bold text-red-900 comic-shadow-sm">
              {lookupError}
            </div>
          )}
        </form>
      </Modal>

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
              VALKYRIE CUP · MY REGISTRATION
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
