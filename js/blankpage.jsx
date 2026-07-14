// Session 22 — "Boş sayfa": a minimal block editor, NOT the full
// Notion-style system (that's a multi-week effort per the definition doc).
//
// Session 27 expands it: numbered list, divider, quote and simple table
// blocks; per-block convert/duplicate controls; Enter creates a sibling
// block and Backspace-on-empty deletes one (Notion-like approximation).
// Still explicitly out of scope: drag-and-drop reordering, rich text
// (bold/italic/links), embeds, and nested/indented blocks.

const BLOCK_TYPES = [
  { type: "heading",   labelKey: "block_heading",   icon: "Heading" },
  { type: "text",      labelKey: "block_text",      icon: "AlignLeft" },
  { type: "checklist", labelKey: "block_checklist", icon: "ListChecks" },
  { type: "numbered",  labelKey: "block_numbered",  icon: "ListOrdered" },
  { type: "quote",     labelKey: "block_quote",     icon: "Quote" },
  { type: "divider",   labelKey: "block_divider",   icon: "Minus" },
  { type: "table",     labelKey: "block_table",     icon: "Table" },
];

function blockTypeMeta(type) {
  return BLOCK_TYPES.find((bt) => bt.type === type);
}

function newBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function newBlock(type) {
  const content =
    type === "checklist" || type === "numbered" ? [] :
    type === "table" ? { rows: [["", ""], ["", ""]] } :
    "";
  return { id: newBlockId(), type, content };
}

// --- Tür dönüştürme (Session 27) -----------------------------------------------
// String-ish types interconvert freely; list types interconvert; strings
// split/join by line when crossing the string↔list boundary. Divider and
// table stay what they are.

const STRING_BLOCK_TYPES = ["text", "heading", "quote"];
const LIST_BLOCK_TYPES = ["checklist", "numbered"];

function convertTargetsFor(type) {
  if (STRING_BLOCK_TYPES.includes(type)) {
    return [...STRING_BLOCK_TYPES.filter((x) => x !== type), ...LIST_BLOCK_TYPES];
  }
  if (LIST_BLOCK_TYPES.includes(type)) {
    return [...LIST_BLOCK_TYPES.filter((x) => x !== type), "text"];
  }
  return [];
}

function convertBlock(block, target) {
  if (block.type === target) return block;
  const from = block.type;
  if (STRING_BLOCK_TYPES.includes(from) && STRING_BLOCK_TYPES.includes(target)) {
    return { ...block, type: target };
  }
  if (LIST_BLOCK_TYPES.includes(from) && LIST_BLOCK_TYPES.includes(target)) {
    return {
      ...block,
      type: target,
      content: block.content.map((it) =>
        target === "checklist" ? { id: it.id, text: it.text, done: !!it.done } : { id: it.id, text: it.text }
      ),
    };
  }
  if (STRING_BLOCK_TYPES.includes(from) && LIST_BLOCK_TYPES.includes(target)) {
    const items = String(block.content)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => (target === "checklist"
        ? { id: `${newBlockId()}-${i}`, text, done: false }
        : { id: `${newBlockId()}-${i}`, text }));
    return { ...block, type: target, content: items };
  }
  if (LIST_BLOCK_TYPES.includes(from) && STRING_BLOCK_TYPES.includes(target)) {
    return { ...block, type: target, content: block.content.map((it) => it.text).join("\n") };
  }
  return block;
}

function duplicateBlock(block) {
  const copy = JSON.parse(JSON.stringify(block));
  copy.id = newBlockId();
  if (Array.isArray(copy.content)) {
    copy.content = copy.content.map((it, i) => ({ ...it, id: `${copy.id}-${i}` }));
  }
  return copy;
}

// --- List-style blocks (checklist & numbered) -------------------------------------

const ListBlock = ({ block, onChange }) => {
  const isChecklist = block.type === "checklist";
  const items = block.content;
  const [newText, setNewText] = React.useState("");
  const [focusIndex, setFocusIndex] = React.useState(null);
  const rowRefs = React.useRef({});

  React.useEffect(() => {
    if (focusIndex !== null && rowRefs.current[focusIndex]) {
      rowRefs.current[focusIndex].focus();
      setFocusIndex(null);
    }
  }, [items.length, focusIndex]);

  const setItems = (next) => onChange({ ...block, content: next });

  const updateItem = (id, text) => setItems(items.map((it) => (it.id === id ? { ...it, text } : it)));
  const toggle = (id) => setItems(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const removeAt = (i) => setItems(items.filter((_, idx) => idx !== i));

  const insertAfter = (i) => {
    const next = [...items];
    const item = isChecklist
      ? { id: newBlockId(), text: "", done: false }
      : { id: newBlockId(), text: "" };
    next.splice(i + 1, 0, item);
    setItems(next);
    setFocusIndex(i + 1);
  };

  const onItemKeyDown = (e, i) => {
    if (e.key === "Enter") {
      e.preventDefault();
      insertAfter(i);
    } else if (e.key === "Backspace" && items[i].text === "") {
      e.preventDefault();
      removeAt(i);
      if (i > 0) setFocusIndex(i - 1);
    }
  };

  const addFromBottom = () => {
    const text = newText.trim();
    if (!text) return;
    setItems([...items, isChecklist
      ? { id: newBlockId(), text, done: false }
      : { id: newBlockId(), text }]);
    setNewText("");
  };

  return (
    <div className="block-checklist">
      {items.map((it, i) => (
        <div key={it.id} className={`list-item-row ${isChecklist && it.done ? "done" : ""}`}>
          {isChecklist ? (
            <span
              className="task-checkbox"
              style={it.done ? { backgroundColor: "var(--color-ink)", borderColor: "var(--color-ink)" } : null}
              onClick={() => toggle(it.id)}
            >
              {it.done && <Icon name="Check" size={12} />}
            </span>
          ) : (
            <span className="numbered-index">{i + 1}.</span>
          )}
          <input
            ref={(el) => { rowRefs.current[i] = el; }}
            type="text"
            className="input list-item-input"
            value={it.text}
            onChange={(e) => updateItem(it.id, e.target.value)}
            onKeyDown={(e) => onItemKeyDown(e, i)}
          />
          <button className="task-delete" aria-label="delete" onClick={() => removeAt(i)}>
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}
      <input
        type="text"
        className="input weekly-add-input"
        placeholder={t("checklist_item_ph")}
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") addFromBottom(); }}
      />
    </div>
  );
};

// --- Table block (Session 27) -------------------------------------------------------
// Plain text cells, add/remove rows & columns. No formulas, no headers.

const TableBlock = ({ block, onChange }) => {
  const rows = block.content.rows;
  const setRows = (next) => onChange({ ...block, content: { rows: next } });

  const updateCell = (r, c, value) =>
    setRows(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)));

  const addRow = () => setRows([...rows, rows[0].map(() => "")]);
  const removeRow = () => { if (rows.length > 1) setRows(rows.slice(0, -1)); };
  const addCol = () => setRows(rows.map((row) => [...row, ""]));
  const removeCol = () => { if (rows[0].length > 1) setRows(rows.map((row) => row.slice(0, -1))); };

  return (
    <div className="block-table">
      <table>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <input
                    type="text"
                    className="table-cell-input"
                    value={cell}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-controls">
        <button className="goal-increment" onClick={addRow}>{t("add_row")}</button>
        <button className="goal-increment" onClick={removeRow} disabled={rows.length <= 1}>{t("del_row")}</button>
        <button className="goal-increment" onClick={addCol}>{t("add_col")}</button>
        <button className="goal-increment" onClick={removeCol} disabled={rows[0].length <= 1}>{t("del_col")}</button>
      </div>
    </div>
  );
};

// --- Single block row (content + controls) -------------------------------------------

const BlockRow = ({ block, isFirst, isLast, onChange, onMove, onDelete, onDuplicate, onConvert, onEnterBelow, onBackspaceEmpty, inputRef }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const targets = convertTargetsFor(block.type);

  // Enter at the end of a string block → new sibling below; Backspace in an
  // empty one → remove it and focus the previous block.
  const stringKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterBelow();
    } else if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  return (
    <div className="block-row" data-block-id={block.id}>
      <div className="block-content">
        {block.type === "heading" ? (
          <input
            ref={inputRef}
            type="text"
            className="input block-heading-input"
            placeholder={t("block_heading_ph")}
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            onKeyDown={stringKeyDown}
          />
        ) : block.type === "text" ? (
          <textarea
            ref={inputRef}
            className="input block-text-input"
            placeholder={t("block_text_ph")}
            rows="2"
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            onKeyDown={stringKeyDown}
          />
        ) : block.type === "quote" ? (
          <textarea
            ref={inputRef}
            className="input block-text-input block-quote-input"
            placeholder={t("block_quote_ph")}
            rows="2"
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            onKeyDown={stringKeyDown}
          />
        ) : block.type === "divider" ? (
          <hr className="block-divider" />
        ) : block.type === "table" ? (
          <TableBlock block={block} onChange={onChange} />
        ) : (
          <ListBlock block={block} onChange={onChange} />
        )}
      </div>
      <div className="block-controls">
        {targets.length > 0 && (
          <button
            className="block-control"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="convert"
            title={t("convert_block")}
          >
            <Icon name="Repeat" size={13} />
          </button>
        )}
        <button className="block-control" onClick={onDuplicate} aria-label="duplicate" title={t("duplicate_block")}>
          <Icon name="Copy" size={13} />
        </button>
        <button className="block-control" disabled={isFirst} onClick={() => onMove(-1)} aria-label="up">
          <Icon name="ChevronUp" size={14} />
        </button>
        <button className="block-control" disabled={isLast} onClick={() => onMove(1)} aria-label="down">
          <Icon name="ChevronDown" size={14} />
        </button>
        <button className="block-control" onClick={onDelete} aria-label="delete">
          <Icon name="X" size={14} />
        </button>
      </div>
      {menuOpen && (
        <div className="block-convert-menu">
          {targets.map((target) => (
            <button
              key={target}
              className="goal-increment"
              onClick={() => { onConvert(target); setMenuOpen(false); }}
            >
              {t(blockTypeMeta(target).labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Screen ---------------------------------------------------------------------------

const BlankPageScreen = ({ pageId, onBack }) => {
  const [pages, setPages] = React.useState(loadCustomPages);
  const [focusBlockId, setFocusBlockId] = React.useState(null);
  const inputRefs = React.useRef({});
  const page = pages.find((p) => p.id === pageId);

  React.useEffect(() => {
    saveCustomPages(pages);
  }, [pages]);

  React.useEffect(() => {
    if (focusBlockId && inputRefs.current[focusBlockId]) {
      inputRefs.current[focusBlockId].focus();
      setFocusBlockId(null);
    }
  }, [focusBlockId, pages]);

  if (!page) {
    return (
      <div className="screen screen-single">
        <Button variant="secondary" onClick={onBack}>{t("back_to_pages")}</Button>
        <Card><p className="placeholder-text">{t("page_not_found")}</p></Card>
      </div>
    );
  }

  const updatePage = (changes) =>
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, ...changes } : p)));

  const updateBlock = (block) =>
    updatePage({ blocks: page.blocks.map((b) => (b.id === block.id ? block : b)) });

  const deleteBlock = (id, focusPrevious = false) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    updatePage({ blocks: page.blocks.filter((b) => b.id !== id) });
    if (focusPrevious && idx > 0) setFocusBlockId(page.blocks[idx - 1].id);
  };

  const moveBlock = (id, dir) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= page.blocks.length) return;
    const blocks = [...page.blocks];
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    updatePage({ blocks });
  };

  const insertBlockAfter = (id, type) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const block = newBlock(type);
    const blocks = [...page.blocks];
    blocks.splice(idx + 1, 0, block);
    updatePage({ blocks });
    setFocusBlockId(block.id);
  };

  const duplicateBlockAt = (id) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const copy = duplicateBlock(page.blocks[idx]);
    const blocks = [...page.blocks];
    blocks.splice(idx + 1, 0, copy);
    updatePage({ blocks });
  };

  const convertBlockAt = (id, target) =>
    updatePage({ blocks: page.blocks.map((b) => (b.id === id ? convertBlock(b, target) : b)) });

  const addBlock = (type) => {
    const block = newBlock(type);
    updatePage({ blocks: [...page.blocks, block] });
    setFocusBlockId(block.id);
  };

  return (
    <div className="screen screen-single">
      <header className="blank-page-header">
        <button className="goal-increment" onClick={onBack}>{t("back_to_pages")}</button>
      </header>

      <input
        type="text"
        className="input blank-page-title"
        placeholder={t("page_title_ph")}
        value={page.title}
        onChange={(e) => updatePage({ title: e.target.value })}
      />

      {page.blocks.length === 0 && (
        <p className="placeholder-text">{t("no_blocks")}</p>
      )}
      {page.blocks.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          isFirst={i === 0}
          isLast={i === page.blocks.length - 1}
          onChange={updateBlock}
          onMove={(dir) => moveBlock(b.id, dir)}
          onDelete={() => deleteBlock(b.id)}
          onDuplicate={() => duplicateBlockAt(b.id)}
          onConvert={(target) => convertBlockAt(b.id, target)}
          onEnterBelow={() => insertBlockAfter(b.id, b.type)}
          onBackspaceEmpty={() => deleteBlock(b.id, true)}
          inputRef={(el) => { inputRefs.current[b.id] = el; }}
        />
      ))}

      <div className="add-block-row">
        {BLOCK_TYPES.map((bt) => (
          <button key={bt.type} className="goal-increment add-block-btn" onClick={() => addBlock(bt.type)}>
            <Icon name="Plus" size={12} />
            {t(bt.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};
