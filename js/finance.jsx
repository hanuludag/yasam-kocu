// Session 8 — "Finans" (Finance) page: monthly income/expense summary,
// transaction list, debts and a savings goal. All entries are manual —
// no bank sync, no imports. Reached from the Sayfalar gallery.
//
// Session 16 adds net worth (savings − debts, with monthly snapshots) and
// a simple next-month cash-flow projection. AI ile otomatik kategorize is
// deferred — categorization needs an AI model and stays manual for now.

const FINANCE_COLOR = "#B99A5B"; // muted mustard — Finans category color
const INCOME_COLOR = "#829A78"; // sage — palette-consistent tone for income
const TRANSACTION_CATEGORIES = ["Kira", "Market", "Ulaşım", "Eğlence", "Fatura", "Maaş", "Diğer"];

// "15.000 ₺" — the currency stays ₺ in both languages (Session 30); only
// number grouping and date phrasing follow the UI language.
function formatTL(n) {
  return `${n.toLocaleString(appLocale(), { maximumFractionDigits: 2 })} ₺`;
}

function formatMonthTitle() {
  return new Date().toLocaleDateString(appLocale(), { month: "long", year: "numeric" });
}

function formatShortDate(dateKey) {
  return new Date(dateKey + "T00:00").toLocaleDateString(appLocale(), { day: "numeric", month: "short" });
}

// --- Month summary ---------------------------------------------------------------

const MonthSummary = ({ transactions }) => {
  const income = transactions.filter((t) => t.type === "gelir").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "gider").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  const byCategory = {};
  transactions.filter((t) => t.type === "gider").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const breakdown = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const maxAmount = breakdown.length > 0 ? breakdown[0].amount : 0;

  return (
    <Card className="finance-summary-card">
      <div className="finance-totals">
        <div className="finance-total">
          <p className="stat-card-label">{t("income")}</p>
          <p className="finance-total-value income">{formatTL(income)}</p>
        </div>
        <div className="finance-total">
          <p className="stat-card-label">{t("expense")}</p>
          <p className="finance-total-value">{formatTL(expense)}</p>
        </div>
        <div className="finance-total">
          <p className="stat-card-label">{t("net")}</p>
          <p className="finance-total-value">{net >= 0 ? formatTL(net) : `−${formatTL(-net)}`}</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="finance-breakdown">
          {breakdown.map((b) => (
            <div key={b.category} className="finance-breakdown-row">
              <span className="finance-breakdown-label">{financeCategoryLabel(b.category)}</span>
              <div className="finance-breakdown-track">
                <div
                  className="finance-breakdown-bar"
                  style={{ width: `${(b.amount / maxAmount) * 100}%` }}
                />
              </div>
              <span className="finance-breakdown-amount">{formatTL(b.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// --- Net değer -----------------------------------------------------------------------
// Net worth = total savings (the savings goal's current amount stands in
// for total assets) minus everything still owed.

const NetWorthCard = ({ savingsGoal, debts, history }) => {
  const savings = savingsGoal ? savingsGoal.current : 0;
  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const netWorth = savings - totalDebt;

  // Trend vs. the most recent snapshot from an earlier month, if any.
  const thisMonth = getTodayKey().slice(0, 7);
  const past = history
    .filter((h) => h.month < thisMonth)
    .sort((a, b) => b.month.localeCompare(a.month));
  const prev = past.length > 0 ? past[0] : null;
  const delta = prev ? netWorth - prev.value : null;

  return (
    <Card className="net-worth-card">
      <p className="card-heading">{t("net_worth")}</p>
      <p className={`net-worth-value ${netWorth < 0 ? "negative" : ""}`}>
        {netWorth >= 0 ? formatTL(netWorth) : `−${formatTL(-netWorth)}`}
      </p>
      <p className="transaction-meta">
        {tf("net_worth_parts", { savings: formatTL(savings), debt: formatTL(totalDebt) })}
      </p>
      {delta !== null && delta !== 0 && (
        <p className="transaction-meta">
          {tf(delta > 0 ? "net_worth_up" : "net_worth_down", { n: formatTL(Math.abs(delta)) })}
        </p>
      )}
    </Card>
  );
};

// --- Nakit akışı tahmini -----------------------------------------------------------
// Averages up to the last 3 months of income/expenses (current month stands
// in when there's less history) and projects next month's likely net.
// Clearly labeled an estimate — simple averaging, not a guarantee.

const CashFlowCard = ({ transactions }) => {
  const months = [...new Set(transactions.map((tx) => tx.date.slice(0, 7)))]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 3);
  if (months.length === 0) return null;

  const sumFor = (month, type) =>
    transactions
      .filter((tx) => tx.date.startsWith(month) && tx.type === type)
      .reduce((s, tx) => s + tx.amount, 0);

  const avgIncome = months.reduce((s, m) => s + sumFor(m, "gelir"), 0) / months.length;
  const avgExpense = months.reduce((s, m) => s + sumFor(m, "gider"), 0) / months.length;
  const projectedNet = Math.round(avgIncome - avgExpense);

  return (
    <Card className="cashflow-card">
      <div className="weekly-chart-head">
        <p className="card-heading">{t("cashflow_title")}</p>
        <span className="weekly-chart-avg">{tf("cashflow_basis", { n: months.length })}</span>
      </div>
      <div className="finance-totals">
        <div className="finance-total">
          <p className="stat-card-label">{t("cashflow_income")}</p>
          <p className="finance-total-value income">{formatTL(Math.round(avgIncome))}</p>
        </div>
        <div className="finance-total">
          <p className="stat-card-label">{t("cashflow_expense")}</p>
          <p className="finance-total-value">{formatTL(Math.round(avgExpense))}</p>
        </div>
        <div className="finance-total">
          <p className="stat-card-label">{t("cashflow_net")}</p>
          <p className="finance-total-value">
            {projectedNet >= 0 ? formatTL(projectedNet) : `−${formatTL(-projectedNet)}`}
          </p>
        </div>
      </div>
      <p className="transaction-meta cashflow-note">{t("cashflow_note")}</p>
    </Card>
  );
};

// --- Transactions ------------------------------------------------------------------

const TransactionRow = ({ tx }) => (
  <div className="transaction-row">
    <div className="transaction-main">
      <span className="transaction-title">{tx.title}</span>
      <span className="transaction-meta">{financeCategoryLabel(tx.category)} · {formatShortDate(tx.date)}</span>
    </div>
    <span className={`transaction-amount ${tx.type === "gelir" ? "income" : ""}`}>
      {tx.type === "gelir" ? "+" : "−"}{formatTL(tx.amount)}
    </span>
  </div>
);

const AddTransactionForm = ({ onAdd }) => {
  const [type, setType] = React.useState("gider");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState(TRANSACTION_CATEGORIES[0]);
  const [date, setDate] = React.useState(getTodayKey());

  const submit = () => {
    const trimmed = title.trim();
    const num = parseFloat(amount);
    if (!trimmed || !num || num <= 0) return;
    onAdd({ type, title: trimmed, amount: num, category, date: date || getTodayKey() });
    setTitle("");
    setAmount("");
  };

  return (
    <div className="add-transaction-form">
      <div className="type-toggle">
        <button
          className={`type-toggle-option ${type === "gider" ? "active" : ""}`}
          onClick={() => setType("gider")}
        >
          {t("type_expense")}
        </button>
        <button
          className={`type-toggle-option ${type === "gelir" ? "active" : ""}`}
          onClick={() => setType("gelir")}
        >
          {t("type_income")}
        </button>
      </div>
      <div className="add-task-row">
        <input
          type="text"
          className="input"
          placeholder={t("title_ph")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          type="number"
          className="input finance-amount-input"
          placeholder={t("amount_ph")}
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          aria-label={t("amount_ph")}
        />
      </div>
      <div className="add-task-row">
        <select className="input add-task-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>{financeCategoryLabel(c)}</option>
          ))}
        </select>
        <input
          type="date"
          className="input add-task-select"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button variant="primary" onClick={submit}>{t("add")}</Button>
      </div>
    </div>
  );
};

const TransactionList = ({ transactions, onAdd }) => (
  <Card className="transactions-card">
    <p className="card-heading">{t("this_month_card")}</p>
    {transactions.length === 0 && (
      <EmptyState icon="Receipt" text={t("tx_empty")} />
    )}
    {transactions.map((tx) => (
      <TransactionRow key={tx.id} tx={tx} />
    ))}
    <AddTransactionForm onAdd={onAdd} />
  </Card>
);

// --- Debts ---------------------------------------------------------------------------

const DebtRow = ({ debt, onPay }) => {
  const [payment, setPayment] = React.useState("");
  const paidRatio = debt.totalAmount > 0
    ? Math.min((debt.totalAmount - debt.remainingAmount) / debt.totalAmount, 1)
    : 0;

  const submitPayment = () => {
    const num = parseFloat(payment);
    if (!num || num <= 0) return;
    onPay(debt.id, num);
    setPayment("");
  };

  return (
    <div className="goal-row">
      <div className="goal-row-top">
        <span className="goal-title">{debt.title}</span>
        <span className="goal-numbers">{formatTL(debt.remainingAmount)} / {formatTL(debt.totalAmount)}</span>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${paidRatio * 100}%` }} />
      </div>
      <div className="debt-pay-row">
        <input
          type="number"
          className="input debt-pay-input"
          placeholder={t("amount_ph")}
          min="0"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitPayment(); }}
          aria-label={t("amount_ph")}
        />
        <button className="goal-increment" onClick={submitPayment}>{t("pay")}</button>
      </div>
    </div>
  );
};

const AddDebtForm = ({ onAdd }) => {
  const [title, setTitle] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [remaining, setRemaining] = React.useState("");

  const submit = () => {
    const trimmed = title.trim();
    const totalNum = parseFloat(total);
    if (!trimmed || !totalNum || totalNum <= 0) return;
    const remNum = parseFloat(remaining);
    const remainingAmount = isNaN(remNum) ? totalNum : Math.min(Math.max(remNum, 0), totalNum);
    onAdd({ title: trimmed, totalAmount: totalNum, remainingAmount });
    setTitle("");
    setTotal("");
    setRemaining("");
  };

  return (
    <div className="add-goal-form">
      <input
        type="text"
        className="input"
        placeholder={t("new_debt_ph")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
      <input
        type="number"
        className="input add-goal-target"
        placeholder={t("total_ph")}
        min="0"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        aria-label={t("total_ph")}
      />
      <input
        type="number"
        className="input add-goal-target"
        placeholder={t("remaining_ph")}
        min="0"
        value={remaining}
        onChange={(e) => setRemaining(e.target.value)}
        aria-label={t("remaining_ph")}
      />
      <Button variant="primary" onClick={submit}>{t("add")}</Button>
    </div>
  );
};

// --- Savings goal ----------------------------------------------------------------------

const SavingsGoalCard = ({ goal, onCreate, onAddAmount }) => {
  const [title, setTitle] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [addAmount, setAddAmount] = React.useState("");

  if (!goal) {
    const submit = () => {
      const trimmed = title.trim();
      const num = parseFloat(target);
      if (!trimmed || !num || num <= 0) return;
      onCreate({ title: trimmed, target: num, current: 0 });
    };
    return (
      <Card className="savings-card">
        <p className="card-heading">{t("savings")}</p>
        <p className="placeholder-text">{t("no_savings")}</p>
        <div className="add-goal-form">
          <input
            type="text"
            className="input"
            placeholder={t("goal_name_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            className="input add-goal-target"
            placeholder={t("target_amount_ph")}
            min="0"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label={t("target_amount_ph")}
          />
          <Button variant="primary" onClick={submit}>{t("create")}</Button>
        </div>
      </Card>
    );
  }

  const ratio = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  const submitAdd = () => {
    const num = parseFloat(addAmount);
    if (!num || num <= 0) return;
    onAddAmount(num);
    setAddAmount("");
  };

  return (
    <Card className="savings-card">
      <p className="card-heading">{t("savings")}</p>
      <div className="goal-row-top">
        <span className="goal-title">{goal.title}</span>
        <span className="goal-numbers">{formatTL(goal.current)} / {formatTL(goal.target)}</span>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="debt-pay-row">
        <input
          type="number"
          className="input debt-pay-input"
          placeholder={t("amount_ph")}
          min="0"
          value={addAmount}
          onChange={(e) => setAddAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); }}
          aria-label={t("amount_ph")}
        />
        <button className="goal-increment" onClick={submitAdd}>{t("add_savings")}</button>
      </div>
    </Card>
  );
};

// --- Screen ------------------------------------------------------------------------------

const FinanceScreen = () => {
  const [data, setData] = React.useState(loadFinanceData);

  React.useEffect(() => {
    saveFinanceData(data);
  }, [data]);

  const monthPrefix = getTodayKey().slice(0, 7);

  // Keep this month's net-worth snapshot current so history builds up as
  // months pass (one entry per month, updated in place).
  const currentNetWorth =
    (data.savingsGoal ? data.savingsGoal.current : 0) -
    data.debts.reduce((s, d) => s + d.remainingAmount, 0);
  React.useEffect(() => {
    setData((prev) => {
      const history = prev.netWorthHistory || [];
      const existing = history.find((h) => h.month === monthPrefix);
      if (existing && existing.value === currentNetWorth) return prev;
      const next = existing
        ? history.map((h) => (h.month === monthPrefix ? { ...h, value: currentNetWorth } : h))
        : [...history, { month: monthPrefix, value: currentNetWorth }];
      return { ...prev, netWorthHistory: next };
    });
  }, [currentNetWorth, monthPrefix]);
  const monthTransactions = data.transactions
    .filter((t) => t.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date));

  const addTransaction = (tx) =>
    setData((prev) => ({
      ...prev,
      transactions: [...prev.transactions, { id: `ft-${Date.now()}`, ...tx }],
    }));

  const addDebt = (debt) =>
    setData((prev) => ({
      ...prev,
      debts: [...prev.debts, { id: `fd-${Date.now()}`, ...debt }],
    }));

  const payDebt = (id, amount) =>
    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === id ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - amount) } : d
      ),
    }));

  const createSavingsGoal = (goal) =>
    setData((prev) => ({ ...prev, savingsGoal: goal }));

  const addToSavings = (amount) =>
    setData((prev) => ({
      ...prev,
      savingsGoal: { ...prev.savingsGoal, current: prev.savingsGoal.current + amount },
    }));

  return (
    <div className="screen">
      <header className="work-header">
        <h1 className="screen-title work-title">
          <span className="category-dot work-title-dot" style={{ backgroundColor: FINANCE_COLOR }} />
          {t("finance_title")}
        </h1>
        <span className="work-week-range">{formatMonthTitle()}</span>
      </header>

      <NetWorthCard
        savingsGoal={data.savingsGoal}
        debts={data.debts}
        history={data.netWorthHistory || []}
      />
      <MonthSummary transactions={monthTransactions} />
      <CashFlowCard transactions={data.transactions} />
      <TransactionList transactions={monthTransactions} onAdd={addTransaction} />

      <Card className="debts-card">
        <p className="card-heading">{t("debts")}</p>
        {data.debts.length === 0 && (
          <p className="placeholder-text">{t("no_debts")}</p>
        )}
        {data.debts.map((d) => (
          <DebtRow key={d.id} debt={d} onPay={payDebt} />
        ))}
        <AddDebtForm onAdd={addDebt} />
      </Card>

      <SavingsGoalCard
        goal={data.savingsGoal}
        onCreate={createSavingsGoal}
        onAddAmount={addToSavings}
      />
    </div>
  );
};
