// "Ders" (School) page: upcoming exams/events with countdowns, assignments,
// courses and study-time logging. All manual entry.

const SCHOOL_COLOR = "#7C93B3"; // dusty blue — Ders category color

function schoolShortDate(dateKey) {
  return new Date(dateKey + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" });
}

// "6 sa 30 dk" / "6 h 30 min" — omit a unit when it's zero.
function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hu = t("unit_hours");
  const mu = t("unit_min");
  if (h === 0) return `${m} ${mu}`;
  if (m === 0) return `${h} ${hu}`;
  return `${h} ${hu} ${m} ${mu}`;
}

// --- Upcoming (exams & events) -----------------------------------------------------

const UpcomingCard = ({ exams, courses, onAdd }) => {
  const [title, setTitle] = React.useState("");
  const [courseName, setCourseName] = React.useState(courses[0]?.name || "");
  const [date, setDate] = React.useState(getTodayKey());

  const today = getTodayKey();
  const upcoming = exams
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysLeft = (dateKey) =>
    Math.round((new Date(dateKey + "T00:00") - new Date(today + "T00:00")) / 86400000);

  const [warning, setWarning] = React.useState(null);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const day = date || getTodayKey();
    // Warn (don't block) when another exam/event already sits on that date.
    const clash = exams.find((e) => e.date === day);
    setWarning(clash ? tf("exam_conflict", { title: clash.title }) : null);
    onAdd({ title: trimmed, courseName: courseName.trim(), date: day });
    setTitle("");
  };

  return (
    <Card className="exam-card">
      <p className="card-heading">{t("upcoming")}</p>
      {warning && <p className="conflict-warning">{warning}</p>}
      {upcoming.length === 0 && (
        <EmptyState icon="CalendarDays" text={t("no_upcoming")} />
      )}
      {upcoming.map((e) => (
        <div key={e.id} className="exam-row">
          <div className="transaction-main">
            <span className="transaction-title">{e.title}</span>
            <span className="transaction-meta">
              {e.courseName ? `${e.courseName} · ` : ""}{schoolShortDate(e.date)}
            </span>
          </div>
          <span className="exam-days">
            {daysLeft(e.date) === 0 ? t("today_label") : tf("days_left", { n: daysLeft(e.date) })}
          </span>
        </div>
      ))}

      <div className="add-transaction-form">
        <div className="add-task-row">
          <input
            type="text"
            className="input"
            placeholder={t("upcoming_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </div>
        <div className="add-task-row">
          {courses.length > 0 ? (
            <select className="input add-task-select" value={courseName} onChange={(e) => setCourseName(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="input add-task-select"
              placeholder={t("course_name_ph")}
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          )}
          <input
            type="date"
            className="input add-task-select"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button variant="primary" onClick={submit}>{t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Assignments --------------------------------------------------------------------

const AssignmentRow = ({ assignment, onToggle }) => (
  <div
    className={`task-row ${assignment.done ? "done" : ""}`}
    onClick={() => onToggle(assignment.id)}
  >
    <span
      className="task-checkbox"
      style={assignment.done ? { backgroundColor: SCHOOL_COLOR, borderColor: SCHOOL_COLOR } : null}
    >
      {assignment.done && <Icon name="Check" size={12} />}
    </span>
    <span className="task-title">{assignment.title}</span>
    <span className="transaction-meta assignment-meta">
      {assignment.courseName} · {schoolShortDate(assignment.dueDate)}
    </span>
  </div>
);

const AssignmentsCard = ({ assignments, courses, onToggle, onAdd }) => {
  const [title, setTitle] = React.useState("");
  const [courseName, setCourseName] = React.useState(courses[0]?.name || "");
  const [dueDate, setDueDate] = React.useState(getTodayKey());

  const sorted = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const submit = () => {
    const trimmed = title.trim();
    const course = courseName.trim();
    if (!trimmed || !course) return;
    onAdd({ title: trimmed, courseName: course, dueDate: dueDate || getTodayKey() });
    setTitle("");
  };

  return (
    <Card className="assignments-card">
      <p className="card-heading">{t("assignments")}</p>
      {sorted.length === 0 && (
        <p className="placeholder-text">{t("no_assignments")}</p>
      )}
      {sorted.map((a) => (
        <AssignmentRow key={a.id} assignment={a} onToggle={onToggle} />
      ))}
      <div className="add-transaction-form">
        <div className="add-task-row">
          <input
            type="text"
            className="input"
            placeholder={t("new_assignment_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </div>
        <div className="add-task-row">
          {courses.length > 0 ? (
            <select className="input add-task-select" value={courseName} onChange={(e) => setCourseName(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="input add-task-select"
              placeholder={t("course_name_ph")}
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          )}
          <input
            type="date"
            className="input add-task-select"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Button variant="primary" onClick={submit}>{t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Courses --------------------------------------------------------------------------

const CoursesCard = ({ courses, onAdd }) => {
  const [name, setName] = React.useState("");
  const [schedule, setSchedule] = React.useState("");
  const [warning, setWarning] = React.useState(null);

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    // Warn (don't block) when the schedule overlaps an existing course's slot.
    const conflict = findScheduleConflict(schedule, courses);
    setWarning(conflict ? tf("schedule_conflict", { name: conflict }) : null);
    onAdd({ name: trimmedName, schedule: schedule.trim() });
    setName("");
    setSchedule("");
  };

  return (
    <Card className="courses-card">
      <p className="card-heading">{t("courses")}</p>
      {warning && <p className="conflict-warning">{warning}</p>}
      {courses.length === 0 && (
        <p className="placeholder-text">{t("no_courses")}</p>
      )}
      {courses.map((c) => (
        <div key={c.id} className="course-row">
          <span className="transaction-title">{c.name}</span>
          <span className="transaction-meta">{c.schedule || "—"}</span>
        </div>
      ))}
      <div className="add-goal-form">
        <input
          type="text"
          className="input course-name-input"
          placeholder={t("course_name_ph")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          type="text"
          className="input"
          placeholder={t("schedule_ph")}
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Study tracking ---------------------------------------------------------------------

const StudyCard = ({ studyLog, courses, onLog }) => {
  const [courseName, setCourseName] = React.useState(courses[0]?.name || "");
  const [minutes, setMinutes] = React.useState("");

  const monday = (() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const weeklyMinutes = studyLog
    .filter((s) => s.date >= monday)
    .reduce((sum, s) => sum + s.minutes, 0);

  const submit = () => {
    const num = parseInt(minutes, 10);
    const course = courseName.trim();
    if (!num || num <= 0 || !course) return;
    onLog({ courseName: course, minutes: num });
    setMinutes("");
  };

  return (
    <Card className="study-card">
      <p className="card-heading">{t("study")}</p>
      <p
        className="study-week-total"
        dangerouslySetInnerHTML={{
          __html: tf("studied_week", { t: `<strong>${formatMinutes(weeklyMinutes)}</strong>` }),
        }}
      />
      <div className="add-task-row">
        {courses.length > 0 ? (
          <select className="input add-task-select" value={courseName} onChange={(e) => setCourseName(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="input add-task-select"
            placeholder={t("course_name_ph")}
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
        )}
        <input
          type="number"
          className="input finance-amount-input"
          placeholder={t("minutes_ph")}
          min="0"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button variant="primary" onClick={submit}>{t("save")}</Button>
      </div>
    </Card>
  );
};

// --- Flashcards: aralıklı tekrar + quiz modu (Session 18) ---------------------------
// Review = SM-2 scheduling (due cards only, ratings move the due date).
// Quiz = random self-check over existing cards, no scheduling changes.

const FlashcardsCard = ({ flashcards, courses, onReview, onAdd }) => {
  const today = getTodayKey();
  const due = flashcards.filter((c) => c.dueDate <= today);

  const [flipped, setFlipped] = React.useState(false);
  // Quiz state: null = review mode; otherwise {cards, index, correct, revealed, done}
  const [quiz, setQuiz] = React.useState(null);

  // Creation form
  const [courseName, setCourseName] = React.useState(courses[0]?.name || "");
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");

  const rate = (card, rating) => {
    setFlipped(false);
    onReview(card.id, rating);
  };

  const startQuiz = () => {
    const pool = [...flashcards].sort(() => Math.random() - 0.5).slice(0, Math.min(5, flashcards.length));
    if (pool.length === 0) return;
    setQuiz({ cards: pool, index: 0, correct: 0, revealed: false, done: false });
  };

  const quizAnswer = (knew) => {
    setQuiz((q) => {
      const correct = q.correct + (knew ? 1 : 0);
      const nextIndex = q.index + 1;
      if (nextIndex >= q.cards.length) return { ...q, correct, done: true };
      return { ...q, correct, index: nextIndex, revealed: false };
    });
  };

  const addCard = () => {
    const f = front.trim();
    const b = back.trim();
    const c = courseName.trim();
    if (!f || !b || !c) return;
    onAdd({ courseName: c, front: f, back: b });
    setFront("");
    setBack("");
  };

  const current = due[0];

  return (
    <Card className="flashcards-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("flashcards")}</p>
        <span className="weekly-chart-avg">{tf("cards_due", { n: due.length })}</span>
      </div>

      {quiz ? (
        quiz.done ? (
          <div className="flashcard-review">
            <p className="flashcard-front">{tf("quiz_result", { a: quiz.correct, b: quiz.cards.length })}</p>
            <div className="flashcard-actions">
              <Button variant="secondary" onClick={() => setQuiz(null)}>{t("quiz_close")}</Button>
            </div>
          </div>
        ) : (
          <div className="flashcard-review">
            <p className="transaction-meta">
              {tf("quiz_progress", { a: quiz.index + 1, b: quiz.cards.length })} · {quiz.cards[quiz.index].courseName}
            </p>
            <p className="flashcard-front">{quiz.cards[quiz.index].front}</p>
            {quiz.revealed ? (
              <div>
                <p className="flashcard-back">{quiz.cards[quiz.index].back}</p>
                <div className="flashcard-actions">
                  <Button variant="secondary" onClick={() => quizAnswer(false)}>{t("quiz_missed")}</Button>
                  <Button variant="primary" onClick={() => quizAnswer(true)}>{t("quiz_knew")}</Button>
                </div>
              </div>
            ) : (
              <div className="flashcard-actions">
                <Button variant="secondary" onClick={() => setQuiz((q) => ({ ...q, revealed: true }))}>
                  {t("show_answer")}
                </Button>
              </div>
            )}
          </div>
        )
      ) : current ? (
        <div className="flashcard-review" onClick={() => !flipped && setFlipped(true)}>
          <p className="transaction-meta">{current.courseName}</p>
          <p className="flashcard-front">{current.front}</p>
          {flipped ? (
            <div>
              <p className="flashcard-back">{current.back}</p>
              <div className="flashcard-actions">
                <Button variant="secondary" onClick={() => rate(current, "hard")}>{t("rate_hard")}</Button>
                <Button variant="secondary" onClick={() => rate(current, "medium")}>{t("rate_medium")}</Button>
                <Button variant="primary" onClick={() => rate(current, "easy")}>{t("rate_easy")}</Button>
              </div>
            </div>
          ) : (
            <p className="placeholder-text">{t("tap_to_flip")}</p>
          )}
        </div>
      ) : (
        <p className="placeholder-text">{t("no_due_cards")}</p>
      )}

      {!quiz && flashcards.length > 0 && (
        <div className="flashcard-quiz-row">
          <Button variant="secondary" onClick={startQuiz}>
            {tf("start_quiz", { n: Math.min(5, flashcards.length) })}
          </Button>
        </div>
      )}

      <div className="add-transaction-form">
        <div className="add-task-row">
          {courses.length > 0 ? (
            <select className="input add-task-select" value={courseName} onChange={(e) => setCourseName(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text" className="input add-task-select" placeholder={t("course_name_ph")}
              value={courseName} onChange={(e) => setCourseName(e.target.value)}
            />
          )}
        </div>
        <div className="add-task-row">
          <input
            type="text" className="input" placeholder={t("card_front_ph")}
            value={front} onChange={(e) => setFront(e.target.value)}
          />
          <input
            type="text" className="input" placeholder={t("card_back_ph")}
            value={back} onChange={(e) => setBack(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCard(); }}
          />
          <Button variant="primary" onClick={addCard}>{t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Çakışma kontrolü (deterministic, no AI) -----------------------------------------
// Parses "Pzt 09:00"-style tokens out of a course's schedule string and
// flags same day+time pairs; exams conflict when they share a date.

function parseScheduleTokens(schedule) {
  const tokens = [];
  const re = /(Pzt|Sal|Çrş|Prş|Cum|Cmt|Paz)\s*(\d{1,2}[:.]\d{2})/gi;
  let m;
  while ((m = re.exec(schedule || "")) !== null) {
    tokens.push(`${m[1].toLowerCase()} ${m[2].replace(".", ":")}`);
  }
  return tokens;
}

function findScheduleConflict(newSchedule, courses) {
  const newTokens = parseScheduleTokens(newSchedule);
  for (const course of courses) {
    const existing = parseScheduleTokens(course.schedule);
    if (newTokens.some((tk) => existing.includes(tk))) return course.name;
  }
  return null;
}

// --- Screen ------------------------------------------------------------------------------

const SchoolScreen = () => {
  const [data, setData] = React.useState(loadSchoolData);

  React.useEffect(() => {
    saveSchoolData(data);
  }, [data]);

  const toggleAssignment = (id) =>
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
    }));

  const addAssignment = (a) =>
    setData((prev) => ({
      ...prev,
      assignments: [...prev.assignments, { id: `sa-${Date.now()}`, done: false, ...a }],
    }));

  const addExam = (e) =>
    setData((prev) => ({
      ...prev,
      exams: [...prev.exams, { id: `se-${Date.now()}`, ...e }],
    }));

  const addCourse = (c) =>
    setData((prev) => ({
      ...prev,
      courses: [...prev.courses, { id: `sc-${Date.now()}`, ...c }],
    }));

  const logStudy = ({ courseName, minutes }) =>
    setData((prev) => ({
      ...prev,
      studyLog: [...prev.studyLog, { date: getTodayKey(), minutes, courseName }],
    }));

  const reviewCard = (id, rating) =>
    setData((prev) => ({
      ...prev,
      flashcards: (prev.flashcards || []).map((c) => (c.id === id ? reviewFlashcard(c, rating) : c)),
    }));

  const addFlashcard = (card) =>
    setData((prev) => ({
      ...prev,
      flashcards: [
        ...(prev.flashcards || []),
        { id: `fc-${Date.now()}`, easeFactor: 2.5, intervalDays: 1, dueDate: getTodayKey(), ...card },
      ],
    }));

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: SCHOOL_COLOR }} />
          {t("school_title")}
        </h1>
      </header>

      <UpcomingCard exams={data.exams} courses={data.courses} onAdd={addExam} />
      <AssignmentsCard
        assignments={data.assignments}
        courses={data.courses}
        onToggle={toggleAssignment}
        onAdd={addAssignment}
      />
      <FlashcardsCard
        flashcards={data.flashcards || []}
        courses={data.courses}
        onReview={reviewCard}
        onAdd={addFlashcard}
      />
      <CoursesCard courses={data.courses} onAdd={addCourse} />
      <StudyCard studyLog={data.studyLog} courses={data.courses} onLog={logStudy} />
    </div>
  );
};
