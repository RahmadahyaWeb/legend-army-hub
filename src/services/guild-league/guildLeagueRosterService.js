import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

import { buildRosterSlotId } from "../../utils/guildLeague";

export async function updateGuildLeagueStatus(guildLeagueId, newStatus) {
  const data = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  if (newStatus === "open") {
    data.openedAt = serverTimestamp();
  }

  if (newStatus === "completed") {
    data.completedAt = serverTimestamp();
  }

  if (newStatus === "draft") {
    data.completedAt = null;
  }

  await updateDoc(doc(db, "guild_leagues", guildLeagueId), data);
}

export async function updateTeamLane(guildLeagueId, teamNumber, lane) {
  const reference = doc(
    db,
    "guild_leagues",
    guildLeagueId,
    "teams",
    `team-${Number(teamNumber)}`,
  );

  await setDoc(
    reference,
    {
      teamNumber: Number(teamNumber),
      lane: lane || "",
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

export async function removeRosterMember(guildLeagueId, member) {
  const memberId = String(member?.memberId || member?.id || "");

  if (!memberId) {
    throw new Error("Roster member ID is required.");
  }

  const teamNumber = Number(member.teamNumber);
  const slotNumber = Number(member.slotNumber);

  const slotId = member.slotId || buildRosterSlotId(teamNumber, slotNumber);

  const rosterReference = doc(
    db,
    "guild_leagues",
    guildLeagueId,
    "roster",
    memberId,
  );

  const slotReference = doc(
    db,
    "guild_leagues",
    guildLeagueId,
    "roster_slots",
    slotId,
  );

  const batch = writeBatch(db);

  batch.delete(rosterReference);
  batch.delete(slotReference);

  await batch.commit();

  return {
    memberId,
    slotId,
  };
}
