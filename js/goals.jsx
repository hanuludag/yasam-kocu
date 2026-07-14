// "Hedefler" (Goals) screen: score summaries, weekly chart, real streak
// with monthly freeze rights, understated XP/level badge, 90-day heatmap,
// per-category habit strength, frequency-style habit goals, and the
// weekly/yearly goal lists.

function dateKeyOf(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Monday..Sunday of the current week as date keys.
function currentWeekKeys() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return t("weekdays").map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, key: dateKeyOf(d) };
  });
}

function average(nums) {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// --- Summary stat cards --------------------------------------------------------

const StatCard = ({ label, value }) => (
  <Card className="stat-card">
    <p className="stat-card-value">{value === null ? "—" : formatPct(value)}</p>
    <p className="stat-card-label">{label}</p>
  </Card>
);

// --- Weekly chart ----------------------------------------------------------------

const WeeklyChart = ({ dailyScores, todayScore, currentStreak, longestStreak }) => {
  const today = getTodayKey();
  const week = currentWeekKeys();
  const scoreByDate = Object.fromEntries(dailyScores.map((s) => [s.date, s.score]));

  const bars = week.map(({ label, key }) => ({
    label,
    isToday: key === today,
    score: key === today ? todayScore : (key in scoreByDate ? scoreByDate[key] : null),
  }));

  const known = bars.filter((b) => b.score !== null).map((b) => b.score);
  const avg = average(known);

  return (
    <Card className="weekly-chart-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("this_week")}</p>
        {avg !== null && <span className="weekly-chart-avg">{tf("average", { n: avg })}</span>}
      </div>

      {known.length === 0 ? (
        <p className="placeholder-text">{t("no_score_history")}</p>
      ) : (
        <div className="weekly-chart">
          {bars.map((b) => (
            <div key={b.label} className="weekly-chart-col">
              <div className="weekly-chart-track">
                <div
                  className={`weekly-chart-bar ${b.isToday ? "today" : ""}`}
                  style={{ height: `${b.score === null ? 0 : Math.max(b.score, 2)}%` }}
                />
              </div>
              <span className={`weekly-chart-label ${b.isToday ? "today" : ""}`}>{b.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="streak-row">
        <span className="streak-badge"><Icon name="Flame" size={14} />{tf("streak", { n: currentStreak })}</span>
        <span className="streak-longest">{tf("longest_streak", { n: longestStreak })}</span>
      </div>
    </Card>
  );
};

// --- Seri dondurma ---------------------------------------------------------------
// Shows the monthly freeze allowance; when the current streak was just
// broken by a missed day that has qualifying days behind it, offers to
// spend a freeze on that day so the streak reconnects.

const StreakFreezeCard = ({ dailyScores, todayScore, frozenDates, onFreeze }) => {
  const today = getTodayKey();
  const monthPrefix = today.slice(0, 7);
  const left = freezesLeftInMonth(frozenDates, monthPrefix);

  // Mirror computeCurrentStreak's walk (incl. the unfinished-day grace) to
  // find the exact day the streak broke on.
  const scoreMap = new Map(dailyScores.map((s) => [s.date, s.score]));
  scoreMap.set(today, todayScore);
  const frozen = new Set(frozenDates);
  const qualifies = (c) => (scoreMap.has(c) && scoreMap.get(c) >= 50) || frozen.has(c);
  let brokenDay = today;
  if (!qualifies(brokenDay)) brokenDay = prevDateKey(brokenDay);
  while (qualifies(brokenDay)) brokenDay = prevDateKey(brokenDay);

  // Freezing only helps when there are qualifying days behind the gap to
  // reconnect to — and freezing today/yesterday-in-progress makes no sense.
  const canFreeze = left > 0 && brokenDay !== today && qualifies(prevDateKey(brokenDay));

  return (
    <Card className="freeze-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("freeze_title")}</p>
        <span className="weekly-chart-avg">{tf("freezes_left", { n: left })}</span>
      </div>
      {canFreeze ? (
        <div className="freeze-offer">
          <p className="placeholder-text">
            {tf("freeze_offer", { date: new Date(brokenDay + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "long" }) })}
          </p>
          <Button variant="secondary" onClick={() => onFreeze(brokenDay)}>{t("freeze_action")}</Button>
        </div>
      ) : (
        <p className="placeholder-text">{t("freeze_idle")}</p>
      )}
    </Card>
  );
};

// --- Takvim ısı haritası ------------------------------------------------------------
// GitHub-style grid of the last ~91 days (13 weeks × 7), intensity from the
// day's score using ink opacity steps — no new colors.

const HeatmapCard = ({ dailyScores, todayScore }) => {
  const today = getTodayKey();
  const scoreMap = new Map(dailyScores.map((s) => [s.date, s.score]));
  scoreMap.set(today, todayScore);

  const days = [];
  for (let i = 90; i >= 0; i--) {
    const key = dateKeyWithOffset(i);
    days.push({ key, score: scoreMap.has(key) ? scoreMap.get(key) : null });
  }

  const intensity = (score) => {
    if (score === null) return "none";
    if (score === 0) return "zero";
    if (score <= 25) return "q1";
    if (score <= 50) return "q2";
    if (score <= 75) return "q3";
    return "q4";
  };

  return (
    <Card className="heatmap-card">
      <p className="card-heading">{t("heatmap_title")}</p>
      <div className="heatmap-grid">
        {days.map((d) => (
          <span
            key={d.key}
            className={`heatmap-cell heat-${intensity(d.score)}`}
            title={`${d.key}${d.score !== null ? ` · ${formatPct(d.score)}` : ""}`}
          />
        ))}
      </div>
    </Card>
  );
};

// --- Alışkanlık gücü ------------------------------------------------------------------

const HabitStrengthCard = ({ tasks }) => (
  <Card className="habit-strength-card">
    <p className="card-heading">{t("habit_strength")}</p>
    <p className="placeholder-text habit-strength-sub">{t("habit_strength_sub")}</p>
    {CATEGORIES.map((c) => {
      const pct = computeHabitStrength(tasks, c.label);
      return (
        <div key={c.id} className="habit-strength-row">
          <span className="habit-strength-label">
            <span className="category-dot" style={{ backgroundColor: c.color }} />
            {categoryLabel(c)}
          </span>
          <div className="goal-progress-track habit-strength-track">
            <div className="goal-progress-fill" style={{ width: `${pct}%`, backgroundColor: c.color }} />
          </div>
          <span className="habit-strength-pct">{formatPct(pct)}</span>
        </div>
      );
    })}
  </Card>
);

// --- Esnek sıklık hedefleri --------------------------------------------------------

const HabitGoalsCard = ({ habitGoals, setHabitGoals }) => {
  const [title, setTitle] = React.useState("");
  const [target, setTarget] = React.useState("");
  const today = getTodayKey();

  // Monday of the current week — weekly counts reset here.
  const monday = (() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return dateKeyOf(d);
  })();

  const markToday = (id) =>
    setHabitGoals((prev) =>
      prev.map((g) =>
        g.id === id && !g.log.includes(today) ? { ...g, log: [...g.log, today] } : g
      )
    );

  const removeGoal = (id) => setHabitGoals((prev) => prev.filter((g) => g.id !== id));

  const addGoal = () => {
    const trimmed = title.trim();
    const num = parseInt(target, 10);
    if (!trimmed || !num || num < 1 || num > 7) return;
    setHabitGoals((prev) => [...prev, { id: `hg-${Date.now()}`, title: trimmed, weeklyTarget: num, log: [] }]);
    setTitle("");
    setTarget("");
  };

  return (
    <Card className="goals-card">
      <p className="card-heading">{t("freq_goals")}</p>
      {habitGoals.length === 0 && <p className="placeholder-text">{t("freq_goals_empty")}</p>}
      {habitGoals.map((g) => {
        const weekCount = g.log.filter((d) => d >= monday && d <= today).length;
        const doneToday = g.log.includes(today);
        return (
          <div key={g.id} className="goal-row">
            <div className="goal-row-top">
              <span className="goal-title">{g.title}</span>
              <span className="goal-numbers">{tf("per_week", { a: weekCount, b: g.weeklyTarget })}</span>
              <button className="goal-increment" onClick={() => markToday(g.id)} disabled={doneToday}>
                {doneToday ? t("freq_done_today") : t("freq_mark_today")}
              </button>
              <button className="task-delete" aria-label="delete" onClick={() => removeGoal(g.id)}>
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="goal-progress-track">
              <div className="goal-progress-fill" style={{ width: `${Math.min(weekCount / g.weeklyTarget, 1) * 100}%` }} />
            </div>
          </div>
        );
      })}
      <div className="add-goal-form">
        <input
          type="text"
          className="input"
          placeholder={t("new_goal_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }}
        />
        <input
          type="number"
          className="input add-goal-target"
          placeholder={t("weekly_target_ph")}
          min="1"
          max="7"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }}
        />
        <Button variant="primary" onClick={addGoal}>{t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Goal list (shared by weekly & yearly) -----------------------------------------

const GoalRow = ({ goal, onIncrement, onDelete }) => {
  const ratio = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  // Percentage-style goals (target 100) read better as "%88" than "88 / 100".
  const display = goal.target === 100 ? formatPct(goal.current) : `${goal.current} / ${goal.target}`;
  return (
    <div className="goal-row">
      <div className="goal-row-top">
        <span className="goal-title">{goal.title}</span>
        <span className="goal-numbers">{display}</span>
        <button className="goal-increment" onClick={() => onIncrement(goal.id)}>+1</button>
        <button className="task-delete" aria-label="delete" onClick={() => onDelete(goal.id)}>
          <Icon name="X" size={14} />
        </button>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
};

const AddGoalForm = ({ onAdd }) => {
  const [title, setTitle] = React.useState("");
  const [target, setTarget] = React.useState("");

  const submit = () => {
    const trimmed = title.trim();
    const num = parseInt(target, 10);
    if (!trimmed || !num || num <= 0) return;
    onAdd(trimmed, num);
    setTitle("");
    setTarget("");
  };

  return (
    <div className="add-goal-form">
      <input
        type="text"
        className="input"
        placeholder={t("new_goal_ph")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
      <input
        type="number"
        className="input add-goal-target"
        placeholder={t("target_ph")}
        min="1"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
      <Button variant="primary" onClick={submit}>{t("add")}</Button>
    </div>
  );
};

const GoalListCard = ({ headingKey, emptyKey, goals, setGoals, idPrefix, className }) => {
  const incrementGoal = (id) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current: g.current + 1 } : g)));
  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const addGoal = (title, target) =>
    setGoals((prev) => [...prev, { id: `${idPrefix}-${Date.now()}`, title, target, current: 0 }]);

  return (
    <Card className={className}>
      <p className="card-heading">{t(headingKey)}</p>
      {goals.length === 0 && <p className="placeholder-text">{t(emptyKey)}</p>}
      {goals.map((g) => (
        <GoalRow key={g.id} goal={g} onIncrement={incrementGoal} onDelete={deleteGoal} />
      ))}
      <AddGoalForm onAdd={addGoal} />
    </Card>
  );
};

// --- Screen ---------------------------------------------------------------------------

const GoalsScreen = () => {
  const [yearlyGoals, setYearlyGoals] = React.useState(loadYearlyGoals);
  const [weeklyGoals, setWeeklyGoals] = React.useState(loadWeeklyGoals);
  const [habitGoals, setHabitGoals] = React.useState(loadHabitGoals);
  const [dailyScores] = React.useState(loadDailyScores);
  const [frozenDates, setFrozenDates] = React.useState(loadStreakFreezes);
  const [allTasks] = React.useState(loadTasks);
  // Session 32 — which optional sections this user has enabled for Hedefler.
  const [enabled, setEnabled] = React.useState(() => getEnabledSections("hedefler"));
  const has = (key) => enabled.includes(key);
  const addSection = (key) => {
    addEnabledSection("hedefler", key);
    setEnabled(getEnabledSections("hedefler"));
  };

  React.useEffect(() => { saveYearlyGoals(yearlyGoals); }, [yearlyGoals]);
  React.useEffect(() => { saveWeeklyGoals(weeklyGoals); }, [weeklyGoals]);
  React.useEffect(() => { saveHabitGoals(habitGoals); }, [habitGoals]);

  // Today's score is always live from the current tasks, never from history.
  const today = getTodayKey();
  const todayScore = weightedScoreOf(allTasks.filter((tk) => tk.date === today));

  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);
  const monthAvg = average(dailyScores.filter((s) => s.date.startsWith(thisMonth)).map((s) => s.score));
  const yearAvg = average(dailyScores.filter((s) => s.date.startsWith(thisYear)).map((s) => s.score));

  const currentStreak = computeCurrentStreak(dailyScores, today, todayScore, 50, frozenDates);
  const longestStreak = Math.max(computeLongestStreak(dailyScores, 50, frozenDates), currentStreak);

  const spendFreeze = (date) => {
    const next = [...frozenDates, date];
    saveStreakFreezes(next);
    setFrozenDates(next);
  };

  const xp = loadXp();

  return (
    <div className="screen">
      <header className="goals-header">
        <h1 className="screen-title">{t("goals_title")}</h1>
        {/* Optional: gamification (XP/level badge), off by default */}
        {has("gamification") && (
          <span className="xp-badge">{tf("xp_line", { lvl: levelOf(xp), xp: xp.toLocaleString(appLocale()) })}</span>
        )}
      </header>

      {/* Core: the three summary stat cards (always present) */}
      <div className="stat-grid">
        <StatCard label={t("stat_today")} value={todayScore} />
        <StatCard label={t("stat_month")} value={monthAvg !== null ? monthAvg : todayScore} />
        <StatCard label={t("stat_year")} value={yearAvg !== null ? yearAvg : todayScore} />
      </div>

      {/* Core: the weekly bar chart (always present) */}
      <WeeklyChart
        dailyScores={dailyScores}
        todayScore={todayScore}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
      />

      {/* Optional sections */}
      {has("streakFreeze") && (
        <StreakFreezeCard
          dailyScores={dailyScores}
          todayScore={todayScore}
          frozenDates={frozenDates}
          onFreeze={spendFreeze}
        />
      )}
      {has("heatmap") && <HeatmapCard dailyScores={dailyScores} todayScore={todayScore} />}
      {has("habitStrength") && <HabitStrengthCard tasks={allTasks} />}
      {has("frequencyGoals") && <HabitGoalsCard habitGoals={habitGoals} setHabitGoals={setHabitGoals} />}

      <GoalListCard
        headingKey="weekly_goals"
        emptyKey="weekly_goals_empty"
        goals={weeklyGoals}
        setGoals={setWeeklyGoals}
        idPrefix="wg"
        className="goals-card"
      />
      {/* Core: yearly goals list (always present) */}
      <GoalListCard
        headingKey="yearly_goals"
        emptyKey="yearly_goals_empty"
        goals={yearlyGoals}
        setGoals={setYearlyGoals}
        idPrefix="goal"
        className="goals-card"
      />

      <AddSectionControl allSections={HEDEFLER_SECTIONS} enabledKeys={enabled} onAdd={addSection} />
    </div>
  );
};
