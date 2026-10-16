export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    // Already human readable
    if (dateStr.includes("AM") || dateStr.includes("PM")) {
      return dateStr;
    }
    const cleanStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const cleanStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
