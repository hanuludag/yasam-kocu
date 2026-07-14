// Session 11 — "Notlar & Günlük" (Notes & Journal) page: daily journal
// entries with a 1-10 day score, lightweight free-form notes, and a small
// reading list.
//
// Session 20 adds guided journal prompts (static bank, no AI), a 1-5 mood
// scale with a simple sport↔score correlation (plain averaging, not AI
// insight), "Bugün Geçen Yıl" memories, Web Speech dictation, and photo
// attachments (base64 — same localStorage-scaling caveat as Sağlık).

const JOURNAL_COLOR = "#A084A0"; // soft lilac — Kişisel category color
const BOOK_STATUSES = ["Okunacak", "Okunuyor", "Bitti"];

// Mood: stored as 1-5, shown as a labeled scale (no emoji).
function moodLabel(n) {
  return t(`mood_${n}`);
}

// Static prompt bank — rotating guided prompts, hardcoded on purpose.
// Personalized/adaptive prompts would need AI; out of scope for now.
// Language-keyed with identical [category][index] structure so a stored
// {cat, i} pair re-resolves to the right text after a language switch.
const JOURNAL_PROMPTS = {
  tr: {
    categories: ["Şükran", "Terapi tarzı", "Hedef odaklı", "Öz-keşif"],
    prompts: [
      [
        "Bugün minnettar olduğun 3 şey ne?",
        "Bugün seni gülümseten küçük bir an var mıydı?",
        "Hayatındaki hangi insana bugün teşekkür etmek isterdin?",
        "Sahip olduğun ama çoğu zaman fark etmediğin bir şey ne?",
        "Bu hafta seni şaşırtan güzel bir şey oldu mu?",
      ],
      [
        "Bugün seni en çok zorlayan duygu neydi? Nereden geldi?",
        "Son günlerde kafanı meşgul eden düşünce ne?",
        "Bugün kendine karşı nazik davrandın mı?",
        "Şu an vücudunda hangi duyguyu hissediyorsun?",
        "Bugün kaçındığın bir şey var mıydı? Neden?",
      ],
      [
        "Bugün hedeflerine seni yaklaştıran ne yaptın?",
        "Yarın yapacağın tek bir şey seçsen ne olurdu?",
        "Bu hafta hangi alışkanlığını güçlendirmek istiyorsun?",
        "Seni hedefinden alıkoyan en büyük engel ne?",
        "Bir yıl sonraki halin bugünkü sana ne söylerdi?",
      ],
      [
        "Bugün kendinle ilgili ne öğrendin?",
        "Seni gerçekten enerjilendiren şeyler neler?",
        "Hangi konuda fikrini yakın zamanda değiştirdin?",
        "Çocukken sevdiğin ama artık yapmadığın şey ne?",
        "Hayatında şu an neyi daha az, neyi daha çok istiyorsun?",
      ],
    ],
  },
  en: {
    categories: ["Gratitude", "Therapy-style", "Goal-focused", "Self-discovery"],
    prompts: [
      [
        "What are 3 things you're grateful for today?",
        "Was there a small moment that made you smile today?",
        "Who in your life would you want to thank today?",
        "What's something you have but often don't notice?",
        "Did something nice surprise you this week?",
      ],
      [
        "What emotion challenged you most today? Where did it come from?",
        "What thought has been occupying your mind lately?",
        "Were you kind to yourself today?",
        "What are you feeling in your body right now?",
        "Was there something you avoided today? Why?",
      ],
      [
        "What did you do today that moved you toward your goals?",
        "If you could pick one thing to do tomorrow, what would it be?",
        "Which habit do you want to strengthen this week?",
        "What's the biggest obstacle keeping you from your goal?",
        "What would your one-year-from-now self tell you today?",
      ],
      [
        "What did you learn about yourself today?",
        "What things truly energize you?",
        "What did you recently change your mind about?",
        "What did you love as a child but no longer do?",
        "What do you want less of, and more of, in your life right now?",
      ],
    ],
  },
};

function journalBank() {
  return JOURNAL_PROMPTS[APP_LANG] || JOURNAL_PROMPTS.tr;
}

// Stores category/prompt indices (not text) so it survives a language flip.
function randomPrompt() {
  const bank = journalBank();
  const cat = Math.floor(Math.random() * bank.categories.length);
  const i = Math.floor(Math.random() * bank.prompts[cat].length);
  return { cat, i };
}

function promptCategory(p) {
  return journalBank().categories[p.cat];
}
function promptText(p) {
  return journalBank().prompts[p.cat][p.i];
}

function journalShortDate(dateKey) {
  return new Date(dateKey + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" });
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

// --- Journal ---------------------------------------------------------------------

const DayScorePicker = ({ value, onChange }) => (
  <div className="day-score-picker" role="radiogroup" aria-label={t("day_score")}>
    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        className={`day-score-option ${value === n ? "active" : ""}`}
        onClick={() => onChange(n)}
      >
        {n}
      </button>
    ))}
  </div>
);

const JournalForm = ({ onAdd }) => {
  const [content, setContent] = React.useState("");
  const [bestMoment, setBestMoment] = React.useState("");
  const [lessonLearned, setLessonLearned] = React.useState("");
  const [dayScore, setDayScore] = React.useState(7);
  const [mood, setMood] = React.useState(3);
  const [prompt, setPrompt] = React.useState(randomPrompt);
  const [photoBase64, setPhotoBase64] = React.useState(null);
  const fileRef = React.useRef(null);

  // Same Web Speech hook as the Bugün add-task form (defined in today.jsx).
  const { supported: micSupported, listening, start: startListening } = useSpeechToText((transcript) => {
    setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const onPhotoPicked = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd({
      content: trimmed,
      bestMoment: bestMoment.trim(),
      lessonLearned: lessonLearned.trim(),
      dayScore,
      mood,
      photoBase64,
    });
    setContent("");
    setBestMoment("");
    setLessonLearned("");
    setDayScore(7);
    setMood(3);
    setPhotoBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="journal-form">
      <div className="journal-prompt">
        <div className="transaction-main">
          <span className="transaction-meta">{promptCategory(prompt)}</span>
          <span className="journal-prompt-text">{promptText(prompt)}</span>
        </div>
        <button
          className="goal-increment"
          onClick={() => setPrompt(randomPrompt())}
          title={t("shuffle_prompt")}
        >
          <Icon name="Shuffle" size={13} />
        </button>
      </div>
      <div className="journal-content-row">
        <textarea
          className="input meeting-add-content"
          placeholder={t("write_today_ph")}
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {micSupported && (
          <button
            type="button"
            className={`mic-button ${listening ? "listening" : ""}`}
            title={listening ? t("mic_listening") : t("mic_start")}
            onClick={startListening}
          >
            <Icon name="Mic" size={16} />
          </button>
        )}
      </div>
      <input
        type="text"
        className="input"
        placeholder={t("best_moment_ph")}
        value={bestMoment}
        onChange={(e) => setBestMoment(e.target.value)}
      />
      <input
        type="text"
        className="input"
        placeholder={t("lesson_ph")}
        value={lessonLearned}
        onChange={(e) => setLessonLearned(e.target.value)}
      />
      <div className="mood-picker" role="radiogroup" aria-label={t("mood_label")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`mood-option ${mood === n ? "active" : ""}`}
            onClick={() => setMood(n)}
          >
            {moodLabel(n)}
          </button>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="input body-photo-input"
        onChange={onPhotoPicked}
        aria-label={t("add_photo_label")}
      />
      <div className="journal-form-footer">
        <DayScorePicker value={dayScore} onChange={setDayScore} />
        <Button variant="primary" onClick={submit}>{t("save")}</Button>
      </div>
    </div>
  );
};

const JournalEntryCard = ({ entry }) => (
  <div className="journal-entry">
    <div className="journal-entry-head">
      <span className="transaction-meta">
        {journalShortDate(entry.date)}
        {entry.mood ? ` · ${moodLabel(entry.mood)}` : ""}
      </span>
      <span className="day-score-badge">{entry.dayScore}/10</span>
    </div>
    <p className="journal-entry-preview">{truncate(entry.content, 120)}</p>
    {entry.photoBase64 && (
      <img className="body-log-photo journal-entry-photo" src={entry.photoBase64} alt={t("journal_photo_alt")} />
    )}
    {entry.bestMoment && (
      <p className="journal-entry-extra">{t("best_moment_label")}{entry.bestMoment}</p>
    )}
    {entry.lessonLearned && (
      <p className="journal-entry-extra">{t("lesson_label")}{entry.lessonLearned}</p>
    )}
  </div>
);

// --- Spor ↔ gün skoru korelasyonu (deterministic, no AI) ---------------------------
// Plain averaging: mean day score on days with a completed Spor task vs.
// days without. Only speaks when both groups have data and the gap is real.

const CorrelationCard = () => {
  const scores = loadDailyScores();
  const tasks = loadTasks();
  const sportDates = new Set(
    tasks.filter((tk) => tk.done && tk.category === "Spor").map((tk) => tk.date)
  );

  const withSport = scores.filter((s) => sportDates.has(s.date)).map((s) => s.score);
  const withoutSport = scores.filter((s) => !sportDates.has(s.date)).map((s) => s.score);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const a = avg(withSport);
  const b = avg(withoutSport);

  let message = t("corr_empty");
  if (a !== null && b !== null) {
    const diff = Math.round(a - b);
    if (diff > 2) message = tf("corr_higher", { n: diff });
    else if (diff < -2) message = tf("corr_lower", { n: -diff });
    else message = t("corr_flat");
  }

  return (
    <Card className="correlation-card">
      <p className="card-heading">{t("observation")}</p>
      <p className="correlation-text">{message}</p>
      {a !== null && b !== null && (
        <p className="transaction-meta">
          {tf("corr_detail", {
            withPct: Math.round(a), withN: withSport.length,
            withoutPct: Math.round(b), withoutN: withoutSport.length,
          })}
        </p>
      )}
    </Card>
  );
};

// --- "Bugün Geçen Yıl" anıları -------------------------------------------------------
// Shows journal entries whose date is exactly N years before today. Nothing
// appears until the journal is at least a year old — the mechanism is what
// matters now.

const MemoriesCard = ({ entries }) => {
  const today = getTodayKey();
  const memories = entries.filter(
    (e) => e.date.slice(5) === today.slice(5) && e.date.slice(0, 4) < today.slice(0, 4)
  );
  if (memories.length === 0) return null;

  return (
    <Card className="memories-card">
      <p className="card-heading">{t("from_past")}</p>
      {memories.map((e) => {
        const yearsAgo = parseInt(today.slice(0, 4), 10) - parseInt(e.date.slice(0, 4), 10);
        return (
          <div key={e.id} className="journal-entry">
            <p className="transaction-meta">{tf("years_ago_today", { n: yearsAgo })}</p>
            <p className="journal-entry-preview">{truncate(e.content, 160)}</p>
          </div>
        );
      })}
    </Card>
  );
};

// --- Notes -----------------------------------------------------------------------

const NotesSection = ({ notes, onAdd, onUpdate }) => {
  const [editingId, setEditingId] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const { supported: micSupported, listening, start: startListening } = useSpeechToText((transcript) => {
    setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const startEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const cancel = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const submit = () => {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;
    if (editingId) onUpdate(editingId, { title: t, content: c });
    else onAdd({ title: t, content: c });
    cancel();
  };

  return (
    <Card className="notes-card">
      <p className="card-heading">{t("notes")}</p>
      {notes.length === 0 && (
        <p className="placeholder-text">{t("no_notes")}</p>
      )}
      {notes.map((n) => (
        <div key={n.id} className="note-row">
          <div className="transaction-main">
            <span className="transaction-title">{n.title}</span>
            <span className="note-content">{n.content}</span>
            <span className="transaction-meta">{t("updated_label")}{journalShortDate(n.updatedAt)}</span>
          </div>
          <button className="goal-increment" onClick={() => startEdit(n)}>{t("edit")}</button>
        </div>
      ))}

      <div className="meeting-add-form">
        <input
          type="text"
          className="input"
          placeholder={editingId ? t("note_title_editing_ph") : t("note_title_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="journal-content-row">
          <textarea
            className="input meeting-add-content"
            placeholder={t("note_content_ph")}
            rows="2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {micSupported && (
            <button
              type="button"
              className={`mic-button ${listening ? "listening" : ""}`}
              title={listening ? t("mic_listening") : t("mic_start")}
              onClick={startListening}
            >
              <Icon name="Mic" size={16} />
            </button>
          )}
        </div>
        <div className="meeting-add-actions">
          {editingId && <Button variant="secondary" onClick={cancel}>{t("cancel")}</Button>}
          <Button variant="primary" onClick={submit}>{editingId ? t("update") : t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Books -----------------------------------------------------------------------

const BooksSection = ({ books, onAdd, onStatusChange }) => {
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [status, setStatus] = React.useState("Okunacak");

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onAdd({ title: t, author: author.trim(), status });
    setTitle("");
    setAuthor("");
    setStatus("Okunacak");
  };

  return (
    <Card className="books-card">
      <p className="card-heading">{t("books")}</p>
      {books.length === 0 && (
        <p className="placeholder-text">{t("no_books")}</p>
      )}
      {BOOK_STATUSES.map((s) => {
        const group = books.filter((b) => b.status === s);
        if (group.length === 0) return null;
        return (
          <div key={s} className="book-group">
            <p className="work-column-head">{t(BOOK_STATUS_KEYS[s])} · {group.length}</p>
            {group.map((b) => (
              <div key={b.id} className="book-row">
                <div className="transaction-main">
                  <span className={`transaction-title ${b.status === "Bitti" ? "book-finished" : ""}`}>
                    {b.title}
                  </span>
                  {b.author && <span className="transaction-meta">{b.author}</span>}
                </div>
                <select
                  className="input book-status-select"
                  value={b.status}
                  onChange={(e) => onStatusChange(b.id, e.target.value)}
                  aria-label={b.title}
                >
                  {BOOK_STATUSES.map((opt) => (
                    <option key={opt} value={opt}>{t(BOOK_STATUS_KEYS[opt])}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      })}

      <div className="add-goal-form">
        <input
          type="text"
          className="input"
          placeholder={t("book_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          type="text"
          className="input book-author-input"
          placeholder={t("author_ph")}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          aria-label={t("author_ph")}
        />
        <select className="input book-status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {BOOK_STATUSES.map((s) => (
            <option key={s} value={s}>{t(BOOK_STATUS_KEYS[s])}</option>
          ))}
        </select>
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Screen ------------------------------------------------------------------------

const JournalScreen = () => {
  const [data, setData] = React.useState(loadJournalData);

  React.useEffect(() => {
    saveJournalData(data);
  }, [data]);

  const addEntry = (entry) =>
    setData((prev) => ({
      ...prev,
      journalEntries: [
        ...prev.journalEntries,
        { id: `nj-${Date.now()}`, date: getTodayKey(), ...entry },
      ],
    }));

  const addNote = (note) =>
    setData((prev) => ({
      ...prev,
      notes: [...prev.notes, { id: `nn-${Date.now()}`, updatedAt: getTodayKey(), ...note }],
    }));

  const updateNote = (id, changes) =>
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...changes, updatedAt: getTodayKey() } : n
      ),
    }));

  const addBook = (book) =>
    setData((prev) => ({
      ...prev,
      books: [...prev.books, { id: `nb-${Date.now()}`, ...book }],
    }));

  const changeBookStatus = (id, status) =>
    setData((prev) => ({
      ...prev,
      books: prev.books.map((b) => (b.id === id ? { ...b, status } : b)),
    }));

  const sortedEntries = [...data.journalEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: JOURNAL_COLOR }} />
          {t("journal_title")}
        </h1>
      </header>

      <MemoriesCard entries={data.journalEntries} />

      <Card className="journal-card">
        <p className="card-heading">{t("journal")}</p>
        <JournalForm onAdd={addEntry} />
        {sortedEntries.length === 0 ? (
          <EmptyState icon="PenLine" text={t("no_entries")} />
        ) : (
          <div className="journal-entries">
            {sortedEntries.map((e) => (
              <JournalEntryCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </Card>

      <CorrelationCard />
      <NotesSection notes={data.notes} onAdd={addNote} onUpdate={updateNote} />
      <BooksSection books={data.books} onAdd={addBook} onStatusChange={changeBookStatus} />
    </div>
  );
};
