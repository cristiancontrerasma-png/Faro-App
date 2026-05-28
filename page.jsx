"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════════
// FARO v2.2 — Inputs en miles, compromisos expandibles
// ══════════════════════════════════════════════════════════
const S = {
  isArtifact: typeof window !== "undefined" && typeof window.storage !== "undefined",
  async get(k,d){ try{ if(this.isArtifact){ const r=await window.storage.get(k); return r?JSON.parse(r.value):d; }else{ const r=localStorage.getItem(k); return r?JSON.parse(r):d; } }catch{ return d; } },
  async set(k,v){ try{ if(this.isArtifact){ await window.storage.set(k,JSON.stringify(v)); }else{ localStorage.setItem(k,JSON.stringify(v)); } }catch{} },
};

const LT = {
  bg:"#F5F7FA",card:"#FFF",border:"#E2E8F0",
  t1:"#0F172A",t2:"#475569",t3:"#94A3B8",
  accent:"#0F4C81",accentBg:"rgba(15,76,129,0.08)",
  gold:"#D97706",goldBg:"rgba(217,119,6,0.09)",
  green:"#059669",greenBg:"rgba(5,150,105,0.09)",
  red:"#DC2626",redBg:"rgba(220,38,38,0.08)",
  muted:"#F1F5F9",shadow:"0 2px 16px rgba(0,0,0,0.07)",
  nav:"#FFF",inp:"#F8FAFC",inpB:"#CBD5E1",
};
const DK = {
  bg:"#0A0E1A",card:"#0F1629",border:"#1E293B",
  t1:"#F1F5F9",t2:"#94A3B8",t3:"#475569",
  accent:"#3B82F6",accentBg:"rgba(59,130,246,0.10)",
  gold:"#F59E0B",goldBg:"rgba(245,158,11,0.10)",
  green:"#10B981",greenBg:"rgba(16,185,129,0.10)",
  red:"#EF4444",redBg:"rgba(239,68,68,0.10)",
  muted:"#1E293B",shadow:"none",
  nav:"#0F1629",inp:"#1E293B",inpB:"#334155",
};

const CATS_DEFAULT = [
  {id:"alimentacion",nombre:"Alimentación",icon:"🛒",color:"#10B981",presupuesto:0,tipo:"esencial"},
  {id:"bencina",nombre:"Bencina",icon:"⛽",color:"#3B82F6",presupuesto:0,tipo:"esencial"},
  {id:"restaurantes",nombre:"Restaurantes",icon:"🍽️",color:"#F59E0B",presupuesto:0,tipo:"variable"},
  {id:"salud",nombre:"Salud",icon:"🏥",color:"#8B5CF6",presupuesto:0,tipo:"esencial"},
  {id:"entretenim",nombre:"Entretenim.",icon:"🎬",color:"#EC4899",presupuesto:0,tipo:"personal"},
  {id:"cafe",nombre:"Café/Snacks",icon:"☕",color:"#D97706",presupuesto:0,tipo:"variable"},
  {id:"farmacia",nombre:"Farmacia",icon:"💊",color:"#7C3AED",presupuesto:0,tipo:"esencial"},
  {id:"otros",nombre:"Otros",icon:"📦",color:"#94A3B8",presupuesto:0,tipo:"variable"},
];
const COMP_DEFAULT = [
  {id:"dividendo",nombre:"Dividendo",icon:"🏠",color:"#EC111A",monto:0,dia:5,tipo:"fijo",banco:"Scotiabank",pagado:false,activo:true,gmailKey:"scotiabank"},
  {id:"g_comunes",nombre:"Gastos Comunes",icon:"🏢",color:"#7C3AED",monto:0,dia:10,tipo:"fijo",banco:"",pagado:false,activo:true,gmailKey:"gastos_comunes"},
  {id:"luz",nombre:"Luz",icon:"💡",color:"#F59E0B",monto:0,dia:8,tipo:"variable",banco:"Enel",pagado:false,activo:true,gmailKey:"enel"},
  {id:"agua",nombre:"Agua",icon:"💧",color:"#3B82F6",monto:0,dia:22,tipo:"variable",banco:"Aguas Andinas",pagado:false,activo:true,gmailKey:"aguas_andinas"},
  {id:"gas",nombre:"Gas",icon:"🔥",color:"#F97316",monto:0,dia:18,tipo:"variable",banco:"Metrogas",pagado:false,activo:true,gmailKey:"metrogas"},
  {id:"internet",nombre:"Internet/TV",icon:"📡",color:"#0077B6",monto:0,dia:15,tipo:"fijo",banco:"VTR",pagado:false,activo:true,gmailKey:"vtr"},
  {id:"celular",nombre:"Celular",icon:"📱",color:"#0066B3",monto:0,dia:12,tipo:"fijo",banco:"Entel",pagado:false,activo:true,gmailKey:"entel"},
];
const EMOCIONES = [
  {id:"funcional",label:"Funcional",icon:"✅",color:"#10B981"},
  {id:"necesario",label:"Necesidad",icon:"🏠",color:"#3B82F6"},
  {id:"recompensa",label:"Recompensa",icon:"🎁",color:"#F59E0B"},
  {id:"impulsivo",label:"Impulsivo",icon:"⚡",color:"#EF4444"},
  {id:"social",label:"Pres. social",icon:"👥",color:"#8B5CF6"},
  {id:"estres",label:"Estrés",icon:"😤",color:"#EC4899"},
];

// ─── UTILS ────────────────────────────────────────────────
// fmtK: muestra en miles. $550.000 → "550K", $1.200.000 → "1,2M"
const fmtK = n => {
  const v = Math.round(Math.abs(Number(n)||0));
  if(v===0) return "$0";
  if(v>=1000000) return "$"+(v/1000000).toFixed(1).replace(".0","")+"M";
  if(v>=1000) return "$"+(v/1000).toFixed(0)+"K";
  return "$"+v.toLocaleString("es-CL");
};
const fmtFull = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Number(n)||0);
// Convierte input en miles a valor real: "550" → 550000
const milesAVal = s => Math.round(Number(String(s).replace(/[^0-9.]/g,""))*1000);
const valAMiles = n => n>0 ? String(Math.round(Number(n)/1000)) : "";

const hoy = ()=>new Date();
const diasHasta = dia=>{ const h=hoy(),v=new Date(h.getFullYear(),h.getMonth(),dia); if(v<h) v.setMonth(v.getMonth()+1); return Math.ceil((v-h)/(864e5)); };
const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const NOW = hoy();

const calcTension=(comp,ing,gast)=>{ if(!ing) return 0; const tot=comp.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0); return Math.min(100,Math.round(((tot+gast)/ing)*70+(tot>ing*0.7?20:0))); };
const tensionInfo=v=>{ if(v<=30) return {label:"Estabilidad",color:"#10B981",bg:"rgba(16,185,129,0.1)",emoji:"💚"}; if(v<=55) return {label:"Tensión leve",color:"#F59E0B",bg:"rgba(245,158,11,0.1)",emoji:"💛"}; if(v<=75) return {label:"Fatiga financ.",color:"#F97316",bg:"rgba(249,115,22,0.1)",emoji:"🟠"}; if(v<=90) return {label:"Riesgo alto",color:"#EF4444",bg:"rgba(239,68,68,0.1)",emoji:"🔴"}; return {label:"Zona crítica",color:"#DC2626",bg:"rgba(220,38,38,0.12)",emoji:"🚨"}; };

const SYS=`Eres FARO, copiloto financiero de Cristian, vendedor chileno. Combinas análisis financiero con psicología conductual. Eres empático, directo, preventivo. Responde en español, máximo 3 párrafos.`;
const askFaro=async msgs=>{ const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:SYS,messages:msgs})}); const d=await r.json(); return d.content?.[0]?.text||"Sin respuesta."; };

const APPS_SCRIPT_CODE=`// FARO Gmail Script v2.1 — fechas reales
const EMPRESAS=[{key:"enel",nombre:"Enel (Luz)",query:"from:enelchile.cl OR subject:(cuenta enel)"},{key:"aguas_andinas",nombre:"Aguas Andinas",query:"from:aguasandinas.cl"},{key:"metrogas",nombre:"Metrogas",query:"from:metrogas.cl"},{key:"vtr",nombre:"VTR",query:"from:vtr.com OR from:vtr.cl"},{key:"entel",nombre:"Entel",query:"from:entel.cl"},{key:"movistar",nombre:"Movistar",query:"from:movistar.cl"},{key:"claro",nombre:"Claro",query:"from:clarochile.cl"},{key:"scotiabank",nombre:"Scotiabank",query:"from:scotiabank.cl dividendo"},{key:"gastos_comunes",nombre:"Gastos Comunes",query:"subject:(gastos comunes) newer_than:45d"}];
const PM=[/cu[aá]nto debo pagar[\\s\\S]{0,30}\\$?\\s*([\\d.]+)/i,/total a pagar[\\s\\S]{0,30}\\$?\\s*([\\d.]+)/i,/monto a pagar[\\s\\S]{0,30}\\$?\\s*([\\d.]+)/i,/total[:\\s]*\\$?\\s*([\\d.]+)/i,/\\$\\s*([\\d.]{4,})/];
const PF=[/fecha de vencimiento[\\s\\S]{0,50}(\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4})/i,/vencimiento[\\s\\S]{0,50}(\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4})/i,/vence[\\s\\S]{0,50}(\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4})/i,/fecha de pago[\\s\\S]{0,50}(\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4})/i];
function xM(t){for(const p of PM){const m=t.match(p);if(m){const n=parseInt(m[1].replace(/[.\\s]/g,""));if(n>500&&n<10000000)return n;}}return null;}
function xD(t){for(const p of PF){const m=t.match(p);if(m){const d=parseInt(m[1].split(/[-\\/]/)[0]);if(d>=1&&d<=31)return d;}}return null;}
function buscarBoletas(){const res=[];const hoy=new Date();EMPRESAS.forEach(e=>{try{GmailApp.search(e.query+" newer_than:60d",0,3).forEach(th=>{const msg=th.getMessages().pop();if((hoy-msg.getDate())/(864e5)>45)return;const txt=msg.getSubject()+"\\n"+msg.getPlainBody();const monto=xM(txt);if(monto&&!res.some(r=>r.key===e.key))res.push({key:e.key,nombre:e.nombre,monto,diaVence:xD(txt),fechaEmail:Utilities.formatDate(msg.getDate(),"America/Santiago","dd/MM/yyyy"),asunto:msg.getSubject().substring(0,80)});});}catch(err){Logger.log("Error "+e.nombre+": "+err.message);}});try{const h=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FARO_Boletas")||SpreadsheetApp.getActiveSpreadsheet().insertSheet("FARO_Boletas");h.clearContents();h.appendRow(["key","nombre","monto","diaVence","fechaEmail","asunto","ts"]);res.forEach(r=>h.appendRow([r.key,r.nombre,r.monto,r.diaVence||"",r.fechaEmail,r.asunto,new Date().toISOString()]));}catch(e){Logger.log(JSON.stringify(res,null,2));}return res;}
function doGet(){try{const h=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FARO_Boletas");if(!h){buscarBoletas();return ContentService.createTextOutput(JSON.stringify({ok:true,data:[]})).setMimeType(ContentService.MimeType.JSON);}const b=h.getDataRange().getValues().slice(1).filter(r=>r[0]&&Number(r[2])>0).map(r=>({key:r[0],nombre:r[1],monto:Number(r[2]),diaVence:r[3]?Number(r[3]):null,fechaEmail:r[4],asunto:r[5]}));return ContentService.createTextOutput(JSON.stringify({ok:true,data:b,timestamp:new Date().toISOString()})).setMimeType(ContentService.MimeType.JSON);}catch(e){return ContentService.createTextOutput(JSON.stringify({ok:false,error:e.message})).setMimeType(ContentService.MimeType.JSON);}}
function activarSincronizacionDiaria(){ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));ScriptApp.newTrigger("buscarBoletas").timeBased().everyDays(1).atHour(8).create();Logger.log("✅ Sync diario 8am activado");}`;

// ══════════════════════════════════════════════════════════
// INPUT EN MILES
// ══════════════════════════════════════════════════════════
function InputMiles({ value, onChange, placeholder="0", style={} }) {
  const [local, setLocal] = useState(valAMiles(value));
  useEffect(()=>{ setLocal(valAMiles(value)); },[value]);
  return (
    <div style={{position:"relative"}}>
      <input
        type="number"
        inputMode="numeric"
        value={local}
        onChange={e=>{ setLocal(e.target.value); onChange(milesAVal(e.target.value)); }}
        placeholder={placeholder}
        style={{...style,paddingRight:52}}
      />
      <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#94A3B8",fontWeight:700,pointerEvents:"none"}}>× mil</span>
      {local>0&&<span style={{position:"absolute",right:10,bottom:-16,fontSize:10,color:"#059669",fontWeight:600}}>{fmtFull(milesAVal(local))}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// BANNER GMAIL
// ══════════════════════════════════════════════════════════
function GmailSyncBanner({boletas,onConfirmar,onDescartar,t,isDark}){
  if(!boletas?.length) return null;
  return(
    <div style={{background:isDark?"linear-gradient(135deg,#064E3B,#065F46)":"linear-gradient(135deg,#ECFDF5,#D1FAE5)",border:`1px solid ${t.green}44`,borderRadius:18,padding:"16px",marginBottom:16}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:24}}>📧</span>
        <div><div style={{fontSize:14,fontWeight:800,color:isDark?"#ECFDF5":"#064E3B"}}>FARO detectó {boletas.length} boleta{boletas.length>1?"s":""} nueva{boletas.length>1?"s":""}</div>
          <div style={{fontSize:12,color:t.t2}}>Fechas y montos del email original</div></div>
      </div>
      {boletas.map(b=>(
        <div key={b.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",background:isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.7)",borderRadius:12,marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:isDark?"#ECFDF5":"#064E3B"}}>{b.nombre}</div>
            {b.diaVence?<div style={{fontSize:11,color:t.green,fontWeight:600}}>📅 Vence día {b.diaVence}</div>:<div style={{fontSize:11,color:t.gold}}>📅 Fecha sin cambios</div>}
          </div>
          <div style={{fontSize:16,fontWeight:800,color:t.green}}>{b.monto > 5000 ? fmtK(b.monto) : fmtFull(b.monto * 1000)}</div>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
        <button onClick={onDescartar} style={{padding:"11px",borderRadius:12,background:"transparent",color:t.t2,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Ignorar</button>
        <button onClick={()=>onConfirmar(boletas)} style={{padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${t.green},#047857)`,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800}}>✓ Cargar en FARO</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PANORAMA
// ══════════════════════════════════════════════════════════
function PanoramaView({data,onBoletasConfirmadas,t,isDark}){
  const {ingresos,compromisos,gastos,categorias,boletasGmail}=data;
  const mesG=gastos.filter(g=>{const d=new Date(g.fecha);return d.getMonth()===NOW.getMonth()&&d.getFullYear()===NOW.getFullYear();});
  const totalGast=mesG.reduce((s,g)=>s+Math.abs(g.monto),0);
  const totalComp=compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalPres=categorias.reduce((s,c)=>s+Number(c.presupuesto||0),0);
  const necesita=totalComp+totalPres;
  const compPag=compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalSal=compPag+totalGast;
  const disponible=(ingresos||0)-totalSal;
  const pctCub=necesita>0?Math.min((totalSal/necesita)*100,100):0;
  const tension=calcTension(compromisos,ingresos||0,totalGast);
  const tInfo=tensionInfo(tension);
  const proximos=compromisos.filter(c=>c.activo&&c.monto>0&&!c.pagado).map(c=>({...c,dias:diasHasta(c.dia)})).sort((a,b)=>a.dias-b.dias).slice(0,4);
  return(
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:t.t3}}>{MES[NOW.getMonth()]} {NOW.getFullYear()}</div>
        <div style={{fontSize:21,fontWeight:800,color:t.t1,letterSpacing:-0.5}}>Hola, Cristian 🔦</div>
      </div>
      {boletasGmail?.length>0&&<GmailSyncBanner boletas={boletasGmail} onConfirmar={onBoletasConfirmadas} onDescartar={()=>onBoletasConfirmadas([])} t={t} isDark={isDark}/>}
      <div style={{background:isDark?"linear-gradient(145deg,#0F2D52,#1E3A5F)":"linear-gradient(145deg,#0F4C81,#1565C0)",borderRadius:22,padding:"20px",marginBottom:14,boxShadow:"0 8px 32px rgba(15,76,129,0.3)"}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,letterSpacing:0.8,marginBottom:3}}>ESTE MES NECESITAS</div>
        <div style={{fontSize:34,fontWeight:900,color:"#fff",letterSpacing:-1.5,marginBottom:8}}>{fmtFull(necesita)}</div>
        <div style={{height:5,background:"rgba(255,255,255,0.2)",borderRadius:3,overflow:"hidden",marginBottom:7}}><div style={{height:"100%",width:`${pctCub}%`,background:"rgba(255,255,255,0.8)",borderRadius:3,transition:"width 0.8s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>Cubierto: {fmtK(totalSal)} ({Math.round(pctCub)}%)</div>
          <div style={{fontSize:12,fontWeight:700,color:disponible>=0?"#A7F3D0":"#FCA5A5"}}>{disponible>=0?`Quedan ${fmtK(disponible)}`:`Faltan ${fmtK(Math.abs(disponible))}`}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["📋 Compromisos",totalComp],["🎯 Presupuesto",totalPres],["💸 Gastado",totalGast],["✅ Pagado",compPag]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 11px"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginBottom:2}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{fmtK(v)}</div></div>
          ))}
        </div>
      </div>
      <div style={{background:t.card,borderRadius:16,padding:"14px 16px",marginBottom:14,border:`1.5px solid ${tInfo.color}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:13,fontWeight:700,color:t.t1}}>Índice de tensión</div><div style={{fontSize:12,color:t.t2,marginTop:2}}>{tInfo.emoji} {tInfo.label}</div></div>
          <div style={{width:56,height:56,borderRadius:"50%",background:tInfo.bg,border:`3px solid ${tInfo.color}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,fontWeight:900,color:tInfo.color}}>{tension}</span></div>
        </div>
        <div style={{height:5,background:t.muted,borderRadius:3,marginTop:12,overflow:"hidden"}}><div style={{height:"100%",width:`${tension}%`,background:`linear-gradient(90deg,${t.green},${tension>70?t.red:tension>40?t.gold:t.green})`,borderRadius:3}}/></div>
      </div>
      {proximos.length>0&&(
        <div style={{background:t.card,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${t.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:t.t1,marginBottom:12}}>⏰ Próximos vencimientos</div>
          {proximos.map((c,i)=>{
            const urg=c.dias<=3,prox=c.dias<=7;
            return(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<proximos.length-1?`1px solid ${t.border}`:"none"}}>
                <span style={{fontSize:20}}>{c.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.t1}}>{c.nombre}</div>
                  <div style={{fontSize:11,color:urg?t.red:prox?t.gold:t.t3,fontWeight:urg||prox?700:400}}>{urg?`🚨 Vence en ${c.dias}d`:prox?`⏰ ${c.dias} días`:`Día ${c.dia} del mes`}</div>
                  {c.banco&&<div style={{fontSize:10,color:t.t3}}>{c.banco}</div>}
                </div>
                <div style={{fontSize:14,fontWeight:800,color:urg?t.red:t.t1}}>{fmtK(c.monto)}</div>
              </div>
            );
          })}
        </div>
      )}
      {!ingresos&&<div style={{background:t.goldBg,border:`1px solid ${t.gold}33`,borderRadius:14,padding:"14px 16px",display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>👆</span><div style={{fontSize:13,color:t.t1}}>Ve a <strong>Ajustes</strong> e ingresa tu sueldo</div></div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPROMISOS — expandibles al tocar, inputs en miles
// ══════════════════════════════════════════════════════════
function CompromisosView({data,setData,t,isDark}){
  const {compromisos}=data;
  const [expandId,setExpand]=useState(null);
  const [editId,setEdit]=useState(null);
  const [showAdd,setAdd]=useState(false);
  const [nuevo,setNuevo]=useState({nombre:"",icon:"📋",color:"#3B82F6",monto:0,dia:1,tipo:"fijo",banco:"",activo:true});
  const fotoRef=useRef();
  const [scanId,setScan]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [scanResult,setScanResult]=useState(null);

  const upd=(id,p)=>setData(d=>({...d,compromisos:d.compromisos.map(c=>c.id===id?{...c,...p}:c)}));
  const del=id=>setData(d=>({...d,compromisos:d.compromisos.filter(c=>c.id!==id)}));
  const toggle=id=>{const c=compromisos.find(x=>x.id===id);upd(id,{pagado:!c.pagado});};
  const add=()=>{if(!nuevo.nombre||!nuevo.monto)return;setData(d=>({...d,compromisos:[...d.compromisos,{...nuevo,id:"c_"+Date.now(),pagado:false}]}));setNuevo({nombre:"",icon:"📋",color:"#3B82F6",monto:0,dia:1,tipo:"fijo",banco:"",activo:true});setAdd(false);};

  const handleFoto=async e=>{
    const file=e.target.files?.[0];if(!file)return;setScanning(true);
    const reader=new FileReader();
    reader.onload=async ev=>{
      const b64=ev.target.result.split(",")[1];
      try{
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},{type:"text",text:'Extrae SOLO datos REALES de esta boleta. JSON puro: {"monto":663141,"dia_vence":8}. Si no hay fecha real pon dia_vence:null. NUNCA inventes.'}]}]})});
        const d=await r.json();const res=JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        setScanResult({compId:scanId,monto:res.monto||null,dia:res.dia_vence||null});
      }catch{alert("Error leyendo boleta");}
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };
  const aplicarScan=()=>{if(!scanResult)return;const p={};if(scanResult.monto)p.monto=scanResult.monto;if(scanResult.dia)p.dia=scanResult.dia;upd(scanResult.compId,p);setScanResult(null);setScan(null);};

  const totalMes=compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const pagados=compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const inp={width:"100%",boxSizing:"border-box",background:t.inp,border:`1px solid ${t.inpB}`,borderRadius:9,padding:"10px 12px",color:t.t1,fontSize:14,outline:"none",fontFamily:"inherit"};

  const CompCard=({c})=>{
    const isExp=expandId===c.id;
    const isEd=editId===c.id;
    return(
      <div style={{background:t.card,borderRadius:16,marginBottom:10,border:`1.5px solid ${c.pagado?t.green+"44":isExp?t.accent+"44":t.border}`,overflow:"hidden",boxShadow:t.shadow}}>
        {/* Fila principal — toca para expandir */}
        <div onClick={()=>setExpand(isExp?null:c.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"14px",cursor:"pointer"}}>
          <div style={{width:44,height:44,borderRadius:13,background:c.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{c.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:t.t1}}>{c.nombre}</div>
            <div style={{fontSize:11,color:t.t3}}>{c.banco||"—"} · Día {c.dia}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:17,fontWeight:800,color:c.pagado?t.green:c.monto?t.t1:t.t3}}>{c.monto?fmtK(c.monto):"Sin monto"}</div>
            {c.monto>0&&!c.pagado&&<div style={{fontSize:10,color:diasHasta(c.dia)<=3?t.red:t.t3}}>vence en {diasHasta(c.dia)}d</div>}
            {c.pagado&&<div style={{fontSize:10,color:t.green}}>✅ Pagado</div>}
          </div>
          <span style={{fontSize:16,color:t.t3,marginLeft:4,transition:"transform 0.2s",display:"inline-block",transform:isExp?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
        </div>

        {/* Detalle expandido */}
        {isExp&&(
          <div style={{borderTop:`1px solid ${t.border}`,padding:"12px 14px",background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}}>
            {/* Info detallada */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[["Institución",c.banco||"—"],["Vence",`Día ${c.dia}`],["Tipo",c.tipo==="fijo"?"📌 Fijo":"⚡ Variable"]].map(([l,v])=>(
                <div key={l} style={{background:t.muted,borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:t.t3,fontWeight:700,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,fontWeight:700,color:t.t1}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Botones */}
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>toggle(c.id)} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${c.pagado?t.green:t.border}`,background:c.pagado?t.greenBg:t.muted,color:c.pagado?t.green:t.t2,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {c.pagado?"✅ Pagado":"Marcar pagado"}
              </button>
              <button onClick={()=>{setScan(c.id);fotoRef.current?.click();}} style={{padding:"9px 11px",borderRadius:10,border:`1px solid ${t.border}`,background:t.muted,color:t.t2,fontSize:14,cursor:"pointer"}} title="Foto boleta">📸</button>
              <button onClick={()=>setEdit(isEd?null:c.id)} style={{padding:"9px 11px",borderRadius:10,border:`1px solid ${t.border}`,background:t.muted,color:t.t2,fontSize:14,cursor:"pointer"}}>✏️</button>
              <button onClick={()=>del(c.id)} style={{padding:"9px 11px",borderRadius:10,border:`1px solid ${t.border}`,background:t.redBg,color:t.red,fontSize:14,cursor:"pointer"}}>🗑️</button>
            </div>
            {scanning&&scanId===c.id&&<div style={{marginTop:8,fontSize:12,color:t.t2,textAlign:"center",padding:"8px",background:t.muted,borderRadius:8}}>🤖 Leyendo boleta...</div>}
            {scanResult&&scanResult.compId===c.id&&(
              <div style={{marginTop:10,background:isDark?"#0C2A1A":"#ECFDF5",border:`1px solid ${t.green}44`,borderRadius:12,padding:"12px"}}>
                <div style={{fontSize:12,fontWeight:700,color:t.green,marginBottom:8}}>📋 Extraído:</div>
                <div style={{display:"flex",gap:10,marginBottom:10}}>
                  {scanResult.monto&&<div style={{flex:1,background:t.card,borderRadius:9,padding:"8px",textAlign:"center"}}><div style={{fontSize:10,color:t.t3}}>MONTO</div><div style={{fontSize:14,fontWeight:800,color:t.t1}}>{fmtK(scanResult.monto)}</div></div>}
                  <div style={{flex:1,background:t.card,borderRadius:9,padding:"8px",textAlign:"center"}}><div style={{fontSize:10,color:t.t3}}>VENCE</div><div style={{fontSize:14,fontWeight:800,color:scanResult.dia?t.green:t.gold}}>{scanResult.dia?`Día ${scanResult.dia}`:"No detectado"}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>setScanResult(null)} style={{padding:"9px",borderRadius:9,background:t.muted,color:t.t2,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                  <button onClick={aplicarScan} style={{padding:"9px",borderRadius:9,background:t.green,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✓ Aplicar</button>
                </div>
              </div>
            )}
            {isEd&&(
              <div style={{marginTop:10,padding:"12px",background:t.muted,borderRadius:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>MONTO (en miles)</div>
                    <div style={{marginBottom:20}}>
                      <InputMiles value={c.monto} onChange={v=>upd(c.id,{monto:v})} style={inp}/>
                    </div>
                  </div>
                  <div><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>DÍA VENCIMIENTO</div><input type="number" min="1" max="31" value={c.dia} onChange={e=>upd(c.id,{dia:Number(e.target.value)})} style={inp}/></div>
                  <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>BANCO / EMPRESA</div><input value={c.banco||""} onChange={e=>upd(c.id,{banco:e.target.value})} placeholder="Ej: Scotiabank" style={inp}/></div>
                </div>
                <button onClick={()=>setEdit(null)} style={{width:"100%",padding:"9px",borderRadius:9,background:t.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>✓ Guardar</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><div style={{fontSize:21,fontWeight:800,color:t.t1,letterSpacing:-0.5}}>Compromisos 📋</div><div style={{fontSize:12,color:t.t2}}>Toca cada uno para ver detalles</div></div>
        <button onClick={()=>setAdd(true)} style={{padding:"8px 13px",borderRadius:20,background:t.accentBg,color:t.accent,border:`1px solid ${t.accent}33`,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Agregar</button>
      </div>
      <div style={{background:isDark?"linear-gradient(135deg,#0F2D52,#1E3A5F)":"linear-gradient(135deg,#EFF6FF,#F0FDF4)",borderRadius:14,padding:"13px 15px",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[["Total mes",totalMes,t.t1],["Pagados",pagados,t.green],["Pendiente",totalMes-pagados,t.red]].map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:3}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:c}}>{fmtK(v)}</div></div>
          ))}
        </div>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:0.5,marginBottom:9}}>📌 PAGOS FIJOS</div>
      {compromisos.filter(c=>c.tipo==="fijo"&&c.activo).map(c=><CompCard key={c.id} c={c}/>)}
      <div style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:0.5,marginBottom:9,marginTop:14}}>⚡ VARIABLES</div>
      {compromisos.filter(c=>c.tipo==="variable"&&c.activo).map(c=><CompCard key={c.id} c={c}/>)}
      {showAdd&&(
        <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1.5px dashed ${t.accent}55`,marginTop:8}}>
          <div style={{fontSize:14,fontWeight:700,color:t.t1,marginBottom:12}}>Nuevo compromiso</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>NOMBRE</div><input value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Netflix, TAG..." style={inp} autoFocus/></div>
            <div>
              <div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>MONTO (en miles)</div>
              <div style={{marginBottom:20}}><InputMiles value={nuevo.monto} onChange={v=>setNuevo(p=>({...p,monto:v}))} style={inp}/></div>
            </div>
            <div><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>DÍA VENC.</div><input type="number" min="1" max="31" value={nuevo.dia} onChange={e=>setNuevo(p=>({...p,dia:Number(e.target.value)}))} style={inp}/></div>
            <div><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>TIPO</div><select value={nuevo.tipo} onChange={e=>setNuevo(p=>({...p,tipo:e.target.value}))} style={{...inp,appearance:"none"}}><option value="fijo">📌 Fijo</option><option value="variable">⚡ Variable</option></select></div>
            <div><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:4}}>EMPRESA</div><input value={nuevo.banco} onChange={e=>setNuevo(p=>({...p,banco:e.target.value}))} placeholder="Ej: Claro" style={inp}/></div>
          </div>
          <div style={{marginBottom:12}}><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:6}}>ÍCONO</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{["📋","🏠","💳","🚗","📱","🎬","💊","🏋️","🐾","📚","✈️","💡","💧","🔥","📡","🔑"].map(ic=><button key={ic} onClick={()=>setNuevo(p=>({...p,icon:ic}))} style={{width:34,height:34,borderRadius:9,border:`2px solid ${nuevo.icon===ic?t.accent:t.border}`,background:nuevo.icon===ic?t.accentBg:t.muted,fontSize:17,cursor:"pointer"}}>{ic}</button>)}</div></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={add} style={{flex:1,padding:"11px",borderRadius:10,background:t.accent,color:"#fff",fontWeight:700,border:"none",cursor:"pointer",fontFamily:"inherit"}}>Agregar</button>
            <button onClick={()=>setAdd(false)} style={{padding:"11px 14px",borderRadius:10,background:t.muted,color:t.t2,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      )}
      <button onClick={()=>setData(d=>({...d,compromisos:d.compromisos.map(c=>({...c,pagado:false}))}))} style={{width:"100%",padding:"11px",borderRadius:12,background:t.muted,color:t.t2,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,marginTop:12}}>🔄 Nuevo mes — reiniciar todos</button>
      <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{display:"none"}}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PRESUPUESTO — con borrar movimientos + inputs en miles
// ══════════════════════════════════════════════════════════
function PresupuestoView({data,setData,t,isDark}){
  const {categorias,gastos}=data;
  const [editId,setEdit]=useState(null);
  const [nuevo,setNuevo]=useState("");
  const [showAdd,setAdd]=useState(false);
  const [showMovs,setShowMovs]=useState(true);

  const mesG=gastos.filter(g=>{const d=new Date(g.fecha);return d.getMonth()===NOW.getMonth()&&d.getFullYear()===NOW.getFullYear();});
  const updCat=(id,p)=>setData(d=>({...d,categorias:d.categorias.map(c=>c.id===id?{...c,...p}:c)}));
  const delCat=id=>setData(d=>({...d,categorias:d.categorias.filter(c=>c.id!==id)}));
  const delGasto=id=>setData(d=>({...d,gastos:d.gastos.filter(g=>g.id!==id)}));
  const addCat=()=>{if(!nuevo.trim())return;setData(d=>({...d,categorias:[...d.categorias,{id:"cat_"+Date.now(),nombre:nuevo,icon:"📦",color:"#94A3B8",presupuesto:0,tipo:"variable"}]}));setNuevo("");setAdd(false);};

  const totalPres=categorias.reduce((s,c)=>s+Number(c.presupuesto||0),0);
  const totalGast=mesG.reduce((s,g)=>s+Math.abs(g.monto),0);
  const inp={width:"100%",boxSizing:"border-box",background:t.inp,border:`1px solid ${t.inpB}`,borderRadius:9,padding:"9px 11px",color:t.t1,fontSize:14,outline:"none",fontFamily:"inherit"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><div style={{fontSize:21,fontWeight:800,color:t.t1,letterSpacing:-0.5}}>Presupuesto 🎯</div><div style={{fontSize:12,color:t.t2}}>Asigna un límite a cada categoría</div></div>
        <button onClick={()=>setAdd(true)} style={{padding:"8px 13px",borderRadius:20,background:t.greenBg,color:t.green,border:`1px solid ${t.green}33`,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Nueva</button>
      </div>
      <div style={{background:isDark?"linear-gradient(135deg,#064E3B,#065F46)":"linear-gradient(135deg,#ECFDF5,#D1FAE5)",borderRadius:14,padding:"13px 15px",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,textAlign:"center"}}>
          <div><div style={{fontSize:10,color:isDark?"#6EE7B7":"#059669",fontWeight:700,marginBottom:4}}>PRESUPUESTADO</div><div style={{fontSize:20,fontWeight:800,color:isDark?"#ECFDF5":"#064E3B"}}>{fmtK(totalPres)}</div></div>
          <div><div style={{fontSize:10,color:isDark?"#6EE7B7":"#059669",fontWeight:700,marginBottom:4}}>GASTADO MES</div><div style={{fontSize:20,fontWeight:800,color:totalGast>totalPres&&totalPres>0?t.red:(isDark?"#ECFDF5":"#064E3B")}}>{fmtK(totalGast)}</div></div>
        </div>
        {totalPres>0&&<><div style={{height:4,background:"rgba(255,255,255,0.3)",borderRadius:2,marginTop:12,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((totalGast/totalPres)*100,100)}%`,background:totalGast>totalPres?"#EF4444":"#fff",borderRadius:2}}/></div><div style={{textAlign:"center",fontSize:11,color:isDark?"rgba(255,255,255,0.5)":"rgba(5,150,105,0.7)",marginTop:5}}>{Math.round((totalGast/totalPres)*100)}% usado</div></>}
      </div>

      {["esencial","variable","personal"].map(tipo=>{
        const cats=categorias.filter(c=>c.tipo===tipo);if(!cats.length)return null;
        const labels={esencial:"🏠 Esenciales",variable:"🔄 Variables",personal:"🎭 Personales"};
        return(
          <div key={tipo}>
            <div style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:0.5,marginBottom:8,marginTop:tipo!=="esencial"?12:0}}>{labels[tipo]}</div>
            {cats.map(cat=>{
              const gast=mesG.filter(g=>g.catId===cat.id).reduce((s,g)=>s+Math.abs(g.monto),0);
              const pres=Number(cat.presupuesto||0);const over=pres>0&&gast>pres;const isEd=editId===cat.id;
              return(
                <div key={cat.id} style={{background:t.card,borderRadius:14,padding:"13px",marginBottom:8,border:`1.5px solid ${over?t.red+"44":isEd?t.accent+"44":t.border}`,boxShadow:t.shadow}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:38,height:38,borderRadius:12,background:cat.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{cat.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pres?5:0}}>
                        <span style={{fontSize:14,fontWeight:600,color:t.t1}}>{cat.nombre}</span>
                        <div style={{display:"flex",gap:7,alignItems:"center"}}>
                          {pres>0&&<span style={{fontSize:12,fontWeight:700,color:over?t.red:t.t1}}>{fmtK(gast)}<span style={{color:t.t3,fontWeight:400}}>/{fmtK(pres)}</span></span>}
                          <button onClick={()=>setEdit(isEd?null:cat.id)} style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:`1px solid ${t.border}`,background:t.muted,color:t.t2,cursor:"pointer",fontFamily:"inherit"}}>{pres?"✏️":"+ $"}</button>
                          <button onClick={()=>delCat(cat.id)} style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:`1px solid ${t.border}`,background:t.redBg,color:t.red,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
                        </div>
                      </div>
                      {pres>0&&<><div style={{height:4,background:t.muted,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((gast/pres)*100,100)}%`,background:over?`linear-gradient(90deg,${t.red},#F87171)`:`linear-gradient(90deg,${cat.color},${cat.color}88)`,borderRadius:2}}/></div><div style={{fontSize:10,color:over?t.red:t.t3,marginTop:3,fontWeight:over?700:400}}>{over?`⚠️ Excediste en ${fmtK(gast-pres)}`:`${fmtK(pres-gast)} disponible`}</div></>}
                    </div>
                  </div>
                  {isEd&&(
                    <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div>
                        <div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:3}}>MONTO MENSUAL (miles)</div>
                        <div style={{marginBottom:20}}><InputMiles value={cat.presupuesto} onChange={v=>updCat(cat.id,{presupuesto:v})} style={inp}/></div>
                      </div>
                      <div><div style={{fontSize:10,color:t.t3,fontWeight:700,marginBottom:3}}>TIPO</div><select value={cat.tipo} onChange={e=>updCat(cat.id,{tipo:e.target.value})} style={{...inp,appearance:"none"}}><option value="esencial">🏠 Esencial</option><option value="variable">🔄 Variable</option><option value="personal">🎭 Personal</option></select></div>
                      <button onClick={()=>setEdit(null)} style={{gridColumn:"1/-1",padding:"9px",borderRadius:9,background:t.accent,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>✓ OK</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {showAdd&&(
        <div style={{background:t.card,borderRadius:14,padding:"14px",border:`1.5px dashed ${t.green}55`,marginTop:8}}>
          <input value={nuevo} onChange={e=>setNuevo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()} placeholder="Ej: Peluquería, Seguro..." style={inp} autoFocus/>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={addCat} style={{flex:1,padding:"9px",borderRadius:9,background:t.green,color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Agregar</button>
            <button onClick={()=>setAdd(false)} style={{padding:"9px 13px",borderRadius:9,background:t.muted,color:t.t2,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      )}

      {/* MOVIMIENTOS DEL MES */}
      <div style={{marginTop:20,borderTop:`1px solid ${t.border}`,paddingTop:16}}>
        <button onClick={()=>setShowMovs(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:showMovs?12:0}}>
          <div style={{fontSize:13,fontWeight:700,color:t.t1}}>💸 Movimientos del mes <span style={{fontSize:11,fontWeight:600,color:t.t3}}>({mesG.length})</span></div>
          <span style={{fontSize:18,color:t.t3,display:"inline-block",transform:showMovs?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>⌄</span>
        </button>
        {showMovs&&(
          mesG.length===0
            ?<div style={{textAlign:"center",color:t.t3,fontSize:13,padding:"20px 0",background:t.card,borderRadius:12,border:`1px solid ${t.border}`}}>Sin movimientos este mes</div>
            :[...mesG].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(g=>{
                const cat=categorias.find(c=>c.id===g.catId);
                return(
                  <div key={g.id} style={{background:t.card,borderRadius:12,padding:"11px 13px",marginBottom:7,border:`1px solid ${t.border}`,display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:34,height:34,borderRadius:10,background:(cat?.color||"#94A3B8")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{cat?.icon||"📦"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:t.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.desc||cat?.nombre||"Sin descripción"}</div>
                      <div style={{fontSize:10,color:t.t3}}>{g.fecha}</div>
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:g.monto>0?t.green:t.red,flexShrink:0,marginRight:4}}>{g.monto>0?"+":""}{fmtK(g.monto)}</div>
                    <button onClick={()=>delGasto(g.id)} style={{width:30,height:30,borderRadius:8,border:`1px solid ${t.border}`,background:t.redBg,color:t.red,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700}}>✕</button>
                  </div>
                );
              })
        )}
        {showMovs&&mesG.length>0&&(
          <button onClick={()=>{if(window.confirm("¿Eliminar TODOS los movimientos del mes?"))setData(d=>({...d,gastos:d.gastos.filter(g=>{const dd=new Date(g.fecha);return!(dd.getMonth()===NOW.getMonth()&&dd.getFullYear()===NOW.getFullYear());})}));}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:11,background:t.redBg,color:t.red,border:`1px solid ${t.red}22`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
            🗑️ Borrar todos los movimientos del mes
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AJUSTES
// ══════════════════════════════════════════════════════════
function AjustesView({data,setData,t,isDark,onSyncGmail}){
  const [tab,setTab]=useState("gmail");
  const [copiado,setCop]=useState(false);
  const [syncing,setSyn]=useState(false);
  const [syncMsg,setSMsg]=useState("");
  const inp={width:"100%",boxSizing:"border-box",background:t.inp,border:`1px solid ${t.inpB}`,borderRadius:10,padding:"10px 12px",color:t.t1,fontSize:14,outline:"none",fontFamily:"inherit"};

  const sincronizarAhora=async()=>{
    const SB_URL="https://tiayaaxtiyqobmhojhgm.supabase.co";
    const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
    setSyn(true);setSMsg("🔦 Consultando...");
    try{
      const res=await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*&order=created_at.desc`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}});
      if(!res.ok)throw new Error("Error DB");
      const b=await res.json();
      if(b.length>0){setSMsg(`✅ ${b.length} boleta(s) — ve a Panorama`);onSyncGmail(b.map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null})));}
      else setSMsg("✓ Sin boletas nuevas");
    }catch(e){setSMsg("Error: "+e.message);}
    setSyn(false);
  };

  return(
    <div>
      <div style={{fontSize:21,fontWeight:800,color:t.t1,marginBottom:16,letterSpacing:-0.5}}>Ajustes ⚙️</div>
      {/* Ingresos en miles */}
      <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1px solid ${t.border}`,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:t.t1,marginBottom:8}}>💼 Ingresos mensuales (en miles)</div>
        <div style={{marginBottom:20}}>
          <InputMiles value={data.ingresos||0} onChange={v=>setData(d=>({...d,ingresos:v}))} style={inp}/>
        </div>
        {data.ingresos>0&&<div style={{fontSize:12,color:t.green,marginTop:6}}>✓ {fmtFull(data.ingresos)} registrados</div>}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,background:t.muted,borderRadius:12,padding:4}}>
        {[["gmail","📧 Gmail"],["wsp","💬 WhatsApp"],["cuenta","👤 Cuenta"]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:tab===id?t.card:"transparent",color:tab===id?t.t1:t.t3}}>{l}</button>
        ))}
      </div>
      {tab==="gmail"&&(
        <div>
          <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1px solid ${t.border}`,marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:t.t1,marginBottom:8}}>Script Gmail v2.1</div>
            <button onClick={()=>{navigator.clipboard?.writeText(APPS_SCRIPT_CODE).then(()=>{setCop(true);setTimeout(()=>setCop(false),3e3);});}} style={{width:"100%",padding:"11px",borderRadius:12,background:copiado?"#25A244":"#EA4335",color:"#fff",fontWeight:700,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:8}}>{copiado?"✅ ¡Copiado!":"📋 Copiar script"}</button>
            <button onClick={()=>window.open("https://script.google.com","_blank")} style={{width:"100%",padding:"10px",borderRadius:12,background:t.muted,color:t.t2,fontWeight:600,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>🌐 Abrir script.google.com →</button>
          </div>
          <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1px solid ${t.border}`,marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:t.t1,marginBottom:4}}>URL Web App</div>
            <input value={data.gmailWebAppUrl||""} onChange={e=>setData(d=>({...d,gmailWebAppUrl:e.target.value.trim()}))} placeholder="https://script.google.com/macros/s/..." style={{...inp,marginBottom:8,fontSize:12}}/>
            {data.gmailWebAppUrl&&<button onClick={sincronizarAhora} disabled={syncing} style={{width:"100%",padding:"11px",borderRadius:12,background:syncing?t.muted:`linear-gradient(135deg,${t.green},#047857)`,color:syncing?t.t2:"#fff",fontWeight:700,border:"none",cursor:syncing?"not-allowed":"pointer",fontFamily:"inherit",fontSize:14}}>{syncing?"⏳ Consultando...":"🔄 Sincronizar Gmail ahora"}</button>}
            {syncMsg&&<div style={{fontSize:12,color:syncMsg.startsWith("✅")||syncMsg.startsWith("✓")?t.green:t.red,marginTop:8,textAlign:"center",fontWeight:600}}>{syncMsg}</div>}
          </div>
        </div>
      )}
      {tab==="wsp"&&(
        <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1px solid ${t.border}`}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}><span style={{fontSize:28}}>💬</span><div><div style={{fontSize:14,fontWeight:700,color:t.t1}}>Alertas WhatsApp</div><div style={{fontSize:12,color:t.t3}}>FARO te avisa de vencimientos</div></div></div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:5}}>TU NÚMERO</div><input value={data.telefono||""} onChange={e=>setData(d=>({...d,telefono:e.target.value}))} placeholder="+56912345678" style={inp}/></div>
            <div><div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:5}}>API KEY (CallMeBot)</div><input value={data.whatsappKey||""} onChange={e=>setData(d=>({...d,whatsappKey:e.target.value}))} placeholder="Ej: 123456" style={inp}/></div>
          </div>
        </div>
      )}
      {tab==="cuenta"&&(
        <div style={{background:t.card,borderRadius:16,padding:"16px",border:`1px solid ${t.border}`}}>
          <div style={{textAlign:"center",padding:"10px 0 16px"}}>
            <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#0F4C81,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",margin:"0 auto 10px"}}>C</div>
            <div style={{fontSize:17,fontWeight:700,color:t.t1}}>Cristian</div><div style={{fontSize:12,color:t.t3}}>Usuario FARO</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"Compromisos",v:data.compromisos.filter(c=>c.activo).length},{l:"Categorías",v:data.categorias.length},{l:"Movim.",v:data.gastos.length}].map(({l,v})=>(
              <div key={l} style={{textAlign:"center",padding:"12px 8px",borderRadius:12,background:t.muted,border:`1px solid ${t.border}`}}><div style={{fontSize:20,fontWeight:800,color:t.accent}}>{v}</div><div style={{fontSize:10,color:t.t3,marginTop:2}}>{l}</div></div>
            ))}
          </div>
          <button onClick={()=>{if(window.confirm("¿Borrar todos los movimientos?"))setData(d=>({...d,gastos:[]}));}} style={{width:"100%",padding:"11px",borderRadius:12,background:t.redBg,color:t.red,border:`1px solid ${t.red}33`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>🗑️ Borrar todos los movimientos</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODAL NUEVO MOVIMIENTO — input en miles
// ══════════════════════════════════════════════════════════
function AddModal({data,setData,t,isDark,onClose}){
  const [tipo,setTipo]=useState("gasto");
  const [catId,setCatId]=useState(data.categorias[0]?.id||"otros");
  const [desc,setDesc]=useState("");
  const [monto,setMonto]=useState(0);
  const [fecha,setFecha]=useState(NOW.toISOString().split("T")[0]);
  const [emocion,setEm]=useState("funcional");
  const [aiSug,setAiSug]=useState("");
  const [aiLoad,setAiL]=useState(false);

  useEffect(()=>{
    if(desc.length<4)return;
    const timer=setTimeout(async()=>{
      setAiL(true);
      try{
        const ids=data.categorias.map(c=>c.id).join(",");
        const r=await askFaro([{role:"user",content:`Categoriza: "${desc}". SOLO JSON: {"catId":"uno_de_estos:${ids}","emocion":"funcional/recompensa/impulsivo/social/estres/necesario","tipo":"gasto/ingreso"}`}]);
        const res=JSON.parse(r.replace(/```json|```/g,"").trim());
        if(res.catId&&data.categorias.find(c=>c.id===res.catId))setCatId(res.catId);
        if(res.emocion)setEm(res.emocion);
        if(res.tipo)setTipo(res.tipo);
        const cat=data.categorias.find(c=>c.id===res.catId);
        if(cat)setAiSug(`${cat.icon} ${cat.nombre}`);
      }catch{}
      setAiL(false);
    },800);
    return()=>clearTimeout(timer);
  },[desc]);

  const guardar=()=>{
    if(!monto)return;
    setData(d=>({...d,gastos:[{id:Date.now(),catId,desc,monto:tipo==="ingreso"?Math.abs(monto):-Math.abs(monto),fecha,emocion,origen:"manual"},...d.gastos]}));
    onClose();
  };
  const inp={width:"100%",boxSizing:"border-box",background:t.inp,border:`1px solid ${t.inpB}`,borderRadius:10,padding:"10px 12px",color:t.t1,fontSize:14,outline:"none",fontFamily:"inherit"};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",zIndex:300,backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:t.card,borderRadius:"24px 24px 0 0",padding:"20px 16px 36px",maxHeight:"94vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:t.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{fontSize:17,fontWeight:800,color:t.t1,marginBottom:14}}>Nuevo movimiento</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
          {["gasto","ingreso"].map(tp=>(
            <button key={tp} onClick={()=>{setTipo(tp);setAiSug("");}} style={{padding:"11px",borderRadius:12,border:`2px solid ${tipo===tp?(tp==="gasto"?t.red:t.green):t.border}`,background:tipo===tp?(tp==="gasto"?t.redBg:t.greenBg):t.muted,color:tipo===tp?(tp==="gasto"?t.red:t.green):t.t2,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{tp==="gasto"?"❤️ Gasto":"💚 Ingreso"}</button>
          ))}
        </div>
        {/* Monto en miles */}
        <div style={{marginBottom:18,background:t.muted,borderRadius:16,padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:8}}>MONTO (en miles de pesos)</div>
          <div style={{position:"relative",display:"inline-block",width:"100%"}}>
            <InputMiles value={monto} onChange={setMonto} style={{...inp,fontSize:32,fontWeight:900,textAlign:"center",border:"none",background:"transparent",color:tipo==="gasto"?t.red:t.green}}/>
          </div>
          {monto>0&&<div style={{fontSize:13,color:t.t2,marginTop:4}}>= {fmtFull(monto)}</div>}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:5}}>¿EN QUÉ?</div>
          <input placeholder="Ej: almuerzo, bencina..." value={desc} onChange={e=>setDesc(e.target.value)} style={inp}/>
          {aiLoad&&<div style={{fontSize:11,color:t.t3,marginTop:3}}>🤖 Categorizando...</div>}
          {aiSug&&!aiLoad&&<div style={{fontSize:11,color:t.accent,marginTop:3}}>✨ Sugiere: {aiSug}</div>}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:7}}>CATEGORÍA</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{data.categorias.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${catId===c.id?c.color:t.border}`,background:catId===c.id?c.color+"18":t.muted,color:catId===c.id?c.color:t.t2,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{c.icon} {c.nombre}</button>)}</div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:7}}>¿POR QUÉ?</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{EMOCIONES.map(e=><button key={e.id} onClick={()=>setEm(e.id)} style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${emocion===e.id?e.color:t.border}`,background:emocion===e.id?e.color+"18":t.muted,color:emocion===e.id?e.color:t.t2,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{e.icon} {e.label}</button>)}</div>
          {emocion==="impulsivo"&&<div style={{marginTop:8,padding:"9px 12px",borderRadius:10,background:t.redBg,fontSize:12,color:t.red}}>⚡ ¿Realmente lo necesitas ahora?</div>}
        </div>
        <div style={{marginBottom:18}}><div style={{fontSize:11,color:t.t3,fontWeight:700,marginBottom:5}}>FECHA</div><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/></div>
        <button onClick={guardar} disabled={!monto} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:!monto?t.muted:`linear-gradient(135deg,${t.accent},#1565C0)`,color:!monto?t.t3:"#fff",fontSize:16,fontWeight:800,cursor:!monto?"not-allowed":"pointer",fontFamily:"inherit"}}>Guardar</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function FaroApp(){
  const [isDark,setIsDark]=useState(false);
  const [tab,setTab]=useState("panorama");
  const [showAdd,setAdd]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [data,setData]=useState({ingresos:0,telefono:"",whatsappKey:"",gmailWebAppUrl:"",boletasGmail:[],compromisos:COMP_DEFAULT,categorias:CATS_DEFAULT,gastos:[]});
  const t=isDark?DK:LT;

  useEffect(()=>{
    Promise.all([S.get("faro2_data",null),S.get("faro2_dark",false)]).then(([d,dk])=>{
      if(d)setData(prev=>({...prev,...d}));
      setIsDark(dk);setLoaded(true);
    });
  },[]);
  useEffect(()=>{if(loaded)S.set("faro2_data",data);},[data,loaded]);
  useEffect(()=>{if(loaded)S.set("faro2_dark",isDark);},[isDark,loaded]);

  useEffect(()=>{
    if(!loaded||!data.gmailWebAppUrl)return;
    const SB_URL="https://tiayaaxtiyqobmhojhgm.supabase.co";
    const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
    fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}})
      .then(r=>r.json()).then(b=>{if(b?.length>0)setData(d=>({...d,boletasGmail:b.map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}))}));})
      .catch(()=>{});
  },[loaded]);

  const confirmarBoletas=useCallback((boletas)=>{
    if(!boletas.length){setData(d=>({...d,boletasGmail:[]}));return;}
    setData(d=>({...d,compromisos:d.compromisos.map(comp=>{const match=boletas.find(b=>b.key===comp.gmailKey);if(match&&match.monto>0){const patch={monto:match.monto};if(match.diaVence!==null&&match.diaVence!==undefined)patch.dia=match.diaVence;return{...comp,...patch};}return comp;}),boletasGmail:[]}));
  },[]);

  const TABS=[{id:"panorama",icon:"🔦",label:"Panorama"},{id:"compromisos",icon:"📋",label:"Compromisos"},{id:"presupuesto",icon:"🎯",label:"Presupuesto"},{id:"ajustes",icon:"⚙️",label:"Ajustes"}];

  if(!loaded)return(
    <div style={{minHeight:"100vh",background:"#0F4C81",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:56,marginBottom:14}}>🔦</div>
      <div style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-1}}>FARO</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",marginTop:5}}>Tu copiloto financiero</div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'DM Sans','Inter',system-ui,sans-serif",color:t.t1,maxWidth:480,margin:"0 auto"}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:t.nav,borderBottom:`1px solid ${t.border}`,padding:"11px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:t.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#0F4C81,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🔦</div>
          <div><div style={{fontSize:16,fontWeight:900,color:t.t1,letterSpacing:-0.5}}>FARO</div><div style={{fontSize:9,color:t.t3,fontWeight:600,letterSpacing:0.5}}>COPILOTO FINANCIERO</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {data.boletasGmail?.length>0&&<div style={{width:20,height:20,borderRadius:"50%",background:t.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer"}} onClick={()=>setTab("panorama")}>{data.boletasGmail.length}</div>}
          <div onClick={()=>setIsDark(d=>!d)} style={{width:42,height:23,borderRadius:12,background:isDark?t.accent:t.border,position:"relative",cursor:"pointer"}}>
            <div style={{position:"absolute",top:2,left:isDark?21:2,width:19,height:19,borderRadius:"50%",background:"#fff",transition:"left 0.25s",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{isDark?"🌙":"☀️"}</div>
          </div>
        </div>
      </div>
      <div style={{padding:"16px 14px 100px"}}>
        {tab==="panorama"&&<PanoramaView data={data} onBoletasConfirmadas={confirmarBoletas} t={t} isDark={isDark}/>}
        {tab==="compromisos"&&<CompromisosView data={data} setData={setData} t={t} isDark={isDark}/>}
        {tab==="presupuesto"&&<PresupuestoView data={data} setData={setData} t={t} isDark={isDark}/>}
        {tab==="ajustes"&&<AjustesView data={data} setData={setData} t={t} isDark={isDark} onSyncGmail={b=>{setData(d=>({...d,boletasGmail:b}));setTab("panorama");}}/>}
      </div>
      <button onClick={()=>setAdd(true)} style={{position:"fixed",bottom:78,right:"50%",transform:"translateX(calc(50% + 100px))",width:52,height:52,borderRadius:"50%",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#0F4C81,#06B6D4)",color:"#fff",fontSize:26,boxShadow:"0 4px 20px rgba(15,76,129,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:90}}>+</button>
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:t.nav,borderTop:`1px solid ${t.border}`,display:"flex",padding:"7px 0 16px",zIndex:99}}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{fontSize:21,filter:tab===tb.id?"none":"grayscale(1) opacity(0.4)"}}>{tb.icon}</div>
            <span style={{fontSize:9,fontWeight:700,color:tab===tb.id?t.accent:t.t3}}>{tb.label}</span>
          </button>
        ))}
      </nav>
      {showAdd&&<AddModal data={data} setData={setData} t={t} isDark={isDark} onClose={()=>setAdd(false)}/>}
      <style>{`::-webkit-scrollbar{width:0;height:0}*{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}
