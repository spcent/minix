export function formatProgressTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return "No progress saved yet";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "Saved just now";
  }
}
