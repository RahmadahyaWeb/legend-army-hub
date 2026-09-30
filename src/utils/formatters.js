// Shared formatting and normalization utilities

export function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString("en-US");
}

export function formatGearScore(value) {
  const number = Number(value);
  if (!number || Number.isNaN(number)) return "0";
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(".0", "")}K`;
  }
  return formatNumber(number);
}

export function getDateValue(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(timestamp, formatType = "long") {
  const date = getDateValue(timestamp);
  if (!date) return "—";

  if (formatType === "short") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  if (formatType === "time") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function isMemberActive(member) {
  if (typeof member.isActive === "boolean") return member.isActive;
  if (typeof member.active === "boolean") return member.active;
  if (typeof member.status === "string") return member.status.toLowerCase() === "active";
  return true;
}

export function normalizeClassName(member) {
  return member.className || member.class || member.job || "Unknown";
}
