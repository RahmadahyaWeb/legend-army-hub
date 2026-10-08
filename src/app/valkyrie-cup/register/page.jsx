"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Shield,
  UserPlus,
} from "lucide-react";
import { submitValkyrieRegistration } from "@/lib/api";
import ValkyrieHeader from "@/components/valkyrie-cup/ValkyrieHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

const GUILD_OPTIONS = [
  { value: "LegendArmy1", label: "LegendArmy1" },
  { value: "LegendArmy2", label: "LegendArmy2" },
];

/**
 * Valkyrie Cup Team Registration Page with Retro Pixel Styling
 *
 * Why this exists:
 * The official registration form for entering an 8-player squad into the Valkyrie Cup.
 * Enforces mandatory team metadata, guild assignment, captain details, and squad combatants
 * while preserving instant in-browser duplicate nickname validation.
 *
 * @returns {JSX.Element} Rendered registration form page
 */
export default function ValkyrieRegisterPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Form states
  const [teamName, setTeamName] = useState("");
  const [guild, setGuild] = useState("LegendArmy1");

  // Captain state
  const [captainNickname, setCaptainNickname] = useState("");
  const [captainDiscordId, setCaptainDiscordId] = useState("");

  // 7 Members state: array of 7 items
  const [members, setMembers] = useState(
    Array.from({ length: 7 }, () => ({
      nickname: "",
      discordId: "",
    }))
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedTeam, setSubmittedTeam] = useState(null);

  /**
   * Updates an individual member's field
   * @param {number} index - Index of member (0 to 6)
   * @param {string} field - Field to update ('nickname' or 'discordId')
   * @param {string} value - New value
   */
  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Compute duplicate nicknames in real time
  const duplicateNicknames = useMemo(() => {
    const list = [captainNickname.trim(), ...members.map((m) => m.nickname.trim())]
      .filter(Boolean)
      .map((n) => n.toLowerCase());

    const seen = new Set();
    const duplicates = new Set();
    for (const name of list) {
      if (seen.has(name)) {
        duplicates.add(name);
      } else {
        seen.add(name);
      }
    }
    return duplicates;
  }, [captainNickname, members]);

  // Compute filled roster count
  const filledCount = useMemo(() => {
    let count = 0;
    if (captainNickname.trim() && captainDiscordId.trim()) count += 1;
    for (const m of members) {
      if (m.nickname.trim() && m.discordId.trim()) count += 1;
    }
    return count;
  }, [captainNickname, captainDiscordId, members]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client validation
    if (!teamName.trim()) {
      setErrorMessage("Team Name is required.");
      return;
    }

    if (!guild || (guild !== "LegendArmy1" && guild !== "LegendArmy2")) {
      setErrorMessage("Please select a valid Guild (LegendArmy1 or LegendArmy2).");
      return;
    }

    if (!captainNickname.trim()) {
      setErrorMessage("Captain Nickname is required.");
      return;
    }

    if (!captainDiscordId.trim()) {
      setErrorMessage("Captain Discord ID is required.");
      return;
    }

    // Members 1 to 4 are strictly mandatory (1 Captain + 4 Members = 5 players minimum)
    for (let i = 0; i < 4; i++) {
      if (!members[i].nickname.trim()) {
        setErrorMessage(`Member #${i + 1} Nickname is required (minimum 5 total players including Captain).`);
        return;
      }
      if (!members[i].discordId.trim()) {
        setErrorMessage(`Member #${i + 1} Discord ID is required (minimum 5 total players including Captain).`);
        return;
      }
    }

    // Members 5 to 7 are optional, but if one field is filled, both must be provided
    for (let i = 4; i < members.length; i++) {
      const nick = members[i].nickname.trim();
      const discord = members[i].discordId.trim();
      if (nick && !discord) {
        setErrorMessage(`Member #${i + 1} Discord ID is required when Nickname is filled.`);
        return;
      }
      if (!nick && discord) {
        setErrorMessage(`Member #${i + 1} Nickname is required when Discord ID is filled.`);
        return;
      }
    }

    if (duplicateNicknames.size > 0) {
      setErrorMessage(
        "Duplicate nicknames detected. All players in the roster must have unique nicknames within the squad."
      );
      return;
    }

    if (filledCount < 5 || filledCount > 8) {
      setErrorMessage("The squad roster must consist of between 5 and 8 players (1 Captain and 4 to 7 Members).");
      return;
    }

    setLoading(true);

    try {
      const validMembers = members
        .filter((m) => m.nickname.trim() && m.discordId.trim())
        .map((m) => ({
          nickname: m.nickname.trim(),
          discordId: m.discordId.trim(),
          role: "member",
        }));

      const payload = {
        teamName: teamName.trim(),
        guild,
        captain: {
          nickname: captainNickname.trim(),
          discordId: captainDiscordId.trim(),
          role: "captain",
        },
        members: validMembers,
      };

      const res = await submitValkyrieRegistration(payload);

      // Save registration ID locally for backup retrieval
      if (typeof window !== "undefined" && res.registrationId) {
        try {
          const stored = JSON.parse(
            localStorage.getItem("valkyrie_cup_registrations") || "[]"
          );
          if (!stored.includes(res.registrationId)) {
            stored.push(res.registrationId);
            localStorage.setItem(
              "valkyrie_cup_registrations",
              JSON.stringify(stored)
            );
          }
        } catch {
          // Safe ignore localStorage issues
        }
      }

      success(
        "Registration Submitted",
        `Squad "${teamName.trim()}" has been registered and is pending approval.`
      );

      setSubmittedTeam({
        teamName: teamName.trim(),
        guild,
        registrationId: res.registrationId,
      });
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(err.message || "Failed to submit tournament registration.");
      toastError("Submission Error", err.message || "Failed to submit registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      <ValkyrieHeader />

      <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
        {/* TOP BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link href="/valkyrie-cup">
            <Button variant="secondary" size="xs" icon={ArrowLeft}>
              Tournament Overview
            </Button>
          </Link>

          <Link href="/valkyrie-cup/teams">
            <Button variant="outline" size="xs">
              View Registered Squads
            </Button>
          </Link>
        </div>

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-sans text-zinc-950 tracking-tight">
              Register Squad
            </h1>
            <Badge variant="brand" size="sm">
              Valkyrie Cup
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600">
            Submit your 5 to 8 player lineup for administrative review and tournament bracket seeding.
          </p>
        </div>

        {/* ERROR ALERT */}
        {errorMessage && (
          <div className="border-2 border-red-700 bg-red-50 p-3.5 text-xs font-bold text-red-900 flex items-start gap-2.5 comic-shadow-sm">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-700" />
            <div>
              <div className="font-sans font-bold uppercase tracking-wider">Validation Error</div>
              <div className="mt-0.5 font-normal">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. TEAM INFORMATION */}
          <Card className="p-4 sm:p-5 bg-white space-y-4 comic-shadow">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5">
              <div>
                <h2 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                  1. Squad Information
                </h2>
                <p className="text-xs text-zinc-500">
                  Select your guild affiliation and official squad moniker
                </p>
              </div>
              <Shield className="size-4 text-zinc-700" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Squad Name"
                placeholder="e.g. Valkyrie Alpha"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                helperText="Must be unique among active registrations"
              />

              <Select
                label="Guild Affiliation"
                value={guild}
                onChange={(e) => setGuild(e.target.value)}
                required
                helperText="Squads must represent LegendArmy1 or LegendArmy2"
              >
                {GUILD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* 2. TEAM CAPTAIN */}
          <Card className="p-4 sm:p-5 bg-white space-y-4 comic-shadow">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-amber-600" />
                <div>
                  <h2 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                    2. Squad Captain (Player 1)
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Primary leader and official point of contact
                  </p>
                </div>
              </div>
              <Badge variant="warning" size="xs">
                Captain
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Captain Character Nickname"
                placeholder="In-game character name"
                value={captainNickname}
                onChange={(e) => setCaptainNickname(e.target.value)}
                required
              />

              <Input
                label="Captain Discord Tag"
                placeholder="e.g. captain#1234 or discord_user"
                value={captainDiscordId}
                onChange={(e) => setCaptainDiscordId(e.target.value)}
                required
                helperText="Used for match coordination (private to squad & admin)"
              />
            </div>
          </Card>

          {/* 3. TEAM MEMBERS */}
          <Card className="p-4 sm:p-5 bg-white space-y-4 comic-shadow">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5">
              <div>
                <h2 className="text-sm font-bold font-sans text-zinc-950 uppercase tracking-wide">
                  3. Squad Members (Players 2 – 8)
                </h2>
                <p className="text-xs text-zinc-500">
                  Enter between 4 and 7 combatants (minimum 5, maximum 8 total players including Captain)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={filledCount >= 5 ? "success" : "neutral"}
                  size="sm"
                >
                  {filledCount} / 8 Combatants (Min. 5)
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => {
                const playerNumber = index + 2;
                const isMandatory = index < 4;
                const isDuplicate =
                  member.nickname.trim() &&
                  duplicateNicknames.has(member.nickname.trim().toLowerCase());

                return (
                  <div
                    key={index}
                    className={[
                      "border-2 p-3 sm:p-3.5 transition-colors",
                      isDuplicate
                        ? "border-red-600 bg-red-50/50"
                        : "border-zinc-950 bg-zinc-50/60 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center border border-zinc-900 bg-zinc-200 font-mono text-[10px] font-bold text-zinc-900">
                          {playerNumber}
                        </span>
                        <span className="text-xs font-bold text-zinc-950 font-sans">
                          Combatant #{index + 1}
                        </span>
                      </div>

                      <Badge
                        variant={isMandatory ? "neutral" : "outline"}
                        size="xs"
                      >
                        {isMandatory ? "Required" : "Optional"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required={isMandatory}
                          placeholder={`Player ${playerNumber} Nickname ${
                            isMandatory ? "(Required)" : "(Optional)"
                          }`}
                          value={member.nickname}
                          onChange={(e) =>
                            handleMemberChange(index, "nickname", e.target.value)
                          }
                          className={[
                            "h-9 w-full border-2 bg-white px-3 text-xs placeholder:text-zinc-400 focus:outline-none transition",
                            isDuplicate
                              ? "border-red-600 bg-red-50/20 text-red-900"
                              : "border-zinc-900 focus:border-brand-600",
                          ].join(" ")}
                        />
                        {isDuplicate && (
                          <p className="mt-1 text-[10px] font-bold text-red-600">
                            Duplicate nickname
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          required={isMandatory}
                          placeholder={`Player ${playerNumber} Discord Tag ${
                            isMandatory ? "(Required)" : "(Optional)"
                          }`}
                          value={member.discordId}
                          onChange={(e) =>
                            handleMemberChange(index, "discordId", e.target.value)
                          }
                          className="h-9 w-full border-2 border-zinc-900 bg-white px-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 transition"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-zinc-950 bg-white p-4 comic-shadow">
            <div className="text-xs text-zinc-600">
              By submitting, your roster of{" "}
              <strong className="text-zinc-950 font-bold font-mono">{filledCount}</strong> players
              will enter <strong className="text-amber-800 font-bold">Pending</strong> review
              by guild leadership.
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={filledCount < 5 || filledCount > 8 || duplicateNicknames.size > 0}
              icon={UserPlus}
              className="w-full sm:w-auto"
            >
              Submit Registration ({filledCount}/8 Players)
            </Button>
          </div>
        </form>
      </main>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {submittedTeam && (
        <Modal
          open={Boolean(submittedTeam)}
          onClose={() => router.push("/valkyrie-cup/teams")}
          title="Registration Received!"
          description="Your team registration has been successfully submitted."
          icon={CheckCircle2}
          size="sm"
          footer={
            <div className="flex w-full items-center justify-end gap-2">
              <Link href="/valkyrie-cup/teams">
                <Button variant="secondary" size="sm">
                  View Squads Directory
                </Button>
              </Link>
              <Link href="/valkyrie-cup/my-registration">
                <Button variant="primary" size="sm">
                  Go to My Registration
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-xs text-zinc-700">
            <div className="border-2 border-emerald-700 bg-emerald-50/70 p-3.5 comic-shadow-sm">
              <div className="font-bold font-sans text-emerald-950 text-sm">
                {submittedTeam.teamName}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="neutral" size="xs">
                  {submittedTeam.guild}
                </Badge>
                <Badge variant="warning" size="xs" dot>
                  PENDING REVIEW
                </Badge>
              </div>
            </div>

            <p className="leading-relaxed">
              Your squad lineup has been submitted. It will immediately appear in the public
              Registered Squads list as <strong className="text-amber-800 font-bold">Pending</strong>.
              Once administrators complete review, its status will be updated to
              <strong className="text-emerald-800 font-bold"> Approved</strong>.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
