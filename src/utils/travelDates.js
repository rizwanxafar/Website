// src/utils/travelDates.js

// Today's date as YYYY-MM-DD (local timezone-safe for our usage)
export const todayISO = new Date().toISOString().slice(0, 10);

// Overlap rule with same‑day handover allowed:
// A = [aStart, aEnd], B = [bStart, bEnd]
// Treat as overlapping ONLY if they truly intersect.
// If aEnd === bStart (handover the same day), NOT overlap.
export function rangesOverlapAllowTouch(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return !(aEnd <= bStart || bEnd <= aStart);
}

// Validate a single country's date range.
// Returns: "ok" | "incomplete" | "invalid-range" | "future-date"
export function validateCountryRange(arrival, leaving, today = todayISO) {
  if (!arrival || !leaving) return "incomplete";
  if (arrival > leaving) return "invalid-range";
  if (arrival > today || leaving > today) return "future-date";
  return "ok";
}

// Detect overlaps among a list of items with { id, arrival, leaving }.
// Only compares items with valid ranges (validate === "ok").
// Returns a Set of conflicting ids.
export function detectConflicts(items) {
  const conflicts = new Set();
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (validateCountryRange(a.arrival, a.leaving) !== "ok") continue;
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (validateCountryRange(b.arrival, b.leaving) !== "ok") continue;
      if (rangesOverlapAllowTouch(a.arrival, a.leaving, b.arrival, b.leaving)) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

// Sort items for display: earliest arrival first;
// completed ranges above incomplete; tie-break by leaving, then name.
export function sortSelected(items) {
  const copy = [...items];
  copy.sort((a, b) => {
    const aHas = a.arrival && a.leaving;
    const bHas = b.arrival && b.leaving;
    if (aHas && bHas) {
      if (a.arrival !== b.arrival) return a.arrival < b.arrival ? -1 : 1;
      if (a.leaving !== b.leaving) return a.leaving < b.leaving ? -1 : 1;
      return a.name.localeCompare(b.name);
    }
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return a.name.localeCompare(b.name);
  });
  return copy;
}

// Helper: whole days since the given ISO date (YYYY-MM-DD) up to 'today'.
export function daysSince(iso, today = todayISO) {
  if (!iso) return null;
  try {
    const d = new Date(iso + "T00:00:00");
    const t = new Date(today + "T00:00:00");
    const ms = t - d;
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
