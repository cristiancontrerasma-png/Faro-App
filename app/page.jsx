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

const PATRONES_MONTO = [
  /¿Cuánto debo pagar\??\s*[:\s]*\$\s*([\d.,]+)/i,   
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

// ==========================================
// VISTA: COMPROMISOS (CON FORMULARIO DE ALTA MANUAl)
// ==========================================
function CompromisosView({ data, onTogglePago, onUpdateMonto, onUpdateIngresos, onAddCompromiso, t }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevoDia, setNuevoDia] = useState('10');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoMonto) return;
    onAddCompromiso(nuevoNombre, nuevoMonto, nuevoDia);
    setNuevoNombre('');
    setNuevoMonto('');
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>
      {/* Ingresos / Sueldo */}
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

      {/* Formulario para agregar Nuevo Gasto / Cuenta de forma manual (+ / -) */}
      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>➕ Añadir Nuevo Gasto / Cuenta</div>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:10}}>
            <input 
              type="text" 
              placeholder="Ej: Internet, Netflix..." 
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={{padding:'10px', borderRadius:10, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:13}}
            />
            <input 
              type="number" 
              placeholder="Monto ($)" 
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              style={{padding:'10px', borderRadius:10, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:13, fontWeight:'600'}}
            />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <span style={{fontSize:12, color:t.textMuted}}>Vence día:</span>
              <input 
                type="number" 
                min="1" max="31"
                value={nuevoDia}
                onChange={(e) => setNuevoDia(e.target.value)}
                style={{width:55, padding:'8px
