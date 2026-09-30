import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, MapPin, Shield, Swords, Users } from "lucide-react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "../lib/firebase";

const LANE_CONFIG = {
  top: {
    label: "Top Lane",
    shortLabel: "TOP",
    headerClassName: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
  },

  mid: {
    label: "Mid Lane",
    shortLabel: "MID",
    headerClassName: "border-blue-200 bg-blue-50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },

  bot: {
    label: "Bot Lane",
    shortLabel: "BOT",
    headerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function getTeamMembers(rosterMembers, teamNumber) {
  return rosterMembers
    .filter((member) => Number(member.teamNumber) === Number(teamNumber))
    .sort(
      (first, second) => Number(first.slotNumber) - Number(second.slotNumber),
    );
}

function PublicTeamCard({ teamNumber, lane, rosterMembers }) {
  const members = useMemo(
    () => getTeamMembers(rosterMembers, teamNumber),
    [rosterMembers, teamNumber],
  );

  const averageGearScore = useMemo(() => {
    if (members.length === 0) {
      return 0;
    }

    const total = members.reduce(
      (sum, member) => sum + (Number(member.gearScore) || 0),
      0,
    );

    return Math.round(total / members.length);
  }, [members]);

  const laneConfig = LANE_CONFIG[lane];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              laneConfig.iconClassName,
            ].join(" ")}
          >
            <Shield className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">
                Team {teamNumber}
              </h3>

              <span
                className={[
                  "rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
                  laneConfig.badgeClassName,
                ].join(" ")}
              >
                {laneConfig.shortLabel}
              </span>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              {members.length} players
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-bold tabular-nums text-zinc-900">
            {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
          </div>

          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Avg. GR
          </div>
        </div>
      </div>

      {members.length > 0 ? (
        <div className="divide-y divide-zinc-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-3 sm:px-5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-700">
                {member.slotNumber}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900">
                  {member.nickname}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                  <span>{member.className || "Unknown class"}</span>

                  <span className="text-zinc-300">·</span>

                  <span>Lv. {member.level || "—"}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-bold tabular-nums text-zinc-900">
                  {formatNumber(member.gearScore)}
                </div>

                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  GR
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center text-sm text-zinc-400">
          No players assigned
        </div>
      )}
    </div>
  );
}

function LaneSection({ lane, teamNumbers, rosterMembers }) {
  if (teamNumbers.length === 0) {
    return null;
  }

  const config = LANE_CONFIG[lane];

  const playerCount = teamNumbers.reduce(
    (total, teamNumber) =>
      total + getTeamMembers(rosterMembers, teamNumber).length,
    0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      <div
        className={["border-b px-4 py-4 sm:px-6", config.headerClassName].join(
          " ",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                config.iconClassName,
              ].join(" ")}
            >
              <MapPin className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 sm:text-base">
                {config.label}
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                {teamNumbers.length}{" "}
                {teamNumbers.length === 1 ? "team" : "teams"}
                {" · "}
                {playerCount} players
              </p>
            </div>
          </div>

          <span
            className={[
              "rounded-lg border px-2.5 py-1 text-xs font-bold tracking-wider",
              config.badgeClassName,
            ].join(" ")}
          >
            {config.shortLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
        {teamNumbers.map((teamNumber) => (
          <PublicTeamCard
            key={teamNumber}
            teamNumber={teamNumber}
            lane={lane}
            rosterMembers={rosterMembers}
          />
        ))}
      </div>
    </section>
  );
}

export default function PublicRoster() {
  const { guildLeagueId } = useParams();

  const [guildLeague, setGuildLeague] = useState(null);

  const [rosterMembers, setRosterMembers] = useState([]);

  const [teams, setTeams] = useState([]);

  const [loadingEvent, setLoadingEvent] = useState(true);

  const [loadingRoster, setLoadingRoster] = useState(true);

  const [loadingTeams, setLoadingTeams] = useState(true);

  const [notFound, setNotFound] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!guildLeagueId) {
      setGuildLeague(null);
      setRosterMembers([]);
      setTeams([]);

      setNotFound(true);

      setLoadingEvent(false);
      setLoadingRoster(false);
      setLoadingTeams(false);

      return undefined;
    }

    let cancelled = false;

    const loadPublicRoster = async () => {
      setLoadingEvent(true);
      setLoadingRoster(true);
      setLoadingTeams(true);

      setNotFound(false);
      setError("");

      try {
        /*
          |--------------------------------------------------------------------------
          | Guild League
          |--------------------------------------------------------------------------
          */

        const guildLeagueReference = doc(db, "guild_leagues", guildLeagueId);

        const guildLeagueSnapshot = await getDoc(guildLeagueReference);

        if (cancelled) {
          return;
        }

        if (!guildLeagueSnapshot.exists()) {
          setGuildLeague(null);
          setRosterMembers([]);
          setTeams([]);

          setNotFound(true);

          return;
        }

        setGuildLeague({
          id: guildLeagueSnapshot.id,
          ...guildLeagueSnapshot.data(),
        });

        /*
          |--------------------------------------------------------------------------
          | Roster + Teams
          |--------------------------------------------------------------------------
          */

        const rosterReference = collection(
          db,
          "guild_leagues",
          guildLeagueId,
          "roster",
        );

        const teamsReference = collection(
          db,
          "guild_leagues",
          guildLeagueId,
          "teams",
        );

        const [rosterSnapshot, teamsSnapshot] = await Promise.all([
          getDocs(rosterReference),
          getDocs(teamsReference),
        ]);

        if (cancelled) {
          return;
        }

        /*
          |--------------------------------------------------------------------------
          | Roster
          |--------------------------------------------------------------------------
          */

        const rosterData = rosterSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        rosterData.sort((first, second) => {
          const teamDifference =
            Number(first.teamNumber) - Number(second.teamNumber);

          if (teamDifference !== 0) {
            return teamDifference;
          }

          return Number(first.slotNumber) - Number(second.slotNumber);
        });

        setRosterMembers(rosterData);

        /*
          |--------------------------------------------------------------------------
          | Teams
          |--------------------------------------------------------------------------
          */

        const teamsData = teamsSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        teamsData.sort(
          (first, second) =>
            Number(first.teamNumber) - Number(second.teamNumber),
        );

        setTeams(teamsData);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load public Guild League roster:", loadError);

        setError("Failed to load roster.");
      } finally {
        if (!cancelled) {
          setLoadingEvent(false);
          setLoadingRoster(false);
          setLoadingTeams(false);
        }
      }
    };

    loadPublicRoster();

    return () => {
      cancelled = true;
    };
  }, [guildLeagueId]);

  const teamLaneMap = useMemo(() => {
    const map = new Map();

    teams.forEach((team) => {
      map.set(Number(team.teamNumber), team.lane || "");
    });

    return map;
  }, [teams]);

  const laneGroups = useMemo(() => {
    const groups = {
      top: [],
      mid: [],
      bot: [],
    };

    teams.forEach((team) => {
      const teamNumber = Number(team.teamNumber);

      const lane = team.lane;

      if (lane === "top" || lane === "mid" || lane === "bot") {
        groups[lane].push(teamNumber);
      }
    });

    Object.keys(groups).forEach((lane) => {
      groups[lane].sort((first, second) => first - second);
    });

    return groups;
  }, [teams]);

  const assignedTeams = useMemo(() => {
    const teamNumbers = new Set();

    rosterMembers.forEach((member) => {
      const teamNumber = Number(member.teamNumber);

      const lane = teamLaneMap.get(teamNumber);

      if (lane === "top" || lane === "mid" || lane === "bot") {
        teamNumbers.add(teamNumber);
      }
    });

    return teamNumbers.size;
  }, [rosterMembers, teamLaneMap]);

  const averageGearScore = useMemo(() => {
    if (rosterMembers.length === 0) {
      return 0;
    }

    const total = rosterMembers.reduce(
      (sum, member) => sum + (Number(member.gearScore) || 0),
      0,
    );

    return Math.round(total / rosterMembers.length);
  }, [rosterMembers]);

  const loading = loadingEvent || loadingRoster || loadingTeams;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-700 shadow-sm">
            <Shield className="size-5 text-white" />
          </div>

          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <Shield className="mx-auto size-8 text-red-700" />

          <h1 className="mt-4 text-lg font-bold text-zinc-900">
            Roster unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (notFound || !guildLeague) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <Shield className="mx-auto size-8 text-zinc-400" />

          <h1 className="mt-4 text-lg font-bold text-zinc-900">
            Roster not found
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            This Guild League roster does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Legend Army"
              className="size-9 object-contain"
            />

            <div>
              <div className="text-sm font-bold tracking-tight text-zinc-900">
                LEGEND ARMY
              </div>

              <div className="text-xs text-zinc-500">Guild League Roster</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 sm:flex">
                <Swords className="size-5 text-red-700" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                  Guild League
                </div>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  {guildLeague.name}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                  <CalendarDays className="size-4 shrink-0" />

                  {formatDate(guildLeague.eventDate)}
                </div>

                {guildLeague.notes && (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600">
                    {guildLeague.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-200">
            <div className="px-3 py-4 text-center sm:px-6">
              <div className="text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
                {rosterMembers.length}
              </div>

              <div className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Players
              </div>
            </div>

            <div className="px-3 py-4 text-center sm:px-6">
              <div className="text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
                {assignedTeams}
              </div>

              <div className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Teams
              </div>
            </div>

            <div className="px-3 py-4 text-center sm:px-6">
              <div className="text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
                {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
              </div>

              <div className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Avg. GR
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <LaneSection
            lane="top"
            teamNumbers={laneGroups.top}
            rosterMembers={rosterMembers}
          />

          <LaneSection
            lane="mid"
            teamNumbers={laneGroups.mid}
            rosterMembers={rosterMembers}
          />

          <LaneSection
            lane="bot"
            teamNumbers={laneGroups.bot}
            rosterMembers={rosterMembers}
          />
        </div>

        {laneGroups.top.length === 0 &&
          laneGroups.mid.length === 0 &&
          laneGroups.bot.length === 0 && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-12 text-center shadow-sm">
              <Users className="mx-auto size-7 text-zinc-400" />

              <h2 className="mt-4 text-sm font-semibold text-zinc-900">
                Roster is being prepared
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                No teams have been assigned to a lane yet.
              </p>
            </div>
          )}

        <footer className="py-8 text-center text-xs text-zinc-400">
          Legend Army · Guild League Roster · Made by XKG
        </footer>
      </main>
    </div>
  );
}
