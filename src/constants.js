// ── Design tokens ─────────────────────────────────────────────────────────
export const T = {
  bg:"#0d1117", surface:"#161b22", surfaceHover:"#1c2330", border:"#21262d",
  borderLight:"#30363d", accent:"#3fb950", accentMuted:"#238636", accentDim:"#162820",
  text:"#e6edf3", textMuted:"#8b949e", textDim:"#484f58",
  yellow:"#d29922", yellowDim:"#2d2416", red:"#f85149", redDim:"#2d1414",
  blue:"#58a6ff", blueDim:"#0d1d3a", purple:"#bc8cff", purpleDim:"#1e1535",
  orange:"#f0883e", orangeDim:"#2d1f0d",
};

export const AVATAR_COLORS = [T.accent, T.blue, T.purple, T.orange, T.yellow];

// ── Farm defaults ─────────────────────────────────────────────────────────
export const DEFAULT_FARM = {
  name:"My Walnut Farm", ownerName:"", location:"West Auckland, New Zealand",
  lat:-36.87, lon:174.63, timezone:"Pacific/Auckland", totalHectares:"", established:"",
  blocks:[
    { id:"b1", name:"Chandler North", hectares:"", variety:"Chandler", notes:"" },
    { id:"b2", name:"Chandler South", hectares:"", variety:"Chandler", notes:"" },
    { id:"b3", name:"Howard Block",   hectares:"", variety:"Howard",   notes:"" },
    { id:"b4", name:"Mixed Block",    hectares:"", variety:"Mixed",    notes:"" },
  ],
  varieties:["Chandler","Howard"],
  teamMembers:[
    { id:"t1", name:"Sarah", role:"Farm Manager" },
    { id:"t2", name:"Tom",   role:"Operations" },
  ],
  sprayDryWindowHours:4, pestThreshold:15, irrigationTargetMin:35, irrigationTargetMax:65,
  soilPhMin:6.0, soilPhMax:7.0, harvestHullSplitPct:10,
  notifications:{ urgentTasks:true, weatherAlerts:true, weeklyBriefing:true },
  onboarded:false,
};

// ── localStorage helpers ──────────────────────────────────────────────────
export const LS = {
  farm:     ()  => { try { const s=localStorage.getItem("orchardos_farm"); return s?{...DEFAULT_FARM,...JSON.parse(s)}:DEFAULT_FARM; } catch { return DEFAULT_FARM; } },
  saveFarm: (f) => { try { localStorage.setItem("orchardos_farm", JSON.stringify(f)); } catch {} },
  user:     ()  => { try { const s=localStorage.getItem("orchardos_user"); return s?JSON.parse(s):null; } catch { return null; } },
  saveUser: (u) => { try { localStorage.setItem("orchardos_user", u?JSON.stringify(u):""); } catch {} },
};

// ── Metadata maps ─────────────────────────────────────────────────────────
export const SEASONS = ["Spring","Summer","Autumn","Winter"];
export const SEASON_META = {
  Spring:{ color:T.accent,  dim:T.accentDim,  icon:"🌿" },
  Summer:{ color:T.yellow,  dim:T.yellowDim,  icon:"☀️" },
  Autumn:{ color:T.orange,  dim:T.orangeDim,  icon:"🍂" },
  Winter:{ color:T.blue,    dim:T.blueDim,    icon:"❄️" },
};
export const PRI_META = {
  high:   { color:T.red,     dim:T.redDim,    label:"High" },
  medium: { color:T.yellow,  dim:T.yellowDim, label:"Med"  },
  low:    { color:T.textDim, dim:"#1a1e24",   label:"Low"  },
};
export const CAT_META = {
  "Pruning":      { icon:"✂️",  color:T.purple,   dim:T.purpleDim },
  "Soil":         { icon:"🧪",  color:T.orange,   dim:T.orangeDim },
  "Maintenance":  { icon:"🔧",  color:T.textMuted, dim:"#1a1e24"  },
  "Pest & Disease":{ icon:"🔍", color:T.red,      dim:T.redDim   },
  "Nutrition":    { icon:"🌱",  color:T.accent,   dim:T.accentDim },
  "Water":        { icon:"💧",  color:T.blue,     dim:T.blueDim  },
  "Pollination":  { icon:"🌸",  color:"#f472b6",  dim:"#2d1025"  },
  "Harvest Prep": { icon:"🥜",  color:T.yellow,   dim:T.yellowDim },
  "Harvest":      { icon:"🚜",  color:T.orange,   dim:T.orangeDim },
};

export const NZ_REGIONS = ["Northland","Auckland / West Auckland","Waikato","Bay of Plenty","Gisborne / Hawke's Bay","Manawatū-Whanganui","Nelson / Marlborough","Canterbury","Otago","Southland","Other"];
export const WALNUT_VARIETIES = ["Chandler","Howard","Franquette","Lara","Fernor","Rex","Midland","Cisco","Payne","Other"];
export const DATA_TYPES = ["Yield","Soil Moisture","Soil pH","Pest Count","Kernel Quality","Irrigation Usage","Fertiliser Applied","Temperature","Rainfall","Other"];
export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Activity templates ────────────────────────────────────────────────────
export const ACT_TEMPLATES = [
  { id:"dormant_prune",   name:"Dormant Pruning",           season:"Winter", category:"Pruning",       description:"Remove dead/crossing branches before bud swell.",      icon:"✂️",  priority:"high"   },
  { id:"soil_test",       name:"Soil Testing",               season:"Winter", category:"Soil",          description:"Test pH, nutrients, organic matter before season.",    icon:"🧪",  priority:"medium" },
  { id:"equipment_svc",   name:"Equipment Servicing",        season:"Winter", category:"Maintenance",   description:"Service shakers, sweepers, irrigation systems.",       icon:"🔧",  priority:"medium" },
  { id:"dormant_spray",   name:"Dormant Oil Spray",          season:"Winter", category:"Pest & Disease", description:"Horticultural oil to smother overwintering pests.",    icon:"🛢️", priority:"medium" },
  { id:"fertilise_n",     name:"Nitrogen Fertilisation",     season:"Spring", category:"Nutrition",     description:"Apply nitrogen at bud burst from soil test results.",  icon:"🌱",  priority:"high"   },
  { id:"irrigation_start",name:"Irrigation Start",           season:"Spring", category:"Water",         description:"Begin irrigation as temperatures rise.",               icon:"💧",  priority:"high"   },
  { id:"pest_monitor",    name:"Pest Monitoring",            season:"Spring", category:"Pest & Disease", description:"Set husk fly, aphid, codling moth traps.",             icon:"🔍",  priority:"high"   },
  { id:"catkin_check",    name:"Pollination Check",          season:"Spring", category:"Pollination",   description:"Monitor pollen shed and cross-pollination.",           icon:"🌸",  priority:"medium" },
  { id:"canopy_spray",    name:"Foliar Blight Spray",        season:"Spring", category:"Pest & Disease", description:"Copper-based fungicide after rain events.",            icon:"💨",  priority:"high"   },
  { id:"summer_water",    name:"Irrigation Optimisation",    season:"Summer", category:"Water",         description:"Increase frequency during hull fill.",                 icon:"☀️",  priority:"high"   },
  { id:"husk_fly",        name:"Husk Fly Management",        season:"Summer", category:"Pest & Disease", description:"Apply bait sprays when counts exceed threshold.",      icon:"🪲",  priority:"high"   },
  { id:"summer_fert",     name:"Summer Nutrition Check",     season:"Summer", category:"Nutrition",     description:"Foliar zinc and boron for kernel development.",         icon:"🌿",  priority:"medium" },
  { id:"hull_split",      name:"Hull Split Monitoring",      season:"Autumn", category:"Harvest Prep",  description:"Check hull split at 5–10% as harvest trigger.",        icon:"🥜",  priority:"high"   },
  { id:"harvest",         name:"Mechanical Harvest",         season:"Autumn", category:"Harvest",       description:"Shake and sweep within 2 weeks of hull split.",        icon:"🚜",  priority:"high"   },
  { id:"drying",          name:"Post-Harvest Drying",        season:"Autumn", category:"Harvest",       description:"Dry to 8% moisture content.",                          icon:"🌬️", priority:"high"   },
  { id:"hull_removal",    name:"Hulling & Washing",          season:"Autumn", category:"Harvest",       description:"Remove hulls promptly to prevent staining.",           icon:"⚙️",  priority:"medium" },
  { id:"post_fert",       name:"Post-Harvest Fertilisation", season:"Autumn", category:"Nutrition",     description:"Apply K and P to replenish reserves.",                 icon:"🌿",  priority:"medium" },
  { id:"cover_crop",      name:"Cover Crop Sowing",          season:"Autumn", category:"Soil",          description:"Sow legume cover crops between rows.",                 icon:"🌾",  priority:"low"    },
  { id:"irr_shutdown",    name:"Irrigation Shutdown",        season:"Autumn", category:"Water",         description:"Cease irrigation as trees enter dormancy.",            icon:"🚫",  priority:"medium" },
];

export const ACT_GUIDANCE = {
  dormant_prune:   "✂️ Prune to open vase shape. Remove branches >1/3 parent diameter. Seal large cuts. Best June–July in NZ.",
  soil_test:       "🧪 Sample 5+ locations per block at 10–20cm. Test N, P, K, pH, trace elements. Use the same lab each year.",
  fertilise_n:     "🌱 60% at bud burst, 40% post-hull split. Avoid within 4 weeks of harvest. Typical 80–120 kg N/ha.",
  pest_monitor:    "🔍 Pherocon AM traps at 1/ha. Check weekly from October. Action threshold: 15 adults/trap/week.",
  canopy_spray:    "💨 Copper hydroxide 600g/100L after rain >2mm. Do NOT spray >30°C or if rain forecast within 4 hours.",
  hull_split:      "🥜 Walk 3 rows per block, sample 10 nuts per tree. Trigger: 5–10% split Chandler, 10–15% Howard.",
  harvest:         "🚜 Complete within 10–14 days of trigger. Sweep within 4 hours of shaking.",
  drying:          "🌬️ Target 8% kernel moisture at 35–40°C. Test with a moisture meter — don't rely on timing alone.",
  irrigation_start:"💧 Start when soil moisture drops below 40% at 30cm depth.",
  husk_fly:        "🪲 Protein bait (Success Neo) at 250ml/tree on south-facing trunk. Reapply after 30mm rain.",
};

// ── Pure helpers ──────────────────────────────────────────────────────────
export function wmoLabel(c) {
  if (c===0)  return { icon:"☀️",  label:"Clear" };
  if (c<=2)   return { icon:"⛅",  label:"Partly cloudy" };
  if (c===3)  return { icon:"☁️",  label:"Overcast" };
  if (c<=49)  return { icon:"🌫️", label:"Fog" };
  if (c<=67)  return { icon:"🌧️", label:"Rain" };
  if (c<=77)  return { icon:"❄️",  label:"Snow" };
  if (c<=82)  return { icon:"🌦️", label:"Showers" };
  if (c<=99)  return { icon:"⛈️", label:"Storm" };
  return { icon:"🌡️", label:"Unknown" };
}

export function initials(name) {
  return (name || "?").split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

export function userColor(name, teamMembers) {
  const idx = teamMembers.filter(m => m.name).findIndex(m => m.name === name);
  return AVATAR_COLORS[idx >= 0 ? idx % AVATAR_COLORS.length : 0];
}

export function getDataAlert(type, value, farm) {
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  const pH    = [farm.soilPhMin || 6, farm.soilPhMax || 7];
  const moist = [farm.irrigationTargetMin || 35, farm.irrigationTargetMax || 65];
  const thr   = farm.pestThreshold || 15;
  if (type === "Soil pH") {
    if (v < 5.5)       return { level:"high",   msg:`pH critically low. Apply lime at 2–3 t/ha and retest in 6 weeks.` };
    if (v < pH[0])     return { level:"medium", msg:`pH below target (${pH[0]}–${pH[1]}). Apply lime.` };
    if (v > pH[1]+0.5) return { level:"medium", msg:`pH above target. Consider sulphur.` };
    return               { level:"ok",     msg:`pH in target range (${pH[0]}–${pH[1]}).` };
  }
  if (type === "Soil Moisture") {
    if (v < 25)          return { level:"high",   msg:"Critically low. Irrigate immediately." };
    if (v < moist[0])    return { level:"medium", msg:`Below target (${moist[0]}–${moist[1]}%). Increase irrigation.` };
    if (v > moist[1]+10) return { level:"medium", msg:"Very high. Reduce irrigation — risk of root disease." };
    return                 { level:"ok",     msg:`Within target (${moist[0]}–${moist[1]}%).` };
  }
  if (type === "Pest Count") {
    if (v >= thr)       return { level:"high",   msg:`At action threshold (${thr}/trap/week). Apply bait spray now.` };
    if (v >= thr * 0.6) return { level:"medium", msg:"Approaching threshold. Monitor twice weekly." };
    return                { level:"ok",     msg:`Below threshold (${thr}/trap/week). Continue monitoring.` };
  }
  if (type === "Kernel Quality") {
    if (v < 7) return { level:"high", msg:"Below acceptable grade. Review post-harvest drying protocol." };
    return       { level:"ok",  msg:"Within acceptable quality range." };
  }
  return null;
}

export function generateWeeklyPlan(acts, weather, logs, farm) {
  const T_ = { red:"#f85149", blue:"#58a6ff", accent:"#3fb950", yellow:"#d29922", orange:"#f0883e", purple:"#bc8cff" };
  const wxArr = Object.entries(weather).slice(0, 7);
  const rainyDays = wxArr.filter(([,w]) => w.precip >= 5).length;
  const hotDays   = wxArr.filter(([,w]) => w.tmax >= 28).length;
  const goodSpray = wxArr.filter(([,w]) => w.precip < 2 && w.code <= 3).map(([d]) => d).slice(0, 3);
  const pending   = acts.filter(a => a.status !== "done" && a.priority === "high");
  const overdue   = pending.filter(a => a.scheduledDate && a.scheduledDate < new Date().toISOString().slice(0,10));
  const items = [];
  if (overdue.length)   items.push({ icon:"⚠️", color:T_.red,    text:`${overdue.length} overdue task${overdue.length>1?"s":""}: ${overdue.slice(0,2).map(a=>a.name).join(", ")}` });
  if (rainyDays >= 3)   items.push({ icon:"🌧️",color:T_.blue,   text:`${rainyDays} rainy days forecast — hold off spraying and cultivation.` });
  if (goodSpray.length) items.push({ icon:"💨", color:T_.accent,  text:`Good spray windows: ${goodSpray.join(", ")}` });
  if (hotDays >= 2)     items.push({ icon:"🌡️",color:T_.yellow,  text:`${hotDays} hot days (28°C+) — check irrigation and work early mornings.` });
  const recentPest = logs.find(l => l.category === "Pest & Disease");
  if (recentPest) items.push({ icon:"🔍", color:T_.orange, text:`Last pest log: ${recentPest.date} — confirm trap counts recorded this week.` });
  if (pending.length)   items.push({ icon:"📋", color:T_.purple,  text:`${pending.length} high-priority ${farm.name} tasks still pending.` });
  if (!items.length)    items.push({ icon:"✅", color:T_.accent,  text:"No urgent actions flagged. Good week for monitoring and data collection." });
  return items;
}

export async function callClaude(system, userMsg, history = []) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages:[...history,{role:"user",content:userMsg}] }),
  });
  const data = await res.json();
  return data.content?.map(c => c.text || "").join("") || "No response.";
}
