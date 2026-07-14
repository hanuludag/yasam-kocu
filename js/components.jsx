// Core UI components — Session 1 design system.
// Plain React function components (no JSX-runtime imports) so they can be
// moved into a Vite + lucide-react project later unchanged.

// Thin monoline icon rendered from lucide's UMD icon data.
// When migrating to Vite, replace this implementation with lucide-react —
// every other component uses <Icon name="..."/> and stays unchanged.
const Icon = ({ name, size = 15 }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    if (!window.lucide) return; // icon CDN unavailable — degrade to no icon
    const iconNode = (window.lucide.icons && window.lucide.icons[name]) || window.lucide[name];
    if (!iconNode) return;
    const svg = window.lucide.createElement(iconNode);
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("stroke-width", "1.75");
    ref.current.appendChild(svg);
  }, [name, size]);
  return <span className="icon" ref={ref} />;
};

const Card = ({ children, className = "", ...props }) => (
  <div className={`card ${className}`} {...props}>{children}</div>
);

const Button = ({ variant = "primary", children, ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>{children}</button>
);

const Input = (props) => <input className="input" {...props} />;

const CategoryTag = ({ category }) => (
  <span className="category-tag">
    <span className="category-dot" style={{ backgroundColor: category.color }} />
    <Icon name={category.icon} />
    {typeof categoryLabel === "function" ? categoryLabel(category) : category.label}
  </span>
);

const TabItem = ({ icon, label, active = false, onClick }) => (
  <button className={`tab-item ${active ? "active" : ""}`} onClick={onClick}>
    <Icon name={icon} size={16} />
    {label}
  </button>
);

// Session 31 — richer empty state: a soft line-art icon above the message,
// instead of muted text alone. Purely presentational; still uses only the
// established palette (muted ink on a subtle bordered circle).
const EmptyState = ({ icon = "Inbox", text }) => (
  <div className="empty-state">
    <span className="empty-state-icon"><Icon name={icon} size={20} /></span>
    <p className="empty-state-text">{text}</p>
  </div>
);

// Session 23 — generic "+ Bölüm ekle" control for any page using the
// enabledSections mechanism (storage.js). `allSections` is an array of
// { key, labelKey, icon? }; renders nothing once every section is already
// enabled. Shared by Sağlık now, Bugün/Hedefler in a later session.
const AddSectionControl = ({ allSections, enabledKeys, onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const missing = allSections.filter((s) => !enabledKeys.includes(s.key));

  if (missing.length === 0) return null;

  return (
    <div className="add-section-control">
      {open ? (
        <div className="add-section-list">
          {missing.map((s) => (
            <button
              key={s.key}
              className="goal-increment add-section-option"
              onClick={() => onAdd(s.key)}
            >
              {s.icon && <Icon name={s.icon} size={13} />}
              {t(s.labelKey)}
            </button>
          ))}
          <button className="goal-increment" onClick={() => setOpen(false)}>{t("cancel")}</button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>{t("add_section")}</Button>
      )}
    </div>
  );
};
