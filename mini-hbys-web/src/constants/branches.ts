export const BRANCHES = [
  "Dahiliye",
  "Kardiyoloji",
  "Ortopedi",
  "Göz",
  "KBB",
] as const;

export type Branch = (typeof BRANCHES)[number];

export const BRANCH_OPTIONS = BRANCHES.map((b) => ({ value: b, label: b }));
export const BRANCH_FILTER_OPTIONS = [
  { value: "", label: "Tümü" },
  ...BRANCH_OPTIONS,
];
