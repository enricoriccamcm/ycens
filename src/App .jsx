import { useState, useEffect } from "react";

/* ─── SUPABASE CONFIG ───────────────────────────────────────────────────── */
const SUPABASE_URL = "https://qwadyehjzkuwsirlgeye.supabase.co";
const SUPABASE_KEY = "sb_publishable_PAFzxLz4YBi5pT_CBIdJow_i9oxBwUT";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${options.token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {})
    },
    ...options
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


/* ─── MOCK DATA (fallback) ──────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: 1, email: "admin@agenzia.it", password: "admin123", role: "admin", name: "Marco Rossi", ufficioId: null },
  { id: 2, email: "laura@agenzia.it", password: "agente123", role: "agente", name: "Laura Bianchi", ufficioId: 1 },
  { id: 3, email: "davide@agenzia.it", password: "agente123", role: "agente", name: "Davide Verdi", ufficioId: 2 },
];

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
    { id: 1, nome: "ENRICO", cognome: "RICCA", telefono: "333666555444", risposto: "Y", stato: "INFORMAZIONE", vuoto: "", interno: "", civicoId: 1 },
    { id: 2, nome: "GIALLI", cognome: "", telefono: "33333222222", risposto: "Y", stato: "", vuoto: "Y", interno: "", civicoId: 1 },
    { id: 3, nome: "BLU", cognome: "", telefono: "444444444", risposto: "", stato: "", vuoto: "", interno: "", civicoId: 1 },
  ],
  attivita: [
    { id: 1, contattoId: 1, commento: "Emiliano gnegnegne", dataOra: "4/3/2026 13:11:47", utente: "enricoriccamcm@gmail.com" },
    { id: 2, contattoId: 1, commento: "nv", dataOra: "18/2/2026 14:24:16", utente: "enricoriccamcm@gmail.com" },
    { id: 3, contattoId: 1, commento: "NON VENDE", dataOra: "17/2/2026 13:22:23", utente: "enricoriccamcm@gmail.com" },
  ],
  nextId: { zone: 6, vie: 4, civici: 4, contatti: 4, attivita: 4 },
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
const IDots    = () => <Svg d={["M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z","M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z","M12 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"]} fill="currentColor" sw={0} />;
const IArrow   = () => <Svg d="M9 18l6-6-6-6" />;
const IUfficio = () => <Svg d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />;
const INotizie = () => <Svg d={["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]} />;
const ILogout  = () => <Svg d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const IX       = () => <Svg d={["M18 6L6 18","M6 6l12 12"]} />;

/* ─── LOGO ───────────────────────────────────────────────────────────────── */
// Logo: two overlapping diamonds using polygon points for precision
const LogoMark = ({ size = 40 }) => {
  // Draw diamonds as polygons: top, right, bottom, left points
  // Grey diamond centered at (cx1, cy), Red diamond centered at (cx2, cy)
  const h = size;           // total height
  const r = h * 0.50;       // half-diagonal of each diamond
  const cy = h / 2;
  const cx1 = r;            // grey center x
  const cx2 = r * 1.55;     // red center x (overlapping)
  const w = cx2 + r;        // total width
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
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 14px", gap: 10 }}>
        {onBack
          ? <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", padding: "4px 6px 4px 0", display: "flex" }}><IBack /></button>
          : <Logo />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle && <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 1 }}>{subtitle}</div>}
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: subtitle ? 16 : 15, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: T.textMuted }}>
          {right}
          {onLogout && <button className="tap" onClick={onLogout} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><ILogout /></button>}
        </div>
      </div>
    </div>
  );
}

function BottomBar({ active, onUfficio }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 100 }}>
      <button className="tap" onClick={onUfficio}
        style={{ flex: 1, background: "none", border: "none", color: T.accent, cursor: "pointer", padding: "9px 0 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
        <IUfficio />
        UFFICIO
        <div style={{ width: 28, height: 2, background: T.accent, borderRadius: 1 }} />
      </button>
    </div>
  );
}

function FAB({ onClick }) {
  return (
    <button className="tap" onClick={onClick}
      style={{ position: "fixed", bottom: 72, right: 18, width: 50, height: 50, borderRadius: "50%", background: T.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 18px rgba(224,92,92,0.45)", zIndex: 99 }}>
      <IEditPen />
    </button>
  );
}

function FabPlus({ onClick }) {
  return (
    <button className="tap" onClick={onClick}
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
      <div style={{ background: T.surface, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px", animation: "slideUp 0.22s ease", borderTop: `1px solid ${T.border}` }}>
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
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
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
    {cols.map(c => <span key={c} style={{ padding: "9px 6px", fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, whiteSpace: "nowrap", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>{c}</span>)}
  </div>
);

const ActionRow = ({ onAdd }) => (
  <div style={{ padding: "11px 16px", display: "flex", justifyContent: "flex-end", gap: 20 }}>
    <button className="tap" style={{ background: "none", border: "none", color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>VISUALIZZA</button>
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
      // Load profile
      const profiles = await sbFetch(`profili?id=eq.${auth.user.id}`, { token });
      const profile = profiles[0] || {};
      onLogin({ 
        id: auth.user.id, 
        email: auth.user.email, 
        role: profile.role || "agente", 
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
  const uffici = user.role === "admin" ? data.uffici : data.uffici.filter(u => u.id === user.ufficioId);
  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 80, position: "relative", overflow: "hidden" }} className="screen">
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.055, pointerEvents: "none", zIndex: 0 }} viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="180" x2="400" y2="220" stroke="white" strokeWidth="6"/>
        <line x1="0" y1="420" x2="400" y2="390" stroke="white" strokeWidth="5"/>
        <line x1="0" y1="650" x2="400" y2="680" stroke="white" strokeWidth="4"/>
        <line x1="120" y1="0" x2="100" y2="900" stroke="white" strokeWidth="6"/>
        <line x1="300" y1="0" x2="280" y2="900" stroke="white" strokeWidth="5"/>
        <line x1="0" y1="80" x2="400" y2="110" stroke="white" strokeWidth="2.5"/>
        <line x1="0" y1="290" x2="400" y2="310" stroke="white" strokeWidth="2.5"/>
        <line x1="0" y1="520" x2="400" y2="500" stroke="white" strokeWidth="2.5"/>
        <line x1="0" y1="760" x2="400" y2="780" stroke="white" strokeWidth="2.5"/>
        <line x1="60" y1="0" x2="40" y2="900" stroke="white" strokeWidth="2.5"/>
        <line x1="200" y1="0" x2="185" y2="900" stroke="white" strokeWidth="2.5"/>
        <line x1="360" y1="0" x2="345" y2="900" stroke="white" strokeWidth="2.5"/>
        <line x1="0" y1="0" x2="250" y2="900" stroke="white" strokeWidth="2"/>
        <line x1="400" y1="100" x2="150" y2="900" stroke="white" strokeWidth="2"/>
        <line x1="0" y1="400" x2="400" y2="600" stroke="white" strokeWidth="1.5"/>
        <line x1="0" y1="700" x2="300" y2="200" stroke="white" strokeWidth="1.5"/>
        <line x1="0" y1="140" x2="400" y2="160" stroke="white" strokeWidth="1"/>
        <line x1="0" y1="350" x2="400" y2="365" stroke="white" strokeWidth="1"/>
        <line x1="0" y1="460" x2="400" y2="450" stroke="white" strokeWidth="1"/>
        <line x1="0" y1="580" x2="400" y2="570" stroke="white" strokeWidth="1"/>
        <line x1="0" y1="820" x2="400" y2="840" stroke="white" strokeWidth="1"/>
        <line x1="170" y1="0" x2="155" y2="900" stroke="white" strokeWidth="1"/>
        <line x1="240" y1="0" x2="225" y2="900" stroke="white" strokeWidth="1"/>
        <rect x="140" y="240" width="45" height="30" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="195" y="240" width="35" height="30" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="140" y="340" width="55" height="35" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="305" y="130" width="40" height="25" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="305" y="165" width="40" height="25" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="20" y="480" width="35" height="30" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="62" y="480" width="45" height="30" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="20" y="550" width="50" height="35" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="200" y="600" width="60" height="40" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="315" y="480" width="45" height="55" fill="none" stroke="white" strokeWidth="1"/>
      </svg>
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <LogoFull height={28} />
        <button onClick={onLogout} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><ILogout /></button>
      </div>

      {/* User greeting */}
      <div style={{ padding: "20px 18px 10px" }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Benvenuto</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>{user.email.split("@")[0].toUpperCase()}</div>
        <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{user.role === "admin" ? "● Amministratore" : "● Agente"}</div>
      </div>

      <HR />

      {/* Section label */}
      <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>SELEZIONA UFFICIO</div>
        <div style={{ background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 700, color: T.textMuted }}>{uffici.length}</div>
      </div>

      {/* Uffici cards */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {uffici.map((u) => (
          <div key={u.id} className="tap" onClick={() => onSelect(u)}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={1.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>{u.nome}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                  {data.zone.filter(z => z.ufficioId === u.id).length} zone · {data.vie.filter(v => data.zone.filter(z => z.ufficioId === u.id).map(z => z.id).includes(v.zonaId)).length} vie
                </div>
              </div>
            </div>
            <span style={{ color: T.accent }}><IArrow /></span>
          </div>
        ))}
      </div>
      {/* Frase motivazionale con mappa sfondo */}
      <div style={{ margin: "28px 0 0", borderTop: `1px solid ${T.border}`, position: "relative", overflow: "hidden", paddingBottom: 80 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="60" x2="400" y2="80" stroke="white" strokeWidth="5"/>
          <line x1="0" y1="150" x2="400" y2="140" stroke="white" strokeWidth="4"/>
          <line x1="0" y1="240" x2="400" y2="255" stroke="white" strokeWidth="3"/>
          <line x1="100" y1="0" x2="90" y2="300" stroke="white" strokeWidth="5"/>
          <line x1="270" y1="0" x2="255" y2="300" stroke="white" strokeWidth="4"/>
          <line x1="0" y1="25" x2="400" y2="35" stroke="white" strokeWidth="1.5"/>
          <line x1="0" y1="100" x2="400" y2="110" stroke="white" strokeWidth="1.5"/>
          <line x1="0" y1="195" x2="400" y2="185" stroke="white" strokeWidth="1.5"/>
          <line x1="0" y1="275" x2="400" y2="285" stroke="white" strokeWidth="1.5"/>
          <line x1="45" y1="0" x2="35" y2="300" stroke="white" strokeWidth="1.5"/>
          <line x1="175" y1="0" x2="165" y2="300" stroke="white" strokeWidth="1.5"/>
          <line x1="340" y1="0" x2="330" y2="300" stroke="white" strokeWidth="1.5"/>
          <line x1="0" y1="0" x2="200" y2="300" stroke="white" strokeWidth="1.5"/>
          <line x1="400" y1="50" x2="150" y2="300" stroke="white" strokeWidth="1.5"/>
          <rect x="110" y="90" width="40" height="28" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="158" y="90" width="30" height="28" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="110" y="165" width="50" height="30" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="280" y="50" width="35" height="22" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="280" y="80" width="35" height="22" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="15" y="170" width="30" height="26" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="52" y="170" width="38" height="26" fill="none" stroke="white" strokeWidth="1"/>
        </svg>
        <div style={{ position: "relative", zIndex: 1, padding: "24px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textMuted, fontStyle: "italic", lineHeight: 1.7, letterSpacing: 0.2 }}>
            "Il miglior immobile da vendere è quello che<br/>ancora nessuno sa che è in vendita."
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.accent, fontFamily: "'Barlow Condensed'", fontWeight: 700, letterSpacing: 2 }}>— E.R.</div>
        </div>
      </div>
      </div>
      <BottomBar active="ufficio" onUfficio={() => {}} />
    </div>
  );
}

function ZoneScreen({ data, setData, ufficio, onSelect, onBack, onUfficio }) {
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const zone = data.zone.filter(z => z.ufficioId === ufficio.id).filter(z => !search || z.nome.toLowerCase().includes(search.toLowerCase()));
  const vieCount = id => data.vie.filter(v => v.zonaId === id).length;
  const add = () => {
    if (!nome.trim()) return;
    setData(d => ({ ...d, zone: [...d.zone, { id: Date.now(), nome: nome.trim().toUpperCase(), ufficioId: ufficio.id }] }));
    setNome(""); setModal(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={ufficio.nome} subtitle="UFFICIO DI" onBack={onBack} right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); setRefreshKey(k=>k+1); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca zona..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <SectionTag label="ZONA" count={zone.length} />
      <HR />
      <TH cols={["NOME ZONA", "VIE"]} widths="1fr 1fr" />
      {zone.map((z, i) => (
        <div key={z.id}>
          <div className="tap" onClick={() => onSelect(z)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", cursor: "pointer", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span style={{ padding: "14px 10px", fontSize: 14, fontWeight: 600, textAlign: "center" }}>{z.nome}</span>
            <div style={{ padding: "14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <span style={{
                  background: vieCount(z.id) > 0 ? "rgba(255,255,255,0.07)" : "#1e1e1e",
                  border: `1px solid ${vieCount(z.id) > 0 ? "rgba(255,255,255,0.15)" : "#2a2a2a"}`,
                  color: vieCount(z.id) > 0 ? "#aaa" : "#444",
                  borderRadius: 20, padding: "4px 16px",
                  fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
                  minWidth: 36, textAlign: "center", display: "inline-block"
                }}>{vieCount(z.id) || "—"}</span>
              </span>
              <span style={{ color: T.textDim }}><IArrow /></span>
            </div>
          </div>
          <HR />
        </div>
      ))}
      <ActionRow onAdd={() => setModal(true)} />
      <BottomBar active="ufficio" onUfficio={onUfficio} />
      {modal && <Modal title="Nuova Zona" onClose={() => setModal(false)}>
        <FInput label="Nome Zona" value={nome} onChange={setNome} placeholder="es. ACILIA C" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}
    </div>
  );
}

function VieScreen({ data, setData, zona, onSelect, onBack, onUfficio }) {
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const vie = data.vie.filter(v => v.zonaId === zona.id).filter(v => !search || v.nome.toLowerCase().includes(search.toLowerCase()));
  const add = () => {
    if (!nome.trim()) return;
    setData(d => ({ ...d, vie: [...d.vie, { id: Date.now(), nome: nome.trim().toUpperCase(), zonaId: zona.id }] }));
    setNome(""); setModal(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={zona.nome} subtitle="NOME ZONA" onBack={onBack} right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); setRefreshKey(k=>k+1); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca via..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <SectionTag label="VIE" count={vie.length} />
      <HR />
      <TH cols={["NOME VIA", "ZONA"]} widths="1fr 1fr" />
      {vie.map((v, i) => (
        <div key={v.id}>
          <div className="tap" onClick={() => onSelect(v)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", cursor: "pointer", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span style={{ padding: "14px 10px", fontSize: 14, fontWeight: 600, textAlign: "center" }}>{v.nome}</span>
            <div style={{ padding: "14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: T.textMuted, textAlign: "center", width: "100%" }}>{zona.nome}</span>
              <span style={{ color: T.textDim }}><IArrow /></span>
            </div>
          </div>
          <HR />
        </div>
      ))}
      <ActionRow onAdd={() => setModal(true)} />
      <FAB onClick={() => setModal(true)} />
      <BottomBar active="ufficio" onUfficio={onUfficio} />
      {modal && <Modal title="Nuova Via" onClose={() => setModal(false)}>
        <FInput label="Nome Via" value={nome} onChange={setNome} placeholder="es. VIA DI SAPONARA" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}
    </div>
  );
}

function CiviciScreen({ data, setData, via, zona, onSelect, onBack, onUfficio }) {
  const [modal, setModal] = useState(false);
  const [numero, setNumero] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const civici = data.civici.filter(c => c.viaId === via.id).filter(c => !search || c.numero.toLowerCase().includes(search.toLowerCase()));
  const contattiStats = id => {
    const tutti = data.contatti.filter(c => c.civicoId === id);
    const risposto = tutti.filter(c => c.risposto === "Y").length;
    return { totale: tutti.length, risposto };
  };
  const add = () => {
    if (!numero.trim()) return;
    setData(d => ({ ...d, civici: [...d.civici, { id: Date.now(), numero: numero.trim(), viaId: via.id }] }));
    setNumero(""); setModal(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={via.nome} subtitle="NOME VIA" onBack={onBack} right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); setRefreshKey(k=>k+1); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca civico..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <div style={{ padding: "12px 16px 6px" }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ZONA</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>{zona.nome}</span>
        </div>
      </div>
      <HR />
      <SectionTag label="CIVICI" count={civici.length} />
      <HR />
      <TH cols={["NUMERO CIVICO", "VIA", "RISP."]} widths="1fr 1.6fr 1fr" />
      {civici.map((c, i) => (
        <div key={c.id}>
          <div className="tap" onClick={() => onSelect(c)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", alignItems: "center", cursor: "pointer", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span style={{ padding: "13px 10px", fontSize: 14, fontWeight: 700, textAlign: "center" }}>{c.numero}</span>
            <span style={{ padding: "13px 10px", fontSize: 12, color: T.textMuted, textAlign: "center" }}>{via.nome}</span>
            {(() => {
              const { totale, risposto } = contattiStats(c.id);
              const pieno = totale > 0 && risposto === totale;
              const nessuno = totale === 0;
              return (
                <span style={{
                  padding: "5px 10px",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: pieno ? "rgba(76,175,80,0.15)" : nessuno ? "transparent" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${pieno ? "#4caf50" : nessuno ? "#2a2a2a" : "#333"}`,
                    borderRadius: 6, padding: "4px 10px",
                    fontSize: 12, fontWeight: 700,
                    color: pieno ? "#4caf50" : nessuno ? "#444" : T.textMuted,
                    minWidth: 60, justifyContent: "center"
                  }}>
                    {nessuno
                      ? <span style={{fontSize:11}}>—</span>
                      : <>{pieno && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        <span>{risposto}</span>
                        <span style={{color:"#444", fontWeight:400}}>/</span>
                        <span>{totale}</span>
                      </>
                    }
                  </span>
                  <span style={{ color: T.textDim }}><IArrow /></span>
                </span>
              );
            })()}
          </div>
          <HR />
        </div>
      ))}
      <ActionRow onAdd={() => setModal(true)} />
      <FAB onClick={() => setModal(true)} />
      <BottomBar active="ufficio" onUfficio={onUfficio} />
      {modal && <Modal title="Nuovo Civico" onClose={() => setModal(false)}>
        <FInput label="Numero Civico" value={numero} onChange={setNumero} placeholder="es. 19" />
        <PrimaryBtn label="AGGIUNGI" onClick={add} />
      </Modal>}
    </div>
  );
}

/* ── Shared contatto form (add & edit) ───────────────────────────────────── */
function SiNoSelector({ label, value, onChange }) {
  const opts = [
    { v: "Y", label: "SI",  color: T.green,   activeBg: "rgba(76,175,80,0.2)" },
    { v: "N", label: "NO",  color: T.accent,  activeBg: T.accentSoft },
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

function ContattoForm({ form, upd, civici, onSave, onCancel, saveLabel = "SALVA" }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>CIVICO</div>
        <select value={form.civicoId} onChange={e => upd("civicoId", Number(e.target.value))}
          style={{ width: "100%", padding: "11px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", appearance: "none" }}>
          {civici.map(c => <option key={c.id} value={c.id}>{c.numero}</option>)}
        </select>
      </div>
      <FInput label="NOME *" value={form.nome} onChange={v => upd("nome", v)} placeholder="es. MARIO" />
      <FInput label="COGNOME *" value={form.cognome} onChange={v => upd("cognome", v)} placeholder="es. ROSSI" />
      <FInput label="TELEFONO *" value={form.telefono} onChange={v => upd("telefono", v)} placeholder="es. 333 1234567" type="tel" />
      {/* RISPOSTO checkbox */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>RISPOSTO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
          onClick={() => upd("risposto", form.risposto === "Y" ? "" : "Y")}>
          {form.risposto === "Y"
            ? <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(76,175,80,0.2)", border: "2px solid #4caf50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            : <span style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}></span>
          }
          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 18, color: form.risposto === "Y" ? T.green : T.textMuted }}>
            {form.risposto === "Y" ? "SI" : "—"}
          </span>
        </div>
      </div>
      <SiNoSelector label="VUOTO" value={form.vuoto} onChange={v => upd("vuoto", v)} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>INTERNO</div>
        <select value={form.interno || ""} onChange={e => upd("interno", e.target.value)}
          style={{ width: "100%", padding: "11px 12px", background: form.interno ? "rgba(224,92,92,0.1)" : T.surfaceHigh, border: `1px solid ${form.interno ? "#e05c5c" : T.border}`, borderRadius: 8, color: form.interno ? "#e05c5c" : T.textMuted, fontSize: 14, fontWeight: 700, outline: "none", appearance: "none", cursor: "pointer" }}>
          <option value="">— nessuno —</option>
          {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>Interno {n}</option>)}
        </select>
      </div>
      <StatoSelector value={form.stato} onChange={v => upd("stato", v)} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", display: "flex", background: T.surface, borderTop: `1px solid ${T.border}`, padding: "14px 24px" }}>
        <button className="tap" onClick={onCancel} style={{ flex: 1, background: "none", border: "none", color: T.textMuted, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>CANCELLA</button>
        <button className="tap" onClick={onSave} style={{ flex: 1, background: "none", border: "none", color: T.accent, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>{saveLabel}</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = (civicoId) => ({ nome: "", cognome: "", telefono: "", vuoto: "", stato: "", risposto: "", interno: "", civicoId });

function RispostoIcon({ value }) {
  if (value === "Y" || value === true) return <span style={{ color: T.green, fontSize: 13, fontWeight: 700 }}>SI</span>;
  if (value === "N" || value === false) return <span style={{ color: T.accent, fontSize: 13, fontWeight: 700 }}>NO</span>;
  return <span style={{ color: T.textDim, fontSize: 13 }}>—</span>;
}

function getLastAttivita(data, contattoId) {
  const atts = data.attivita.filter(a => a.contattoId === contattoId);
  if (!atts.length) return null;
  return atts.sort((a, b) => parseDataOra(b.dataOra) - parseDataOra(a.dataOra))[0];
}

function parseDataOra(str) {
  // format: "d/m/yyyy hh:mm:ss"
  const [datePart, timePart] = str.split(" ");
  const [d, m, y] = datePart.split("/");
  return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T${timePart || "00:00:00"}`);
}

function AttivitaData({ dataOra }) {
  if (!dataOra) return <span style={{ color: T.textDim, fontSize: 11 }}>—</span>;
  const date = parseDataOra(dataOra);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  const color = days >= 30 ? "#e05c5c" : days >= 15 ? "#f0a500" : T.textMuted;
  const bg = days >= 30 ? "rgba(224,92,92,0.15)" : days >= 15 ? "rgba(240,165,0,0.15)" : "transparent";
  const [d, m, y] = dataOra.split(" ")[0].split("/");
  const label = `${d}/${m}/${y}`;
  return (
    <span style={{ fontSize: 11, color, background: bg, borderRadius: 4, padding: bg !== "transparent" ? "2px 6px" : "0", fontWeight: days >= 15 ? 700 : 400 }}>
      {label}
    </span>
  );
}

function ContattiScreen({ data, setData, civico, via, onSelect, onBack, onUfficio, user }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM(civico.id));
  const contatti = data.contatti.filter(c => c.civicoId === civico.id).filter(c => !search || (c.nome+" "+c.cognome+" "+c.telefono).toLowerCase().includes(search.toLowerCase()));
  const attCount = id => data.attivita.filter(a => a.contattoId === id).length;
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.nome.trim()) return;
    try {
      const body = { nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), telefono: form.telefono, risposto: form.risposto, vuoto: form.vuoto, stato: form.stato, interno: form.interno, civico_id: civico.id };
      const rows = await sbFetch("contatti", { method: "POST", body: JSON.stringify(body), token: user.token });
      const newId = rows[0]?.id || Date.now();
      setData(d => ({ ...d, contatti: [...d.contatti, { id: newId, ...form, nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), civicoId: civico.id }] }));
    } catch(e) {
      // fallback local
      setData(d => ({ ...d, contatti: [...d.contatti, { id: Date.now(), ...form, nome: form.nome.toUpperCase(), cognome: form.cognome.toUpperCase(), civicoId: civico.id }] }));
    }
    setForm(EMPTY_FORM(civico.id));
    setAdding(false);
  };

  if (adding) return (
    <div style={{ minHeight: "100vh", background: T.bg }} className="screen">
      <TopBar title="NUOVO CONTATTO" onBack={() => setAdding(false)} />
      <div style={{ padding: "16px 18px" }}>
        <ContattoForm form={form} upd={upd} civici={via ? data.civici.filter(c => c.viaId === via.id) : [civico]} onSave={save} onCancel={() => setAdding(false)} saveLabel="SALVA" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={`CIVICO ${civico.numero}`} onBack={onBack}
        right={<><button onClick={() => setShowSearch(s => !s)} style={{ background:"none",border:"none",color:showSearch?T.accent:T.textMuted,cursor:"pointer",display:"flex",padding:4 }}><ISearch /></button><RefreshBtn onRefresh={() => { setSearch(""); setShowSearch(false); setRefreshKey(k=>k+1); }} /></>} />
      {showSearch && <div style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`}}><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nome, cognome, telefono..." style={{width:"100%",background:T.surfaceHigh,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"8px 12px",outline:"none"}}/></div>}
      <div>
          <TH cols={["NOME","TEL","INT","RISP","ULT. ATT.","STATO","VUOTO",""]} widths="1.1fr 1fr 0.6fr 0.6fr 1fr 1fr 0.6fr 0.3fr" />
          {contatti.map((c, i) => (
            <div key={c.id}>
              <div className="tap" onClick={() => onSelect(c)}
                style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 0.6fr 0.6fr 1fr 1fr 0.6fr 0.3fr", alignItems: "center", cursor: "pointer", background: i % 2 === 0 ? T.row : T.rowAlt }}>
                <span style={{ padding: "11px 8px", fontSize: 12, fontWeight: 700 }}>{c.nome}</span>
                <span style={{ padding: "11px 4px", fontSize: 11, color: T.textMuted, textAlign: "center" }}>{c.telefono}</span>
                <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={e => e.stopPropagation()}>
                  <select value={c.interno || ""} onChange={e => {
                    e.stopPropagation();
                    setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === c.id ? { ...x, interno: e.target.value } : x) }));
                  }} style={{ background: c.interno ? "rgba(224,92,92,0.15)" : "#1e1e1e", border: `1px solid ${c.interno ? "#e05c5c" : "#2a2a2a"}`, borderRadius: 4, color: c.interno ? "#e05c5c" : "#555", fontSize: 11, fontWeight: 700, padding: "3px 2px", width: "100%", outline: "none", cursor: "pointer", textAlign: "center" }}>
                    <option value="">—</option>
                    {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </span>
                <span style={{ padding: "11px 4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={e => {
                    try {
                      e.stopPropagation();
                      const nuovoStato = c.risposto === "Y" ? "" : "Y";
                      const commento = c.risposto === "Y" ? "NON RISPOSTO" : "RISPOSTO";
                      const now = new Date();
                      const fmt = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
                      sbFetch(`contatti?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify({ risposto: nuovoStato }), token: user.token, prefer: "return=minimal" }).catch(console.error);
                      sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento, data_ora: fmt, utente: user?.email||"", contatto_id: c.id }), token: user.token }).catch(console.error);
                      setData(d => ({
                        ...d,
                        contatti: d.contatti.map(x => x.id === c.id ? { ...x, risposto: nuovoStato } : x),
                        attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: c.id, commento, dataOra: fmt, utente: user?.email || "" }],
                      }));
                    } catch(err) { console.error("risposto toggle error:", err); }
                  }}>
                  {c.risposto === "Y"
                    ? <span style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(76,175,80,0.2)", border: "2px solid #4caf50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    : c.risposto === "N"
                    ? <span style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(224,92,92,0.1)", border: "2px solid #444", display: "flex", alignItems: "center", justifyContent: "center", color: "#e05c5c", fontSize: 11, fontWeight: 700 }}>N</span>
                    : <span style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}></span>
                  }
                </span>
                <span style={{ padding: "11px 4px", display: "flex", justifyContent: "center" }}><AttivitaData dataOra={getLastAttivita(data, c.id)?.dataOra} /></span>
                <span style={{ padding: "4px 2px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={e => e.stopPropagation()}>
                  {(() => {
                    const statoColor = c.stato === "NOTIZIA" ? { color: "#e05c5c", bg: "rgba(224,92,92,0.15)", border: "#e05c5c" }
                      : c.stato === "INFORMAZIONE" ? { color: "#4fc3f7", bg: "rgba(79,195,247,0.15)", border: "#4fc3f7" }
                      : c.stato === "CONCORRENZA" ? { color: "#f0a500", bg: "rgba(240,165,0,0.15)", border: "#f0a500" }
                      : { color: "#555", bg: "#1e1e1e", border: "#2a2a2a" };
                    return (
                      <select value={c.stato || ""} onChange={e => {
                        e.stopPropagation();
                        setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === c.id ? { ...x, stato: e.target.value } : x) }));
                      }} style={{ background: statoColor.bg, border: `1px solid ${statoColor.border}`, borderRadius: 4, color: statoColor.color, fontSize: 9, fontWeight: 700, padding: "3px 2px", width: "100%", outline: "none", cursor: "pointer", textAlign: "center" }}>
                        <option value="">—</option>
                        <option value="INFORMAZIONE">INFO</option>
                        <option value="NOTIZIA">NOTIZIA</option>
                        <option value="CONCORRENZA">CONC.</option>
                      </select>
                    );
                  })()}
                </span>
                <span style={{ padding: "11px 4px", fontSize: 11, textAlign: "center" }}>{c.vuoto === "Y" ? <span style={{color: "#4caf50", fontWeight: 700}}>SI</span> : c.vuoto === "N" ? <span style={{color: "#e05c5c", fontWeight: 700}}>NO</span> : ""}</span>
                <span style={{ padding: "11px 4px", color: T.textDim, display: "flex", justifyContent: "center" }}><IArrow /></span>
              </div>
              <HR />
            </div>
          ))}
        </div>
      <FabPlus onClick={() => setAdding(true)} />
      <BottomBar active="ufficio" onUfficio={onUfficio} />
    </div>
  );
}

function ContattoScreen({ data, setData, contatto: contattoInit, civico, onBack, onUfficio, user }) {
  const [modalAtt, setModalAtt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [commento, setCommento] = useState("");
  const [editForm, setEditForm] = useState({
    nome: contattoInit.nome, cognome: contattoInit.cognome || "",
    telefono: contattoInit.telefono,
    vuoto: contattoInit.vuoto === "Y" ? "Y" : contattoInit.vuoto === "N" ? "N" : "",
    stato: contattoInit.stato || "",
    risposto: contattoInit.risposto === "Y" ? "Y" : contattoInit.risposto === "N" ? "N" : "",
    interno: contattoInit.interno || "",
    civicoId: contattoInit.civicoId,
  });

  const contatto = data.contatti.find(c => c.id === contattoInit.id) || contattoInit;
  const attivita = data.attivita.filter(a => a.contattoId === contatto.id).sort((a, b) => parseDataOra(b.dataOra) - parseDataOra(a.dataOra));

  const addAtt = async () => {
    if (!commento.trim()) return;
    const now = new Date();
    const fmt = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    try {
      await sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: commento.trim(), data_ora: fmt, utente: user?.email||"", contatto_id: contatto.id }), token: user.token });
    } catch(e) { console.error("addAtt error:", e); }
    setData(d => ({ ...d, attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: contatto.id, commento: commento.trim(), dataOra: fmt, utente: user.email }] }));
    setCommento(""); setModalAtt(false);
  };

  const saveEdit = async () => {
    const updated = { ...contatto, ...editForm, nome: editForm.nome.toUpperCase(), cognome: editForm.cognome.toUpperCase() };
    try {
      await sbFetch(`contatti?id=eq.${updated.id}`, { method: "PATCH", body: JSON.stringify({ nome: updated.nome, cognome: updated.cognome, telefono: updated.telefono, risposto: updated.risposto, vuoto: updated.vuoto, stato: updated.stato, interno: updated.interno }), token: user.token, prefer: "return=minimal" });
    } catch(e) { console.error("Sync error", e); }
    setData(d => ({ ...d, contatti: d.contatti.map(c => c.id === updated.id ? updated : c) }));
    setEditing(false);
  };

  const updEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  if (editing) return (
    <div style={{ minHeight: "100vh", background: T.bg }} className="screen">
      <TopBar title="MODIFICA CONTATTO" onBack={() => setEditing(false)} />
      <div style={{ padding: "16px 18px" }}>
        <ContattoForm form={editForm} upd={updEdit} civici={[civico]} onSave={saveEdit} onCancel={() => setEditing(false)} saveLabel="SALVA" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 58 }} className="screen">
      <TopBar title={contatto.nome} onBack={onBack} right={<><button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><ITrash /></button><button style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", display: "flex", padding: 4 }}><IDots /></button><RefreshBtn onRefresh={() => {}} /></>} />
      <div style={{ padding: "14px 18px" }}>
        {[
          ["NOME", contatto.nome],
          ["COGNOME", contatto.cognome],
          ["CIVICO", civico.numero],
          ["TELEFONO", contatto.telefono],
          ["VUOTO", contatto.vuoto === "Y" ? "SI" : contatto.vuoto === "N" ? "NO" : "—"],
          ["STATO", contatto.stato, false, contatto.stato === "NOTIZIA" ? "#e05c5c" : contatto.stato === "INFORMAZIONE" ? "#4fc3f7" : contatto.stato === "CONCORRENZA" ? "#f0a500" : T.text],
        ].map(([label, value, arrow, customColor]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
                color: customColor || (label === "VUOTO"
                  ? (contatto.vuoto === "Y" ? T.green : contatto.vuoto === "N" ? T.accent : T.textMuted)
                  : T.text) }}>
                {value || "—"}
              </span>
              {arrow && <button className="tap" style={{ background: T.accent, border: "none", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><IArrow /></button>}
            </div>
          </div>
        ))}

        {/* INTERNO dropdown */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>INTERNO</div>
          <select value={contatto.interno || ""} onChange={e => {
            setData(d => ({ ...d, contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, interno: e.target.value } : x) }));
          }} style={{ background: contatto.interno ? "rgba(224,92,92,0.1)" : "#1e1e1e", border: `1px solid ${contatto.interno ? "#e05c5c" : "#2a2a2a"}`, borderRadius: 8, color: contatto.interno ? "#e05c5c" : "#555", fontSize: 16, fontWeight: 700, padding: "10px 14px", width: "100%", outline: "none", cursor: "pointer" }}>
            <option value="">— nessuno —</option>
            {Array.from({length: 40}, (_, i) => i+1).map(n => <option key={n} value={n}>Interno {n}</option>)}
          </select>
        </div>

        {/* RISPOSTO checkbox interattivo */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>RISPOSTO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}
            onClick={() => {
              try {
                const nuovoStato = contatto.risposto === "Y" ? "" : "Y";
                const commentoTesto = contatto.risposto === "Y" ? "NON RISPOSTO" : "RISPOSTO";
                const now = new Date();
                const fmt = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
                sbFetch(`contatti?id=eq.${contatto.id}`, { method: "PATCH", body: JSON.stringify({ risposto: nuovoStato }), token: user.token, prefer: "return=minimal" }).catch(console.error);
                sbFetch("attivita", { method: "POST", body: JSON.stringify({ commento: commentoTesto, data_ora: fmt, utente: user?.email||"", contatto_id: contatto.id }), token: user.token }).catch(console.error);
                setData(d => ({
                  ...d,
                  contatti: d.contatti.map(x => x.id === contatto.id ? { ...x, risposto: nuovoStato } : x),
                  attivita: [...(d.attivita||[]), { id: Date.now(), contattoId: contatto.id, commento: commentoTesto, dataOra: fmt, utente: user?.email || "" }],
                }));
              } catch(err) { console.error("risposto error:", err); }
            }}
            style={{ cursor: "pointer" }}>
            {contatto.risposto === "Y"
              ? <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(76,175,80,0.2)", border: "2px solid #4caf50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              : <span style={{ width: 32, height: 32, borderRadius: 8, border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}></span>
            }
            <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 18, color: contatto.risposto === "Y" ? T.green : T.textMuted }}>
              {contatto.risposto === "Y" ? "SI" : "—"}
            </span>
          </div>
        </div>
      </div>
      <HR />
      <SectionTag label="ULTIMA ATTIVITÀ" count={attivita.length} />
      <HR />
      <TH cols={["COMMENTO", "DATA E ORA ↓", "UTENTE"]} widths="1.6fr 1.3fr 1fr" />
      {attivita.map((a, i) => (
        <div key={a.id}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.3fr 1fr", background: i % 2 === 0 ? T.row : T.rowAlt }}>
            <span style={{ padding: "12px 10px", fontSize: 13 }}>{a.commento}</span>
            <span style={{ padding: "12px 10px", fontSize: 11, color: T.textMuted }}>{a.dataOra}</span>
            <span style={{ padding: "12px 10px", fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.utente}</span>
          </div>
          <HR />
        </div>
      ))}
      <ActionRow onAdd={() => setModalAtt(true)} />
      <FAB onClick={() => setEditing(true)} />
      <BottomBar active="ufficio" onUfficio={onUfficio} />
      {modalAtt && <Modal title="Nuova Attività" onClose={() => setModalAtt(false)}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>COMMENTO</div>
          <textarea value={commento} onChange={e => setCommento(e.target.value)} placeholder="Inserisci nota..." rows={4}
            style={{ width: "100%", padding: "10px 12px", background: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'Barlow', sans-serif" }} />
        </div>
        <div style={{ padding: "8px 12px", background: T.surfaceHigh, borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.textMuted }}>
          👤 {user.name} · {user.email}
        </div>
        <PrimaryBtn label="SALVA ATTIVITÀ" onClick={addAtt} />
      </Modal>}
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_STATE);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    if (!user || dbLoaded) return;
    const loadData = async () => {
      try {
        const [uffici, zone, vie, civici, contatti, attivita] = await Promise.all([
          sbFetch("uffici?select=*&order=id", { token: user.token }),
          sbFetch("zone?select=*&order=id", { token: user.token }),
          sbFetch("vie?select=*&order=id", { token: user.token }),
          sbFetch("civici?select=*&order=id", { token: user.token }),
          sbFetch("contatti?select=*&order=id", { token: user.token }),
          sbFetch("attivita?select=*&order=id", { token: user.token }),
        ]);
        setData({
          uffici: uffici.map(u => ({ id: u.id, nome: u.nome })),
          zone: zone.map(z => ({ id: z.id, nome: z.nome, ufficioId: z.ufficio_id })),
          vie: vie.map(v => ({ id: v.id, nome: v.nome, zonaId: v.zona_id })),
          civici: civici.map(c => ({ id: c.id, numero: c.numero, viaId: c.via_id })),
          contatti: contatti.map(c => ({ id: c.id, nome: c.nome, cognome: c.cognome, telefono: c.telefono, risposto: c.risposto||"", vuoto: c.vuoto||"", stato: c.stato||"", interno: c.interno||"", civicoId: c.civico_id })),
          attivita: attivita.map(a => ({ id: a.id, commento: a.commento, dataOra: a.data_ora, utente: a.utente, contattoId: a.contatto_id })),
        });
        setDbLoaded(true);
      } catch(e) {
        console.error("Errore caricamento dati:", e);
      }
    };
    loadData();
  }, [user]);
  const [nav, setNav] = useState([]);

  const push = (screen, payload) => setNav(n => [...n, { screen, payload }]);
  const pop  = () => setNav(n => n.slice(0, -1));
  const home = () => setNav([]);

  const cur = nav[nav.length - 1];

  if (!user) return <><style>{css}</style><LoginScreen onLogin={setUser} /></>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      <style>{css}</style>
      {!cur && <UfficiScreen data={data} user={user} onLogout={() => setUser(null)} onSelect={u => push("zone", { ufficio: u })} />}
      {cur?.screen === "zone"     && <ZoneScreen     data={data} setData={setData} ufficio={cur.payload.ufficio} onBack={pop} onUfficio={home} onSelect={z => push("vie",      { zona: z, ufficio: cur.payload.ufficio })} />}
      {cur?.screen === "vie"      && <VieScreen      data={data} setData={setData} zona={cur.payload.zona}       onBack={pop} onUfficio={home} onSelect={v => push("civici",   { via: v, zona: cur.payload.zona })} />}
      {cur?.screen === "civici"   && <CiviciScreen   data={data} setData={setData} via={cur.payload.via} zona={cur.payload.zona} onBack={pop} onUfficio={home} onSelect={c => push("contatti", { civico: c, via: cur.payload.via })} />}
      {cur?.screen === "contatti" && <ContattiScreen data={data} setData={setData} civico={cur.payload.civico} via={cur.payload.via} onBack={pop} onUfficio={home} user={user} onSelect={c => push("contatto", { contatto: c, civico: cur.payload.civico })} />}
      {cur?.screen === "contatto" && <ContattoScreen data={data} setData={setData} contatto={cur.payload.contatto} civico={cur.payload.civico} onBack={pop} onUfficio={home} user={user} />}
    </div>
  );
}
