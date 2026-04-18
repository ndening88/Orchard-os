import { useState } from "react";
import { T, SEASON_META, PRI_META, CAT_META, AVATAR_COLORS, DEFAULT_FARM,
         NZ_REGIONS, WALNUT_VARIETIES, ACT_TEMPLATES, DATA_TYPES,
         initials, userColor, getDataAlert, LS } from "./constants.js";
import { sbSaveFarm } from "./supabase.js";

// ── Primitives ────────────────────────────────────────────────────────────
export function Chip({ color, dim, children, small=false }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:dim||"#1a1e24", color, border:`1px solid ${color}33`, borderRadius:6, padding:small?"2px 7px":"3px 10px", fontSize:small?10:11, fontWeight:600, fontFamily:"DM Mono,monospace", whiteSpace:"nowrap" }}>{children}</span>;
}
export function Dot({ color }) {
  return <span style={{ width:7, height:7, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} />;
}
export function ProgressBar({ value, max, color=T.accent }) {
  const pct = max ? Math.round((value/max)*100) : 0;
  return <div style={{ background:T.border, borderRadius:4, height:5, overflow:"hidden" }}><div style={{ width:`${pct}%`, background:color, height:"100%", borderRadius:4, transition:"width .5s" }}/></div>;
}
export function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, transition:"border-color .15s", cursor:onClick?"pointer":undefined, ...style }}
    onMouseEnter={e=>{ if(onClick) e.currentTarget.style.borderColor=T.borderLight; }}
    onMouseLeave={e=>{ if(onClick) e.currentTarget.style.borderColor=T.border; }}>{children}</div>;
}
export function Btn({ onClick, children, variant="primary", size="md", disabled, style={} }) {
  const v = {
    primary:{ background:T.accentMuted, color:"#fff",      border:`1px solid ${T.accent}44`      },
    ghost:  { background:"transparent",  color:T.textMuted, border:`1px solid ${T.border}`        },
    active: { background:T.surfaceHover, color:T.text,      border:`1px solid ${T.borderLight}`   },
    ai:     { background:"linear-gradient(135deg,#1e1535,#1a2a1a)", color:T.accent, border:`1px solid ${T.accent}44` },
    danger: { background:T.redDim,       color:T.red,       border:`1px solid ${T.red}44`         },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...v[variant], borderRadius:8, padding:size==="sm"?"5px 11px":"9px 16px", fontSize:size==="sm"?11:13, fontWeight:600, fontFamily:"DM Sans,sans-serif", cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap", ...style }}>{children}</button>;
}
export function SLabel({ t }) {
  return <div style={{ fontSize:11, color:T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>{t}</div>;
}
export function CatChip({ category, small }) {
  const m = CAT_META[category] || { icon:"📋", color:T.textMuted, dim:"#1a1e24" };
  return <Chip color={m.color} dim={m.dim} small={small}>{m.icon} {category}</Chip>;
}
export function FilterPill({ label, active, onClick }) {
  return <button onClick={onClick} style={{ background:active?T.surfaceHover:"transparent", color:active?T.text:T.textMuted, border:`1px solid ${active?T.borderLight:T.border}`, borderRadius:20, padding:"5px 13px", fontSize:12, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:active?600:400, transition:"all .1s", whiteSpace:"nowrap" }}>{label}</button>;
}
export function GroupHeader({ category }) {
  const m = CAT_META[category] || { icon:"📋", color:T.textMuted };
  return <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0 8px", marginBottom:4 }}>
    <span style={{ fontSize:16 }}>{m.icon}</span>
    <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{category}</span>
    <div style={{ flex:1, height:1, background:T.border }}/>
  </div>;
}
export function AiInsight({ text, loading, color=T.accent }) {
  if (!text && !loading) return null;
  return <div style={{ display:"flex", gap:10, background:`${color}0f`, border:`1px solid ${color}33`, borderRadius:10, padding:"11px 14px", marginTop:10, alignItems:"flex-start" }}>
    <span style={{ fontSize:16, flexShrink:0 }}>{loading ? "⏳" : "◈"}</span>
    <div style={{ flex:1 }}>
      {loading
        ? <div style={{ display:"flex", gap:4, alignItems:"center" }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:"50%", background:color, animation:`blink 1.2s ${i*0.2}s infinite` }}/>)}</div>
        : <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{text}</div>
      }
    </div>
  </div>;
}
export function DataAlert({ type, value, farm }) {
  const r = getDataAlert(type, value, farm);
  if (!r) return null;
  if (r.level === "ok") return <div style={{ display:"flex", gap:8, background:T.accentDim, border:`1px solid ${T.accent}33`, borderRadius:8, padding:"8px 12px", marginTop:8, fontSize:12, color:T.textMuted, lineHeight:1.5 }}><span>✅</span><span>{r.msg}</span></div>;
  const c = r.level === "high" ? T.red : T.yellow;
  return <div style={{ display:"flex", gap:8, background:`${c}15`, border:`1px solid ${c}44`, borderRadius:8, padding:"8px 12px", marginTop:8, fontSize:12, color:c, lineHeight:1.5 }}><span>{r.level==="high"?"🚨":"⚠️"}</span><span>{r.msg}</span></div>;
}
export function Field({ label, type="text", value, onChange, placeholder, options, rows, hint }) {
  const base = { width:"100%", background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.text, fontSize:13, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" };
  return <div>
    <div style={{ fontSize:11, color:T.textMuted, marginBottom:4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
    {hint && <div style={{ fontSize:11, color:T.textDim, marginBottom:6 }}>{hint}</div>}
    {options
      ? <select value={value} onChange={e=>onChange(e.target.value)} style={base}><option value="">Select…</option>{options.map(o=><option key={o}>{o}</option>)}</select>
      : type==="textarea"
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows||3} style={{ ...base, resize:"vertical" }}/>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>
    }
  </div>;
}
export function SyncDot({ status }) {
  const c = status==="synced"?T.accent:status==="syncing"?T.yellow:status==="error"?T.red:T.textDim;
  return <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:c }}>
    <div style={{ width:6, height:6, borderRadius:"50%", background:c, animation:status==="syncing"?"blink 1s infinite":undefined }}/>
    {status==="synced"?"Synced":status==="syncing"?"Syncing…":status==="error"?"Offline":""}
  </div>;
}
export function UserAvatar({ name, teamMembers, size=28 }) {
  const color = userColor(name, teamMembers);
  const r = Math.round(size * 0.3);
  return <div style={{ width:size, height:size, borderRadius:r, background:`${color}22`, border:`1px solid ${color}44`, display:"grid", placeItems:"center", fontSize:Math.round(size*0.38), fontWeight:700, color, fontFamily:"DM Mono,monospace", flexShrink:0 }}>{initials(name)}</div>;
}

// ════════════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════════════════════
export function Onboarding({ onComplete, isMobile }) {
  const [step, setStep]     = useState(0);
  const [farm, setFarm]     = useState({ ...DEFAULT_FARM, onboarded:false });
  const [draft, setDraft]   = useState({ name:"", hectares:"", variety:"Chandler", notes:"" });
  const [saving, setSaving] = useState(false);

  function up(k, v)            { setFarm(f => ({ ...f, [k]:v })); }
  function addBlock()          { if (!draft.name.trim()) return; setFarm(f=>({...f,blocks:[...f.blocks,{id:"b"+Date.now(),...draft}]})); setDraft({name:"",hectares:"",variety:"Chandler",notes:""}); }
  function removeBlock(id)     { setFarm(f=>({...f,blocks:f.blocks.filter(b=>b.id!==id)})); }
  function addMember()         { setFarm(f=>({...f,teamMembers:[...f.teamMembers,{id:"t"+Date.now(),name:"",role:""}]})); }
  function updMember(id,k,v)   { setFarm(f=>({...f,teamMembers:f.teamMembers.map(m=>m.id===id?{...m,[k]:v}:m)})); }
  function removeMember(id)    { setFarm(f=>({...f,teamMembers:f.teamMembers.filter(m=>m.id!==id)})); }
  async function launch()      { setSaving(true); const f={...farm,onboarded:true}; LS.saveFarm(f); await sbSaveFarm(f); onComplete(f); }

  const steps = [
    { title:"Welcome to Orchard OS", sub:"Set up your walnut farm in 2 minutes.", icon:"🌰" },
    { title:"Your Farm",             sub:"Tell us about the farm.",                icon:"🏡" },
    { title:"Orchard Blocks",        sub:"Define your blocks for per-block tracking.", icon:"🗺️" },
    { title:"Your Team",             sub:"Add people who work on the farm.",        icon:"👥" },
    { title:"Alert Thresholds",      sub:"Set target ranges for smart alerts.",     icon:"⚙️" },
    { title:"All set!",              sub:"Your farm profile is ready.",             icon:"✅" },
  ];
  const s = steps[step];
  const prog = Math.round((step / steps.length) * 100);
  const inp = { width:"100%", background:"#1c2330", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.text, fontSize:13, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:isMobile?"16px":"20px", fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:560 }}>
        {/* Progress bar */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontSize:11, color:T.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Step {step+1} of {steps.length}</span>
            <span style={{ fontSize:11, color:T.textMuted }}>{prog}%</span>
          </div>
          <div style={{ height:3, background:T.border, borderRadius:2 }}>
            <div style={{ width:`${prog}%`, height:"100%", background:T.accent, borderRadius:2, transition:"width .4s" }}/>
          </div>
        </div>

        <Card style={{ padding:isMobile?"18px":"26px" }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ fontSize:isMobile?32:38, marginBottom:10 }}>{s.icon}</div>
            <h1 style={{ fontSize:isMobile?17:20, fontWeight:700, color:T.text, margin:"0 0 6px" }}>{s.title}</h1>
            <p style={{ fontSize:13, color:T.textMuted, margin:0, lineHeight:1.6 }}>{s.sub}</p>
          </div>

          {/* Step 0 — Welcome */}
          {step===0 && <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10, marginBottom:10 }}>
            {[{icon:"🌤",t:"Live weather forecast",s:"16-day on your calendar"},{icon:"◈",t:"AI farm advisor",s:"Briefings & guidance"},{icon:"📋",t:"Activity planner",s:"Seasonal task management"},{icon:"🔄",t:"Shared across devices",s:"Real-time sync via Supabase"}].map(x=>(
              <div key={x.t} style={{ background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:18 }}>{x.icon}</span>
                <div><div style={{ fontSize:12, fontWeight:600, color:T.text }}>{x.t}</div><div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{x.s}</div></div>
              </div>
            ))}
          </div>}

          {/* Step 1 — Farm basics */}
          {step===1 && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Field label="Farm Name *" value={farm.name} onChange={v=>up("name",v)} placeholder="e.g. Te Awamutu Walnut Farm"/>
            <Field label="Your Name" value={farm.ownerName} onChange={v=>up("ownerName",v)} placeholder="e.g. Sarah Mitchell"/>
            <Field label="Region" value={farm.location} onChange={v=>up("location",v)} options={NZ_REGIONS}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="Size (ha)" type="number" value={farm.totalHectares} onChange={v=>up("totalHectares",v)} placeholder="e.g. 12"/>
              <Field label="Est. Year"  type="number" value={farm.established}   onChange={v=>up("established",v)}   placeholder="e.g. 2008"/>
            </div>
          </div>}

          {/* Step 2 — Blocks */}
          {step===2 && <div>
            {farm.blocks.length > 0 && <div style={{ marginBottom:12 }}>
              {farm.blocks.map(b => (
                <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>🌳</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.text }}>{b.name}</div><div style={{ fontSize:11, color:T.textDim }}>{b.variety}{b.hectares?` · ${b.hectares}ha`:""}</div></div>
                  <button onClick={()=>removeBlock(b.id)} style={{ background:"transparent", border:"none", color:T.textDim, cursor:"pointer", fontSize:18 }}>×</button>
                </div>
              ))}
            </div>}
            <div style={{ background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:10, padding:12, marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Add a block</div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr", gap:8, marginBottom:10 }}>
                <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="Block name" style={{ ...inp, gridColumn:isMobile?"1 / -1":undefined }}/>
                <input type="number" value={draft.hectares} onChange={e=>setDraft(d=>({...d,hectares:e.target.value}))} placeholder="ha" style={inp}/>
                <select value={draft.variety} onChange={e=>setDraft(d=>({...d,variety:e.target.value}))} style={inp}>{WALNUT_VARIETIES.map(v=><option key={v}>{v}</option>)}</select>
              </div>
              <Btn onClick={addBlock} size="sm" disabled={!draft.name.trim()}>+ Add Block</Btn>
            </div>
            <div style={{ fontSize:11, color:T.textDim }}>You can add more blocks in Settings anytime.</div>
          </div>}

          {/* Step 3 — Team */}
          {step===3 && <div>
            {farm.teamMembers.map(m => (
              <div key={m.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8, alignItems:"center" }}>
                <input value={m.name} onChange={e=>updMember(m.id,"name",e.target.value)} placeholder="Name" style={inp}/>
                <input value={m.role} onChange={e=>updMember(m.id,"role",e.target.value)} placeholder="Role" style={inp}/>
                <button onClick={()=>removeMember(m.id)} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textDim, cursor:"pointer", borderRadius:8, padding:"8px 10px", fontSize:14 }}>×</button>
              </div>
            ))}
            <Btn onClick={addMember} variant="ghost" size="sm" style={{ marginTop:4 }}>+ Add member</Btn>
          </div>}

          {/* Step 4 — Thresholds */}
          {step===4 && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:T.accentDim, border:`1px solid ${T.accent}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:T.textMuted, lineHeight:1.6 }}>◈ Pre-set to NZ best-practice defaults — adjust for your conditions.</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="pH Min"             type="number" value={farm.soilPhMin}           onChange={v=>up("soilPhMin",parseFloat(v)||6)}           hint="Optimum: 6.0"/>
              <Field label="pH Max"             type="number" value={farm.soilPhMax}           onChange={v=>up("soilPhMax",parseFloat(v)||7)}           hint="Optimum: 7.0"/>
              <Field label="Moisture Min (%)"   type="number" value={farm.irrigationTargetMin} onChange={v=>up("irrigationTargetMin",parseFloat(v)||35)} hint="Irrigate below this"/>
              <Field label="Moisture Max (%)"   type="number" value={farm.irrigationTargetMax} onChange={v=>up("irrigationTargetMax",parseFloat(v)||65)} hint="Reduce above this"/>
              <Field label="Pest Threshold (/wk)" type="number" value={farm.pestThreshold}     onChange={v=>up("pestThreshold",parseFloat(v)||15)}      hint="Spray at or above"/>
              <Field label="Hull Split (%)"     type="number" value={farm.harvestHullSplitPct} onChange={v=>up("harvestHullSplitPct",parseFloat(v)||10)} hint="Chandler: 5–10%"/>
            </div>
          </div>}

          {/* Step 5 — Done */}
          {step===5 && <div style={{ textAlign:"center" }}>
            <div style={{ background:T.accentDim, border:`1px solid ${T.accent}44`, borderRadius:12, padding:"14px 18px", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:T.accent, marginBottom:4 }}>{farm.name}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>{farm.location} · {farm.blocks.length} block{farm.blocks.length!==1?"s":""} · {farm.teamMembers.filter(m=>m.name).length} team member{farm.teamMembers.filter(m=>m.name).length!==1?"s":""}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", fontSize:12, color:T.accent, marginBottom:8 }}>
              <Dot color={T.accent}/>Data will sync across all devices via Supabase
            </div>
          </div>}

          {/* Nav */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:22, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
            <Btn onClick={()=>setStep(s=>s-1)} variant="ghost" disabled={step===0}>← Back</Btn>
            <div style={{ display:"flex", gap:5 }}>{steps.map((_,i)=><div key={i} style={{ width:i===step?18:7, height:7, borderRadius:4, background:i===step?T.accent:i<step?T.accentMuted:T.border, transition:"all .2s" }}/>)}</div>
            {step < steps.length-1
              ? <Btn onClick={()=>setStep(s=>s+1)}>Continue →</Btn>
              : <Btn onClick={launch} disabled={saving}>{saving?"Saving…":"Launch →"}</Btn>
            }
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  USER PICKER
// ════════════════════════════════════════════════════════════════════════════
export function UserPicker({ farm, onSelect, isMobile }) {
  const [hovered, setHovered] = useState(null);
  const members = farm.teamMembers.filter(m => m.name);
  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:isMobile?"20px":"40px", fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, background:T.accentDim, border:`1px solid ${T.accent}44`, borderRadius:14, display:"grid", placeItems:"center", fontSize:26, margin:"0 auto 14px" }}>🌰</div>
          <h1 style={{ fontSize:20, fontWeight:700, color:T.text, margin:"0 0 6px" }}>{farm.name}</h1>
          <p style={{ fontSize:13, color:T.textMuted, margin:0 }}>Who's using the app right now?</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:20 }}>
          {members.map((m, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isH = hovered === m.name;
            return (
              <button key={m.id} onClick={()=>onSelect(m)} onMouseEnter={()=>setHovered(m.name)} onMouseLeave={()=>setHovered(null)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:isH?T.accentDim:T.surface, border:`1px solid ${isH?T.accent+"66":T.border}`, borderRadius:14, cursor:"pointer", textAlign:"left", width:"100%", transition:"all .15s", fontFamily:"DM Sans,sans-serif" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${color}22`, border:`2px solid ${color}44`, display:"grid", placeItems:"center", fontSize:15, fontWeight:700, color, fontFamily:"DM Mono,monospace", flexShrink:0 }}>{initials(m.name)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:600, color:T.text, lineHeight:1.2 }}>{m.name}</div>
                  {m.role && <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{m.role}</div>}
                </div>
                <span style={{ fontSize:18, color:isH?T.accent:T.textDim, transition:"color .15s" }}>→</span>
              </button>
            );
          })}
        </div>
        {members.length === 0 && <div style={{ textAlign:"center", padding:"20px 0", color:T.textDim, fontSize:13 }}>No team members yet.<br/><span style={{ color:T.textMuted }}>Add them in Settings.</span></div>}
        <button onClick={()=>onSelect({id:"guest",name:"Guest",role:""})} style={{ width:"100%", padding:"11px", background:"transparent", border:`1px dashed ${T.border}`, borderRadius:12, color:T.textDim, fontSize:13, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Continue as Guest</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════════════════════
export function Settings({ farm, setFarm, setCurrentUser, currentUser, bp }) {
  const isMobile = bp === "mobile";
  const [local, setLocal]     = useState(() => JSON.parse(JSON.stringify(farm)));
  const [stab, setStab]       = useState("farm");
  const [draft, setDraft]     = useState({ name:"", hectares:"", variety:"Chandler", notes:"" });
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);

  function up(k, v)            { setLocal(f => ({ ...f, [k]:v })); }
  function addBlock()          { if (!draft.name.trim()) return; setLocal(f=>({...f,blocks:[...f.blocks,{id:"b"+Date.now(),...draft}]})); setDraft({name:"",hectares:"",variety:"Chandler",notes:""}); }
  function removeBlock(id)     { setLocal(f=>({...f,blocks:f.blocks.filter(b=>b.id!==id)})); }
  function updBlock(id,k,v)    { setLocal(f=>({...f,blocks:f.blocks.map(b=>b.id===id?{...b,[k]:v}:b)})); }
  function addMember()         { setLocal(f=>({...f,teamMembers:[...f.teamMembers,{id:"t"+Date.now(),name:"",role:""}]})); }
  function updMember(id,k,v)   { setLocal(f=>({...f,teamMembers:f.teamMembers.map(m=>m.id===id?{...m,[k]:v}:m)})); }
  function removeMember(id)    { setLocal(f=>({...f,teamMembers:f.teamMembers.filter(m=>m.id!==id)})); }
  async function save()        { setSaving(true); const f={...local}; LS.saveFarm(f); setFarm(f); await sbSaveFarm(f); setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500); }

  const stabs = [
    { id:"farm",          icon:"🏡", label:"Farm"       },
    { id:"blocks",        icon:"🗺️", label:"Blocks"    },
    { id:"team",          icon:"👥", label:"Team"       },
    { id:"thresholds",    icon:"⚙️", label:"Thresholds" },
    { id:"notifications", icon:"🔔", label:"Alerts"     },
  ];
  const inp = { width:"100%", background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.text, fontSize:13, fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:isMobile?17:20, fontWeight:700, margin:"0 0 3px" }}>Settings</h1>
          <p style={{ color:T.textMuted, margin:0, fontSize:13 }}>Farm profile, blocks, team & thresholds.</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {saved && <span style={{ fontSize:12, color:T.accent }}>✓ Saved</span>}
          <Btn onClick={save} size={isMobile?"sm":"md"} disabled={saving}>{saving?"Saving…":"Save All"}</Btn>
        </div>
      </div>

      {/* Current user banner */}
      {currentUser && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:T.accentDim, border:`1px solid ${T.accent}33`, borderRadius:12 }}>
          <UserAvatar name={currentUser.name} teamMembers={local.teamMembers} size={38}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Signed in as {currentUser.name}</div>
            {currentUser.role && <div style={{ fontSize:11, color:T.textMuted }}>{currentUser.role}</div>}
          </div>
          <button onClick={()=>{ setCurrentUser(null); LS.saveUser(null); }} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 14px", color:T.textMuted, fontSize:12, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Switch User</button>
        </div>
      )}

      {/* Sub-nav */}
      <div style={{ display:"flex", gap:3, overflowX:"auto", WebkitOverflowScrolling:"touch", paddingBottom:2 }}>
        {stabs.map(t => (
          <button key={t.id} onClick={()=>setStab(t.id)} style={{ flexShrink:0, background:stab===t.id?T.surfaceHover:"transparent", color:stab===t.id?T.text:T.textMuted, border:`1px solid ${stab===t.id?T.borderLight:T.border}`, borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:stab===t.id?600:400, fontFamily:"DM Sans,sans-serif", display:"flex", alignItems:"center", gap:5, transition:"all .1s", whiteSpace:"nowrap" }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Farm */}
      {stab==="farm" && <Card>
        <SLabel t="Farm Identity"/>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12, marginBottom:16 }}>
          <Field label="Farm Name"       value={local.name}          onChange={v=>up("name",v)}/>
          <Field label="Owner Name"      value={local.ownerName}     onChange={v=>up("ownerName",v)}     placeholder="Your name"/>
          <Field label="Region"          value={local.location}      onChange={v=>up("location",v)}      options={NZ_REGIONS}/>
          <Field label="Total Area (ha)" type="number" value={local.totalHectares} onChange={v=>up("totalHectares",v)} placeholder="e.g. 12"/>
          <Field label="Year Est."       type="number" value={local.established}   onChange={v=>up("established",v)}   placeholder="e.g. 2008"/>
        </div>
        <SLabel t="Weather Location"/>
        <div style={{ background:T.accentDim, border:`1px solid ${T.accent}33`, borderRadius:8, padding:"10px 12px", marginBottom:12, fontSize:12, color:T.textMuted }}>
          ◈ GPS coordinates for the live weather forecast. Current: <strong style={{ color:T.text }}>{local.lat}, {local.lon}</strong>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr", gap:12 }}>
          <Field label="Latitude"  type="number" value={local.lat}      onChange={v=>up("lat",parseFloat(v)||0)}/>
          <Field label="Longitude" type="number" value={local.lon}      onChange={v=>up("lon",parseFloat(v)||0)}/>
          <Field label="Timezone"             value={local.timezone}   onChange={v=>up("timezone",v)} options={["Pacific/Auckland","Pacific/Chatham"]}/>
        </div>
      </Card>}

      {/* Blocks */}
      {stab==="blocks" && <Card>
        <SLabel t="Orchard Blocks"/>
        {local.blocks.map(b => (
          <div key={b.id} style={{ background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr auto", gap:8, marginBottom:8 }}>
              <Field label="Name"    value={b.name}    onChange={v=>updBlock(b.id,"name",v)}    style={{ gridColumn:isMobile?"1 / -1":undefined }}/>
              <Field label="ha"      type="number" value={b.hectares} onChange={v=>updBlock(b.id,"hectares",v)}/>
              <Field label="Variety" value={b.variety} onChange={v=>updBlock(b.id,"variety",v)} options={WALNUT_VARIETIES}/>
              {!isMobile && <button onClick={()=>removeBlock(b.id)} style={{ background:T.redDim, border:`1px solid ${T.red}44`, color:T.red, cursor:"pointer", borderRadius:8, padding:"7px 11px", fontSize:12, fontFamily:"DM Sans,sans-serif", alignSelf:"flex-end" }}>Remove</button>}
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
              <div style={{ flex:1 }}><Field label="Notes" value={b.notes} onChange={v=>updBlock(b.id,"notes",v)} placeholder="e.g. South-facing, heavier soil"/></div>
              {isMobile && <button onClick={()=>removeBlock(b.id)} style={{ background:T.redDim, border:`1px solid ${T.red}44`, color:T.red, cursor:"pointer", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"DM Sans,sans-serif", flexShrink:0 }}>✕</button>}
            </div>
          </div>
        ))}
        <div style={{ background:T.surface, border:`1px dashed ${T.border}`, borderRadius:10, padding:12 }}>
          <div style={{ fontSize:12, color:T.textMuted, fontWeight:600, marginBottom:10 }}>Add New Block</div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr", gap:8, marginBottom:10 }}>
            <input value={draft.name}    onChange={e=>setDraft(d=>({...d,name:e.target.value}))}    placeholder="Block name" style={{ ...inp, gridColumn:isMobile?"1 / -1":undefined }}/>
            <input type="number" value={draft.hectares} onChange={e=>setDraft(d=>({...d,hectares:e.target.value}))} placeholder="ha" style={inp}/>
            <select value={draft.variety} onChange={e=>setDraft(d=>({...d,variety:e.target.value}))} style={inp}>{WALNUT_VARIETIES.map(v=><option key={v}>{v}</option>)}</select>
          </div>
          <Btn onClick={addBlock} size="sm" disabled={!draft.name.trim()}>+ Add Block</Btn>
        </div>
      </Card>}

      {/* Team */}
      {stab==="team" && <Card>
        <SLabel t="Team Members"/>
        {local.teamMembers.map(m => (
          <div key={m.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8, alignItems:"center" }}>
            <input value={m.name} onChange={e=>updMember(m.id,"name",e.target.value)} placeholder="Name" style={inp}/>
            <input value={m.role} onChange={e=>updMember(m.id,"role",e.target.value)} placeholder="Role" style={inp}/>
            <button onClick={()=>removeMember(m.id)} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textDim, cursor:"pointer", borderRadius:8, padding:"9px 11px", fontSize:14 }}>×</button>
          </div>
        ))}
        <Btn onClick={addMember} variant="ghost" size="sm" style={{ marginTop:4 }}>+ Add Team Member</Btn>
        <div style={{ fontSize:11, color:T.textDim, marginTop:10 }}>Team members appear in the user picker on each device and in all field log entries.</div>
      </Card>}

      {/* Thresholds */}
      {stab==="thresholds" && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background:T.accentDim, border:`1px solid ${T.accent}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:T.textMuted, lineHeight:1.6 }}>◈ These values drive automatic alerts in Farm Data across all devices.</div>
        <Card><SLabel t="Soil pH"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Min" type="number" value={local.soilPhMin} onChange={v=>up("soilPhMin",parseFloat(v)||6)} hint="Optimum: 6.0"/>
            <Field label="Max" type="number" value={local.soilPhMax} onChange={v=>up("soilPhMax",parseFloat(v)||7)} hint="Optimum: 7.0"/>
          </div>
        </Card>
        <Card><SLabel t="Soil Moisture"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Min (%)" type="number" value={local.irrigationTargetMin} onChange={v=>up("irrigationTargetMin",parseFloat(v)||35)} hint="Irrigate below this"/>
            <Field label="Max (%)" type="number" value={local.irrigationTargetMax} onChange={v=>up("irrigationTargetMax",parseFloat(v)||65)} hint="Reduce above this"/>
          </div>
        </Card>
        <Card><SLabel t="Pest & Harvest"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Pest Threshold (/wk)" type="number" value={local.pestThreshold}     onChange={v=>up("pestThreshold",parseFloat(v)||15)}     hint="Apply bait spray at or above"/>
            <Field label="Hull Split Trigger (%)" type="number" value={local.harvestHullSplitPct} onChange={v=>up("harvestHullSplitPct",parseFloat(v)||10)} hint="Chandler: 5–10%"/>
          </div>
        </Card>
      </div>}

      {/* Notifications */}
      {stab==="notifications" && <Card>
        <SLabel t="Notification Preferences"/>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { key:"urgentTasks",   label:"Urgent task alerts",    desc:"Red banner when high-priority tasks are overdue"    },
            { key:"weatherAlerts", label:"Weather condition tips", desc:"Smart tips on the calendar and dashboard"           },
            { key:"weeklyBriefing",label:"Weekly planner",         desc:"AI-generated action plan on the dashboard"          },
          ].map(n => (
            <div key={n.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:T.surfaceHover, border:`1px solid ${T.border}`, borderRadius:10 }}>
              <div style={{ flex:1, marginRight:12 }}>
                <div style={{ fontSize:13, fontWeight:500, color:T.text, marginBottom:2 }}>{n.label}</div>
                <div style={{ fontSize:11, color:T.textDim }}>{n.desc}</div>
              </div>
              <button onClick={()=>setLocal(f=>({...f,notifications:{...f.notifications,[n.key]:!f.notifications?.[n.key]}}))}
                style={{ background:local.notifications?.[n.key]?T.accentMuted:T.surface, border:`1px solid ${local.notifications?.[n.key]?T.accent:T.border}`, borderRadius:20, padding:"5px 16px", fontSize:12, color:local.notifications?.[n.key]?"#fff":T.textMuted, cursor:"pointer", fontFamily:"DM Sans,sans-serif", fontWeight:600, transition:"all .15s", flexShrink:0 }}>
                {local.notifications?.[n.key] ? "On" : "Off"}
              </button>
            </div>
          ))}
        </div>
      </Card>}
    </div>
  );
}
