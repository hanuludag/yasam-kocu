// "Bugün" (Today) screen: daily planner + weighted day score.
//
// Session 14 scope note: app-blocking during focus (needs OS permissions)
// and true OS push notifications (service worker + permissions) are
// intentionally NOT implemented — deferred per the session brief. The
// Pomodoro card below is the plain countdown-only version, and the in-app
// "Bugünün Hatırlatmaları" list is the non-deferred substitute for
// reminders. Takvim senkronu (Google/Outlook) is also deferred — it needs
// an OAuth app registered in each provider's console first, a setup task
// rather than pure code.

const PRIORITY_ORDER = ["Low", "Medium", "High"];

function computeScore(tasks) {
  const total = tasks.reduce((sum, tk) => sum + tk.weight, 0);
  if (total === 0) return 0;
  const done = tasks.filter((tk) => tk.done).reduce((sum, tk) => sum + tk.weight, 0);
  return Math.round((done / total) * 100);
}

function sortByTime(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time.localeCompare(b.time);
  });
}

function formatTodayHeading() {
  return new Date().toLocaleDateString(appLocale(), {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// --- 24 saatlik zaman çizelgesi (Session 24) -------------------------------------
// Replaces the flat task list with a Google-Calendar-style day grid. Tasks
// gained an optional `endTime`; when a timed task has none, a 30-minute
// default is used ONLY for laying out its block — it is never written back
// to storage as if the user had actually set an end time.

const HOUR_HEIGHT = 56; // px per hour
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const DEFAULT_DURATION_MIN = 30;

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(mins) {
  return (mins / 60) * HOUR_HEIGHT;
}

function visualEndMinutes(startMin, endTime) {
  if (endTime) return Math.max(timeToMinutes(endTime), startMin + 10);
  return Math.min(startMin + DEFAULT_DURATION_MIN, 24 * 60);
}

// Assigns each timed task a column + the total column count of its overlap
// cluster, so overlapping tasks render side by side instead of stacked.
function layoutDayTasks(tasks) {
  const sorted = [...tasks]
    .map((tk) => {
      const startMin = timeToMinutes(tk.time);
      return { task: tk, startMin, endMin: visualEndMinutes(startMin, tk.endTime) };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const results = [];
  let columnEnds = [];
  let cluster = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const totalCols = Math.max(...cluster.map((p) => p.col)) + 1;
    cluster.forEach((p) => results.push({ ...p, totalCols }));
    cluster = [];
  };

  sorted.forEach((entry) => {
    if (entry.startMin >= clusterEnd) {
      flushCluster();
      columnEnds = [];
      clusterEnd = -1;
    }
    let col = columnEnds.findIndex((endMin) => endMin <= entry.startMin);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(entry.endMin);
    } else {
      columnEnds[col] = entry.endMin;
    }
    cluster.push({ ...entry, col });
    clusterEnd = Math.max(clusterEnd, entry.endMin);
  });
  flushCluster();

  return results;
}

// --- Basit doğal dil zaman ayrıştırma (heuristic only, NOT true NLU) ---------
// Recognizes a couple of simple Turkish time phrases typed into the task
// title and pulls a time out of them, e.g. "saat 15:00'te toplantı" or
// "toplantı saat 3'te". Full natural-language date/time understanding
// (e.g. "yarın", "önümüzdeki salı") would need an AI model — out of scope
// here, this is best-effort string/regex parsing only.
function parseTimeFromText(text) {
  const hhmm = text.match(/\bsaat\s+(\d{1,2}):(\d{2})\b/i) || text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      return { time, cleaned: text.replace(hhmm[0], "").replace(/\s{2,}/g, " ").trim() };
    }
  }
  const hourOnly = text.match(/\bsaat\s+(\d{1,2})(?:'?[a-zçğıöşü]*)?\b/i) || text.match(/\b(\d{1,2})'?te\b/i);
  if (hourOnly) {
    const h = parseInt(hourOnly[1], 10);
    if (h >= 0 && h <= 23) {
      const time = `${String(h).padStart(2, "0")}:00`;
      return { time, cleaned: text.replace(hourOnly[0], "").replace(/\s{2,}/g, " ").trim() };
    }
  }
  return null;
}

// --- Score ring --------------------------------------------------------------

const ScoreRing = ({ score }) => {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <svg className="score-ring" width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        className="score-ring-progress"
        cx="55" cy="55" r={r} fill="none"
        stroke="var(--color-ink)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="55" textAnchor="middle" dominantBaseline="central" className="score-ring-value">
        {score}
      </text>
    </svg>
  );
};

// --- Score card ---------------------------------------------------------------

const CategoryScorePill = ({ category, score }) => (
  <span className="category-tag">
    <span className="category-dot" style={{ backgroundColor: category.color }} />
    <Icon name={category.icon} />
    {categoryLabel(category)}
    <strong className="category-score">{score}</strong>
  </span>
);

const ScoreCard = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <Card className="score-card">
        <EmptyState icon="Target" text={t("no_tasks")} />
      </Card>
    );
  }

  const score = computeScore(tasks);
  const doneCount = tasks.filter((tk) => tk.done).length;
  const categoryScores = CATEGORIES
    .map((c) => ({ category: c, tasks: tasks.filter((tk) => tk.category === c.label) }))
    .filter((c) => c.tasks.length > 0)
    .map((c) => ({ category: c.category, score: computeScore(c.tasks) }));

  return (
    <Card className="score-card">
      <div className="score-card-main">
        <ScoreRing score={score} />
        <div>
          <p className="score-card-label">{t("day_score")}</p>
          <p className="score-card-summary">
            {tf("tasks_summary", { total: tasks.length, done: doneCount })}
          </p>
        </div>
      </div>
      <div className="score-card-categories">
        {categoryScores.map(({ category, score }) => (
          <CategoryScorePill key={category.id} category={category} score={score} />
        ))}
      </div>
    </Card>
  );
};

// --- Task list ----------------------------------------------------------------

const TaskRow = ({ task, onToggle, onDelete }) => {
  const category = CATEGORIES.find((c) => c.label === task.category);
  return (
    <div className={`task-row ${task.done ? "done" : ""}`} onClick={() => onToggle(task.id)}>
      <span
        className="task-checkbox"
        style={task.done ? { backgroundColor: category.color, borderColor: category.color } : null}
      >
        {task.done && <Icon name="Check" size={12} />}
      </span>
      {task.time && <span className="task-time">{task.time}</span>}
      <span className="task-title">{task.title}</span>
      {task.urgent && (
        <span className="urgent-dot" title={t("urgent_label")}>
          <Icon name="Zap" size={12} />
        </span>
      )}
      <CategoryTag category={category} />
      <button
        className="task-delete"
        aria-label="delete"
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
};

// --- Zaman çizelgesi görünümü (Session 24) ----------------------------------------

// One positioned block on the grid. Whole block opens the edit panel; the
// small corner checkbox quick-toggles done without entering the edit flow.
const GridTaskBlock = ({ entry, onToggle, onEdit }) => {
  const { task, startMin, endMin, col, totalCols } = entry;
  const category = CATEGORIES.find((c) => c.label === task.category) || CATEGORIES[4];
  const height = Math.max(minutesToPx(endMin - startMin), 18);

  return (
    <div
      className={`grid-task-block ${task.done ? "done" : ""}`}
      style={{
        top: minutesToPx(startMin),
        height,
        left: `${(col / totalCols) * 100}%`,
        width: `calc(${100 / totalCols}% - 3px)`,
        borderLeftColor: category.color,
        backgroundColor: `${category.color}20`, // ~12% alpha of the muted category tone
      }}
      onClick={() => onEdit(task)}
      title={`${task.time}${task.endTime ? `–${task.endTime}` : ""} ${task.title}`}
    >
      <span
        className="grid-task-check"
        style={task.done ? { backgroundColor: category.color, borderColor: category.color } : null}
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
      >
        {task.done && <Icon name="Check" size={10} />}
      </span>
      <span className="grid-task-time">
        {task.time}{task.endTime ? `–${task.endTime}` : ""}
      </span>
      <span className="grid-task-title">{task.title}</span>
    </div>
  );
};

const TimeGrid = ({ tasks, onToggle, onDelete, onEdit }) => {
  const timed = tasks.filter((tk) => tk.time !== null && tk.time !== undefined);
  const untimed = tasks.filter((tk) => tk.time === null || tk.time === undefined);
  const positioned = layoutDayTasks(timed);

  const [nowMin, setNowMin] = React.useState(() => timeToMinutes(nowHHMM()));
  React.useEffect(() => {
    const id = setInterval(() => setNowMin(timeToMinutes(nowHHMM())), 30000);
    return () => clearInterval(id);
  }, []);

  // Open the grid scrolled so "now" sits in the upper third of the viewport.
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, minutesToPx(nowMin) - 140);
    }
  }, []); // mount only — don't yank the user's scroll on each tick

  return (
    <Card className="time-grid-card">
      {tasks.length === 0 && (
        <EmptyState icon="CalendarClock" text={t("today_empty")} />
      )}
      <div className="time-grid-scroll" ref={scrollRef}>
        <div className="time-grid" style={{ height: GRID_HEIGHT }}>
          {Array.from({ length: 24 }, (_, h) => (
            <React.Fragment key={h}>
              <div className="hour-line" style={{ top: h * HOUR_HEIGHT }} />
              <span className="hour-label" style={{ top: h * HOUR_HEIGHT }}>
                {String(h).padStart(2, "0")}:00
              </span>
            </React.Fragment>
          ))}
          <div className="grid-blocks">
            {positioned.map((entry) => (
              <GridTaskBlock key={entry.task.id} entry={entry} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </div>
          <div className="now-line" style={{ top: minutesToPx(nowMin) }}>
            <span className="now-dot" />
          </div>
        </div>
      </div>

      {untimed.length > 0 && (
        <div className="untimed-section">
          <p className="task-list-divider">{t("untimed")}</p>
          {untimed.map((tk) => (
            <TaskRow key={tk.id} task={tk} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </Card>
  );
};

// --- Görev düzenleme paneli (Session 24) --------------------------------------------
// Opens when a grid block is clicked: full edit of title/times/category/
// priority/urgent plus a done checkbox, and delete.

const TaskEditCard = ({ task, onSave, onDelete, onClose }) => {
  const [title, setTitle] = React.useState(task.title);
  const [time, setTime] = React.useState(task.time || "");
  const [endTime, setEndTime] = React.useState(task.endTime || "");
  const [category, setCategory] = React.useState(task.category);
  const [priority, setPriority] = React.useState(task.priority);
  const [urgent, setUrgent] = React.useState(!!task.urgent);
  const [done, setDone] = React.useState(!!task.done);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      ...task,
      title: trimmed,
      time: time || null,
      endTime: time && endTime && endTime > time ? endTime : null,
      category,
      priority,
      urgent,
      weight: PRIORITY_WEIGHTS[priority],
      done,
    });
  };

  return (
    <Card className="task-edit-card">
      <p className="section-title">{t("edit_task_title")}</p>
      <input
        type="text"
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); }}
      />
      <div className="add-task-row">
        <input
          type="time" className="input add-task-time" value={time}
          onChange={(e) => setTime(e.target.value)} aria-label={t("start_time_label")}
        />
        <span className="task-edit-dash">–</span>
        <input
          type="time" className="input add-task-time" value={endTime}
          onChange={(e) => setEndTime(e.target.value)} aria-label={t("end_time_label")}
        />
      </div>
      <div className="add-task-row">
        <select className="input add-task-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.label}>{categoryLabel(c)}</option>
          ))}
        </select>
        <select className="input add-task-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{t(`priority_${p}`)}</option>
          ))}
        </select>
      </div>
      <div className="add-task-row task-edit-flags">
        <label className="urgent-checkbox">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          {t("urgent_label")}
        </label>
        <label className="urgent-checkbox">
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
          {t("done_label")}
        </label>
      </div>
      <div className="add-task-row task-edit-actions">
        <button className="goal-increment task-edit-delete" onClick={() => onDelete(task.id)}>
          {t("delete")}
        </button>
        <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
        <Button variant="primary" onClick={save}>{t("save")}</Button>
      </div>
    </Card>
  );
};

// --- Eisenhower matrisi ---------------------------------------------------------

const EisenhowerMatrix = ({ tasks, onToggle, onDelete }) => {
  const quads = [
    { key: "quad_urgent_important", filter: (tk) => tk.urgent && tk.priority === "High" },
    { key: "quad_not_urgent_important", filter: (tk) => !tk.urgent && tk.priority === "High" },
    { key: "quad_urgent_not_important", filter: (tk) => tk.urgent && tk.priority !== "High" },
    { key: "quad_not_urgent_not_important", filter: (tk) => !tk.urgent && tk.priority !== "High" },
  ];

  return (
    <Card className="matrix-card">
      <div className="matrix-grid">
        {quads.map((q) => {
          const quadTasks = tasks.filter(q.filter);
          return (
            <div key={q.key} className="matrix-quad">
              <p className="matrix-quad-title">{t(q.key)}</p>
              {quadTasks.length === 0 ? (
                <p className="matrix-quad-empty">{t("quad_empty")}</p>
              ) : (
                quadTasks.map((tk) => (
                  <div
                    key={tk.id}
                    className={`matrix-task ${tk.done ? "done" : ""}`}
                    onClick={() => onToggle(tk.id)}
                  >
                    {tk.title}
                    <button
                      className="task-delete"
                      aria-label="delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(tk.id); }}
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Bugünün hatırlatmaları (in-app reminders, not push) -----------------------

const RemindersCard = ({ tasks }) => {
  const now = nowHHMM();
  const upcoming = sortByTime(
    tasks.filter((tk) => !tk.done && tk.time !== null && tk.time >= now)
  );

  return (
    <Card className="reminders-card">
      <p className="section-title">{t("reminders_title")}</p>
      {upcoming.length === 0 ? (
        <p className="placeholder-text">{t("no_reminders")}</p>
      ) : (
        upcoming.map((tk) => (
          <div key={tk.id} className="reminder-row">
            <Icon name="Bell" size={14} />
            <span className="task-time">{tk.time}</span>
            <span className="task-title">{tk.title}</span>
          </div>
        ))
      )}
    </Card>
  );
};

// --- Pomodoro / odak zamanlayıcı ---------------------------------------------------
// Standard 25 min work / 5 min break countdown. App-blocking during focus
// is deferred (needs OS-level permissions a web app doesn't have).

const POMODORO_SECONDS = { work: 25 * 60, break: 5 * 60 };

const PomodoroCard = () => {
  const [mode, setMode] = React.useState("work");
  const [secondsLeft, setSecondsLeft] = React.useState(POMODORO_SECONDS.work);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // When the countdown hits zero, stop and hand over to the other mode.
  React.useEffect(() => {
    if (secondsLeft !== 0 || !running) return;
    const next = mode === "work" ? "break" : "work";
    setRunning(false);
    setMode(next);
    setSecondsLeft(POMODORO_SECONDS[next]);
  }, [secondsLeft, running, mode]);

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(POMODORO_SECONDS[m]);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(POMODORO_SECONDS[mode]);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Card className="pomodoro-card">
      <div className="weekly-chart-head">
        <p className="section-title">{t("pomodoro_title")}</p>
        <div className="type-toggle pomodoro-mode-toggle">
          <button
            className={`type-toggle-option ${mode === "work" ? "active" : ""}`}
            onClick={() => switchMode("work")}
          >
            {t("pomodoro_work")}
          </button>
          <button
            className={`type-toggle-option ${mode === "break" ? "active" : ""}`}
            onClick={() => switchMode("break")}
          >
            {t("pomodoro_break")}
          </button>
        </div>
      </div>
      <p className="pomodoro-time">{mm}:{ss}</p>
      <div className="pomodoro-actions">
        <Button variant="primary" onClick={() => setRunning((r) => !r)}>
          {running ? t("pomodoro_pause") : t("pomodoro_start")}
        </Button>
        <Button variant="secondary" onClick={reset}>{t("pomodoro_reset")}</Button>
      </div>
    </Card>
  );
};

// --- Rutin editörü (Session 25 — full CRUD) ---------------------------------------
// One form handles both create and edit: name the routine, build/edit its
// task list (add, remove, reorder with up/down, edit a task in place), and
// save. Apply behavior is unchanged — it just reads the latest saved state.

const RoutineEditorForm = ({ initialRoutine, onSave, onCancel }) => {
  const [name, setName] = React.useState(initialRoutine ? initialRoutine.name : "");
  const [draftTasks, setDraftTasks] = React.useState(
    initialRoutine ? initialRoutine.tasks.map((tk) => ({ ...tk })) : []
  );
  // Mini-form state; editingIndex !== null means it's editing that task.
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [time, setTime] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0].label);
  const [priority, setPriority] = React.useState("Medium");

  const resetMiniForm = () => {
    setEditingIndex(null);
    setTitle("");
    setTime("");
    setCategory(CATEGORIES[0].label);
    setPriority("Medium");
  };

  const submitMiniForm = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const entry = { title: trimmed, time: time || null, category, priority };
    setDraftTasks((prev) =>
      editingIndex !== null
        ? prev.map((tk, i) => (i === editingIndex ? entry : tk))
        : [...prev, entry]
    );
    resetMiniForm();
  };

  const startEditTask = (i) => {
    const tk = draftTasks[i];
    setEditingIndex(i);
    setTitle(tk.title);
    setTime(tk.time || "");
    setCategory(tk.category);
    setPriority(tk.priority);
  };

  const removeTask = (i) => {
    setDraftTasks((prev) => prev.filter((_, idx) => idx !== i));
    if (editingIndex === i) resetMiniForm();
  };

  const moveTask = (i, dir) => {
    const target = i + dir;
    if (target < 0 || target >= draftTasks.length) return;
    setDraftTasks((prev) => {
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName || draftTasks.length === 0) return;
    onSave({
      id: initialRoutine ? initialRoutine.id : `routine-${Date.now()}`,
      name: trimmedName,
      tasks: draftTasks,
    });
  };

  return (
    <Card className="new-routine-form">
      <input
        type="text"
        className="input"
        placeholder={t("routine_name_ph")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {draftTasks.length > 0 && (
        <div className="routine-draft-list">
          {draftTasks.map((dt, i) => (
            <div key={i} className={`routine-draft-row ${editingIndex === i ? "editing" : ""}`}>
              <span className="routine-draft-text" onClick={() => startEditTask(i)}>
                {dt.time ? `${dt.time} — ` : ""}{dt.title}
                <span className="transaction-meta"> · {dt.category}</span>
              </span>
              <button className="block-control" disabled={i === 0} onClick={() => moveTask(i, -1)} aria-label="up">
                <Icon name="ChevronUp" size={13} />
              </button>
              <button
                className="block-control"
                disabled={i === draftTasks.length - 1}
                onClick={() => moveTask(i, 1)}
                aria-label="down"
              >
                <Icon name="ChevronDown" size={13} />
              </button>
              <button className="task-delete" aria-label="delete" onClick={() => removeTask(i)}>
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="add-task-row">
        <input
          type="time"
          className="input add-task-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          type="text"
          className="input add-task-title"
          placeholder={t("routine_task_title_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitMiniForm(); }}
        />
      </div>
      <div className="add-task-row">
        <select className="input add-task-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.label}>{categoryLabel(c)}</option>
          ))}
        </select>
        <select className="input add-task-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{t(`priority_${p}`)}</option>
          ))}
        </select>
        <Button variant="secondary" onClick={submitMiniForm}>
          {editingIndex !== null ? t("update") : t("add_routine_task")}
        </Button>
      </div>
      <div className="add-task-row">
        <Button variant="secondary" onClick={onCancel}>{t("cancel")}</Button>
        <Button variant="primary" onClick={save}>{t("save_routine")}</Button>
      </div>
    </Card>
  );
};

const RoutinesCard = ({ onApply }) => {
  const [routines, setRoutines] = React.useState(loadRoutines);
  // null = closed, "new" = creating, otherwise the routine id being edited.
  const [editorTarget, setEditorTarget] = React.useState(null);
  const [justApplied, setJustApplied] = React.useState(null);

  React.useEffect(() => {
    saveRoutines(routines);
  }, [routines]);

  const applyRoutine = (routine) => {
    onApply(routine.tasks);
    setJustApplied(routine.id);
    setTimeout(() => setJustApplied(null), 2000);
  };

  const saveRoutine = (routine) => {
    setRoutines((prev) =>
      prev.some((r) => r.id === routine.id)
        ? prev.map((r) => (r.id === routine.id ? routine : r))
        : [...prev, routine]
    );
    setEditorTarget(null);
  };

  const deleteRoutine = (id) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (editorTarget === id) setEditorTarget(null);
  };

  const editingRoutine = routines.find((r) => r.id === editorTarget) || null;

  return (
    <Card className="routines-card">
      <p className="section-title">{t("routines_title")}</p>
      {routines.length === 0 ? (
        <p className="placeholder-text">{t("no_routines")}</p>
      ) : (
        routines.map((r) => (
          <div key={r.id} className="routine-row">
            <span className="routine-name">
              {r.name}
              <span className="transaction-meta"> — {tf("routine_task_count", { n: r.tasks.length })}</span>
            </span>
            <button className="goal-increment" onClick={() => setEditorTarget(r.id)}>{t("edit")}</button>
            <button className="task-delete" aria-label="delete" onClick={() => deleteRoutine(r.id)}>
              <Icon name="X" size={14} />
            </button>
            <Button variant="secondary" onClick={() => applyRoutine(r)}>
              {justApplied === r.id ? t("routine_applied") : t("apply_routine")}
            </Button>
          </div>
        ))
      )}
      {editorTarget !== null ? (
        <RoutineEditorForm
          key={editorTarget} // remount when switching between routines / new
          initialRoutine={editingRoutine}
          onSave={saveRoutine}
          onCancel={() => setEditorTarget(null)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setEditorTarget("new")}>{t("new_routine")}</Button>
      )}
    </Card>
  );
};

// --- Gün kapanış ritüeli ---------------------------------------------------------

const DayClosingCard = ({ score }) => {
  const today = getTodayKey();
  const [reflection, setReflection] = React.useState(() => getReflection(today));
  const [editing, setEditing] = React.useState(!reflection);
  const [done, setDone] = React.useState(reflection ? reflection.done : "");
  const [notDone, setNotDone] = React.useState(reflection ? reflection.notDone : "");

  const save = () => {
    const value = { done: done.trim(), notDone: notDone.trim() };
    saveReflection(today, score, value);
    setReflection(value);
    setEditing(false);
  };

  return (
    <Card className="day-closing-card">
      <p className="section-title">{t("day_closing_title")}</p>
      {!editing && reflection ? (
        <div>
          <p className="placeholder-text">{t("day_closing_prompt")}</p>
          <p><strong>{t("reflection_done_label")}</strong>{reflection.done || "—"}</p>
          <p><strong>{t("reflection_not_done_label")}</strong>{reflection.notDone || "—"}</p>
          <Button variant="secondary" onClick={() => setEditing(true)}>{t("edit_reflection")}</Button>
        </div>
      ) : (
        <div>
          <p className="placeholder-text">{t("day_closing_prompt")}</p>
          <textarea
            className="input reflection-textarea"
            placeholder={t("done_today_ph")}
            value={done}
            onChange={(e) => setDone(e.target.value)}
          />
          <textarea
            className="input reflection-textarea"
            placeholder={t("not_done_today_ph")}
            value={notDone}
            onChange={(e) => setNotDone(e.target.value)}
          />
          <Button variant="primary" onClick={save}>{t("save_reflection")}</Button>
        </div>
      )}
    </Card>
  );
};

// --- Add-task form --------------------------------------------------------------

function useSpeechToText(onResult) {
  const supported = typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);

  const start = () => {
    if (!supported || listening) return;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = APP_LANG === "en" ? "en-US" : "tr-TR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return { supported: !!supported, listening, start };
}

const AddTaskForm = ({ onAdd }) => {
  const [time, setTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0].label);
  const [priority, setPriority] = React.useState("Medium");
  const [urgent, setUrgent] = React.useState(false);

  const { supported: micSupported, listening, start: startListening } = useSpeechToText((transcript) => {
    setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const handleTitleChange = (value) => {
    const parsed = parseTimeFromText(value);
    if (parsed && !time) {
      setTime(parsed.time);
      setTitle(parsed.cleaned);
    } else {
      setTitle(value);
    }
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    // endTime only makes sense with a start time and when it's after it.
    onAdd({
      time: time || null,
      endTime: time && endTime && endTime > time ? endTime : null,
      title: trimmed,
      category,
      priority,
      urgent,
    });
    setTime("");
    setEndTime("");
    setTitle("");
    setPriority("Medium");
    setUrgent(false);
  };

  return (
    <Card className="add-task-form">
      <div className="add-task-row">
        <input
          type="time"
          className="input add-task-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label={t("start_time_label")}
        />
        <input
          type="time"
          className="input add-task-time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          aria-label={t("end_time_label")}
        />
        <input
          type="text"
          className="input add-task-title"
          placeholder={t("add_task_ph")}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {micSupported && (
          <button
            type="button"
            className={`mic-button ${listening ? "listening" : ""}`}
            title={listening ? t("mic_listening") : t("mic_start")}
            onClick={startListening}
          >
            <Icon name={listening ? "Mic" : "Mic"} size={16} />
          </button>
        )}
      </div>
      <div className="add-task-row">
        <select className="input add-task-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.label}>{categoryLabel(c)}</option>
          ))}
        </select>
        <select className="input add-task-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{t(`priority_${p}`)}</option>
          ))}
        </select>
        <label className="urgent-checkbox">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          {t("urgent_label")}
        </label>
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Screen ---------------------------------------------------------------------

const TodayScreen = () => {
  const [tasks, setTasks] = React.useState(loadTasks);
  const [dailyScores] = React.useState(loadDailyScores);
  const [matrixView, setMatrixView] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  // Session 32 — which optional sections this user has enabled for Bugün.
  const [enabled, setEnabled] = React.useState(() => getEnabledSections("bugun"));
  const has = (key) => enabled.includes(key);
  const addSection = (key) => {
    addEnabledSection("bugun", key);
    setEnabled(getEnabledSections("bugun"));
  };
  const today = getTodayKey();
  const todaysTasks = tasks.filter((tk) => tk.date === today);
  const todayScore = computeScore(todaysTasks);

  React.useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const toggleTask = (id) => {
    // XP follows completion: earn on tick, give back on untick.
    const tk = tasks.find((x) => x.id === id);
    if (tk) addXp(tk.done ? -tk.weight : tk.weight);
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((tk) => tk.id !== id));
    setEditingTask(null);
  };

  const updateTask = (updated) => {
    // Keep XP honest when done flips inside the edit panel too.
    const old = tasks.find((x) => x.id === updated.id);
    if (old && old.done !== updated.done) {
      addXp(updated.done ? updated.weight : -old.weight);
    }
    setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditingTask(null);
  };

  const addTask = ({ time, endTime, title, category, priority, urgent }) =>
    setTasks((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: today,
        time,
        endTime: endTime || null,
        title,
        category,
        priority,
        urgent: !!urgent,
        weight: PRIORITY_WEIGHTS[priority],
        done: false,
      },
    ]);

  const applyRoutine = (routineTasks) =>
    setTasks((prev) => [
      ...prev,
      ...routineTasks.map((rt, i) => ({
        id: `t-${Date.now()}-${i}`,
        date: today,
        time: rt.time,
        title: rt.title,
        category: rt.category,
        priority: rt.priority,
        urgent: false,
        weight: PRIORITY_WEIGHTS[rt.priority],
        done: false,
      })),
    ]);

  const frozenDates = loadStreakFreezes();
  const currentStreak = computeCurrentStreak(dailyScores, today, todayScore, 50, frozenDates);
  const longestStreak = Math.max(computeLongestStreak(dailyScores, 50, frozenDates), currentStreak);

  return (
    <div className="screen">
      <header className="today-header">
        <h1 className="screen-title">{formatTodayHeading()}</h1>
        <div className="streak-badges">
          <span className="streak-badge">
            <Icon name="Flame" size={14} />
            {tf("streak", { n: currentStreak })}
          </span>
          <span className="streak-badge streak-badge-muted">
            {tf("longest_streak", { n: longestStreak })}
          </span>
        </div>
      </header>

      {/* Core: day score ring + category breakdown (always present) */}
      <ScoreCard tasks={todaysTasks} />

      {/* Optional sections */}
      {has("reminders") && <RemindersCard tasks={todaysTasks} />}
      {has("pomodoro") && <PomodoroCard />}

      {has("matrix") && (
        <div className="matrix-toggle-row">
          <Button variant="secondary" onClick={() => setMatrixView((v) => !v)}>
            {matrixView ? t("list_view") : t("matrix_view")}
          </Button>
        </div>
      )}

      {/* Core: the task view. Matrix is an alternate view only when enabled */}
      {has("matrix") && matrixView ? (
        <EisenhowerMatrix tasks={todaysTasks} onToggle={toggleTask} onDelete={deleteTask} />
      ) : (
        <TimeGrid
          tasks={todaysTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={setEditingTask}
        />
      )}

      {editingTask && (
        <TaskEditCard
          task={editingTask}
          onSave={updateTask}
          onDelete={deleteTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Core: inline add-task control (always present) */}
      <AddTaskForm onAdd={addTask} />

      {has("routines") && <RoutinesCard onApply={applyRoutine} />}
      {has("dayClosing") && <DayClosingCard score={todayScore} />}

      <AddSectionControl allSections={BUGUN_SECTIONS} enabledKeys={enabled} onAdd={addSection} />
    </div>
  );
};
