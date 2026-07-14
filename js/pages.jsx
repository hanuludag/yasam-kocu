// "Sayfalar" (Pages) screen: blank-page option + template gallery.
// Bugün and Hedefler are NOT listed here — they live in the main nav.
// "Boş sayfa" (Session 22) creates a minimal block-editor page; created
// pages reappear under "Sayfalarım" at the top.

const TEMPLATES = [
  { id: "weekly",  titleKey: "tpl_weekly",  descKey: "tpl_weekly_desc",  color: "#7C93B3", icon: "CalendarDays", target: "weekly" },
  { id: "program", titleKey: "tpl_program", descKey: "tpl_program_desc", color: "#7C93B3", icon: "Calendar",  target: "program" },
  { id: "finance", titleKey: "tpl_finance", descKey: "tpl_finance_desc", color: "#B99A5B", icon: "Wallet",    target: "finance" },
  { id: "study",   titleKey: "tpl_school",  descKey: "tpl_school_desc",  color: "#7C93B3", icon: "BookOpen",  target: "school" },
  { id: "work",    titleKey: "tpl_work",    descKey: "tpl_work_desc",    color: "#B08268", icon: "Briefcase", target: "work" },
  { id: "journal", titleKey: "tpl_journal", descKey: "tpl_journal_desc", color: "#A084A0", icon: "Feather",   target: "journal" },
  { id: "health",  titleKey: "tpl_health",  descKey: "tpl_health_desc",  color: "#829A78", icon: "Activity",  target: "health" },
];

const Toast = ({ message }) => (
  <div className="toast" role="status">{message}</div>
);

const TemplateCard = ({ template, onClick }) => (
  <Card className="template-card" onClick={onClick}>
    <div className="template-card-head">
      <span className="category-dot" style={{ backgroundColor: template.color }} />
      <Icon name={template.icon} size={17} />
    </div>
    <p className="template-card-title">{t(template.titleKey)}</p>
    <p className="template-card-desc">{t(template.descKey)}</p>
  </Card>
);

const PagesScreen = ({ onNavigate, onShowOnboarding, onOpenCustomPage }) => {
  const [customPages, setCustomPages] = React.useState(loadCustomPages);
  // Session 27 — inline rename in the Sayfalarım list.
  const [renamingId, setRenamingId] = React.useState(null);
  const [renameValue, setRenameValue] = React.useState("");

  const createBlankPage = () => {
    const page = { id: `cp-${Date.now()}`, title: "", blocks: [] };
    saveCustomPages([...customPages, page]);
    onOpenCustomPage(page.id);
  };

  const deletePage = (id) => {
    const next = customPages.filter((p) => p.id !== id);
    saveCustomPages(next);
    setCustomPages(next);
  };

  const startRename = (p) => {
    setRenamingId(p.id);
    setRenameValue(p.title);
  };

  const commitRename = () => {
    const next = customPages.map((p) =>
      p.id === renamingId ? { ...p, title: renameValue.trim() } : p
    );
    saveCustomPages(next);
    setCustomPages(next);
    setRenamingId(null);
  };

  return (
    <div className="screen screen-pages">
      <header>
        <h1 className="screen-title">{t("new_page")}</h1>
        <p className="screen-subtitle">{t("pages_subtitle")}</p>
      </header>

      <Card className="blank-page-card" onClick={createBlankPage}>
        <span className="blank-page-plus"><Icon name="Plus" size={20} /></span>
        <div>
          <p className="template-card-title">{t("blank_page")}</p>
          <p className="template-card-desc">{t("blank_sub")}</p>
        </div>
      </Card>

      {customPages.length > 0 && (
        <div className="my-pages">
          <p className="section-title">{t("my_pages")}</p>
          {customPages.map((p) => (
            <div key={p.id} className="my-page-row" onClick={() => renamingId !== p.id && onOpenCustomPage(p.id)}>
              <Icon name="FileText" size={15} />
              {renamingId === p.id ? (
                <input
                  type="text"
                  className="input my-page-rename-input"
                  value={renameValue}
                  autoFocus
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="my-page-title">{p.title || t("untitled_page")}</span>
              )}
              <span className="transaction-meta">{tf("block_count", { n: p.blocks.length })}</span>
              <button
                className="block-control"
                aria-label="rename"
                title={t("rename")}
                onClick={(e) => { e.stopPropagation(); startRename(p); }}
              >
                <Icon name="Pencil" size={13} />
              </button>
              <button
                className="task-delete"
                aria-label="delete"
                onClick={(e) => { e.stopPropagation(); deletePage(p.id); }}
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="template-grid">
        {TEMPLATES.map((tp) => (
          <TemplateCard key={tp.id} template={tp} onClick={() => onNavigate(tp.target)} />
        ))}
      </div>

      {/* Session 26 — onboarding auto-opens on first launch; this button is
          the permanent way to revisit those choices later. */}
      <div className="onboarding-entry">
        <Button variant="secondary" onClick={onShowOnboarding}>{t("show_onboarding")}</Button>
      </div>
    </div>
  );
};
