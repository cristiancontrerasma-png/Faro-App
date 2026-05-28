'use client';
import React, { useState, useEffect } from 'react';

// ==========================================
// CONFIGURACIONES Y CONSTANTES DE SISTEMA
// ==========================================

const TENSION_MAX = 100;

const EMPRESAS = [
  {key:"enel",           nombre:"Enel (Luz)",          query:"from:enelchile.cl OR from:notificaciones@enel.cl"},
  {key:"cge",            nombre:"CGE (Luz)",           query:"from:cge.cl"},
  {key:"aguas_andinas",  nombre:"Aguas Andinas",       query:"from:aguasandinas.cl"},
  {key:"esval",          nombre:"ESVAL (Agua)",        query:"from:esval.cl"},
  {key:"metrogas",       nombre:"Metrogas (Gas)",      query:"from:metrogas.cl"},
  {key:"vtr",            nombre:"VTR",                 query:"from:vtr.com OR from:vtr.cl"},
  {key:"entel",          nombre:"Entel",               query:"from:entel.cl"},
  {key:"movistar",       nombre:"Movistar",            query:"from:movistar.cl OR from:telefonica.cl"},
  {key:"claro",          nombre:"Claro",               query:"from:clarochile.cl"},
  {key:"wom",            nombre:"WOM",                 query:"from:wom.cl"},
  {key:"scotiabank",     nombre:"Scotiabank Divid.",   query:"from:scotiabank.cl dividendo"},
  {key:"gastos_communes",nombre:"Gastos Comunes",     query:"subject:(gastos comunes) newer_than:45d"}
];

// Patrones estrictos para extraer montos en pesos chilenos sin confundirse con cuentas
const PATRONES_MONTO = [
  /total a pagar\s*[:\s]*\$\s*([\d.,]+)/i,
  /monto a pagar\s*[:\s]*\$\s*([\d.,]+)/i,
  /total\s*[:\s]*\$\s*([\d.,]+)/i,
  /importe\s*[:\s]*\$\s*([\d.,]+)/i
];

// Patrones para extraer fecha de vencimiento
const PATRONES_FECHA = [
  /vencimiento[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  /vence[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  /fecha de pago[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  /pagar antes del[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
];

function extraerMonto(texto) {
  for (const patron of PATRONES_MONTO) {
    const m = texto.match(patron);
    if (m) {
      const num = parseInt(m[1].replace(/[\.\,\$]/g, "").replace(" ", ""));
      if (num > 10 && num < 10000000) return num;
    }
  }
  return null;
}

function extraerFecha(texto) {
  for (const patron of PATRONES_FECHA) {
    const m = texto.match(patron);
    if (m) {
      const partes = m[1].split(/[\/\-]/);
      if (partes.length >= 2) {
        return partes[0]; 
      }
    }
  }
  return null;
}

// ==========================================
// PALETA DE COLORES (MODO CLARO Y OSCURO)
// ==========================================
const co = {
  bgLight: '#F4F7F6', bgDark: '#0D1B2A',
  cardLight: '#FFFFFF', cardDark: '#1B263B',
  textLight: '#1E293B', textDark: '#E2E8F0',
  textMutedLight: '#64748B', textMutedDark: '#94A3B8',
  primary: '#005F73', secondary: '#0A9396',
  green: '#2A9D8F', yellow: '#E9C46A', orange: '#F4A261', red: '#E76F51',
  borderLight: '#E2E8F0', borderDark: '#2C3E50'
};

const NOW = new Date();

// ==========================================
// FORMATEADORES GLOBALES
// ==========================================
const fmtFull = (v) => {
  if (!v && v !== 0) return '$0';
  return '$' + Math.round(v).toLocaleString('es-CL');
};

const fmtK = (v) => {
  if (!v) return '$0';
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
};

// ==========================================
// COMPONENTE: NOTIFICACIÓN GMAIL SYNC
// ==========================================
function GmailSyncBanner({ boletasDetectadas, onConfirmar, onDescartar, t, isDark }) {
  if (!boletasDetectadas?.length) return null;
  return (
    <div style={{background:isDark?"linear-gradient(135deg,#064E3B,#065F46)":"linear-gradient(135deg,#ECFDF5,#D1FAE5)",border:'1px solid '+(t.green)+'44',borderRadius:18,padding:'16px 20px',marginBottom:24,boxShadow:'0 4px 15px rgba(0,0,0,0.05)'}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:24,flexShrink:0}}>📨</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:isDark?"#ECFDF5":"#064E3B",marginBottom:3}}>
            FARO detectó {boletasDetectadas.length} boleta{boletasDetectadas.length>1?"s":""} nueva{boletasDetectadas.length>1?"s":""}
          </div>
          <div style={{fontSize:12,color:t.t2}}>Llegaron a tu Gmail. ¿Cargar montos en FARO?</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {boletasDetectadas.map(b=>(
          <div key={b.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",background:isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.6)",borderRadius:10,border:'1px solid '+(isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)')}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:isDark?"#ECFDF5":"#064E3B"}}>{b.nombre}</div>
              {b.diaVence&&<div style={{fontSize:11,color:t.t3}}>Vence día {b.diaVence}</div>}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:t.green}}>{fmtFull(b.monto)}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button onClick={onDescartar} style={{padding:"11px",borderRadius:12,background:"transparent",color:t.t2,border:"1px solid "+(t.border),cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13}}>
          Ignorar
        </button>
        <button onClick={()=>onConfirmar(boletasDetectadas)} style={{padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${t.green},#047857)`,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,boxShadow:'0 2px 8px rgba(4,120,87,0.3)'}}>
          ✓ Cargar en FARO
        </button>
      </div>
    </div>
  );
}

// ==========================================
// VISTA: PANORAMA
// ==========================================
function PanoramaView({ data, onBoletasConfirmadas, t, isDark }) {
  const { ingresos, compromisos, categorias, boletasGmail } = data;
  const mesG = gastos.filter(g=>{ const d=new Date(g.fecha); return d.getMonth()===NOW.getMonth()&&d.getFullYear()===NOW.getFullYear(); });
  const totalGast = mesG.reduce((s,g)=>s+Math.abs(g.monto),0);
  const totalComp = compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalPres = categorias.reduce((s,c)=>s+Number(c.presupuesto||0),0);
  const necesita = totalComp + totalPres;
  const compPag = compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalSal = compPag + totalGast;
  const disponible = (ingresos||0) - totalSal;
  const pctCub = necesita>0 ? Math.min((totalSal/necesita)*100,100) : 0;
  const tension = calcTension(compromisos, ingresos, totalGast);
  const tInfo = tensionInfo(tension);

  const proximos = compromisos.filter(c=>c.activo&&!c.pagado)
    .map(c=>({...c,dias:diasHasta(c.dia)})).sort((a,b)=>a.dias-b.dias).slice(0,4);

  return (
    <div>
      <GmailSyncBanner 
        boletasDetectadas={boletasGmail} 
        onConfirmar={onBoletasConfirmadas}
        onDescartar={() => onBoletasConfirmadas([])}
        t={t} isDark={isDark}
      />
      
      <div style={{background:isDark?'linear-gradient(135deg,#1E3A8A,#0F172A)':'linear-gradient(135deg,#0A3A60,#005F73)',borderRadius:24,padding:24,color:'#fff',marginBottom:24,boxShadow:'0 10px 25px rgba(0,95,115,0.15)'}}>
        <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1,opacity:0.7,marginBottom:6}}>FARO DICE — ESTE MES NECESITAS</div>
        <div style={{fontSize:36,fontWeight:900,marginBottom:16,letterSpacing:-0.5}}>{fmtFull(necesita)}</div>
        
        <div style={{background:'rgba(255,255,255,0.1)',borderRadius:99,height:6,overflow:'hidden',marginBottom:10}}>
          <div style={{background:'#fff',width:`${pctCub}%`,height:'100%',borderRadius:99,transition:'width 0.5s ease'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.9}}>
          <span>Cubierto: {fmtFull(totalSal)} ({Math.round(pctCub)}%)</span>
          <span>Quedan {fmtFull(Math.max(0,necesita-totalSal))}</span>
        </div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:24,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:20}}>
          <div>
            <div style={{fontSize:11,opacity:0.7,display:'flex',alignItems:'center',gap:4}}>📦 Compromisos</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtK(totalComp)}</div>
          </div>
          <div>
            <div style={{fontSize:11,opacity:0.7,display:'flex',alignItems:'center',gap:4}}>🎯 Presupuesto</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtK(totalPres)}</div>
          </div>
          <div style={{marginTop:4}}>
            <div style={{fontSize:11,opacity:0.7,display:'flex',alignItems:'center',gap:4}}>💸 Gastado</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtFull(totalSal)}</div>
          </div>
          <div style={{marginTop:4}}>
            <div style={{fontSize:11,opacity:0.7,display:'flex',alignItems:'center',gap:4}}>✅ Pagado</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtFull(compPag)}</div>
          </div>
        </div>
      </div>

      <div style={{background:t.card,borderRadius:20,padding:20,marginBottom:24,border:'1px solid '+t.border,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:t.text}}>Índice de tensión</div>
          <div style={{fontSize:12,color:t.textMuted,marginTop:2,display:'flex',alignItems:'center',gap:4}}>{tInfo.emoji} {tInfo.label}</div>
        </div>
        <div style={{position:'relative',width:64,height:64,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'99%',border:`4px solid ${tInfo.color}`,fontSize:16,fontWeight:900,color:tInfo.color}}>
          {tension}
        </div>
      </div>
      
      {/* Barra de Tensión Visual */}
      <div style={{background:t.border,height:4,borderRadius:2,overflow:'hidden',marginBottom:24,marginTop:-16}}>
        <div style={{background:`linear-gradient(to right, ${co.green}, ${co.yellow}, ${co.red})`,width:'100%',height:'100%'}}/>
        <div style={{width:4,height:12,background:t.text,position:'relative',top:-8,left:`${Math.min(tension,100)}%`,borderRadius:2}}/>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:22,border:'1px solid '+t.border,boxShadow:'0 4px 12px rgba(0,0,0,0.01)'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>
          <span>⏰</span> Próximos vencimientos
        </div>
        {proximos.length===0?(
          <div style={{textAlign:'center',padding:'20px 0',color:t.textMuted,fontSize:13}}>¡Todo pagado este mes! 🎉</div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {proximos.map(c=>(
              <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:20}}>{getIcon(c.nombre)}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{c.dias===0?'Vence HOY':c.dias===1?'Vence mañana':`Día ${c.dia} del mes`}</div>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmtFull(c.monto)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// AUXILIARES DE LÓGICA Y MOCK DATA TEMPORAL
// ==========================================
const gastos = [];
function calcTension(compromisos, ingresos, gastado) {
  if (!ingresos) return 0;
  const pendientes = compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalCarga = pendientes + gastado;
  return Math.min(Math.round((totalCarga / ingresos) * 100), TENSION_MAX);
}
function tensionInfo(t) {
  if (t < 40) return { label: 'Zona tranquila', color: co.green, emoji: '🟢' };
  if (t < 75) return { label: 'Zona de cuidado', color: co.yellow, emoji: '🟡' };
  return { label: 'Zona crítica', color: co.red, emoji: '🚨' };
}
function diasHasta(dia) {
  const target = new Date(NOW.getFullYear(), NOW.getMonth(), dia);
  if (target < NOW && dia < NOW.getDate()) target.setMonth(target.getMonth() + 1);
  return Math.ceil((target - NOW) / (1000 * 60 * 60 * 24));
}
function getIcon(n) {
  const l = n.toLowerCase();
  if (l.includes('luz')||l.includes('enel')) return '💡';
  if (l.includes('agua')||l.includes('esval')) return '💧';
  if (l.includes('gas')) return '🔥';
  if (l.includes('dividendo')||l.includes('casa')) return '🏠';
  if (l.includes('celular')||l.includes('entel')||l.includes('movistar')) return '📱';
  return '🏢';
}

// ==========================================
// COMPONENTE PRINCIPAL (EXPORT DEFAULT)
// ==========================================
export default function FaroApp() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('panorama');
  const [data, setData] = useState({
    ingresos: 3200000,
    compromisos: [
      { id: 1, nombre: 'Dividendo', monto: 550000, dia: 5, activo: true, pagado: false },
      { id: 2, nombre: 'Gastos Comunes', monto: 1148896, dia: 10, activo: true, pagado: false },
      { id: 3, nombre: 'Celular', monto: 1120, dia: 12, activo: true, pagado: false },
      { id: 4, nombre: 'Agua', monto: 698781, dia: 22, activo: true, pagado: false }
    ],
    categorias: [],
    boletasGmail: [
      { key: 'agua', nombre: 'Agua', monto: 698781, diaVence: '22' },
      { key: 'entel', nombre: 'Celular (Entel)', monto: 1120, diaVence: '12' },
      { key: 'gastos_comunes', nombre: 'Gastos Comunes', monto: 1148896, diaVence: '10' },
      { key: 'scotiabank', nombre: 'Dividendo', monto: 550000, diaVence: '05' }
    ]
  });

  const t = {
    bg: isDark ? co.bgDark : co.bgLight,
    card: isDark ? co.cardDark : co.cardLight,
    text: isDark ? co.textDark : co.textLight,
    textMuted: isDark ? co.textMutedDark : co.textMutedLight,
    border: isDark ? co.borderDark : co.borderLight,
    t2: isDark ? co.textMutedDark : '#475569',
    t3: isDark ? '#94A3B8' : '#64748B',
    green: co.green
  };

  const handleBoletasConfirmadas = (boletasRestantes) => {
    setData(prev => ({ ...prev, boletasGmail: boletasRestantes }));
  };

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: 80, transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '16px 16px 0 16px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: co.primary, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyOn: 'center', boxShadow: '0 4px 10px rgba(0,95,115,0.2)' }}>
              <span style={{ fontSize: 18, color: '#fff', marginLeft: 8 }}>🔦</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: t.text, letterSpacing: -0.5 }}>FARO</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 0.5 }}>COPILOTO FINANCIERO</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: co.green, color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 99 }}>{data.boletasGmail.length}</span>
            <button onClick={() => setIsDark(!isDark)} style={{ background: t.card, border: '1px solid ' + t.border, borderRadius: 99, width: 44, height: 24, padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyOn: isDark ? 'flex-end' : 'flex-start', transition: 'all 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: isDark ? co.secondary : co.yellow, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, letterSpacing: 0.3 }}>May 2026</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: t.text, marginTop: 4, marginBottom: 24, letterSpacing: -0.5 }}>Hola, Cristian 🔦</div>

        {activeTab === 'panorama' && (
          <PanoramaView data={data} onBoletasConfirmadas={handleBoletasConfirmadas} t={t} isDark={isDark} />
        )}

        {/* Menu de Navegación Fijo */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.card, borderTop: '1px solid ' + t.border, height: 68, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 15px rgba(0,0,0,0.03)', zIndex: 100 }}>
          <button onClick={() => setActiveTab('panorama')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'panorama' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20, opacity: activeTab === 'panorama' ? 1 : 0.6 }}>🔦</span>
            <span style={{ fontSize: 10, fontWeight: 800 }}>Panorama</span>
          </button>
          <button onClick={() => setActiveTab('compromisos')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'compromisos' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20, opacity: activeTab === 'compromisos' ? 1 : 0.6 }}>📋</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>Compromisos</span>
          </button>
          <button onClick={() => setActiveTab('presupuesto')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'presupuesto' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20, opacity: activeTab === 'presupuesto' ? 1 : 0.6 }}>🎯</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>Presupuesto</span>
          </button>
          <button onClick={() => setActiveTab('ajustes')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'ajustes' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20, opacity: activeTab === 'ajustes' ? 1 : 0.6 }}>⚙️</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>Ajustes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
