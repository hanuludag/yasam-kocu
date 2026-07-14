// "Program" page: weekly recurring plan + monthly one-off plan, backed by
// loadProgramData/saveProgramData (storage.js). The screen file was missing
// even though app.jsx routed to it — restored while wiring Session 21/22.

const PROGRAM_COLOR = "#7C93B3"; // dusty blue — same family as Ders

const ProgramWeeklyCard = ({ weekly, onAdd, onDelete }) => {
  const [day, setDay] = React.useState(0);
  const [time, setTime] = React.useState("");
  const [title, setTitle] = React.useState("");
  const weekdays = t("weekdays");

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({ day: Number(day), time: time || null, title: trimmed });
    setTitle("");
    setTime("");
  };

  return (
    <Card className="program-weekly-card">
      <p className="card-heading">{t("weekly_program")}</p>
      {weekly.length === 0 && <p className="placeholder-text">{t("no_weekly_program")}</p>}
      {weekdays.map((label, i) => {
        const entries = weekly
          .filter((e) => e.day === i)
          .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        if (entries.length === 0) return null;
        return (
          <div key={label} className="program-day-group">
            <p className="work-column-head">{label}</p>
            {entries.map((e) => (
              <div key={e.id} className="reminder-row">
                {e.time && <span className="task-time">{e.time}</span>}
                <span className="task-title">{e.title}</span>
                <button className="task-delete" aria-label="delete" onClick={() => onDelete(e.id)}>
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
      <div className="add-task-row">
        <select className="input add-task-select" value={day} onChange={(e) => setDay(e.target.value)}>
          {weekdays.map((label, i) => (
            <option key={label} value={i}>{label}</option>
          ))}
        </select>
        <input
          type="time"
          className="input add-task-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          type="text"
          className="input add-task-title"
          placeholder={t("activity_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

const ProgramMonthlyCard = ({ monthly, onAdd, onDelete }) => {
  const [date, setDate] = React.useState(getTodayKey());
  const [title, setTitle] = React.useState("");

  const sorted = [...monthly].sort((a, b) => a.date.localeCompare(b.date));

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({ date: date || getTodayKey(), title: trimmed });
    setTitle("");
  };

  return (
    <Card className="program-monthly-card">
      <p className="card-heading">{t("monthly_program")}</p>
      {sorted.length === 0 && <p className="placeholder-text">{t("no_monthly_program")}</p>}
      {sorted.map((e) => (
        <div key={e.id} className="reminder-row">
          <span className="task-time">
            {new Date(e.date + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" })}
          </span>
          <span className="task-title">{e.title}</span>
          <button className="task-delete" aria-label="delete" onClick={() => onDelete(e.id)}>
            <Icon name="X" size={14} />
          </button>
        </div>
      ))}
      <div className="add-task-row">
        <input
          type="date"
          className="input add-task-select"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="text"
          className="input add-task-title"
          placeholder={t("activity_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

const ProgramScreen = () => {
  const [data, setData] = React.useState(loadProgramData);

  React.useEffect(() => {
    saveProgramData(data);
  }, [data]);

  const addWeekly = (entry) =>
    setData((prev) => ({ ...prev, weekly: [...prev.weekly, { id: `pw-${Date.now()}`, ...entry }] }));
  const deleteWeekly = (id) =>
    setData((prev) => ({ ...prev, weekly: prev.weekly.filter((e) => e.id !== id) }));
  const addMonthly = (entry) =>
    setData((prev) => ({ ...prev, monthly: [...prev.monthly, { id: `pm-${Date.now()}`, ...entry }] }));
  const deleteMonthly = (id) =>
    setData((prev) => ({ ...prev, monthly: prev.monthly.filter((e) => e.id !== id) }));

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: PROGRAM_COLOR }} />
          {t("program_title")}
        </h1>
      </header>

      <ProgramWeeklyCard weekly={data.weekly} onAdd={addWeekly} onDelete={deleteWeekly} />
      <ProgramMonthlyCard monthly={data.monthly} onAdd={addMonthly} onDelete={deleteMonthly} />
    </div>
  );
};
