'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

const SB_URL = "https://tiayaaxtiyqobmhojhgm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
const SB_HDR = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const FINTOC_PK = "pk_live_7NB6MiG-HcLbpmcVe2fEbywiBn5sSLY5qQ-DxotTC8Y";
const S = {
  get: (k, d) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const co = {
  bgLight:'#F4F7F6', bgDark:'#0D1B2A', cardLight:'#FFFFFF', cardDark:'#1B263B',
  textLight:'#1E293B', textDark:'#E2E8F0', mutedLight:'#64748B', mutedDark:'#94A3B8',
  primary:'#005F73', secondary:'#0A9396', green:'#2A9D8F', yellow:'#E9C46A',
  orange:'#F4A261', red:'#E76F51', borderLight:'#E2E8F0', borderDark:'#2C3E50',
};
const COMP_DEF = [
  { id:1, nombre:'Dividendo', monto:550000, dia:5, banco:'Scotiabank', pagado:false, activo:true, gmailKey:'scotiabank', tipo:'fijo', fechaPago:null },
  { id:2, nombre:'Gastos Comunes', monto:1148896, dia:10, banco:'', pagado:false, activo:true, gmailKey:'gastos_comunes', tipo:'fijo', fechaPago:null },
  { id:3, nombre:'Celular', monto:12990, dia:28, banco:'Entel', pagado:false, activo:true, gmailKey:'entel', tipo:'fijo', fechaPago:null },
  { id:4, nombre:'Agua', monto:698781, dia:22, banco:'Aguas Andinas', pagado:false, activo:true, gmailKey:'aguas_andinas', tipo:'fijo', fechaPago:null },
  { id:5, nombre:'Luz', monto:663141, dia:8, banco:'Enel', pagado:false, activo:true, gmailKey:'enel', tipo:'fijo', fechaPago:null },
  { id:6, nombre:'Gas', monto:1492505, dia:20, banco:'Metrogas', pagado:false, activo:true, gmailKey:'metrogas', tipo:'fijo', fechaPago:null },
  { id:7, nombre:'Internet Hogar', monto:23270, dia:28, banco:'Entel', pagado:false, activo:true, gmailKey:'entel_hogar', tipo:'fijo', fechaPago:null },
];
const CATS_DEF = [
  {id:'bencina', nombre:'Bencina', icon:'⛽', color:'#3B82F6'},
  {id:'comida', nombre:'Comida', icon:'🍽️', color:'#F59E0B'},
  {id:'cafe', nombre:'Café', icon:'☕', color:'#D97706'},
  {id:'super', nombre:'Supermercado', icon:'🛒', color:'#10B981'},
  {id:'deporte', nombre:'Deporte', icon:'🏋️', color:'#8B5CF6'},
  {id:'ahorro', nombre:'Ahorro', icon:'💰', color:'#059669'},
  {id:'shopping', nombre:'Shopping', icon:'🛍️', color:'#EC4899'},
  {id:'farmacia', nombre:'Farmacia', icon:'💊', color:'#7C3AED'},
  {id:'entretenim', nombre:'Entretención', icon:'🎬', color:'#EF4444'},
  {id:'sueldo', nombre:'Sueldo', icon:'💼', color:'#005F73'},
  {id:'comision', nombre:'Comisión', icon:'🏆', color:'#F59E0B'},
  {id:'otros', nombre:'Otros', icon:'📦', color:'#94A3B8'},
];
const BANCOS_FINTOC = [
  { id:'cl_banco_de_chile', nombre:'Banco de Chile', icon:'🔴', color:'#CC0000' },
  { id:'cl_santander', nombre:'Santander', icon:'🔴', color:'#EC0000' },
  { id:'cl_banco_estado', nombre:'BancoEstado', icon:'🟦', color:'#003087' },
  { id:'cl_bci', nombre:'BCI', icon:'🔵', color:'#0033A0' },
  { id:'cl_scotiabank', nombre:'Scotiabank', icon:'🟠', color:'#FF3300' },
  { id:'cl_itau', nombre:'Itaú', icon:'🟡', color:'#EC7000' },
  { id:'cl_bice', nombre:'Banco BICE', icon:'🔵', color:'#003DA5' },
  { id:'cl_security', nombre:'Banco Security', icon:'🟢', color:'#00853F' },
  { id:'cl_falabella', nombre:'Banco Falabella', icon:'🩷', color:'#E31837' },
];

// Suma de "Otros ingresos" del mes actual (movimientos tipo ingreso)
function ingresosExtraMes(gastos){
  return (gastos||[]).filter(g=>g.tipo==='ingreso'&&(()=>{return enMesActual(g);})()).reduce((s,g)=>s+Number(g.monto||0),0);
}
function calcTension(d, ing, gast) {
  const comp = (Array.isArray(d)?d:(d?.compromisos||[])).filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0)+(Array.isArray(d)?0:atrasosPendientes(d));
  const i = ing||(Array.isArray(d)?0:(d?.ingresos||0)+ingresosExtraMes(d?.gastos))||0;
  if(!i) return 0;
  return Math.min(100,Math.round(((comp+(gast||0))/i)*100));
}
function calcScore(data) {
  const {ingresos,compromisos,gastos} = data;
  if(!ingresos) return 0;
  const mesG = gastos.filter(g=>{return enMesActual(g);});
  const tg = mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const ingT = ingresos+ingresosExtraMes(gastos);
  const ratio = (compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0)+atrasosPendientes(data)+tg)/ingT;
  let score=100;
  if(ratio>0.9) score-=40; else if(ratio>0.7) score-=20; else if(ratio>0.5) score-=10;
  const pag=compromisos.filter(c=>c.pagado).length, tot=compromisos.filter(c=>c.activo).length;
  if(tot>0) score+=Math.round((pag/tot)*15);
  return Math.min(100,Math.max(0,score));
}
function scoreLabel(s){return s>=80?'Excelente 💚':s>=60?'Bueno 💛':s>=40?'Regular 🟠':'Crítico 🔴';}
const fmt = v => v?'$'+Math.round(Math.abs(Number(v))).toLocaleString('es-CL'):'$0';
const NOW = new Date();
const MES = NOW.getMonth();
const ANO = NOW.getFullYear();
const MNOM = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MNOM_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
// Mes como clave "AAAA-MM". Cada cuenta guarda pagadoMes[clave] cuando se cierra un mes.
const keyMes=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
const KEY_HOY=keyMes(ANO,MES);
const pagadoEn=(c,k)=>k===KEY_HOY?!!c.pagado:!!(c.pagadoMes&&c.pagadoMes[k]);
const sumaMonto=arr=>arr.reduce((s,x)=>s+Number(x.monto||0),0);
// Fecha AAAA-MM-DD: se lee como mes/año directo (new Date() la tomaba en UTC y el día 1 caía en el mes anterior en Chile)
const enMesActual=g=>{const m=String(g?.fecha||'').match(/^(\d{4})-(\d{2})/);if(m)return Number(m[1])===ANO&&Number(m[2])-1===MES;const d=new Date(g?.fecha);return d.getMonth()===MES&&d.getFullYear()===ANO;};
// Cuentas cuyo monto cambia cada mes: al cambiar de mes el monto se borra hasta que llegue la boleta o se ingrese
const esVariable=c=>(typeof c.variable==='boolean')?c.variable:/gastos comunes|agua|luz|internet|celular/i.test(c.nombre||'');
// Pendientes que pasan al mes en curso: cuentas no pagadas del mes actual más atrasos sin pagar
const atrasosPendientes=d=>sumaMonto((d?.atrasos||[]).filter(a=>!a.pagado));
// Atrasos sin pagar como cuentas vencidas (para listas, recordatorios y plan)
const atrasosComoItems=d=>(d?.atrasos||[]).filter(a=>!a.pagado).map(a=>({id:'at'+a.id,nombre:a.nombre+' (atrasada)',monto:a.monto,dia:NOW.getDate(),dr:-1,activo:true,pagado:false}));
const pendientesMes=d=>sumaMonto((d?.compromisos||[]).filter(c=>c.activo&&!c.pagado&&c.monto>0))+atrasosPendientes(d);
const DNOM = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
function diasHasta(dia){const v=new Date(ANO,MES,dia);if(v<NOW)v.setMonth(v.getMonth()+1);return Math.ceil((v-NOW)/864e5);}
// Compromiso con fecha exacta (fecha 'YYYY-MM-DD') o recurrente por día del mes
function diasDe(c){if(c.fecha){const[y,m,d]=c.fecha.split('-').map(Number);return Math.ceil((new Date(y,m-1,d)-NOW)/864e5);}return diasHasta(c.dia);}
// Días hasta el vencimiento dentro de ESTE mes (negativo = ya venció, 0 = hoy). Para recordatorios.
function diasReal(dia){return Math.round((new Date(ANO,MES,dia)-new Date(ANO,MES,NOW.getDate()))/864e5);}
function getIcon(n){const l=n.toLowerCase();if(l.includes('gastos comunes'))return'🏢';if(l.includes('luz')||l.includes('enel'))return'💡';if(l.includes('agua'))return'💧';if(l.includes('gas')&&!l.includes('gastos'))return'🔥';if(l.includes('dividendo'))return'🏠';if(l.includes('celular')||l.includes('entel'))return'📱';if(l.includes('internet')||l.includes('tv')||l.includes('vtr'))return'📡';return'📋';}

/* ===== Plan Mensual: lectura de boletas / cartola (formato es-CL) ===== */
const MESES_ES={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
const CAT_KW={bencina:['copec','shell','petrobras','aramco','bencina','combustible','esso','terpel'],super:['jumbo','lider','líder','unimarc','santa isabel','tottus','acuenta','ekono','mayorista'],comida:['restaurant','mcdonald','pedidosya','uber eats','rappi','doggis','almuerzo','burger'],cafe:['starbucks','cafe','café','juan valdez','dunkin'],farmacia:['farmacia','cruz verde','salcobrand','ahumada'],shopping:['falabella','ripley','paris','mercadolibre','mercado libre','aliexpress','amazon'],entretenim:['netflix','spotify','disney','cine','hbo','prime','youtube','steam'],deporte:['smartfit','gym','sportlife','pacific']};
const FIJO_KW=['dividendo','gastos comunes','enel','aguas','agua','metrogas','entel','vtr','internet','scotiabank','contribuciones','seguro','boleta'];
const ING_KW=['abono','deposito','depósito','sueldo','remuneracion','remuneración','haber','anticipo','transferencia recibida'];
function nMonto(tok){const n=(tok||'').replace(/[^0-9]/g,'');return n?parseInt(n,10):0;}
function leerMonto(l){const s=l.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,' ');const m=s.match(/\$\s?\d[\d\.]*|\d{1,3}(?:\.\d{3})+|\d{4,}/g);return m?Math.max(...m.map(nMonto)):0;}
function leerDia(l){const t=l.toLowerCase();const n=t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]\d{2,4}/);if(n)return Math.min(31,Math.max(1,+n[1]));const x=t.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)/);if(x&&MESES_ES[x[2]])return Math.min(31,Math.max(1,+x[1]));return null;}
function clasif(desc){const d=(desc||'').toLowerCase();if(FIJO_KW.some(k=>d.includes(k)))return{tipo:'fijo',catId:'otros'};for(const[id,kws]of Object.entries(CAT_KW)){if(kws.some(k=>d.includes(k)))return{tipo:'gasto',catId:id};}return{tipo:'gasto',catId:'otros'};}
function parseMovimientos(txt){const out=[];(txt||'').split(/\r?\n/).forEach(raw=>{const l=raw.trim();if(!l||l.length<3)return;const monto=leerMonto(l);if(monto<500)return;let desc=l.replace(/\$\s?\d[\d\.]*/g,' ').replace(/\d{1,3}(?:\.\d{3})+/g,' ').replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,' ').replace(/vence|vencimiento|pague hasta|pagar hasta|fecha de pago|total a pagar|monto/gi,' ').replace(/[;,\t\|]+/g,' ').replace(/\s{2,}/g,' ').trim();if(!desc)desc='Movimiento';const dl=l.toLowerCase();const cl=clasif(desc);const tipo=ING_KW.some(k=>dl.includes(k))?'ingreso':cl.tipo;const dia=tipo==='fijo'?leerDia(l):null;out.push({id:Math.random().toString(36).slice(2),desc:desc.slice(0,42),monto,tipo,catId:cl.catId,dia,incluir:true});});return out;}
function pagoCubre(dia,lista){const ps=[...lista].sort((a,b)=>a.dia-b.dia);let ch=ps[ps.length-1];for(const p of ps){if(p.dia<=dia)ch=p;}return ch;}
// Optimiza el reparto: prueba todas las combinaciones posibles de pago por cuenta y elige la que deja menos faltante.
// Una cuenta solo puede pagarse con un ingreso que llegue antes de su vencimiento (o con el último ingreso del ciclo anterior).
function repartir(bills,lista){
  const ps=[...lista].sort((a,b)=>a.dia-b.dia);
  if(!ps.length||!bills.length)return bills.map(b=>({bill:b,nombre:ps[ps.length-1]?.nombre||''}));
  const opts=bills.map(b=>{const e=ps.filter(p=>p.dia<=b.dia).map(p=>p.nombre);return e.length?e:[ps[ps.length-1].nombre];});
  const total=opts.reduce((p,o)=>p*o.length,1);
  if(total>8192)return bills.map(b=>({bill:b,nombre:pagoCubre(b.dia,lista).nombre}));
  const monto=n=>Number(n||0);
  let best=null;
  for(let n=0;n<total;n++){
    let x=n;const asg=opts.map(o=>{const c=o[x%o.length];x=Math.floor(x/o.length);return c;});
    const sums={};ps.forEach(p=>{sums[p.nombre]=0;});
    bills.forEach((b,i)=>{sums[asg[i]]+=monto(b.monto);});
    const def=ps.reduce((s,p)=>s+Math.max(0,sums[p.nombre]-monto(p.monto)),0);
    const bal=ps.reduce((s,p)=>s+Math.pow(monto(p.monto)-sums[p.nombre],2),0);
    if(!best||def<best.def||(def===best.def&&bal<best.bal))best={def,bal,asg};
  }
  return bills.map((b,i)=>({bill:b,nombre:best.asg[i]}));
}
// Boleta de un servicio = UN pago. Extrae solo "total a pagar" + "pagar hasta" + nombre del servicio.
const SERV_KW=[['boleta de hogar','Internet Hogar'],['entel','Celular (Entel)'],['movistar','Celular'],['claro','Celular'],['wom','Celular'],['vtr','Internet'],['mundo','Internet'],['gtd','Internet'],['enel','Luz'],['chilectra','Luz'],['cge','Luz'],['chilquinta','Luz'],['saesa','Luz'],['frontel','Luz'],['aguas andinas','Agua'],['essbio','Agua'],['esval','Agua'],['nuevosur','Agua'],['aguas','Agua'],['metrogas','Gas'],['lipigas','Gas'],['abastible','Gas'],['gasco','Gas'],['gastos comunes','Gastos Comunes'],['comunidad','Gastos Comunes'],['dividendo','Dividendo'],['móvil','Celular'],['movil','Celular'],['internet','Internet']];
const MES3={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,set:9,oct:10,nov:11,dic:12};
const MES_RE='ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic';
// Junta todas las fechas del texto: DD-MM-AAAA, DD/MM/AAAA, y con mes en letras (30-OCT-2026, 06 Nov 2026, 5 de noviembre 2026).
function fechasEnTexto(low){
  const res=[];let mt;
  const re1=/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
  while((mt=re1.exec(low))){let d=+mt[1],mo=+mt[2],y=+mt[3];if(y<100)y+=2000;if(mo>=1&&mo<=12&&d>=1&&d<=31)res.push({d,val:y*10000+mo*100+d,idx:mt.index});}
  const re2=new RegExp('(\\d{1,2})[\\s\\-\\/]+(?:de\\s+)?('+MES_RE+')[a-z]*[\\s\\-\\/]+(?:de\\s+)?(\\d{2,4})','gi');
  while((mt=re2.exec(low))){const mo=MES3[mt[2].toLowerCase()];let y=+mt[3];if(y<100)y+=2000;const d=+mt[1];if(mo&&d>=1&&d<=31&&y>2000)res.push({d,val:y*10000+mo*100+d,idx:mt.index});}
  return res;
}
// Monto total de una boleta: el valor más cercano a "total a pagar" (antes o después, por el layout a 2 columnas del OCR).
function leerMontoBoleta(low){
  const kws=['total a pagar','monto a pagar','total del mes','total mes','total venta'];
  let anchors=[];kws.forEach(k=>{let i=low.indexOf(k);while(i>=0){anchors.push(i+k.length);i=low.indexOf(k,i+1);}});
  if(!anchors.length)return 0;
  const toks=[];const re=/\$\s?\d[\d\.\,]*|\d{1,3}(?:\.\d{3})+/g;let m;
  while((m=re.exec(low))){const v=nMonto(m[0]);if(v>=1000)toks.push({v,idx:m.index});}
  if(!toks.length)return 0;
  let best=null,bd=1e9;toks.forEach(t=>anchors.forEach(a=>{const d=Math.abs(t.idx-a);if(d<bd){bd=d;best=t;}}));
  return best?best.v:0;
}
function parseBoleta(txt){
  const low=(txt||'').toLowerCase();
  if(!/total a pagar|monto a pagar|total mes|total del mes/.test(low))return null;
  const monto=leerMontoBoleta(low); if(monto<500)return null;
  const fechas=fechasEnTexto(low);
  let dia=null;
  let kwIdx=-1;for(const kw of ['pagar hasta','pague hasta','fecha de vencimiento','vencimiento','fecha de pago','vence']){const i=low.indexOf(kw);if(i>=0){kwIdx=i+kw.length;break;}}
  if(kwIdx>=0&&fechas.length){let best=null,bd=1e9;fechas.forEach(fh=>{const dist=Math.abs(fh.idx-kwIdx);if(dist<bd){bd=dist;best=fh;}});if(best&&bd<=60)dia=best.d;}
  if(!dia&&fechas.length){dia=fechas.reduce((a,b)=>b.val>a.val?b:a).d;}
  let nombre='Boleta';for(const[k,n]of SERV_KW){if(low.includes(k)){nombre=n;break;}}
  return[{id:Math.random().toString(36).slice(2),desc:nombre,monto,tipo:'fijo',catId:'otros',dia,incluir:true}];
}
// Decide: si parece boleta (un pago), usa parseBoleta; si no, cartola/lista.
function leerTexto(txt){const b=parseBoleta(txt);return(b&&b.length)?b:parseMovimientos(txt);}

const sigBoleta=b=>b.key+':'+b.monto;
// Envía un mensaje de WhatsApp con CallMeBot (requiere haber activado el número y tener la API key)
function enviarWhatsApp(telefono,apikey,texto){
  if(!telefono||!apikey)return Promise.resolve(false);
  const url=`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(telefono)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(apikey)}`;
  return fetch(url,{mode:'no-cors'}).then(()=>true).catch(()=>false);
}
// Sonido corto de celebración (generado con Web Audio, sin archivos). Si el navegador lo bloquea, no hace nada.
function sonidoCelebracion(todo){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ctx=new AC();
    const notas=todo?[523,659,784,1047,784,1047,1319]:[659,784,988];
    notas.forEach((f,i)=>{
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      const t0=ctx.currentTime+i*0.11;
      g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.25,t0+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.3);
      o.connect(g);g.connect(ctx.destination);o.start(t0);o.stop(t0+0.32);
    });
    setTimeout(()=>{try{ctx.close();}catch{}},2000);
  }catch{}
}
// Asistente de FARO: botón 💬 que abre un chat. Cada pregunta envía un resumen de tus finanzas.
function AsistenteFaro({data,t}){
  const [abierto,setAbierto]=useState(false);
  const [pregunta,setPregunta]=useState('');
  const [chat,setChat]=useState([]);
  const [cargando,setCargando]=useState(false);
  const finChatRef=useRef(null);
  useEffect(()=>{finChatRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[chat,cargando]);
  const construirResumen=()=>{
    const mesG=data.gastos.filter(g=>{return enMesActual(g);});
    const egreso=mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
    const ingAd=mesG.filter(g=>g.tipo==='ingreso').reduce((s,g)=>s+g.monto,0);
    const ingTotal=data.ingresos+ingAd;
    const activas=data.compromisos.filter(c=>c.activo);
    const compPend=activas.filter(c=>!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0)+atrasosPendientes(data);
    const disponible=ingTotal-egreso-compPend;
    const porCat=data.categorias.map(c=>c.nombre+': '+fmt(mesG.filter(g=>g.tipo==='gasto'&&g.catId===c.id).reduce((s,g)=>s+g.monto,0))).join('; ');
    const pend=[...activas.filter(c=>!c.pagado).map(c=>c.nombre+' '+fmt(c.monto)+' (día '+c.dia+')'),...(data.atrasos||[]).filter(a=>!a.pagado).map(a=>a.nombre+' '+fmt(a.monto)+' (atrasada de '+MNOM[Number(a.mes.split('-')[1])-1]+')')].join('; ');
    const movs=[...mesG].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,15).map(g=>String(g.fecha||'').slice(0,10)+' '+g.tipo+' '+fmt(g.monto)+' '+(g.desc||'')+' ['+(data.categorias.find(c=>c.id===g.catId)?.nombre||'?')+']').join('\n');
    return 'Fecha de hoy: '+new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'\nIngresos del mes: '+fmt(ingTotal)+'\nGastado este mes: '+fmt(egreso)+'\nCuentas pendientes: '+fmt(compPend)+' ('+(pend||'ninguna')+')\nDisponible después de pagar TODAS las cuentas pendientes del mes (ya descontadas, no restar otra vez): '+fmt(disponible)+'\nTensión: '+calcTension(data,ingTotal,egreso)+'%\nGasto por categoría: '+porCat+'\nÚltimos movimientos del mes:\n'+(movs||'ninguno');
  };
  const enviar=async()=>{
    const p=pregunta.trim();if(!p||cargando)return;
    setChat(c=>[...c,{rol:'yo',texto:p}]);setPregunta('');setCargando(true);
    try{
      const r=await fetch('/api/asistente',{method:'POST',headers:{'content-type':'application/json','x-faro-clave':data.gastoKey||''},body:JSON.stringify({pregunta:p,resumen:construirResumen()})});
      const j=await r.json();
      setChat(c=>[...c,{rol:'ia',texto:j.ok?j.respuesta:('⚠️ '+(j.error||'Error'))}]);
    }catch{setChat(c=>[...c,{rol:'ia',texto:'⚠️ No pude conectarme'}]);}
    setCargando(false);
  };
  return(
    <>
      <button onClick={()=>setAbierto(a=>!a)} aria-label="Asistente" style={{position:'fixed',right:16,bottom:84,width:52,height:52,borderRadius:26,border:'none',background:co.primary,color:'#fff',fontSize:22,boxShadow:'0 6px 18px rgba(0,0,0,0.25)',cursor:'pointer',zIndex:900}}>{abierto?'✕':'💬'}</button>
      {abierto&&(
        <div style={{position:'fixed',left:10,right:10,bottom:150,maxHeight:'60vh',display:'flex',flexDirection:'column',background:t.card,border:'1px solid '+t.border,borderRadius:18,boxShadow:'0 10px 30px rgba(0,0,0,0.25)',zIndex:901,overflow:'hidden'}}>
          <div style={{padding:'12px 14px',fontWeight:800,color:t.text,borderBottom:'1px solid '+t.border}}>Pregunta a FARO</div>
          <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8,minHeight:120}}>
            {chat.length===0&&<div style={{fontSize:12,color:t.muted}}>Ej: ¿cuánto llevo gastado en comida este mes? ¿Me alcanza para pagar Entel?</div>}
            {chat.map((m,i)=>(
              <div key={i} style={{alignSelf:m.rol==='yo'?'flex-end':'flex-start',maxWidth:'85%',padding:'8px 11px',borderRadius:12,background:m.rol==='yo'?co.primary:t.bg,color:m.rol==='yo'?'#fff':t.text,fontSize:13,lineHeight:1.45,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                {m.texto.split(/\*\*(.+?)\*\*/g).map((parte,j)=>j%2===1?<b key={j}>{parte}</b>:<span key={j}>{parte}</span>)}
              </div>
            ))}
            {cargando&&<div style={{fontSize:12,color:t.muted}}>Pensando…</div>}
            <div ref={finChatRef}/>
          </div>
          <div style={{display:'flex',gap:8,padding:10,borderTop:'1px solid '+t.border}}>
            <input value={pregunta} onChange={e=>setPregunta(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')enviar();}} placeholder="Escribe tu pregunta" style={{flex:1,padding:'9px 11px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13,fontFamily:'inherit'}}/>
            <button onClick={enviar} disabled={cargando} style={{padding:'9px 14px',borderRadius:10,border:'none',background:co.primary,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Enviar</button>
          </div>
        </div>
      )}
    </>
  );
}
// Celebración al pagar una cuenta: globos, flores y confeti que suben, y un mensaje que desaparece solo
function Celebracion({celebra}){
  if(!celebra)return null;
  const emojis=celebra.todo?['🎉','🎈','🌸','🎊','✨','🌷','🎈','🎉','🌼','✨','🎊','🎈']:['🎈','🌸','✨','🌷','🎈'];
  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'flex-start',overflow:'hidden'}}>
      <style>{`@keyframes fdIn{from{opacity:0;transform:translateY(-20px) scale(.9)}to{opacity:1;transform:none}}@keyframes fdUp{from{transform:translateY(0) rotate(0)}to{transform:translateY(-110vh) rotate(25deg)}}`}</style>
      {emojis.map((e,i)=>(
        <span key={i} style={{position:'absolute',bottom:-40,left:((i*37)%95)+'%',fontSize:celebra.todo?30:22,animation:`fdUp ${3+(i%3)}s ease-out ${i*0.25}s forwards`}}>{e}</span>
      ))}
      <div style={{marginTop:70,background:celebra.todo?'linear-gradient(135deg,#F59E0B,#EC4899)':'linear-gradient(135deg,#0A3A60,#005F73)',color:'#fff',padding:'14px 18px',borderRadius:18,maxWidth:'86%',boxShadow:'0 10px 30px rgba(0,0,0,0.25)',textAlign:'center',fontWeight:700,fontSize:14,fontFamily:'inherit',animation:'fdIn .4s ease-out'}}>{celebra.texto}</div>
    </div>
  );
}
function GmailBanner({boletas,onConfirmar,onDescartar,t,onVisto}){
  const [manuales,setManuales]=useState([]);
  const lista=[...(boletas||[]),...manuales];
  const [mostrarAdd,setMostrarAdd]=useState(false);
  const [nuevoM,setNuevoM]=useState({nombre:'',monto:'',dia:''});
  if(!lista.length&&!mostrarAdd)return null;
  return(
    <div style={{background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'1px solid '+co.green+'44',borderRadius:18,padding:16,marginBottom:20}}>
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        <span style={{fontSize:22}}>📨</span>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:'#064E3B'}}>FARO tiene {lista.length} boleta{lista.length===1?'':'s'} para cargar</div>
          <div style={{fontSize:12,color:t.muted}}>¿Cargar montos en FARO?</div>
        </div>
      </div>
      {lista.map(b=>(
        <div key={b.key} style={{padding:'9px 12px',background:'rgba(255,255,255,0.7)',borderRadius:10,marginBottom:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#064E3B'}}>{b.nombre}</div>
              {b.diaVence&&<div style={{fontSize:11,color:co.green}}>📅 Vence día {b.diaVence}</div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}><div style={{fontSize:15,fontWeight:800,color:co.green}}>{fmt(b.monto)}</div><button onClick={()=>{if(b.manual)setManuales(m=>m.filter(x=>x.key!==b.key));else if(onVisto)onVisto([b]);}} title="Quitar" style={{background:'transparent',border:'1px solid '+co.red+'55',color:co.red,borderRadius:8,width:26,height:26,cursor:'pointer',fontWeight:800,fontFamily:'inherit'}}>✕</button></div>
              {b.requiereVerif&&<div style={{fontSize:10,color:'#D97706',fontWeight:700}}>⚠️ Verifica monto</div>}
            </div>
          </div>
          {b.requiereVerif&&(
            <div style={{marginTop:6,display:'flex',gap:6,alignItems:'center'}}>
              <input type="number" defaultValue={b.monto} onChange={e=>{b.monto=Number(e.target.value);}} style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid #D97706',background:'#FFFBEB',color:'#92400E',fontSize:13,fontWeight:700,fontFamily:'inherit'}}/>
              <div style={{fontSize:10,color:'#92400E'}}>Edita si cambió</div>
            </div>
          )}
        </div>
      ))}
      {mostrarAdd?(
        <div style={{marginTop:8,padding:10,borderRadius:10,background:'rgba(255,255,255,0.7)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          <input placeholder="Nombre (ej. Préstamo)" value={nuevoM.nombre} onChange={e=>setNuevoM(p=>({...p,nombre:e.target.value}))} style={{gridColumn:'1/-1',padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit'}}/>
          <input type="number" placeholder="Monto $" value={nuevoM.monto} onChange={e=>setNuevoM(p=>({...p,monto:e.target.value}))} style={{padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit'}}/>
          <input type="number" min="1" max="31" placeholder="Día vence" value={nuevoM.dia} onChange={e=>setNuevoM(p=>({...p,dia:e.target.value}))} style={{padding:'8px 10px',borderRadius:8,border:'1px solid '+t.border,fontSize:13,fontFamily:'inherit'}}/>
          <button onClick={()=>{if(!nuevoM.nombre||!nuevoM.monto)return;setManuales(m=>[...m,{key:'manual-'+Date.now(),nombre:nuevoM.nombre,monto:Number(nuevoM.monto),diaVence:Number(nuevoM.dia)||null,requiereVerif:false,manual:true}]);setNuevoM({nombre:'',monto:'',dia:''});setMostrarAdd(false);}} style={{gridColumn:'1/-1',padding:8,borderRadius:8,border:'none',background:co.green,color:'#fff',fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>Agregar a la lista</button>
        </div>
      ):(
        <button onClick={()=>setMostrarAdd(true)} style={{marginTop:8,width:'100%',padding:9,borderRadius:10,border:'1px dashed '+co.green,background:'transparent',color:'#064E3B',fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>+ Agregar boleta</button>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
        <button onClick={onDescartar} style={{padding:10,borderRadius:10,background:'transparent',color:t.muted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Ignorar</button>
        <button onClick={()=>onConfirmar(lista)} style={{padding:10,borderRadius:10,background:'linear-gradient(135deg,'+co.green+',#047857)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>✓ Cargar en FARO</button>
      </div>
    </div>
  );
}

// Selector de mes (solo en Inicio y Cuentas)
function SelectorMes({valor,onChange,t}){
  const [y,m]=valor.split('-').map(Number);
  const mover=n=>{const d=new Date(y,m-1+n,1);onChange(keyMes(d.getFullYear(),d.getMonth()));};
  const btn={width:44,height:40,border:'none',background:'transparent',borderRadius:12,fontSize:20,color:co.primary,fontWeight:800,cursor:'pointer',fontFamily:'inherit'};
  return(
    <div aria-label="Selector de mes" style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:t.card,border:'1px solid '+t.border,borderRadius:16,padding:6}}>
      <button aria-label="Mes anterior" onClick={()=>mover(-1)} style={btn}>‹</button>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text}}>{MNOM_LARGO[m-1]} {y}</div>
        <div style={{fontSize:10,color:t.muted}}>{valor===KEY_HOY?'Mes en curso':valor>KEY_HOY?'Mes siguiente':'Mes anterior'}</div>
      </div>
      <button aria-label="Mes siguiente" onClick={()=>mover(1)} style={btn}>›</button>
    </div>
  );
}
function PanoramaView({data,setData,onConfirmarBoletas,t,mesVista,setMesVista}){
  const [showComprar,setShowComprar]=useState(false);
  const [showIng,setShowIng]=useState(false);
  const [editIng,setEditIng]=useState(null);
  const {ingresos,compromisos,gastos,boletasGmail,historial}=data;
  const mesG=gastos.filter(g=>{return enMesActual(g);});
  const egreso=mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const ingAd=mesG.filter(g=>g.tipo==='ingreso').reduce((s,g)=>s+g.monto,0);
  const ingTotal=ingresos+ingAd;
  // Mes visto: el actual incluye atrasos; un mes futuro proyecta lo pendiente de hoy; un mes pasado muestra lo pagado en su momento
  const esHoy=mesVista===KEY_HOY;
  const esFuturo=mesVista>KEY_HOY;
  const atrasos=(data.atrasos||[]).filter(a=>!a.incluido);
  const base=compromisos.filter(c=>c.activo);
  const totalComp=esHoy?sumaMonto(base)+sumaMonto(atrasos):esFuturo?sumaMonto(base)+pendientesMes(data):sumaMonto(base);
  const compPag=esHoy?sumaMonto(base.filter(c=>c.pagado))+sumaMonto(atrasos.filter(a=>a.pagado)):esFuturo?0:sumaMonto(base.filter(c=>pagadoEn(c,mesVista)));
  const disponible=ingTotal-egreso-(totalComp-compPag);
  const pctCub=totalComp>0?Math.min((compPag/totalComp)*100,100):0;
  const mesAnt=historial?.find(h=>{const d=new Date(ANO,MES-1,1);return h.mes===d.getMonth()&&h.ano===d.getFullYear();});
  const diffMes=mesAnt?Math.round(((egreso-mesAnt.totalGast)/Math.max(mesAnt.totalGast,1))*100):null;
  const dias=NOW.getDate();
  const diasM=new Date(ANO,MES+1,0).getDate();
  const proyM=(dias>0?egreso/dias:0)*diasM;
  const crisis=(proyM+(totalComp-compPag))>ingTotal;
  const proximos=compromisos.filter(c=>c.activo&&!c.pagado&&c.monto>0).map(c=>({...c,dias:diasDe(c)})).sort((a,b)=>a.dias-b.dias);
  return(
    <div>
      <div style={{marginBottom:14}}><SelectorMes valor={mesVista} onChange={setMesVista} t={t}/></div>
      <GmailBanner boletas={(boletasGmail||[]).filter(b=>!(data.boletasVistas||[]).includes(sigBoleta(b)))} onConfirmar={onConfirmarBoletas} onDescartar={()=>onConfirmarBoletas([])} onVisto={bs=>setData(d=>({...d,boletasVistas:[...(d.boletasVistas||[]),...bs.map(sigBoleta)]}))} t={t}/>
      {esHoy&&(()=>{const otros=mesG.filter(g=>g.tipo==='ingreso');const tot=otros.reduce((s,g)=>s+g.monto,0);return(
        <div style={{background:t.card,borderRadius:20,padding:16,border:'1px solid '+t.border,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:otros.length?10:0}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text}}>💚 Otros ingresos{otros.length?` · +${fmt(tot)}`:''}</div>
            <button onClick={()=>setShowIng(true)} style={{padding:'7px 12px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>+ Agregar</button>
          </div>
          {otros.map(g=>editIng&&editIng.id===g.id?(
            <div key={g.id} style={{display:'flex',flexDirection:'column',gap:8,padding:'9px 0',borderTop:'1px solid '+t.border}}>
              <input value={editIng.desc} onChange={e=>setEditIng(x=>({...x,desc:e.target.value}))} placeholder="Descripción" style={{width:'100%',boxSizing:'border-box',padding:'8px 10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13,fontFamily:'inherit'}}/>
              <input type="number" value={editIng.monto} onChange={e=>setEditIng(x=>({...x,monto:e.target.value}))} placeholder="Monto" style={{width:'100%',boxSizing:'border-box',padding:'8px 10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13,fontFamily:'inherit'}}/>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{const m=Number(editIng.monto);if(!m)return;setData(d=>({...d,gastos:d.gastos.map(x=>x.id===g.id?{...x,monto:m,desc:editIng.desc||'Ingreso'}:x)}));setEditIng(null);}} style={{flex:1,padding:'8px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Guardar</button>
                <button onClick={()=>setEditIng(null)} style={{flex:1,padding:'8px',borderRadius:10,background:'transparent',color:t.muted,border:'1px solid '+t.border,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              </div>
            </div>
          ):(
            <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'7px 0',borderTop:'1px solid '+t.border}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:t.text}}>{g.desc||'Ingreso'}</div>
                <div style={{fontSize:10,color:t.muted}}>{new Date(g.fecha).toLocaleDateString('es-CL')}</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:co.green}}>+{fmt(g.monto)}</div>
              <button onClick={()=>setEditIng({id:g.id,desc:g.desc||'',monto:String(g.monto)})} aria-label="Editar" style={{background:'none',border:'none',cursor:'pointer',fontSize:14,padding:'2px 4px'}}>✏️</button>
              <button onClick={()=>{if(window.confirm('¿Borrar este ingreso?'))setData(d=>({...d,gastos:d.gastos.filter(x=>x.id!==g.id)}));}} aria-label="Borrar" style={{background:'none',border:'none',cursor:'pointer',fontSize:14,padding:'2px 4px'}}>🗑️</button>
            </div>
          ))}
          {showIng&&<ModalMovimiento tipo="ingreso" data={data} setData={setData} t={t} onClose={()=>setShowIng(false)}/>}
        </div>
      );})()}
      <div style={{background:'linear-gradient(135deg,#0A3A60,#005F73)',borderRadius:24,padding:22,color:'#fff',marginBottom:16,boxShadow:'0 10px 25px rgba(0,95,115,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:10,opacity:0.7,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>ESTE MES NECESITAS</div>
            <div style={{fontSize:32,fontWeight:900,letterSpacing:-0.5}}>{fmt(totalComp)}</div>
          </div>
          <div style={{textAlign:'center'}}>
            {!esHoy?<div style={{fontSize:16,fontWeight:900,color:'#fff'}}>{pctCub.toFixed(0)}%</div>:(()=>{const tv=calcTension(data,ingTotal,egreso);const tc=tv>=85?co.red:tv>=50?co.yellow:co.green;return(
              <div>
                <div style={{width:52,height:52,borderRadius:'50%',border:'3px solid '+tc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:tc,background:'rgba(255,255,255,0.1)'}}>{tv}%</div>
                <div style={{fontSize:9,opacity:0.7,marginTop:3}}>TENSIÓN</div>
              </div>
            );})()}
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.15)',borderRadius:99,height:5,overflow:'hidden',marginBottom:8}}>
          <div style={{background:'#fff',width:`${pctCub}%`,height:'100%',borderRadius:99,transition:'width 0.5s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:0.8,marginBottom:16}}>
          <span>Pagado: {fmt(compPag)} ({Math.round(pctCub)}%)</span>
          <span>Quedan {fmt(totalComp-compPag)}</span>
        </div>
        {esHoy&&(()=>{const pend=compromisos.filter(c=>c.activo&&!c.pagado&&c.monto>0&&diasDe(c)<=15);const sumP=pend.reduce((s,c)=>s+Number(c.monto||0),0);return(
          <div style={{fontSize:12,fontWeight:700,marginBottom:14,padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,0.12)'}}>
            {pend.length?`⏰ Te faltan ${fmt(sumP)} en ${pend.length} cuenta${pend.length===1?'':'s'} de los próximos 15 días`:'✅ Estás al día con los pagos de los próximos 15 días'}
          </div>
        );})()}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:14}}>
          {[['💼 Ingresos',esHoy?fmt(ingTotal):'—','#fff'],[!esHoy?'Pagado':disponible>=0?'💚 Disponible':'🔴 Faltan',esHoy?fmt(Math.abs(disponible)):fmt(compPag),!esHoy||disponible>=0?'#A7F3D0':'#FCA5A5'],['💸 Gastado',esHoy?fmt(egreso):'—','#FCA5A5']].map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:9,opacity:0.65,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div></div>
          ))}
        </div>
      </div>
      {mesVista>=KEY_HOY&&atrasos.some(a=>!a.pagado)&&(
        <div style={{background:t.card,borderRadius:16,padding:'12px 16px',marginBottom:14,border:'1px solid '+t.border,borderLeft:'6px solid '+co.orange,display:'flex',flexDirection:'column',gap:4}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:800,color:t.text}}>🔁 Arrastrado de meses anteriores</div>
            <span style={{fontSize:10,fontWeight:800,background:'#FDEBDD',color:'#8A3A17',borderRadius:999,padding:'3px 8px'}}>ATRASADA</span>
          </div>
          <div style={{fontSize:18,fontWeight:900,color:'#8A3A17'}}>{fmt(atrasosPendientes(data))}</div>
          {atrasos.filter(a=>!a.pagado).map(a=>(
            <div key={a.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:t.muted}}><span>{a.nombre} · {MNOM[Number(a.mes.split('-')[1])-1]}</span><span>{a.monto>0?fmt(a.monto):'por confirmar'}</span></div>
          ))}
        </div>
      )}
      {esHoy&&crisis&&(
        <div style={{background:'rgba(231,111,81,0.1)',border:'1px solid '+co.red+'44',borderRadius:16,padding:'12px 16px',marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:22}}>🚨</span>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:co.red}}>FARO detecta riesgo de queda</div>
            <div style={{fontSize:11,color:t.muted}}>Proyectas {fmt(proyM)} en gastos este mes. Revisa tus compromisos.</div>
          </div>
        </div>
      )}
      {esHoy&&diffMes!==null&&(
        <div style={{background:t.card,borderRadius:16,padding:'12px 16px',marginBottom:14,border:'1px solid '+t.border,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:t.text}}>vs {MNOM[MES>0?MES-1:11]}</div>
            <div style={{fontSize:11,color:t.muted}}>Comparado con el mes anterior</div>
          </div>
          <div style={{fontSize:18,fontWeight:900,color:diffMes>0?co.red:co.green}}>{diffMes>0?'↑':'↓'} {Math.abs(diffMes)}%</div>
        </div>
      )}
      <button onClick={()=>setShowComprar(true)} style={{width:'100%',padding:'13px',borderRadius:14,background:co.primary+'12',color:co.primary,border:'2px solid '+co.primary+'33',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginBottom:14}}>
        🤔 ¿Puedo comprar esto?
      </button>
      {esHoy&&proximos.length>0&&(
        <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
          <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>⏰ Próximos vencimientos</div>
          {proximos.map((c,i)=>{
            const urg=c.dias<=3,prox=c.dias<=7;
            return(
              <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottom:i<proximos.length-1?'1px solid '+t.border:'none',marginBottom:i<proximos.length-1?12:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:20}}>{getIcon(c.nombre)}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:urg?co.red:prox?co.orange:t.muted,fontWeight:urg||prox?700:400}}>
                      {urg?`🚨 Vence en ${c.dias}d`:prox?`⏰ ${c.dias} días`:`Día ${c.dia} del mes`}{c.banco?' · '+c.banco:''}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmt(c.monto)}</div>
                  <button onClick={()=>setData(d=>({...d,compromisos:d.compromisos.map(x=>x.id===c.id?{...x,pagado:true,fechaPago:NOW.toISOString().split('T')[0]}:x)}))} style={{padding:'6px 12px',borderRadius:9,border:'1px solid '+co.green,background:co.green,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>Pagar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showComprar&&<ModalComprar data={data} t={t} onClose={()=>setShowComprar(false)}/>}
    </div>
  );
}

function CompromisosView({data,setData,t,mesVista,setMesVista}){
  const esHoy=mesVista===KEY_HOY;
  const atrasos=data.atrasos||[];
  // Marca un atraso como pagado (o lo desmarca) y registra su gasto en el mes actual
  const togAtraso=a=>setData(d=>{const hoyS=new Date().toISOString().split('T')[0];const ya=!a.pagado;return{...d,atrasos:(d.atrasos||[]).map(x=>x.id===a.id?{...x,pagado:ya,fechaPago:ya?hoyS:null}:x),gastos:ya?[...d.gastos,{id:'at'+a.id+'-'+Date.now(),tipo:'gasto',catId:clasif(a.nombre).catId,monto:Number(a.monto),desc:a.nombre+' (atrasado '+MNOM[Number(a.mes.split('-')[1])-1]+')',fecha:new Date().toISOString(),origen:'atraso',atrasoId:a.id}]:d.gastos.filter(g=>g.atrasoId!==a.id)};});
  const [confirmar,setConfirmar]=useState(null);
  const [editId,setEditId]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [showAddCuota,setShowAddCuota]=useState(false);
  const [nuevo,setNuevo]=useState({nombre:'',monto:'',dia:'10',banco:'',fecha:''});
  const [nuevaCuota,setNuevaCuota]=useState({nombre:'',montoTotal:'',valorCuota:'',numCuotas:'',dia:'10',banco:''});
  // Con dos de los tres datos (total, valor de cuota, nº de cuotas) calcula el tercero
  const resolverCuota=f=>{let T=Number(f.montoTotal)||0,C=Number(f.valorCuota)||0,N=Number(f.numCuotas)||0;if(T&&N)C=T/N;else if(C&&N)T=C*N;else if(T&&C)N=T/C;return{T:Math.round(T),C:Math.round(C),N:Math.round(N)};};
  const [editSueldo,setEditSueldo]=useState(false);
  const [valSueldo,setValSueldo]=useState('');
  const upd=(id,p)=>setData(d=>({...d,compromisos:d.compromisos.map(c=>c.id===id?{...c,...p}:c)}));
  const del=id=>{if(window.confirm('¿Eliminar?'))setData(d=>({...d,compromisos:d.compromisos.filter(c=>c.id!==id)}));};
  const confirmarPago=c=>{const f=new Date().toISOString().split('T')[0];upd(c.id,{pagado:!c.pagado,fechaPago:!c.pagado?f:null});setConfirmar(null);};
  const addNormal=()=>{if(!nuevo.nombre||!nuevo.monto)return;const id=Math.max(0,...data.compromisos.map(c=>c.id))+1;const fechaExacta=nuevo.fecha||null;const dia=fechaExacta?Number(fechaExacta.split('-')[2]):Number(nuevo.dia);setData(d=>({...d,compromisos:[...d.compromisos,{id,nombre:nuevo.nombre,banco:nuevo.banco,monto:Number(nuevo.monto),dia,fecha:fechaExacta,pagado:false,activo:true,gmailKey:'',tipo:fechaExacta?'futuro':'fijo',fechaPago:null}]}));setNuevo({nombre:'',monto:'',dia:'10',banco:'',fecha:''});setShowAdd(false);};
  const addCuota=()=>{const r=resolverCuota(nuevaCuota);if(!nuevaCuota.nombre||!r.T||!r.N||!r.C)return;const id=Math.max(0,...data.compromisos.map(c=>c.id))+1;setData(d=>({...d,compromisos:[...d.compromisos,{id,nombre:nuevaCuota.nombre,monto:r.C,montoTotal:r.T,numCuotas:r.N,cuotasPagadas:0,dia:Number(nuevaCuota.dia),banco:nuevaCuota.banco,pagado:false,activo:true,gmailKey:'',tipo:'cuotas',fechaPago:null}]}));setNuevaCuota({nombre:'',montoTotal:'',valorCuota:'',numCuotas:'',dia:'10',banco:''});setShowAddCuota(false);};
  const inp={width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};
  const baseC=data.compromisos.filter(c=>c.activo);
  const atrasosVigentes=atrasos.filter(a=>!a.incluido);
  const totalMes=sumaMonto(baseC)+(esHoy?sumaMonto(atrasosVigentes):0);
  const pagados=sumaMonto(baseC.filter(c=>pagadoEn(c,mesVista)))+(esHoy?sumaMonto(atrasosVigentes.filter(a=>a.pagado)):0);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <SelectorMes valor={mesVista} onChange={setMesVista} t={t}/>
      <div style={{background:t.card,borderRadius:20,padding:18,border:'1px solid '+t.border}}>
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:12}}>💰 Ingresos del Mes</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:13,color:t.muted}}>Sueldo base</div>
          {editSueldo?(
            <div style={{display:'flex',gap:8}}>
              <input type="number" value={valSueldo} onChange={e=>setValSueldo(e.target.value)} autoFocus style={{width:130,...inp,padding:'7px 10px'}}/>
              <button onClick={()=>{setData(d=>({...d,ingresos:Number(valSueldo)||0}));setEditSueldo(false);}} style={{padding:'7px 14px',borderRadius:9,background:co.green,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>OK</button>
            </div>
          ):(
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:16,fontWeight:800,color:t.text}}>{fmt(data.ingresos)}</span>
              <button onClick={()=>{setValSueldo(data.ingresos||'');setEditSueldo(true);}} style={{padding:'5px 11px',borderRadius:8,background:'transparent',color:co.primary,border:'1px solid '+co.primary,fontWeight:700,fontSize:11,cursor:'pointer'}}>Modificar</button>
            </div>
          )}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {[['Total',totalMes,t.text],['Pagado',pagados,co.green],['Pendiente',totalMes-pagados,co.red]].map(([l,v,c])=>(
          <div key={l} style={{background:t.card,borderRadius:14,padding:'12px 8px',textAlign:'center',border:'1px solid '+t.border}}>
            <div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:3}}>{l}</div>
            <div style={{fontSize:14,fontWeight:800,color:c}}>{fmt(v)}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'11px',borderRadius:12,background:co.primary,color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>+ Cuenta fija</button>
        <button onClick={()=>setShowAddCuota(!showAddCuota)} style={{padding:'11px',borderRadius:12,background:'transparent',color:co.primary,border:'2px solid '+co.primary,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📅 En cuotas</button>
      </div>
      {showAdd&&(
        <div style={{background:t.card,borderRadius:16,padding:16,border:'1px dashed '+co.primary+'55'}}>
          <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:10}}>Nueva cuenta fija</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <input placeholder="Nombre" value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} style={inp}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input type="number" placeholder="Monto ($)" value={nuevo.monto} onChange={e=>setNuevo(p=>({...p,monto:e.target.value}))} style={inp}/>
              <input type="number" min="1" max="31" placeholder="Día vence" value={nuevo.dia} disabled={!!nuevo.fecha} onChange={e=>setNuevo(p=>({...p,dia:e.target.value}))} style={{...inp,opacity:nuevo.fecha?0.5:1}}/>
            </div>
            <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:3}}>FECHA EXACTA (OPCIONAL, PARA PAGOS FUTUROS)</div><input type="date" value={nuevo.fecha} onChange={e=>setNuevo(p=>({...p,fecha:e.target.value}))} style={inp}/></div>
            <input placeholder="Institución" value={nuevo.banco} onChange={e=>setNuevo(p=>({...p,banco:e.target.value}))} style={inp}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addNormal} style={{flex:1,padding:'10px',borderRadius:10,background:co.primary,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Agregar</button>
              <button onClick={()=>setShowAdd(false)} style={{padding:'10px 14px',borderRadius:10,background:'transparent',color:t.muted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
            </div>
          </div>
        </div>
      )}
      {showAddCuota&&(
        <div style={{background:t.card,borderRadius:16,padding:16,border:'1px dashed '+co.orange+'55'}}>
          <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:10}}>💳 Nuevo préstamo / cuotas</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <input placeholder="Nombre" value={nuevaCuota.nombre} onChange={e=>setNuevaCuota(p=>({...p,nombre:e.target.value}))} style={inp}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input type="number" placeholder="Monto total ($)" value={nuevaCuota.montoTotal} onChange={e=>setNuevaCuota(p=>({...p,montoTotal:e.target.value}))} style={inp}/>
              <input type="number" placeholder="Valor cuota ($)" value={nuevaCuota.valorCuota} onChange={e=>setNuevaCuota(p=>({...p,valorCuota:e.target.value}))} style={inp}/>
              <input type="number" placeholder="Nº cuotas" value={nuevaCuota.numCuotas} onChange={e=>setNuevaCuota(p=>({...p,numCuotas:e.target.value}))} style={{...inp,gridColumn:'1 / -1'}}/>
            </div>
            <div style={{fontSize:11,color:t.muted}}>Llena dos de los tres datos y FARO calcula el tercero.</div>
            {(()=>{const r=resolverCuota(nuevaCuota);return(r.T&&r.N&&r.C)?(
              <div style={{padding:'8px 12px',background:co.primary+'12',borderRadius:10,fontSize:13,color:co.primary,fontWeight:700}}>
                Total {fmt(r.T)} · {r.N} cuotas de {fmt(r.C)}
              </div>
            ):null;})()}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <input type="number" min="1" max="31" placeholder="Día de pago" value={nuevaCuota.dia} onChange={e=>setNuevaCuota(p=>({...p,dia:e.target.value}))} style={inp}/>
              <input placeholder="Acreedor" value={nuevaCuota.banco} onChange={e=>setNuevaCuota(p=>({...p,banco:e.target.value}))} style={inp}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addCuota} style={{flex:1,padding:'10px',borderRadius:10,background:co.orange,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Agregar cuotas</button>
              <button onClick={()=>setShowAddCuota(false)} style={{padding:'10px 14px',borderRadius:10,background:'transparent',color:t.muted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
            </div>
          </div>
        </div>
      )}
      <div style={{background:t.card,borderRadius:20,padding:18,border:'1px solid '+t.border}}>
        {esHoy&&atrasos.length>0&&(
          <div style={{marginBottom:14,padding:12,borderRadius:14,border:'1px solid '+co.orange+'66',borderLeft:'6px solid '+co.orange,background:t.bg}}>
            <div style={{fontSize:13,fontWeight:800,color:t.text,marginBottom:8}}>🔁 Atrasadas de meses anteriores <span style={{fontSize:10,fontWeight:800,background:'#FDEBDD',color:'#8A3A17',borderRadius:999,padding:'2px 7px',marginLeft:4}}>ATRASADA</span></div>
            {atrasos.map(a=>(
              <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'6px 0'}}>
                <div style={{fontSize:13,color:a.pagado?co.green:t.text,textDecoration:a.pagado?'line-through':'none'}}>{a.nombre} · {MNOM[Number(a.mes.split('-')[1])-1]}</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{fontSize:13,fontWeight:800,color:t.text}}>{a.monto>0?fmt(a.monto):'Por confirmar'}</div>
                  <button disabled={!!a.incluido} onClick={()=>!a.incluido&&togAtraso(a)} style={{background:a.pagado?co.green:'transparent',color:a.pagado?'#fff':t.text,border:'1px solid '+(a.pagado?co.green:t.border),padding:'4px 9px',borderRadius:7,cursor:a.incluido?'default':'pointer',fontSize:11,fontWeight:700}}>{a.incluido?'Incluida':a.pagado?'✓ Pag.':'Pagar'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:14}}>📋 Tus Compromisos</div>
        {data.compromisos.map((c,i)=>{
          const isEdit=editId===c.id;
          const esCuota=c.tipo==='cuotas';
          const pg=pagadoEn(c,mesVista);
          const pctC=esCuota?Math.round((c.cuotasPagadas/c.numCuotas)*100):0;
          return(
            <div key={c.id} style={{paddingBottom:14,borderBottom:i<data.compromisos.length-1?'1px solid '+t.border:'none',marginBottom:i<data.compromisos.length-1?14:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                  <span style={{fontSize:22}}>{esCuota?'💳':getIcon(c.nombre)}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:t.text,textDecoration:pg?'line-through':'none',opacity:pg?0.6:1}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:t.muted}}>{esCuota?`Cuota ${c.cuotasPagadas+1} de ${c.numCuotas}`:(c.banco?c.banco+' · ':'')}{c.fecha?`📅 ${c.fecha.split('-').reverse().join('/')}`:`Día ${c.dia}`} · {diasDe(c)}d</div>
                    {esCuota&&(
                      <div style={{marginTop:4}}>
                        <div style={{height:3,background:t.border,borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pctC}%`,background:co.green,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:10,color:t.muted,marginTop:2}}>{pctC}% · Quedan {fmt((c.numCuotas-c.cuotasPagadas)*c.monto)}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                  <div style={{fontSize:15,fontWeight:800,color:pg?co.green:t.text}}>{c.monto>0?fmt(c.monto):'Por confirmar'}</div>
                  {pg&&esHoy&&c.fechaPago&&<div style={{fontSize:9,color:co.green}}>Pagado {c.fechaPago}</div>}
                  <div style={{display:'flex',gap:5}}>
                    <button disabled={!esHoy} onClick={()=>esHoy&&setConfirmar(c)} title={esHoy?'':'Solo se puede marcar en el mes actual'} style={{background:pg?co.green:'transparent',color:pg?'#fff':t.text,border:'1px solid '+(pg?co.green:t.border),padding:'4px 9px',borderRadius:7,cursor:esHoy?'pointer':'default',opacity:esHoy?1:0.5,fontSize:11,fontWeight:700}}>{pg?'✓ Pag.':'Pagar'}</button>
                    <button onClick={()=>setEditId(isEdit?null:c.id)} style={{background:'transparent',color:t.muted,border:'1px solid '+t.border,padding:'4px 7px',borderRadius:7,cursor:'pointer',fontSize:12}}>✏️</button>
                    <button onClick={()=>del(c.id)} style={{background:'transparent',color:co.red,border:'1px solid '+co.red+'33',padding:'4px 7px',borderRadius:7,cursor:'pointer',fontSize:12}}>🗑️</button>
                  </div>
                </div>
              </div>
              {isEdit&&(
                <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:3}}>MONTO ($)</div><input type="number" value={c.monto||''} onChange={e=>upd(c.id,{monto:Number(e.target.value)||0})} style={inp}/></div>
                  <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:3}}>DÍA VENCE</div><input type="number" min="1" max="31" value={c.dia} onChange={e=>upd(c.id,{dia:Number(e.target.value)})} style={inp}/></div>
                  <label style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,fontSize:13,color:t.text,cursor:'pointer'}}><input type="checkbox" checked={esVariable(c)} onChange={e=>upd(c.id,{variable:e.target.checked})}/>El monto cambia cada mes (se pide la boleta o se ingresa cada mes)</label>
                  {esVariable(c)&&atrasos.some(a=>a.compromisoId===c.id&&(!a.pagado||a.incluido))&&(
                    <label style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,fontSize:13,color:t.text,cursor:'pointer'}}><input type="checkbox" checked={atrasos.some(a=>a.compromisoId===c.id&&a.incluido)} onChange={e=>{const on=e.target.checked;const hoyS=new Date().toISOString().split('T')[0];setData(d=>({...d,atrasos:(d.atrasos||[]).map(a=>a.compromisoId===c.id&&(!a.pagado||a.incluido)?{...a,incluido:on,pagado:on,fechaPago:on?hoyS:null}:a)}));}}/>El monto ingresado ya incluye la cuenta atrasada (si no, se suma)</label>
                  )}<div style={{gridColumn:'1/-1'}}><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:3}}>BANCO</div><input value={c.banco||''} onChange={e=>upd(c.id,{banco:e.target.value})} style={inp}/></div>
                  <button onClick={()=>setEditId(null)} style={{gridColumn:'1/-1',padding:'9px',borderRadius:9,background:co.primary,color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>✓ Guardar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirmar&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20}}>
          <div style={{background:t.card,borderRadius:20,padding:24,width:'100%',maxWidth:360}}>
            <div style={{fontSize:16,fontWeight:800,color:t.text,marginBottom:8}}>{confirmar.pagado?'↩️ Desmarcar pago':'✅ Confirmar pago'}</div>
            <div style={{fontSize:13,color:t.muted,marginBottom:20}}>{confirmar.pagado?'Desmarcar':'Marcar como pagado'} <strong>{confirmar.nombre}</strong> por <strong>{fmt(confirmar.monto)}</strong></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button onClick={()=>setConfirmar(null)} style={{padding:'12px',borderRadius:12,background:'transparent',color:t.muted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Cancelar</button>
              <button onClick={()=>confirmarPago(confirmar)} style={{padding:'12px',borderRadius:12,background:confirmar.pagado?co.orange:co.green,color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>{confirmar.pagado?'Desmarcar':'✓ Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Normaliza el nombre del comercio para reconocerlo aunque cambien mayúsculas, tildes o espacios
function normComercio(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function GastosView({data,setData,t}){
  const [drag,setDrag]=useState(null);
  const dragRef=useRef(null);
  const dragging=!!drag;
  const iniciarArrastre=(e,idx,cat)=>{const row=e.currentTarget.closest('[data-cat]');const h=(row?row.offsetHeight:60)+8;const v={id:cat.id,from:idx,to:idx,startY:e.clientY,dy:0,h};dragRef.current=v;setDrag(v);};
  useEffect(()=>{
    if(!dragging)return;
    const mv=ev=>{const p=dragRef.current;if(!p)return;const dy=ev.clientY-p.startY;const n=data.categorias.length;const to=Math.max(0,Math.min(n-1,p.from+Math.round(dy/p.h)));dragRef.current={...p,dy,to};setDrag(dragRef.current);};
    const up=()=>{const p=dragRef.current;dragRef.current=null;setDrag(null);if(p&&p.to!==p.from){setData(d=>{const a=[...d.categorias];const [m]=a.splice(p.from,1);a.splice(p.to,0,m);return{...d,categorias:a};});}};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
    return()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);};
  },[dragging]);
  const dragStyle=(idx,id)=>{
    if(!drag)return {};
    if(drag.id===id)return {transform:`translateY(${drag.dy}px)`,zIndex:5,position:'relative',boxShadow:'0 8px 20px rgba(0,0,0,0.18)'};
    const {from,to,h}=drag;
    if(from<to&&idx>from&&idx<=to)return {transform:`translateY(${-h}px)`,transition:'transform .15s'};
    if(from>to&&idx>=to&&idx<from)return {transform:`translateY(${h}px)`,transition:'transform .15s'};
    return {transition:'transform .15s'};
  };
  const [modal,setModal]=useState(null);
  const [showAddCat,setShowAddCat]=useState(false);
  const [nuevaCat,setNuevaCat]=useState('');
  const [iconSel,setIconSel]=useState('📦');
  const [colorSel,setColorSel]=useState('#94A3B8');
  const [expandCat,setExpandCat]=useState(null);
  const [filtro,setFiltro]=useState('todo');
  const fotoRef=useRef();
  const ICONOS=['🛒','🍽️','☕','⛽','🏋️','💰','🛍️','💊','🎬','📦','🚗','✈️','🎮','💼','🏆','🐾','💇','📚','🍺','🎁'];
  const COLORES=['#3B82F6','#F59E0B','#D97706','#10B981','#8B5CF6','#059669','#EC4899','#7C3AED','#EF4444','#94A3B8','#005F73','#F97316'];
  const mesG=data.gastos.filter(g=>{return enMesActual(g);});
  const totalGast=mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const totalIng=mesG.filter(g=>g.tipo==='ingreso').reduce((s,g)=>s+g.monto,0);
  const compPag=data.compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const delCat=id=>{if(window.confirm('¿Eliminar categoría?'))setData(d=>({...d,categorias:d.categorias.filter(c=>c.id!==id),gastos:d.gastos.filter(g=>g.catId!==id)}));};
  const delGasto=id=>setData(d=>({...d,gastos:d.gastos.filter(g=>g.id!==id)}));
  const addCat=()=>{if(!nuevaCat.trim())return;setData(d=>({...d,categorias:[...d.categorias,{id:'cat_'+Date.now(),nombre:nuevaCat,icon:iconSel,color:colorSel}]}));setNuevaCat('');setShowAddCat(false);};
  const handleFoto=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const b64=ev.target.result.split(',')[1];
      try{
        const r=await fetch("https://api.anthropic.com/v1/messages",{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:100,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:file.type||'image/jpeg',data:b64}},{type:'text',text:'Extrae el TOTAL a pagar de este ticket. Solo JSON: {"monto":12990,"descripcion":"Supermercado"}'}]}]})});
        const d=await r.json();
        const res=JSON.parse((d.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
        if(res.monto)setModal({tipo:'gasto',monto:res.monto,desc:res.descripcion||''});
      }catch{alert('No pude leer el ticket');}
    };
    reader.readAsDataURL(file);
  };
  const listaFiltrada=(filtro==='todo'?mesG:mesG.filter(g=>g.tipo===filtro)).filter(g=>!g.clasificada);
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
        {[{l:'Gastado',v:totalGast,c:co.red,bg:'rgba(231,111,81,0.08)'},{l:'Ingresos',v:totalIng,c:co.green,bg:'rgba(42,157,143,0.08)'},{l:'Cuentas ✓',v:compPag,c:co.primary,bg:'rgba(0,95,115,0.08)'}].map(({l,v,c,bg})=>(
          <div key={l} style={{background:bg,borderRadius:14,padding:'12px 8px',textAlign:'center',border:'1px solid '+c+'22'}}>
            <div style={{fontSize:10,color:c,fontWeight:700,marginBottom:3}}>{l}</div>
            <div style={{fontSize:13,fontWeight:900,color:c}}>{fmt(v)}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        <button onClick={()=>setModal({tipo:'gasto'})} style={{padding:'13px',borderRadius:13,background:co.red,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>↗ Gasto</button>
        <button onClick={()=>setModal({tipo:'ingreso'})} style={{padding:'13px',borderRadius:13,background:co.green,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>↙ Ingreso</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
        <button onClick={()=>fotoRef.current?.click()} style={{padding:'11px',borderRadius:12,background:t.card,color:co.primary,border:'2px solid '+co.primary+'44',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📸 Foto ticket</button>
        <button onClick={()=>setShowAddCat(!showAddCat)} style={{padding:'11px',borderRadius:12,background:'transparent',color:t.muted,border:'1px solid '+t.border,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>+ Categoría</button>
      </div>
      <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{display:'none'}}/>
      {showAddCat&&(
        <div style={{background:t.card,borderRadius:14,padding:14,border:'1px solid '+t.border,marginBottom:12}}>
          <input value={nuevaCat} onChange={e=>setNuevaCat(e.target.value)} placeholder="Nombre categoría..." style={{width:'100%',boxSizing:'border-box',padding:'9px 12px',borderRadius:9,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,marginBottom:8}}/>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
            {ICONOS.map(ic=><button key={ic} onClick={()=>setIconSel(ic)} style={{width:32,height:32,borderRadius:8,border:`2px solid ${iconSel===ic?co.primary:t.border}`,background:iconSel===ic?co.primary+'18':t.bg,fontSize:16,cursor:'pointer'}}>{ic}</button>)}
          </div>
          <div style={{display:'flex',gap:6,marginBottom:10}}>
            {COLORES.map(c=><button key={c} onClick={()=>setColorSel(c)} style={{width:26,height:26,borderRadius:'50%',background:c,border:`3px solid ${colorSel===c?t.text:'transparent'}`,cursor:'pointer'}}/>)}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addCat} style={{flex:1,padding:'9px',borderRadius:9,background:co.primary,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Crear</button>
            <button onClick={()=>setShowAddCat(false)} style={{padding:'9px 13px',borderRadius:9,background:'transparent',color:t.muted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
          </div>
        </div>
      )}
      {data.categorias.map((cat,idx)=>{
        const gc=mesG.filter(g=>g.catId===cat.id);
        const total=gc.reduce((s,g)=>s+g.monto,0);
        const isExp=expandCat===cat.id;
        return(
          <div key={cat.id} data-cat="1" style={{background:t.card,borderRadius:14,marginBottom:8,border:'1px solid '+t.border,overflow:'hidden',...dragStyle(idx,cat.id)}}>
            <div onClick={()=>setExpandCat(isExp?null:cat.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 15px',cursor:'pointer'}}>
              <div style={{width:38,height:38,borderRadius:11,background:cat.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{cat.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:t.text}}>{cat.nombre}</div>
                <div style={{fontSize:11,color:t.muted}}>{gc.length} movimiento{gc.length!==1?'s':''}</div>
              </div>
              <div onPointerDown={e=>iniciarArrastre(e,idx,cat)} onClick={e=>e.stopPropagation()} aria-label="Arrastrar" style={{touchAction:'none',cursor:'grab',padding:'6px 4px',fontSize:20,lineHeight:1,color:t.muted,userSelect:'none',flexShrink:0}}>≡</div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:15,fontWeight:800,color:total>0?cat.color:t.muted}}>{fmt(total)}</div>
                {totalGast>0&&total>0&&<div style={{fontSize:10,color:t.muted}}>{Math.round((total/totalGast)*100)}%</div>}
              </div>
              <span style={{fontSize:13,color:t.muted,transform:isExp?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s',display:'inline-block'}}>⌄</span>
            </div>
            {totalGast>0&&total>0&&<div style={{height:2,background:t.border,margin:'0 15px 8px'}}><div style={{height:'100%',width:`${Math.min((total/totalGast)*100,100)}%`,background:cat.color,borderRadius:2}}/></div>}
            {isExp&&(
              <div style={{borderTop:'1px solid '+t.border,padding:'8px 15px 12px'}}>
                {gc.length===0?<div style={{fontSize:12,color:t.muted,textAlign:'center',padding:'8px 0'}}>Sin movimientos este mes</div>
                  :gc.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(g=>(
                    <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid '+t.border+'44'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:t.text}}>{g.desc||'Sin descripción'}</div>
                        <div style={{fontSize:10,color:t.muted}}>{g.fecha} · {g.origen==='banco'?'🏦 Banco':g.tipo==='ingreso'?'💚 Ingreso':'❤️ Gasto'}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{fontSize:13,fontWeight:700,color:g.tipo==='ingreso'?co.green:t.text}}>{g.tipo==='ingreso'?'+':''}{fmt(g.monto)}</div>
                        <button onClick={()=>delGasto(g.id)} style={{background:'transparent',color:co.red,border:'none',cursor:'pointer',fontSize:13}}>✕</button>
                      </div>
                    </div>
                  ))}
                <button onClick={()=>setModal({tipo:'gasto',catId:cat.id})} style={{width:'100%',marginTop:8,padding:'8px',borderRadius:9,background:cat.color+'15',color:cat.color,border:'1px solid '+cat.color+'33',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:700}}>+ Agregar a {cat.nombre}</button>
                <button onClick={()=>delCat(cat.id)} style={{width:'100%',marginTop:5,padding:'7px',borderRadius:9,background:'transparent',color:co.red,border:'1px solid '+co.red+'22',cursor:'pointer',fontFamily:'inherit',fontSize:11}}>🗑️ Eliminar categoría</button>
              </div>
            )}
          </div>
        );
      })}
      {mesG.length>0&&(
        <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+t.border,marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text}}>Todos los movimientos</div>
            <div style={{display:'flex',gap:5}}>
              {[['todo','Todo'],['gasto','Gastos'],['ingreso','Ingresos']].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltro(v)} style={{padding:'4px 9px',borderRadius:18,border:'1px solid '+(filtro===v?co.primary:t.border),background:filtro===v?co.primary+'15':'transparent',color:filtro===v?co.primary:t.muted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
          </div>
          {listaFiltrada.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(g=>{
            const cat=data.categorias.find(c=>c.id===g.catId);
            return(
              <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:9,marginBottom:9,borderBottom:'1px solid '+t.border+'55'}}>
                <div style={{width:34,height:34,borderRadius:10,background:(cat?.color||'#94A3B8')+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{cat?.icon||'📦'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.text}}>{g.desc||cat?.nombre||'Sin descripción'}</div>
                  {g.origen==='wallet'?(
                    <div>
                      <div style={{fontSize:10,color:t.muted}}>{g.fecha}</div>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginTop:3}}>
                        <select value={g.catId} onChange={e=>{const v=e.target.value;const k=g.desc!=='Compra Wallet'?normComercio(g.desc):'';setData(d=>({...d,gastos:d.gastos.map(x=>x.id===g.id?{...x,catId:v}:x),aprendizaje:k?{...(d.aprendizaje||{}),[k]:v}:d.aprendizaje}));}} style={{padding:'3px 6px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:11,fontFamily:'inherit',maxWidth:'100%'}}>
                          {data.categorias.map(c=><option key={c.id} value={c.id}>{c.icon} {c.nombre}</option>)}
                        </select>
                        <button onClick={()=>setData(d=>({...d,gastos:d.gastos.map(x=>x.id===g.id?{...x,clasificada:true}:x)}))} style={{padding:'3px 9px',borderRadius:8,border:'none',background:co.green,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Guardar</button>
                      </div>
                    </div>
                  ):(
                    <div style={{fontSize:10,color:t.muted}}>{g.fecha} · {cat?.nombre}</div>
                  )}
                </div>
                <div style={{fontSize:13,fontWeight:700,color:g.tipo==='ingreso'?co.green:t.text}}>{g.tipo==='ingreso'?'+':'-'}{fmt(g.monto)}</div>
                <button onClick={()=>delGasto(g.id)} style={{background:'transparent',color:co.red,border:'none',cursor:'pointer',fontSize:13}}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      {modal&&<ModalMovimiento tipo={modal.tipo} monto={modal.monto} desc={modal.desc} catId={modal.catId} data={data} setData={setData} t={t} onClose={()=>setModal(null)}/>}
    </div>
  );
}

function ModalMovimiento({tipo:tipoI,monto:montoI,desc:descI,catId:catIdI,data,setData,t,onClose}){
  const [tipo,setTipo]=useState(tipoI||'gasto');
  const [monto,setMonto]=useState(montoI||'');
  const [desc,setDesc]=useState(descI||'');
  const [catId,setCatId]=useState(catIdI||data.categorias[0]?.id||'otros');
  const [fecha,setFecha]=useState(NOW.toISOString().split('T')[0]);
  const guardar=()=>{if(!monto)return;setData(d=>({...d,gastos:[{id:Date.now(),tipo,catId,monto:Number(monto),desc,fecha,origen:'manual'},...d.gastos]}));onClose();};
  const inp={width:'100%',boxSizing:'border-box',padding:'11px 13px',borderRadius:11,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};
  const col=tipo==='gasto'?co.red:co.green;
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-end',zIndex:300,backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:440,margin:'0 auto',background:t.card,borderRadius:'22px 22px 0 0',padding:'18px 16px 40px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:34,height:4,background:t.border,borderRadius:2,margin:'0 auto 14px'}}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          {[['gasto','↗ Gasto',co.red],['ingreso','↙ Ingreso',co.green]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setTipo(v)} style={{padding:'11px',borderRadius:12,border:`2px solid ${tipo===v?c:t.border}`,background:tipo===v?c+'18':t.bg,color:tipo===v?c:t.muted,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>
        <div style={{textAlign:'center',marginBottom:16,background:t.bg,borderRadius:14,padding:14}}>
          <div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:5}}>MONTO ($)</div>
          <input type="number" placeholder="0" value={monto} onChange={e=>setMonto(e.target.value)} autoFocus style={{...inp,fontSize:34,fontWeight:900,textAlign:'center',border:'none',background:'transparent',color:col}}/>
          {monto&&<div style={{fontSize:12,color:t.muted,marginTop:3}}>{fmt(Number(monto))}</div>}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:5}}>DESCRIPCIÓN</div>
          <input placeholder={tipo==='gasto'?'Ej: Copec, Almuerzo...':'Ej: Sueldo mayo...'} value={desc} onChange={e=>setDesc(e.target.value)} style={inp}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:7}}>CATEGORÍA</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {data.categorias.map(c=>(
              <button key={c.id} onClick={()=>setCatId(c.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:18,border:`1.5px solid ${catId===c.id?c.color:t.border}`,background:catId===c.id?c.color+'18':t.bg,color:catId===c.id?c.color:t.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                {c.icon} {c.nombre}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:5}}>FECHA</div>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
        </div>
        <button onClick={guardar} disabled={!monto} style={{width:'100%',padding:'14px',borderRadius:13,border:'none',background:!monto?t.border:`linear-gradient(135deg,${col},${col}99)`,color:!monto?t.muted:'#fff',fontSize:16,fontWeight:800,cursor:!monto?'not-allowed':'pointer',fontFamily:'inherit'}}>
          {tipo==='gasto'?'Guardar gasto':'Guardar ingreso'}
        </button>
      </div>
    </div>
  );
}

function AnalisisView({data,setData,t}){
  const [tab,setTab]=useState('fondo');
  const {historial,fondoEmergencia,fondoActual,metaAhorro,gastos,compromisos,ingresos}=data;
  const meses6=Array.from({length:6},(_,i)=>{
    const d=new Date(ANO,MES-(5-i),1);const m=d.getMonth();const a=d.getFullYear();
    const hist=historial?.find(h=>h.mes===m&&h.ano===a);const actual=m===MES&&a===ANO;
    const gast=actual?gastos.filter(g=>{const dd=new Date(g.fecha);return dd.getMonth()===m&&dd.getFullYear()===a&&g.tipo==='gasto';}).reduce((s,g)=>s+g.monto,0):(hist?.totalGast||0);
    return{mes:MNOM[m],gast,comp:hist?.totalComp||(actual?compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0):0)};
  });
  const maxVal=Math.max(...meses6.map(m=>Math.max(m.gast,m.comp)),1);
  const primerDia=new Date(ANO,MES,1).getDay();
  const diasMes=new Date(ANO,MES+1,0).getDate();
  const pagosXDia={};
  compromisos.filter(c=>c.activo&&c.monto>0).forEach(c=>{if(!pagosXDia[c.dia])pagosXDia[c.dia]=[];pagosXDia[c.dia].push(c);});
  const inp={width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};
  const fondoPct=fondoEmergencia>0?Math.min((fondoActual/fondoEmergencia)*100,100):0;
  return(
    <div>
      <div style={{display:'flex',gap:6,marginBottom:16,background:t.card,borderRadius:12,padding:4,border:'1px solid '+t.border}}>
        {[['fondo','🛡️ Fondo'],['grafico','📊 Gráfico'],['calendario','📅 Cal.'],['historial','🗓️ Hist.']].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'8px 4px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,background:tab===id?co.primary:'transparent',color:tab===id?'#fff':t.muted}}>{l}</button>
        ))}
      </div>
      {tab==='fondo'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:14}}>🛡️ Fondo de Emergencia</div>
            {(()=>{
              const mg=data.gastos.filter(g=>{return enMesActual(g)&&g.tipo==='gasto';});
              const pm=mg.reduce((s,g)=>s+g.monto,0)+data.compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
              return pm>0?(
                <div style={{padding:'10px 12px',background:co.primary+'08',borderRadius:10,border:'1px solid '+co.primary+'22',marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:co.primary,marginBottom:4}}>💡 FARO calcula para ti</div>
                  <div style={{fontSize:11,color:t.muted,marginBottom:6}}>Basado en tus gastos + compromisos ({fmt(pm)}/mes)</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setData(d=>({...d,fondoEmergencia:pm*3}))} style={{flex:1,padding:'7px',borderRadius:8,background:co.green+'18',color:co.green,border:'1px solid '+co.green+'33',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>3 meses<br/>{fmt(pm*3)}</button>
                    <button onClick={()=>setData(d=>({...d,fondoEmergencia:pm*6}))} style={{flex:1,padding:'7px',borderRadius:8,background:co.primary+'18',color:co.primary,border:'1px solid '+co.primary+'33',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700}}>6 meses<br/>{fmt(pm*6)}</button>
                  </div>
                </div>
              ):<div style={{fontSize:12,color:t.muted,marginBottom:12}}>FARO recomienda tener 3-6 meses de gastos guardados.</div>;
            })()}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:4}}>META ($)</div><input type="number" value={fondoEmergencia||''} onChange={e=>setData(d=>({...d,fondoEmergencia:Number(e.target.value)||0}))} placeholder="Ej: 3000000" style={inp}/></div>
              <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:4}}>AHORRADO ($)</div><input type="number" value={fondoActual||''} onChange={e=>setData(d=>({...d,fondoActual:Number(e.target.value)||0}))} placeholder="Ej: 500000" style={inp}/></div>
            </div>
            {fondoEmergencia>0&&(
              <>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                  <span style={{color:t.muted}}>Progreso</span>
                  <span style={{fontWeight:700,color:fondoPct>=100?co.green:fondoPct>=50?co.yellow:co.red}}>{Math.round(fondoPct)}%</span>
                </div>
                <div style={{height:8,background:t.border,borderRadius:4,overflow:'hidden',marginBottom:8}}>
                  <div style={{height:'100%',width:`${fondoPct}%`,background:fondoPct>=100?co.green:fondoPct>=50?co.yellow:co.red,borderRadius:4,transition:'width 0.5s'}}/>
                </div>
                <div style={{fontSize:12,color:t.muted}}>{fondoActual>=fondoEmergencia?'✅ ¡Meta alcanzada!':`Faltan ${fmt(fondoEmergencia-fondoActual)} para completar tu fondo`}</div>
              </>
            )}
          </div>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:12}}>🎯 Meta de Ahorro Mensual</div>
            <input type="number" value={metaAhorro||''} onChange={e=>setData(d=>({...d,metaAhorro:Number(e.target.value)||0}))} placeholder="Ej: 200000" style={inp}/>
            {metaAhorro>0&&ingresos>0&&(
              <div style={{marginTop:10,padding:'10px 12px',background:co.primary+'10',borderRadius:10}}>
                <div style={{fontSize:12,color:co.primary,fontWeight:700}}>Para ahorrar {fmt(metaAhorro)} debes gastar máximo {fmt(ingresos-metaAhorro)} este mes</div>
              </div>
            )}
          </div>
        </div>
      )}
      {tab==='grafico'&&(
        <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
          <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:14}}>📊 Últimos 6 meses</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:160}}>
            {meses6.map((m,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,height:'100%',justifyContent:'flex-end'}}>
                <div style={{width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:'85%'}}>
                  <div style={{flex:1,background:co.red+'CC',borderRadius:'3px 3px 0 0',height:`${(m.gast/maxVal)*100}%`,minHeight:m.gast>0?2:0}}/>
                  <div style={{flex:1,background:co.primary+'CC',borderRadius:'3px 3px 0 0',height:`${(m.comp/maxVal)*100}%`,minHeight:m.comp>0?2:0}}/>
                </div>
                <div style={{fontSize:10,color:t.muted,fontWeight:600}}>{m.mes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==='calendario'&&(
        <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
          <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:14}}>📅 {MNOM[MES]} {ANO}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8}}>
            {DNOM.map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:t.muted,fontWeight:700,padding:'4px 0'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {Array.from({length:primerDia},(_,i)=><div key={'e'+i}/>)}
            {Array.from({length:diasMes},(_,i)=>{
              const dia=i+1;const pagos=pagosXDia[dia]||[];const esHoy=dia===NOW.getDate();const tieneVenc=pagos.length>0;
              return(
                <div key={dia} style={{textAlign:'center',padding:'5px 2px',borderRadius:8,background:esHoy?co.primary:tieneVenc?co.red+'18':'transparent',border:esHoy?'none':tieneVenc?'1px solid '+co.red+'44':'1px solid transparent'}}>
                  <div style={{fontSize:12,fontWeight:esHoy||tieneVenc?800:400,color:esHoy?'#fff':tieneVenc?co.red:t.text}}>{dia}</div>
                  {tieneVenc&&<div style={{fontSize:8,color:esHoy?'#fff':co.red}}>{pagos.length>1?pagos.length+'v':pagos[0].nombre.slice(0,4)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab==='historial'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <button onClick={()=>{
            const ma={mes:MES,ano:ANO,totalComp:compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0),totalGast:gastos.filter(g=>{return enMesActual(g)&&g.tipo==='gasto';}).reduce((s,g)=>s+g.monto,0),totalIng:ingresos,fechaCierre:NOW.toISOString().split('T')[0]};
            setData(d=>({...d,historial:[...(d.historial||[]).filter(h=>!(h.mes===MES&&h.ano===ANO)),ma]}));
            alert('Mes cerrado ✅');
          }} style={{padding:'13px',borderRadius:13,background:co.primary,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>📁 Cerrar mes y guardar en historial</button>
          {(!historial||historial.length===0)?(
            <div style={{background:t.card,borderRadius:14,padding:20,textAlign:'center',border:'1px solid '+t.border}}>
              <div style={{fontSize:24,marginBottom:8}}>📂</div>
              <div style={{fontSize:13,color:t.muted}}>Sin historial aún.</div>
            </div>
          ):(
            [...(historial||[])].sort((a,b)=>new Date(b.ano,b.mes)-new Date(a.ano,a.mes)).map((h,i)=>(
              <div key={i} style={{background:t.card,borderRadius:14,padding:16,border:'1px solid '+t.border}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:800,color:t.text}}>{MNOM[h.mes]} {h.ano}</div>
                  <div style={{fontSize:11,color:t.muted}}>Cerrado {h.fechaCierre}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[['Compromisos',h.totalComp,co.primary],['Gastos',h.totalGast,co.red],['Ingresos',h.totalIng,co.green]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:t.muted,marginBottom:2}}>{l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:c}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AjustesView({data,setData,t,onSyncGmail}){
  const [tab,setTab]=useState('gmail');
  const [syncing,setSyn]=useState(false);
  const [msg,setMsg]=useState('');
  const [synCode,setSynCode]=useState('');
  const [exportMsg,setExportMsg]=useState('');
  const inp={width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};

  const sincronizar=async()=>{
    setSyn(true);setMsg('🔦 Buscando boletas...');
    try{
      let boletas=[];
      if(data.gmailWebAppUrl){
        const params=new URLSearchParams();
        (data.numerosCliente||[]).filter(nc=>nc.numero).forEach(nc=>params.append(nc.key,nc.numero));
        const url=data.gmailWebAppUrl+(params.toString()?'?'+params.toString():'');
        const res=await fetch(url);const json=await res.json();
        boletas=(json.data||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.diaVence||null,requiereVerif:x.requiereVerif||false}));
      }else{
        const res=await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:SB_HDR});
        const b=await res.json();boletas=(b||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}));
      }
      boletas=boletas.filter(b=>!(data.boletasVistas||[]).includes(sigBoleta(b)));
      if(boletas.length>0){setMsg(`✅ ${boletas.length} boleta(s) detectada(s)`);onSyncGmail(boletas);}
      else setMsg('✓ Sin boletas nuevas');
    }catch(e){setMsg('Error: '+e.message);}
    setSyn(false);
  };

  const exportar=()=>{
    const ed={compromisos:data.compromisos,gastos:data.gastos,categorias:data.categorias,ingresos:data.ingresos,exportado:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(ed,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`FARO_backup_${NOW.toISOString().split('T')[0]}.json`;a.click();
    setExportMsg('✅ Exportado');setTimeout(()=>setExportMsg(''),3000);
  };

  const generarCodigo=async()=>{
    const codigo='FARO-'+Math.random().toString(36).substring(2,8).toUpperCase();
    try{
      await fetch(`${SB_URL}/rest/v1/faro_sync`,{method:'POST',headers:SB_HDR,body:JSON.stringify({id:codigo,data:JSON.stringify(data),updated_at:new Date().toISOString()})});
      setData(d=>({...d,syncCode:codigo}));setSynCode(codigo);
    }catch{alert('Error generando código');}
  };

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:5,background:t.card,borderRadius:12,padding:4,border:'1px solid '+t.border}}>
        {[['gmail','📧'],['alertas','🔔'],['sync','🔄'],['cuenta','👤']].map(([id,ic])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'9px 4px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:16,background:tab===id?co.primary:'transparent'}}>{ic}</button>
        ))}
      </div>

      {tab==='gmail'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{fontSize:14,fontWeight:800,color:t.text}}>📧 Gmail Sync</div>
              <div style={{fontSize:11,fontWeight:700,color:co.green}}>✓ Activo</div>
            </div>
            <div style={{fontSize:12,color:t.muted,marginBottom:14}}>Se sincroniza automáticamente al abrir FARO</div>
            <button onClick={sincronizar} disabled={syncing} style={{width:'100%',padding:'11px',borderRadius:12,background:syncing?t.border:'linear-gradient(135deg,'+co.green+',#047857)',color:syncing?t.muted:'#fff',fontWeight:700,border:'none',cursor:syncing?'not-allowed':'pointer',fontFamily:'inherit',fontSize:14,marginBottom:10}}>
              {syncing?'⏳ Buscando...':'🔄 Sincronizar ahora'}
            </button>
            {msg&&<div style={{fontSize:12,color:msg.startsWith('✅')||msg.startsWith('✓')?co.green:co.red,textAlign:'center',fontWeight:600,marginBottom:10}}>{msg}</div>}
            <details style={{cursor:'pointer'}}>
              <summary style={{fontSize:11,color:t.muted,fontWeight:600,listStyle:'none'}}>⚙️ URL del Script</summary>
              <div style={{marginTop:10}}>
                <input value={data.gmailWebAppUrl||''} onChange={e=>setData(d=>({...d,gmailWebAppUrl:e.target.value.trim()}))} placeholder="https://script.google.com/macros/s/..." style={{width:'100%',boxSizing:'border-box',padding:'9px 11px',borderRadius:9,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:12,fontFamily:'inherit'}}/>
              </div>
            </details>
          </div>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:4}}>🔢 Números de cliente</div>
            <div style={{fontSize:12,color:t.muted,marginBottom:14}}>FARO usa estos para encontrar tus boletas exactas</div>
            {(data.numerosCliente||[]).map((nc,i)=>(
              <div key={nc.id} style={{display:'flex',gap:8,marginBottom:8}}>
                <input value={nc.nombre} onChange={e=>setData(d=>({...d,numerosCliente:d.numerosCliente.map((x,j)=>j===i?{...x,nombre:e.target.value}:x)}))} placeholder="Servicio" style={{flex:1,padding:'8px 10px',borderRadius:9,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:12,fontFamily:'inherit'}}/>
                <input value={nc.numero} onChange={e=>setData(d=>({...d,numerosCliente:d.numerosCliente.map((x,j)=>j===i?{...x,numero:e.target.value}:x)}))} placeholder="Nº cliente" style={{flex:1,padding:'8px 10px',borderRadius:9,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:12,fontFamily:'inherit'}}/>
                <button onClick={()=>setData(d=>({...d,numerosCliente:d.numerosCliente.filter((_,j)=>j!==i)}))} style={{background:'transparent',border:'none',color:co.red,cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
              </div>
            ))}
            <button onClick={()=>setData(d=>({...d,numerosCliente:[...(d.numerosCliente||[]),{id:Date.now(),nombre:'',numero:'',key:'custom_'+Date.now()}]}))}
              style={{width:'100%',padding:'9px',borderRadius:10,background:'transparent',color:co.primary,border:'1px dashed '+co.primary,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
              + Agregar servicio
            </button>
          </div>
        </div>
      )}

      {tab==='alertas'&&(
        <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
          <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:14}}>💬 WhatsApp Alertas</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:4}}>TU NÚMERO</div><input value={data.telefono||''} onChange={e=>setData(d=>({...d,telefono:e.target.value}))} placeholder="+56912345678" style={{...inp}}/></div>
            <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:4}}>API KEY (CallMeBot)</div><input value={data.whatsappKey||''} onChange={e=>setData(d=>({...d,whatsappKey:e.target.value}))} placeholder="Ej: 123456" style={{...inp}}/></div>
            <div><div style={{fontSize:10,color:t.muted,fontWeight:700,marginBottom:4}}>CLAVE DEL ATAJO DE COMPRAS (Wallet)</div><input value={data.gastoKey||''} onChange={e=>setData(d=>({...d,gastoKey:e.target.value.trim()}))} placeholder="La misma clave que pusiste en Vercel" style={{...inp}}/></div>
            <button onClick={()=>{enviarWhatsApp(data.telefono,data.whatsappKey,'✅ FARO: las alertas de WhatsApp están funcionando.');alert('Mensaje enviado. Debería llegarte en unos segundos.');}} style={{marginTop:12,width:'100%',padding:'11px',borderRadius:12,background:co.green,color:'#fff',border:'none',fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>Enviar prueba</button>
          </div>
        </div>
      )}

      {tab==='sync'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:6}}>🔄 Sincronizar dispositivos</div>
            {(data.syncCode||synCode)?(
              <div style={{textAlign:'center',padding:16,background:co.primary+'10',borderRadius:12,border:'1px solid '+co.primary+'33',marginBottom:12}}>
                <div style={{fontSize:11,color:t.muted,marginBottom:6}}>TU CÓDIGO</div>
                <div style={{fontSize:24,fontWeight:900,color:co.primary,letterSpacing:3}}>{data.syncCode||synCode}</div>
              </div>
            ):(
              <button onClick={generarCodigo} style={{width:'100%',padding:'11px',borderRadius:12,background:co.primary,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:14,marginBottom:10}}>🔑 Generar código</button>
            )}
            <div style={{display:'flex',gap:8}}>
              <input placeholder="FARO-XXXXXX" value={synCode} onChange={e=>setSynCode(e.target.value.toUpperCase())} style={{flex:1,padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13,fontWeight:700,letterSpacing:1,fontFamily:'inherit'}}/>
              <button onClick={async()=>{
                try{const r=await fetch(`${SB_URL}/rest/v1/faro_sync?id=eq.${synCode}&select=data`,{headers:SB_HDR});const rows=await r.json();if(rows?.[0]?.data){setData(JSON.parse(rows[0].data));alert('✅ Sincronizado');}else alert('Código no encontrado');}catch{alert('Error');}
              }} style={{padding:'10px 14px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Sync</button>
            </div>
          </div>
          <div style={{background:t.card,borderRadius:18,padding:18,border:'1px solid '+t.border}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:12}}>💾 Exportar datos</div>
            <button onClick={exportar} style={{width:'100%',padding:'11px',borderRadius:12,background:co.primary+'15',color:co.primary,border:'1px solid '+co.primary+'33',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:14}}>⬇️ Exportar JSON</button>
            {exportMsg&&<div style={{fontSize:12,color:co.green,textAlign:'center',marginTop:8}}>{exportMsg}</div>}
          </div>
        </div>
      )}

      {tab==='cuenta'&&(
        <div style={{background:t.card,borderRadius:18,padding:20,border:'1px solid '+t.border}}>
          <div style={{textAlign:'center',marginBottom:18}}>
            <div style={{width:60,height:60,borderRadius:18,background:'linear-gradient(135deg,'+co.primary+','+co.secondary+')',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',margin:'0 auto 10px'}}>C</div>
            <div style={{fontSize:17,fontWeight:700,color:t.text}}>Cristian</div>
            <div style={{fontSize:12,color:t.muted}}>Score {calcScore(data)}/100 · {scoreLabel(calcScore(data))}</div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:t.text,marginBottom:8}}>🔐 PIN de seguridad</div>
            {data.pin?(
              <button onClick={()=>{if(window.confirm('¿Desactivar PIN?'))setData(d=>({...d,pin:null}));}} style={{width:'100%',padding:'10px',borderRadius:10,background:'rgba(231,111,81,0.08)',color:co.red,border:'1px solid '+co.red+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>🔓 Desactivar PIN</button>
            ):(
              <button onClick={()=>{const pin=prompt('Ingresa un PIN de 6 dígitos:');if(pin&&/^\d{6}$/.test(pin)){setData(d=>({...d,pin}));alert('✅ PIN activado');}else if(pin)alert('El PIN debe tener exactamente 6 dígitos');}} style={{width:'100%',padding:'10px',borderRadius:10,background:co.primary+'15',color:co.primary,border:'1px solid '+co.primary+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>🔒 Activar PIN</button>
            )}
          </div>
          <button onClick={()=>{if(window.confirm('¿Cerrar sesión?')){S.set('faro_token',null);S.set('faro_user',null);window.location.reload();}}} style={{width:'100%',marginBottom:8,padding:'11px',borderRadius:12,background:'rgba(0,95,115,0.08)',color:co.primary,border:'1px solid '+co.primary+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>🚪 Cerrar sesión</button>
          <button onClick={()=>{if(window.confirm('¿Borrar TODOS los datos?'))setData(d=>({...d,compromisos:COMP_DEF,ingresos:1200000,gastos:[],categorias:CATS_DEF,boletasGmail:[],historial:[],fintocLinks:[],fondoEmergencia:0,fondoActual:0,metaAhorro:0}));}} style={{width:'100%',padding:'11px',borderRadius:12,background:'rgba(231,111,81,0.08)',color:co.red,border:'1px solid '+co.red+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>🔄 Resetear FARO</button>
        </div>
      )}
    </div>
  );
}

function ModalComprar({data,t,onClose}){
  const [monto,setMonto]=useState('');
  const mesG=data.gastos.filter(g=>{return enMesActual(g)&&g.tipo==='gasto';});
  const egreso=mesG.reduce((s,g)=>s+g.monto,0);
  const compPend=data.compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const ingT=data.ingresos+ingresosExtraMes(data.gastos);
  const disponible=ingT-egreso-compPend;
  const puedo=Number(monto)>0&&disponible-Number(monto)>=0;
  const justo=puedo&&disponible-Number(monto)<ingT*0.1;
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-end',zIndex:300,backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:440,margin:'0 auto',background:t.card,borderRadius:'22px 22px 0 0',padding:'20px 16px 40px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:34,height:4,background:t.border,borderRadius:2,margin:'0 auto 16px'}}/>
        <div style={{fontSize:17,fontWeight:800,color:t.text,marginBottom:6}}>🤔 ¿Puedo comprar esto?</div>
        <div style={{fontSize:12,color:t.muted,marginBottom:16}}>Disponible: <strong style={{color:disponible>=0?co.green:co.red}}>{fmt(disponible)}</strong></div>
        <input type="number" placeholder="¿Cuánto cuesta?" value={monto} onChange={e=>setMonto(e.target.value)} autoFocus style={{width:'100%',boxSizing:'border-box',padding:'14px',borderRadius:12,border:'2px solid '+t.border,background:t.bg,color:t.text,fontSize:22,fontWeight:900,textAlign:'center',fontFamily:'inherit',outline:'none',marginBottom:16}}/>
        {monto>0&&(
          <div style={{padding:18,borderRadius:14,background:puedo?(justo?co.yellow+'18':co.green+'15'):co.red+'12',border:'1px solid '+(puedo?(justo?co.yellow:co.green):co.red)+'44',textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>{puedo?(justo?'⚠️':'✅'):'❌'}</div>
            <div style={{fontSize:16,fontWeight:800,color:puedo?(justo?co.yellow:co.green):co.red,marginBottom:6}}>{puedo?(justo?'¡Justo!':'¡Sí puedes!'):'No por ahora'}</div>
            <div style={{fontSize:13,color:t.muted}}>{puedo?(justo?('Te quedarían solo '+fmt(disponible-Number(monto))+' — justo'):('Te quedarían '+fmt(disponible-Number(monto)))):('Te faltan '+fmt(Number(monto)-disponible))}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PinScreen({pin,onDesbloqueado}){
  const [input,setInput]=useState('');const [error,setError]=useState(false);const [intentos,setIntentos]=useState(0);
  const handleNum=n=>{if(input.length>=6)return;const nuevo=input+n;setInput(nuevo);if(nuevo.length===6){if(nuevo===pin){onDesbloqueado();}else{setError(true);setIntentos(p=>p+1);setTimeout(()=>{setInput('');setError(false);},600);}}};
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0A3A60,#005F73)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif',padding:20}}>
      <div style={{fontSize:52,marginBottom:12}}>🔦</div>
      <div style={{fontSize:24,fontWeight:900,color:'#fff',marginBottom:4}}>FARO</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:40}}>Ingresa tu PIN</div>
      <div style={{display:'flex',gap:14,marginBottom:40}}>
        {Array.from({length:6},(_,i)=>(<div key={i} style={{width:14,height:14,borderRadius:'50%',background:i<input.length?(error?co.red:'#fff'):'rgba(255,255,255,0.3)'}}/>))}
      </div>
      {error&&<div style={{fontSize:12,color:co.red,marginBottom:16,fontWeight:700}}>PIN incorrecto ({intentos} intento{intentos>1?'s':''})</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,72px)',gap:12}}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((n,i)=>(
          <button key={i} onClick={()=>n==='⌫'?setInput(p=>p.slice(0,-1)):n!==''?handleNum(String(n)):null} style={{width:72,height:72,borderRadius:'50%',border:'none',background:n===''?'transparent':'rgba(255,255,255,0.15)',color:'#fff',fontSize:n==='⌫'?20:22,fontWeight:600,cursor:n!==''?'pointer':'default',fontFamily:'inherit'}}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function AuthScreen({onAuth}){
  const [modo,setModo]=useState('login');const [email,setEmail]=useState('');const [pass,setPass]=useState('');const [pass2,setPass2]=useState('');
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [msg,setMsg]=useState('');
  const handleSubmit=async()=>{
    setError('');setMsg('');
    if(!email||!pass){setError('Ingresa email y contraseña');return;}
    if(modo==='signup'&&pass!==pass2){setError('Las contraseñas no coinciden');return;}
    if(pass.length<6){setError('La contraseña debe tener al menos 6 caracteres');return;}
    setLoading(true);
    try{
      const endpoint=modo==='signup'?`${SB_URL}/auth/v1/signup`:`${SB_URL}/auth/v1/token?grant_type=password`;
      const res=await fetch(endpoint,{method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),password:pass})});
      const data=await res.json();
      if(data.error||data.error_description||data.msg){
        const em=data.error_description||data.msg||data.error||'Error desconocido';
        if(em.includes('already registered'))setError('Este email ya tiene cuenta. Inicia sesión.');
        else if(em.includes('Invalid login'))setError('Email o contraseña incorrectos');
        else setError(em);
        setLoading(false);return;
      }
      if(modo==='signup'&&!data.access_token){setMsg('✅ Cuenta creada. Revisa tu email para confirmar.');setModo('login');setLoading(false);return;}
      S.set('faro_token',data.access_token);S.set('faro_user',{email:email.trim().toLowerCase(),id:data.user?.id||email});
      onAuth(data.access_token);
    }catch(e){setError('Error de conexión: '+e.message);}
    setLoading(false);
  };
  const inp2={width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:14,border:'1.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:15,fontFamily:'inherit',outline:'none'};
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A3A60 0%,#005F73 60%,#0A9396 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif',padding:24}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{fontSize:60,marginBottom:10}}>🔦</div>
        <div style={{fontSize:32,fontWeight:900,color:'#fff',letterSpacing:-1}}>FARO</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:4}}>Tu copiloto financiero</div>
      </div>
      <div style={{width:'100%',maxWidth:380,background:'rgba(255,255,255,0.1)',backdropFilter:'blur(20px)',borderRadius:24,padding:28,border:'1px solid rgba(255,255,255,0.2)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,background:'rgba(0,0,0,0.2)',borderRadius:12,padding:4,marginBottom:24}}>
          {[['login','Iniciar sesión'],['signup','Crear cuenta']].map(([v,l])=>(
            <button key={v} onClick={()=>{setModo(v);setError('');setMsg('');}} style={{padding:'10px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,background:modo===v?'#fff':'transparent',color:modo===v?co.primary:'rgba(255,255,255,0.7)'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div><div style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700,marginBottom:6}}>EMAIL</div><input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={inp2} autoCapitalize="none"/></div>
          <div><div style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700,marginBottom:6}}>CONTRASEÑA</div><input type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={e=>setPass(e.target.value)} style={inp2}/></div>
          {modo==='signup'&&<div><div style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700,marginBottom:6}}>CONFIRMAR</div><input type="password" placeholder="Repite la contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} style={inp2}/></div>}
        </div>
        {error&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(231,111,81,0.2)',border:'1px solid rgba(231,111,81,0.5)',borderRadius:10,fontSize:13,color:'#FCA5A5',fontWeight:600}}>{error}</div>}
        {msg&&<div style={{marginTop:12,padding:'10px 14px',background:'rgba(42,157,143,0.2)',border:'1px solid rgba(42,157,143,0.5)',borderRadius:10,fontSize:13,color:'#A7F3D0',fontWeight:600}}>{msg}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',marginTop:20,padding:'16px',borderRadius:14,border:'none',background:loading?'rgba(255,255,255,0.2)':'#fff',color:loading?'rgba(255,255,255,0.5)':co.primary,fontSize:16,fontWeight:800,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit'}}>
          {loading?'⏳ Procesando...':modo==='login'?'→ Entrar a FARO':'✓ Crear mi cuenta'}
        </button>
      </div>
    </div>
  );
}

function PlanView({data,setData,t}){
  const [txt,setTxt]=useState('');
  const [det,setDet]=useState([]);
  const [manual,setManual]=useState(false);
  const [ocr,setOcr]=useState('');
  const [mN,setMN]=useState('');const [mM,setMM]=useState('');const [mD,setMD]=useState('');
  const inp={width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};
  const listaBase=(data.ingresosList&&data.ingresosList.length)?data.ingresosList:[{nombre:'Anticipo',monto:0,dia:15},{nombre:'Sueldo',monto:data.ingresos||0,dia:30}];
  const extraMes=ingresosExtraMes(data.gastos);
  const primero=[...listaBase].sort((a,b)=>a.dia-b.dia)[0];
  const lista=listaBase;
  // Pagos para el reparto: anticipo y sueldo, más los otros ingresos del mes como pago aparte
  const pagos=extraMes>0?[...listaBase,{nombre:'Otros ingresos',monto:extraMes,dia:primero.dia}]:listaBase;
  const comp=[...data.compromisos.filter(c=>c.activo),...atrasosComoItems(data)];
  const mesG=data.gastos.filter(g=>{return enMesActual(g);});
  const variables=mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const fijos=comp.reduce((s,c)=>s+Number(c.monto||0),0);
  const ingT=pagos.reduce((s,i)=>s+Number(i.monto||0),0);
  const necesitas=fijos+variables;const disp=ingT-necesitas;
  const carga=ingT>0?Math.round((necesitas/ingT)*100):0;
  const cc=carga>=85?co.red:carga>=70?co.yellow:co.green;
  const ag=comp.filter(c=>c.monto>0).map(c=>({...c,d:diasDe(c)})).sort((a,b)=>a.d-b.d);
  const prox=ag.find(c=>c.d>=0&&!c.pagado)||ag.find(c=>!c.pagado)||ag[0];
  const proxVentana=ag.filter(c=>!c.pagado&&c.d<=15);
  const semana=ag.filter(c=>!c.pagado&&c.d>=0&&c.d<=7).reduce((s,c)=>s+Number(c.monto||0),0);
  const togglePagada=id=>setData(d=>({...d,compromisos:d.compromisos.map(x=>x.id===id?{...x,pagado:!x.pagado,fechaPago:!x.pagado?NOW.toISOString().split('T')[0]:null}:x)}));
  const borrarComp=(id,nombre)=>{if(window.confirm('¿Borrar "'+nombre+'" de tus cuentas?'))setData(d=>({...d,compromisos:d.compromisos.filter(x=>x.id!==id)}));};
  const asig=repartir(comp.filter(c=>c.monto>0),pagos);const asigMap={};asig.forEach(a=>{asigMap[a.bill.id]=a.nombre;});
  const flujo=[...pagos].sort((a,b)=>a.dia-b.dia).map(p=>{const bills=asig.filter(a=>a.nombre===p.nombre).map(a=>a.bill);const total=bills.reduce((s,b)=>s+Number(b.monto||0),0);return{p,bills,total,saldo:Number(p.monto||0)-total};});
  const neg=flujo.find(f=>f.saldo<0);

  const setLista=nl=>setData(d=>({...d,ingresosList:nl,ingresos:nl.reduce((s,i)=>s+Number(i.monto||0),0)}));
  const leer=()=>{const r=leerTexto(txt);if(!r.length)alert('No encontré montos. Revisa que cada línea tenga un valor como $12.990 o 1.148.896.');setDet(r);};
  const cargarTesseract=()=>new Promise((res,rej)=>{if(typeof window!=='undefined'&&window.Tesseract)return res(window.Tesseract);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';s.onload=()=>res(window.Tesseract);s.onerror=()=>rej(new Error('No se pudo cargar el lector de fotos. Revisa tu conexión.'));document.head.appendChild(s);});
  const onArchivo=async(f)=>{
    if(!f)return;
    if(f.type&&f.type.startsWith('image/')){
      try{
        setOcr('Preparando lector…');
        const Tess=await cargarTesseract();
        setOcr('Leyendo foto… 0%');
        const {data}=await Tess.recognize(f,'spa',{logger:m=>{if(m.status==='recognizing text')setOcr('Leyendo foto… '+Math.round((m.progress||0)*100)+'%');}});
        setOcr('');
        const texto=(data&&data.text)||'';
        setTxt(texto);
        const r=leerTexto(texto);
        if(!r.length)alert('Leí la foto pero no encontré montos claros. Revisa el texto en el recuadro y corrígelo, o usa "A mano".');
        setDet(r);
      }catch(e){setOcr('');alert(e.message||'No pude leer la foto');}
    }else{
      const r=new FileReader();r.onload=()=>{setTxt(r.result);setDet(leerTexto(r.result));};r.readAsText(f);
    }
  };
  const agregar=()=>{
    const inc=det.filter(x=>x.incluir);if(!inc.length)return;
    setData(d=>{
      let comps=[...d.compromisos];let nextId=Math.max(0,...comps.map(c=>Number(c.id)||0));const nuevosG=[];
      inc.forEach(x=>{
        if(x.tipo==='fijo'){
          const dd=x.desc.toLowerCase();
          const ex=comps.find(c=>{const n=c.nombre.toLowerCase();return dd.includes(n.split(' ')[0])||n.includes(dd.split(' ')[0])||(c.gmailKey&&dd.includes(c.gmailKey));});
          if(ex)comps=comps.map(c=>c===ex?{...c,monto:x.monto,dia:x.dia||c.dia}:c);
          else{nextId++;comps.push({id:nextId,nombre:x.desc,monto:x.monto,dia:x.dia||10,banco:'',pagado:false,activo:true,gmailKey:'',tipo:'fijo',fechaPago:null});}
        }else nuevosG.push({id:Date.now()+Math.random(),tipo:x.tipo,catId:x.catId||'otros',monto:x.monto,desc:x.desc,fecha:NOW.toISOString().split('T')[0],origen:'importado'});
      });
      return{...d,compromisos:comps,gastos:[...nuevosG,...d.gastos]};
    });
    setDet([]);setTxt('');
  };
  const addManual=()=>{
    if(!mN||!mM){alert('Pon al menos servicio y monto');return;}
    const dia=mD?new Date(mD+'T00:00:00').getDate():10;
    setData(d=>{
      const dd=mN.toLowerCase();let comps=[...d.compromisos];
      const ex=comps.find(c=>{const n=c.nombre.toLowerCase();return dd.includes(n.split(' ')[0])||n.includes(dd.split(' ')[0]);});
      if(ex)comps=comps.map(c=>c===ex?{...c,monto:Number(mM),dia}:c);
      else{const id=Math.max(0,...comps.map(c=>Number(c.id)||0))+1;comps.push({id,nombre:mN,monto:Number(mM),dia,banco:'',pagado:false,activo:true,gmailKey:'',tipo:'fijo',fechaPago:null});}
      return{...d,compromisos:comps};
    });
    setMN('');setMM('');setMD('');setManual(false);
  };

  return(
    <div>
      {/* Hero: cuánto necesitas */}
      <div style={{background:'linear-gradient(135deg,#0A3A60,#005F73)',borderRadius:24,padding:22,color:'#fff',marginBottom:16,boxShadow:'0 10px 25px rgba(0,95,115,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <div style={{fontSize:10,opacity:0.7,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>CADA MES NECESITAS</div>
            <div style={{fontSize:32,fontWeight:900,letterSpacing:-0.5}}>{fmt(necesitas)}</div>
            <div style={{fontSize:11,opacity:0.75,marginTop:4}}>para pagar todo lo tuyo</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{width:54,height:54,borderRadius:'50%',border:'3px solid '+cc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:cc,background:'rgba(255,255,255,0.1)'}}>{carga}%</div>
            <div style={{fontSize:9,opacity:0.7,marginTop:3}}>DE TU SUELDO</div>
          </div>
        </div>
        {proxVentana.length>0&&(
          <div style={{background:'rgba(255,255,255,0.12)',borderRadius:12,padding:'10px 12px',marginBottom:14}}>
            <div style={{fontSize:11,opacity:0.75,marginBottom:6}}>⏰ Próximos pagos (15 días)</div>
            {proxVentana.map(p=>(
              <div key={p.id} style={{fontSize:12,display:'flex',justifyContent:'space-between',gap:8,padding:'3px 0'}}>
                <span>{p.nombre} · {fmt(p.monto)}</span>
                <span style={{whiteSpace:'nowrap'}}>{p.d<0?<span style={{color:'#FCA5A5'}}>VENCIDO</span>:p.d===0?<span style={{color:'#FDE68A'}}>hoy</span>:'en '+p.d+' día'+(p.d===1?'':'s')}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:14}}>
          {[['💼 Ingresos',fmt(ingT),'#fff'],['📋 Cuentas',fmt(necesitas),'#fff'],[disp>=0?'💚 Te queda':'🔴 Faltan',fmt(disp),disp>=0?'#A7F3D0':'#FCA5A5']].map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:9,opacity:0.65,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* ¿Te alcanza cada pago? */}
      <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+t.border,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:3}}>💵 ¿Te alcanza cada pago?</div>
        <div style={{fontSize:11,color:t.muted,marginBottom:14,lineHeight:1.5}}>Tu sueldo llega en 2 partes. Faro reparte cada cuenta al pago que la cubre, según su fecha de vencimiento.</div>
        {flujo.map((f,i)=>{const ok=f.saldo>=0;return(
          <div key={i} style={{border:'1px solid '+(ok?t.border:co.red+'55'),borderRadius:14,padding:12,marginBottom:10,background:ok?'transparent':co.red+'0D'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:800,color:t.text}}>📥 {f.p.nombre} <span style={{fontSize:11,fontWeight:600,color:t.muted}}>· día {f.p.dia}</span></div>
              <div style={{fontSize:14,fontWeight:900,color:co.green}}>+{fmt(f.p.monto)}</div>
            </div>
            {f.bills.length?f.bills.map(b=>(
              <div key={b.id} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:t.muted,padding:'2px 0'}}><span>{getIcon(b.nombre)} {b.nombre}</span><span>−{fmt(b.monto)}</span></div>
            )):<div style={{fontSize:11,color:t.muted,padding:'2px 0'}}>Sin cuentas asignadas</div>}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid '+t.border,fontSize:12,fontWeight:800}}><span style={{color:t.text}}>{ok?'💚 Te sobra':'🔴 Te falta'}</span><span style={{color:ok?co.green:co.red}}>{fmt(f.saldo)}</span></div>
            {!ok&&(()=>{const o=flujo.find(x=>x.saldo>0&&x.p.nombre!==f.p.nombre);if(!o)return null;const cubre=Math.min(-f.saldo,o.saldo);const resto=-f.saldo-cubre;return(
              <div style={{fontSize:11,color:t.muted,marginTop:8,lineHeight:1.5}}>💡 Guarda {fmt(cubre)} de tu {o.p.nombre.toLowerCase()} para cubrirlo{resto>0?` (aún faltarían ${fmt(resto)})`:''}</div>
            );})()}
          </div>
        );})}
        <div style={{fontSize:10,color:t.muted,lineHeight:1.5}}>💡 Los gastos variables (bencina, súper…) se reparten durante el mes; aquí ves solo las cuentas fijas con fecha.</div>
      </div>

      {/* Subir boletas */}
      <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+t.border,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:4}}>📥 Subir boletas y gastos</div>
        <div style={{fontSize:11,color:t.muted,marginBottom:12,lineHeight:1.5}}>Pega una boleta (luz, agua, gastos comunes…), la cartola del banco o gastos. Faro lee el monto y la fecha de vencimiento.</div>
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder={'Ej boleta:\nEnel Chile Total a pagar $63.141 Vence 08/11/2026\nGastos Comunes $148.896 pagar hasta el 10 de noviembre'} style={{...inp,minHeight:88,lineHeight:1.5,resize:'vertical'}}/>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <label style={{flex:1,padding:'11px',borderRadius:11,background:'transparent',color:co.primary,border:'1px dashed '+co.primary,fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'center'}}>📷 Foto / archivo
            <input type="file" accept="image/*,.csv,.txt,text/plain" style={{display:'none'}} onChange={e=>onArchivo(e.target.files[0])}/>
          </label>
          <button onClick={()=>setManual(m=>!m)} style={{flex:1,padding:'11px',borderRadius:11,background:'transparent',color:t.muted,border:'1px solid '+t.border,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>✏️ A mano</button>
        </div>
        {ocr&&<div style={{marginTop:10,padding:'10px 12px',borderRadius:11,background:co.primary+'15',border:'1px solid '+co.primary+'33',color:co.primary,fontSize:13,fontWeight:700,textAlign:'center'}}>📷 {ocr}</div>}
        <button onClick={leer} style={{width:'100%',padding:'13px',borderRadius:12,background:co.primary,color:'#fff',border:'none',fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:'inherit',marginTop:10}}>🔍 Leer</button>
        {manual&&(
          <div style={{marginTop:12,paddingTop:12,borderTop:'1px dashed '+t.border,display:'flex',flexDirection:'column',gap:8}}>
            <input value={mN} onChange={e=>setMN(e.target.value)} placeholder="Servicio (ej: Luz, Gastos Comunes)" style={inp}/>
            <input type="number" value={mM} onChange={e=>setMM(e.target.value)} placeholder="Monto $" style={inp}/>
            <input type="date" value={mD} onChange={e=>setMD(e.target.value)} style={inp}/>
            <button onClick={addManual} style={{width:'100%',padding:'11px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>+ Agregar boleta</button>
          </div>
        )}
      </div>

      {/* Detectados */}
      {det.length>0&&(
        <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+co.secondary+'55',marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:t.text,marginBottom:3}}>Faro encontró {det.length} movimientos</div>
          <div style={{fontSize:11,color:t.muted,marginBottom:12}}>Las boletas (Fijo) llevan día de pago. Ajusta y agrega.</div>
          {det.map(m=>(
            <div key={m.id} style={{padding:'9px 0',borderBottom:'1px solid '+t.border,opacity:m.incluir?1:0.4}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>setDet(ds=>ds.map(x=>x.id===m.id?{...x,incluir:!x.incluir}:x))} style={{width:22,height:22,minWidth:22,borderRadius:7,border:'2px solid '+(m.incluir?co.green:t.border),background:m.incluir?co.green:'transparent',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:900,fontFamily:'inherit'}}>{m.incluir?'✓':''}</button>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:t.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.desc}</div>
                  <div style={{fontSize:10,color:t.muted,marginTop:1}}>{m.tipo==='ingreso'?'↙ Ingreso':m.tipo==='fijo'?'📋 Boleta/Fijo':'💸 Gasto'}</div>
                </div>
                <select value={m.tipo} onChange={e=>setDet(ds=>ds.map(x=>x.id===m.id?{...x,tipo:e.target.value,dia:e.target.value==='fijo'&&!x.dia?NOW.getDate():x.dia}:x))} style={{fontSize:11,padding:'4px 6px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:t.text,maxWidth:82,fontFamily:'inherit'}}>
                  <option value="gasto">Gasto</option><option value="fijo">Fijo</option><option value="ingreso">Ingreso</option>
                </select>
                <input type="number" value={m.monto} onChange={e=>setDet(ds=>ds.map(x=>x.id===m.id?{...x,monto:Number(e.target.value)||0}:x))} style={{width:78,minWidth:78,padding:'5px 6px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:m.tipo==='ingreso'?co.green:t.text,fontSize:13,fontWeight:800,textAlign:'right',fontFamily:'inherit'}}/>
                <button onClick={()=>setDet(ds=>ds.filter(x=>x.id!==m.id))} title="Quitar" style={{background:'transparent',border:'none',color:co.red,cursor:'pointer',fontSize:15,padding:'0 2px',fontFamily:'inherit'}}>✕</button>
              </div>
              {m.tipo==='fijo'&&(
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7,marginLeft:30}}>
                  <span style={{fontSize:11,color:t.muted}}>📅 Vence día:</span>
                  <input type="number" min="1" max="31" value={m.dia||''} onChange={e=>setDet(ds=>ds.map(x=>x.id===m.id?{...x,dia:Math.min(31,Math.max(1,+e.target.value||1))}:x))} style={{width:56,padding:'5px 8px',borderRadius:8,border:'1px solid '+(m.dia?t.border:co.yellow),background:t.bg,color:t.text,fontSize:12,fontFamily:'inherit',textAlign:'center'}}/>
                  {!m.dia&&<span style={{fontSize:10,color:co.orange}}>← pon el día</span>}
                </div>
              )}
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={()=>{if(window.confirm('¿Descartar lo leído? No se guardará nada.')){setDet([]);setTxt('');}}} style={{padding:'13px 16px',borderRadius:12,background:'transparent',color:co.red,border:'1px solid '+co.red+'55',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>🗑️ Descartar</button>
            <button onClick={agregar} disabled={!det.some(x=>x.incluir)} style={{flex:1,padding:'13px',borderRadius:12,background:det.some(x=>x.incluir)?`linear-gradient(135deg,${co.green},${co.secondary})`:t.border,color:det.some(x=>x.incluir)?'#fff':t.muted,border:'none',fontWeight:800,fontSize:15,cursor:det.some(x=>x.incluir)?'pointer':'not-allowed',fontFamily:'inherit'}}>💾 Guardar {det.filter(x=>x.incluir).length} boleta{det.filter(x=>x.incluir).length===1?'':'s'}</button>
          </div>
        </div>
      )}

      {/* Calendario de pagos */}
      <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+t.border,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:3}}>📅 Calendario de pagos</div>
        <div style={{fontSize:11,color:t.muted,marginBottom:14}}>{semana>0?<span>Esta semana debes pagar <b style={{color:t.text}}>{fmt(semana)}</b></span>:'Ordenado por fecha de vencimiento'}</div>
        {ag.length?ag.map(c=>{const pg=c.pagado;const urg=pg?co.green:c.d<0?co.red:c.d<=3?co.red:c.d<=7?co.orange:co.secondary;const etq=pg?'✓ Pagada':c.d<0?'VENCIDO':c.d===0?'HOY':c.d===1?'mañana':'en '+c.d+' días';return(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid '+t.border,opacity:pg?0.6:1}}>
            <div style={{width:44,minWidth:44,textAlign:'center',background:urg+'18',border:'1px solid '+urg+'44',borderRadius:10,padding:'6px 0'}}>
              <div style={{fontSize:15,fontWeight:900,color:urg,lineHeight:1}}>{c.dia}</div><div style={{fontSize:9,color:urg}}>DÍA</div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:t.text,textDecoration:pg?'line-through':'none'}}>{getIcon(c.nombre)} {c.nombre}</div>
              <div style={{fontSize:14,fontWeight:800,color:pg?co.green:t.text}}>{fmt(c.monto)}</div>
              <div style={{fontSize:10,fontWeight:700,color:urg,marginTop:1}}>{etq} · lo paga tu {(asigMap[c.id]||pagoCubre(c.dia,lista).nombre).toLowerCase()}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end'}}>
              <button onClick={()=>togglePagada(c.id)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid '+(pg?co.green:t.border),background:pg?co.green:'transparent',color:pg?'#fff':co.green,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>{pg?'✓ Pagada':'Pagar'}</button>
              <button onClick={()=>borrarComp(c.id,c.nombre)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid '+co.red+'44',background:'transparent',color:co.red,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>🗑️ Borrar</button>
            </div>
          </div>
        );}):<div style={{fontSize:12,color:t.muted,textAlign:'center',padding:'10px 0'}}>Sube boletas para ver tus próximos pagos.</div>}
        {ag.length>0&&<div style={{display:'flex',justifyContent:'space-between',marginTop:12,fontSize:13,fontWeight:800,color:t.text}}><span>Total del mes</span><span>{fmt(ag.reduce((s,c)=>s+Number(c.monto||0),0))}</span></div>}
      </div>

      {/* Consejo */}
      <div style={{background:cc+'18',border:'1px solid '+cc+'44',borderRadius:16,padding:'13px 15px',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:20}}>{(neg||disp<0)?'🚨':carga>=70?'⚠️':'💡'}</span>
        <div style={{fontSize:12,color:t.text,lineHeight:1.5}}>
          {neg?<span>Con tu <b>{neg.p.nombre.toLowerCase()}</b> (día {neg.p.dia}) te faltan <b>{fmt(-neg.saldo)}</b> para las cuentas de esa quincena. Conviene mover una fecha de pago o adelantar plata del otro período.</span>
          :disp<0?<span>Estás gastando <b>{fmt(-disp)} más</b> de lo que entra. Recorta gastos o renegocia una cuenta antes de fin de mes.</span>
          :carga>=70?<span>Te queda <b>{fmt(disp)}</b> para imprevistos y ahorro. Es poco: cuida los gastos variables.</span>
          :<span>Vas bien: te queda <b>{fmt(disp)}</b> libre. Lo sano es guardar al menos {fmt(Math.round(ingT*0.1))} (10%) para tu fondo.</span>}
        </div>
      </div>

      {/* Tu sueldo en 2 partes */}
      <div style={{background:t.card,borderRadius:18,padding:16,border:'1px solid '+t.border}}>
        <div style={{fontSize:14,fontWeight:800,color:t.text,marginBottom:3}}>💼 Tu sueldo</div>
        <div style={{fontSize:11,color:t.muted,marginBottom:12}}>Llega en 2 partes. Ajusta montos y días.</div>
        {lista.map((ing,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:t.text,width:72,minWidth:72}}>{ing.nombre}</div>
            <input type="number" value={ing.monto||''} onChange={e=>setLista(lista.map((x,j)=>j===i?{...x,monto:Number(e.target.value)||0}:x))} style={{...inp,fontSize:15,fontWeight:800}}/>
            <span style={{fontSize:11,color:t.muted}}>día</span>
            <input type="number" min="1" max="31" value={ing.dia} onChange={e=>setLista(lista.map((x,j)=>j===i?{...x,dia:Math.min(31,Math.max(1,Number(e.target.value)||1))}:x))} style={{width:52,boxSizing:'border-box',padding:'10px 8px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontWeight:700,outline:'none',textAlign:'center',fontFamily:'inherit'}}/>
          </div>
        ))}
        <div style={{padding:'10px 12px',borderRadius:12,background:co.green+'14',border:'1px solid '+co.green+'33',marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:800,color:t.text}}>💚 Otros ingresos del mes</span>
            <span style={{fontSize:14,fontWeight:800,color:co.green}}>+{fmt(extraMes)}</span>
          </div>
          <div style={{fontSize:11,color:t.muted,marginTop:3}}>{extraMes>0?`Se suman como pago aparte el día ${primero.dia}.`:'Sin otros ingresos este mes. Agrégalos desde Inicio.'}</div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:800,color:t.text,marginTop:4,paddingTop:10,borderTop:'1px solid '+t.border}}><span>Total mensual</span><span>{fmt(ingT)}</span></div>
      </div>
    </div>
  );
}

function RecordatorioModal({items,setData,t,onClose}){
  const [lista,setLista]=useState(items);
  const [abiertos,setAbiertos]=useState([]);
  // Pagar: abre la página del banco (si aplica) y espera confirmación; "Ya pagué" marca el pago
  const irAPagar=c=>{if(/scotia|dividendo/i.test((c.banco||'')+' '+c.nombre))window.open('https://www.scotiabankchile.cl','_blank');setAbiertos(a=>[...a,c.id]);};
  const pagar=id=>{setData(d=>({...d,compromisos:d.compromisos.map(x=>x.id===id?{...x,pagado:true,fechaPago:NOW.toISOString().split('T')[0]}:x)}));const r=lista.filter(x=>x.id!==id);setLista(r);if(!r.length)onClose();};
  const total=lista.reduce((s,c)=>s+Number(c.monto||0),0);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400,backdropFilter:'blur(8px)',padding:18}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:400,background:t.card,borderRadius:22,padding:'20px 18px',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:14}}>
          <div style={{fontSize:34,marginBottom:4}}>🔔</div>
          <div style={{fontSize:18,fontWeight:900,color:t.text}}>Recordatorio de pagos</div>
          <div style={{fontSize:12,color:t.muted,marginTop:3}}>Tienes {lista.length} cuenta{lista.length===1?'':'s'} por pagar · {fmt(total)}</div>
        </div>
        {lista.map(c=>{const dr=c.dr;const venc=dr<0,hoy=dr===0;const col=venc||hoy||dr<=5?co.red:co.secondary;
          const etq=venc?`Venció hace ${-dr} día${-dr===1?'':'s'}`:hoy?'¡Vence HOY!':`Vence en ${dr} día${dr===1?'':'s'}`;return(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid '+t.border}}>
            <span style={{fontSize:22}}>{getIcon(c.nombre)}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
              <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmt(c.monto)}</div>
              <div style={{fontSize:11,fontWeight:700,color:col,marginTop:1}}>⏰ {etq}</div>
            </div>
            {abiertos.includes(c.id)
              ?<button onClick={()=>pagar(c.id)} style={{padding:'8px 14px',borderRadius:10,border:'none',background:co.green,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✓ Ya pagué</button>
              :<button onClick={()=>irAPagar(c)} style={{padding:'8px 14px',borderRadius:10,border:'1px solid '+co.green,background:'transparent',color:co.green,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>Pagar</button>}
          </div>
        );})}
        <button onClick={onClose} style={{width:'100%',marginTop:16,padding:'13px',borderRadius:12,border:'1px solid '+t.border,background:'transparent',color:t.text,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Entendido</button>
      </div>
    </div>
  );
}

export default function FaroApp(){
  const [loaded,setLoaded]=useState(false);
  const [authed,setAuthed]=useState(true);
  const [tab,setTab]=useState('panorama');
  const [bloqueado,setBloqueado]=useState(false);
  const [isDark,setIsDark]=useState(false);
  const [recItems,setRecItems]=useState([]);
  const [showRec,setShowRec]=useState(false);
  const [data,setData]=useState({
    ingresos:1200000,ingresosList:[{nombre:'Anticipo',monto:0,dia:15},{nombre:'Sueldo',monto:1200000,dia:30}],telefono:'',whatsappKey:'',gmailWebAppUrl:'',boletasGmail:[],
    fintocLinks:[],compromisos:COMP_DEF,gastos:[],categorias:CATS_DEF,
    historial:[],fondoEmergencia:0,fondoActual:0,metaAhorro:0,pin:null,syncCode:null,
    numerosCliente:[
      {id:1,nombre:'Enel',numero:'2798679-K',key:'enel'},
      {id:2,nombre:'Aguas Andinas',numero:'1798505-1',key:'aguas_andinas'},
      {id:3,nombre:'Metrogas',numero:'000900644915',key:'metrogas'},
      {id:4,nombre:'Entel Móvil',numero:'56966349824',key:'entel'},
      {id:5,nombre:'Entel Hogar',numero:'126877072',key:'entel_hogar'},
    ],
  });
  const t={bg:isDark?co.bgDark:co.bgLight,card:isDark?co.cardDark:co.cardLight,text:isDark?co.textDark:co.textLight,muted:isDark?co.mutedDark:co.mutedLight,border:isDark?co.borderDark:co.borderLight};

  useEffect(()=>{
    const d=S.get('faro_v4',null);const dk=S.get('faro_dark',false);const tk=S.get('faro_token',null);
    if(d)setData(prev=>({...prev,...d,categorias:d.categorias?.length?d.categorias:CATS_DEF}));
    setIsDark(dk);if(d?.pin)setBloqueado(true);if(tk)setAuthed(true);setLoaded(true);
  },[]);
  // Cambio de mes: archiva lo pagado del mes anterior, pasa lo no pagado a "atrasos" y reinicia los pagos
  const [mesVista,setMesVista]=useState(KEY_HOY);
  useEffect(()=>{
    if(!loaded)return;
    if(!data.mesActual){setData(d=>({...d,mesActual:KEY_HOY}));return;}
    if(data.mesActual===KEY_HOY)return;
    const prev=data.mesActual;
    setData(d=>{
      // Lo que no se pagó conserva el monto que tuvo ese mes (si no tenía monto, queda "por confirmar")
      const nuevosAtrasos=d.compromisos.filter(c=>c.activo&&!c.fecha&&!c.pagado).map(c=>({id:'a'+c.id+'-'+prev,compromisoId:c.id,nombre:c.nombre,monto:Number(c.monto)||0,mes:prev,pagado:false,fechaPago:null}));
      // Cuentas variables: el monto del mes nuevo se borra; solo vuelve con la boleta (email) o al ingresarlo
      const comp=d.compromisos.map(c=>{if(c.fecha)return c;const pm={...(c.pagadoMes||{})};if(c.pagado)pm[prev]=c.fechaPago||true;return{...c,pagadoMes:pm,pagado:false,fechaPago:null,...(esVariable(c)?{variable:true,monto:0}:{})};});
      return{...d,compromisos:comp,atrasos:[...(d.atrasos||[]),...nuevosAtrasos],mesActual:KEY_HOY};
    });
  },[loaded,data.mesActual]);
  // Cada cuenta pagada aparece como gasto del mes; si se desmarca, el gasto se borra
  const pagadasGastoPrev=useRef(null);
  useEffect(()=>{
    if(!loaded)return;
    const activas=data.compromisos.filter(c=>c.activo&&c.monto>0);
    const ids=activas.filter(c=>c.pagado).map(c=>c.id);
    const esDelMes=g=>{return enMesActual(g);};
    const hoy=new Date().toISOString();
    if(pagadasGastoPrev.current===null){
      // Primera carga: agrega las cuentas pagadas de este mes que aún no tienen gasto
      const faltan=activas.filter(c=>c.pagado&&!data.gastos.some(g=>g.compromisoId===c.id&&esDelMes(g)));
      pagadasGastoPrev.current=ids;
      if(faltan.length)setData(d=>({...d,gastos:[...faltan.map(c=>({id:'c'+c.id+'-'+Date.now(),tipo:'gasto',catId:clasif(c.nombre).catId,monto:Number(c.monto),desc:c.nombre,fecha:hoy,origen:'cuenta',compromisoId:c.id})),...d.gastos]}));
      return;
    }
    const prev=pagadasGastoPrev.current;
    const nuevas=activas.filter(c=>c.pagado&&!prev.includes(c.id));
    const quitadas=prev.filter(id=>!ids.includes(id));
    pagadasGastoPrev.current=ids;
    if(!nuevas.length&&!quitadas.length)return;
    setData(d=>({...d,gastos:[...d.gastos.filter(g=>!(g.compromisoId&&quitadas.includes(g.compromisoId)&&g.origen==='cuenta'&&esDelMes(g))),...nuevas.map(c=>({id:'c'+c.id+'-'+Date.now(),tipo:'gasto',catId:clasif(c.nombre).catId,monto:Number(c.monto),desc:c.nombre,fecha:hoy,origen:'cuenta',compromisoId:c.id}))]}));
  },[data.compromisos,loaded]);
  // Mensajes motivacionales por WhatsApp cuando se marca una cuenta como pagada (y al pagar todas)
  const pagadasPrev=useRef(null);
  const [celebra,setCelebra]=useState(null);
  useEffect(()=>{
    if(!loaded)return;
    const activas=data.compromisos.filter(c=>c.activo&&c.monto>0);
    const pagadasIds=activas.filter(c=>c.pagado).map(c=>c.id);
    if(pagadasPrev.current===null){pagadasPrev.current=pagadasIds;return;}
    const nuevas=activas.filter(c=>c.pagado&&!pagadasPrev.current.includes(c.id));
    pagadasPrev.current=pagadasIds;
    if(!nuevas.length)return;
    const frases=['Un paso más, vas muy bien.','Cada cuenta pagada es libertad.','Sigue así, tu esfuerzo se nota.','Otra menos en la lista, excelente.','Tu yo del futuro te lo agradece.'];
    const pick=()=>frases[Math.floor(Math.random()*frases.length)];
    const todoPagado=activas.every(c=>c.pagado);
    // Banner animado dentro de la app
    if(todoPagado)setCelebra({todo:true,texto:'🎉 ¡Pagaste todas tus cuentas de este período! Hoy te mereces algo bueno.'});
    else setCelebra({todo:false,texto:`✅ Pagaste ${nuevas[0].nombre}. ${pick()}`});
    setTimeout(()=>setCelebra(null),todoPagado?7000:4500);
    sonidoCelebracion(todoPagado);
    // WhatsApp (si está configurado en Ajustes)
    if(!data.telefono||!data.whatsappKey)return;
    nuevas.forEach((c,i)=>setTimeout(()=>enviarWhatsApp(data.telefono,data.whatsappKey,`✅ Pagaste ${c.nombre} ($${fmt(c.monto)}). ${pick()}`),i*3000));
    if(todoPagado)setTimeout(()=>enviarWhatsApp(data.telefono,data.whatsappKey,'🎉 ¡Pagaste todas tus cuentas de este período! Hoy te mereces algo bueno.'),nuevas.length*3000+3000);
  },[data.compromisos,loaded]);
  // Al abrir la app (y al desbloquear con PIN) muestra los pagos pendientes de los próximos 15 días
  useEffect(()=>{
    if(!loaded||bloqueado)return;
    const items=[...data.compromisos.filter(c=>c.activo&&!c.pagado&&c.monto>0).map(c=>({...c,dr:diasDe(c)})).filter(c=>c.dr<=15),...atrasosComoItems(data)].sort((a,b)=>a.dr-b.dr);
    if(items.length){setRecItems(items);setShowRec(true);}
    const hoyStr=new Date().toISOString().split('T')[0];
    if(items.length&&data.telefono&&data.whatsappKey&&data.waUltimoEnvio!==hoyStr){
      const total=items.reduce((s,c)=>s+Number(c.monto||0),0);
      const lineas=items.map(c=>`• ${c.nombre}: $${Number(c.monto).toLocaleString('es-CL')} (${c.dr<0?'vencido':c.dr===0?'hoy':'en '+c.dr+' días'})`).join('\n');
      enviarWhatsApp(data.telefono,data.whatsappKey,`FARO - Pagos próximos 15 días\n${lineas}\nTotal: $${total.toLocaleString('es-CL')}`);
      setData(d=>({...d,waUltimoEnvio:hoyStr}));
    }
  },[loaded,bloqueado]);
  // Importa las compras que el atajo de Wallet envió a /api/gasto y las guarda como gastos
  useEffect(()=>{
    if(!loaded||bloqueado||!data.gastoKey)return;
    fetch(`/api/gasto?clave=${encodeURIComponent(data.gastoKey)}`)
      .then(r=>r.json())
      .then(j=>{
        if(!j?.ok||!Array.isArray(j.data)||!j.data.length)return;
        setData(d=>{
          const apr=d.aprendizaje||{};
          const nuevos=j.data.map(g=>{const k=normComercio(g.comercio);const cat=k&&apr[k];return {id:'w'+g.id+'-'+Date.now(),tipo:'gasto',catId:cat||clasif(g.comercio).catId,monto:Number(g.monto),desc:g.comercio||'Compra Wallet',fecha:g.creado,origen:'wallet',...(cat?{clasificada:true}:{})};});
          return {...d,gastos:[...nuevos,...d.gastos]};
        });
      })
      .catch(()=>{});
  },[loaded,bloqueado]);
  useEffect(()=>{if(loaded)S.set('faro_v4',data);},[data,loaded]);
  useEffect(()=>{if(loaded)S.set('faro_dark',isDark);},[isDark,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    try{
      const hoy=NOW.toISOString().split('T')[0];
      if(S.get('faro_reminder','')===hoy)return; // solo una vez al día
      const items=(data.compromisos||[]).filter(c=>c.activo&&!c.pagado&&c.monto>0)
        .map(c=>({...c,dr:diasReal(c.dia)})).filter(c=>c.dr>=-5&&c.dr<=3).sort((a,b)=>a.dr-b.dr);
      if(items.length){setRecItems(items);setShowRec(true);S.set('faro_reminder',hoy);}
    }catch{}
  },[loaded]);
  useEffect(()=>{
    if(!loaded||!data.gmailWebAppUrl)return;
    const sync=async()=>{
      try{
        const params=new URLSearchParams();
        (data.numerosCliente||[]).filter(nc=>nc.numero).forEach(nc=>params.append(nc.key,nc.numero));
        const url=data.gmailWebAppUrl+(params.toString()?'?'+params.toString():'');
        const r=await fetch(url);const j=await r.json();
        const boletas=(j.data||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.diaVence||null,requiereVerif:x.requiereVerif||false}));
        const vistas=data.boletasVistas||[];const nuevas=boletas.filter(b=>!vistas.includes(sigBoleta(b)));
        if(nuevas.length>0)setData(d=>({...d,boletasGmail:nuevas}));
      }catch{}
    };sync();
  },[loaded]);

  const confirmarBoletas=useCallback(boletas=>{
    if(!boletas.length){setData(d=>({...d,boletasVistas:[...(d.boletasVistas||[]),...(d.boletasGmail||[]).map(sigBoleta)],boletasGmail:[]}));return;}
    setData(d=>({...d,
      compromisos:d.compromisos.map(comp=>{
        const match=boletas.find(b=>b.key===comp.gmailKey);
        if(match&&match.monto>0){const p={monto:match.monto};if(match.diaVence)p.dia=match.diaVence;return{...comp,...p};}
        return comp;
      }).concat(boletas.filter(b=>b.manual).map((b,i)=>({id:Math.max(0,...d.compromisos.map(c=>c.id))+1+i,nombre:b.nombre,monto:Number(b.monto)||0,dia:Number(b.diaVence)||1,banco:'',pagado:false,activo:true,gmailKey:'',tipo:'fijo',fechaPago:null}))),
      boletasGmail:[],
      boletasVistas:[...(d.boletasVistas||[]),...boletas.map(sigBoleta)],
    }));
  },[]);

  if(!loaded)return(
    <div style={{minHeight:'100vh',background:co.primary,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif'}}>
      <div style={{fontSize:56,marginBottom:12}}>🔦</div>
      <div style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:-1}}>FARO</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:6}}>Cargando...</div>
    </div>
  );

  // Login desactivado: Faro es de uso personal y entra directo. (AuthScreen queda disponible por si se reactiva.)
  if(bloqueado&&data.pin)return<PinScreen pin={data.pin} onDesbloqueado={()=>setBloqueado(false)}/>;

  const TABS=[['panorama','🔦','Inicio'],['compromisos','📋','Cuentas'],['plan','🎯','Plan'],['gastos','💸','Gastos'],['analisis','📊','Análisis'],['ajustes','⚙️','Ajustes']];

  return(
    <div style={{background:t.bg,minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',paddingBottom:80}}>
      <div style={{maxWidth:440,margin:'0 auto',padding:'14px 14px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{background:co.primary,width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:17,color:'#fff'}}>🔦</span>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:t.text,letterSpacing:-0.5}}>FARO</div>
              <div style={{fontSize:9,fontWeight:700,color:t.muted}}>COPILOTO FINANCIERO</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {(data.boletasGmail||[]).filter(b=>!(data.boletasVistas||[]).includes(sigBoleta(b))).length>0&&(
              <div onClick={()=>setTab('panorama')} style={{width:22,height:22,borderRadius:'50%',background:co.green,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',cursor:'pointer'}}>{(data.boletasGmail||[]).filter(b=>!(data.boletasVistas||[]).includes(sigBoleta(b))).length}</div>
            )}
            {data.pin&&<button onClick={()=>setBloqueado(true)} style={{background:'transparent',border:'none',fontSize:18,cursor:'pointer'}}>🔒</button>}
            <button onClick={()=>setIsDark(d=>!d)} style={{background:t.card,border:'1px solid '+t.border,borderRadius:99,width:42,height:22,padding:2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:isDark?'flex-end':'flex-start'}}>
              <div style={{width:16,height:16,borderRadius:'50%',background:isDark?co.secondary:co.yellow}}/>
            </button>
          </div>
        </div>
        <div style={{fontSize:11,color:t.muted,fontWeight:600}}>{NOW.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</div>
        <div style={{fontSize:22,fontWeight:900,color:t.text,marginTop:3,marginBottom:20}}>Hola, Cristian 🔦</div>
        {tab==='panorama'&&<PanoramaView data={data} setData={setData} onConfirmarBoletas={confirmarBoletas} t={t} mesVista={mesVista} setMesVista={setMesVista}/>}
        {tab==='compromisos'&&<CompromisosView data={data} setData={setData} t={t} mesVista={mesVista} setMesVista={setMesVista}/>}
        {tab==='plan'&&<PlanView data={data} setData={setData} t={t}/>}
        {tab==='gastos'&&<GastosView data={data} setData={setData} t={t}/>}
        {tab==='analisis'&&<AnalisisView data={data} setData={setData} t={t}/>}
        {tab==='ajustes'&&<AjustesView data={data} setData={setData} t={t} onSyncGmail={b=>{setData(d=>({...d,boletasGmail:b}));setTab('panorama');}}/>}
      </div>
      {showRec&&<RecordatorioModal items={recItems} setData={setData} t={t} onClose={()=>setShowRec(false)}/>}
      <Celebracion celebra={celebra}/>
      <AsistenteFaro data={data} t={t}/>
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:t.card,borderTop:'1px solid '+t.border,height:68,display:'flex',justifyContent:'space-around',alignItems:'center',zIndex:100}}>
        {TABS.map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{background:'none',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:3,cursor:'pointer',fontFamily:'inherit',color:tab===id?co.primary:t.muted}}>
            <span style={{fontSize:19,filter:tab===id?'none':'grayscale(1) opacity(0.5)'}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:tab===id?800:500}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
