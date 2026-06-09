const storageKey = "itochu-100-plan-state-v5";

const defaults = {
  stockName: "伊藤忠",
  stockCode: "8001",
  targetShares: 100,
  currentPrice: "1837",
  rulesCollapsed: false,
  collapseSettingsVersion: 1,
  seedDataVersion: 1,
  seedTradesInitialized: true,
  annualDividendPerShare: 200,
  budgets: [{ id: "seed-budget-2026-06", month: "2026-06", amount: 15000, note: "六月預算" }],
  rules: {
    smallDropPercent: 0.3,
    smallMaxShares: 1,
    mediumDropPercent: 1.2,
    mediumMaxShares: 2,
    largeDropPercent: 3.0,
    largeMaxShares: 5,
  },
  trades: [
    { id: "seed-2026-05-26", date: "2026-05-26", price: 1920, shares: 10, note: "初始建倉" },
    { id: "seed-2026-05-27", date: "2026-05-27", price: 1918, shares: 10, note: "加碼" },
    { id: "seed-2026-06-04", date: "2026-06-04", price: 1850, shares: 1, note: "NISA" },
    { id: "seed-2026-06-08-a", date: "2026-06-08", price: 1850, shares: 1, note: "NISA" },
    { id: "seed-2026-06-08-b", date: "2026-06-08", price: 1835, shares: 1, note: "NISA" },
  ],
};

const state = loadState();

const elements = {
  stockCodeText: document.getElementById("stockCodeText"),
  stockNameText: document.getElementById("stockNameText"),
  heroLevelText: document.getElementById("heroLevelText"),
  heroExpText: document.getElementById("heroExpText"),
  heroExpBar: document.getElementById("heroExpBar"),
  heroTitleText: document.getElementById("heroTitleText"),
  heroCurrentSharesText: document.getElementById("heroCurrentSharesText"),
  heroNextMilestoneText: document.getElementById("heroNextMilestoneText"),
  heroRemainingSharesText: document.getElementById("heroRemainingSharesText"),
  heroCompletionText: document.getElementById("heroCompletionText"),
  overviewName: document.getElementById("overviewName"),
  overviewCode: document.getElementById("overviewCode"),
  progressPill: document.getElementById("progressPill"),
  mainProgressText: document.getElementById("mainProgressText"),
  remainingText: document.getElementById("remainingText"),
  progressBar: document.getElementById("progressBar"),
  currentSharesText: document.getElementById("currentSharesText"),
  targetSharesText: document.getElementById("targetSharesText"),
  completionText: document.getElementById("completionText"),
  remainingMetricText: document.getElementById("remainingMetricText"),
  currentPrice: document.getElementById("currentPrice"),
  costMonthlyRemainingText: document.getElementById("costMonthlyRemainingText"),
  totalInvestedText: document.getElementById("totalInvestedText"),
  averageCostText: document.getElementById("averageCostText"),
  currentPriceText: document.getElementById("currentPriceText"),
  unrealizedPnlText: document.getElementById("unrealizedPnlText"),
  pnlPercentText: document.getElementById("pnlPercentText"),
  orderStatus: document.getElementById("orderStatus"),
  orderPanel: document.getElementById("orderPanel"),
  orderSummary: document.getElementById("orderSummary"),
  ordersBody: document.getElementById("ordersBody"),
  todayRating: document.getElementById("todayRating"),
  todayReason: document.getElementById("todayReason"),
  npcNameText: document.getElementById("npcNameText"),
  warningBox: document.getElementById("warningBox"),
  warningTitle: document.getElementById("warningTitle"),
  warningText: document.getElementById("warningText"),
  generateButton: document.getElementById("generateButton"),
  smallDropPercent: document.getElementById("smallDropPercent"),
  smallMaxShares: document.getElementById("smallMaxShares"),
  mediumDropPercent: document.getElementById("mediumDropPercent"),
  mediumMaxShares: document.getElementById("mediumMaxShares"),
  largeDropPercent: document.getElementById("largeDropPercent"),
  largeMaxShares: document.getElementById("largeMaxShares"),
  toggleRulesButton: document.getElementById("toggleRulesButton"),
  rulesContent: document.getElementById("rulesContent"),
  milestoneCards: document.querySelectorAll(".milestone-card"),
  milestone25Text: document.getElementById("milestone25Text"),
  milestone50Text: document.getElementById("milestone50Text"),
  milestone75Text: document.getElementById("milestone75Text"),
  milestone100Text: document.getElementById("milestone100Text"),
  annualDividendPerShare: document.getElementById("annualDividendPerShare"),
  targetGoalSharesText: document.getElementById("targetGoalSharesText"),
  targetTotalInvestedText: document.getElementById("targetTotalInvestedText"),
  targetAnnualDividendText: document.getElementById("targetAnnualDividendText"),
  targetCompletionText: document.getElementById("targetCompletionText"),
  budgetMonthText: document.getElementById("budgetMonthText"),
  monthlyRemainingText: document.getElementById("monthlyRemainingText"),
  monthlyBudgetDetail: document.getElementById("monthlyBudgetDetail"),
  budgetForm: document.getElementById("budgetForm"),
  budgetId: document.getElementById("budgetId"),
  budgetMonth: document.getElementById("budgetMonth"),
  budgetAmount: document.getElementById("budgetAmount"),
  budgetNote: document.getElementById("budgetNote"),
  saveBudgetButton: document.getElementById("saveBudgetButton"),
  cancelBudgetEditButton: document.getElementById("cancelBudgetEditButton"),
  budgetsBody: document.getElementById("budgetsBody"),
  tradeForm: document.getElementById("tradeForm"),
  tradeId: document.getElementById("tradeId"),
  tradeDate: document.getElementById("tradeDate"),
  tradePrice: document.getElementById("tradePrice"),
  tradeShares: document.getElementById("tradeShares"),
  tradeNote: document.getElementById("tradeNote"),
  saveTradeButton: document.getElementById("saveTradeButton"),
  cancelEditButton: document.getElementById("cancelEditButton"),
  clearTradesButton: document.getElementById("clearTradesButton"),
  tradesBody: document.getElementById("tradesBody"),
  navLinks: document.querySelectorAll(".game-nav a"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return clone(defaults);
    const savedBudgets = Array.isArray(saved.budgets) ? saved.budgets : [];
    const savedTrades = Array.isArray(saved.trades) ? saved.trades : [];
    const shouldHydrateSeedData = saved.seedDataVersion !== defaults.seedDataVersion;

    return {
      ...clone(defaults),
      ...saved,
      rulesCollapsed: saved.collapseSettingsVersion === defaults.collapseSettingsVersion ? Boolean(saved.rulesCollapsed) : true,
      collapseSettingsVersion: defaults.collapseSettingsVersion,
      seedDataVersion: defaults.seedDataVersion,
      annualDividendPerShare: Number.isFinite(Number(saved.annualDividendPerShare))
        ? Number(saved.annualDividendPerShare)
        : defaults.annualDividendPerShare,
      rules: normalizeRules(saved.rules),
      budgets: shouldHydrateSeedData ? seedInitialBudgets(savedBudgets) : savedBudgets,
      seedTradesInitialized: true,
      trades: shouldHydrateSeedData ? seedInitialTrades(savedTrades) : savedTrades,
    };
  } catch {
    return clone(defaults);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId() {
  return `trade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBudgetId() {
  return `budget-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeRules(savedRules = {}) {
  if (!savedRules || typeof savedRules !== "object") return { ...defaults.rules };

  if ("smallDropPercent" in savedRules) {
    return { ...defaults.rules, ...savedRules };
  }

  return { ...defaults.rules };
}

function seedInitialTrades(trades) {
  const byId = new Map(trades.filter((trade) => trade && trade.id).map((trade) => [trade.id, trade]));
  const existingSignatures = new Set(trades.map(getTradeSignature));
  defaults.trades.forEach((trade) => {
    if (!byId.has(trade.id) && !existingSignatures.has(getTradeSignature(trade))) {
      byId.set(trade.id, clone(trade));
    }
  });
  return [...byId.values()];
}

function seedInitialBudgets(budgets) {
  const byId = new Map(budgets.filter((budget) => budget && budget.id).map((budget) => [budget.id, budget]));
  const existingSignatures = new Set(budgets.map(getBudgetSignature));
  defaults.budgets.forEach((budget) => {
    if (!byId.has(budget.id) && !existingSignatures.has(getBudgetSignature(budget))) {
      byId.set(budget.id, clone(budget));
    }
  });
  return [...byId.values()];
}

function getTradeSignature(trade) {
  return [trade?.date, Number(trade?.price), Number(trade?.shares), trade?.note || ""].join("|");
}

function getBudgetSignature(budget) {
  return [budget?.month, Number(budget?.amount), budget?.note || ""].join("|");
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function parseNumber(value) {
  if (String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatYen(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: digits }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${formatNumber(value, 1)}%`;
}

function roundToHalfYen(price) {
  return Math.round(price * 2) / 2;
}

function sortedTrades() {
  return [...state.trades].sort((a, b) => a.date.localeCompare(b.date));
}

function sortedBudgets() {
  return [...state.budgets].sort((a, b) => b.month.localeCompare(a.month));
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split("-");
  if (!year || !month) return monthKey || "-";
  return `${year}年${Number(month)}月`;
}

function getMonthlyBudgetSummary(monthKey = getCurrentMonthKey()) {
  const budgetAmount = state.budgets
    .filter((budget) => budget.month === monthKey)
    .reduce((sum, budget) => sum + budget.amount, 0);
  const spentAmount = state.trades
    .filter((trade) => trade.date && trade.date.slice(0, 7) === monthKey)
    .reduce((sum, trade) => sum + trade.price * trade.shares, 0);
  return {
    monthKey,
    budgetAmount,
    spentAmount,
    remainingAmount: budgetAmount - spentAmount,
  };
}

function getPortfolio() {
  const totalShares = state.trades.reduce((sum, trade) => sum + trade.shares, 0);
  const totalInvested = state.trades.reduce((sum, trade) => sum + trade.price * trade.shares, 0);
  const averageCost = totalShares > 0 ? totalInvested / totalShares : 0;
  return { totalShares, totalInvested, averageCost };
}

function getRecentAverageCost(limit = 3) {
  const recentTrades = sortedTrades().slice(-limit);
  const shares = recentTrades.reduce((sum, trade) => sum + trade.shares, 0);
  const amount = recentTrades.reduce((sum, trade) => sum + trade.price * trade.shares, 0);
  return shares > 0 ? amount / shares : 0;
}

function getOrderCandidates(currentPrice) {
  return [
    {
      key: "small",
      label: "小買",
      className: "type-small",
      dropPercent: state.rules.smallDropPercent,
      maxShares: state.rules.smallMaxShares,
      price: roundToHalfYen(currentPrice * (1 - state.rules.smallDropPercent / 100)),
      reason: "小幅回檔才試買，避免看到價格就追。",
    },
    {
      key: "medium",
      label: "中買",
      className: "type-medium",
      dropPercent: state.rules.mediumDropPercent,
      maxShares: state.rules.mediumMaxShares,
      price: roundToHalfYen(currentPrice * (1 - state.rules.mediumDropPercent / 100)),
      reason: "進入較合理加碼區，仍依最大股數控制節奏。",
    },
    {
      key: "large",
      label: "大跌",
      className: "type-large",
      dropPercent: state.rules.largeDropPercent,
      maxShares: state.rules.largeMaxShares,
      price: roundToHalfYen(currentPrice * (1 - state.rules.largeDropPercent / 100)),
      reason: "明顯回檔才加大，保留紀律與現金彈性。",
    },
  ];
}

function buildOrders() {
  const currentPrice = parseNumber(elements.currentPrice.value);
  const { budgetAmount, remainingAmount } = getMonthlyBudgetSummary();
  const { totalShares } = getPortfolio();
  const remainingTarget = Math.max(state.targetShares - totalShares, 0);

  if (!currentPrice) {
    return { orders: [], message: "輸入目前價格後，會依本月剩餘金額產生掛單建議。", needsInput: true };
  }

  if (budgetAmount <= 0) {
    return { orders: [], message: "尚未登錄本月預算，請先在交易紀錄區登錄當月預算。" };
  }

  if (remainingTarget <= 0) {
    return { orders: [], message: "已達成 100 股計畫，今日不需要再加碼。" };
  }

  const budget = Math.max(0, remainingAmount);
  if (budget <= 0) {
    return { orders: [], message: "本月剩餘金額已用完，先不要再掛單。" };
  }

  const candidates = getOrderCandidates(currentPrice);
  let remainingShares = remainingTarget;
  let remainingBudget = budget;
  const orders = candidates
    .map((order) => {
      const allocated = remainingBudget;
      const affordableShares = Math.floor(allocated / order.price);
      const shares = Math.max(0, Math.min(affordableShares, order.maxShares, remainingShares));
      remainingShares -= shares;
      remainingBudget -= shares * order.price;
      return {
        ...order,
        shares,
        amount: shares * order.price,
      };
    })
    .filter((order) => order.price > 0);

  return {
    orders,
    message: `今日掛單已依目前價格、跌幅規則、本月剩餘金額 ${formatYen(budget)} 與剩餘目標股數產生。`,
  };
}

function renderOverview() {
  const { totalShares } = getPortfolio();
  const target = Math.max(state.targetShares, 1);
  const completion = Math.min((totalShares / target) * 100, 100);
  const remaining = Math.max(state.targetShares - totalShares, 0);

  elements.stockCodeText.textContent = state.stockCode;
  elements.stockNameText.textContent = state.stockName;
  elements.overviewName.textContent = state.stockName;
  elements.overviewCode.textContent = state.stockCode;
  elements.progressPill.textContent = `第 ${formatNumber(totalShares, 0)} 股`;
  elements.heroLevelText.textContent = getHeroLevel(totalShares);
  elements.heroExpText.textContent = `${formatNumber(totalShares, 0)} / ${formatNumber(state.targetShares, 0)}`;
  elements.heroExpBar.style.width = `${completion}%`;
  elements.heroTitleText.textContent = getHeroTitle(totalShares);
  elements.heroCurrentSharesText.textContent = `${formatNumber(totalShares, 0)}股`;
  elements.heroNextMilestoneText.textContent = `${formatNumber(getNextMilestone(totalShares), 0)}股`;
  elements.heroRemainingSharesText.textContent = `${formatNumber(getNextMilestoneRemaining(totalShares), 0)}股`;
  elements.heroCompletionText.textContent = formatPercent(completion);
  elements.mainProgressText.textContent = `${formatNumber(totalShares, 0)} / ${formatNumber(state.targetShares, 0)} 股`;
  elements.remainingText.textContent = `距離 LV.MAX 還差 ${formatNumber(remaining, 0)} 股`;
  elements.progressBar.style.width = `${completion}%`;
  elements.currentSharesText.textContent = `${formatNumber(totalShares, 0)} 股`;
  elements.targetSharesText.textContent = `${formatNumber(state.targetShares, 0)} 股`;
  elements.completionText.textContent = formatPercent(completion);
  elements.remainingMetricText.textContent = `${formatNumber(remaining, 0)} 股`;
}

function renderMilestones() {
  const { totalShares } = getPortfolio();
  const milestones = [25, 50, 75, 100];

  milestones.forEach((milestone) => {
    const remaining = Math.max(milestone - totalShares, 0);
    const card = [...elements.milestoneCards].find((item) => Number(item.dataset.milestone) === milestone);
    const text = elements[`milestone${milestone}Text`];

    if (!card || !text) return;

    const progress = Math.min((totalShares / milestone) * 100, 100);
    card.style.setProperty("--milestone-progress", `${progress}%`);
    card.style.setProperty("--milestone-ratio", String(progress / 100));
    card.classList.toggle("is-complete", remaining === 0);
    text.textContent = remaining === 0 ? "解鎖済" : `あと${formatNumber(remaining, 0)}股解鎖`;
  });
}

function renderTargetPreview() {
  const { totalShares, averageCost } = getPortfolio();
  const targetShares = defaults.targetShares;
  const dividendPerShare = parseNumber(elements.annualDividendPerShare.value);
  const safeDividend = dividendPerShare !== null && dividendPerShare >= 0 ? dividendPerShare : defaults.annualDividendPerShare;
  const completion = Math.min((totalShares / targetShares) * 100, 100);
  const displayedAverageCost = Math.round(averageCost * 10) / 10;

  state.annualDividendPerShare = safeDividend;
  elements.targetGoalSharesText.textContent = `${formatNumber(targetShares, 0)}股`;
  elements.targetTotalInvestedText.textContent = averageCost > 0 ? formatYen(displayedAverageCost * targetShares) : "資料不足";
  elements.targetAnnualDividendText.textContent = formatYen(safeDividend * targetShares);
  elements.targetCompletionText.textContent = `${formatNumber(completion, 0)}%`;
}

function renderCost() {
  const { totalShares, totalInvested, averageCost } = getPortfolio();
  const { budgetAmount, remainingAmount } = getMonthlyBudgetSummary();
  const currentPrice = parseNumber(elements.currentPrice.value);
  const marketValue = currentPrice && totalShares ? currentPrice * totalShares : null;
  const pnl = marketValue !== null ? marketValue - totalInvested : null;
  const pnlPercent = totalInvested > 0 && pnl !== null ? (pnl / totalInvested) * 100 : null;

  elements.totalInvestedText.textContent = formatYen(totalInvested);
  elements.averageCostText.textContent = totalShares ? formatYen(averageCost) : "-";
  elements.costMonthlyRemainingText.textContent = budgetAmount > 0 ? formatYen(remainingAmount) : "尚未登錄";
  elements.costMonthlyRemainingText.className = remainingAmount < 0 ? "loss" : budgetAmount > 0 ? "gain" : "";
  elements.currentPriceText.textContent = currentPrice ? formatYen(currentPrice) : "-";
  elements.unrealizedPnlText.textContent = pnl !== null ? formatYen(pnl) : "-";
  elements.pnlPercentText.textContent = pnlPercent !== null ? formatPercent(pnlPercent) : "-";
  elements.unrealizedPnlText.className = pnl > 0 ? "gain" : pnl < 0 ? "loss" : "";
  elements.pnlPercentText.className = pnl > 0 ? "gain" : pnl < 0 ? "loss" : "";
}

function renderEvaluation() {
  const currentPrice = parseNumber(elements.currentPrice.value);
  const { totalShares, averageCost } = getPortfolio();
  const recentAverageCost = getRecentAverageCost();
  const remaining = Math.max(state.targetShares - totalShares, 0);

  if (!currentPrice) {
    elements.npcNameText.textContent = "村長";
    elements.todayRating.textContent = "先看看今日價格吧。";
    elements.todayReason.textContent = "輸入目前價格後，我會幫你確認今天的冒險任務。距離下一個里程碑只差幾股，也會一起告訴你。";
    elements.warningBox.className = "warning-box neutral";
    elements.warningTitle.textContent = "今日追價警告";
    elements.warningText.textContent = "工具會依照平均成本與最近成交均價提醒你不要衝動追價。";
    return;
  }

  const candidates = getOrderCandidates(currentPrice);
  const mediumDistance = Math.max(currentPrice - candidates[1].price, 0);
  const largeDistance = Math.max(currentPrice - candidates[2].price, 0);
  const isAboveAverageCost = averageCost > 0 && currentPrice > averageCost;
  const isAboveRecentCost = recentAverageCost > 0 && currentPrice > recentAverageCost;
  const isNearMedium = mediumDistance / currentPrice <= 0.015;
  const isNearLarge = largeDistance / currentPrice <= 0.035;

  if (isAboveAverageCost || isAboveRecentCost) {
    elements.npcNameText.textContent = "村長";
    elements.todayRating.textContent = "今天先別急著出發。";
    elements.warningBox.className = "warning-box danger";
    elements.warningTitle.textContent = "⚠️ 今日追價警告";
    elements.warningText.textContent = `目前價格高於${isAboveAverageCost ? "平均成本" : "最近成交均價"}，不建議追價，建議等待回檔。`;
  } else if (isNearLarge || isNearMedium) {
    elements.npcNameText.textContent = isNearLarge ? "冒險家" : "菇菇商人";
    elements.todayRating.textContent = "今天價格不錯喔！";
    elements.warningBox.className = "warning-box ok";
    elements.warningTitle.textContent = "✅ 價格已進入合理加碼區";
    elements.warningText.textContent = "可依照計畫掛單，但仍不要超過本月剩餘金額與最大股數。";
  } else {
    elements.npcNameText.textContent = "肥肥商人";
    elements.todayRating.textContent = "先在村口觀察一下。";
    elements.warningBox.className = "warning-box neutral";
    elements.warningTitle.textContent = "今日追價警告";
    elements.warningText.textContent = "尚未明顯進入加碼區，先掛低一點，讓價格來找你。";
  }

  const firstOrder = buildOrders().orders.find((order) => order.shares > 0);
  elements.todayReason.textContent = [
    `距離下一個里程碑只差 ${formatNumber(getNextMilestoneRemaining(totalShares), 0)} 股`,
    firstOrder ? `建議買入 ${formatNumber(firstOrder.shares, 0)} 股` : "今天先保留金庫資金",
    averageCost ? `目前價格與平均成本差距：${formatYen(currentPrice - averageCost)}` : "尚無平均成本資料",
    `距離中買區：${formatYen(mediumDistance)}`,
    `距離大跌區：${formatYen(largeDistance)}`,
    `距離 100 股目標還剩 ${formatNumber(remaining, 0)} 股`,
  ].join("。");
}

function updateActiveNav() {
  const sections = [...elements.navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const activeSection = sections
    .filter((section) => section.getBoundingClientRect().top <= 150)
    .pop() || sections[0];

  elements.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${activeSection.id}`);
  });
}

function getNextMilestoneRemaining(totalShares) {
  return Math.max(getNextMilestone(totalShares) - totalShares, 0);
}

function getNextMilestone(totalShares) {
  return [25, 50, 75, 100].find((milestone) => totalShares < milestone) ?? 100;
}

function getHeroLevel(totalShares) {
  return totalShares >= 100 ? "MAX" : formatNumber(totalShares, 0);
}

function getHeroTitle(totalShares) {
  if (totalShares >= 100) return "傳說投資家";
  if (totalShares >= 75) return "伊藤忠騎士";
  if (totalShares >= 50) return "配息獵人";
  if (totalShares >= 25) return "穩健投資家";
  return "見習股東";
}

function renderOrders() {
  const result = buildOrders();
  elements.orderSummary.textContent = result.message;
  elements.orderStatus.textContent = result.needsInput ? "待輸入" : result.orders.some((order) => order.shares > 0) ? "可掛單" : "預算不足";
  elements.orderStatus.className = result.orders.some((order) => order.shares > 0) ? "status-pill ok" : "status-pill";

  if (!result.orders.length) {
    elements.ordersBody.innerHTML = `<tr><td colspan="5" class="empty-state">${result.message}</td></tr>`;
    return;
  }

  elements.ordersBody.innerHTML = result.orders
    .map(
      (order) => `
        <tr>
          <td><span class="type-pill ${order.className}">${order.label}</span></td>
          <td>${formatYen(order.price)}</td>
          <td>${order.shares > 0 ? `${formatNumber(order.shares, 0)} 股` : "預算不足"}</td>
          <td>${formatYen(order.amount)}</td>
          <td>${order.reason} 跌幅：${formatNumber(order.dropPercent, 1)}%，最大：${formatNumber(order.maxShares, 0)} 股。</td>
        </tr>
      `
    )
    .join("");
}

function renderTrades() {
  const trades = sortedTrades();
  if (!trades.length) {
    elements.tradesBody.innerHTML = '<tr><td colspan="5" class="empty-state">尚無交易紀錄。</td></tr>';
    return;
  }

  elements.tradesBody.innerHTML = trades
    .map(
      (trade) => `
        <tr>
          <td>${trade.date}</td>
          <td>${formatYen(trade.price)}</td>
          <td>${formatNumber(trade.shares, 0)} 股</td>
          <td>${trade.note || "-"}</td>
          <td class="action-cell">
            <button class="text-button" type="button" data-edit="${trade.id}">編輯</button>
            <button class="text-button danger" type="button" data-delete="${trade.id}">刪除</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderBudgets() {
  const { monthKey, budgetAmount, spentAmount, remainingAmount } = getMonthlyBudgetSummary();
  elements.budgetMonthText.textContent = `本月剩餘金額（${formatMonthLabel(monthKey)}）`;
  elements.monthlyRemainingText.textContent = budgetAmount > 0 ? formatYen(remainingAmount) : "尚未登錄";
  elements.monthlyRemainingText.className = remainingAmount < 0 ? "loss" : budgetAmount > 0 ? "gain" : "";
  elements.monthlyBudgetDetail.textContent =
    budgetAmount > 0
      ? `本月預算 ${formatYen(budgetAmount)}，已買進 ${formatYen(spentAmount)}。`
      : "登錄當月預算後，會自動扣除本月交易金額。";

  const budgets = sortedBudgets();
  if (!budgets.length) {
    elements.budgetsBody.innerHTML = '<tr><td colspan="4" class="empty-state">尚無月度預算。</td></tr>';
    return;
  }

  elements.budgetsBody.innerHTML = budgets
    .map(
      (budget) => `
        <tr>
          <td>${formatMonthLabel(budget.month)}</td>
          <td>${formatYen(budget.amount)}</td>
          <td>${budget.note || "-"}</td>
          <td class="action-cell">
            <button class="text-button" type="button" data-edit-budget="${budget.id}">編輯</button>
            <button class="text-button danger" type="button" data-delete-budget="${budget.id}">刪除</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function render() {
  state.currentPrice = elements.currentPrice.value;
  state.targetShares = defaults.targetShares;
  state.rules.smallDropPercent = Number(elements.smallDropPercent.value) || 0;
  state.rules.smallMaxShares = Number(elements.smallMaxShares.value) || 0;
  state.rules.mediumDropPercent = Number(elements.mediumDropPercent.value) || 0;
  state.rules.mediumMaxShares = Number(elements.mediumMaxShares.value) || 0;
  state.rules.largeDropPercent = Number(elements.largeDropPercent.value) || 0;
  state.rules.largeMaxShares = Number(elements.largeMaxShares.value) || 0;
  state.annualDividendPerShare = parseNumber(elements.annualDividendPerShare.value) ?? defaults.annualDividendPerShare;

  renderOverview();
  renderMilestones();
  renderTargetPreview();
  renderCost();
  renderEvaluation();
  renderOrders();
  renderBudgets();
  renderTrades();
  saveState();
}

function resetBudgetForm() {
  elements.budgetId.value = "";
  elements.budgetMonth.value = getCurrentMonthKey();
  elements.budgetAmount.value = "";
  elements.budgetNote.value = "";
  elements.saveBudgetButton.textContent = "登錄預算";
  elements.cancelBudgetEditButton.hidden = true;
}

function saveBudget(event) {
  event.preventDefault();
  const month = elements.budgetMonth.value;
  const amount = parseNumber(elements.budgetAmount.value);
  const note = elements.budgetNote.value.trim();

  if (!month || amount === null || amount < 0) return;

  const budget = {
    id: elements.budgetId.value || createBudgetId(),
    month,
    amount,
    note,
  };

  const existingIndex = state.budgets.findIndex((item) => item.id === budget.id);
  if (existingIndex >= 0) {
    state.budgets[existingIndex] = budget;
  } else {
    state.budgets.push(budget);
  }

  resetBudgetForm();
  render();
}

function editBudget(id) {
  const budget = state.budgets.find((item) => item.id === id);
  if (!budget) return;
  elements.budgetId.value = budget.id;
  elements.budgetMonth.value = budget.month;
  elements.budgetAmount.value = budget.amount;
  elements.budgetNote.value = budget.note || "";
  elements.saveBudgetButton.textContent = "儲存預算";
  elements.cancelBudgetEditButton.hidden = false;
  elements.budgetMonth.focus();
}

function deleteBudget(id) {
  state.budgets = state.budgets.filter((budget) => budget.id !== id);
  resetBudgetForm();
  render();
}

function resetTradeForm() {
  elements.tradeId.value = "";
  elements.tradeDate.value = new Date().toISOString().slice(0, 10);
  elements.tradePrice.value = "";
  elements.tradeShares.value = "";
  elements.tradeNote.value = "";
  elements.saveTradeButton.textContent = "新增交易";
  elements.cancelEditButton.hidden = true;
}

function saveTrade(event) {
  event.preventDefault();
  const date = elements.tradeDate.value;
  const price = parseNumber(elements.tradePrice.value);
  const shares = parseNumber(elements.tradeShares.value);
  const note = elements.tradeNote.value.trim();

  if (!date || !price || !Number.isInteger(shares) || shares <= 0) return;

  const trade = {
    id: elements.tradeId.value || createId(),
    date,
    price,
    shares,
    note,
  };

  const existingIndex = state.trades.findIndex((item) => item.id === trade.id);
  if (existingIndex >= 0) {
    state.trades[existingIndex] = trade;
  } else {
    state.trades.push(trade);
  }

  resetTradeForm();
  render();
}

function editTrade(id) {
  const trade = state.trades.find((item) => item.id === id);
  if (!trade) return;
  elements.tradeId.value = trade.id;
  elements.tradeDate.value = trade.date;
  elements.tradePrice.value = trade.price;
  elements.tradeShares.value = trade.shares;
  elements.tradeNote.value = trade.note || "";
  elements.saveTradeButton.textContent = "儲存修改";
  elements.cancelEditButton.hidden = false;
  elements.tradeDate.focus();
}

function deleteTrade(id) {
  state.trades = state.trades.filter((trade) => trade.id !== id);
  render();
}

function generateNow() {
  render();
  elements.orderPanel.classList.remove("flash-panel");
  void elements.orderPanel.offsetWidth;
  elements.orderPanel.classList.add("flash-panel");
  elements.orderPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initializeInputs() {
  elements.currentPrice.value = state.currentPrice;
  elements.smallDropPercent.value = state.rules.smallDropPercent;
  elements.smallMaxShares.value = state.rules.smallMaxShares;
  elements.mediumDropPercent.value = state.rules.mediumDropPercent;
  elements.mediumMaxShares.value = state.rules.mediumMaxShares;
  elements.largeDropPercent.value = state.rules.largeDropPercent;
  elements.largeMaxShares.value = state.rules.largeMaxShares;
  elements.annualDividendPerShare.value = state.annualDividendPerShare;
  resetBudgetForm();
  setRulesCollapsed(Boolean(state.rulesCollapsed));
  resetTradeForm();
}

function setRulesCollapsed(isCollapsed) {
  state.rulesCollapsed = isCollapsed;
  state.collapseSettingsVersion = defaults.collapseSettingsVersion;
  elements.rulesContent.hidden = isCollapsed;
  elements.toggleRulesButton.textContent = isCollapsed ? "打開個人規則" : "收起個人規則";
  elements.toggleRulesButton.setAttribute("aria-expanded", String(!isCollapsed));
  saveState();
}

[
  "currentPrice",
  "smallDropPercent",
  "smallMaxShares",
  "mediumDropPercent",
  "mediumMaxShares",
  "largeDropPercent",
  "largeMaxShares",
  "annualDividendPerShare",
].forEach(
  (id) => elements[id].addEventListener("input", render)
);

elements.generateButton.addEventListener("click", generateNow);
elements.toggleRulesButton.addEventListener("click", () => setRulesCollapsed(!state.rulesCollapsed));

elements.budgetForm.addEventListener("submit", saveBudget);
elements.cancelBudgetEditButton.addEventListener("click", resetBudgetForm);
elements.budgetsBody.addEventListener("click", (event) => {
  const editId = event.target.dataset.editBudget;
  const deleteId = event.target.dataset.deleteBudget;
  if (editId) editBudget(editId);
  if (deleteId) deleteBudget(deleteId);
});

elements.tradeForm.addEventListener("submit", saveTrade);
elements.cancelEditButton.addEventListener("click", resetTradeForm);
elements.clearTradesButton.addEventListener("click", () => {
  state.trades = [];
  state.seedTradesInitialized = true;
  resetTradeForm();
  render();
});
elements.tradesBody.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editTrade(editId);
  if (deleteId) deleteTrade(deleteId);
});

initializeInputs();
render();
updateActiveNav();
window.addEventListener("scroll", updateActiveNav, { passive: true });
