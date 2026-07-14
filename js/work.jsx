// Session 7 — "İş" (Work) page: kanban task board, meeting notes and
// weekly summary with manual work-hour logging. Reached from the Sayfalar
// gallery's "İş" template card (not a bottom-nav tab).

const WORK_STATUSES = ["Yapılacak", "Sürüyor", "Bitti"];
const WORK_COLOR = "#B08268"; // clay — İş category color

// "29 Haz – 5 Tem" for the current Monday–Sunday week.
function formatWeekRange() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString(appLocale(), { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

// --- Kanban board ------------------------------------------------------------

const BoardTaskChip = ({ task, onCycle }) => (
  <button
    className={`board-chip ${task.status === "Bitti" ? "done" : ""}`}
    onClick={() => onCycle(task.id)}
    title={t("cycle_status_hint")}
  >
    {task.title}
  </button>
);

const WorkBoard = ({ tasks, onCycle, onAdd }) => {
  const [title, setTitle] = React.useState("");

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  };

  return (
    <Card className="work-board-card">
      <p className="card-heading">{t("board")}</p>
      <div className="work-board">
        {WORK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((tk) => tk.status === status);
          return (
            <div key={status} className="work-column">
              <p className="work-column-head">
                {t(WORK_STATUS_KEYS[status])} · {columnTasks.length}
              </p>
              {columnTasks.length === 0 && <p className="work-column-empty">{t("no_column_tasks")}</p>}
              {columnTasks.map((tk) => (
                <BoardTaskChip key={tk.id} task={tk} onCycle={onCycle} />
              ))}
            </div>
          );
        })}
      </div>
      <div className="work-add-row">
        <input
          type="text"
          className="input"
          placeholder={t("new_task_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Meeting notes -------------------------------------------------------------

const MeetingNoteRow = ({ note }) => (
  <div className="meeting-note">
    <div className="meeting-note-head">
      <span className="meeting-note-title">{note.title}</span>
      <span className="meeting-note-when">
        {new Date(note.date + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" })}
        {note.time ? ` · ${note.time}` : ""}
      </span>
    </div>
    <p className="meeting-note-content">{note.content}</p>
  </div>
);

const MeetingNotes = ({ notes, onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(getTodayKey());
  const [time, setTime] = React.useState("");
  const [content, setContent] = React.useState("");

  const submit = () => {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;
    onAdd({ title: t, date: date || getTodayKey(), time: time || null, content: c });
    setTitle("");
    setTime("");
    setContent("");
    setOpen(false);
  };

  return (
    <Card className="meeting-notes-card">
      <p className="card-heading">{t("meetings")}</p>
      {notes.length === 0 && <p className="placeholder-text">{t("no_meeting_notes")}</p>}
      {notes.map((n) => (
        <MeetingNoteRow key={n.id} note={n} />
      ))}

      {!open ? (
        <button className="meeting-add-toggle" onClick={() => setOpen(true)}>
          <Icon name="Plus" size={14} />
          {t("add_note")}
        </button>
      ) : (
        <div className="meeting-add-form">
          <input
            type="text"
            className="input"
            placeholder={t("meeting_title_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="meeting-add-when">
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t("start_time_label")}
            />
            <input
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label={t("end_time_label")}
            />
          </div>
          <textarea
            className="input meeting-add-content"
            placeholder={t("note_content_ph")}
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="meeting-add-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button variant="primary" onClick={submit}>{t("add")}</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// --- Weekly summary --------------------------------------------------------------

const WorkSummary = ({ doneCount, meetingCount, hoursLogged, hoursTarget, onHoursChange }) => {
  const ratio = hoursTarget > 0 ? Math.min(hoursLogged / hoursTarget, 1) : 0;
  const fmtHours = (h) => h.toLocaleString(appLocale());

  return (
    <div className="work-summary-grid">
      <Card className="work-summary-card">
        <p className="card-heading">{t("weekly_summary")}</p>
        <p className="work-summary-line">
          <strong>{doneCount}</strong> {t("tasks_done_line")}
        </p>
        <p className="work-summary-line">
          <strong>{meetingCount}</strong> {t("meetings_line")}
        </p>
      </Card>

      <Card className="work-summary-card">
        <p className="card-heading">{t("work_hours")}</p>
        <div className="work-hours-row">
          <span className="work-hours-value">{fmtHours(hoursLogged)} {t("unit_hours")}</span>
          <span className="work-hours-controls">
            <button className="goal-increment" aria-label="−0.5" onClick={() => onHoursChange(-0.5)}>−</button>
            <button className="goal-increment" aria-label="+0.5" onClick={() => onHoursChange(0.5)}>+</button>
          </span>
        </div>
        <p className="work-hours-target">{tf("target_hours", { n: fmtHours(hoursTarget) })}</p>
        <div className="goal-progress-track">
          <div className="goal-progress-fill" style={{ width: `${ratio * 100}%` }} />
        </div>
      </Card>
    </div>
  );
};

// --- İş–kişisel çakışma uyarısı (Session 19, deterministic — no AI) ---------------
// Flags upcoming dates where high-stakes items from different areas pile
// up: work meetings, school exams, and high-priority daily tasks.

const WorkConflictBanner = ({ meetingNotes }) => {
  const today = getTodayKey();
  const school = loadSchoolData();
  const tasks = loadTasks();

  const byDate = {};
  const push = (date, label) => {
    if (date < today) return;
    (byDate[date] = byDate[date] || []).push(label);
  };
  meetingNotes.forEach((n) => push(n.date, `${t("conflict_meeting")}: ${n.title}`));
  school.exams.forEach((e) => push(e.date, `${t("conflict_exam")}: ${e.title}`));
  tasks
    .filter((tk) => tk.priority === "High" && !tk.done)
    .forEach((tk) => push(tk.date, `${t("conflict_task")}: ${tk.title}`));

  const conflicts = Object.entries(byDate)
    .filter(([, items]) => items.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b));

  if (conflicts.length === 0) return null;

  return (
    <div className="conflict-warning work-conflict-banner">
      <p className="work-conflict-title">{t("conflict_title")}</p>
      {conflicts.map(([date, items]) => (
        <p key={date} className="work-conflict-line">
          <strong>{new Date(date + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "long" })}</strong>
          {" — "}{items.join(" · ")}
        </p>
      ))}
    </div>
  );
};

// --- Görüşme / zam hazırlık (Session 19) --------------------------------------------
// A plain editable checklist + free-form notes. This is NOT the AI roleplay
// interview simulation from the definition doc — that needs an AI model and
// stays deferred until the AI phase.

const InterviewPrepCard = ({ prep, onChange }) => {
  const [newItem, setNewItem] = React.useState("");

  const toggle = (id) =>
    onChange({
      ...prep,
      checklist: prep.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    });

  const remove = (id) =>
    onChange({ ...prep, checklist: prep.checklist.filter((c) => c.id !== id) });

  const add = () => {
    const text = newItem.trim();
    if (!text) return;
    onChange({
      ...prep,
      checklist: [...prep.checklist, { id: `ip-${Date.now()}`, text, done: false }],
    });
    setNewItem("");
  };

  return (
    <Card className="interview-prep-card">
      <p className="card-heading">{t("interview_prep")}</p>
      {prep.checklist.map((c) => (
        <div key={c.id} className={`task-row ${c.done ? "done" : ""}`} onClick={() => toggle(c.id)}>
          <span
            className="task-checkbox"
            style={c.done ? { backgroundColor: WORK_COLOR, borderColor: WORK_COLOR } : null}
          >
            {c.done && <Icon name="Check" size={12} />}
          </span>
          <span className="task-title">{c.key ? t(c.key) : c.text}</span>
          <button
            className="task-delete"
            aria-label="delete"
            onClick={(e) => { e.stopPropagation(); remove(c.id); }}
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
      <div className="work-add-row">
        <input
          type="text"
          className="input"
          placeholder={t("prep_item_ph")}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
        />
        <Button variant="primary" onClick={add}>{t("add")}</Button>
      </div>
      <textarea
        className="input meeting-add-content interview-notes"
        placeholder={t("prep_notes_ph")}
        rows="3"
        value={prep.notes}
        onChange={(e) => onChange({ ...prep, notes: e.target.value })}
      />
    </Card>
  );
};

// --- Screen -----------------------------------------------------------------------

const WorkScreen = () => {
  const [data, setData] = React.useState(loadWorkData);
  const [careerGoals, setCareerGoals] = React.useState(loadCareerGoals);

  React.useEffect(() => { saveCareerGoals(careerGoals); }, [careerGoals]);

  React.useEffect(() => {
    saveWorkData(data);
  }, [data]);

  const cycleTask = (id) =>
    setData((prev) => ({
      ...prev,
      boardTasks: prev.boardTasks.map((t) =>
        t.id === id
          ? { ...t, status: WORK_STATUSES[(WORK_STATUSES.indexOf(t.status) + 1) % WORK_STATUSES.length] }
          : t
      ),
    }));

  const addTask = (title) =>
    setData((prev) => ({
      ...prev,
      boardTasks: [...prev.boardTasks, { id: `wt-${Date.now()}`, title, status: "Yapılacak" }],
    }));

  const addNote = (note) =>
    setData((prev) => ({
      ...prev,
      meetingNotes: [...prev.meetingNotes, { id: `wn-${Date.now()}`, ...note }],
    }));

  const changeHours = (delta) =>
    setData((prev) => ({
      ...prev,
      weeklyHoursLogged: Math.max(0, Math.round((prev.weeklyHoursLogged + delta) * 2) / 2),
    }));

  const doneCount = data.boardTasks.filter((t) => t.status === "Bitti").length;

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: WORK_COLOR }} />
          {t("work_title")}
        </h1>
        <span className="work-week-range">{formatWeekRange()}</span>
      </header>

      <WorkConflictBanner meetingNotes={data.meetingNotes} />
      <WorkBoard tasks={data.boardTasks} onCycle={cycleTask} onAdd={addTask} />
      <MeetingNotes notes={data.meetingNotes} onAdd={addNote} />
      <GoalListCard
        headingKey="career_goals"
        emptyKey="career_goals_empty"
        goals={careerGoals}
        setGoals={setCareerGoals}
        idPrefix="cg"
        className="goals-card"
      />
      <InterviewPrepCard
        prep={data.interviewPrep || { notes: "", checklist: [] }}
        onChange={(prep) => setData((prev) => ({ ...prev, interviewPrep: prep }))}
      />
      <WorkSummary
        doneCount={doneCount}
        meetingCount={data.meetingNotes.length}
        hoursLogged={data.weeklyHoursLogged}
        hoursTarget={data.weeklyHoursTarget}
        onHoursChange={changeHours}
      />
    </div>
  );
};
