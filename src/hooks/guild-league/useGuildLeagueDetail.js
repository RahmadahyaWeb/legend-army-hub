import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

import {
  buildTeamGroups,
  buildTeamLaneMap,
  getActiveTeamCount,
  getAssignedMemberIds,
  getRosterPercentage,
} from "../../utils/guildLeague";

export default function useGuildLeagueDetail(guildLeagueId) {
  const [guildLeague, setGuildLeague] = useState(null);
  const [rosterMembers, setRosterMembers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [notFound, setNotFound] = useState(false);

  const [eventError, setEventError] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [teamsError, setTeamsError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Guild League
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!guildLeagueId) {
      setGuildLeague(null);
      setNotFound(true);
      setLoadingEvent(false);

      return undefined;
    }

    setLoadingEvent(true);

    const reference = doc(db, "guild_leagues", guildLeagueId);

    const unsubscribe = onSnapshot(
      reference,

      (snapshot) => {
        if (!snapshot.exists()) {
          setGuildLeague(null);
          setNotFound(true);
          setEventError("");
          setLoadingEvent(false);

          return;
        }

        setGuildLeague({
          id: snapshot.id,
          ...snapshot.data(),
        });

        setNotFound(false);
        setEventError("");
        setLoadingEvent(false);
      },

      (snapshotError) => {
        console.error("Failed to load Guild League:", snapshotError);

        setEventError("Failed to load Guild League event.");

        setLoadingEvent(false);
      },
    );

    return unsubscribe;
  }, [guildLeagueId]);

  /*
  |--------------------------------------------------------------------------
  | Roster
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!guildLeagueId) {
      setRosterMembers([]);
      setLoadingRoster(false);

      return undefined;
    }

    setLoadingRoster(true);

    const reference = collection(db, "guild_leagues", guildLeagueId, "roster");

    const unsubscribe = onSnapshot(
      reference,

      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        data.sort((first, second) => {
          const teamDifference =
            Number(first.teamNumber) - Number(second.teamNumber);

          if (teamDifference !== 0) {
            return teamDifference;
          }

          return Number(first.slotNumber) - Number(second.slotNumber);
        });

        setRosterMembers(data);
        setRosterError("");
        setLoadingRoster(false);
      },

      (snapshotError) => {
        console.error("Failed to load Guild League roster:", snapshotError);

        setRosterError("Failed to load Guild League roster.");

        setLoadingRoster(false);
      },
    );

    return unsubscribe;
  }, [guildLeagueId]);

  /*
  |--------------------------------------------------------------------------
  | Teams
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!guildLeagueId) {
      setTeams([]);
      setLoadingTeams(false);

      return undefined;
    }

    setLoadingTeams(true);

    const reference = collection(db, "guild_leagues", guildLeagueId, "teams");

    const unsubscribe = onSnapshot(
      reference,

      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        data.sort(
          (first, second) =>
            Number(first.teamNumber) - Number(second.teamNumber),
        );

        setTeams(data);
        setTeamsError("");
        setLoadingTeams(false);
      },

      (snapshotError) => {
        console.error("Failed to load team lanes:", snapshotError);

        setTeamsError("Failed to load team lanes.");

        setLoadingTeams(false);
      },
    );

    return unsubscribe;
  }, [guildLeagueId]);

  /*
  |--------------------------------------------------------------------------
  | Derived Data
  |--------------------------------------------------------------------------
  */

  const maxTeams = useMemo(
    () => Number(guildLeague?.maxTeams) || 12,
    [guildLeague],
  );

  const membersPerTeam = useMemo(
    () => Number(guildLeague?.membersPerTeam) || 5,
    [guildLeague],
  );

  const maxRoster = useMemo(
    () => Number(guildLeague?.maxRoster) || maxTeams * membersPerTeam,
    [guildLeague, maxTeams, membersPerTeam],
  );

  const teamLaneMap = useMemo(() => buildTeamLaneMap(teams), [teams]);

  const teamGroups = useMemo(
    () => buildTeamGroups(maxTeams, teamLaneMap),
    [maxTeams, teamLaneMap],
  );

  const rosterCount = rosterMembers.length;

  const teamCount = useMemo(
    () => getActiveTeamCount(rosterMembers),
    [rosterMembers],
  );

  const assignedMemberIds = useMemo(
    () => getAssignedMemberIds(rosterMembers),
    [rosterMembers],
  );

  const rosterPercentage = useMemo(
    () => getRosterPercentage(rosterCount, maxRoster),
    [rosterCount, maxRoster],
  );

  const openSlots = Math.max(0, maxRoster - rosterCount);

  const loading = loadingEvent || loadingRoster || loadingTeams;

  const error = eventError || rosterError || teamsError;

  /*
  |--------------------------------------------------------------------------
  | Synchronize Counters
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!guildLeagueId || !guildLeague || loadingRoster || rosterError) {
      return;
    }

    const storedRosterCount = Number(guildLeague.rosterCount) || 0;

    const storedTeamCount = Number(guildLeague.teamCount) || 0;

    if (storedRosterCount === rosterCount && storedTeamCount === teamCount) {
      return;
    }

    updateDoc(doc(db, "guild_leagues", guildLeagueId), {
      rosterCount,
      teamCount,
      updatedAt: serverTimestamp(),
    }).catch((updateError) => {
      console.error("Failed to synchronize roster counters:", updateError);
    });
  }, [
    guildLeague,
    guildLeagueId,
    loadingRoster,
    rosterError,
    rosterCount,
    teamCount,
  ]);

  return {
    guildLeague,
    rosterMembers,
    teams,

    maxTeams,
    membersPerTeam,
    maxRoster,

    teamLaneMap,
    teamGroups,

    rosterCount,
    teamCount,
    assignedMemberIds,
    rosterPercentage,
    openSlots,

    loading,
    loadingEvent,
    loadingRoster,
    loadingTeams,

    notFound,

    error,
    eventError,
    rosterError,
    teamsError,
  };
}
