// Session 1 — Style-guide preview page.
// Displays every design-system token and component for visual review.
// This page is temporary: real app screens replace it from Session 2 on.

const Section = ({ title, children }) => (
  <section className="sg-section">
    <h2 className="sg-section-title">{title}</h2>
    {children}
  </section>
);

const Swatch = ({ name, hex }) => (
  <div className="swatch">
    <div className="swatch-color" style={{ backgroundColor: hex }} />
    <div className="swatch-info">
      <p className="swatch-name">{name}</p>
      <p className="swatch-hex">{hex}</p>
    </div>
  </div>
);

const StyleGuide = () => {
  const [activeTab, setActiveTab] = React.useState("today");

  const tabs = [
    { id: "today", label: "Bugün", icon: "Sun" },
    { id: "pages", label: "Sayfalar", icon: "Layers" },
    { id: "goals", label: "Hedefler", icon: "Target" },
  ];

  return (
    <div className="styleguide">
      <h1 className="styleguide-title">Yaşam Koçu</h1>
      <p className="styleguide-subtitle">Stil Rehberi — Oturum 1: Tasarım Sistemi</p>

      <Section title="Renkler">
        <p className="sg-group-label">Nötr Renkler</p>
        <div className="swatch-grid">
          {TOKENS.colors.neutrals.map((c) => (
            <Swatch key={c.hex} name={c.name} hex={c.hex} />
          ))}
        </div>

        <p className="sg-group-label">Vurgu Rengi (yalnızca gelecekteki AI koç için rezerve)</p>
        <div className="swatch-grid">
          <Swatch name={TOKENS.colors.accent.name} hex={TOKENS.colors.accent.hex} />
        </div>

        <p className="sg-group-label">Kategori Renkleri</p>
        <div className="swatch-grid">
          {CATEGORIES.map((c) => (
            <Swatch key={c.id} name={c.label} hex={c.color} />
          ))}
        </div>
      </Section>

      <Section title="Tipografi">
        <p className="type-sample-heading-lg">Bugün, 4 Temmuz</p>
        <p className="type-meta">Newsreader 32px — yalnızca başlıklar ve tarihler için</p>

        <p className="type-sample-heading-sm">Haftalık Özet</p>
        <p className="type-meta">Newsreader 22px — bölüm başlığı</p>

        <p className="type-sample-body">
          Gövde metni Hanken Grotesk ile yazılır. Düzenli ve okunaklı bir arayüz için
          tüm etiketler, butonlar ve açıklamalar bu yazı tipini kullanır.
        </p>
        <p className="type-meta">Hanken Grotesk 15px — gövde metni</p>

        <p className="type-sample-small">İkincil bilgi ve yardımcı metinler bu boyutta gösterilir.</p>
        <p className="type-meta">Hanken Grotesk 13px — küçük / soluk metin</p>
      </Section>

      <Section title="Bileşenler">
        <p className="sg-group-label">Kart</p>
        <Card>
          <p style={{ margin: 0, fontWeight: 600 }}>Örnek Kart</p>
          <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: 14 }}>
            Beyaz yüzey, ince kenarlık ve yumuşak köşeler. İçerik blokları bu kart
            üzerinde yaşar.
          </p>
        </Card>

        <p className="sg-group-label">Butonlar</p>
        <div className="sg-row">
          <Button variant="primary">Kaydet</Button>
          <Button variant="secondary">Vazgeç</Button>
        </div>

        <p className="sg-group-label">Girdi Alanı</p>
        <div style={{ maxWidth: 360 }}>
          <Input placeholder="Yeni görev ekle..." />
        </div>

        <p className="sg-group-label">Kategori Etiketleri</p>
        <div className="sg-row">
          {CATEGORIES.map((c) => (
            <CategoryTag key={c.id} category={c} />
          ))}
        </div>

        <p className="sg-group-label">Sekmeler (aktif / pasif durumlar)</p>
        <div className="tab-row">
          {tabs.map((t) => (
            <TabItem
              key={t.id}
              icon={t.icon}
              label={t.label}
              active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<StyleGuide />);
