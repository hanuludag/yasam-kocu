// Session 5 — Two-step onboarding flow.
// Standalone overlay: picks areas (step 1), then individual pages within
// them (step 2). Saves the selection to localStorage.
//
// Session 23 — Sağlık's step-2 list now drills one level deeper into its
// real sub-sections (HEALTH_SECTIONS, tokens.js) instead of 3 fixed page
// names; whatever's picked there is written into enabledSections.saglik
// on finish, so the Sağlık screen only renders what the user chose.

// Every area's step-2 options are {key, label} pairs. For most areas key
// and label happen to be the same string (purely informational for now);
// health's keys are real HEALTH_SECTIONS keys that feed enabledSections.
// A function (not a module const) so health labels re-resolve through t()
// after a no-reload language switch (Session 30).
// Areas carrying an `enabledSectionsKey` feed the general enabledSections
// store directly (their picks = which optional sections show on that page).
// Session 32 adds Bugün and Hedefler alongside Sağlık.
function getOnboardingAreas() {
  return [
    {
      id: "bugun", label: "Bugün", color: "#1C1B19",
      pages: BUGUN_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey) })),
      defaultPageKeys: DEFAULT_ENABLED_SECTIONS.bugun,
      enabledSectionsKey: "bugun",
    },
    {
      id: "hedefler", label: "Hedefler", color: "#1C1B19",
      pages: HEDEFLER_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey) })),
      defaultPageKeys: DEFAULT_ENABLED_SECTIONS.hedefler,
      enabledSectionsKey: "hedefler",
    },
    {
      id: "school", label: "Okul", color: "#7C93B3",
      pages: ["Ders programı", "Sınav takvimi", "Not takibi"].map((p) => ({ key: p, label: p })),
    },
    {
      id: "work", label: "İş", color: "#B08268",
      pages: ["Görev panosu", "Toplantı notları", "Haftalık rapor"].map((p) => ({ key: p, label: p })),
    },
    {
      id: "finance", label: "Finans", color: "#B99A5B",
      pages: ["Gelir & Gider", "Borçlar", "Birikim hedefi"].map((p) => ({ key: p, label: p })),
    },
    {
      id: "health", label: "Sağlık", color: "#829A78",
      pages: HEALTH_SECTIONS.map((s) => ({ key: s.key, label: t(s.labelKey) })),
      defaultPageKeys: DEFAULT_ENABLED_SECTIONS.saglik,
      enabledSectionsKey: "saglik",
    },
    {
      id: "personal", label: "Kişisel Gelişim", color: "#A084A0",
      pages: ["Günlük", "Okuma listesi", "Yıllık hedefler"].map((p) => ({ key: p, label: p })),
    },
  ];
}

const SELECTED_PAGES_KEY = "yasamkocu_selected_pages";

// Steps (Session 26): 0 welcome → 1 areas → 2 pages/sections → 3 summary.
// The welcome step has no progress bar; the numbered ones show n/3.
const OnboardingProgress = ({ step }) => (
  <div className="onboarding-progress">
    <span className="onboarding-progress-label">{tf("ob_step", { n: step, total: 3 })}</span>
    <div className="onboarding-progress-track">
      <div className="onboarding-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
    </div>
  </div>
);

const SelectableRow = ({ label, color, selected, onToggle }) => (
  <button className={`select-row ${selected ? "selected" : ""}`} onClick={onToggle}>
    {color && <span className="category-dot" style={{ backgroundColor: color }} />}
    <span className="select-row-label">{label}</span>
    <span className="select-row-check">
      {selected && <Icon name="Check" size={13} />}
    </span>
  </button>
);

const OnboardingFlow = ({ onFinish }) => {
  const [step, setStep] = React.useState(0);
  const [areaIds, setAreaIds] = React.useState([]);
  const [pageKeys, setPageKeys] = React.useState([]); // "areaId:pageKey"
  const [done, setDone] = React.useState(false);

  const toggleArea = (id) =>
    setAreaIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const togglePage = (key) =>
    setPageKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const areas = getOnboardingAreas();
  const selectedAreas = areas.filter((a) => areaIds.includes(a.id));

  const goToStep2 = () => {
    if (areaIds.length === 0) return;
    // Pre-check each selected area's defaults (or just its first page).
    setPageKeys((prev) => {
      const next = [...prev.filter((k) => areaIds.includes(k.split(":")[0]))];
      selectedAreas.forEach((a) => {
        if (!next.some((k) => k.startsWith(a.id + ":"))) {
          const defaults = a.defaultPageKeys || [a.pages[0].key];
          defaults.forEach((key) => next.push(`${a.id}:${key}`));
        }
      });
      return next;
    });
    setStep(2);
  };

  const goToSummary = () => {
    if (pageKeys.length === 0) return;
    setStep(3);
  };

  const finish = () => {
    const selection = pageKeys.map((k) => {
      const [areaId, pageKey] = k.split(/:(.+)/);
      const area = areas.find((a) => a.id === areaId);
      const page = area.pages.find((p) => p.key === pageKey);
      return { areaId, area: area.label, page: page ? page.label : pageKey };
    });
    localStorage.setItem(SELECTED_PAGES_KEY, JSON.stringify(selection));

    // Any area with an enabledSectionsKey (Sağlık, Bugün, Hedefler) writes
    // its picks into the general enabledSections store. Only areas the user
    // actually opened get written, so unselected pages keep their defaults.
    areas.forEach((a) => {
      if (!a.enabledSectionsKey || !areaIds.includes(a.id)) return;
      const keys = pageKeys
        .filter((k) => k.startsWith(a.id + ":"))
        .map((k) => k.split(/:(.+)/)[1]);
      setEnabledSections(a.enabledSectionsKey, keys);
    });

    // Session 26 — from now on the app knows first-run setup happened and
    // won't auto-open onboarding again (still reachable from Sayfalar).
    markOnboardingCompleted();

    setDone(true);
    setTimeout(onFinish, 1600);
  };

  if (done) {
    return (
      <div className="onboarding">
        <div className="onboarding-success">
          <span className="onboarding-success-icon"><Icon name="Check" size={22} /></span>
          <p className="onboarding-success-text">{t("ob_preparing")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-body">
        {step > 0 && <OnboardingProgress step={step} />}

        {step === 0 ? (
          <div className="onboarding-welcome">
            <span className="onboarding-welcome-icon"><Icon name="Sun" size={26} /></span>
            <h1 className="screen-title">{t("ob_welcome_title")}</h1>
            <p className="onboarding-welcome-text">{t("ob_welcome_1")}</p>
            <p className="onboarding-welcome-text">{t("ob_welcome_2")}</p>
          </div>
        ) : step === 1 ? (
          <React.Fragment>
            <h1 className="screen-title">{t("ob_q1")}</h1>
            <p className="screen-subtitle">{t("ob_q1_sub")}</p>
            <div className="select-list">
              {areas.map((a) => (
                <SelectableRow
                  key={a.id}
                  label={onboardingLabel(ONBOARDING_AREA_EN, a.label)}
                  color={a.color}
                  selected={areaIds.includes(a.id)}
                  onToggle={() => toggleArea(a.id)}
                />
              ))}
            </div>
          </React.Fragment>
        ) : step === 2 ? (
          <React.Fragment>
            <h1 className="screen-title">{t("ob_q2")}</h1>
            <p className="screen-subtitle">{t("ob_q2_sub")}</p>
            {selectedAreas.map((a) => (
              <section key={a.id} className="onboarding-area-section">
                <p className="onboarding-area-heading">
                  <span className="category-dot" style={{ backgroundColor: a.color }} />
                  {onboardingLabel(ONBOARDING_AREA_EN, a.label).toLocaleUpperCase(appLocale())}
                </p>
                <div className="select-list">
                  {a.pages.map((p) => {
                    const key = `${a.id}:${p.key}`;
                    return (
                      <SelectableRow
                        key={key}
                        label={onboardingLabel(ONBOARDING_PAGE_EN, p.label)}
                        selected={pageKeys.includes(key)}
                        onToggle={() => togglePage(key)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h1 className="screen-title">{t("ob_summary_title")}</h1>
            <p className="screen-subtitle">{t("ob_summary_sub")}</p>
            {selectedAreas.map((a) => {
              const picked = a.pages.filter((p) => pageKeys.includes(`${a.id}:${p.key}`));
              if (picked.length === 0) return null;
              return (
                <section key={a.id} className="ob-summary-group">
                  <p className="onboarding-area-heading">
                    <span className="category-dot" style={{ backgroundColor: a.color }} />
                    {onboardingLabel(ONBOARDING_AREA_EN, a.label)}
                  </p>
                  <ul className="ob-summary-list">
                    {picked.map((p) => (
                      <li key={p.key}>{onboardingLabel(ONBOARDING_PAGE_EN, p.label)}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </React.Fragment>
        )}
      </div>

      <div className="onboarding-footer">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>{t("ob_back")}</Button>
        )}
        {step === 0 ? (
          <Button variant="primary" onClick={() => setStep(1)}>{t("ob_start")}</Button>
        ) : step === 1 ? (
          <Button variant="primary" onClick={goToStep2} disabled={areaIds.length === 0}>
            {t("ob_continue")}
          </Button>
        ) : step === 2 ? (
          <Button variant="primary" onClick={goToSummary} disabled={pageKeys.length === 0}>
            {t("ob_continue")}
          </Button>
        ) : (
          <Button variant="primary" onClick={finish}>{t("ob_complete")}</Button>
        )}
      </div>
    </div>
  );
};
