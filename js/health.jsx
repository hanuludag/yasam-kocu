// Session 9 — "Sağlık" (Health) page: daily water intake, workouts and
// sleep logging. All entries are manual — no wearables, no calorie
// calculation; calories are the user's own estimate. Reached from the
// Sayfalar gallery's "Sağlık" template card.
//
// Session 23 — each sub-section is independently toggleable via the
// enabledSections mechanism (storage.js) + HEALTH_SECTIONS (tokens.js).
// Sections not picked during onboarding stay hidden but can be added any
// time from the "+ Bölüm ekle" control at the bottom of this screen.

const HEALTH_COLOR = "#829A78"; // sage — Sağlık category color
const SLEEP_QUALITIES = ["İyi", "Orta", "Kötü"];
// Quality indicator tones from the existing muted palette (no new colors).
const SLEEP_QUALITY_COLORS = { "İyi": "#829A78", "Orta": "#B99A5B", "Kötü": "#B08268" };

function healthShortDate(dateKey) {
  return new Date(dateKey + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" });
}

// --- Water tracking -------------------------------------------------------------

const WaterCard = ({ waterLog, target, onChange }) => {
  const today = getTodayKey();
  const todayGlasses = waterLog.find((w) => w.date === today)?.glasses || 0;

  return (
    <Card className="water-card">
      <p className="card-heading">{t("water")}</p>
      <div className="water-progress">
        <span className="water-count">{tf("glasses_line", { a: todayGlasses, b: target })}</span>
        <div className="water-dots">
          {Array.from({ length: target }, (_, i) => (
            <span key={i} className={`water-dot ${i < todayGlasses ? "filled" : ""}`} />
          ))}
        </div>
      </div>
      {todayGlasses === 0 && (
        <p className="water-empty">{t("water_empty")}</p>
      )}
      <div className="water-actions">
        <Button variant="primary" onClick={() => onChange(1)}>{t("plus_glass")}</Button>
        <button
          className="goal-increment"
          onClick={() => onChange(-1)}
          disabled={todayGlasses === 0}
        >
          {t("undo")}
        </button>
      </div>
    </Card>
  );
};

// --- Workouts ----------------------------------------------------------------------

const WorkoutCard = ({ workouts, onAdd }) => {
  const [title, setTitle] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [calories, setCalories] = React.useState("");

  // Monday of the current week, for the weekly calorie sum.
  const monday = (() => {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const weeklyCalories = workouts
    .filter((w) => w.date >= monday)
    .reduce((sum, w) => sum + w.caloriesBurned, 0);

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

  const submit = () => {
    const trimmed = title.trim();
    const dur = parseInt(duration, 10);
    const kcal = parseInt(calories, 10);
    if (!trimmed || !dur || dur <= 0 || !kcal || kcal <= 0) return;
    onAdd({ title: trimmed, durationMinutes: dur, caloriesBurned: kcal });
    setTitle("");
    setDuration("");
    setCalories("");
  };

  return (
    <Card className="workout-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("workouts")}</p>
        <span className="weekly-chart-avg">{tf("burned_week", { n: weeklyCalories.toLocaleString(appLocale()) })}</span>
      </div>

      {sorted.length === 0 && (
        <p className="placeholder-text">{t("no_workouts")}</p>
      )}
      {sorted.map((w) => (
        <div key={w.id} className="workout-row">
          <div className="transaction-main">
            <span className="transaction-title">{w.title}</span>
            <span className="transaction-meta">{healthShortDate(w.date)} · {w.durationMinutes} {t("unit_min")}</span>
          </div>
          <span className="workout-calories">{w.caloriesBurned.toLocaleString(appLocale())} kcal</span>
        </div>
      ))}

      <div className="add-transaction-form">
        <div className="add-task-row">
          <input
            type="text"
            className="input"
            placeholder={t("workout_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </div>
        <div className="add-task-row">
          <input
            type="number"
            className="input finance-amount-input"
            placeholder={t("duration_ph")}
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-label={t("duration_ph")}
          />
          <input
            type="number"
            className="input finance-amount-input"
            placeholder="kcal"
            min="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            aria-label="kcal"
          />
          <Button variant="primary" onClick={submit}>{t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Sleep -------------------------------------------------------------------------

const SleepCard = ({ sleepLog, onLog }) => {
  const [hours, setHours] = React.useState("");
  const [quality, setQuality] = React.useState("İyi");

  const sorted = [...sleepLog].sort((a, b) => b.date.localeCompare(a.date));

  // Average hours over entries from the last 7 days.
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const recent = sleepLog.filter((s) => s.date >= weekAgo);
  const avg = recent.length > 0
    ? recent.reduce((sum, s) => sum + s.hours, 0) / recent.length
    : null;

  const submit = () => {
    const num = parseFloat(hours);
    if (!num || num <= 0 || num > 24) return;
    onLog({ hours: num, quality });
    setHours("");
    setQuality("İyi");
  };

  return (
    <Card className="sleep-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("sleep")}</p>
        {avg !== null && (
          <span className="weekly-chart-avg">
            {tf("sleep_avg", { n: avg.toLocaleString(appLocale(), { maximumFractionDigits: 1 }) })}
          </span>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="placeholder-text">{t("no_sleep")}</p>
      )}
      {sorted.map((s) => (
        <div key={s.date} className="sleep-row">
          <span className="transaction-meta sleep-date">{healthShortDate(s.date)}</span>
          <span className="sleep-hours">{s.hours.toLocaleString(appLocale())} {t("unit_sleep_hours")}</span>
          <span className="sleep-quality">
            <span className="category-dot" style={{ backgroundColor: SLEEP_QUALITY_COLORS[s.quality] }} />
            {t(SLEEP_QUALITY_KEYS[s.quality] || "quality_Iyi")}
          </span>
        </div>
      ))}

      <div className="add-task-row sleep-form">
        <input
          type="number"
          className="input finance-amount-input"
          placeholder={t("hours_ph")}
          min="0"
          max="24"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          aria-label={t("hours_ph")}
        />
        <select className="input add-task-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
          {SLEEP_QUALITIES.map((q) => (
            <option key={q} value={q}>{t(SLEEP_QUALITY_KEYS[q])}</option>
          ))}
        </select>
        <Button variant="primary" onClick={submit}>{t("save")}</Button>
      </div>
    </Card>
  );
};

// --- Vücut ölçüleri & ilerleme fotoğrafı (Session 17) -----------------------------
// Manual log of weight, optional measurements and an optional progress
// photo. The photo is stored as base64 in localStorage — acceptable for a
// few small images, but it doesn't scale (quota ~5MB); move to real file
// storage once a backend exists.

const BodyLogCard = ({ bodyLog, onAdd }) => {
  const [weight, setWeight] = React.useState("");
  const [waist, setWaist] = React.useState("");
  const [chest, setChest] = React.useState("");
  const [arm, setArm] = React.useState("");
  const [photoBase64, setPhotoBase64] = React.useState(null);
  const fileRef = React.useRef(null);

  const onPhotoPicked = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    const measurements = {};
    const wa = parseFloat(waist); if (wa > 0) measurements.waist = wa;
    const ch = parseFloat(chest); if (ch > 0) measurements.chest = ch;
    const ar = parseFloat(arm); if (ar > 0) measurements.arm = ar;
    onAdd({ weightKg: w, measurements, photoBase64 });
    setWeight(""); setWaist(""); setChest(""); setArm("");
    setPhotoBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sorted = [...bodyLog].sort((a, b) => b.date.localeCompare(a.date));

  const measurementLine = (m) => {
    const parts = [];
    if (m.waist) parts.push(`${t("body_waist")} ${m.waist}`);
    if (m.chest) parts.push(`${t("body_chest")} ${m.chest}`);
    if (m.arm) parts.push(`${t("body_arm")} ${m.arm}`);
    return parts.join(" · ");
  };

  return (
    <Card className="body-log-card">
      <p className="card-heading">{t("body_title")}</p>

      {sorted.length === 0 && (
        <p className="placeholder-text">{t("body_empty")}</p>
      )}
      {sorted.map((entry) => (
        <div key={entry.date + entry.weightKg} className="body-log-row">
          {entry.photoBase64 && (
            <img className="body-log-photo" src={entry.photoBase64} alt={t("body_photo_alt")} />
          )}
          <div className="transaction-main">
            <span className="transaction-title">
              {entry.weightKg.toLocaleString(appLocale(), { maximumFractionDigits: 1 })} kg
            </span>
            {entry.measurements && measurementLine(entry.measurements) && (
              <span className="transaction-meta">{measurementLine(entry.measurements)}</span>
            )}
            <span className="transaction-meta">{healthShortDate(entry.date)}</span>
          </div>
        </div>
      ))}

      <div className="add-transaction-form">
        <div className="add-task-row">
          <input
            type="number" className="input finance-amount-input" placeholder={t("body_weight_ph")}
            min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
            aria-label={t("body_weight_ph")}
          />
          <input
            type="number" className="input finance-amount-input" placeholder={t("body_waist_ph")}
            min="0" value={waist} onChange={(e) => setWaist(e.target.value)}
            aria-label={t("body_waist_ph")}
          />
          <input
            type="number" className="input finance-amount-input" placeholder={t("body_chest_ph")}
            min="0" value={chest} onChange={(e) => setChest(e.target.value)}
            aria-label={t("body_chest_ph")}
          />
          <input
            type="number" className="input finance-amount-input" placeholder={t("body_arm_ph")}
            min="0" value={arm} onChange={(e) => setArm(e.target.value)}
            aria-label={t("body_arm_ph")}
          />
        </div>
        <div className="add-task-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="input body-photo-input"
            onChange={onPhotoPicked}
            aria-label={t("body_photo_label")}
          />
          <Button variant="primary" onClick={submit}>{t("add")}</Button>
        </div>
        {photoBase64 && <p className="transaction-meta">{t("body_photo_ready")}</p>}
      </div>
    </Card>
  );
};

// --- Kalori & Protein Takibi (Session 28) -------------------------------------------
// Manually entered daily targets + a running log of manually typed entries;
// no food database, no auto-calculation — the numbers are the user's own.

const NutritionProgressBar = ({ label, total, target, unit }) => {
  const ratio = target > 0 ? Math.min(total / target, 1) : 0;
  return (
    <div className="nutrition-progress">
      <div className="nutrition-progress-head">
        <span className="nutrition-progress-label">{label}</span>
        <span className="transaction-meta">
          {total.toLocaleString(appLocale())} / {target.toLocaleString(appLocale())} {unit}
        </span>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
};

const NutritionCard = ({ targets, entries, onSetTargets, onAddEntry, onDeleteEntry }) => {
  const today = getTodayKey();
  const todayEntries = entries.filter((e) => e.date === today);
  const [editingTargets, setEditingTargets] = React.useState(!targets);
  const [calTarget, setCalTarget] = React.useState(targets ? String(targets.calories) : "");
  const [protTarget, setProtTarget] = React.useState(targets ? String(targets.protein) : "");
  const [fatTarget, setFatTarget] = React.useState(targets ? String(targets.fat) : "");

  const [desc, setDesc] = React.useState("");
  const [cal, setCal] = React.useState("");
  const [prot, setProt] = React.useState("");
  const [fat, setFat] = React.useState("");

  const saveTargets = () => {
    const c = parseInt(calTarget, 10);
    const p = parseInt(protTarget, 10);
    const f = parseInt(fatTarget, 10);
    if (!c || c <= 0 || !p || p <= 0 || !f || f <= 0) return;
    onSetTargets({ calories: c, protein: p, fat: f });
    setEditingTargets(false);
  };

  const addEntry = () => {
    const trimmed = desc.trim();
    const c = parseInt(cal, 10) || 0;
    const p = parseInt(prot, 10) || 0;
    const f = parseInt(fat, 10) || 0;
    if (!trimmed || c < 0) return;
    onAddEntry({ description: trimmed, calories: c, protein: p, fat: f });
    setDesc(""); setCal(""); setProt(""); setFat("");
  };

  const sum = (key) => todayEntries.reduce((s, e) => s + (e[key] || 0), 0);

  return (
    <Card className="nutrition-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("hs_nutrition")}</p>
        {targets && !editingTargets && (
          <button className="goal-increment" onClick={() => setEditingTargets(true)}>{t("edit")}</button>
        )}
      </div>

      {editingTargets ? (
        <div className="add-task-row">
          <input type="number" className="input finance-amount-input" placeholder={t("target_cal_ph")}
            min="0" value={calTarget} onChange={(e) => setCalTarget(e.target.value)} aria-label={t("target_cal_ph")} />
          <input type="number" className="input finance-amount-input" placeholder={t("target_prot_ph")}
            min="0" value={protTarget} onChange={(e) => setProtTarget(e.target.value)} aria-label={t("target_prot_ph")} />
          <input type="number" className="input finance-amount-input" placeholder={t("target_fat_ph")}
            min="0" value={fatTarget} onChange={(e) => setFatTarget(e.target.value)} aria-label={t("target_fat_ph")} />
          <Button variant="primary" onClick={saveTargets}>{t("save")}</Button>
        </div>
      ) : targets ? (
        <div className="nutrition-progress-group">
          <NutritionProgressBar label={t("nutr_calories")} total={sum("calories")} target={targets.calories} unit="kcal" />
          <NutritionProgressBar label={t("nutr_protein")} total={sum("protein")} target={targets.protein} unit="g" />
          <NutritionProgressBar label={t("nutr_fat")} total={sum("fat")} target={targets.fat} unit="g" />
        </div>
      ) : null}

      {todayEntries.map((e) => (
        <div key={e.id} className="transaction-row">
          <div className="transaction-main">
            <span className="transaction-title">{e.description}</span>
            <span className="transaction-meta">
              {e.calories} kcal · {e.protein} g {t("nutr_protein").toLocaleLowerCase(appLocale())} · {e.fat} g {t("nutr_fat").toLocaleLowerCase(appLocale())}
            </span>
          </div>
          <button className="task-delete" aria-label="delete" onClick={() => onDeleteEntry(e.id)}>
            <Icon name="X" size={13} />
          </button>
        </div>
      ))}

      <div className="add-transaction-form">
        <div className="add-task-row">
          <input type="text" className="input" placeholder={t("nutr_entry_ph")}
            value={desc} onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addEntry(); }} />
        </div>
        <div className="add-task-row">
          <input type="number" className="input finance-amount-input" placeholder="kcal"
            min="0" value={cal} onChange={(e) => setCal(e.target.value)} aria-label="kcal" />
          <input type="number" className="input finance-amount-input" placeholder={t("target_prot_ph")}
            min="0" value={prot} onChange={(e) => setProt(e.target.value)} aria-label={t("target_prot_ph")} />
          <input type="number" className="input finance-amount-input" placeholder={t("target_fat_ph")}
            min="0" value={fat} onChange={(e) => setFat(e.target.value)} aria-label={t("target_fat_ph")} />
          <Button variant="primary" onClick={addEntry}>{t("add")}</Button>
        </div>
      </div>
    </Card>
  );
};

// --- Günlük Yemek Programı (Session 28) ---------------------------------------------
// Plan what to eat per slot, then check off whether it went to plan.
// Deliberately NOT linked to the calorie log math — planning vs. logging.

const MEAL_SLOTS = ["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"];
const MEAL_SLOT_KEYS = { "Kahvaltı": "meal_breakfast", "Öğle": "meal_lunch", "Akşam": "meal_dinner", "Ara Öğün": "meal_snack" };

const MealPlanCard = ({ mealPlans, onChange }) => {
  const today = getTodayKey();
  const todayPlan = mealPlans.find((m) => m.date === today) || { date: today, slots: {} };

  const updateSlot = (slot, changes) => {
    const current = todayPlan.slots[slot] || { text: "", done: false };
    const nextPlan = {
      ...todayPlan,
      slots: { ...todayPlan.slots, [slot]: { ...current, ...changes } },
    };
    onChange([...mealPlans.filter((m) => m.date !== today), nextPlan]);
  };

  return (
    <Card className="meal-plan-card">
      <p className="card-heading">{t("hs_mealplan")}</p>
      <p className="placeholder-text meal-plan-sub">{t("meal_plan_sub")}</p>
      {MEAL_SLOTS.map((slot) => {
        const entry = todayPlan.slots[slot] || { text: "", done: false };
        return (
          <div key={slot} className="meal-slot-row">
            <span
              className="task-checkbox"
              style={entry.done ? { backgroundColor: HEALTH_COLOR, borderColor: HEALTH_COLOR } : null}
              onClick={() => updateSlot(slot, { done: !entry.done })}
              title={t("meal_done_hint")}
            >
              {entry.done && <Icon name="Check" size={12} />}
            </span>
            <span className="meal-slot-name">{t(MEAL_SLOT_KEYS[slot])}</span>
            <input
              type="text"
              className="input meal-slot-input"
              placeholder={t("meal_plan_ph")}
              value={entry.text}
              onChange={(e) => updateSlot(slot, { text: e.target.value })}
            />
          </div>
        );
      })}
    </Card>
  );
};

// --- İlaç / Supplement / Vitamin Takibi (Session 28) ---------------------------------

const MED_TIMES = ["Sabah", "Öğlen", "Akşam", "Gece"];
const MED_TIME_KEYS = { "Sabah": "med_morning", "Öğlen": "med_noon", "Akşam": "med_evening", "Gece": "med_night" };

const MedicationsCard = ({ medications, medicationLog, onChangeMeds, onToggleToday }) => {
  const today = getTodayKey();
  const [editingId, setEditingId] = React.useState(null);
  const [name, setName] = React.useState("");
  const [timeOfDay, setTimeOfDay] = React.useState(MED_TIMES[0]);
  const [recurring, setRecurring] = React.useState(true);

  const isCheckedToday = (id) => medicationLog.some((l) => l.date === today && l.medicationId === id);
  const everChecked = (id) => medicationLog.some((l) => l.medicationId === id);
  // Daily checklist: recurring meds always; one-offs until first checked day passes.
  const checklist = medications.filter((m) => m.recurring || !everChecked(m.id) || isCheckedToday(m.id));

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTimeOfDay(MED_TIMES[0]);
    setRecurring(true);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editingId) {
      onChangeMeds(medications.map((m) =>
        m.id === editingId ? { ...m, name: trimmed, timeOfDay, recurring } : m
      ));
    } else {
      onChangeMeds([...medications, { id: `med-${Date.now()}`, name: trimmed, timeOfDay, recurring }]);
    }
    resetForm();
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setName(m.name);
    setTimeOfDay(m.timeOfDay);
    setRecurring(m.recurring);
  };

  const remove = (id) => {
    onChangeMeds(medications.filter((m) => m.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <Card className="medications-card">
      <p className="card-heading">{t("hs_medications")}</p>
      {medications.length === 0 && <p className="placeholder-text">{t("meds_empty")}</p>}
      {checklist.map((m) => (
        <div key={m.id} className={`task-row ${isCheckedToday(m.id) ? "done" : ""}`} onClick={() => onToggleToday(m.id)}>
          <span
            className="task-checkbox"
            style={isCheckedToday(m.id) ? { backgroundColor: HEALTH_COLOR, borderColor: HEALTH_COLOR } : null}
          >
            {isCheckedToday(m.id) && <Icon name="Check" size={12} />}
          </span>
          <span className="task-title">{m.name}</span>
          <span className="transaction-meta">
            {t(MED_TIME_KEYS[m.timeOfDay] || "med_morning")}{m.recurring ? ` · ${t("med_recurring")}` : ""}
          </span>
          <button className="block-control" aria-label="edit" title={t("edit")}
            onClick={(e) => { e.stopPropagation(); startEdit(m); }}>
            <Icon name="Pencil" size={12} />
          </button>
          <button className="task-delete" aria-label="delete"
            onClick={(e) => { e.stopPropagation(); remove(m.id); }}>
            <Icon name="X" size={13} />
          </button>
        </div>
      ))}
      <div className="add-task-row">
        <input type="text" className="input" placeholder={t("med_name_ph")}
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        <select className="input add-task-select" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
          {MED_TIMES.map((mt) => (
            <option key={mt} value={mt}>{t(MED_TIME_KEYS[mt])}</option>
          ))}
        </select>
        <label className="urgent-checkbox">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          {t("med_recurring")}
        </label>
        <Button variant="primary" onClick={submit}>{editingId ? t("update") : t("add")}</Button>
      </div>
    </Card>
  );
};

// --- Şeker / Abur-cubur Takibi (Session 28) ------------------------------------------
// One neutral daily question. Tone stays light on purpose — this is a
// tracking tool, not a scolding one, so no warning colors, no judgment.

const SugarCard = ({ sugarLog, onLog }) => {
  const today = getTodayKey();
  const entry = sugarLog.find((s) => s.date === today) || null;
  const [note, setNote] = React.useState(entry ? entry.note : "");

  const setAnswer = (ate) => onLog({ date: today, ate, note: note.trim() });

  return (
    <Card className="sugar-card">
      <p className="card-heading">{t("hs_sugar")}</p>
      <p className="sugar-question">{t("sugar_question")}</p>
      <div className="type-toggle sugar-toggle">
        <button
          className={`type-toggle-option ${entry && entry.ate === true ? "active" : ""}`}
          onClick={() => setAnswer(true)}
        >
          {t("yes")}
        </button>
        <button
          className={`type-toggle-option ${entry && entry.ate === false ? "active" : ""}`}
          onClick={() => setAnswer(false)}
        >
          {t("no")}
        </button>
      </div>
      <input
        type="text"
        className="input sugar-note-input"
        placeholder={t("sugar_note_ph")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => { if (entry) onLog({ ...entry, note: note.trim() }); }}
      />
      {entry && <p className="transaction-meta">{t("sugar_saved")}</p>}
    </Card>
  );
};

// --- Screen ---------------------------------------------------------------------------

const HealthScreen = () => {
  const [data, setData] = React.useState(loadHealthData);
  const [enabled, setEnabled] = React.useState(() => getEnabledSections("saglik"));

  React.useEffect(() => {
    saveHealthData(data);
  }, [data]);

  const has = (key) => enabled.includes(key);
  const addSection = (key) => {
    addEnabledSection("saglik", key);
    setEnabled(getEnabledSections("saglik"));
  };

  const changeWater = (delta) =>
    setData((prev) => {
      const today = getTodayKey();
      const existing = prev.waterLog.find((w) => w.date === today);
      const glasses = Math.max(0, (existing?.glasses || 0) + delta);
      const waterLog = existing
        ? prev.waterLog.map((w) => (w.date === today ? { ...w, glasses } : w))
        : [...prev.waterLog, { date: today, glasses }];
      return { ...prev, waterLog };
    });

  const addWorkout = (workout) =>
    setData((prev) => ({
      ...prev,
      workouts: [...prev.workouts, { id: `hw-${Date.now()}`, date: getTodayKey(), ...workout }],
    }));

  // Logging sleep for today replaces any existing entry for today.
  const logSleep = ({ hours, quality }) =>
    setData((prev) => {
      const today = getTodayKey();
      const sleepLog = [
        ...prev.sleepLog.filter((s) => s.date !== today),
        { date: today, hours, quality },
      ];
      return { ...prev, sleepLog };
    });

  const addBodyEntry = (entry) =>
    setData((prev) => ({
      ...prev,
      bodyLog: [...(prev.bodyLog || []), { date: getTodayKey(), ...entry }],
    }));

  // Session 28 — nutrition / meal plan / medications / sugar handlers.
  const setNutritionTargets = (targets) =>
    setData((prev) => ({ ...prev, nutritionTargets: targets }));

  const addNutritionEntry = (entry) =>
    setData((prev) => ({
      ...prev,
      nutritionEntries: [
        ...(prev.nutritionEntries || []),
        { id: `ne-${Date.now()}`, date: getTodayKey(), ...entry },
      ],
    }));

  const deleteNutritionEntry = (id) =>
    setData((prev) => ({
      ...prev,
      nutritionEntries: (prev.nutritionEntries || []).filter((e) => e.id !== id),
    }));

  const setMealPlans = (mealPlans) =>
    setData((prev) => ({ ...prev, mealPlans }));

  const setMedications = (medications) =>
    setData((prev) => ({ ...prev, medications }));

  const toggleMedicationToday = (medicationId) =>
    setData((prev) => {
      const today = getTodayKey();
      const log = prev.medicationLog || [];
      const exists = log.some((l) => l.date === today && l.medicationId === medicationId);
      return {
        ...prev,
        medicationLog: exists
          ? log.filter((l) => !(l.date === today && l.medicationId === medicationId))
          : [...log, { date: today, medicationId }],
      };
    });

  const logSugar = (entry) =>
    setData((prev) => ({
      ...prev,
      sugarLog: [...(prev.sugarLog || []).filter((s) => s.date !== entry.date), entry],
    }));

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: HEALTH_COLOR }} />
          {t("health_title")}
        </h1>
      </header>

      {has("water") && (
        <WaterCard waterLog={data.waterLog} target={data.waterDailyTarget} onChange={changeWater} />
      )}
      {has("workouts") && (
        <WorkoutCard workouts={data.workouts} onAdd={addWorkout} />
      )}
      {has("sleep") && (
        <SleepCard sleepLog={data.sleepLog} onLog={logSleep} />
      )}
      {has("body") && (
        <BodyLogCard bodyLog={data.bodyLog || []} onAdd={addBodyEntry} />
      )}
      {has("nutrition") && (
        <NutritionCard
          targets={data.nutritionTargets}
          entries={data.nutritionEntries || []}
          onSetTargets={setNutritionTargets}
          onAddEntry={addNutritionEntry}
          onDeleteEntry={deleteNutritionEntry}
        />
      )}
      {has("mealPlan") && (
        <MealPlanCard mealPlans={data.mealPlans || []} onChange={setMealPlans} />
      )}
      {has("medications") && (
        <MedicationsCard
          medications={data.medications || []}
          medicationLog={data.medicationLog || []}
          onChangeMeds={setMedications}
          onToggleToday={toggleMedicationToday}
        />
      )}
      {has("sugar") && (
        <SugarCard sugarLog={data.sugarLog || []} onLog={logSugar} />
      )}

      <AddSectionControl allSections={HEALTH_SECTIONS} enabledKeys={enabled} onAdd={addSection} />
    </div>
  );
};
