'use client';
import React, { useState } from 'react';

// ==========================================
// CONFIGURACIONES Y CONSTANTES DE SISTEMA
// ==========================================
const TENSION_MAX = 100;

const EMPRESAS = [
  {key:"enel",           nombre:"Enel (Luz)",          query:"from:enelchile.cl OR from:notificaciones@enel.cl OR from:enel.com"},
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
  {key:"gastos_comunes", nombre:"Gastos Comunes",      query:"subject:(gastos comunes) newer_than:45d"}
];

// Patrones robustos para extraer montos en pesos chilenos
const PATRONES_MONTO = [
  /¿Cuánto debo pagar\??\s*[:\s]*\$\s*([\d.,]+)/i,   // <-- Clave para Enel Chile
  /total a pagar\s*[:\s]*\$\s*([\d.,]+)/i,
  /monto a pagar\s*[:\s]*\$\s*([\d.,]+)/i,
  /valor a pagar\s*[:\s]*\$\s*([\d.,]+)/i,
  /total\s*[:\s]*\$\s*([\d.,]+)/i,
  /importe\s*[:\s]*\$\s*([\d.,]+)/i,
  /\$\s*([\d.,]+)/i
];

const PATRONES_FECHA = [
  /fecha de vencimiento\s*[:\s]*(\d{1,2}[\/\s-]\d{1,2}[\/\s-]\d{2,4})/i,
  /vencimiento\s*[:\s]*(\d{1,2}[\/\s-]\d{1,2}[\/\s-]\d{2,4})/i,
  /vence\s*[:\s]*(\d{1,2}[\/\s-]\d{1,2}[\/\s-]\d{2,4})/i,
  /fecha de pago\s*[:\s]*(\d{1,2}[\/\s-]\d{1,2}[\/\s-]\d{2,4})/i,
  /pagar antes del\s*[:\s]*(\d{1,2}[\/\s-]\d{1,2}[\/\s-]\d{2,4})/i
];

const co = {
  bgLight: '#F4F7F6', bgDark: '#0D1B2A',
  cardLight: '#FFFFFF', cardDark: '#1B263B',
  textLight: '#1E293B', textDark: '#E2E8F0',
  textMutedLight: '#64748B', textMutedDark: '#94A3B8',
  primary: '#005F73', secondary: '#0A9396',
  green: '#2A9D8F', yellow: '#E9C46A', orange: '#F4A261', red: '#E76F51',
  borderLight: '#E2E8F0', borderDark: '#2C3E50'
};

const NOW = new Date(2026, 4, 27); // 27 de Mayo, 2026

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

function extraerMonto(texto) {
  const coincidenciaEnel = texto.match(/¿Cuánto debo pagar\??\s*[:\s]*\$\s*([\d.,]+)/i);
  if (coincidenciaEnel) {
    return parseInt(coincidenciaEnel[1].replace(/[\.$,\s]/g, ""), 10);
  }

  for (const patron of PATRONES_MONTO) {
    const m = texto.match(patron);
    if (m) {
      const num = parseInt(m[1].replace(/[\.$,\s]/g, ""), 10);
      if (num > 500 && num < 10000000) return num;
    }
  }
  return null;
}

function extraerFecha(texto) {
  for (const patron of PATRONES_FECHA) {
    const m = texto.match(patron);
    if (m) {
      const partes = m[1].split(/[\/\s-]/);
      if (partes.length >= 2) {
        let d = parseInt(partes[0], 10);
        let m_idx = parseInt(partes[1], 10) - 1;
        let y = partes.length === 3 ? parseInt(partes[2], 10) : NOW.getFullYear();
        if (y < 100) y += 2000;
        return new Date(y, m_idx, d);
      }
    }
  }
  return null;
}

function GmailSyncBanner({ boletasDetectadas, onConfirmar, onDescartar, t, isDark }) {
  if (!boletasDetectadas?.length) return null;
  return (
    <div style={{background:isDark?"linear-gradient(135deg,#064E3B,#065F46)":"linear-gradient(135deg,#ECFDF5,#D1FAE5)",border:'1px solid '+(t.green)+'44',borderRadius:18,padding:'16px 20px',marginBottom:24,boxShadow:'0 4px 15px rgba(0,0,0,0.05)'}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:24,flexShrink:0}}>📨</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:isDark?"#ECFDF5":"#064E3B",marginBottom:3}}>
            FARO detectó {boletasDetectadas.length} boletas nuevas
          </div>
          <div style={{fontSize:12,color:t.t2}}>Llegaron a tu Gmail. ¿Cargar montos en FARO?</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {boletasDetectadas.map(b=>(
          <div key={b.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",background:isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.6)",borderRadius:10,border:'1px solid '+(isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)')}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:isDark?"#ECFDF5":"#064E3B"}}>{b.nombre}</div>
              {b.fechaVenceReal && (
                <div style={{fontSize:11,color:t.t3}}>Vence el {b.fechaVenceReal.toLocaleDateString('es-CL', {day: 'numeric', month: 'short'})}</div>
              )}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:t.green}}>{fmtFull(b.monto)}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button onClick={onDescartar} style={{padding:"11px",borderRadius:12,background:"transparent",color:t.t2,border:"1px solid "+(t.border),cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13}}>
          Ignorar
        </button>
        <button onClick={() => onConfirmar(boletasDetectadas)} style={{padding:"11px",borderRadius:12,background:`linear-gradient(135deg,${t.green},#047857)`,color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,boxShadow:'0 2px 8px rgba(4,120,87,0.3)'}}>
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
  
  const totalComp = compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalPres = categorias.reduce((s,c)=>s+Number(c.presupuesto||0),0);
  const necesita = totalComp + totalPres;
  
  const compPag = compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalSal = compPag;
  const pctCub = necesita>0 ? Math.min((totalSal/necesita)*100,100) : 0;
  const tension = calcTension(compromisos, ingresos, 0);
  const tInfo = tensionInfo(tension);

  const todosLosVencimientos = compromisos.filter(c=>c.activo&&!c.pagado)
    .map(c=>({ ...c, dias: diasHasta(c.dia, c.fechaVenceReal) }))
    .sort((a,b)=>a.dias-b.dias);

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
            <div style={{fontSize:11,opacity:0.7}}>📦 Compromisos</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtK(totalComp)}</div>
          </div>
          <div>
            <div style={{fontSize:11,opacity:0.7}}>🎯 Presupuesto</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtK(totalPres)}</div>
          </div>
        </div>
      </div>

      <div style={{background:t.card,borderRadius:20,padding:20,marginBottom:24,border:'1px solid '+t.border,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:t.text}}>Índice de tensión</div>
          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{tInfo.emoji} {tInfo.label}</div>
        </div>
        <div style={{width:54,height:54,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'99%',border:`3px solid ${tInfo.color}`,fontSize:16,fontWeight:900,color:tInfo.color}}>
          {tension}
        </div>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:22,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>⏰ Próximos vencimientos</div>
        {todosLosVencimientos.length === 0 ? (
          <div style={{fontSize:13,color:t.textMuted,textAlign:'center',padding:'10px 0'}}>¡No quedan vencimientos pendientes! 🎉</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {todosLosVencimientos.map(c=>{
              const textoDias = c.dias === 0 ? "Vence hoy 🚨" : c.dias < 0 ? `Venció hace ${Math.abs(c.dias)} días ⚠️` : `En ${c.dias} días`;
              return (
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:20}}>{getIcon(c.nombre)}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
                      <div style={{fontSize:11,color:c.dias <= 2 ? co.red : t.textMuted, fontWeight: c.dias <= 2 ? '700' : '500'}}>{textoDias} ({c.fechaVenceReal ? c.fechaVenceReal.toLocaleDateString('es-CL', {day:'numeric', month:'short'}) : `Día ${c.dia}`})</div>
                    </div>
                  </div>
                  <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmtFull(c.monto)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CompromisosView({ data, onTogglePago, onUpdateMonto, onUpdateIngresos, t }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>
      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:12}}>💰 Ingresos del Mes</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:13,color:t.textMuted}}>Sueldo disponible / Fondos</div>
          <input 
            type="number" 
            value={data.ingresos} 
            onChange={(e) => onUpdateIngresos(e.target.value)}
            style={{width:120,padding:'8px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontWeight:'800',textAlign:'right',fontSize:14}}
          />
        </div>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>📦 Tus Compromisos Mensuales</div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {data.compromisos.map(c => (
            <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:12,borderBottom:'1px solid '+t.border}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:t.text,textDecoration:c.pagado?'line-through':'none',opacity:c.pagado?0.5:1}}>{c.nombre}</div>
                <div style={{fontSize:11,color:t.textMuted}}>
                  {c.fechaVenceReal ? `Vence el ${c.fechaVenceReal.toLocaleDateString('es-CL')}` : `Día ${c.dia} de cada mes`}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input 
                  type="number" 
                  value={c.monto} 
                  onChange={(e) => onUpdateMonto(c.id, e.target.value)}
                  style={{width:90,padding:'6px 8px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:t.text,fontWeight:'700',textAlign:'right'}}
                />
                <button onClick={() => onTogglePago(c.id)} style={{background:c.pagado?co.green:'transparent',color:c.pagado?'#fff':t.text,border:'1px solid '+(c.pagado?co.green:t.border),padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:'700'}}>
                  {c.pagado?'✓ Pagado':'Pagar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PresupuestoView({ data, t }) {
  return (
    <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border,textAlign:'center'}}>
      <span style={{fontSize:32}}>🎯</span>
      <div style={{fontSize:16,fontWeight:800,color:t.text,marginTop:10,marginBottom:6}}>Categorías de Presupuesto</div>
      <div style={{fontSize:13,color:t.textMuted,padding:'10px 20px'}}>Aquí podrás definir topes de gasto mensual para Supermercado, Bencina, Salidas, etc.</div>
      <div style={{fontSize:12,fontWeight:700,color:co.secondary,marginTop:12}}>PROXIMAMENTE EN VERSIÓN BETA</div>
    </div>
  );
}

function AjustesView({ t }) {
  return (
    <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
      <div style={{fontSize:16,fontWeight:800,color:t.text,marginBottom:16}}>⚙️ Configuración del Sistema</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid '+t.border}}>
        <div style={{fontSize:14,color:t.text,fontWeight:600}}>Sincronización Gmail activa</div>
        <div style={{color:co.green,fontWeight:'800',fontSize:13}}>✓ Conectado</div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}>
        <div style={{fontSize:14,color:t.text,fontWeight:600}}>Moneda base</div>
        <div style={{color:t.textMuted,fontWeight:'700',fontSize:13}}>CLP ($)</div>
      </div>
    </div>
  );
}

function calcTension(compromisos, ingresos, gastado) {
  if (!ingresos) return 0;
  const pendientes = compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  return Math.min(Math.round(((pendientes + gastado) / ingresos) * 100), TENSION_MAX);
}
function tensionInfo(t) {
  if (t < 40) return { label: 'Zona tranquila', color: co.green, emoji: '🟢' };
  if (t < 75) return { label: 'Zona de cuidado', color: co.yellow, emoji: '🟡' };
  return { label: 'Zona crítica', color: co.red, emoji: '🚨' };
}

function diasHasta(diaDefecto, fechaReal) {
  let target;
  if (fechaReal) {
    target = new Date(fechaReal);
  } else {
    target = new Date(NOW.getFullYear(), NOW.getMonth(), diaDefecto);
    if (target < NOW && diaDefecto < NOW.getDate()) target.setMonth(target.getMonth() + 1);
  }
  const d1 = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const d2 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffTime = d2 - d1;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getIcon(n) {
  const l = n.toLowerCase();
  if (l.includes('luz')||l.includes('enel')) return '💡';
  if (l.includes('agua')||l.includes('esval')) return '💧';
  if (l.includes('gas')) return '🔥';
  if (l.includes('dividendo')) return '🏠';
  if (l.includes('celular')||l.includes('wom')||l.includes('entel')||l.includes('movistar')||l.includes('claro')) return '📱';
  return '📋';
}

// ==========================================
// COMPONENTE PRINCIPAL (FARO-APP)
// ==========================================
export default function FaroApp() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('panorama');
  const [data, setData] = useState({
    ingresos: 3200000,
    compromisos: [
      { id: 1, nombre: 'Dividendo', monto: 550000, dia: 5, fechaVenceReal: new Date(2026, 5, 5), activo: true, pagado: false },
      { id: 2, nombre: 'Gastos Comunes', monto: 1148896, dia: 10, fechaVenceReal: new Date(2026, 5, 10), activo: true, pagado: false },
      { id: 3, nombre: 'Celular', monto: 12990, dia: 12, fechaVenceReal: new Date(2026, 5, 12), activo: true, pagado: false },
      { id: 4, nombre: 'Agua', monto: 698781, dia: 22, fechaVenceReal: new Date(2026, 5, 22), activo: true, pagado: false },
      { id: 5, nombre: 'Enel (Luz)', monto: 0, dia: 8, fechaVenceReal: new Date(2026, 5, 8), activo: true, pagado: false } 
    ],
    categorias: [],
    boletasGmail: [
      { key: 'enel', nombre: 'Enel (Luz)', monto: 663141, fechaVenceReal: new Date(2026, 5, 8) }, 
      { key: 'agua', nombre: 'Agua', monto: 698781, fechaVenceReal: new Date(2026, 5, 22) },
      { key: 'gastos_comunes', nombre: 'Gastos Comunes', monto: 1148896, fechaVenceReal: new Date(2026, 5, 10) },
      { key: 'scotiabank', nombre: 'Dividendo', monto: 550000, fechaVenceReal: new Date(2026, 5, 5) }
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

  const handleBoletasConfirmadas = (boletasAProcesar) => {
    setData(prev => {
      if (boletasAProcesar.length === 0) return { ...prev, boletasGmail: [] };

      const compromisosActualizados = prev.compromisos.map(comp => {
        const boletaDetectada = boletasAProcesar.find(b => 
          (b.nombre.toLowerCase().includes("enel") && comp.nombre.toLowerCase().includes("enel")) ||
          b.nombre.toLowerCase().includes(comp.nombre.toLowerCase()) || 
          comp.nombre.toLowerCase().includes(b.nombre.toLowerCase())
        );
        if (boletaDetectada) {
          return { 
            ...comp, 
            monto: boletaDetectada.monto, 
            fechaVenceReal: boletaDetectada.fechaVenceReal, 
            dia: boletaDetectada.fechaVenceReal.getDate() 
          };
        }
        return comp;
      });

      return {
        ...prev,
        compromisos: compromisosActualizados,
        boletasGmail: []
      };
    });
  };

  const handleTogglePago = (id) => {
    setData(prev => ({
      ...prev,
      compromisos: prev.compromisos.map(c => c.id === id ? { ...c, pagado: !c.pagado } : c)
    }));
  };

  const handleUpdateMonto = (id, nuevoMonto) => {
    setData(prev => ({
      ...prev,
      compromisos: prev.compromisos.map(c => c.id === id ? { ...c, monto: Number(nuevoMonto) } : c)
    }));
  };

  const handleUpdateIngresos = (nuevoIngreso) => {
    setData(prev => ({
      ...prev,
      ingresos: Number(nuevoIngreso)
    }));
  };

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: 80, transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '16px 16px 0 16px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: co.primary, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, color: '#fff' }}>🔦</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: t.text, letterSpacing: -0.5 }}>FARO</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 0.5 }}>COPILOTO FINANCIERO</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {data.boletasGmail.length > 0 && (
              <span style={{ background: co.green, color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 99 }}>{data.boletasGmail.length}</span>
            )}
            <button onClick={() => setIsDark(!isDark)} style={{ background: t.card, border: '1px solid ' + t.border, borderRadius: 99, width: 44, height: 24, padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isDark ? 'flex-end' : 'flex-start', transition: 'all 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: isDark ? co.secondary : co.yellow }} />
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
          {NOW.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: t.text, marginTop: 4, marginBottom: 24, letterSpacing: -0.5 }}>Hola, Cristian 🔦</div>

        {/* Renderizado Condicional */}
        {activeTab === 'panorama' && (
          <PanoramaView data={data} onBoletasConfirmadas={handleBoletasConfirmadas} t={t} isDark={isDark} />
        )}
        {activeTab === 'compromisos' && (
          <CompromisosView data={data} onTogglePago={handleTogglePago} onUpdateMonto={handleUpdateMonto} onUpdateIngresos={handleUpdateIngresos} t={t} />
        )}
        {activeTab === 'presupuesto' && (
          <PresupuestoView data={data} t={t} />
        )}
        {activeTab === 'ajustes' && (
          <AjustesView t={t} />
        )}

        {/* Menú inferior */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.card, borderTop: '1px solid ' + t.border, height: 68, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100 }}>
          <button onClick={() => setActiveTab('panorama')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'panorama' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20 }}>🔦</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === 'panorama' ? '800' : '500' }}>Panorama</span>
          </button>
          <button onClick={() => setActiveTab('compromisos')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'compromisos' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === 'compromisos' ? '800' : '500' }}>Compromisos</span>
          </button>
          <button onClick={() => setActiveTab('presupuesto')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'presupuesto' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === 'presupuesto' ? '800' : '500' }}>Presupuesto</span>
          </button>
          <button onClick={() => setActiveTab('ajustes')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: activeTab === 'ajustes' ? co.primary : t.textMuted }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === 'ajustes' ? '800' : '500' }}>Ajustes</span>
          </button>
        </div>

      </div>
    </div>
  );
}
