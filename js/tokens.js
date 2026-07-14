// Design tokens for Yasam Kocu.
// Single source of truth for colors and category metadata used by components.
// UI-facing labels are Turkish; keys and code are English.

const TOKENS = {
  colors: {
    neutrals: [
      { name: "Background", hex: "#F5F3EE" },
      { name: "Card Surface", hex: "#FFFFFF" },
      { name: "Ink / Text", hex: "#1C1B19" },
      { name: "Muted Text", hex: "#8A877E" },
      { name: "Border", hex: "#E7E5DE" },
    ],
    // Reserved exclusively for the future AI coach feature — not used in UI yet.
    accent: { name: "Indigo (AI — rezerve)", hex: "#4F46E5" },
  },
};

// Category registry: id/icon are English, label is the Turkish UI text.
const CATEGORIES = [
  { id: "study",    label: "Ders",    color: "#7C93B3", icon: "BookOpen" },
  { id: "sport",    label: "Spor",    color: "#829A78", icon: "Dumbbell" },
  { id: "worship",  label: "İbadet",  color: "#B99A5B", icon: "Moon" },
  { id: "work",     label: "İş",      color: "#B08268", icon: "Briefcase" },
  { id: "personal", label: "Kişisel", color: "#A084A0", icon: "User" },
];

// Session 23 — Sağlık's independently addable sub-sections. Used by both
// onboarding (section-level picks) and the Sağlık screen's "+ Bölüm ekle"
// control, so the two stay in sync automatically. nutrition/mealPlan/
// medications/sugar get their actual UI cards in Session 28 — until then
// selecting them just records the preference, nothing renders yet.
const HEALTH_SECTIONS = [
  { key: "water",       labelKey: "hs_water",       icon: "GlassWater" },
  { key: "workouts",    labelKey: "hs_workouts",    icon: "Dumbbell" },
  { key: "sleep",       labelKey: "hs_sleep",       icon: "Moon" },
  { key: "body",        labelKey: "hs_body",        icon: "Ruler" },
  { key: "nutrition",   labelKey: "hs_nutrition",   icon: "Apple" },
  { key: "mealPlan",    labelKey: "hs_mealplan",    icon: "UtensilsCrossed" },
  { key: "medications", labelKey: "hs_medications", icon: "Pill" },
  { key: "sugar",       labelKey: "hs_sugar",       icon: "Candy" },
];

// Session 32 — Bugün's optional sections. Core parts (time-grid, score
// ring, add-task, streak badge) are always present and NOT listed here.
const BUGUN_SECTIONS = [
  { key: "reminders",  labelKey: "bs_reminders",  icon: "Bell" },
  { key: "pomodoro",   labelKey: "bs_pomodoro",   icon: "Timer" },
  { key: "matrix",     labelKey: "bs_matrix",     icon: "LayoutGrid" },
  { key: "routines",   labelKey: "bs_routines",   icon: "Repeat" },
  { key: "dayClosing", labelKey: "bs_dayclosing", icon: "MoonStar" },
];

// Session 32 — Hedefler's optional sections. Core parts (stat cards,
// weekly chart, yearly goals) are always present and NOT listed here.
const HEDEFLER_SECTIONS = [
  { key: "streakFreeze",   labelKey: "gs_freeze",       icon: "Snowflake" },
  { key: "heatmap",        labelKey: "gs_heatmap",      icon: "Grid3x3" },
  { key: "habitStrength",  labelKey: "gs_habit",        icon: "Activity" },
  { key: "frequencyGoals", labelKey: "gs_frequency",    icon: "CalendarCheck" },
  { key: "gamification",   labelKey: "gs_gamification", icon: "Sparkles" },
];
