import { useState, useEffect, useRef } from "react";
import { sb, sbLoadFarm, sbSaveFarm, sbLoadLogs, sbInsertLog, sbLoadData, sbInsertData, sbLoadPhotos, sbInsertPhoto, sbLoadActStatus, sbSaveActStatus } from "./supabase.js";
import { T, LS, DEFAULT_FARM, SEASONS, SEASON_META, PRI_META, CAT_META, ACT_TEMPLATES, ACT_GUIDANCE, DATA_TYPES, MONTH_NAMES, WALNUT_VARIETIES, AVATAR_COLORS, initials, userColor, getDataAlert, generateWeeklyPlan, wmoLabel, callClaude } from "./constants.js";
import { Chip, Dot, ProgressBar, Card, Btn, SLabel, CatChip, FilterPill, GroupHeader, AiInsight, DataAlert, Field, SyncDot, UserAvatar, Onboarding, UserPicker, Settings } from "./components.jsx";

function useBreakpoint() {
  const [bp, setBp] = useState(() => w2bp(window.innerWidth));
  useEffect(() => {
    const h = () => setBp(w2bp(window.innerWidth));
    window.addEventListener("resize", h);
    window.addEventListener("orientationchange", () => setTimeout(h, 120));
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}
function w2bp(w) { return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop"; }

function ActivityRow({ a, setActStatus, setEditAct, actInsight, onInsight, weather, isMobile }) {
  const guide  = ACT_GUIDANCE[a.id];
  const isOpen = actInsight.id === a.id;
  const goodDay = Object.entries(weather).find(([,w]) => w.precip < 2 && w.code <= 3);
  const isSpray = a.category === "Pest & Disease" || a.category === "Nutrition";
  const statusSelect = (
    <select value={a.status} onChange={e=>setActStatus(a.id,e.target.value)} style={{background:a.status==="done"?T.accentDim:a.status==="in_progress"?T.yellowDim:T.surfaceHover,color:a.status==="done"?T.accent:a.status==="in_progress"?T.yellow:T.textMuted,border:`1px solid ${a.status==="done"?T.accent+"55":a.status==="in_progress"?T.yellow+"55":T.border}`,borderRadius:8,padding:isMobile?"5px 8px":"6px 10px",fontSize:isMobile?11:12,fontFamily:"DM Sans,sans-serif",cursor:"pointer",outline:"none"}}>
      <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="done">Done ✓</option>
    </select>
  );
  return (
    <Card style={{padding:isMobile?"10px 12px":"12px 16px"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <span style={{fontSize:16,width:22,textAlign:"center",flexShrink:0,marginTop:2}}>{a.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:600,color:T.text}}>{a.name}</span>
            <Chip color={SEASON_META[a.season].color} dim={SEASON_META[a.season].dim} small>{a.season}</Chip>
            <Chip color={PRI_META[a.priority].color}  dim={PRI_META[a.priority].dim}  small>{PRI_META[a.priority].label}</Chip>
            {!isMobile&&a.assignee&&<Chip color={T.purple} dim={T.purpleDim} small>👤 {a.assignee}</Chip>}
            {!isMobile&&a.scheduledDate&&<Chip color={T.blue} dim={T.blueDim} small>📅 {a.scheduledDate}</Chip>}
            {!isMobile&&isSpray&&goodDay&&<Chip color={T.accent} dim={T.accentDim} small>✅ Spray: {goodDay[0]}</Chip>}
          </div>
          {!isMobile&&<div style={{fontSize:11,color:T.textMuted,lineHeight:1.5,marginBottom:4}}>{a.description}</div>}
          {!isMobile&&a.notes&&<div style={{fontSize:10,color:T.textDim,fontStyle:"italic"}}>"{a.notes}"</div>}
          {isMobile&&<div style={{display:"flex",gap:6,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
            {statusSelect}
            <button onClick={()=>setEditAct({...a})} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 9px",color:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Edit</button>
            <button onClick={()=>onInsight(a)} style={{background:"transparent",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif",padding:0}}>◈ {isOpen?"Hide":"Guide"}</button>
          </div>}
        </div>
        {!isMobile&&<div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
          <Btn onClick={()=>onInsight(a)} variant={isOpen?"active":"ghost"} size="sm" style={{fontSize:10}}>◈ {isOpen?"Hide":"Guide"}</Btn>
          <button onClick={()=>setEditAct({...a})} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Edit</button>
          {statusSelect}
        </div>}
      </div>
      {guide&&a.status!=="done"&&!isMobile&&<div style={{marginTop:8,background:T.surfaceHover,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:11,color:T.textMuted,lineHeight:1.7}}>{guide}</div>}
      {isOpen&&<AiInsight text={actInsight.text} loading={actInsight.loading} color={T.purple}/>}
    </Card>
  );
}

function LogRow({ l, logSugg, onSuggest, isMobile, farm }) {
  const isSugg = logSugg.id===l.id||logSugg.id===l._sbid;
  const uN = l.user||l.user_name||"?";
  const uC = userColor(uN, farm.teamMembers);
  return (
    <Card style={{padding:isMobile?"10px 12px":"12px 16px"}}>
      <div style={{display:"flex",gap:10}}>
        <div style={{width:28,height:28,borderRadius:8,background:`${uC}22`,border:`1px solid ${uC}44`,display:"grid",placeItems:"center",fontSize:10,fontWeight:700,color:uC,fontFamily:"DM Mono,monospace",flexShrink:0,marginTop:2}}>{initials(uN)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{fontSize:isMobile?12:13,fontWeight:600,color:T.text}}>{l.activity}</span>
            {l.category&&<CatChip category={l.category} small/>}
            {l.block&&!isMobile&&<Chip color={T.blue} dim={T.blueDim} small>{l.block}</Chip>}
          </div>
          <div style={{fontSize:isMobile?11:12,color:T.textMuted,lineHeight:1.5}}>{l.note}</div>
          <div style={{fontSize:10,color:T.textDim,marginTop:3}}>{l.date}{uN!=="?"?` · ${uN}`:""}{l.weather&&!isMobile?` · 🌤 ${l.weather}`:""}</div>
          {isSugg&&<AiInsight text={logSugg.text} loading={logSugg.loading} color={T.orange}/>}
          {!isSugg&&<button onClick={()=>onSuggest(l)} style={{background:"transparent",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif",marginTop:5,padding:0}}>◈ What should I do next?</button>}
        </div>
      </div>
    </Card>
  );
}

export default function App() {
  const bp=useBreakpoint(); const isMobile=bp==="mobile"; const isTablet=bp==="tablet"; const isDesktop=bp==="desktop";
  const [sidebarOpen,setSidebarOpen]=useState(false); const [showMore,setShowMore]=useState(false);
  const [farm,setFarmState]=useState(()=>LS.farm());
  const [currentUser,setCU]=useState(()=>LS.user());
  const [syncStatus,setSync]=useState("idle");
  function setFarm(f){setFarmState(f);LS.saveFarm(f);}
  function setCurrentUser(u){setCU(u);LS.saveUser(u);}
  const [acts,setActs]=useState(()=>ACT_TEMPLATES.map(t=>({...t,status:"pending",scheduledDate:"",assignee:"",notes:""})));
  const [logs,setLogs]=useState([]); const [dataE,setDataE]=useState([]); const [photos,setPhotos]=useState([]); const [dbLoaded,setLoaded]=useState(false);
  const [tab,setTab]=useState("dashboard");
  const [fSeason,setFSeason]=useState("All"); const [fStatus,setFStatus]=useState("All"); const [fCat,setFCat]=useState("All");
  const [actView,setActView]=useState("grouped"); const [logCat,setLogCat]=useState("All"); const [logView,setLogView]=useState("grouped");
  const [showForm,setShowForm]=useState(null);
  const [logF,setLogF]=useState({activity:"",date:"",note:"",weather:"",user:"",block:"",category:""});
  const [dataF,setDataF]=useState({type:"",value:"",unit:"",block:"",date:"",note:""});
  const [photoF,setPhotoF]=useState({caption:"",date:"",block:"",emoji:""});
  const [photoFile,setPhotoFile]=useState(null); const [photoPreview,setPreview]=useState(null); const [uploading,setUploading]=useState(false);
  const [editAct,setEditAct]=useState(null);
  const [calYear,setCalYear]=useState(()=>new Date().getFullYear()); const [calMonth,setCalMonth]=useState(()=>new Date().getMonth()); const [selDay,setSelDay]=useState(null);
  const [weather,setWeather]=useState({}); const [wxLoad,setWxLoad]=useState(false);
  const [aiMsgs,setAiMsgs]=useState([]); const [aiIn,setAiIn]=useState(""); const [aiLoad,setAiLoad]=useState(false);
  const [briefing,setBriefing]=useState(""); const [briefLoad,setBriefLoad]=useState(false);
  const [logSugg,setLogSugg]=useState({id:null,text:"",loading:false});
  const [actInsight,setActI]=useState({id:null,text:"",loading:false});
  const [dataInsight,setDataI]=useState({id:null,text:"",loading:false});
  const aiEnd=useRef(null); const photoInput=useRef(null);

  useEffect(()=>{aiEnd.current?.scrollIntoView({behavior:"smooth"});},[aiMsgs]);
  useEffect(()=>{if(currentUser)setLogF(f=>({...f,user:currentUser.name}));},[currentUser?.name]);
  useEffect(()=>{if(isDesktop){setSidebarOpen(false);setShowMore(false);}},[isDesktop]);
  useEffect(()=>{if(farm.onboarded&&currentUser)loadAll();},[farm.onboarded,currentUser?.name]);
  useEffect(()=>{fetchWeather();},[farm.lat,farm.lon]);

  async function loadAll(){
    setSync("syncing");
    try{
      const remoteFarm=await sbLoadFarm();
      if(remoteFarm?.onboarded){setFarmState(remoteFarm);LS.saveFarm(remoteFarm);}
      const[rLogs,rData,rPhotos,rActStatus]=await Promise.all([sbLoadLogs(),sbLoadData(),sbLoadPhotos(),sbLoadActStatus()]);
      setLogs(rLogs);setDataE(rData);setPhotos(rPhotos);
      setActs(prev=>prev.map(a=>rActStatus[a.id]?{...a,...rActStatus[a.id]}:a));
      setLoaded(true);setSync("synced");
    }catch{setSync("error");setLoaded(true);}
  }

  useEffect(()=>{
    if(!farm.onboarded||!currentUser)return;
    const logSub=sb.channel("logs-rt").on("postgres_changes",{event:"INSERT",schema:"public",table:"field_logs"},p=>{
      const n={...p.new.data,id:p.new.id,_sbid:p.new.id,user_name:p.new.user_name};
      setLogs(prev=>prev.find(l=>l._sbid===n._sbid)?prev:[n,...prev]);
    }).subscribe();
    const dataSub=sb.channel("data-rt").on("postgres_changes",{event:"INSERT",schema:"public",table:"farm_data"},p=>{
      const n={...p.new.data,id:p.new.id,_sbid:p.new.id,user_name:p.new.user_name};
      setDataE(prev=>prev.find(d=>d._sbid===n._sbid)?prev:[n,...prev]);
    }).subscribe();
    const photoSub=sb.channel("photos-rt").on("postgres_changes",{event:"INSERT",schema:"public",table:"photos"},p=>{
      const n={...p.new.data,id:p.new.id,_sbid:p.new.id,url:p.new.url,user_name:p.new.user_name};
      setPhotos(prev=>prev.find(x=>x._sbid===n._sbid)?prev:[n,...prev]);
    }).subscribe();
    const actSub=sb.channel("acts-rt").on("postgres_changes",{event:"*",schema:"public",table:"activity_status"},p=>{
      const r=p.new;
      setActs(prev=>prev.map(a=>a.id===r.act_id?{...a,status:r.status,scheduledDate:r.scheduled_date||"",assignee:r.assignee||"",notes:r.notes||""}:a));
    }).subscribe();
    return()=>{sb.removeChannel(logSub);sb.removeChannel(dataSub);sb.removeChannel(photoSub);sb.removeChannel(actSub);};
  },[farm.onboarded,currentUser?.name]);

  async function fetchWeather(){
    setWxLoad(true);
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${farm.lat}&longitude=${farm.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=${encodeURIComponent(farm.timezone||"Pacific/Auckland")}&forecast_days=16`;
      const res=await fetch(url);const d=await res.json();const map={};
      if(d.daily)d.daily.time.forEach((date,i)=>{map[date]={tmax:Math.round(d.daily.temperature_2m_max[i]),tmin:Math.round(d.daily.temperature_2m_min[i]),precip:Math.round(d.daily.precipitation_sum[i]*10)/10,code:d.daily.weather_code[i]};});
      setWeather(map);
    }catch{}
    setWxLoad(false);
  }

  const wxSnippet=()=>Object.entries(weather).slice(0,7).map(([d,w])=>`${d}: ${wmoLabel(w.code).label} ${w.tmax}°/${w.tmin}°, ${w.precip}mm`).join("; ");
  const farmCtx=()=>`Farm: ${farm.name}, ${farm.location}. Blocks: ${farm.blocks.map(b=>`${b.name}(${b.variety})`).join(", ")||"not set"}. Thresholds: pH ${farm.soilPhMin}–${farm.soilPhMax}, moisture ${farm.irrigationTargetMin}–${farm.irrigationTargetMax}%, pest ${farm.pestThreshold}/wk.`;
  const userCtx=()=>`Current user: ${currentUser?.name||"unknown"} (${currentUser?.role||"team member"}).`;

  async function generateBriefing(){
    setBriefLoad(true);setBriefing("");
    const sys=`You are a practical walnut farm advisor for ${farm.name} in ${farm.location}. ${userCtx()} Write a daily briefing (4–6 bullet points using •). Cover urgent actions, weather, and one best-practice tip. Address by first name.`;
    const msg=`${acts.filter(a=>a.status==="done").length}/${acts.length} done. Urgent: ${acts.filter(a=>a.status!=="done"&&a.priority==="high").map(a=>a.name).join(", ")||"none"}. Recent: ${logs.slice(0,3).map(l=>`${l.date} ${l.activity}: ${l.note}`).join("; ")||"none"}. Forecast: ${wxSnippet()||"unavailable"}.`;
    try{const r=await callClaude(sys,msg);setBriefing(r);}catch{setBriefing("Could not generate briefing.");}
    setBriefLoad(false);
  }
  async function generateLogSuggestion(log){
    setLogSugg({id:log.id,text:"",loading:true});
    try{const r=await callClaude(`Walnut farm advisor for ${farm.name}. Suggest the most important follow-up action in 1–2 sentences.`,`Activity: ${log.activity} on ${log.date} at ${log.block||"farm"}. Notes: "${log.note}"`);setLogSugg({id:log.id,text:r,loading:false});}
    catch{setLogSugg({id:log.id,text:"Could not generate suggestion.",loading:false});}
  }
  async function generateActInsight(act){
    if(actInsight.id===act.id){setActI({id:null,text:"",loading:false});return;}
    setActI({id:act.id,text:"",loading:true});
    try{const r=await callClaude(`Walnut farm advisor for ${farm.name}. ${farmCtx()} Give practical guidance for one activity. 3–5 bullet points using •.`,`Activity: "${act.name}" (${act.category}, ${act.season}). ${act.description}. Forecast: ${wxSnippet()||"unavailable"}. Status: ${act.status}${act.notes?". Notes: "+act.notes:""}`);setActI({id:act.id,text:r,loading:false});}
    catch{setActI({id:act.id,text:"Could not generate guidance.",loading:false});}
  }
  async function generateDataInsight(entry){
    if(dataInsight.id===entry.id){setDataI({id:null,text:"",loading:false});return;}
    setDataI({id:entry.id,text:"",loading:true});
    const hist=dataE.filter(d=>d.type===entry.type&&d.block===entry.block&&d._sbid!==entry._sbid).slice(0,3);
    try{const r=await callClaude(`Walnut farm data analyst for ${farm.name}. ${farmCtx()} Interpret this measurement. 2–3 action points using •.`,`${entry.type} = ${entry.value} ${entry.unit} at ${entry.block} on ${entry.date}. Previous: ${hist.length?hist.map(h=>`${h.date}: ${h.value}${h.unit}`).join(", "):"none"}.`);setDataI({id:entry.id,text:r,loading:false});}
    catch{setDataI({id:entry.id,text:"Could not generate analysis.",loading:false});}
  }
  async function sendAI(){
    const q=aiIn.trim();if(!q)return;
    setAiIn("");setAiLoad(true);
    const msgs=[...aiMsgs,{role:"user",content:q}];setAiMsgs(msgs);
    const sys=`Expert walnut advisor. ${farmCtx()} ${userCtx()} Status: ${acts.filter(a=>a.status==="done").length}/${acts.length} done. Urgent: ${acts.filter(a=>a.priority==="high"&&a.status==="pending").length}. Logs: ${logs.slice(0,3).map(l=>`${l.date}: ${l.activity}—${l.note}`).join("; ")}. Forecast: ${wxSnippet()||"unavailable"}. Be concise, practical, NZ-specific. Address by first name.`;
    try{const r=await callClaude(sys,q,aiMsgs);setAiMsgs([...msgs,{role:"assistant",content:r}]);}
    catch{setAiMsgs([...msgs,{role:"assistant",content:"Connection error. Please try again."}]);}
    setAiLoad(false);
  }

  function saveEditAct(){setActs(p=>p.map(a=>a.id===editAct.id?editAct:a));sbSaveActStatus(editAct.id,editAct,currentUser?.name);setEditAct(null);}
  async function setActStatus(id,status){
    setActs(p=>p.map(a=>a.id===id?{...a,status}:a));
    const act=acts.find(a=>a.id===id);if(act)await sbSaveActStatus(id,{...act,status},currentUser?.name);setSync("synced");
  }
  async function submitLog(){
    if(!logF.activity||!logF.date||!logF.note)return;
    const cat=logF.category||(ACT_TEMPLATES.find(a=>a.name===logF.activity)?.category)||"General";
    const newLog={...logF,user:logF.user||currentUser?.name||"",category:cat,id:Date.now()};
    setSync("syncing");const saved=await sbInsertLog(newLog,currentUser?.name);
    setLogs(p=>[saved,...p]);setLogF({activity:"",date:"",note:"",weather:"",user:currentUser?.name||"",block:"",category:""});setShowForm(null);setSync("synced");
    setTimeout(()=>generateLogSuggestion(saved),200);
  }
  async function submitData(){
    if(!dataF.type||!dataF.value||!dataF.date)return;setSync("syncing");
    const saved=await sbInsertData({...dataF,id:Date.now()},currentUser?.name);
    setDataE(p=>[saved,...p]);setDataF({type:"",value:"",unit:"",block:"",date:"",note:""});setShowForm(null);setSync("synced");
  }
  function handlePhotoFile(e){
    const file=e.target.files?.[0];if(!file)return;setPhotoFile(file);
    const reader=new FileReader();reader.onload=ev=>setPreview(ev.target?.result);reader.readAsDataURL(file);
    setPhotoF(f=>({...f,date:f.date||todayStr}));
  }
  async function submitPhoto(){
    if(!photoF.caption||!photoF.date)return;setUploading(true);setSync("syncing");
    const saved=await sbInsertPhoto({...photoF,emoji:photoF.emoji||"📸",id:Date.now()},currentUser?.name,photoFile||undefined);
    setPhotos(p=>[saved,...p]);setPhotoF({caption:"",date:"",block:"",emoji:""});setPhotoFile(null);setPreview(null);setShowForm(null);setUploading(false);setSync("synced");
  }

  const done=acts.filter(a=>a.status==="done").length;
  const inProg=acts.filter(a=>a.status==="in_progress").length;
  const urgent=acts.filter(a=>a.priority==="high"&&a.status==="pending").length;
  const allCats=Object.keys(CAT_META);
  const todayStr=new Date().toISOString().slice(0,10);
  const BLOCKS=farm.blocks.map(b=>b.name).concat(["All Blocks"]);
  const TEAM_NAMES=farm.teamMembers.filter(m=>m.name).map(m=>m.name);
  const uColor=userColor(currentUser?.name||"",farm.teamMembers);
  const filteredActs=acts.filter(a=>(fSeason==="All"||a.season===fSeason)&&(fStatus==="All"||a.status===fStatus)&&(fCat==="All"||a.category===fCat));
  const filteredLogs=logCat==="All"?logs:logs.filter(l=>l.category===logCat);
  const actsByCategory=allCats.reduce((acc,cat)=>{const items=filteredActs.filter(a=>a.category===cat);if(items.length)acc[cat]=items;return acc;},{});
  const logsByCategory=[...new Set(filteredLogs.map(l=>l.category||"General"))].reduce((acc,cat)=>{acc[cat]=filteredLogs.filter(l=>(l.category||"General")===cat);return acc;},{});
  const calEvents={};
  acts.filter(a=>a.scheduledDate).forEach(a=>{if(!calEvents[a.scheduledDate])calEvents[a.scheduledDate]=[];calEvents[a.scheduledDate].push({label:a.name,color:PRI_META[a.priority].color,type:"activity"});});
  logs.forEach(l=>{if(!calEvents[l.date])calEvents[l.date]=[];calEvents[l.date].push({label:l.activity,color:T.blue,type:"log"});});
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const weeklyPlan=generateWeeklyPlan(acts,weather,logs,farm);
  const statGrid=isMobile?"1fr 1fr":"repeat(4,1fr)";
  const twoCol=isMobile?"1fr":"1fr 1fr";
  const threeCol=isMobile?"1fr 1fr":"repeat(3,1fr)";

  if(!farm.onboarded)return<Onboarding onComplete={f=>{setFarmState(f);LS.saveFarm(f);}} isMobile={isMobile}/>;
  if(!currentUser)return<UserPicker farm={farm} onSelect={u=>{LS.saveUser(u);setCU(u);}} isMobile={isMobile}/>;
  if(!dbLoaded)return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:40,marginBottom:16}}>🌰</div><div style={{fontSize:14,color:T.textMuted,marginBottom:8}}>Loading {farm.name}…</div><div style={{display:"flex",gap:5,justifyContent:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.accent,animation:`blink 1.2s ${i*0.2}s infinite`}}/>)}</div></div>
    </div>
  );

  const TABS=[{id:"dashboard",icon:"▦",label:"Overview"},{id:"activities",icon:"✓",label:"Activities"},{id:"calendar",icon:"⊞",label:"Calendar"},{id:"logs",icon:"≡",label:"Field Log"},{id:"data",icon:"◉",label:"Data"},{id:"photos",icon:"⊡",label:"Photos"},{id:"advisor",icon:"◈",label:"AI",badge:true},{id:"settings",icon:"⚙",label:"Settings"}];
  const BOTTOM_BAR_H=60;
  const PRIMARY_IDS=["dashboard","activities","logs","advisor"];
  const MORE_TABS=TABS.filter(t=>!PRIMARY_IDS.includes(t.id));
  const isMoreActive=MORE_TABS.some(t=>t.id===tab);

  const sidebarEl=(
    <nav style={{width:214,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:isDesktop?"sticky":"fixed",top:0,left:0,zIndex:isDesktop?1:50,height:"100vh",overflow:"auto",transform:isTablet&&!sidebarOpen?"translateX(-100%)":"translateX(0)",transition:isTablet?"transform .25s ease":"none"}}>
      <div style={{padding:"18px 16px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:10,display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>🌰</div>
          <div><div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.2}}>{farm.name}</div><div style={{fontSize:10,color:T.textMuted,letterSpacing:"0.06em"}}>{farm.location.split(",")[0]}</div></div>
        </div>
        {isTablet&&<button onClick={()=>setSidebarOpen(false)} style={{background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontSize:20,padding:"2px 4px",marginLeft:4}}>×</button>}
      </div>
      {urgent>0&&<div style={{margin:"0 12px 10px",background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"7px 10px",fontSize:11,color:T.red,fontWeight:600,display:"flex",gap:6}}>⚠ {urgent} urgent</div>}
      <div style={{padding:"0 8px",flex:1}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);if(isTablet)setSidebarOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:tab===t.id?T.accentDim:"transparent",color:tab===t.id?T.accent:T.textMuted,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:tab===t.id?600:400,fontFamily:"DM Sans,sans-serif",textAlign:"left",marginBottom:1,transition:"all .1s"}}>
            <span style={{fontFamily:"monospace",fontSize:13,width:16,textAlign:"center",flexShrink:0}}>{t.icon}</span>
            <span style={{flex:1}}>{t.label}</span>
            {t.badge&&<span style={{background:`${T.purple}22`,color:T.purple,border:`1px solid ${T.purple}33`,borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:700}}>AI</span>}
          </button>
        ))}
      </div>
      {(()=>{const w=weather[todayStr];if(!w)return null;const wmo=wmoLabel(w.code);return(
        <div style={{margin:"0 8px 8px",background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:10,color:T.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Today</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{wmo.icon}</span>
            <div><div style={{fontSize:12,fontWeight:600,color:T.text}}>{w.tmax}° / {w.tmin}°C</div><div style={{fontSize:11,color:T.textMuted}}>{wmo.label}{w.precip>0?` · 💧${w.precip}mm`:""}</div></div>
          </div>
        </div>
      );})()}
      <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <UserAvatar name={currentUser.name} teamMembers={farm.teamMembers} size={30}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
            {currentUser.role&&<div style={{fontSize:10,color:T.textDim}}>{currentUser.role}</div>}
          </div>
          <button onClick={()=>setCurrentUser(null)} title="Switch user" style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.textDim,fontSize:10,cursor:"pointer",fontFamily:"DM Sans,sans-serif",flexShrink:0}}>↔</button>
        </div>
        <SyncDot status={syncStatus}/>
      </div>
    </nav>
  );

  const mobileHeader=(
    <div style={{position:"sticky",top:0,zIndex:40,background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:28,height:28,background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:8,display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>🌰</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{farm.name}</div>
        <div style={{fontSize:10,color:T.textMuted,display:"flex",alignItems:"center",gap:6}}><span>{TABS.find(t=>t.id===tab)?.label||""}</span><SyncDot status={syncStatus}/></div>
      </div>
      {urgent>0&&<div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:6,padding:"3px 8px",fontSize:10,color:T.red,fontWeight:700,flexShrink:0}}>⚠ {urgent}</div>}
      {(()=>{const w=weather[todayStr];if(!w)return null;const wmo=wmoLabel(w.code);return<div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}><span style={{fontSize:16}}>{wmo.icon}</span><span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>{w.tmax}°</span></div>;})()}
      <div onClick={()=>setCurrentUser(null)} style={{width:28,height:28,borderRadius:8,background:`${uColor}22`,border:`1px solid ${uColor}44`,display:"grid",placeItems:"center",fontSize:11,fontWeight:700,color:uColor,cursor:"pointer",flexShrink:0,fontFamily:"DM Mono,monospace"}}>{initials(currentUser.name)}</div>
    </div>
  );

  const tabletHeader=(
    <div style={{position:"sticky",top:0,zIndex:40,background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
      <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:8,width:36,height:36,cursor:"pointer",display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>☰</button>
      <div style={{width:28,height:28,background:T.accentDim,border:`1px solid ${T.accent}33`,borderRadius:8,display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>🌰</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{farm.name}</div></div>
      <SyncDot status={syncStatus}/>
      {urgent>0&&<div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:6,padding:"3px 8px",fontSize:10,color:T.red,fontWeight:700}}>⚠ {urgent}</div>}
      {(()=>{const w=weather[todayStr];if(!w)return null;const wmo=wmoLabel(w.code);return<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:16}}>{wmo.icon}</span><span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>{w.tmax}°/{w.tmin}°</span></div>;})()}
    </div>
  );

  const bottomNav=(
    <>
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"stretch",height:BOTTOM_BAR_H,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {TABS.filter(t=>PRIMARY_IDS.includes(t.id)).map(t=>{const active=tab===t.id;return(
          <button key={t.id} onClick={()=>{setTab(t.id);setShowMore(false);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",color:active?T.accent:T.textDim,cursor:"pointer",padding:"8px 4px 6px",position:"relative",fontFamily:"DM Sans,sans-serif",minWidth:0}}>
            {active&&<div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",width:40,height:28,background:T.accentDim,borderRadius:10}}/>}
            <span style={{fontFamily:"monospace",fontSize:18,lineHeight:1,position:"relative",zIndex:1}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:active?700:400,lineHeight:1,position:"relative",zIndex:1}}>{t.label}</span>
            {t.badge&&<span style={{position:"absolute",top:5,right:"calc(50% - 16px)",width:8,height:8,background:T.purple,borderRadius:"50%",zIndex:2}}/>}
          </button>
        );})}
        {(()=>{const active=isMoreActive||showMore;return(
          <button onClick={()=>setShowMore(s=>!s)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",color:active?T.accent:T.textDim,cursor:"pointer",padding:"8px 4px 6px",position:"relative",fontFamily:"DM Sans,sans-serif",minWidth:0}}>
            {active&&<div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",width:40,height:28,background:T.accentDim,borderRadius:10}}/>}
            <span style={{fontSize:18,lineHeight:1,position:"relative",zIndex:1,transition:"transform .2s",display:"block",transform:showMore?"rotate(90deg)":"none"}}>{showMore?"✕":"⋯"}</span>
            <span style={{fontSize:10,fontWeight:active?700:400,lineHeight:1,position:"relative",zIndex:1}}>More</span>
            {isMoreActive&&!showMore&&<span style={{position:"absolute",top:5,right:"calc(50% - 16px)",width:8,height:8,background:T.accent,borderRadius:"50%",zIndex:2}}/>}
          </button>
        );})()}
      </div>
      <div style={{position:"fixed",bottom:BOTTOM_BAR_H,left:0,right:0,zIndex:49,background:T.surface,borderTop:`1px solid ${T.border}`,borderRadius:"20px 20px 0 0",boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",transform:showMore?"translateY(0)":"translateY(100%)",transition:"transform .28s cubic-bezier(0.32,0.72,0,1)",overflow:"hidden",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,background:T.border,borderRadius:2}}/></div>
        <div style={{padding:"4px 16px 20px",display:"flex",flexDirection:"column",gap:4}}>
          {MORE_TABS.map(t=>{const active=tab===t.id;const desc={calendar:"Schedule & weather forecast",data:"Yield, soil & pest measurements",photos:"Photo log & visual records",settings:"Farm profile, blocks & thresholds"};const cols={calendar:T.blue,data:T.accent,photos:T.purple,settings:T.textMuted};const c=cols[t.id]||T.textMuted;return(
            <button key={t.id} onClick={()=>{setTab(t.id);setShowMore(false);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:active?T.accentDim:T.surfaceHover,border:`1px solid ${active?T.accent+"55":T.border}`,borderRadius:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",textAlign:"left",width:"100%",transition:"background .1s"}}>
              <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:active?T.accentDim:`${c}18`,border:`1px solid ${active?T.accent+"55":c+"33"}`,display:"grid",placeItems:"center",fontSize:18,fontFamily:"monospace",color:active?T.accent:c}}>{t.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:active?700:500,color:active?T.accent:T.text,lineHeight:1.2}}>{t.label}</div><div style={{fontSize:11,color:T.textDim,marginTop:2}}>{desc[t.id]}</div></div>
              {active&&<div style={{width:8,height:8,borderRadius:"50%",background:T.accent,flexShrink:0}}/>}
            </button>
          );})}
        </div>
      </div>
      {showMore&&<div onClick={()=>setShowMore(false)} style={{position:"fixed",inset:0,zIndex:48,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(2px)"}}/>}
    </>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"DM Sans,sans-serif",fontSize:14,display:"flex",position:"relative"}}>
      {isDesktop&&sidebarEl}
      {isTablet&&sidebarEl}
      {isTablet&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:49,backdropFilter:"blur(2px)"}}/>}
      <main style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0}}>
        {isMobile&&mobileHeader}
        {isTablet&&tabletHeader}
        <div style={{padding:isMobile?"16px 16px 80px":"28px 32px",flex:1}}>

          {/* DASHBOARD */}
          {tab==="dashboard"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?14:20,maxWidth:920}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div>
                  <h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:"0 0 3px"}}>{currentUser&&currentUser.name!=="Guest"?`Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${currentUser.name.split(" ")[0]}`:farm.name}</h1>
                  <p style={{color:T.textMuted,margin:0,fontSize:12}}>{farm.name} · {farm.location.split(",")[0]}{farm.totalHectares?` · ${farm.totalHectares}ha`:""}</p>
                </div>
                <Btn onClick={generateBriefing} disabled={briefLoad} variant="ai" size="sm" style={{flexShrink:0}}>◈ {briefLoad?"…":"Briefing"}</Btn>
              </div>
              {(briefing||briefLoad)&&<Card style={{border:`1px solid ${T.accent}44`,background:"linear-gradient(135deg,#162820,#0d1117)",padding:isMobile?14:20}}><div style={{fontSize:11,color:T.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>◈ Daily Briefing</div><AiInsight text={briefing} loading={briefLoad} color={T.accent}/></Card>}
              <div style={{display:"grid",gridTemplateColumns:statGrid,gap:10}}>
                {[{label:"Done",val:done,sub:`of ${acts.length}`,color:T.accent},{label:"In Progress",val:inProg,sub:"activities",color:T.yellow},{label:"Urgent",val:urgent,sub:"high priority",color:T.red},{label:"Logs",val:logs.length,sub:"total entries",color:T.blue}].map(s=>(
                  <Card key={s.label} style={{padding:isMobile?"12px 14px":16}}>
                    <div style={{fontSize:isMobile?24:28,fontWeight:700,color:s.color,fontFamily:"DM Mono,monospace",lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:isMobile?11:12,color:T.text,fontWeight:500,marginTop:5}}>{s.label}</div>
                    <div style={{fontSize:10,color:T.textDim,marginTop:2}}>{s.sub}</div>
                  </Card>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:twoCol,gap:14}}>
                <Card style={{padding:isMobile?14:20}}><SLabel t="Season Progress"/>
                  {SEASONS.map(s=>{const tot=acts.filter(a=>a.season===s).length;const d=acts.filter(a=>a.season===s&&a.status==="done").length;const m=SEASON_META[s];return<div key={s} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,display:"flex",alignItems:"center",gap:5}}><span>{m.icon}</span><span style={{color:T.text,fontWeight:500}}>{s}</span></span><span style={{color:T.textMuted,fontSize:11,fontFamily:"DM Mono,monospace"}}>{d}/{tot}</span></div><ProgressBar value={d} max={tot} color={m.color}/></div>;})}
                </Card>
                <Card style={{padding:isMobile?14:20}}><SLabel t="10-Day Forecast"/>
                  {wxLoad&&<div style={{color:T.textDim,fontSize:12}}>Loading…</div>}
                  <div style={{display:"flex",gap:4,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
                    {Object.entries(weather).slice(0,10).map(([date,w])=>{const wmo=wmoLabel(w.code);const isToday=date===todayStr;return<div key={date} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:isMobile?38:44,padding:"6px 2px",background:isToday?T.accentDim:T.surfaceHover,border:`1px solid ${isToday?T.accent+"55":T.border}`,borderRadius:8,flexShrink:0}}>
                      <div style={{fontSize:9,color:isToday?T.accent:T.textDim,fontWeight:isToday?700:400,fontFamily:"DM Mono,monospace"}}>{isToday?"Now":date.slice(5)}</div>
                      <div style={{fontSize:isMobile?15:17}}>{wmo.icon}</div>
                      <div style={{fontSize:10,fontWeight:600,color:T.text}}>{w.tmax}°</div>
                      <div style={{fontSize:9,color:T.textDim}}>{w.tmin}°</div>
                      {w.precip>0&&<div style={{fontSize:8,color:T.blue,fontFamily:"DM Mono,monospace"}}>{w.precip}mm</div>}
                    </div>;})}
                  </div>
                </Card>
              </div>
              <Card style={{border:`1px solid ${T.purple}44`,padding:isMobile?14:20}}><SLabel t="◈ Smart Weekly Planner"/>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {weeklyPlan.map((item,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 12px",background:`${item.color}0d`,border:`1px solid ${item.color}33`,borderRadius:8}}><span style={{fontSize:14,flexShrink:0}}>{item.icon}</span><span style={{fontSize:12,color:T.textMuted,lineHeight:1.6}}>{item.text}</span></div>)}
                </div>
              </Card>
              <Card style={{padding:isMobile?14:20}}><SLabel t="Recent Field Logs — All Team"/>
                {logs.length===0&&<div style={{color:T.textDim,fontSize:13}}>No logs yet. Add your first field log entry.</div>}
                {logs.slice(0,5).map((l,i,arr)=>{const uC=userColor(l.user||l.user_name||"",farm.teamMembers);const uN=l.user||l.user_name||"?";return<div key={l._sbid||l.id} style={{display:"flex",gap:12,paddingBottom:i<arr.length-1?12:0,marginBottom:i<arr.length-1?12:0,borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                  <div style={{width:28,height:28,borderRadius:8,background:`${uC}22`,border:`1px solid ${uC}44`,display:"grid",placeItems:"center",fontSize:10,fontWeight:700,color:uC,fontFamily:"DM Mono,monospace",flexShrink:0,marginTop:2}}>{initials(uN)}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}><span style={{fontSize:12,fontWeight:600,color:T.text}}>{l.activity}</span>{l.category&&<CatChip category={l.category} small/>}</div><div style={{fontSize:12,color:T.textMuted,lineHeight:1.5}}>{l.note}</div><div style={{fontSize:10,color:T.textDim,marginTop:3}}>{l.date}{uN!=="?"?` · ${uN}`:""}</div></div>
                </div>;})}
              </Card>
              {farm.blocks.length>0&&<Card style={{padding:isMobile?14:20}}><SLabel t="Your Blocks"/>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                  {farm.blocks.map(b=><div key={b.id} style={{background:T.surfaceHover,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:13}}>🌳</div><div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:4,marginBottom:2}}>{b.name}</div><div style={{fontSize:10,color:T.textDim}}>{b.variety}{b.hectares?` · ${b.hectares}ha`:""}</div></div>)}
                </div>
              </Card>}
            </div>
          )}

          {/* ACTIVITIES */}
          {tab==="activities"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:14,maxWidth:920}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:"0 0 2px"}}>Activity Planner</h1><p style={{color:T.textMuted,margin:0,fontSize:12}}>{filteredActs.length} of {acts.length}</p></div>
                {!isMobile&&<div style={{display:"flex",gap:7}}><Btn onClick={()=>setActView("grouped")} variant={actView==="grouped"?"active":"ghost"} size="sm">⊞ Grouped</Btn><Btn onClick={()=>setActView("list")} variant={actView==="list"?"active":"ghost"} size="sm">≡ List</Btn></div>}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"nowrap",overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
                {["All",...SEASONS].map(s=><FilterPill key={s} label={s==="All"?"All":s} active={fSeason===s} onClick={()=>setFSeason(s)}/>)}
                <div style={{width:1,height:20,background:T.border,margin:"0 3px",flexShrink:0,alignSelf:"center"}}/>
                {["All","pending","in_progress","done"].map(s=><FilterPill key={s} label={s==="All"?"All":s==="in_progress"?"In Progress":s==="done"?"Done ✓":"Pending"} active={fStatus===s} onClick={()=>setFStatus(s)}/>)}
              </div>
              {actView==="grouped"
                ?Object.entries(actsByCategory).map(([cat,items])=><div key={cat}><GroupHeader category={cat}/><div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>{items.map(a=><ActivityRow key={a.id} a={a} setActStatus={setActStatus} setEditAct={setEditAct} actInsight={actInsight} onInsight={generateActInsight} weather={weather} isMobile={isMobile}/>)}</div></div>)
                :<div style={{display:"flex",flexDirection:"column",gap:5}}>{filteredActs.map(a=><ActivityRow key={a.id} a={a} setActStatus={setActStatus} setEditAct={setEditAct} actInsight={actInsight} onInsight={generateActInsight} weather={weather} isMobile={isMobile}/>)}</div>
              }
            </div>
          )}

          {/* CALENDAR */}
          {tab==="calendar"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:0}}>Calendar</h1>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {!wxLoad&&Object.keys(weather).length>0&&<span style={{fontSize:11,color:T.accent,display:"flex",alignItems:"center",gap:4}}><Dot color={T.accent}/>Live</span>}
                  <button onClick={fetchWeather} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>↻</button>
                </div>
              </div>
              <Card style={{padding:0,overflow:"hidden"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:`1px solid ${T.border}`}}>
                  <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:T.surfaceHover,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>‹</button>
                  <span style={{fontWeight:600,fontSize:14}}>{MONTH_NAMES[calMonth]} {calYear}</span>
                  <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:T.surfaceHover,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>›</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:T.surfaceHover,borderBottom:`1px solid ${T.border}`}}>
                  {(isMobile?["S","M","T","W","T","F","S"]:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map((d,i)=><div key={i} style={{textAlign:"center",fontSize:isMobile?10:11,color:T.textDim,fontWeight:600,padding:isMobile?"6px 0":"8px 0"}}>{d}</div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
                  {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{minHeight:isMobile?52:80,borderRight:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,background:`${T.bg}88`}}/>)}
                  {Array.from({length:daysInMonth}).map((_,i)=>{
                    const day=i+1;const col=(firstDay+i)%7;
                    const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const evts=calEvents[ds]||[];const wx=weather[ds];const wmo=wx?wmoLabel(wx.code):null;
                    const isToday=ds===todayStr;const isSel=selDay===ds;
                    return<div key={day} onClick={()=>setSelDay(isSel?null:ds)} style={{minHeight:isMobile?52:80,borderRight:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,borderLeft:col===0?`1px solid ${T.border}`:"none",background:isSel?T.accentDim:isToday?"#1a2a1a":wx&&wx.precip>=5?`${T.blueDim}55`:wx&&wx.tmax>=28?`${T.yellowDim}44`:"transparent",cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"space-between",padding:isMobile?"4px 5px 2px":"5px 6px 2px"}}>
                        <span style={{fontSize:isMobile?11:12,fontWeight:isToday?700:400,color:isToday?T.accent:isSel?T.accent:T.textMuted,background:isToday?T.accentDim:"transparent",borderRadius:4,padding:isToday?"1px 4px":0}}>{day}</span>
                        {wmo&&!isMobile&&<span style={{fontSize:12}}>{wmo.icon}</span>}
                        {isMobile&&wmo&&wx.precip>=5&&<span style={{fontSize:10}}>🌧️</span>}
                      </div>
                      {wx&&!isMobile&&<div style={{padding:"0 6px",marginBottom:2}}><div style={{fontSize:9,fontFamily:"DM Mono,monospace",display:"flex",gap:3}}><span style={{color:T.orange,fontWeight:600}}>{wx.tmax}°</span><span style={{color:T.textDim}}>{wx.tmin}°</span>{wx.precip>0&&<span style={{color:T.blue}}>💧{wx.precip}</span>}</div></div>}
                      {isMobile&&wx&&<div style={{padding:"0 4px",fontSize:9,color:T.orange,fontFamily:"DM Mono,monospace"}}>{wx.tmax}°</div>}
                      <div style={{padding:isMobile?"0 3px 3px":"0 4px 4px",display:"flex",flexDirection:"column",gap:1}}>
                        {evts.slice(0,isMobile?1:2).map((ev,j)=><div key={j} style={{fontSize:8,color:ev.color,background:`${ev.color}22`,borderRadius:3,padding:"1px 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:`1px solid ${ev.color}33`}}>{isMobile?"•":ev.type==="log"?"📝 ":""}{!isMobile&&ev.label}</div>)}
                        {evts.length>(isMobile?1:2)&&<div style={{fontSize:8,color:T.textDim}}>+{evts.length-(isMobile?1:2)}</div>}
                      </div>
                    </div>;
                  })}
                </div>
              </Card>
              {selDay&&<Card style={{border:`1px solid ${T.borderLight}`,padding:isMobile?14:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:10}}>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{selDay}</div>
                  {weather[selDay]&&(()=>{const wx=weather[selDay];const wmo=wmoLabel(wx.code);return<div style={{display:"flex",alignItems:"center",gap:8,background:T.surfaceHover,borderRadius:10,padding:"6px 12px",border:`1px solid ${T.border}`,flexShrink:0}}><span style={{fontSize:20}}>{wmo.icon}</span><div><div style={{fontSize:12,fontWeight:600,color:T.text}}>{wmo.label}</div><div style={{fontSize:10,color:T.textMuted}}>{wx.tmax}°/{wx.tmin}°{wx.precip>0?` · 💧${wx.precip}mm`:""}</div></div></div>;})()}
                </div>
                {weather[selDay]&&(()=>{const wx=weather[selDay];const tips=[];if(wx.precip>=10)tips.push({icon:"🚫",color:T.red,text:"Heavy rain — avoid spraying and harvesting."});else if(wx.precip>=3)tips.push({icon:"🌧️",color:T.blue,text:"Rain expected — hold off spraying."});else if(wx.code<=2&&wx.precip<2)tips.push({icon:"✅",color:T.accent,text:"Good conditions for spraying and field work."});if(wx.tmax>=30)tips.push({icon:"🌡️",color:T.yellow,text:`Heat (${wx.tmax}°C) — work early, check irrigation.`});return<div style={{marginBottom:12}}>{tips.map((tip,i)=><div key={i} style={{display:"flex",gap:8,background:`${tip.color}15`,border:`1px solid ${tip.color}33`,borderRadius:8,padding:"7px 10px",marginBottom:5}}><span style={{fontSize:13}}>{tip.icon}</span><span style={{fontSize:11,color:tip.color,lineHeight:1.5}}>{tip.text}</span></div>)}</div>;})()}
                <SLabel t="Events"/>
                {(calEvents[selDay]||[]).length===0?<div style={{color:T.textDim,fontSize:12}}>No events.</div>:(calEvents[selDay]||[]).map((ev,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}><Dot color={ev.color}/><span style={{fontSize:12,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.label}</span><Chip color={ev.color} dim={`${ev.color}22`} small>{ev.type==="log"?"Log":"Task"}</Chip></div>)}
              </Card>}
              {!isMobile&&<Card style={{padding:16}}><SLabel t="Schedule Activities"/>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {acts.filter(a=>!a.scheduledDate&&a.status!=="done").slice(0,5).map(a=>(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.surfaceHover,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <span style={{fontSize:14}}>{a.icon}</span><span style={{fontSize:12,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
                      <Chip color={SEASON_META[a.season].color} dim={SEASON_META[a.season].dim} small>{a.season}</Chip>
                      <input type="date" onChange={e=>{if(e.target.value){setActs(p=>p.map(x=>x.id===a.id?{...x,scheduledDate:e.target.value}:x));sbSaveActStatus(a.id,{...a,scheduledDate:e.target.value},currentUser?.name);}}} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 6px",color:T.textMuted,fontSize:11,fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
                    </div>
                  ))}
                </div>
              </Card>}
            </div>
          )}

          {/* FIELD LOG */}
          {tab==="logs"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:14,maxWidth:920}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:0}}>Field Log</h1>
                <div style={{display:"flex",gap:6}}>
                  {!isMobile&&<><Btn onClick={()=>setLogView("grouped")} variant={logView==="grouped"?"active":"ghost"} size="sm">⊞</Btn><Btn onClick={()=>setLogView("list")} variant={logView==="list"?"active":"ghost"} size="sm">≡</Btn></>}
                  <Btn onClick={()=>setShowForm(showForm==="log"?null:"log")} size={isMobile?"sm":"md"}>{showForm==="log"?"✕":"+ Log"}</Btn>
                </div>
              </div>
              <div style={{display:"flex",gap:5,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
                <FilterPill label="All" active={logCat==="All"} onClick={()=>setLogCat("All")}/>
                {[...new Set(logs.map(l=>l.category||"General"))].map(c=>{const m=CAT_META[c]||{icon:"📋"};return<FilterPill key={c} label={`${m.icon} ${c}`} active={logCat===c} onClick={()=>setLogCat(c)}/>;}) }
              </div>
              {showForm==="log"&&<Card style={{border:`1px solid ${T.accent}44`,padding:isMobile?14:20}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:12}}>New Field Log Entry</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                  <Field label="Activity *" value={logF.activity} onChange={v=>setLogF({...logF,activity:v})} options={ACT_TEMPLATES.map(a=>a.name)}/>
                  <Field label="Date *" type="date" value={logF.date} onChange={v=>setLogF({...logF,date:v})}/>
                  <Field label="Category" value={logF.category} onChange={v=>setLogF({...logF,category:v})} options={allCats}/>
                  <Field label="Block" value={logF.block} onChange={v=>setLogF({...logF,block:v})} options={BLOCKS}/>
                  {!isMobile&&<Field label="Weather" value={logF.weather} onChange={v=>setLogF({...logF,weather:v})} placeholder="e.g. Sunny 22°C"/>}
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Logged By</div>
                  <div style={{background:T.surfaceHover,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"9px 12px",fontSize:13,color:T.accent,fontWeight:500,display:"flex",alignItems:"center",gap:8}}>
                    <UserAvatar name={currentUser.name} teamMembers={farm.teamMembers} size={22}/>{currentUser.name}
                  </div>
                </div>
                <div style={{marginBottom:12}}><Field label="Notes *" type="textarea" value={logF.note} onChange={v=>setLogF({...logF,note:v})} placeholder="What did you observe or do?" rows={isMobile?3:4}/></div>
                <Btn onClick={submitLog} disabled={!logF.activity||!logF.date||!logF.note} size={isMobile?"sm":"md"}>Save & Get AI Follow-up ◈</Btn>
              </Card>}
              {logs.length===0&&!showForm&&<div style={{color:T.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>No logs yet. Tap <strong style={{color:T.textMuted}}>+ Log</strong> to add the first entry.</div>}
              {logView==="grouped"
                ?Object.entries(logsByCategory).map(([cat,items])=><div key={cat}><GroupHeader category={cat}/><div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>{items.map(l=><LogRow key={l._sbid||l.id} l={l} logSugg={logSugg} onSuggest={generateLogSuggestion} isMobile={isMobile} farm={farm}/>)}</div></div>)
                :<div style={{display:"flex",flexDirection:"column",gap:5}}>{filteredLogs.map(l=><LogRow key={l._sbid||l.id} l={l} logSugg={logSugg} onSuggest={generateLogSuggestion} isMobile={isMobile} farm={farm}/>)}</div>
              }
            </div>
          )}

          {/* FARM DATA */}
          {tab==="data"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:14,maxWidth:920}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:0}}>Farm Data</h1>
                <Btn onClick={()=>setShowForm(showForm==="data"?null:"data")} size={isMobile?"sm":"md"}>{showForm==="data"?"✕":"+ Record"}</Btn>
              </div>
              {showForm==="data"&&<Card style={{border:`1px solid ${T.accent}44`,padding:isMobile?14:20}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:12}}>New Data Entry</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                  <Field label="Type *" value={dataF.type} onChange={v=>setDataF({...dataF,type:v})} options={DATA_TYPES} style={{gridColumn:isMobile?"1 / -1":undefined}}/>
                  <Field label="Value *" value={dataF.value} onChange={v=>setDataF({...dataF,value:v})} placeholder="e.g. 3.2"/>
                  <Field label="Unit" value={dataF.unit} onChange={v=>setDataF({...dataF,unit:v})} placeholder="t/ha, %, pH"/>
                  <Field label="Block" value={dataF.block} onChange={v=>setDataF({...dataF,block:v})} options={BLOCKS}/>
                  <Field label="Date *" type="date" value={dataF.date} onChange={v=>setDataF({...dataF,date:v})}/>
                  <Field label="Notes" value={dataF.note} onChange={v=>setDataF({...dataF,note:v})} placeholder="Context"/>
                </div>
                {dataF.type&&dataF.value&&<DataAlert type={dataF.type} value={dataF.value} farm={farm}/>}
                <div style={{marginTop:12}}><Btn onClick={submitData} disabled={!dataF.type||!dataF.value||!dataF.date} size={isMobile?"sm":"md"}>Save Data</Btn></div>
              </Card>}
              <div style={{display:"grid",gridTemplateColumns:threeCol,gap:10}}>
                {["Yield","Soil Moisture","Pest Count"].map(type=>{const latest=dataE.find(d=>d.type===type);const r=latest?getDataAlert(type,latest.value,farm):null;const sc=r?.level==="high"?T.red:r?.level==="medium"?T.yellow:r?.level==="ok"?T.accent:T.textDim;return<Card key={type} style={{padding:isMobile?"12px 14px":16,border:`1px solid ${r?.level==="high"?T.red+"55":r?.level==="medium"?T.yellow+"44":T.border}`}}>
                  <div style={{fontSize:10,color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{type}</div>
                  {latest?<><div style={{fontSize:isMobile?18:22,fontWeight:700,fontFamily:"DM Mono,monospace",color:sc,lineHeight:1}}>{latest.value}<span style={{fontSize:11,color:T.textDim,fontWeight:400}}> {latest.unit}</span></div><div style={{fontSize:10,color:T.textDim,marginTop:4}}>{latest.date}{latest.user_name?` · ${latest.user_name}`:""}</div>{r&&r.level!=="ok"&&<div style={{fontSize:9,color:sc,marginTop:4,fontWeight:600}}>{r.level==="high"?"🚨 Action required":"⚠️ Monitor"}</div>}</>:<div style={{fontSize:11,color:T.textDim}}>No data</div>}
                </Card>;})}
              </div>
              {dataE.length===0&&<div style={{color:T.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>No data yet. Tap <strong style={{color:T.textMuted}}>+ Record</strong> to log a measurement.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {dataE.map(d=>(
                  <Card key={d._sbid||d.id} style={{padding:isMobile?"10px 14px":"12px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {!isMobile&&<div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:T.textDim,minWidth:78}}>{d.date}</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <Chip color={T.accent} dim={T.accentDim} small>{d.type}</Chip>
                          {d.block&&<Chip color={T.blue} dim={T.blueDim} small>{d.block}</Chip>}
                          {isMobile&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:T.textDim}}>{d.date}</span>}
                          {d.user_name&&<span style={{fontSize:10,color:T.textDim}}>by {d.user_name}</span>}
                        </div>
                        {d.note&&<div style={{fontSize:11,color:T.textDim,marginTop:3}}>{d.note}</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <div style={{fontFamily:"DM Mono,monospace",fontSize:isMobile?15:17,fontWeight:700,color:T.text}}>{d.value}<span style={{fontSize:10,color:T.textDim,fontWeight:400}}> {d.unit}</span></div>
                        {!isMobile&&<Btn onClick={()=>generateDataInsight(d)} variant="ghost" size="sm" style={{fontSize:10}}>◈ {dataInsight.id===d.id?"Hide":"Analyse"}</Btn>}
                      </div>
                    </div>
                    {isMobile&&<button onClick={()=>generateDataInsight(d)} style={{background:"transparent",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif",marginTop:5,padding:0}}>◈ {dataInsight.id===d.id?"Hide":"Analyse"}</button>}
                    <DataAlert type={d.type} value={d.value} farm={farm}/>
                    {dataInsight.id===d.id&&<AiInsight text={dataInsight.text} loading={dataInsight.loading} color={T.purple}/>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {tab==="photos"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:14,maxWidth:920}}>
              <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{display:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:0}}>Photo Log</h1>
                <Btn onClick={()=>setShowForm(showForm==="photo"?null:"photo")} size={isMobile?"sm":"md"}>{showForm==="photo"?"✕":"+ Add Photo"}</Btn>
              </div>
              {showForm==="photo"&&<Card style={{border:`1px solid ${T.accent}44`,padding:isMobile?14:20}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:14}}>New Photo Entry</div>
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  <button onClick={()=>{if(photoInput.current){photoInput.current.setAttribute("capture","environment");photoInput.current.click();}}} style={{flex:1,padding:"12px",background:T.surfaceHover,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:13,cursor:"pointer",fontFamily:"DM Sans,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:24}}>📷</span><span style={{fontSize:12,fontWeight:600}}>Take Photo</span><span style={{fontSize:10,color:T.textDim}}>Opens camera</span>
                  </button>
                  <button onClick={()=>{if(photoInput.current){photoInput.current.removeAttribute("capture");photoInput.current.click();}}} style={{flex:1,padding:"12px",background:T.surfaceHover,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:13,cursor:"pointer",fontFamily:"DM Sans,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:24}}>🖼️</span><span style={{fontSize:12,fontWeight:600}}>Choose Photo</span><span style={{fontSize:10,color:T.textDim}}>From library</span>
                  </button>
                </div>
                {photoPreview&&<div style={{marginBottom:14,borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`}}>
                  <img src={photoPreview} alt="Preview" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
                  <div style={{padding:"6px 10px",background:T.surfaceHover,fontSize:11,color:T.textDim,display:"flex",alignItems:"center",gap:6}}>
                    <span>✅</span><span>Photo ready to upload</span>
                    <button onClick={()=>{setPhotoFile(null);setPreview(null);}} style={{marginLeft:"auto",background:"transparent",border:"none",color:T.textDim,cursor:"pointer",fontSize:11,fontFamily:"DM Sans,sans-serif"}}>✕ Remove</button>
                  </div>
                </div>}
                {!photoPreview&&<div style={{marginBottom:14}}><Field label="Category icon (if no photo)" value={photoF.emoji} onChange={v=>setPhotoF({...photoF,emoji:v})} options={["📸","🥜","🌿","🪲","💧","🚜","✂️","🧪","🌱","⚠️","🌸","🍂"]}/></div>}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:14}}>
                  <Field label="Caption *" value={photoF.caption} onChange={v=>setPhotoF({...photoF,caption:v})} placeholder="Describe what's shown" style={{gridColumn:isMobile?"1 / -1":undefined}}/>
                  <Field label="Date *" type="date" value={photoF.date} onChange={v=>setPhotoF({...photoF,date:v})}/>
                  <Field label="Block" value={photoF.block} onChange={v=>setPhotoF({...photoF,block:v})} options={BLOCKS}/>
                </div>
                <Btn onClick={submitPhoto} disabled={!photoF.caption||!photoF.date||uploading} size={isMobile?"sm":"md"}>{uploading?"Uploading…":"Save Photo"}</Btn>
                {uploading&&<div style={{fontSize:11,color:T.textMuted,marginTop:8}}>Uploading to Supabase Storage…</div>}
              </Card>}
              {photos.length===0&&!showForm&&<div style={{color:T.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>No photos yet. Tap <strong style={{color:T.textMuted}}>+ Add Photo</strong> to take or upload the first one.</div>}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":threeCol,gap:isMobile?10:12}}>
                {photos.map(p=>(
                  <Card key={p._sbid||p.id} style={{padding:0,overflow:"hidden"}}>
                    {p.url?<img src={p.url} alt={p.caption} style={{width:"100%",height:isMobile?120:160,objectFit:"cover",display:"block",borderBottom:`1px solid ${T.border}`}}/>:<div style={{height:isMobile?80:110,background:`linear-gradient(135deg,${T.surfaceHover},${T.border})`,display:"grid",placeItems:"center",fontSize:isMobile?32:44,borderBottom:`1px solid ${T.border}`}}>{p.emoji||"📸"}</div>}
                    <div style={{padding:isMobile?"10px 12px":"12px 14px"}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:6,lineHeight:1.4}}>{p.caption}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:T.textDim}}>{p.date}</span>
                        {p.block&&<Chip color={T.blue} dim={T.blueDim} small>{p.block}</Chip>}
                        {p.user_name&&<span style={{fontSize:10,color:T.textDim}}>by {p.user_name}</span>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI ADVISOR */}
          {tab==="advisor"&&(
            <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:16,maxWidth:760,height:isMobile?"calc(100dvh - 130px)":"calc(100vh - 80px)"}}>
              <div><h1 style={{fontSize:isMobile?17:20,fontWeight:700,margin:"0 0 2px"}}>AI Farm Advisor</h1><p style={{color:T.textMuted,margin:0,fontSize:isMobile?12:13}}>Expert advice for {farm.name} — aware of all team logs, data, and the live forecast.</p></div>
              {aiMsgs.length===0&&<Card style={{border:`1px solid ${T.purple}44`,background:"linear-gradient(135deg,#1e1535,#0d1117)",padding:isMobile?14:20}}>
                <div style={{fontSize:11,color:T.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>◈ Your advisor knows</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  {[{icon:"👤",text:`${currentUser?.name} (${currentUser?.role||"team"})`},{icon:"🏡",text:farm.name},{icon:"🌳",text:`${farm.blocks.length} blocks`},{icon:"🌤",text:"Live 16-day forecast"},{icon:"📝",text:`${logs.length} team log entries`},{icon:"📊",text:`${dataE.length} data measurements`}].map((x,i)=><div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",fontSize:11,color:T.textMuted}}><span style={{flexShrink:0}}>{x.icon}</span><span>{x.text}</span></div>)}
                </div>
              </Card>}
              {aiMsgs.length===0&&<div>
                <div style={{fontSize:10,color:T.textDim,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Try asking</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["What should I prioritise this week?","Should I spray tomorrow?","Soil pH is 5.8 — what do I do?","How do I reduce husk fly pressure?"].map(q=><button key={q} onClick={()=>setAiIn(q)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:T.textMuted,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{q}</button>)}
                </div>
              </div>}
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingRight:2}}>
                {aiMsgs.map((m,i)=>(
                  <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",background:m.role==="user"?T.accentDim:T.surface,border:`1px solid ${m.role==="user"?T.accent+"44":T.border}`,borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"10px 14px"}}>
                    <div style={{fontSize:9,color:m.role==="user"?T.accent:T.textDim,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"DM Mono,monospace"}}>{m.role==="user"?currentUser?.name||"You":"◈ Advisor"}</div>
                    <div style={{fontSize:isMobile?12:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</div>
                  </div>
                ))}
                {aiLoad&&<div style={{alignSelf:"flex-start",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"14px 14px 14px 4px",padding:"10px 14px"}}>
                  <div style={{fontSize:9,color:T.textDim,marginBottom:6,fontWeight:700,textTransform:"uppercase",fontFamily:"DM Mono,monospace"}}>◈ Advisor</div>
                  <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`blink 1.2s ${i*0.2}s infinite`}}/>)}</div>
                </div>}
                <div ref={aiEnd}/>
              </div>
              <div style={{display:"flex",gap:7,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                <input value={aiIn} onChange={e=>setAiIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI();}}} placeholder={`Ask about ${farm.name}…`} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
                <Btn onClick={sendAI} disabled={aiLoad||!aiIn.trim()} size={isMobile?"sm":"md"}>{aiLoad?"…":"Send ↑"}</Btn>
                {aiMsgs.length>0&&<Btn onClick={()=>setAiMsgs([])} variant="ghost" size={isMobile?"sm":"md"}>Clear</Btn>}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab==="settings"&&<Settings farm={farm} setFarm={setFarm} setCurrentUser={setCurrentUser} currentUser={currentUser} bp={bp}/>}

        </div>
      </main>
      {isMobile&&bottomNav}

      {editAct&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"grid",placeItems:"center",zIndex:200,padding:isMobile?12:20}} onClick={()=>setEditAct(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.borderLight}`,borderRadius:16,padding:isMobile?"18px":"24px",width:"100%",maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16,display:"flex",gap:8,color:T.text}}><span>{editAct.icon}</span>{editAct.name}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <Field label="Scheduled Date" type="date" value={editAct.scheduledDate||""} onChange={v=>setEditAct({...editAct,scheduledDate:v})}/>
              <Field label="Assigned To" value={editAct.assignee||""} onChange={v=>setEditAct({...editAct,assignee:v})} options={TEAM_NAMES.length?TEAM_NAMES:undefined} placeholder="Team member"/>
              <Field label="Notes" type="textarea" value={editAct.notes||""} onChange={v=>setEditAct({...editAct,notes:v})} placeholder="Conditions, reminders…" rows={3}/>
            </div>
            <div style={{display:"flex",gap:8}}><Btn onClick={saveEditAct}>Save</Btn><Btn onClick={()=>setEditAct(null)} variant="ghost">Cancel</Btn></div>
          </div>
        </div>
      )}

      <style>{`
        *{box-sizing:border-box;}html,body{margin:0;overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:${T.bg};}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        select option{background:${T.surface};color:${T.text};}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        @keyframes blink{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1);}}
        body{overscroll-behavior-y:none;}
      `}</style>
    </div>
  );
}
