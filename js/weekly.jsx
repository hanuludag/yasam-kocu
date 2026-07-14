// Session 21 — "Haftalık" page: lightweight weekly overview of the current
// week (Mon–Sun), reading the SAME tasks store the Bugün screen uses, just
// filtered by each day's date key instead of always today. Tasks added here
// carry the chosen day's date, so they show up on Bugün when that day comes.
// This is deliberately NOT the full weekly time-grid from the original spec.

const WEEKLY_COLOR = "#7C93B3"; // dusty blue — shared with Ders/Program

// Monday..Sunday date keys of the current week.
function weekDateKeys() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return t("weekdays").map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return { label, key: `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}` };
  });
}

// Compact per-day add: title only — category/priority default to the
// lightweight middle ground. Full detail entry stays on the Bugün form.
const WeeklyDayColumn = ({ label, dateKey, isToday, tasks, onToggle, onDelete, onAdd }) => {
  const [title, setTitle] = React.useState("");

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(dateKey, trimmed);
    setTitle("");
  };

  const sorted = sortByTime(tasks);

  return (
    <div className={`weekly-day ${isToday ? "today" : ""}`}>
      <p className="weekly-day-head">
        {label}
        <span className="transaction-meta weekly-day-date">
          {new Date(dateKey + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" })}
        </span>
        {isToday && <span className="weekly-today-badge">{t("today_label")}</span>}
      </p>
      {sorted.length === 0 && <p className="weekly-day-empty">{t("weekly_empty_day")}</p>}
      {sorted.map((tk) => (
        <div key={tk.id} className={`weekly-task ${tk.done ? "done" : ""}`} onClick={() => onToggle(tk.id)}>
          {tk.time && <span className="task-time">{tk.time}</span>}
          <span className="weekly-task-title">{tk.title}</span>
          <button
            className="task-delete"
            aria-label="delete"
            onClick={(e) => { e.stopPropagation(); onDelete(tk.id); }}
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}
      <input
        type="text"
        className="input weekly-add-input"
        placeholder={t("weekly_add_ph")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
    </div>
  );
};

const WeeklyScreen = () => {
  const [tasks, setTasks] = React.useState(loadTasks);
  const today = getTodayKey();
  const week = weekDateKeys();

  React.useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const toggleTask = (id) => {
    // Same XP bookkeeping as the Bugün screen.
    const tk = tasks.find((x) => x.id === id);
    if (tk) addXp(tk.done ? -tk.weight : tk.weight);
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const deleteTask = (id) => setTasks((prev) => prev.filter((tk) => tk.id !== id));

  const addTask = (dateKey, title) =>
    setTasks((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: dateKey,
        time: null,
        title,
        category: "Kişisel",
        priority: "Medium",
        urgent: false,
        weight: PRIORITY_WEIGHTS.Medium,
        done: false,
      },
    ]);

  return (
    <div className="screen screen-weekly">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: WEEKLY_COLOR }} />
          {t("weekly_title")}
        </h1>
      </header>

      <div className="weekly-grid">
        {week.map(({ label, key }) => (
          <WeeklyDayColumn
            key={key}
            label={label}
            dateKey={key}
            isToday={key === today}
            tasks={tasks.filter((tk) => tk.date === key)}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onAdd={addTask}
          />
        ))}
      </div>
    </div>
  );
};
