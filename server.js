import express from "express";
import yahooFinance from "yahoo-finance2";

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";
const cacheTtlMs = 10 * 60 * 1000;
const historyCache = new Map();
const chartCache = new Map();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function normalizeTokyoSymbol(code) {
  const cleaned = String(code || "").trim().toUpperCase();
  if (!cleaned) return "";
  if (cleaned.endsWith(".T")) return cleaned;
  return `${cleaned.replace(/\.T$/, "")}.T`;
}

function normalizeStooqBaseCode(code) {
  return String(code || "")
    .trim()
    .replace(/\.(T|JP)$/i, "");
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateAtr(rows, period = 14) {
  const trueRanges = [];

  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previous = rows[index - 1];
    trueRanges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );
  }

  return average(trueRanges.slice(-period));
}

function buildHistoryResponse(code, rows) {
  const recentRows = rows.slice(-60);
  const last5 = recentRows.slice(-5);
  const last20 = recentRows.slice(-20);
  const last25 = recentRows.slice(-25);
  const latest = recentRows.at(-1);

  if (recentRows.length < 25) {
    throw new Error("可用交易日不足，無法計算 25 日均線");
  }

  return {
    lastUpdated: formatDate(latest.date),
    ma5: round(average(last5.map((row) => row.close))),
    ma25: round(average(last25.map((row) => row.close))),
    high20: round(Math.max(...last20.map((row) => row.high))),
    low20: round(Math.min(...last20.map((row) => row.low))),
    prevClose: round(latest.close),
    prevLow: round(latest.low),
    atr14: round(calculateAtr(recentRows)),
  };
}

function sanitizeRows(rows) {
  return rows
    .filter((row) => [row.date, row.high, row.low, row.close].every((value) => value !== null && value !== undefined))
    .filter((row) => [row.high, row.low, row.close].every(Number.isFinite))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getPeriodDays(period) {
  if (period === "1m") return 45;
  if (period === "6m") return 220;
  if (period === "1y") return 420;
  return null;
}

function filterRowsByPeriod(rows, period) {
  const days = getPeriodDays(period);
  if (!days) return null;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return rows.filter((row) => row.date >= start);
}

function buildChartResponse(source, period, rows) {
  const data = rows.map((row) => ({
    date: formatDate(row.date),
    close: round(row.close),
  }));

  if (!data.length) {
    throw new Error("走勢資料不足");
  }

  return { source, period, data };
}

async function fetchYfinanceRows(code, period) {
  const days = getPeriodDays(period);
  const querySymbol = normalizeTokyoSymbol(code);
  const period2 = new Date();
  const period1 = new Date(period2);
  period1.setDate(period1.getDate() - days);

  const history = await yahooFinance.chart(querySymbol, {
    period1,
    period2,
    interval: "1d",
    return: "array",
  });

  const rows = sanitizeRows(history);
  if (!rows.length) throw new Error(`${querySymbol} 的走勢資料不足`);
  return rows;
}

async function fetchStooqRows(code, period) {
  const baseCode = normalizeStooqBaseCode(code);
  const symbols = [`${baseCode}.jp`, `${baseCode}.JP`, baseCode];
  const failures = [];

  for (const symbol of symbols) {
    try {
      const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csv = await response.text();
      const rows = filterRowsByPeriod(sanitizeRows(parseStooqCsv(csv)), period);
      if (!rows || !rows.length) throw new Error("走勢資料不足");
      return rows;
    } catch (error) {
      failures.push(`${symbol}: ${error.message}`);
    }
  }

  throw new Error(failures.join("; "));
}

async function fetchChartWithFallback(code, period) {
  try {
    const rows = await fetchYfinanceRows(code, period);
    return buildChartResponse("yfinance", period, rows);
  } catch (yfinanceError) {
    try {
      const rows = await fetchStooqRows(code, period);
      return buildChartResponse("stooq", period, rows);
    } catch (stooqError) {
      const error = new Error("目前無法取得走勢資料");
      error.details = {
        yfinance: yfinanceError.message,
        stooq: stooqError.message,
      };
      throw error;
    }
  }
}

async function fetchYfinanceHistory(code) {
  const querySymbol = normalizeTokyoSymbol(code);
  const period2 = new Date();
  const period1 = new Date(period2);
  period1.setDate(period1.getDate() - 180);

  const history = await yahooFinance.chart(querySymbol, {
    period1,
    period2,
    interval: "1d",
    return: "array",
  });

  const rows = sanitizeRows(history);

  if (rows.length < 25) {
    throw new Error(`${querySymbol} 的歷史資料不足`);
  }

  return {
    source: "yfinance",
    symbol: querySymbol,
    ...buildHistoryResponse(code, rows),
  };
}

function parseStooqCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1 || /no data/i.test(csv)) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const [date, open, high, low, close, volume] = line.split(",");
    return {
      date: new Date(`${date}T00:00:00Z`),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };
  });
}

async function fetchStooqHistory(code) {
  const baseCode = normalizeStooqBaseCode(code);
  const symbols = [`${baseCode}.jp`, `${baseCode}.JP`, baseCode];
  const failures = [];

  for (const symbol of symbols) {
    try {
      const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const csv = await response.text();
      const rows = sanitizeRows(parseStooqCsv(csv));

      if (rows.length < 25) {
        throw new Error("歷史資料不足");
      }

      return {
        source: "stooq",
        symbol,
        ...buildHistoryResponse(code, rows),
      };
    } catch (error) {
      failures.push(`${symbol}: ${error.message}`);
    }
  }

  throw new Error(failures.join("; "));
}

async function fetchHistoryWithFallback(code) {
  try {
    return await fetchYfinanceHistory(code);
  } catch (yfinanceError) {
    try {
      return await fetchStooqHistory(code);
    } catch (stooqError) {
      const error = new Error("自動取得失敗，請手動輸入");
      error.details = {
        yfinance: yfinanceError.message,
        stooq: stooqError.message,
      };
      throw error;
    }
  }
}

app.get("/api/history", async (req, res) => {
  const code = String(req.query.code || "").trim();

  if (!code) {
    res.status(400).json({ error: "請提供股票代號" });
    return;
  }

  if (!/^[0-9A-Z.]+$/i.test(code)) {
    res.status(400).json({ error: "股票代號只能包含英數字與小數點" });
    return;
  }

  const cacheKey = code.toUpperCase();
  const cached = historyCache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < cacheTtlMs) {
    if (cached.status >= 400) {
      res.status(cached.status).json({ ...cached.payload, cached: true });
      return;
    }

    res.json({ ...cached.payload, cached: true });
    return;
  }

  try {
    const payload = await fetchHistoryWithFallback(code);
    historyCache.set(cacheKey, {
      cachedAt: Date.now(),
      status: 200,
      payload,
    });
    res.json(payload);
  } catch (error) {
    const payload = {
      error: "自動取得失敗，請手動輸入",
      detail: error.details || error.message,
    };

    historyCache.set(cacheKey, {
      cachedAt: Date.now(),
      status: 502,
      payload,
    });
    res.status(502).json(payload);
  }
});

app.get("/api/chart", async (req, res) => {
  const code = String(req.query.code || "").trim();
  const period = String(req.query.period || "1m").trim();

  if (!code) {
    res.status(400).json({ error: "請提供股票代號" });
    return;
  }

  if (!/^[0-9A-Z.]+$/i.test(code)) {
    res.status(400).json({ error: "股票代號只能包含英數字與小數點" });
    return;
  }

  if (!getPeriodDays(period)) {
    res.status(400).json({ error: "period 只能是 1m、6m 或 1y" });
    return;
  }

  const cacheKey = `${code.toUpperCase()}:${period}`;
  const cached = chartCache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < cacheTtlMs) {
    if (cached.status >= 400) {
      res.status(cached.status).json({ ...cached.payload, cached: true });
      return;
    }
    res.json({ ...cached.payload, cached: true });
    return;
  }

  try {
    const payload = await fetchChartWithFallback(code, period);
    chartCache.set(cacheKey, { cachedAt: Date.now(), status: 200, payload });
    res.json(payload);
  } catch (error) {
    const payload = {
      error: "目前無法取得走勢資料",
      detail: error.details || error.message,
    };
    chartCache.set(cacheKey, { cachedAt: Date.now(), status: 502, payload });
    res.status(502).json(payload);
  }
});

app.listen(port, host, () => {
  console.log(`History API is running at http://${host}:${port}`);
});
