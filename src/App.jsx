import React, { useState, useEffect, useRef } from "react";

/* ─── SUPABASE CONFIG ───────────────────────────────────────────────────── */
const ADMIN_ROLES = ["admin", "responsabile", "pluriaffiliato", "coach", "titolare"];
const ROLE_LABEL = {
  admin: "Amministratore",
  responsabile: "Responsabile",
  pluriaffiliato: "Pluriaffiliato",
  coach: "Coach",
  titolare: "Titolare",
  consulente: "Consulente",
  notiziere: "Notiziere",
  coordinatrice: "Coordinatrice",
  agente: "Agente",
};
const isAdminRole = (role) => ADMIN_ROLES.includes(role);
const SUPABASE_URL = "https://qwadyehjzkuwsirlgeye.supabase.co";
const SUPABASE_KEY = "sb_publishable_PAFzxLz4YBi5pT_CBIdJow_i9oxBwUT";

async function sbFetch(path, options = {}) {
  // RLS disabled - always use SUPABASE_KEY, token is optional
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {})
    },
    method: options.method || "GET",
    body: options.body || undefined
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sbAuth(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Login fallito");
  return data;
}

/* ─── SCALE OPTIONS ─────────────────────────────────────────────────────── */
const SCALE_OPTIONS = [
  ...["A","B","C","D","E","F","G","H"],
  ...["A1","B1","C1","D1","E1","F1","G1","H1"],
  ...["A2","B2","C2","D2","E2","F2","G2","H2"],
  ...["A3","B3","C3","D3","E3","F3","G3","H3"],
];

/* ─── MOCK DATA (fallback) ──────────────────────────────────────────────── */
const INITIAL_STATE = {
  uffici: [
    { id: 1, nome: "ACILIA" },
    { id: 2, nome: "CASALOTTI" },
    { id: 3, nome: "TORREVECCHIA" },
  ],
  zone: [
    { id: 1, nome: "ACILIA A", ufficioId: 1 },
    { id: 2, nome: "ACILIA B", ufficioId: 1 },
    { id: 3, nome: "TORREVECCHIA NORD", ufficioId: 3 },
    { id: 4, nome: "TORREVECCHIA SUD", ufficioId: 3 },
    { id: 5, nome: "CASALOTTI CENTRO", ufficioId: 2 },
  ],
  vie: [
    { id: 1, nome: "VIA DI SAPONARA", zonaId: 1 },
    { id: 2, nome: "VIA DELLE ACILIE", zonaId: 1 },
    { id: 3, nome: "VIA ROMA", zonaId: 2 },
  ],
  civici: [
    { id: 1, numero: "19", viaId: 1 },
    { id: 2, numero: "21", viaId: 1 },
    { id: 3, numero: "5", viaId: 2 },
  ],
  contatti: [
    { id: 1, nome: "ENRICO", cognome: "RICCA", telefono: "333666555444", risposto: "Y", risposto_data: null, stato: "INFORMAZIONE", vuoto: "", interno: "", scala: "", bloccato: false, civicoId: 1 },
    { id: 2, nome: "GIALLI", cognome: "", telefono: "33333222222", risposto: "Y", risposto_data: null, stato: "", vuoto: "Y", interno: "", scala: "", bloccato: false, civicoId: 1 },
    { id: 3, nome: "BLU", cognome: "", telefono: "444444444", risposto: "", risposto_data: null, stato: "", vuoto: "", interno: "", scala: "", bloccato: false, civicoId: 1 },
  ],
  attivita: [
    { id: 1, contattoId: 1, commento: "Emiliano gnegnegne", dataOra: "4/3/2026 13:11:47", utente: "enricoriccamcm@gmail.com" },
    { id: 2, contattoId: 1, commento: "nv", dataOra: "18/2/2026 14:24:16", utente: "enricoriccamcm@gmail.com" },
    { id: 3, contattoId: 1, commento: "NON VENDE", dataOra: "17/2/2026 13:22:23", utente: "enricoriccamcm@gmail.com" },
  ],
};

/* ─── THEME ──────────────────────────────────────────────────────────────── */
const T = {
  bg: "#1a1a1a",
  surface: "#242424",
  surfaceHigh: "#2e2e2e",
  border: "#3a3a3a",
  accent: "#e05c5c",
  accentSoft: "rgba(224,92,92,0.15)",
  text: "#ffffff",
  textMuted: "#888888",
  textDim: "#444444",
  green: "#4caf50",
  row: "#1e1e1e",
  rowAlt: "#242424",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: 'Barlow', sans-serif; background: #1a1a1a; color: #fff; }
  input, select, textarea, button { font-family: 'Barlow', sans-serif; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px);} to {opacity:1; transform:translateY(0);} }
  @keyframes slideUp { from { transform:translateY(100%);} to {transform:translateY(0);} }
  .screen { animation: fadeIn 0.18s ease; }
  .tap:active { opacity: 0.7; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 2px; }

  .app-container { max-width: 480px; margin: 0 auto; min-height: 100vh; }

  @media (min-width: 768px) {
    .app-container { max-width: 768px; }
    .topbar-title { font-size: 20px !important; }
    .row-text { font-size: 15px !important; }
    .row-text-sm { font-size: 13px !important; }
    .th-text { font-size: 12px !important; }
    .section-pad { padding: 16px 24px !important; }
    .fab-edit { bottom: 80px !important; left: 24px !important; width: 56px !important; height: 56px !important; }
    .fab-plus { bottom: 80px !important; right: 24px !important; width: 56px !important; height: 56px !important; }
    .bottombar { max-width: 768px !important; }
    .modal-inner { max-width: 500px !important; border-radius: 16px 16px 0 0; }
  }

  @media (min-width: 1024px) {
    .app-container { max-width: 960px; }
    .topbar-title { font-size: 22px !important; }
    .row-text { font-size: 16px !important; }
    .row-text-sm { font-size: 14px !important; }
    .th-text { font-size: 13px !important; }
    .bottombar { max-width: 960px !important; }
    .modal-inner { max-width: 600px !important; }
  }

  .autocomplete-list {
    position: absolute;
    z-index: 1000;
    background: #2e2e2e;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    top: 100%;
    left: 0;
    margin-top: 2px;
  }
  .autocomplete-item {
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    border-bottom: 1px solid #333;
    color: #ccc;
  }
  .autocomplete-item:hover { background: #3a3a3a; color: #fff; }
  .autocomplete-item:last-child { border-bottom: none; }
`;

/* ─── SVG ICONS ──────────────────────────────────────────────────────────── */
const Svg = ({ d, size = 18, sw = 2, fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const IBack    = () => <Svg d={["M19 12H5","M12 19l-7-7 7-7"]} />;
const ISearch  = () => <Svg d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const IRefresh = () => <Svg d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
const IEditPen = () => <Svg d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />;
const ITrash   = () => <Svg d={["M3 6h18","M8 6V4h8v2","M19 6l-1 14H6L5 6"]} />;
const IArrow   = () => <Svg d="M9 18l6-6-6-6" />;
const IUfficio = () => <Svg d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />;
const ILogout  = () => <Svg d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const IX       = () => <Svg d={["M18 6L6 18","M6 6l12 12"]} />;
const ILock    = () => <Svg d={["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 10 0v4"]} />;

/* ─── LOGO ───────────────────────────────────────────────────────────────── */
const LogoMark = ({ size = 40 }) => {
  const h = size;
  const r = h * 0.50;
  const cy = h / 2;
  const cx1 = r;
  const cx2 = r * 1.55;
  const w = cx2 + r;
  const grey = `${cx1},${cy - r} ${cx1 + r},${cy} ${cx1},${cy + r} ${cx1 - r},${cy}`;
  const red  = `${cx2},${cy - r} ${cx2 + r},${cy} ${cx2},${cy + r} ${cx2 - r},${cy}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
      <polygon points={grey} fill="#8a8a8a" />
      <polygon points={red}  fill="#cc2222" />
    </svg>
  );
};

const Logo = ({ size = 22 }) => <LogoMark size={size} />;

const LogoFull = ({ height = 36 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <LogoMark size={height} />
    <div style={{ fontFamily: "'Arial', 'Helvetica Neue', sans-serif", fontSize: height * 0.68, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1, color: "#555" }}>
      professione<span style={{ color: "#cc2222" }}>casa</span>
    </div>
  </div>
);

/* ─── SHARED COMPONENTS ──────────────────────────────────────────────────── */
function TopBar({ title, subtitle, onBack, right, onLogout }) {
  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 18px", gap: 10 }}>
        {onBack
          ? <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", padding: "4px 6px 4px 0", display: "flex" }}><IBack /></button>
          : <Logo />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle && <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 1 }}>{subtitle}</div>}
          <div className="topbar-title" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: subtitle ? 17 : 16, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: T.textMuted }}>
          {right}
          {onLogout && <button className="tap" onClick={onLogout} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><ILogout /></button>}
        </div>
      </div>
    </div>
  );
}

function BottomBar({ onUfficio }) {
  return (
    <div className="bottombar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 100 }}>
      <button className="tap" onClick={onUfficio}
        style={{ flex: 1, background: "none", border: "none", color: T.accent, cursor: "pointer", padding: "9px 0 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
        <IUfficio />
        UFFICIO
        <div style={{ width: 28, height: 2, background: T.accent, borderRadius: 1 }} />
      </button>
    </div>
  );
}

function FabPlus({ onClick }) {
  return (
    <button className="tap fab-plus" onClick={onClick}
      style={{ position: "fixed", bottom: 72, right: 18, width: 50, height: 50, borderRadius: "50%", background: T.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 18px rgba(224,92,92,0.45)", zIndex: 99 }}>
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-inner" style={{ background: T.surface, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px", animation: "slideUp 0.22s ease", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
          <button className="tap" onClick={onClose} style={{ background: T.surfaceHigh, border: "none", color: T.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex" }}><IX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FInput({ label, value, onChange, placeholder, type = "text" }) {
  const noUpper = type === "tel" || type === "email" || type === "password";
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      <input type={type} value={value}
        onChange={e => onChange(noUpper ? e.target.value : e.target.value.toUpperCase())}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none" }} />
    </div>
  );
}

function PrimaryBtn({ label, onClick }) {
  return (
    <button className="tap" onClick={onClick}
      style={{ width: "100%", padding: "12px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5 }}>
      {label}
    </button>
  );
}

const HR = () => <div style={{ height: 1, background: T.border }} />;

const TH = ({ cols, widths }) => (
  <div style={{ display: "grid", gridTemplateColumns: widths, background: T.surface, borderBottom: `1px solid ${T.border}` }}>
    {cols.map(c => <span key={c} style={{ padding: "9px 4px", fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, whiteSpace: "nowrap", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{c}</span>)}
  </div>
);

const ActionRow = ({ onAdd }) => (
  <div style={{ padding: "11px 16px", display: "flex", justifyContent: "flex-end", gap: 20 }}>
    <button className="tap" onClick={onAdd} style={{ background: "none", border: "none", color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>AGGIUNGI</button>
  </div>
);

const SectionTag = ({ label, count }) => (
  <div style={{ padding: "10px 16px 7px", display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
    <span style={{ background: T.surfaceHigh, color: T.text, borderRadius: 4, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{count}</span>
  </div>
);

function RefreshBtn({ onRefresh }) {
  const [spinning, setSpinning] = useState(false);
  const handle = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    if (onRefresh) onRefresh();
  };
  return (
    <button onClick={handle} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4, transition: "transform 0.6s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>
      <IRefresh />
    </button>
  );
}

/* ─── VIA AUTOCOMPLETE (Nominatim) ─────────────────────────────────────── */
function ViaAutocomplete({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (val) => {
    const up = val.toUpperCase();
    onChange(up);
    clearTimeout(timerRef.current);
    if (up.length < 4) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(val + ", Roma, Italia");
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=6&addressdetails=1&accept-language=it`, {
          headers: { "User-Agent": "YCENS-App/1.0" }
        });
        const data = await res.json();
        const vieUniche = [];
        const viste = new Set();
        data.forEach(item => {
          const road = item.address?.road;
          if (road && !viste.has(road)) {
            viste.add(road);
            vieUniche.push(road.toUpperCase());
          }
        });
        setSuggestions(vieUniche);
        setOpen(vieUniche.length > 0);
      } catch(e) { setSuggestions([]); }
      setLoading(false);
    }, 500);
  };

  const select = (v) => { onChange(v); setSuggestions([]); setOpen(false); };

  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>NOME VIA</div>
      <input value={value} onChange={e => handleChange(e.target.value)} placeholder={placeholder || "es. VIA DI SAPONARA"}
        style={{ width: "100%", padding: "10px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none" }} />
      {loading && <div style={{ position: "absolute", right: 12, top: 36, fontSize: 11, color: T.textMuted }}>...</div>}
      {open && suggestions.length > 0 && (
        <div className="autocomplete-list">
          {suggestions.map((s, i) => (
            <div key={i} className="autocomplete-item" onMouseDown={() => select(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SCREENS ────────────────────────────────────────────────────────────── */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true); setErr("");
    try {
      const auth = await sbAuth(email.trim(), pass);
      const token = auth.access_token;
      const profiles = await sbFetch(`profili?id=eq.${auth.user.id}`, { token });
      const profile = profiles[0] || {};
      onLogin({
        id: auth.user.id,
        email: auth.user.email,
        role: profile.role || "agente",
        nome: profile.nome || null,
        ufficioId: profile.ufficio_id || null,
        token
      });
    } catch(e) {
      setErr("Email o password errati");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <LogoFull height={40} />
        </div>
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: 4, color: T.text, lineHeight: 1 }}>
            Y<span style={{ color: T.accent }}>-</span>CENS
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", marginTop: 4, fontFamily: "'Barlow Condensed'" }}>Gestione Censimento</div>
        </div>
      </div>
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 360, border: `1px solid ${T.border}` }}>
        <FInput label="Email" value={email} onChange={setEmail} placeholder="nome@agenzia.it" type="email" />
        <FInput label="Password" value={pass} onChange={setPass} placeholder="••••••••" type="password" />
        {err && <p style={{ color: T.accent, fontSize: 13, marginBottom: 12 }}>{err}</p>}
        <PrimaryBtn label={loading ? "ACCESSO..." : "ACCEDI"} onClick={handle} />
      </div>
    </div>
  );
}

function UfficiScreen({ data, user, onSelect, onLogout }) {
  const SUPER_ROLES = ["pluriaffiliato", "titolare"];
  const uffici = SUPER_ROLES.includes(user.role) ? data.uffici : data.uffici.filter(u => u.id === user.ufficioId);
  const [changePwModal, setChangePwModal] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const doChangePw = async () => {
    if (newPw.length < 6) { setPwMsg("❌ Password troppo corta (min. 6 caratteri)"); return; }
    if (newPw !== newPw2) { setPwMsg("❌ Le password non coincidono"); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}`, "apikey": SUPABASE_KEY },
        body: JSON.stringify({ password: newPw })
      });
      if (res.ok) { setPwMsg("✅ Password cambiata!"); setNewPw(""); setNewPw2(""); setTimeout(() => { setChangePwModal(false); setPwMsg(""); }, 1500); }
      else { setPwMsg("❌ Errore, riprova"); }
    } catch(e) { setPwMsg("❌ Errore di rete"); }
    setPwLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 80, position: "relative", overflow: "hidden" }} className="screen">
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.055, pointerEvents: "none", zIndex: 0 }} viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="180" x2="400" y2="220" stroke="white" strokeWidth="6"/>
        <line x1="0" y1="420" x2="400" y2="390" stroke="white" strokeWidth="5"/>
        <line x1="120" y1="0" x2="100" y2="900" stroke="white" strokeWidth="6"/>
        <line x1="300" y1="0" x2="280" y2="900" stroke="white" strokeWidth="5"/>
      </svg>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoFull height={28} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setChangePwModal(true)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 8px" }}>🔑 PASSWORD</button>
            <button onClick={onLogout} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><ILogout /></button>
          </div>
        </div>
        <div style={{ padding: "20px 18px 10px" }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>BENVENUTO</div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 24, letterSpacing: 0.5 }}>{(user.nome || user.email.split("@")[0]).toUpperCase()}</div>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>● {(ROLE_LABEL[user.role] || user.role).toUpperCase()}</div>
        </div>
        <HR />
        <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>SELEZIONA UFFICIO</div>
          <div style={{ background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 700, color: T.textMuted }}>{uffici.length}</div>
        </div>
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {uffici.map((u) => (
            <div key={u.id} className="tap" onClick={() => onSelect(u)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={1.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>{u.nome}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                    {(data.zone||[]).filter(z => z.ufficioId === u.id).length} zone
                  </div>
                </div>
              </div>
              <span style={{ color: T.accent }}><IArrow /></span>
            </div>
          ))}
        </div>
        <div style={{ margin: "28px 0 0", borderTop: `1px solid ${T.border}`, padding: "24px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted, fontStyle: "italic", lineHeight: 1.7 }}>
            "Il miglior immobile da vendere è quello che<br/>ancora nessuno sa che è in vendita."
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.accent, fontFamily: "'Barlow Condensed'", fontWeight: 700, letterSpacing: 2 }}>— E.R.</div>
        </div>
      </div>
      <BottomBar onUfficio={() => {}} />

      {changePwModal && <Modal title="Cambia Password" onClose={() => { setChangePwModal(false); setPwMsg(""); setNewPw(""); setNewPw2(""); }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>NUOVA PASSWORD</div>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="min. 6 caratteri"
            style={{ width: "100%", padding: "11px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CONFERMA PASSWORD</div>
          <input type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} placeholder="ripeti la password"
            style={{ width: "100%", padding: "11px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        {pwMsg && <div style={{ fontSize: 12, color: pwMsg.includes("✅") ? "#4caf50" : T.accent, marginBottom: 12, fontWeight: 600 }}>{pwMsg}</div>}
        <PrimaryBtn label={pwLoading ? "SALVATAGGIO..." : "SALVA PASSWORD"} onClick={doChangePw} />
      </Modal>}
    </div>
  );
}

function ZoneScreen({ data, setData, ufficio, onSelect, onBack, onUfficio, user, onReload }) {
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editNome, setEditNome] = useState("");
  const isAdmin = ADMIN_ROLES.includes(user.role);
  const zone = (data.zone||[]).filter(z => z.ufficioId === ufficio.id).filter(z => !search || z.nome.toLowerCase().includes(search.toLowerCase()));
  const vieCount = id => (data.vie||[]).filter(v => v.zonaId === id).length;

  const add = () => {
    if (!nome.trim()) return;
    setData(d => ({ ...d, zone: [...(d.zone||[]), { id: Date.now(), nome: nome.trim().toUpperCase(), ufficioId: ufficio.id }] }));
    setNome(""); setModal(false);
  };

  const saveEdit = () => {
    if (!editNome.trim()) return;
    sbFetch(`zone?id=eq.${editModal.id}`, { method: "PATCH", body: JSON.stringify({ nome: editNome.trim().toUpperCase() }), prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, zone: d.zone.map(z => z.id === editModal.id ? { ...z, nome: editNome.trim().toUpperCase() } : z) }));
    setEditModal(null);
  };

  const doDelete = (z) => {
    if (vieCount(z.id) > 0) { setConfirmDel(null); return; }
    sbFetch(`zone?id=eq.${z.id}`, { method: "DELETE", prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, zone: d.zone.filter(x => x.id !== z.id) }));
    setConfirmDel(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={ufficio.nome} subtitle="UFFICIO DI" onBack={onBack}
        right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); if(onReload) onReload(); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value.toUpperCase())} placeholder="Cerca zona..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <SectionTag label="ZONA" count={zone.length} />
      <HR />
      <TH cols={isAdmin ? ["NOME ZONA", "VIE", ""] : ["NOME ZONA", "VIE"]} widths={isAdmin ? "1fr 1fr 0.8fr" : "1fr 1fr"} />
      {zone.map((z, i) => (
        <div key={z.id}>
          <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr 0.8fr" : "1fr 1fr", alignItems: "center", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span className="tap" onClick={() => onSelect(z)} style={{ padding: "14px 10px", fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer" }}>{z.nome}</span>
            <span className="tap" onClick={() => onSelect(z)} style={{ padding: "14px 10px", fontSize: 14, fontWeight: 800, textAlign: "center", cursor: "pointer", color: T.textMuted }}>{vieCount(z.id) || "—"}</span>
            {isAdmin && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }} onClick={e => e.stopPropagation()}>
                <button className="tap" onClick={() => { setEditModal(z); setEditNome(z.nome); }}
                  style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", padding:6, display:"flex" }}><IEditPen /></button>
                <button className="tap" onClick={() => setConfirmDel(z)}
                  style={{ background:"none", border:"none", color: vieCount(z.id) > 0 ? T.textDim : T.accent, cursor:"pointer", padding:6, display:"flex" }}><ITrash /></button>
              </div>
            )}
          </div>
          <HR />
        </div>
      ))}
      {isAdmin && <ActionRow onAdd={() => setModal(true)} />}
      {isAdmin && <FabPlus onClick={() => setModal(true)} />}
      <BottomBar onUfficio={onUfficio} />

      {modal && isAdmin && <Modal title="Nuova Zona" onClose={() => setModal(false)}>
        <FInput label="Nome Zona" value={nome} onChange={setNome} placeholder="es. ACILIA C" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}

      {editModal && isAdmin && <Modal title="Modifica Zona" onClose={() => setEditModal(null)}>
        <FInput label="Nome Zona" value={editNome} onChange={setEditNome} placeholder="es. ACILIA C" />
        <PrimaryBtn label="SALVA" onClick={saveEdit} />
      </Modal>}

      {confirmDel && <Modal title="Elimina Zona" onClose={() => setConfirmDel(null)}>
        {vieCount(confirmDel.id) > 0
          ? <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>⚠️ Non puoi eliminare <b style={{color:T.text}}>{confirmDel.nome}</b> perché contiene ancora {vieCount(confirmDel.id)} vie. Svuotala prima.</div><PrimaryBtn label="OK" onClick={() => setConfirmDel(null)} /></>
          : <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Eliminare definitivamente <b style={{color:T.text}}>{confirmDel.nome}</b>?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="tap" onClick={() => setConfirmDel(null)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
                <button className="tap" onClick={() => doDelete(confirmDel)} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>ELIMINA</button>
              </div>
            </>
        }
      </Modal>}
    </div>
  );
}

function VieScreen({ data, setData, zona, onSelect, onBack, onUfficio, onReload }) {
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const vie = (data.vie||[]).filter(v => v.zonaId === zona.id).filter(v => !search || v.nome.toLowerCase().includes(search.toLowerCase()));
  const civiciCount = id => (data.civici||[]).filter(c => c.viaId === id).length;
  const contattiViaStats = id => {
    const civiciDiQuesta = (data.civici||[]).filter(c => c.viaId === id).map(c => c.id);
    const tutti = (data.contatti||[]).filter(c => civiciDiQuesta.includes(c.civicoId));
    const risposti = tutti.filter(c => c.risposto === "Y").length;
    return { totale: tutti.length, risposti };
  };

  const add = () => {
    if (!nome.trim()) return;
    setData(d => ({ ...d, vie: [...(d.vie||[]), { id: Date.now(), nome: nome.trim().toUpperCase(), zonaId: zona.id }] }));
    setNome(""); setModal(false);
  };

  const saveEdit = () => {
    if (!editNome.trim()) return;
    sbFetch(`vie?id=eq.${editModal.id}`, { method: "PATCH", body: JSON.stringify({ nome: editNome.trim().toUpperCase() }), prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, vie: d.vie.map(v => v.id === editModal.id ? { ...v, nome: editNome.trim().toUpperCase() } : v) }));
    setEditModal(null);
  };

  const doDelete = (v) => {
    if (civiciCount(v.id) > 0) { setConfirmDel(null); return; }
    sbFetch(`vie?id=eq.${v.id}`, { method: "DELETE", prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, vie: d.vie.filter(x => x.id !== v.id) }));
    setConfirmDel(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={zona.nome} subtitle="NOME ZONA" onBack={onBack}
        right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); if(onReload) onReload(); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value.toUpperCase())} placeholder="Cerca via..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <SectionTag label="VIE" count={vie.length} />
      <HR />
      <TH cols={["NOME VIA", "CIV.", "CONT.", ""]} widths="1fr 0.5fr 0.8fr 0.6fr" />
      {vie.map((v, i) => {
        const nc = civiciCount(v.id);
        const { totale, risposti } = contattiViaStats(v.id);
        const pieno = totale > 0 && risposti === totale;
        const nessuno = totale === 0;
        return (
          <div key={v.id}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.5fr 0.8fr 0.6fr", alignItems: "center", background: i % 2 === 0 ? T.row : T.rowAlt }}>
              <span className="tap" onClick={() => onSelect(v)} style={{ padding: "14px 10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{v.nome}</span>
              <span className="tap" onClick={() => onSelect(v)} style={{ padding: "14px 6px", fontSize: 13, color: T.textMuted, textAlign: "center", cursor: "pointer" }}>{nc || "—"}</span>
              <span className="tap" onClick={() => onSelect(v)} style={{ padding: "5px 4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: pieno ? "rgba(76,175,80,0.15)" : nessuno ? "transparent" : "rgba(255,255,255,0.04)", border: `1px solid ${pieno ? "#4caf50" : nessuno ? "#2a2a2a" : "#333"}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: pieno ? "#4caf50" : nessuno ? "#444" : T.textMuted, minWidth: 48, justifyContent: "center" }}>
                  {nessuno ? <span style={{fontSize:10}}>—</span> : <>{pieno && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}<span>{risposti}</span><span style={{color:"#444",fontWeight:400}}>/</span><span>{totale}</span></>}
                </span>
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, padding: "0 8px" }} onClick={e => e.stopPropagation()}>
                <button className="tap" onClick={() => { setEditModal(v); setEditNome(v.nome); }}
                  style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 6, display: "flex" }}><IEditPen /></button>
                <button className="tap" onClick={() => setConfirmDel(v)}
                  style={{ background: "none", border: "none", color: nc > 0 ? T.textDim : T.accent, cursor: "pointer", padding: 6, display: "flex" }}><ITrash /></button>
              </div>
            </div>
            <HR />
          </div>
        );
      })}
      <ActionRow onAdd={() => setModal(true)} />
      <FabPlus onClick={() => setModal(true)} />
      <BottomBar onUfficio={onUfficio} />

      {modal && <Modal title="Nuova Via" onClose={() => setModal(false)}>
        <ViaAutocomplete value={nome} onChange={setNome} placeholder="es. VIA DI SAPONARA" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}
      {editModal && <Modal title="Modifica Via" onClose={() => setEditModal(null)}>
        <ViaAutocomplete value={editNome} onChange={setEditNome} placeholder="es. VIA DI SAPONARA" />
        <PrimaryBtn label="SALVA" onClick={saveEdit} />
      </Modal>}
      {confirmDel && <Modal title="Elimina Via" onClose={() => setConfirmDel(null)}>
        {civiciCount(confirmDel.id) > 0
          ? <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>⚠️ Non puoi eliminare <b style={{color:T.text}}>{confirmDel.nome}</b> perché contiene ancora {civiciCount(confirmDel.id)} civico/i. Svuotala prima.</div><PrimaryBtn label="OK" onClick={() => setConfirmDel(null)} /></>
          : <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Eliminare definitivamente <b style={{color:T.text}}>{confirmDel.nome}</b>?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="tap" onClick={() => setConfirmDel(null)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
                <button className="tap" onClick={() => doDelete(confirmDel)} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>ELIMINA</button>
              </div>
            </>
        }
      </Modal>}
    </div>
  );
}

function CiviciScreen({ data, setData, via, zona, onSelect, onBack, onUfficio, onReload }) {
  const [modal, setModal] = useState(false);
  const [numero, setNumero] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editNumero, setEditNumero] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [sortCivici, setSortCivici] = useState("asc"); // asc | desc
  const [filtroPari, setFiltroPari] = useState("tutti"); // tutti | pari | dispari

  const civiciRaw = (data.civici||[])
    .filter(c => c.viaId === via.id)
    .filter(c => !search || c.numero.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      const n = parseInt(c.numero);
      if (filtroPari === "pari") return !isNaN(n) && n % 2 === 0;
      if (filtroPari === "dispari") return !isNaN(n) && n % 2 !== 0;
      return true;
    })
    .sort((a, b) => {
      const na = parseInt(a.numero) || 0;
      const nb = parseInt(b.numero) || 0;
      return sortCivici === "asc" ? na - nb : nb - na;
    });
  const civici = civiciRaw;
  const contattiStats = id => {
    const tutti = (data.contatti||[]).filter(c => c.civicoId === id);
    const risposto = tutti.filter(c => c.risposto === "Y").length;
    return { totale: tutti.length, risposto };
  };

  const add = async () => {
    if (!numero.trim()) return;
    const tempId = Date.now();
    setData(d => ({ ...d, civici: [...(d.civici||[]), { id: tempId, numero: numero.trim(), viaId: via.id }] }));
    setNumero(""); setModal(false);
  };

  const saveEdit = () => {
    if (!editNumero.trim()) return;
    sbFetch(`civici?id=eq.${editModal.id}`, { method: "PATCH", body: JSON.stringify({ numero: editNumero.trim() }), prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, civici: d.civici.map(c => c.id === editModal.id ? { ...c, numero: editNumero.trim() } : c) }));
    setEditModal(null);
  };

  const doDelete = (c) => {
    if (contattiStats(c.id).totale > 0) { setConfirmDel(null); return; }
    sbFetch(`civici?id=eq.${c.id}`, { method: "DELETE", prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, civici: d.civici.filter(x => x.id !== c.id) }));
    setConfirmDel(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={via.nome} subtitle="NOME VIA" onBack={onBack}
        right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); if(onReload) onReload(); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca civico..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <div style={{ padding: "12px 16px 6px" }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ZONA</div>
        <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>{zona.nome}</span>
      </div>
      <HR />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>CIVICI</span>
          <span style={{ background: T.surfaceHigh, color: T.text, borderRadius: 4, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{civici.length}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {/* Ordine */}
          <button className="tap" onClick={() => setSortCivici(s => s === "asc" ? "desc" : "asc")}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
            N° {sortCivici === "asc" ? "↑" : "↓"}
          </button>
          {/* Pari/Dispari */}
          {["tutti","pari","dispari"].map(f => (
            <button key={f} className="tap" onClick={() => setFiltroPari(f)}
              style={{ background: filtroPari === f ? T.accentSoft : "none", border: `1px solid ${filtroPari === f ? T.accent : T.border}`, borderRadius: 6, padding: "4px 8px", color: filtroPari === f ? T.accent : T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase" }}>
              {f === "tutti" ? "TUTTI" : f === "pari" ? "PARI" : "DISP."}
            </button>
          ))}
        </div>
      </div>
      <HR />
      <TH cols={["N°", "RISP.", ""]} widths="1fr 1.2fr 0.7fr" />
      {civici.map((c, i) => {
        const { totale, risposto } = contattiStats(c.id);
        const pieno = totale > 0 && risposto === totale;
        const nessuno = totale === 0;
        return (
          <div key={c.id}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.7fr", alignItems: "center", background: i % 2 === 0 ? T.row : T.rowAlt }}>
              <span className="tap" onClick={() => onSelect(c)} style={{ padding: "13px 10px", fontSize: 14, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>{c.numero}</span>
              <span className="tap" onClick={() => onSelect(c)} style={{ padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: pieno ? "rgba(76,175,80,0.15)" : nessuno ? "transparent" : "rgba(255,255,255,0.04)", border: `1px solid ${pieno ? "#4caf50" : nessuno ? "#2a2a2a" : "#333"}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: pieno ? "#4caf50" : nessuno ? "#444" : T.textMuted, minWidth: 60, justifyContent: "center" }}>
                  {nessuno ? <span style={{fontSize:11}}>—</span> : <>{pieno && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}<span>{risposto}</span><span style={{color:"#444",fontWeight:400}}>/</span><span>{totale}</span></>}
                </span>
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, padding: "0 6px" }} onClick={e => e.stopPropagation()}>
                <button className="tap" onClick={() => { setEditModal(c); setEditNumero(c.numero); }}
                  style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", padding:6, display:"flex" }}><IEditPen /></button>
                <button className="tap" onClick={() => setConfirmDel(c)}
                  style={{ background:"none", border:"none", color: totale > 0 ? T.textDim : T.accent, cursor:"pointer", padding:6, display:"flex" }}><ITrash /></button>
              </div>
            </div>
            <HR />
          </div>
        );
      })}
      <ActionRow onAdd={() => setModal(true)} />
      <FabPlus onClick={() => setModal(true)} />
      <BottomBar onUfficio={onUfficio} />

      {modal && <Modal title="Nuovo Civico" onClose={() => setModal(false)}>
        <FInput label="Numero Civico" value={numero} onChange={setNumero} placeholder="es. 19" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}
      {editModal && <Modal title="Modifica Civico" onClose={() => setEditModal(null)}>
        <FInput label="Numero Civico" value={editNumero} onChange={setEditNumero} placeholder="es. 19" />
        <PrimaryBtn label="SALVA" onClick={saveEdit} />
      </Modal>}
      {confirmDel && <Modal title="Elimina Civico" onClose={() => setConfirmDel(null)}>
        {contattiStats(confirmDel.id).totale > 0
          ? <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>⚠️ Non puoi eliminare il civico <b style={{color:T.text}}>{confirmDel.numero}</b> perché contiene ancora {contattiStats(confirmDel.id).totale} contatto/i. Svuotalo prima.</div><PrimaryBtn label="OK" onClick={() => setConfirmDel(null)} /></>
          : <><div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Eliminare definitivamente il civico <b style={{color:T.text}}>{confirmDel.numero}</b>?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="tap" onClick={() => setConfirmDel(null)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
                <button className="tap" onClick={() => doDelete(confirmDel)} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>ELIMINA</button>
              </div>
            </>
        }
      </Modal>}
    </div>
  );
}

/* ── Contatto form components ───────────────────────────────────────────── */
function SiNoSelector({ label, value, onChange }) {
  const opts = [
    { v: "Y", label: "SI",  color: T.green,  activeBg: "rgba(76,175,80,0.2)" },
    { v: "N", label: "NO",  color: T.accent, activeBg: T.accentSoft },
  ];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 7, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {opts.map(o => (
          <button key={o.v} className="tap" onClick={() => onChange(value === o.v ? "" : o.v)}
            style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1.5px solid ${value === o.v ? o.color : T.border}`, background: value === o.v ? o.activeBg : T.surfaceHigh, color: value === o.v ? o.color : T.textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatoSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 7, textTransform: "uppercase" }}>STATO</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { v: "INFORMAZIONE", color: "#4fc3f7", bg: "rgba(79,195,247,0.15)" },
          { v: "NOTIZIA",      color: "#e05c5c", bg: "rgba(224,92,92,0.15)" },
          { v: "CONCORRENZA",  color: "#f0a500", bg: "rgba(240,165,0,0.15)" },
        ].map(s => (
          <button key={s.v} className="tap" onClick={() => onChange(value === s.v ? "" : s.v)}
            style={{ flex: 1, padding: "11px 8px", borderRadius: 8, border: `1.5px solid ${value === s.v ? s.color : T.border}`, background: value === s.v ? s.bg : T.surfaceHigh, color: value === s.v ? s.color : T.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {s.v}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContattoForm({ form, upd, civici = [], onSave, onCancel, saveLabel = "SALVA" }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>CIVICO</div>
        <select value={form.civicoId} onChange={e => upd("civicoId", Number(e.target.value))}
          style={{ width: "100%", padding: "11px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", appearance: "none" }}>
          {civici.map(c => <option key={c.id} value={c.id}>{c.numero}</option>)}
        </select>
      </div>
      <FInput label="NOME *" value={form.nome} onChange={v => upd("nome", v)} placeholder="ES. MARIO" />
      <FInput label="COGNOME *" value={form.cognome} onChange={v => upd("cognome", v)} placeholder="ES. ROSSI" />
      <FInput label="TELEFONO *" value={form.telefono} onChange={v => upd("telefono", v)} placeholder="es. 333 1234567" type="tel" />

      {/* RISPOSTO doppio checkbox */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>RISPOSTO</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="tap" onClick={() => { upd("risposto", "Y"); upd("risposto_data", new Date().toISOString()); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, cursor: "pointer", border: `2px solid ${form.risposto === "Y" ? "#4caf50" : "#2a2a2a"}`, background: form.risposto === "Y" ? "rgba(76,175,80,0.15)" : "transparent" }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.risposto === "Y" ? "#4caf50" : "#444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {form.risposto === "Y" && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: form.risposto === "Y" ? "#4caf50" : T.textMuted }}>RISPOSTO</span>
          </button>
          <button className="tap" onClick={() => { upd("risposto", "N"); upd("risposto_data", new Date().toISOString()); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 8, cursor: "pointer", border: `2px solid ${form.risposto === "N" ? "#e05c5c" : "#2a2a2a"}`, background: form.risposto === "N" ? "rgba(224,92,92,0.15)" : "transparent" }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.risposto === "N" ? "#e05c5c" : "#444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {form.risposto === "N" && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#e05c5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: form.risposto === "N" ? "#e05c5c" : T.textMuted }}>NON RISPONDE</span>
          </button>
        </div>
      </div>

      <SiNoSelector label="VUOTO" value={form.vuoto} onChange={v => upd("vuoto", v)} />

      {/* INTERNO */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>INTERNO</div>
        <select value={form.interno || ""} onChange={e => upd("interno", e.target.value)}
          style={{ width: "100%", padding: "11px 12px", background: form.interno ? "rgba(224,92,92,0.1)" : T.surfaceHigh, border: `1px solid ${form.interno ? "#e05c5c" : T.border}`, borderRadius: 8, color: form.interno ? "#e05c5c" : T.textMuted, fontSize: 14, fontWeight: 700, outline: "none", appearance: "none", cursor: "pointer" }}>
          <option value="">— nessuno —</option>
          {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>Interno {n}</option>)}
        </select>
      </div>

      {/* SCALA */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>SCALA</div>
        <select value={form.scala || ""} onChange={e => upd("scala", e.target.value)}
          style={{ width: "100%", padding: "11px 12px", background: form.scala ? "rgba(224,92,92,0.1)" : T.surfaceHigh, border: `1px solid ${form.scala ? "#e05c5c" : T.border}`, borderRadius: 8, color: form.scala ? "#e05c5c" : T.textMuted, fontSize: 14, fontWeight: 700, outline: "none", appearance: "none", cursor: "pointer" }}>
          <option value="">— nessuna —</option>
          {SCALE_OPTIONS.map(s => <option key={s} value={s}>Scala {s}</option>)}
        </select>
      </div>

      <StatoSelector value={form.stato} onChange={v => upd("stato", v)} />

      <div className="bottombar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", display: "flex", background: T.surface, borderTop: `1px solid ${T.border}`, padding: "14px 24px" }}>
        <button className="tap" onClick={onCancel} style={{ flex: 1, background: "none", border: "none", color: T.textMuted, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>CANCELLA</button>
        <button className="tap" onClick={onSave} style={{ flex: 1, background: "none", border: "none", color: T.accent, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>{saveLabel}</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = (civicoId) => ({ nome: "", cognome: "", telefono: "", vuoto: "", stato: "", risposto: "", risposto_data: null, interno: "", scala: "", civicoId });

function parseDataOra(str) {
  if (!str) return new Date(0);
  try {
    const [datePart, timePart] = str.split(" ");
    const [d, m, y] = datePart.split("/");
    return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T${timePart || "00:00:00"}`);
  } catch(e) { return new Date(0); }
}

function getLastAttivita(data, contattoId) {
  const atts = (data.attivita||[]).filter(a => a.contattoId === contattoId);
  if (!atts.length) return null;
  return atts.sort((a, b) => parseDataOra(b.dataOra) - parseDataOra(a.dataOra))[0];
}

function AttivitaData({ dataOra }) {
  if (!dataOra) return <span style={{ color: T.textDim, fontSize: 11 }}>—</span>;
  const date = parseDataOra(dataOra);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  const color = days >= 30 ? "#e05c5c" : days >= 15 ? "#f0a500" : T.textMuted;
  const bg = days >= 30 ? "rgba(224,92,92,0.15)" : days >= 15 ? "rgba(240,165,0,0.15)" : "transparent";
  const [d, m, y] = dataOra.split(" ")[0].split("/");
  return (
    <span style={{ fontSize: 11, color, background: bg, borderRadius: 4, padding: bg !== "transparent" ? "2px 6px" : "0", fontWeight: days >= 15 ? 700 : 400 }}>
      {`${d}/${m}/${y}`}
    </span>
  );
}

/* ─── CONTATTI SCREEN ───────────────────────────────────────────────────── */
function ContattiScreen({ data, setData, civico, via, onSelect, onBack, onUfficio, user, onReload, rispostoLog: rispostoLogProp }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM(civico?.id));
  const [confirmDel, setConfirmDel] = useState(null);
  const [attModal, setAttModal] = useState(null); // attività da visualizzare
  // Anti-spam risposto - use shared log if provided
  const localRispostoLog = useRef({});
  const rispostoLog = rispostoLogProp || localRispostoLog;
  const isUserAdmin = ADMIN_ROLES.includes(user.role);
  const [sortContatti, setSortContatti] = useState(""); // "" | "interno_asc" | "interno_desc" | "data_asc" | "data_desc"

  const contattiFiltered = (data.contatti||[])
    .filter(c => c.civicoId === civico?.id)
    .filter(c => !search || (c.nome+" "+c.cognome+" "+c.telefono).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortContatti === "interno_asc") return (parseInt(a.interno)||0) - (parseInt(b.interno)||0);
      if (sortContatti === "interno_desc") return (parseInt(b.interno)||0) - (parseInt(a.interno)||0);
      if (sortContatti === "data_asc") return parseDataOra(getLastAttivita({attivita: (data.attivita||[])}, a.id)?.dataOra) - parseDataOra(getLastAttivita({attivita: (data.attivita||[])}, b.id)?.dataOra);
      if (sortContatti === "data_desc") return parseDataOra(getLastAttivita({attivita: (data.attivita||[])}, b.id)?.dataOra) - parseDataOra(getLastAttivita({attivita: (data.attivita||[])}, a.id)?.dataOra);
      return 0;
    });
  const contatti = contattiFiltered;
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.nome.trim()) return;
    try {
      const body = { nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), telefono: form.telefono, risposto: form.risposto, risposto_data: form.risposto ? form.risposto_data : null, vuoto: form.vuoto, stato: form.stato, interno: form.interno, scala: form.scala, civico_id: civico?.id };
      const rows = await sbFetch("contatti", { method: "POST", body: JSON.stringify(body), token: user.token });
      const newId = rows[0]?.id || Date.now();
      const now = new Date();
      const fmt = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      const nuoveAttivita = [];
      if (form.risposto === "Y") {
        nuoveAttivita.push({ id: Date.now(), contattoId: newId, commento: "RISPOSTO", dataOra: fmt, utente: user?.nome || user?.email || "" });
        sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: "RISPOSTO", data_ora: fmt, utente: user?.nome || user?.email || "", contatto_id: newId }), token: user.token }).catch(console.error);
      } else if (form.risposto === "N") {
        nuoveAttivita.push({ id: Date.now(), contattoId: newId, commento: "NON RISPONDE", dataOra: fmt, utente: user?.nome || user?.email || "" });
        sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: "NON RISPONDE", data_ora: fmt, utente: user?.nome || user?.email || "", contatto_id: newId }), token: user.token }).catch(console.error);
      }
      setData(d => ({ ...d,
        contatti: [...(d.contatti||[]), { id: newId, ...form, nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), civicoId: civico?.id }],
        attivita: [...(d.attivita||[]), ...nuoveAttivita],
      }));
    } catch(e) {
      const tempId = Date.now();
      setData(d => ({ ...d, contatti: [...(d.contatti||[]), { id: tempId, ...form, nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), civicoId: civico?.id }] }));
    }
    setForm(EMPTY_FORM(civico?.id));
    setAdding(false);
  };

  const doDeleteContatto = (c) => {
    sbFetch(`attivita?contatto_id=eq.${c.id}`, { method: "DELETE", token: user.token, prefer: "return=minimal" }).catch(console.error);
    sbFetch(`contatti?id=eq.${c.id}`, { method: "DELETE", token: user.token, prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d,
      contatti: d.contatti.filter(x => x.id !== c.id),
      attivita: d.attivita.filter(x => x.contattoId !== c.id),
    }));
    setConfirmDel(null);
  };

  const handleRisposto = (c, nuovoStato) => {
    const log = rispostoLog.current[c.id] || {};
    const now = Date.now();
    const TEN_MIN = 10 * 60 * 1000;
    // Blocca se >= 2 click e < 10 min dal primo click
    if ((log.clickCount || 0) >= 2 && log.firstTime && (now - log.firstTime) < TEN_MIN) return;
    // Reset se passati 10 min
    if (log.firstTime && (now - log.firstTime) >= TEN_MIN) {
      rispostoLog.current[c.id] = { clickCount: 1, firstTime: now };
    } else {
      rispostoLog.current[c.id] = { clickCount: (log.clickCount || 0) + 1, firstTime: log.firstTime || now };
    }
    const nowDate = new Date();
    const fmt = `${nowDate.getDate()}/${nowDate.getMonth()+1}/${nowDate.getFullYear()} ${String(nowDate.getHours()).padStart(2,"0")}:${String(nowDate.getMinutes()).padStart(2,"0")}:${String(nowDate.getSeconds()).padStart(2,"0")}`;
    const rdIso = nowDate.toISOString();
    const commento = nuovoStato === "Y" ? "RISPOSTO" : "NON RISPONDE";
    sbFetch(`contatti?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify({ risposto: nuovoStato, risposto_data: rdIso }), token: user.token, prefer: "return=minimal" }).catch(console.error);
    sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento, data_ora: fmt, utente: user?.nome || user?.email || "", contatto_id: c.id }), token: user.token }).catch(console.error);
    setData(d => ({ ...d,
      contatti: d.contatti.map(x => x.id === c.id ? { ...x, risposto: nuovoStato, risposto_data: rdIso } : x),
      attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: c.id, commento, dataOra: fmt, utente: user?.nome || user?.email || "" }]
    }));
  };

  if (adding) return (
    <div style={{ minHeight: "100vh", background: T.bg }} className="screen">
      <TopBar title="NUOVO CONTATTO" onBack={() => setAdding(false)} />
      <div style={{ padding: "16px 18px" }}>
        <ContattoForm form={form} upd={upd} civici={via ? (data.civici||[]).filter(c => c.viaId === via.id) : [civico]} onSave={save} onCancel={() => setAdding(false)} saveLabel="SALVA" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={`CIVICO ${civico?.numero || ""}`} onBack={onBack}
        right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); if(onReload) onReload(); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nome, cognome, telefono..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}

      {/* Filtri ordinamento contatti */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginRight: 4 }}>ORDINA:</span>
        {[
          { v: "interno_asc",  label: "INT ↑" },
          { v: "interno_desc", label: "INT ↓" },
          { v: "data_asc",     label: "DATA ↑" },
          { v: "data_desc",    label: "DATA ↓" },
        ].map(f => (
          <button key={f.v} className="tap" onClick={() => setSortContatti(s => s === f.v ? "" : f.v)}
            style={{ background: sortContatti === f.v ? T.accentSoft : "none", border: `1px solid ${sortContatti === f.v ? T.accent : T.border}`, borderRadius: 6, padding: "4px 8px", color: sortContatti === f.v ? T.accent : T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>
            {f.label}
          </button>
        ))}
      </div>
      {/* COLONNE: NOME | TEL | INT | SC | RISP | ULT.ATT | STATO | VUOTO | DEL */}
      <TH cols={["NOME","TEL","INT","SC","RISP","ULT.ATT","STATO","VUOTO",""]} widths="1.1fr 0.9fr 0.45fr 0.45fr 0.9fr 0.9fr 0.9fr 0.8fr 0.4fr" />
      {contatti.map((c, i) => {
        const isBlocked = c.bloccato;
        const rowBg = isBlocked ? "#1a1a1a" : i % 2 === 0 ? T.row : T.rowAlt;
        const textColor = isBlocked ? "#444" : T.text;
        const lastAtt = getLastAttivita(data, c.id);
        return (
          <div key={c.id}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.45fr 0.45fr 0.9fr 0.9fr 0.9fr 0.8fr 0.4fr", alignItems: "center", background: rowBg, opacity: isBlocked ? 0.5 : 1 }}>
              {/* NOME */}
              <span className="tap" onClick={() => (!isBlocked || isUserAdmin) && onSelect(c)} style={{ padding: "10px 6px", fontSize: 12, fontWeight: 700, cursor: (isBlocked && !isUserAdmin) ? "default" : "pointer", color: isBlocked ? "#888" : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isBlocked && <ILock />} {c.nome}
              </span>
              {/* TEL */}
              <span style={{ padding: "10px 3px", fontSize: 10, color: isBlocked ? "#444" : T.textMuted, textAlign: "center" }}>{c.telefono}</span>
              {/* INT */}
              <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                {isBlocked
                  ? <span style={{ fontSize: 11, color: "#444", textAlign: "center" }}>{c.interno || "—"}</span>
                  : <select value={c.interno || ""} onChange={e => { e.stopPropagation(); setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === c.id ? { ...x, interno: e.target.value } : x) })); }}
                    style={{ background: c.interno ? "rgba(224,92,92,0.15)" : "#1e1e1e", border: `1px solid ${c.interno ? "#e05c5c" : "#2a2a2a"}`, borderRadius: 4, color: c.interno ? "#e05c5c" : "#555", fontSize: 10, fontWeight: 700, padding: "3px 1px", width: "100%", outline: "none", cursor: "pointer", textAlign: "center" }}>
                    <option value="">—</option>
                    {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                }
              </span>
              {/* SCALA */}
              <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                {isBlocked
                  ? <span style={{ fontSize: 11, color: "#444", textAlign: "center" }}>{c.scala || "—"}</span>
                  : <select value={c.scala || ""} onChange={e => { e.stopPropagation(); setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === c.id ? { ...x, scala: e.target.value } : x) })); }}
                    style={{ background: c.scala ? "rgba(224,92,92,0.15)" : "#1e1e1e", border: `1px solid ${c.scala ? "#e05c5c" : "#2a2a2a"}`, borderRadius: 4, color: c.scala ? "#e05c5c" : "#555", fontSize: 10, fontWeight: 700, padding: "3px 1px", width: "100%", outline: "none", cursor: "pointer", textAlign: "center" }}>
                    <option value="">—</option>
                    {SCALE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                }
              </span>
              {/* RISPOSTO */}
              <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }} onClick={e => e.stopPropagation()}>
                {isBlocked ? (
                  <span style={{ fontSize: 11, color: "#444" }}>{c.risposto === "Y" ? "✓" : c.risposto === "N" ? "✗" : "—"}</span>
                ) : (
                  <>
                    <button className="tap" onClick={() => handleRisposto(c, "Y")}
                      style={{ background: c.risposto === "Y" ? "rgba(76,175,80,0.2)" : "none", border: `2px solid ${c.risposto === "Y" ? "#4caf50" : "#333"}`, borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                      {c.risposto === "Y" && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <button className="tap" onClick={() => handleRisposto(c, "N")}
                      style={{ background: c.risposto === "N" ? "rgba(224,92,92,0.15)" : "none", border: `2px solid ${c.risposto === "N" ? "#e05c5c" : "#333"}`, borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                      {c.risposto === "N" && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#e05c5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    </button>
                  </>
                )}
              </span>
              {/* ULT. ATT - cliccabile */}
              <span className="tap" onClick={() => lastAtt && setAttModal(lastAtt)}
                style={{ padding: "10px 3px", display: "flex", justifyContent: "center", cursor: lastAtt ? "pointer" : "default" }}>
                <AttivitaData dataOra={lastAtt?.dataOra} />
              </span>
              {/* STATO */}
              <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                {isBlocked ? (
                  <span style={{ fontSize: 10, color: "#444" }}>{c.stato || "—"}</span>
                ) : (() => {
                  const sc = c.stato === "NOTIZIA" ? { color: "#e05c5c", bg: "rgba(224,92,92,0.15)", border: "#e05c5c" }
                    : c.stato === "INFORMAZIONE" ? { color: "#4fc3f7", bg: "rgba(79,195,247,0.15)", border: "#4fc3f7" }
                    : c.stato === "CONCORRENZA" ? { color: "#f0a500", bg: "rgba(240,165,0,0.15)", border: "#f0a500" }
                    : { color: "#555", bg: "#1e1e1e", border: "#2a2a2a" };
                  return (
                    <select value={c.stato || ""} onChange={e => { e.stopPropagation(); setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === c.id ? { ...x, stato: e.target.value } : x) })); }}
                      style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 4, color: sc.color, fontSize: 9, fontWeight: 700, padding: "3px 1px", width: "100%", outline: "none", cursor: "pointer", textAlign: "center" }}>
                      <option value="">—</option>
                      <option value="INFORMAZIONE">INFO</option>
                      <option value="NOTIZIA">NOTIZIA</option>
                      <option value="CONCORRENZA">CONC.</option>
                    </select>
                  );
                })()}
              </span>
              {/* VUOTO */}
              <span style={{ padding: "10px 3px", fontSize: 11, textAlign: "center", color: isBlocked ? "#444" : T.text }}>
                {c.vuoto === "Y" ? <span style={{color: isBlocked ? "#444" : "#4caf50", fontWeight: 700}}>VUOTO</span> : c.vuoto === "N" ? <span style={{color: isBlocked ? "#444" : "#e05c5c", fontWeight: 700}}>NO</span> : ""}
              </span>
              {/* DEL */}
              <span style={{ padding: "4px 2px", display: "flex", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                {!isBlocked && <button className="tap" onClick={() => setConfirmDel(c)}
                  style={{ background:"none", border:"none", color:T.accent, cursor:"pointer", padding:4, display:"flex" }}><ITrash /></button>}
              </span>
            </div>
            <HR />
          </div>
        );
      })}

      <FabPlus onClick={() => setAdding(true)} />
      <BottomBar onUfficio={onUfficio} />

      {/* Modal visualizza attività */}
      {attModal && <Modal title="ULTIMA ATTIVITÀ" onClose={() => setAttModal(null)}>
        <div style={{ background: T.surfaceHigh, borderRadius: 8, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 15, color: T.text, lineHeight: 1.6, wordBreak: "break-word" }}>{attModal.commento}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted }}>
          <span>📅 {attModal.dataOra}</span>
          <span>👤 {attModal.utente}</span>
        </div>
      </Modal>}

      {confirmDel && <Modal title="Elimina Contatto" onClose={() => setConfirmDel(null)}>
        <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Eliminare <b style={{color:T.text}}>{confirmDel.nome} {confirmDel.cognome}</b> e tutte le sue attività?</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="tap" onClick={() => setConfirmDel(null)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
          <button className="tap" onClick={() => doDeleteContatto(confirmDel)} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>ELIMINA</button>
        </div>
      </Modal>}
    </div>
  );
}

/* ─── CONTATTO SCREEN ───────────────────────────────────────────────────── */
function ContattoScreen({ data, setData, contatto: contattoInit, civico, onBack, onUfficio, user, onReload, rispostoLog: rispostoLogProp }) {
  const [modalAtt, setModalAtt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [commento, setCommento] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [editAttModal, setEditAttModal] = useState(null);
  const [editAttTesto, setEditAttTesto] = useState("");
  const [confirmDelAtt, setConfirmDelAtt] = useState(null);
  const [attDetailModal, setAttDetailModal] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(false);
  const localRispostoLog = useRef({});
  const rispostoLog = rispostoLogProp || localRispostoLog;

  const [editForm, setEditForm] = useState({
    nome: contattoInit.nome, cognome: contattoInit.cognome || "",
    telefono: contattoInit.telefono,
    vuoto: contattoInit.vuoto === "Y" ? "Y" : contattoInit.vuoto === "N" ? "N" : "",
    stato: contattoInit.stato || "",
    risposto: contattoInit.risposto === "Y" ? "Y" : contattoInit.risposto === "N" ? "N" : "",
    risposto_data: contattoInit.risposto_data || null,
    interno: contattoInit.interno || "",
    scala: contattoInit.scala || "",
    civicoId: contattoInit.civicoId,
  });

  const contatto = (data.contatti||[]).find(c => c.id === contattoInit.id) || contattoInit;
  const isBlocked = contatto.bloccato;
  const isAdmin = ADMIN_ROLES.includes(user.role);

  const attivita = (data.attivita||[]).filter(a => a.contattoId === contatto.id).sort((a, b) =>
    sortAsc ? parseDataOra(a.dataOra) - parseDataOra(b.dataOra) : parseDataOra(b.dataOra) - parseDataOra(a.dataOra)
  );

  const addAtt = async () => {
    if (!commento.trim()) return;
    const now = new Date();
    const fmt = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    try {
      await sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: commento.trim(), data_ora: fmt, utente: user?.nome || user?.email || "", contatto_id: contatto.id }), token: user.token });
    } catch(e) { console.error("addAtt error:", e); }
    setData(d => ({ ...d, attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: contatto.id, commento: commento.trim(), dataOra: fmt, utente: user.nome || user.email }] }));
    setCommento(""); setModalAtt(false);
  };

  const saveEditAtt = async () => {
    if (!editAttTesto.trim()) return;
    sbFetch(`attivita?id=eq.${editAttModal.id}`, { method: "PATCH", body: JSON.stringify({ commento: editAttTesto.trim() }), token: user.token, prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, attivita: d.attivita.map(a => a.id === editAttModal.id ? { ...a, commento: editAttTesto.trim() } : a) }));
    setEditAttModal(null);
  };

  const doDeleteAtt = (a) => {
    sbFetch(`attivita?id=eq.${a.id}`, { method: "DELETE", token: user.token, prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, attivita: d.attivita.filter(x => x.id !== a.id) }));
    setConfirmDelAtt(null);
  };

  const saveEdit = async () => {
    const updated = { ...contatto, ...editForm, nome: editForm.nome.toUpperCase(), cognome: editForm.cognome.toUpperCase() };
    try {
      await sbFetch(`contatti?id=eq.${updated.id}`, { method: "PATCH", body: JSON.stringify({ nome: updated.nome, cognome: updated.cognome, telefono: updated.telefono, risposto: updated.risposto, risposto_data: updated.risposto ? updated.risposto_data : null, vuoto: updated.vuoto, stato: updated.stato, interno: updated.interno, scala: updated.scala }), token: user.token, prefer: "return=minimal" });
    } catch(e) { console.error("Sync error", e); }
    setData(d => ({ ...d, contatti: d.contatti.map(c => c.id === updated.id ? updated : c) }));
    setEditing(false);
  };

  const doBlock = () => {
    sbFetch(`contatti?id=eq.${contatto.id}`, { method: "PATCH", body: JSON.stringify({ bloccato: true }), token: user.token, prefer: "return=minimal" }).catch(console.error);
    setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, bloccato: true } : x) }));
    setConfirmBlock(false);
  };

  const doUnblock = async () => {
    try {
      await sbFetch(`contatti?id=eq.${contatto.id}`, { method: "PATCH", body: JSON.stringify({ bloccato: false }), token: user.token, prefer: "return=minimal" });
    } catch(e) { console.error("unblock error:", e); }
    setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, bloccato: false } : x) }));
    setConfirmUnblock(false);
  };

  const handleRisposto = (nuovoStato) => {
    if (isBlocked) return;
    const log = rispostoLog.current[contatto.id] || {};
    const now = Date.now();
    const TEN_MIN = 10 * 60 * 1000;
    if ((log.clickCount || 0) >= 2 && log.firstTime && (now - log.firstTime) < TEN_MIN) return;
    if (log.firstTime && (now - log.firstTime) >= TEN_MIN) {
      rispostoLog.current[contatto.id] = { clickCount: 1, firstTime: now };
    } else {
      rispostoLog.current[contatto.id] = { clickCount: (log.clickCount || 0) + 1, firstTime: log.firstTime || now };
    }
    const nowDate = new Date();
    const fmt = `${nowDate.getDate()}/${nowDate.getMonth()+1}/${nowDate.getFullYear()} ${String(nowDate.getHours()).padStart(2,"0")}:${String(nowDate.getMinutes()).padStart(2,"0")}:${String(nowDate.getSeconds()).padStart(2,"0")}`;
    const rdIso = nowDate.toISOString();
    const commento2 = nuovoStato === "Y" ? "RISPOSTO" : "NON RISPONDE";
    sbFetch(`contatti?id=eq.${contatto.id}`, { method: "PATCH", body: JSON.stringify({ risposto: nuovoStato, risposto_data: rdIso }), token: user.token, prefer: "return=minimal" }).catch(console.error);
    sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: commento2, data_ora: fmt, utente: user?.nome || user?.email || "", contatto_id: contatto.id }), token: user.token }).catch(console.error);
    setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, risposto: nuovoStato, risposto_data: rdIso } : x), attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: contatto.id, commento: commento2, dataOra: fmt, utente: user?.nome || user?.email || "" }] }));
  };

  const updEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  if (editing && !isBlocked) return (
    <div style={{ minHeight: "100vh", background: T.bg }} className="screen">
      <TopBar title="MODIFICA CONTATTO" onBack={() => setEditing(false)} />
      <div style={{ padding: "16px 18px" }}>
        <ContattoForm form={editForm} upd={updEdit} civici={civico ? [civico] : []} onSave={saveEdit} onCancel={() => setEditing(false)} saveLabel="SALVA" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={contatto.nome} onBack={onBack}
        right={<>
          {!isBlocked && <button className="tap" onClick={() => setEditing(true)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", display:"flex", padding:4 }}><IEditPen /></button>}
          <RefreshBtn onRefresh={() => { if(onReload) onReload(); }} />
        </>} />

      {/* Banner bloccato */}
      {isBlocked && (
        <div style={{ background: "#2a1a1a", border: "1px solid #5a2a2a", margin: "12px 18px", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <ILock />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05c5c", letterSpacing: 1 }}>CONTATTO DA NON FARE</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Questo contatto è bloccato e non può essere modificato</div>
          </div>
          {isAdmin && <button className="tap" onClick={() => setConfirmUnblock(true)} style={{ background: "none", border: `1px solid #555`, borderRadius: 6, padding: "6px 10px", color: "#888", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>SBLOCCA</button>}
        </div>
      )}

      <div style={{ padding: "14px 18px", opacity: isBlocked ? 0.5 : 1 }}>
        {[
          ["NOME", contatto.nome],
          ["COGNOME", contatto.cognome],
          ["CIVICO", civico?.numero],
          ["TELEFONO", contatto.telefono],
          ["SCALA", contatto.scala ? `SCALA ${contatto.scala}` : "—"],
          ["VUOTO", contatto.vuoto === "Y" ? "SI" : contatto.vuoto === "N" ? "NO" : "—"],
          ["STATO", contatto.stato, false, contatto.stato === "NOTIZIA" ? "#e05c5c" : contatto.stato === "INFORMAZIONE" ? "#4fc3f7" : contatto.stato === "CONCORRENZA" ? "#f0a500" : T.text],
        ].map(([label, value, arrow, customColor]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
            <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
              color: customColor || (label === "VUOTO" ? (contatto.vuoto === "Y" ? T.green : contatto.vuoto === "N" ? T.accent : T.textMuted) : T.text) }}>
              {value || "—"}
            </span>
          </div>
        ))}

        {/* INTERNO */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>INTERNO</div>
          {isBlocked
            ? <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 18, color: T.textMuted }}>{contatto.interno ? `Interno ${contatto.interno}` : "—"}</span>
            : <select value={contatto.interno || ""} onChange={e => setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, interno: e.target.value } : x) }))}
                style={{ background: contatto.interno ? "rgba(224,92,92,0.1)" : "#1e1e1e", border: `1px solid ${contatto.interno ? "#e05c5c" : "#2a2a2a"}`, borderRadius: 8, color: contatto.interno ? "#e05c5c" : "#555", fontSize: 16, fontWeight: 700, padding: "10px 14px", width: "100%", outline: "none", cursor: "pointer" }}>
                <option value="">— nessuno —</option>
                {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>Interno {n}</option>)}
              </select>
          }
        </div>

        {/* RISPOSTO */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>RISPOSTO</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="tap" onClick={() => handleRisposto("Y")} disabled={isBlocked}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 10, cursor: isBlocked ? "default" : "pointer", border: `2px solid ${contatto.risposto === "Y" ? "#4caf50" : "#2a2a2a"}`, background: contatto.risposto === "Y" ? "rgba(76,175,80,0.15)" : "transparent" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, border: `2px solid ${contatto.risposto === "Y" ? "#4caf50" : "#444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {contatto.risposto === "Y" && <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16, color: contatto.risposto === "Y" ? "#4caf50" : T.textMuted }}>RISPOSTO</span>
            </button>
            <button className="tap" onClick={() => handleRisposto("N")} disabled={isBlocked}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 10, cursor: isBlocked ? "default" : "pointer", border: `2px solid ${contatto.risposto === "N" ? "#e05c5c" : "#2a2a2a"}`, background: contatto.risposto === "N" ? "rgba(224,92,92,0.15)" : "transparent" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, border: `2px solid ${contatto.risposto === "N" ? "#e05c5c" : "#444"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {contatto.risposto === "N" && <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e05c5c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16, color: contatto.risposto === "N" ? "#e05c5c" : T.textMuted }}>NON RISPONDE</span>
            </button>
          </div>
          {contatto.risposto_data && <div style={{ fontSize: 10, color: T.textDim, marginTop: 6, textAlign: "right" }}>
            aggiornato {new Date(contatto.risposto_data).toLocaleDateString("it-IT")} · scade {new Date(new Date(contatto.risposto_data).getTime() + 60*24*60*60*1000).toLocaleDateString("it-IT")}
          </div>}
        </div>

        {/* CONTATTO DA NON FARE */}
        {!isBlocked && (
          <div style={{ marginBottom: 14 }}>
            <HR />
            <div style={{ marginTop: 14 }}>
              <button className="tap" onClick={() => setConfirmBlock(true)}
                style={{ width: "100%", padding: "12px", background: "rgba(224,92,92,0.08)", border: `1px solid rgba(224,92,92,0.3)`, borderRadius: 8, color: "#e05c5c", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ILock /> CONTATTO DA NON FARE
              </button>
            </div>
          </div>
        )}
      </div>

      <HR />
      {/* ATTIVITÀ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 7px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>ATTIVITÀ</span>
          <span style={{ background: T.surfaceHigh, color: T.text, borderRadius: 4, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{attivita.length}</span>
        </div>
        <button className="tap" onClick={() => setSortAsc(s => !s)}
          style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
          {sortAsc ? "DATA ↑" : "DATA ↓"}
        </button>
      </div>
      <HR />
      <TH cols={["COMMENTO", "DATA E ORA", "UTENTE", ""]} widths="1.6fr 1.1fr 0.9fr 0.6fr" />
      {attivita.map((a, i) => (
        <div key={a.id}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 0.9fr 0.6fr", alignItems: "center", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span className="tap" onClick={() => setAttDetailModal(a)} style={{ padding: "12px 10px", fontSize: 13, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.commento}</span>
            <span style={{ padding: "12px 6px", fontSize: 11, color: T.textMuted }}>{a.dataOra}</span>
            <span style={{ padding: "12px 6px", fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.utente}</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!isBlocked && <>
                <button className="tap" onClick={() => { setEditAttModal(a); setEditAttTesto(a.commento); }}
                  style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", padding:4, display:"flex" }}><IEditPen /></button>
                <button className="tap" onClick={() => setConfirmDelAtt(a)}
                  style={{ background:"none", border:"none", color:T.accent, cursor:"pointer", padding:4, display:"flex" }}><ITrash /></button>
              </>}
            </div>
          </div>
          <HR />
        </div>
      ))}
      {!isBlocked && <ActionRow onAdd={() => setModalAtt(true)} />}

      {!isBlocked && (
        <button className="tap fab-edit" onClick={() => setEditing(true)}
          style={{ position: "fixed", bottom: 72, left: 18, width: 50, height: 50, borderRadius: "50%", background: T.surfaceHigh, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, zIndex: 99 }}>
          <IEditPen />
        </button>
      )}
      <BottomBar onUfficio={onUfficio} />

      {/* Modal dettaglio attività */}
      {attDetailModal && <Modal title="DETTAGLIO ATTIVITÀ" onClose={() => setAttDetailModal(null)}>
        <div style={{ background: T.surfaceHigh, borderRadius: 8, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 15, color: T.text, lineHeight: 1.7, wordBreak: "break-word" }}>{attDetailModal.commento}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted }}>
          <span>📅 {attDetailModal.dataOra}</span>
          <span>👤 {attDetailModal.utente}</span>
        </div>
      </Modal>}

      {modalAtt && <Modal title="Nuova Attività" onClose={() => setModalAtt(false)}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>COMMENTO</div>
          <textarea value={commento} onChange={e => setCommento(e.target.value)} placeholder="Inserisci nota..." rows={4}
            style={{ width: "100%", padding: "10px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'Barlow', sans-serif" }} />
        </div>
        <div style={{ padding: "8px 12px", background: T.surfaceHigh, borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.textMuted }}>👤 {user.nome || user.email}</div>
        <PrimaryBtn label="SALVA ATTIVITÀ" onClick={addAtt} />
      </Modal>}

      {editAttModal && <Modal title="Modifica Attività" onClose={() => setEditAttModal(null)}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>COMMENTO</div>
          <textarea value={editAttTesto} onChange={e => setEditAttTesto(e.target.value)} rows={4}
            style={{ width: "100%", padding: "10px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'Barlow', sans-serif" }} />
        </div>
        <PrimaryBtn label="SALVA" onClick={saveEditAtt} />
      </Modal>}

      {confirmDelAtt && <Modal title="Elimina Attività" onClose={() => setConfirmDelAtt(null)}>
        <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Eliminare l'attività <b style={{color:T.text}}>"{confirmDelAtt.commento}"</b>?</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="tap" onClick={() => setConfirmDelAtt(null)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
          <button className="tap" onClick={() => doDeleteAtt(confirmDelAtt)} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>ELIMINA</button>
        </div>
      </Modal>}

      {confirmBlock && <Modal title="Contatto da non fare" onClose={() => setConfirmBlock(false)}>
        <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Stai per bloccare <b style={{color:T.text}}>{contatto.nome} {contatto.cognome}</b>. Il contatto diventerà grigio e non potrà più essere modificato. Solo un admin potrà sbloccarlo. Continuare?</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="tap" onClick={() => setConfirmBlock(false)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
          <button className="tap" onClick={doBlock} style={{ flex:1, padding:"12px", background:T.accent, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>BLOCCA</button>
        </div>
      </Modal>}

      {confirmUnblock && isAdmin && <Modal title="Sblocca contatto" onClose={() => setConfirmUnblock(false)}>
        <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Sbloccare <b style={{color:T.text}}>{contatto.nome} {contatto.cognome}</b> e renderlo nuovamente modificabile?</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="tap" onClick={() => setConfirmUnblock(false)} style={{ flex:1, padding:"12px", background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>ANNULLA</button>
          <button className="tap" onClick={doUnblock} style={{ flex:1, padding:"12px", background:T.green, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>SBLOCCA</button>
        </div>
      </Modal>}
    </div>
  );
}

/* ─── ERROR BOUNDARY ─────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error("App error:", e, info); }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:"100vh", background:"#121212", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:16 }}>
        <div style={{ color:"#e05c5c", fontFamily:"Arial", fontWeight:900, fontSize:22 }}>Errore</div>
        <div style={{ color:"#888", fontSize:13, textAlign:"center", maxWidth:300 }}>{this.state.error.message}</div>
        <button onClick={() => { this.setState({error:null}); window.location.reload(); }}
          style={{ background:"#e05c5c", color:"#fff", border:"none", borderRadius:8, padding:"12px 24px", fontWeight:700, fontSize:14, cursor:"pointer" }}>
          RICARICA APP
        </button>
      </div>
    );
    return this.props.children;
  }
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_STATE);
  const [dbLoaded, setDbLoaded] = useState(false);

  const loadData = async (token) => {
    try {
      const [uffici, zone, vie, civici, contatti, attivita] = await Promise.all([
        sbFetch("uffici?select=*&order=id", { token }),
        sbFetch("zone?select=*&order=id", { token }),
        sbFetch("vie?select=*&order=id", { token }),
        sbFetch("civici?select=*&order=id", { token }),
        sbFetch("contatti?select=*&order=id", { token }),
        sbFetch("attivita?select=*&order=id", { token }),
      ]);
      setData({
        uffici: uffici.map(u => ({ id: u.id, nome: u.nome })),
        zone: zone.map(z => ({ id: z.id, nome: z.nome, ufficioId: z.ufficio_id })),
        vie: vie.map(v => ({ id: v.id, nome: v.nome, zonaId: v.zona_id })),
        civici: civici.map(c => ({ id: c.id, numero: c.numero, viaId: c.via_id })),
        contatti: contatti.map(c => {
          const rd = c.risposto_data ? new Date(c.risposto_data) : null;
          const expired = rd && (new Date() - rd) > 60 * 24 * 60 * 60 * 1000;
          return {
            id: c.id, nome: c.nome, cognome: c.cognome, telefono: c.telefono,
            risposto: expired ? "" : (c.risposto||""),
            risposto_data: expired ? null : (c.risposto_data||null),
            vuoto: c.vuoto||"", stato: c.stato||"", interno: c.interno||"",
            scala: c.scala||"", bloccato: c.bloccato||false,
            civicoId: c.civico_id
          };
        }),
        attivita: attivita.map(a => ({ id: a.id, commento: a.commento, dataOra: a.data_ora, utente: a.utente, contattoId: a.contatto_id })),
      });
      setDbLoaded(true);
    } catch(e) {
      console.error("Errore caricamento dati:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData(user.token);
    // Polling ogni 5 secondi
    const interval = setInterval(() => loadData(user.token), 5000);
    return () => clearInterval(interval);
  }, [user]);

  const [nav, setNav] = useState([]);
  const push = (screen, payload) => setNav(n => [...n, { screen, payload }]);
  const pop  = () => setNav(n => n.slice(0, -1));
  const home = () => setNav([]);
  const cur = nav[nav.length - 1];
  // Shared risposto log across all screens
  const sharedRispostoLog = useRef({});

  if (!user) return <><style>{css}</style><ErrorBoundary><LoginScreen onLogin={setUser} /></ErrorBoundary></>;

  return (
    <ErrorBoundary>
      <div className="app-container">
        <style>{css}</style>
        {!cur && <UfficiScreen data={data} user={user} onLogout={() => setUser(null)} onSelect={u => push("zone", { ufficio: u })} />}
        {cur?.screen === "zone"     && <ZoneScreen     data={data} setData={setData} user={user} ufficio={cur.payload.ufficio} onBack={pop} onUfficio={home} onReload={() => loadData(user.token)} onSelect={z => push("vie", { zona: z, ufficio: cur.payload.ufficio })} />}
        {cur?.screen === "vie"      && <VieScreen      data={data} setData={setData} zona={cur.payload.zona} onBack={pop} onUfficio={home} onReload={() => loadData(user.token)} onSelect={v => push("civici", { via: v, zona: cur.payload.zona })} />}
        {cur?.screen === "civici"   && <CiviciScreen   data={data} setData={setData} via={cur.payload.via} zona={cur.payload.zona} onBack={pop} onUfficio={home} onReload={() => loadData(user.token)} onSelect={c => push("contatti", { civico: c, via: cur.payload.via })} />}
        {cur?.screen === "contatti" && <ContattiScreen data={data} setData={setData} civico={cur.payload.civico} via={cur.payload.via} onBack={pop} onUfficio={home} user={user} onReload={() => loadData(user.token)} rispostoLog={sharedRispostoLog} onSelect={c => push("contatto", { contatto: c, civico: cur.payload.civico })} />}
        {cur?.screen === "contatto" && <ContattoScreen data={data} setData={setData} contatto={cur.payload.contatto} civico={cur.payload.civico} onBack={pop} onUfficio={home} user={user} onReload={() => loadData(user.token)} rispostoLog={sharedRispostoLog} />}
      </div>
    </ErrorBoundary>
  );
}
