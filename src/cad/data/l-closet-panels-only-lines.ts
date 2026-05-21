import type { EstimateLineInput } from "@/lib/types";

/** L-shaped shell — back panels only (with_panels system), no shelves/uprights. */
export const L_CLOSET_PANELS_ONLY_LINES: EstimateLineInput[] = [
  {
    line_id: "P01",
    room: "Wall 1 - left run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 900,
    notes: "C Schienale bay 1 (900mm)",
  },
  {
    line_id: "P02",
    room: "Wall 1 - left run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 900,
    notes: "C Schienale bay 2 (900mm)",
  },
  {
    line_id: "P03",
    room: "Wall 1 - left run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 900,
    notes: "C Schienale bay 3 (900mm)",
  },
  {
    line_id: "P04",
    room: "Wall 2 - return run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 800,
    notes: "C Schienale bay 800mm",
  },
  {
    line_id: "P05",
    room: "Wall 2 - return run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 640,
    notes: "C Schienale bay 640mm",
  },
  {
    line_id: "P06",
    room: "Wall 2 - return run",
    role: "back_panel",
    quantity: 1,
    h: 2187,
    l: 480,
    notes: "C Schienale bay 480mm",
  },
];
