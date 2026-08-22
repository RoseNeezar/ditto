/**
 * The nine spreads in the hero sketchbook. The artwork lives in
 * `public/sketchbook/` and is drawn by `scripts/generate-sketchbook.mjs`;
 * the titles here have to match the ones painted onto the plates.
 */
export type Plate = {
  /** file under /sketchbook */
  file: string;
  title: string;
  /** the small-caps line in the index */
  place: string;
};

export const PLATES: Plate[] = [
  { file: "the-board.svg", title: "The Board", place: "Overview" },
  { file: "lists-in-motion.svg", title: "Lists in Motion", place: "Columns" },
  { file: "a-card-up-close.svg", title: "A Card, Up Close", place: "Anatomy" },
  { file: "drag-and-drop.svg", title: "Drag & Drop", place: "The gesture" },
  { file: "priority-marks.svg", title: "Priority Marks", place: "Triage" },
  { file: "hands-on-deck.svg", title: "Hands on Deck", place: "Assignees" },
  { file: "margin-notes.svg", title: "Margin Notes", place: "Comments" },
  { file: "the-round-trip.svg", title: "The Round Trip", place: "The stack" },
  { file: "ready-to-ship.svg", title: "Ready to Ship", place: "Done" },
];

export const plateUrl = (p: Plate) => `/sketchbook/${p.file}`;

/** the plate the intro riffle comes to rest on */
export const LANDING_PLATE = 5;
