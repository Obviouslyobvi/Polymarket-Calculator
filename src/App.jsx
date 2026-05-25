import { useState, useEffect } from "react";

const THEMES = {
  light: {
    bg: "#f5f0e8", card: "#fffdf7", border: "#d4c9b0", text: "#2c2416", muted: "#8a7d6b",
    accent: "#c0392b", accentBg: "rgba(192,57,43,.08)", green: "#27864a", greenBg: "rgba(39,134,74,.07)",
    inputBg: "#ffffff", inputBorder: "#c4b898", toggleBg: "#e8e0d0", toggleActive: "#2c2416",
    toggleText: "#fffdf7", poly: "#4a3aff", polyBg: "rgba(74,58,255,.08)", sports: "#c0392b", sportsBg: "rgba(192,57,43,.08)",
  },
  dark: {
    bg: "#1a1814", card: "#252219", border: "#3d3628", text: "#e8dcc8", muted: "#9a8e7a",
    accent: "#e74c3c", accentBg: "rgba(231,76,60,.09)", green: "#3ddc84", greenBg: "rgba(61,220,132,.07)",
    inputBg: "#1e1b15", inputBorder: "#4a4235", toggleBg: "#3d3628", toggleActive: "#e8dcc8",
    toggleText: "#1a1814", poly: "#8b7fff", polyBg: "rgba(108,92,255,.12)", sports: "#e74c3c", sportsBg: "rgba(231,76,60,.09)",
  },
};

// ---- math (pure) ----
const parseOdds = (s) => {
  if (!s || s === "-" || s === "+") return null;
  const n = parseInt(s, 10);
  if (isNaN(n) || n === 0 || (n > 0 && n < 100) || (n < 0 && n > -100)) return null;
  return n;
};
const profitFromRisk = (o, r) => (o > 0 ? (r * o) / 100 : (r * 100) / Math.abs(o));
const riskFromProfit = (o, p) => (o > 0 ? (p * 100) / o : (p * Math.abs(o)) / 100);
const decOdds = (o) => (o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o));
const impProb = (o) => (o > 0 ? 100 / (o + 100) : Math.abs(o) / (Math.abs(o) + 100));
const fmt = (n) => (n == null || isNaN(n) ? "" : n.toFixed(2));
const fmtD = (n) => (n == null || isNaN(n) ? "—" : n.toFixed(2));
const pct = (n) => (n == null || isNaN(n) ? "—" : (n * 100).toFixed(1) + "%");

// derive everything from the driving field
function compute(odds, driver, risk, win, poly) {
  const out = { displayRisk: "", displayWin: "", stake: null, profit: null, total: null };
  if (!odds) return out;
  if (driver === "risk") {
    out.displayRisk = risk;
    const r = parseFloat(risk);
    if (r > 0) {
      const p = profitFromRisk(odds, r);
      out.displayWin = fmt(poly ? r + p : p);
      out.stake = r; out.profit = p; out.total = r + p;
    }
  } else {
    out.displayWin = win;
    const w = parseFloat(win);
    if (w > 0) {
      let p, r;
      if (poly) { r = w / decOdds(odds); p = w - r; }
      else { p = w; r = riskFromProfit(odds, p); }
      out.displayRisk = fmt(r);
      out.stake = r; out.profit = p; out.total = r + p;
    }
  }
  return out;
}

const QUICK = [
  ["-110", "Std juice", "52.4%"],
  ["+100", "Even", "50.0%"],
  ["+150", "Dog", "40.0%"],
  ["-200", "Fav", "66.7%"],
];

export default function BetCalculator() {
  const [theme, setTheme] = useState("system");
  const [sysDark, setSysDark] = useState(false);
  const [poly, setPoly] = useState(false);
  const [driver, setDriver] = useState("risk");
  const [odds, setOdds] = useState("");
  const [risk, setRisk] = useState("");
  const [win, setWin] = useState("");

  // system theme watch
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSysDark(mq.matches);
    const h = (e) => setSysDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // load persisted theme
  useEffect(() => {
    try {
      const v = localStorage.getItem("bct");
      if (v) setTheme(v);
    } catch (e) {}
  }, []);

  const changeTheme = (m) => {
    setTheme(m);
    try { localStorage.setItem("bct", m); } catch (e) {}
  };

  const effective = theme === "dark" || (theme === "system" && sysDark) ? "dark" : "light";
  const c = THEMES[effective];

  const parsed = parseOdds(odds);
  const calc = compute(parsed, driver, risk, win, poly);
  const oddsInvalid = !parsed && odds && odds !== "-" && odds !== "+";
  const oddsBorder = parsed ? c.green : oddsInvalid ? c.accent : c.inputBorder;
  const hasResults = calc.stake && calc.profit;
  const showQuick = !parsed;

  const onOdds = (v) => {
    if (v === "" || v === "-" || v === "+" || /^[+-]?\d*$/.test(v)) setOdds(v);
  };
  const onRisk = (v) => {
    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) { setRisk(v); setDriver("risk"); }
  };
  const onWin = (v) => {
    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) { setWin(v); setDriver("win"); }
  };
  const focusRisk = () => { setRisk(calc.displayRisk); setDriver("risk"); };
  const focusWin = () => { setWin(calc.displayWin); setDriver("win"); };

  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const sans = "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";

  const moneyStyle = (active, color, bg) => ({
    width: "100%", padding: "11px 14px 11px 26px", fontSize: 17, fontWeight: 600,
    fontFamily: mono, background: active ? bg : c.inputBg,
    border: `2px solid ${active ? color : c.inputBorder}`, borderRadius: 10,
    color: c.text, outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{ fontFamily: sans, background: c.bg, color: c.text, minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px",
      transition: "background .3s, color .3s" }}>

      {/* theme toggle */}
      <div style={{ display: "flex", gap: 2, background: c.toggleBg, borderRadius: 6, padding: 3, marginBottom: 16 }}>
        {["light", "system", "dark"].map((m) => (
          <button key={m} onClick={() => changeTheme(m)}
            style={{ padding: "4px 10px", fontSize: 11, fontFamily: mono, border: "none", borderRadius: 4,
              cursor: "pointer", background: theme === m ? c.toggleActive : "transparent",
              color: theme === m ? c.toggleText : c.muted, transition: "all .2s", textTransform: "capitalize" }}>
            {m}
          </button>
        ))}
      </div>

      {/* card */}
      <div style={{ width: "100%", maxWidth: 380, background: c.card, borderRadius: 16,
        border: `1px solid ${c.border}`, boxShadow: "0 2px 12px rgba(0,0,0,.08)", overflow: "hidden" }}>

        {/* header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: c.accent, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "#fff" }}>$</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px" }}>Bet Calculator</div>
            <div style={{ fontSize: 11, color: c.muted, fontFamily: mono }}>American odds</div>
          </div>
        </div>

        <div style={{ padding: "16px 22px 22px" }}>
          {/* mode toggle */}
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", marginBottom: 18, border: `1px solid ${c.border}` }}>
            <button onClick={() => setPoly(false)}
              style={{ flex: 1, padding: "10px 0", border: "none", borderRight: `1px solid ${c.border}`, cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all .2s",
                background: !poly ? c.sportsBg : "transparent", color: !poly ? c.sports : c.muted, fontFamily: sans }}>
              Sportsbook
            </button>
            <button onClick={() => setPoly(true)}
              style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all .2s",
                background: poly ? c.polyBg : "transparent", color: poly ? c.poly : c.muted, fontFamily: sans }}>
              Polymarket
            </button>
          </div>

          {/* explainer */}
          <div style={{ fontSize: 11, color: c.muted, fontFamily: mono, padding: "8px 10px", borderRadius: 6,
            marginBottom: 16, lineHeight: 1.5, background: poly ? c.polyBg : c.sportsBg }}>
            {poly
              ? "Polymarket win = total return (your stake back + profit)"
              : "Sportsbook win = profit only (you also get your stake back)"}
          </div>

          {/* odds */}
          <div style={{ fontSize: 11, fontWeight: 500, color: c.muted, textTransform: "uppercase", letterSpacing: 1 }}>Odds</div>
          <input value={odds} onChange={(e) => onOdds(e.target.value)} type="text" inputMode="numeric" placeholder="+150 or -110"
            style={{ width: "100%", padding: "11px 14px", fontSize: 22, fontWeight: 700, fontFamily: mono,
              background: c.inputBg, border: `2px solid ${oddsBorder}`, borderRadius: 10, color: c.text,
              marginTop: 5, marginBottom: 16, outline: "none", boxSizing: "border-box" }} />

          {/* risk + win */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: c.accent, textTransform: "uppercase", letterSpacing: 1 }}>Risk</div>
              <div style={{ position: "relative", marginTop: 5 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: c.muted, fontFamily: mono }}>$</span>
                <input value={calc.displayRisk} onChange={(e) => onRisk(e.target.value)} onFocus={focusRisk}
                  type="text" inputMode="decimal" placeholder="0.00"
                  style={moneyStyle(driver === "risk", c.accent, c.accentBg)} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: poly ? c.poly : c.green, textTransform: "uppercase", letterSpacing: 1 }}>
                {poly ? "Win (total)" : "Win (profit)"}
              </div>
              <div style={{ position: "relative", marginTop: 5 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: c.muted, fontFamily: mono }}>$</span>
                <input value={calc.displayWin} onChange={(e) => onWin(e.target.value)} onFocus={focusWin}
                  type="text" inputMode="decimal" placeholder="0.00"
                  style={moneyStyle(driver === "win", poly ? c.poly : c.green, poly ? c.polyBg : c.greenBg)} />
              </div>
            </div>
          </div>

          {/* results */}
          {hasResults && (
            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: c.greenBg, border: "1px solid rgba(39,134,74,.18)" }}>
              <Row c={c} l="Stake" v={`$${fmtD(calc.stake)}`} />
              <Row c={c} l="Profit" v={`+$${fmtD(calc.profit)}`} green />
              <div style={{ height: 1, background: c.border, margin: "6px 0" }} />
              <Row c={c} l="Total Payout" v={`$${fmtD(calc.total)}`} big />
              <Row c={c} l="Decimal Odds" v={fmtD(decOdds(parsed))} sm />
              <Row c={c} l="Implied Prob" v={pct(impProb(parsed))} sm />
            </div>
          )}

          {/* quick reference */}
          {showQuick && (
            <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: c.inputBg, border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 10, color: c.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quick Reference</div>
              {QUICK.map(([o, l, p]) => (
                <div key={o} onClick={() => { setOdds(o); }}
                  style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", cursor: "pointer",
                    fontSize: 12, borderBottom: "1px solid rgba(212,201,176,.12)" }}>
                  <span style={{ fontFamily: mono, fontWeight: 600 }}>{o}</span>
                  <span style={{ color: c.muted }}>{l}</span>
                  <span style={{ fontFamily: mono, color: c.muted }}>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: c.muted, fontFamily: mono, textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
        Toggle Sportsbook vs Polymarket to match how your platform defines win
      </div>
    </div>
  );
}

function Row({ c, l, v, green, big, sm }) {
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: c.muted, fontWeight: big ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: mono, fontWeight: big ? 700 : sm ? 500 : 600,
        fontSize: big ? 18 : sm ? 13 : 15, color: big || green ? c.green : c.text }}>{v}</span>
    </div>
  );
}
