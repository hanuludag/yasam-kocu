// localStorage persistence layer.
// Kept dumb on purpose: swap these functions for API calls when a real
// backend arrives, without touching any component code.

const STORAGE_KEYS = {
  tasks: "yasamkocu_tasks",
  dailyScores: "yasamkocu_daily_scores",
  yearlyGoals: "yasamkocu_yearly_goals",
  lastOpen: "yasamkocu_last_open",
  work: "yasamkocu_is",
  finance: "yasamkocu_finans",
  health: "yasamkocu_saglik",
  school: "yasamkocu_ders",
  journal: "yasamkocu_notlar_gunluk",
  weeklyGoals: "yasamkocu_weekly_goals",
  program: "yasamkocu_program",
  routines: "yasamkocu_routines",
  streakFreezes: "yasamkocu_streak_freezes",
  xp: "yasamkocu_xp",
  habitGoals: "yasamkocu_habit_goals",
  careerGoals: "yasamkocu_career_goals",
  customPages: "yasamkocu_custom_pages",
  enabledSections: "yasamkocu_enabled_sections",
  onboardingCompleted: "yasamkocu_onboarding_completed",
};

// Shared date-key helper: "YYYY-MM-DD" for `offset` days before today.
function dateKeyWithOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

// Local date as "YYYY-MM-DD" (not UTC — the user's day is what matters).
function getTodayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const PRIORITY_WEIGHTS = { Low: 5, Medium: 10, High: 15 };

// Session 23 — a fresh install starts with genuinely no tasks; the user
// builds their own day from here.
function emptyTasks() {
  return [];
}

// Parse a stored JSON value and validate its shape; returns null when the
// key is missing, unparsable, or not what the screen expects — callers then
// fall back to seeding instead of crashing on corrupt data.
function readValidated(key, isValid) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

function loadTasks() {
  const stored = readValidated(STORAGE_KEYS.tasks, Array.isArray);
  if (stored) return stored;
  const empty = emptyTasks();
  saveTasks(empty);
  return empty;
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

// --- Daily score history -----------------------------------------------------

// Same weighted formula as the Bugün screen (kept local so the rollover
// can run before any screen code is loaded).
function weightedScoreOf(tasks) {
  const total = tasks.reduce((sum, t) => sum + t.weight, 0);
  if (total === 0) return 0;
  const done = tasks.filter((t) => t.done).reduce((sum, t) => sum + t.weight, 0);
  return Math.round((done / total) * 100);
}

// Session 23 — no fabricated history; real scores accumulate from the
// daily rollover as the app is actually used, starting from zero.
function emptyDailyScores() {
  return [];
}

function loadDailyScores() {
  const stored = readValidated(STORAGE_KEYS.dailyScores, Array.isArray);
  if (stored) return stored;
  const empty = emptyDailyScores();
  saveDailyScores(empty);
  return empty;
}

function saveDailyScores(scores) {
  localStorage.setItem(STORAGE_KEYS.dailyScores, JSON.stringify(scores));
}

// On the first load of a new day, freeze the previous day's final score
// into dailyScores. Call once at app startup, before screens render.
function ensureDailyRollover() {
  const today = getTodayKey();
  const lastOpen = localStorage.getItem(STORAGE_KEYS.lastOpen);
  if (lastOpen && lastOpen !== today) {
    const tasks = loadTasks().filter((t) => t.date === lastOpen);
    if (tasks.length > 0) {
      const scores = loadDailyScores();
      if (!scores.some((s) => s.date === lastOpen)) {
        scores.push({ date: lastOpen, score: weightedScoreOf(tasks) });
        scores.sort((a, b) => a.date.localeCompare(b.date));
        saveDailyScores(scores);
      }
    }
  }
  localStorage.setItem(STORAGE_KEYS.lastOpen, today);
}

// --- Yearly goals ------------------------------------------------------------

function emptyYearlyGoals() {
  return [];
}

function loadYearlyGoals() {
  const stored = readValidated(STORAGE_KEYS.yearlyGoals, Array.isArray);
  if (stored) return stored;
  const empty = emptyYearlyGoals();
  saveYearlyGoals(empty);
  return empty;
}

function saveYearlyGoals(goals) {
  localStorage.setItem(STORAGE_KEYS.yearlyGoals, JSON.stringify(goals));
}

// --- Weekly goals ------------------------------------------------------------

function emptyWeeklyGoals() {
  return [];
}

function loadWeeklyGoals() {
  const stored = readValidated(STORAGE_KEYS.weeklyGoals, Array.isArray);
  if (stored) return stored;
  const empty = emptyWeeklyGoals();
  saveWeeklyGoals(empty);
  return empty;
}

function saveWeeklyGoals(goals) {
  localStorage.setItem(STORAGE_KEYS.weeklyGoals, JSON.stringify(goals));
}

// --- İş (Work) page ------------------------------------------------------------

// Session 23 — boardTasks/meetingNotes/hours logged start empty; only
// weeklyHoursTarget keeps a sensible default (a setting, not fabricated
// history), and interviewPrep keeps its blank template checklist (nothing
// is marked done, so it isn't pretend progress).
function defaultWorkData() {
  return {
    boardTasks: [],
    meetingNotes: [],
    weeklyHoursLogged: 0,
    weeklyHoursTarget: 40,
    interviewPrep: defaultInterviewPrep(),
  };
}

// Default prep items for the interview/raise checklist (editable, not AI).
// Defaults carry a translation `key` (resolved at render) so they follow the
// language toggle; user-added items store plain `text` instead.
function defaultInterviewPrep() {
  return {
    notes: "",
    checklist: [
      { id: "ip-1", key: "prep_cv", done: false },
      { id: "ip-2", key: "prep_salary", done: false },
      { id: "ip-3", key: "prep_questions", done: false },
      { id: "ip-4", key: "prep_research", done: false },
    ],
  };
}

function loadWorkData() {
  const stored = readValidated(STORAGE_KEYS.work, (d) =>
    d && Array.isArray(d.boardTasks) && Array.isArray(d.meetingNotes) &&
    typeof d.weeklyHoursLogged === "number" && typeof d.weeklyHoursTarget === "number"
  );
  if (stored) {
    // Migration: interview-prep section arrived with Session 19.
    if (!stored.interviewPrep || !Array.isArray(stored.interviewPrep.checklist)) {
      stored.interviewPrep = defaultInterviewPrep();
    }
    return stored;
  }
  const empty = defaultWorkData();
  saveWorkData(empty);
  return empty;
}

function saveWorkData(data) {
  localStorage.setItem(STORAGE_KEYS.work, JSON.stringify(data));
}

// --- Kariyer hedefleri (career goals) --------------------------------------------
// Same current/target progress pattern as yearlyGoals, scoped to career
// and skill development, shown on the İş page.

function emptyCareerGoals() {
  return [];
}

function loadCareerGoals() {
  const stored = readValidated(STORAGE_KEYS.careerGoals, Array.isArray);
  if (stored) return stored;
  const empty = emptyCareerGoals();
  saveCareerGoals(empty);
  return empty;
}

function saveCareerGoals(goals) {
  localStorage.setItem(STORAGE_KEYS.careerGoals, JSON.stringify(goals));
}

// --- Finans (Finance) page -----------------------------------------------------

// Session 23 — no transactions, no debts, no savings goal until the user
// adds their own; SavingsGoalCard already renders a create-form when
// savingsGoal is null.
function emptyFinanceData() {
  return {
    transactions: [],
    debts: [],
    savingsGoal: null,
    // Monthly snapshots of net worth ({month: "YYYY-MM", value}) accumulate
    // from the Finans screen going forward.
    netWorthHistory: [],
  };
}

function loadFinanceData() {
  const stored = readValidated(STORAGE_KEYS.finance, (d) =>
    d && Array.isArray(d.transactions) && Array.isArray(d.debts)
  );
  if (stored) {
    // Migration: monthly net-worth snapshots arrived with Session 16.
    if (!Array.isArray(stored.netWorthHistory)) stored.netWorthHistory = [];
    return stored;
  }
  const empty = emptyFinanceData();
  saveFinanceData(empty);
  return empty;
}

function saveFinanceData(data) {
  localStorage.setItem(STORAGE_KEYS.finance, JSON.stringify(data));
}

// --- Sağlık (Health) page ------------------------------------------------------

// Session 23 — every log starts empty; waterDailyTarget keeps a sensible
// default (a setting, not a fabricated entry). Real entries accumulate
// from manual logging only.
function defaultHealthData() {
  return {
    waterLog: [],
    waterDailyTarget: 8,
    workouts: [],
    sleepLog: [],
    nutritionLog: [],
    // {date, weightKg, measurements: {waist, chest, arm}, photoBase64}
    // photoBase64 lives in localStorage for now — fine for a handful of
    // small photos, but it does NOT scale (5MB quota, base64 overhead);
    // move to real file storage once a backend exists.
    bodyLog: [],
    // Session 28 — detailed nutrition & medication tracking:
    // manually entered daily targets; no auto-calculation anywhere.
    nutritionTargets: null, // {calories, protein, fat} once the user sets them
    nutritionEntries: [],   // {id, date, description, calories, protein, fat}
    mealPlans: [],          // {date, slots: {slotName: {text, done}}}
    medications: [],        // {id, name, timeOfDay, recurring}
    medicationLog: [],      // {date, medicationId} — daily check-offs
    sugarLog: [],           // {date, ate: boolean, note}
  };
}

function loadHealthData() {
  const stored = readValidated(STORAGE_KEYS.health, (d) =>
    d && Array.isArray(d.waterLog) && Array.isArray(d.workouts) &&
    Array.isArray(d.sleepLog) && typeof d.waterDailyTarget === "number"
  );
  if (stored) {
    // Migrations: nutritionLog (post-release), bodyLog (Session 17),
    // nutrition/meal/medication/sugar structures (Session 28).
    if (!Array.isArray(stored.nutritionLog)) stored.nutritionLog = [];
    if (!Array.isArray(stored.bodyLog)) stored.bodyLog = [];
    if (stored.nutritionTargets === undefined) stored.nutritionTargets = null;
    if (!Array.isArray(stored.nutritionEntries)) stored.nutritionEntries = [];
    if (!Array.isArray(stored.mealPlans)) stored.mealPlans = [];
    if (!Array.isArray(stored.medications)) stored.medications = [];
    if (!Array.isArray(stored.medicationLog)) stored.medicationLog = [];
    if (!Array.isArray(stored.sugarLog)) stored.sugarLog = [];
    return stored;
  }
  const empty = defaultHealthData();
  saveHealthData(empty);
  return empty;
}

function saveHealthData(data) {
  localStorage.setItem(STORAGE_KEYS.health, JSON.stringify(data));
}

// --- Ders (School) page ----------------------------------------------------------

function emptySchoolData() {
  return {
    courses: [],
    assignments: [],
    exams: [],
    studyLog: [],
    flashcards: [],
  };
}

function loadSchoolData() {
  const stored = readValidated(STORAGE_KEYS.school, (d) =>
    d && Array.isArray(d.courses) && Array.isArray(d.assignments) &&
    Array.isArray(d.exams) && Array.isArray(d.studyLog)
  );
  if (stored) {
    // Migration: flashcards arrived with Session 18.
    if (!Array.isArray(stored.flashcards)) stored.flashcards = [];
    return stored;
  }
  const empty = emptySchoolData();
  saveSchoolData(empty);
  return empty;
}

function saveSchoolData(data) {
  localStorage.setItem(STORAGE_KEYS.school, JSON.stringify(data));
}

// --- Flashcard aralıklı tekrar (simplified SM-2) -----------------------------------
// Pure algorithm, no AI: the user's own recall rating adjusts the ease
// factor and the review interval, then the next due date is computed.
// (AI ile flashcard üretme — generating cards from notes/PDFs — is
// deferred; it genuinely needs an AI model.)

function reviewFlashcard(card, rating) {
  let ease = card.easeFactor;
  let interval = card.intervalDays;
  if (rating === "hard") {
    // Forgot / struggled: relearn from scratch, make the card "harder".
    ease = Math.max(1.3, ease - 0.2);
    interval = 1;
  } else if (rating === "medium") {
    interval = Math.max(1, Math.round(interval * ease));
  } else {
    // Easy: grow the ease and jump further ahead.
    ease = ease + 0.15;
    interval = Math.max(2, Math.round(interval * ease * 1.3));
  }
  return {
    ...card,
    easeFactor: Math.round(ease * 100) / 100,
    intervalDays: interval,
    dueDate: dateKeyWithOffset(-interval), // negative offset = future date
  };
}

// --- Notlar & Günlük (Notes & Journal) page ---------------------------------------

function emptyJournalData() {
  return {
    notes: [],
    journalEntries: [],
    books: [],
  };
}

function loadJournalData() {
  const stored = readValidated(STORAGE_KEYS.journal, (d) =>
    d && Array.isArray(d.notes) && Array.isArray(d.journalEntries) && Array.isArray(d.books)
  );
  if (stored) return stored;
  const empty = emptyJournalData();
  saveJournalData(empty);
  return empty;
}

function saveJournalData(data) {
  localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(data));
}

// --- Program (weekly & monthly plan) page ------------------------------------

function emptyProgramData() {
  return {
    // weekly: recurring entries; day is 0 (Monday) .. 6 (Sunday)
    weekly: [],
    // monthly: one-off dated entries
    monthly: [],
  };
}

function loadProgramData() {
  const stored = readValidated(STORAGE_KEYS.program, (d) =>
    d && Array.isArray(d.weekly) && Array.isArray(d.monthly)
  );
  if (stored) return stored;
  const empty = emptyProgramData();
  saveProgramData(empty);
  return empty;
}

function saveProgramData(data) {
  localStorage.setItem(STORAGE_KEYS.program, JSON.stringify(data));
}

// --- Rutinler (routines) -------------------------------------------------------

function emptyRoutines() {
  return [];
}

function loadRoutines() {
  const stored = readValidated(STORAGE_KEYS.routines, Array.isArray);
  if (stored) return stored;
  const empty = emptyRoutines();
  saveRoutines(empty);
  return empty;
}

function saveRoutines(routines) {
  localStorage.setItem(STORAGE_KEYS.routines, JSON.stringify(routines));
}

// --- Boş sayfalar (custom pages, Session 22) ------------------------------------
// Minimal block-editor pages: {id, title, blocks: [{id, type, content}]}.
// type: "text" | "heading" (content = string) or "checklist"
// (content = [{id, text, done}]). Deliberately NOT the full Notion-style
// system — no rich text, embeds, tables, nesting or drag-and-drop; those
// are future refinements of this same feature.

function loadCustomPages() {
  return readValidated(STORAGE_KEYS.customPages, Array.isArray) || [];
}

function saveCustomPages(pages) {
  localStorage.setItem(STORAGE_KEYS.customPages, JSON.stringify(pages));
}

// --- Bölüm seçimi (enabledSections, Session 23) ---------------------------------
// General-purpose, page-keyed "which optional sections does this user want
// to see" store: { saglik: [...keys], bugun: [...keys], hedefler: [...keys] }.
// Built generically from the start so Session 32 can wire Bugün/Hedefler
// into the exact same mechanism instead of a Sağlık-only structure.

// Fallback defaults used only when the user hasn't made an explicit choice
// yet (skipped onboarding, or used the app before this system existed) —
// chosen to match the sections that existed before Session 28's additions,
// so nobody's view silently changes on upgrade.
const DEFAULT_ENABLED_SECTIONS = {
  saglik: ["water", "workouts", "sleep", "body"],
  // Bugün defaults: the everyday helpers on, Pomodoro & Eisenhower matrix
  // off (niche — added on demand). Session 32.
  bugun: ["reminders", "routines", "dayClosing"],
  // Hedefler defaults: everything except gamification (XP/levels stays off
  // by default to fit the calm, non-childish design). Session 32.
  hedefler: ["streakFreeze", "heatmap", "habitStrength", "frequencyGoals"],
};

function loadEnabledSectionsMap() {
  return readValidated(STORAGE_KEYS.enabledSections, (v) => v && typeof v === "object" && !Array.isArray(v)) || {};
}

function saveEnabledSectionsMap(map) {
  localStorage.setItem(STORAGE_KEYS.enabledSections, JSON.stringify(map));
}

function getEnabledSections(page) {
  const map = loadEnabledSectionsMap();
  if (Array.isArray(map[page])) return map[page];
  return DEFAULT_ENABLED_SECTIONS[page] || [];
}

function setEnabledSections(page, keys) {
  const map = loadEnabledSectionsMap();
  map[page] = keys;
  saveEnabledSectionsMap(map);
}

function addEnabledSection(page, key) {
  const current = getEnabledSections(page);
  if (!current.includes(key)) setEnabledSections(page, [...current, key]);
}

function removeEnabledSection(page, key) {
  setEnabledSections(page, getEnabledSections(page).filter((k) => k !== key));
}

// --- Onboarding tamamlandı bayrağı (Session 26 prep) -----------------------------

function isOnboardingCompleted() {
  return localStorage.getItem(STORAGE_KEYS.onboardingCompleted) === "true";
}

function markOnboardingCompleted() {
  localStorage.setItem(STORAGE_KEYS.onboardingCompleted, "true");
}

// --- Gün kapanış ritüeli (day-closing reflection) ------------------------------
// Reflections live inside dailyScores entries so they travel with that day's
// score. Today's entry may not exist yet (ensureDailyRollover only writes it
// the next time the app opens), so we create/update it directly here.
function saveReflection(date, score, reflection) {
  const scores = loadDailyScores();
  const idx = scores.findIndex((s) => s.date === date);
  if (idx >= 0) scores[idx] = { ...scores[idx], score, reflection };
  else {
    scores.push({ date, score, reflection });
    scores.sort((a, b) => a.date.localeCompare(b.date));
  }
  saveDailyScores(scores);
}

function getReflection(date) {
  const entry = loadDailyScores().find((s) => s.date === date);
  return (entry && entry.reflection) || null;
}

// --- Gerçek seri (streak) hesaplama ---------------------------------------------

function prevDateKey(dateKey) {
  const d = new Date(dateKey + "T00:00");
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

// Consecutive qualifying days walking backward from `fromDate`. `liveScore`
// lets the caller inject today's in-progress score, since today usually
// isn't in `scores` yet (rollover only writes yesterday's final score).
// A frozen date (streak freeze spent on it) counts as qualifying even when
// it's missing or below the threshold.
function computeCurrentStreak(scores, fromDate, liveScore, threshold = 50, frozenDates = []) {
  const map = new Map(scores.map((s) => [s.date, s.score]));
  if (liveScore !== undefined) map.set(fromDate, liveScore);
  const frozen = new Set(frozenDates);
  const qualifies = (c) => (map.has(c) && map.get(c) >= threshold) || frozen.has(c);
  let cursor = fromDate;
  // Grace for an unfinished day: if fromDate doesn't qualify yet, the streak
  // isn't broken — it just doesn't include that day. Count from the day before.
  if (!qualifies(cursor)) cursor = prevDateKey(cursor);
  let streak = 0;
  while (qualifies(cursor)) {
    streak++;
    cursor = prevDateKey(cursor);
  }
  return streak;
}

function computeLongestStreak(scores, threshold = 50, frozenDates = []) {
  // Qualifying set = days at/above threshold + frozen days, then find the
  // longest run of consecutive dates in that set.
  const qualifying = new Set(frozenDates);
  scores.forEach((s) => { if (s.score >= threshold) qualifying.add(s.date); });
  let longest = 0;
  qualifying.forEach((date) => {
    if (qualifying.has(prevDateKey(date))) return; // not a run start
    let length = 0;
    let cursor = date;
    while (qualifying.has(cursor)) {
      length++;
      const d = new Date(cursor + "T00:00");
      d.setDate(d.getDate() + 1);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      cursor = `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
    }
    longest = Math.max(longest, length);
  });
  return longest;
}

// --- Seri dondurma (streak freeze) ------------------------------------------------
// A freeze is "spent" on a specific missed date so it doesn't break the
// streak. Allowance is per calendar month of the frozen date.

const STREAK_FREEZES_PER_MONTH = 2;

function loadStreakFreezes() {
  return readValidated(STORAGE_KEYS.streakFreezes, Array.isArray) || [];
}

function saveStreakFreezes(dates) {
  localStorage.setItem(STORAGE_KEYS.streakFreezes, JSON.stringify(dates));
}

function freezesLeftInMonth(freezes, monthPrefix) {
  const used = freezes.filter((d) => d.startsWith(monthPrefix)).length;
  return Math.max(0, STREAK_FREEZES_PER_MONTH - used);
}

// --- XP / seviye -------------------------------------------------------------------
// Understated gamification: each completed task banks XP equal to its
// weight; every 500 XP is one level. Unticking a task takes the XP back.

const XP_PER_LEVEL = 500;

function loadXp() {
  const stored = readValidated(STORAGE_KEYS.xp, (v) => typeof v === "number" && v >= 0);
  return stored === null ? 0 : stored;
}

function addXp(delta) {
  const next = Math.max(0, loadXp() + delta);
  localStorage.setItem(STORAGE_KEYS.xp, JSON.stringify(next));
  return next;
}

function levelOf(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

// --- Esnek sıklık hedefleri (habit goals) -------------------------------------------
// "Haftada 3 gün spor" style goals: a weekly day-count target with a log of
// the dates it was done, instead of a single current/target number.

function emptyHabitGoals() {
  return [];
}

function loadHabitGoals() {
  const stored = readValidated(STORAGE_KEYS.habitGoals, Array.isArray);
  if (stored) return stored;
  const empty = emptyHabitGoals();
  saveHabitGoals(empty);
  return empty;
}

function saveHabitGoals(goals) {
  localStorage.setItem(STORAGE_KEYS.habitGoals, JSON.stringify(goals));
}

// --- Alışkanlık gücü ----------------------------------------------------------------
// Per category: % of the last 30 days with at least one completed task in
// that category. Unlike a streak, one missed day only dents it slightly.

function computeHabitStrength(tasks, categoryLabelTr, days = 30) {
  const doneDates = new Set(
    tasks.filter((tk) => tk.done && tk.category === categoryLabelTr).map((tk) => tk.date)
  );
  let hit = 0;
  for (let i = 0; i < days; i++) {
    if (doneDates.has(dateKeyWithOffset(i))) hit++;
  }
  return Math.round((hit / days) * 100);
}
