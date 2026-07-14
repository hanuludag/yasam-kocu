// App shell: three tabs plus template-page routes, the onboarding overlay,
// a TR/EN language toggle, and (via CSS) a sidebar layout on wide screens.

// Freeze yesterday's score into history before anything renders.
ensureDailyRollover();

const PlaceholderScreen = ({ title }) => (
  <div className="screen">
    <h1 className="screen-title">{title}</h1>
    <Card>
      <p className="placeholder-text">{t("preparing")}</p>
    </Card>
  </div>
);

const TABS = [
  { id: "today", labelKey: "tab_today", icon: "Sun" },
  { id: "pages", labelKey: "tab_pages", icon: "Layers" },
  { id: "goals", labelKey: "tab_goals", icon: "Target" },
];

const App = () => {
  const [activeTab, setActiveTab] = React.useState("today");
  // Session 26 — onboarding opens automatically on the very first launch;
  // afterwards it stays reachable from the Sayfalar screen.
  const [showOnboarding, setShowOnboarding] = React.useState(() => !isOnboardingCompleted());
  // Which custom (blank) page is open when activeTab === "blankpage".
  const [activeCustomPageId, setActiveCustomPageId] = React.useState(null);

  const openCustomPage = (id) => {
    setActiveCustomPageId(id);
    setActiveTab("blankpage");
  };

  // Session 30 — re-render the whole tree when the language toggles, so
  // every t() call picks up the new language without a page reload.
  const [, setLangTick] = React.useState(0);
  React.useEffect(() => {
    const onLangChange = () => setLangTick((n) => n + 1);
    window.addEventListener("yk-lang-change", onLangChange);
    return () => window.removeEventListener("yk-lang-change", onLangChange);
  }, []);

  if (showOnboarding) {
    return <OnboardingFlow onFinish={() => { setShowOnboarding(false); setActiveTab("pages"); }} />;
  }

  return (
    <div className="app-shell">
      <button className="lang-toggle" onClick={toggleAppLang}>
        {APP_LANG === "en" ? "TR" : "EN"}
      </button>

      <main className="app-content">
        {activeTab === "today" ? (
          <TodayScreen />
        ) : activeTab === "pages" ? (
          <PagesScreen
            onNavigate={setActiveTab}
            onShowOnboarding={() => setShowOnboarding(true)}
            onOpenCustomPage={openCustomPage}
          />
        ) : activeTab === "goals" ? (
          <GoalsScreen />
        ) : activeTab === "work" ? (
          <WorkScreen />
        ) : activeTab === "finance" ? (
          <FinanceScreen />
        ) : activeTab === "health" ? (
          <HealthScreen />
        ) : activeTab === "school" ? (
          <SchoolScreen />
        ) : activeTab === "journal" ? (
          <JournalScreen />
        ) : activeTab === "program" ? (
          <ProgramScreen />
        ) : activeTab === "weekly" ? (
          <WeeklyScreen />
        ) : activeTab === "blankpage" ? (
          <BlankPageScreen pageId={activeCustomPageId} onBack={() => setActiveTab("pages")} />
        ) : (
          <PlaceholderScreen title="" />
        )}
      </main>

      <nav className="bottom-nav">
        <p className="nav-brand">{t("brand")}</p>
        <div className="bottom-nav-inner">
          {TABS.map((tb) => (
            <TabItem
              key={tb.id}
              icon={tb.icon}
              label={t(tb.labelKey)}
              active={activeTab === tb.id}
              onClick={() => setActiveTab(tb.id)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
