'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// FARO v4.0 — Sistema Operativo Financiero
// Simple · Seguro · Inteligente
// ═══════════════════════════════════════════════════════════════

// ── SUPABASE (sync entre dispositivos) ──
const SB_URL = "https://tiayaaxtiyqobmhojhgm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
const SB_HDR = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const FINTOC_PK = "pk_test_2AkTwWsyF3U9KcstazbQsyh6EDs3g2-ye_yy6DMa25x";

// ── STORAGE: localStorage + Supabase sync ──
const S = {
  get: (k, d) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── COLORES ──
const co = {
  bgLight: '#F4F7F6', bgDark: '#0D1B2A',
  cardLight: '#FFFFFF', cardDark: '#1B263B',
  textLight: '#1E293B', textDark: '#E2E8F0',
  mutedLight: '#64748B', mutedDark: '#94A3B8',
  primary: '#005F73', secondary: '#0A9396',
  green: '#2A9D8F', yellow: '#E9C46A', orange: '#F4A261', red: '#E76F51',
  borderLight: '#E2E8F0', borderDark: '#2C3E50',
};

// ── DATOS POR DEFECTO ──
const COMP_DEF = [
  { id:1, nombre:'Dividendo',      monto:550000,  dia:5,  banco:'Scotiabank',    pagado:false, activo:true, gmailKey:'scotiabank',     tipo:'fijo', fechaPago:null },
  { id:2, nombre:'Gastos Comunes', monto:1148896, dia:10, banco:'',              pagado:false, activo:true, gmailKey:'gastos_comunes', tipo:'fijo', fechaPago:null },
  { id:3, nombre:'Celular',        monto:12990,   dia:28, banco:'Entel',         pagado:false, activo:true, gmailKey:'entel',          tipo:'fijo', fechaPago:null },
  { id:4, nombre:'Agua',           monto:698781,  dia:22, banco:'Aguas Andinas', pagado:false, activo:true, gmailKey:'aguas_andinas',  tipo:'fijo', fechaPago:null },
  { id:5, nombre:'Luz',            monto:663141,  dia:8,  banco:'Enel',          pagado:false, activo:true, gmailKey:'enel',           tipo:'fijo', fechaPago:null },
  { id:6, nombre:'Gas',            monto:0,       dia:18, banco:'Metrogas',      pagado:false, activo:true, gmailKey:'metrogas',       tipo:'fijo', fechaPago:null },
  { id:7, nombre:'Internet/TV',    monto:0,       dia:15, banco:'VTR',           pagado:false, activo:true, gmailKey:'vtr',            tipo:'fijo', fechaPago:null },
];

const CATS_DEF = [
  {id:'bencina',    nombre:'Bencina',      icon:'⛽', color:'#3B82F6'},
  {id:'comida',     nombre:'Comida',       icon:'🍽️', color:'#F59E0B'},
  {id:'cafe',       nombre:'Café',         icon:'☕', color:'#D97706'},
  {id:'super',      nombre:'Supermercado', icon:'🛒', color:'#10B981'},
  {id:'deporte',    nombre:'Deporte',      icon:'🏋️', color:'#8B5CF6'},
  {id:'ahorro',     nombre:'Ahorro',       icon:'💰', color:'#059669'},
  {id:'shopping',   nombre:'Shopping',     icon:'🛍️', color:'#EC4899'},
  {id:'farmacia',   nombre:'Farmacia',     icon:'💊', color:'#7C3AED'},
  {id:'entretenim', nombre:'Entretención', icon:'🎬', color:'#EF4444'},
  {id:'sueldo',     nombre:'Sueldo',       icon:'💼', color:'#005F73'},
  {id:'comision',   nombre:'Comisión',     icon:'🏆', color:'#F59E0B'},
  {id:'otros',      nombre:'Otros',        icon:'📦', color:'#94A3B8'},
];

const BANCOS_FINTOC = [
  { id:'cl_banco_de_chile', nombre:'Banco de Chile',  icon:'🔴', color:'#CC0000' },
  { id:'cl_santander',      nombre:'Santander',        icon:'🔴', color:'#EC0000' },
  { id:'cl_banco_estado',   nombre:'BancoEstado',      icon:'🟦', color:'#003087' },
  { id:'cl_bci',            nombre:'BCI',              icon:'🔵', color:'#0033A0' },
  { id:'cl_scotiabank',     nombre:'Scotiabank',       icon:'🟠', color:'#FF3300' },
  { id:'cl_itau',           nombre:'Itaú',             icon:'🟡', color:'#EC7000' },
  { id:'cl_bice',           nombre:'Banco BICE',       icon:'🔵', color:'#003DA5' },
  { id:'cl_security',       nombre:'Banco Security',   icon:'🟢', color:'#00853F' },
  { id:'cl_falabella',      nombre:'Banco Falabella',  icon:'🩷', color:'#E31837' },
];

// ── UTILS ──
const fmt = v => v ? '$' + Math.round(Math.abs(Number(v))).toLocaleString('es-CL') : '$0';
const NOW = new Date();
const MES = NOW.getMonth();
const AÑO = NOW.getFullYear();
const MESES_NOM = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_MES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function diasHasta(dia) {
  const v = new Date(AÑO, MES, dia);
  if (v < NOW) v.setMonth(v.getMonth() + 1);
  return Math.ceil((v - NOW) / 864e5);
}
function getIcon(n) {
  const l = n.toLowerCase();
  if (l.includes('gastos comunes')) return '🏢';
  if (l.includes('luz') || l.includes('enel')) return '💡';
  if (l.includes('agua')) return '💧';
  if (l.includes('gas') && !l.includes('gastos')) return '🔥';
  if (l.includes('dividendo')) return '🏠';
  if (l.includes('celular') || l.includes('entel')) return '📱';
  if (l.includes('internet') || l.includes('tv') || l.includes('vtr')) return '📡';
  return '📋';
}
function calcScore(data) {
  const { ingresos, compromisos, gastos } = data;
  if (!ingresos) return 0;
  const mesG = gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth() === MES && d.getFullYear() === AÑO; });
  const totalComp = compromisos.filter(c => c.activo).reduce((s, c) => s + Number(c.monto || 0), 0);
  const totalGast = mesG.filter(g => g.tipo === 'gasto').reduce((s, g) => s + g.monto, 0);
  const pagados = compromisos.filter(c => c.pagado).length;
  const totalComp2 = compromisos.filter(c => c.activo).length;
  const ratio = (totalComp + totalGast) / ingresos;
  let score = 100;
  if (ratio > 0.9) score -= 40;
  else if (ratio > 0.7) score -= 20;
  else if (ratio > 0.5) score -= 10;
  if (totalComp2 > 0) score += Math.round((pagados / totalComp2) * 15);
  if (data.fondoEmergencia > 0 && data.fondoActual >= data.fondoEmergencia * 0.5) score += 10;
  if (data.metaAhorro > 0) score += 5;
  return Math.min(100, Math.max(0, score));
}
function scoreColor(s) {
  if (s >= 80) return co.green;
  if (s >= 60) return co.yellow;
  if (s >= 40) return co.orange;
  return co.red;
}
function scoreLabel(s) {
  if (s >= 80) return 'Excelente 💚';
  if (s >= 60) return 'Bueno 💛';
  if (s >= 40) return 'Regular 🟠';
  return 'Crítico 🔴';
}

// ── BANNER GMAIL ──
function GmailBanner({ boletas, onConfirmar, onDescartar, t }) {
  if (!boletas?.length) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1px solid ' + co.green + '44', borderRadius: 18, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>📨</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#064E3B' }}>FARO detectó {boletas.length} boleta{boletas.length > 1 ? 's' : ''} nueva{boletas.length > 1 ? 's' : ''}</div>
          <div style={{ fontSize: 12, color: t.muted }}>¿Cargar montos en FARO?</div>
        </div>
      </div>
      {boletas.map(b => (
        <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 10, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#064E3B' }}>{b.nombre}</div>
            {b.diaVence && <div style={{ fontSize: 11, color: co.green }}>📅 Vence día {b.diaVence}</div>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: co.green }}>{fmt(b.monto)}</div>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <button onClick={onDescartar} style={{ padding: 10, borderRadius: 10, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Ignorar</button>
        <button onClick={() => onConfirmar(boletas)} style={{ padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,' + co.green + ',#047857)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>✓ Cargar en FARO</button>
      </div>
    </div>
  );
}

// ── PANORAMA ──
function PanoramaView({ data, setData, onConfirmarBoletas, t }) {
  const [showComprar, setShowComprar] = useState(false);
  const { ingresos, compromisos, gastos, boletasGmail, historial, fondoActual, fondoEmergencia } = data;
  const mesG = gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth() === MES && d.getFullYear() === AÑO; });
  const egreso = mesG.filter(g => g.tipo === 'gasto').reduce((s, g) => s + g.monto, 0);
  const ingAd = mesG.filter(g => g.tipo === 'ingreso').reduce((s, g) => s + g.monto, 0);
  const ingTotal = ingresos + ingAd;
  const totalComp = compromisos.filter(c => c.activo).reduce((s, c) => s + Number(c.monto || 0), 0);
  const compPag = compromisos.filter(c => c.pagado).reduce((s, c) => s + Number(c.monto || 0), 0);
  const disponible = ingTotal - compPag - egreso - (totalComp - compPag);
  const pctCub = totalComp > 0 ? Math.min((compPag / totalComp) * 100, 100) : 0;
  const score = calcScore(data);

  // Comparador de meses
  const mesAnterior = historial?.find(h => {
    const d = new Date(AÑO, MES - 1, 1);
    return h.mes === d.getMonth() && h.año === d.getFullYear();
  });
  const diffMes = mesAnterior ? Math.round(((egreso - mesAnterior.totalGast) / Math.max(mesAnterior.totalGast, 1)) * 100) : null;

  // Predictor de crisis
  const diasTranscurridos = NOW.getDate();
  const diasDelMes = new Date(AÑO, MES + 1, 0).getDate();
  const gastosDiarios = diasTranscurridos > 0 ? egreso / diasTranscurridos : 0;
  const proyeccionMes = gastosDiarios * diasDelMes;
  const crisis = (proyeccionMes + (totalComp - compPag)) > ingTotal;

  const proximos = compromisos.filter(c => c.activo && !c.pagado && c.monto > 0).map(c => ({ ...c, dias: diasHasta(c.dia) })).sort((a, b) => a.dias - b.dias).slice(0, 5);

  return (
    <div>
      <GmailBanner boletas={boletasGmail} onConfirmar={onConfirmarBoletas} onDescartar={() => onConfirmarBoletas([])} t={t} />

      {/* Score + Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0A3A60,#005F73)', borderRadius: 24, padding: 22, color: '#fff', marginBottom: 16, boxShadow: '0 10px 25px rgba(0,95,115,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>ESTE MES NECESITAS</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }}>{fmt(totalComp)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid ' + scoreColor(score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: scoreColor(score), background: 'rgba(255,255,255,0.1)' }}>{score}</div>
            <div style={{ fontSize: 9, opacity: 0.7, marginTop: 3 }}>SCORE</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ background: '#fff', width: `${pctCub}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.8, marginBottom: 16 }}>
          <span>Pagado: {fmt(compPag)} ({Math.round(pctCub)}%)</span>
          <span>Quedan {fmt(totalComp - compPag)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14 }}>
          {[
            ['💼 Ingresos', fmt(ingTotal), '#fff'],
            [disponible >= 0 ? '💚 Disponible' : '🔴 Faltan', fmt(Math.abs(disponible)), disponible >= 0 ? '#A7F3D0' : '#FCA5A5'],
            ['💸 Gastado', fmt(egreso), '#FCA5A5'],
          ].map(([l, v, c]) => (
            <div key={l}><div style={{ fontSize: 9, opacity: 0.65, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* Predictor de crisis */}
      {crisis && (
        <div style={{ background: 'rgba(231,111,81,0.1)', border: '1px solid ' + co.red + '44', borderRadius: 16, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: co.red }}>FARO detecta riesgo de queda</div>
            <div style={{ fontSize: 11, color: t.muted }}>Con tu ritmo actual, proyectas {fmt(proyeccionMes)} en gastos este mes. Revisa tus compromisos pendientes.</div>
          </div>
        </div>
      )}

      {/* Comparador de meses */}
      {diffMes !== null && (
        <div style={{ background: t.card, borderRadius: 16, padding: '12px 16px', marginBottom: 14, border: '1px solid ' + t.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>vs {MESES_NOM[MES > 0 ? MES - 1 : 11]}</div>
            <div style={{ fontSize: 11, color: t.muted }}>Comparado con el mes anterior</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: diffMes > 0 ? co.red : co.green }}>
            {diffMes > 0 ? '↑' : '↓'} {Math.abs(diffMes)}%
          </div>
        </div>
      )}

      {/* ¿Puedo comprar esto? */}
      <button onClick={() => setShowComprar(true)} style={{ width: '100%', padding: '13px', borderRadius: 14, background: co.primary + '12', color: co.primary, border: '2px solid ' + co.primary + '33', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
        🤔 ¿Puedo comprar esto?
      </button>

      {/* Próximos vencimientos */}
      {proximos.length > 0 && (
        <div style={{ background: t.card, borderRadius: 20, padding: 20, border: '1px solid ' + t.border }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 14 }}>⏰ Próximos vencimientos</div>
          {proximos.map((c, i) => {
            const urg = c.dias <= 3, prox = c.dias <= 7;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: i < proximos.length - 1 ? '1px solid ' + t.border : 'none', marginBottom: i < proximos.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{getIcon(c.nombre)}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: urg ? co.red : prox ? co.orange : t.muted, fontWeight: urg || prox ? 700 : 400 }}>
                      {urg ? `🚨 Vence en ${c.dias}d` : prox ? `⏰ ${c.dias} días` : `Día ${c.dia} del mes`}{c.banco ? ' · ' + c.banco : ''}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{fmt(c.monto)}</div>
              </div>
            );
          })}
        </div>
      )}

      {showComprar && <ModalPuedoComprarlo data={data} t={t} onClose={() => setShowComprar(false)} />}
    </div>
  );
}

// ── COMPROMISOS ──
function CompromisosView({ data, setData, t }) {
  const [confirmar, setConfirmar] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCuota, setShowAddCuota] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', monto: '', dia: '10', banco: '' });
  const [nuevaCuota, setNuevaCuota] = useState({ nombre: '', montoTotal: '', numCuotas: '12', cuotasPagadas: 0, dia: '10', banco: '' });
  const [editSueldo, setEditSueldo] = useState(false);
  const [valSueldo, setValSueldo] = useState('');

  const upd = (id, p) => setData(d => ({ ...d, compromisos: d.compromisos.map(c => c.id === id ? { ...c, ...p } : c) }));
  const del = id => { if (window.confirm('¿Eliminar este compromiso?')) setData(d => ({ ...d, compromisos: d.compromisos.filter(c => c.id !== id) })); };

  const confirmarPago = (c) => {
    const fecha = new Date().toISOString().split('T')[0];
    upd(c.id, { pagado: !c.pagado, fechaPago: !c.pagado ? fecha : null });
    setConfirmar(null);
  };

  const addNormal = () => {
    if (!nuevo.nombre || !nuevo.monto) return;
    const id = Math.max(0, ...data.compromisos.map(c => c.id)) + 1;
    setData(d => ({ ...d, compromisos: [...d.compromisos, { id, ...nuevo, monto: Number(nuevo.monto), dia: Number(nuevo.dia), pagado: false, activo: true, gmailKey: '', tipo: 'fijo', fechaPago: null }] }));
    setNuevo({ nombre: '', monto: '', dia: '10', banco: '' }); setShowAdd(false);
  };

  const addCuota = () => {
    if (!nuevaCuota.nombre || !nuevaCuota.montoTotal) return;
    const id = Math.max(0, ...data.compromisos.map(c => c.id)) + 1;
    const cuotaMensual = Math.round(Number(nuevaCuota.montoTotal) / Number(nuevaCuota.numCuotas));
    setData(d => ({ ...d, compromisos: [...d.compromisos, { id, nombre: nuevaCuota.nombre, monto: cuotaMensual, montoTotal: Number(nuevaCuota.montoTotal), numCuotas: Number(nuevaCuota.numCuotas), cuotasPagadas: 0, dia: Number(nuevaCuota.dia), banco: nuevaCuota.banco, pagado: false, activo: true, gmailKey: '', tipo: 'cuotas', fechaPago: null }] }));
    setNuevaCuota({ nombre: '', montoTotal: '', numCuotas: '12', cuotasPagadas: 0, dia: '10', banco: '' }); setShowAddCuota(false);
  };

  const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid ' + t.border, background: t.bg, color: t.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const totalMes = data.compromisos.filter(c => c.activo).reduce((s, c) => s + Number(c.monto || 0), 0);
  const pagados = data.compromisos.filter(c => c.pagado).reduce((s, c) => s + Number(c.monto || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Ingresos */}
      <div style={{ background: t.card, borderRadius: 20, padding: 18, border: '1px solid ' + t.border }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 12 }}>💰 Ingresos del Mes</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: t.muted }}>Sueldo base</div>
          {editSueldo ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={valSueldo} onChange={e => setValSueldo(e.target.value)} autoFocus style={{ width: 130, ...inp, padding: '7px 10px' }} />
              <button onClick={() => { setData(d => ({ ...d, ingresos: Number(valSueldo) || 0 })); setEditSueldo(false); }} style={{ padding: '7px 14px', borderRadius: 9, background: co.green, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>OK</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{fmt(data.ingresos)}</span>
              <button onClick={() => { setValSueldo(data.ingresos || ''); setEditSueldo(true); }} style={{ padding: '5px 11px', borderRadius: 8, background: 'transparent', color: co.primary, border: '1px solid ' + co.primary, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Modificar</button>
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[['Total', totalMes, t.text], ['Pagado', pagados, co.green], ['Pendiente', totalMes - pagados, co.red]].map(([l, v, c]) => (
          <div key={l} style={{ background: t.card, borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: '1px solid ' + t.border }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Botones agregar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '11px', borderRadius: 12, background: co.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Cuenta fija</button>
        <button onClick={() => setShowAddCuota(!showAddCuota)} style={{ padding: '11px', borderRadius: 12, background: 'transparent', color: co.primary, border: '2px solid ' + co.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>📅 En cuotas</button>
      </div>

      {/* Form cuenta normal */}
      {showAdd && (
        <div style={{ background: t.card, borderRadius: 16, padding: 16, border: '1px dashed ' + co.primary + '55' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>Nueva cuenta fija</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Nombre (ej: Netflix, Seguro...)" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="number" placeholder="Monto ($)" value={nuevo.monto} onChange={e => setNuevo(p => ({ ...p, monto: e.target.value }))} style={inp} />
              <input type="number" min="1" max="31" placeholder="Día vence" value={nuevo.dia} onChange={e => setNuevo(p => ({ ...p, dia: e.target.value }))} style={inp} />
            </div>
            <input placeholder="Institución (ej: Banco, Empresa)" value={nuevo.banco} onChange={e => setNuevo(p => ({ ...p, banco: e.target.value }))} style={inp} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addNormal} style={{ flex: 1, padding: '10px', borderRadius: 10, background: co.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Agregar</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Form cuotas */}
      {showAddCuota && (
        <div style={{ background: t.card, borderRadius: 16, padding: 16, border: '1px dashed ' + co.orange + '55' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>💳 Nuevo préstamo / cuotas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Nombre (ej: Préstamo Juan, Crédito BCI...)" value={nuevaCuota.nombre} onChange={e => setNuevaCuota(p => ({ ...p, nombre: e.target.value }))} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="number" placeholder="Monto total ($)" value={nuevaCuota.montoTotal} onChange={e => setNuevaCuota(p => ({ ...p, montoTotal: e.target.value }))} style={inp} />
              <input type="number" placeholder="Nº cuotas" value={nuevaCuota.numCuotas} onChange={e => setNuevaCuota(p => ({ ...p, numCuotas: e.target.value }))} style={inp} />
            </div>
            {nuevaCuota.montoTotal && nuevaCuota.numCuotas && (
              <div style={{ padding: '8px 12px', background: co.primary + '12', borderRadius: 10, fontSize: 13, color: co.primary, fontWeight: 700 }}>
                Cuota mensual: {fmt(Math.round(Number(nuevaCuota.montoTotal) / Number(nuevaCuota.numCuotas)))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="number" min="1" max="31" placeholder="Día de pago" value={nuevaCuota.dia} onChange={e => setNuevaCuota(p => ({ ...p, dia: e.target.value }))} style={inp} />
              <input placeholder="Acreedor" value={nuevaCuota.banco} onChange={e => setNuevaCuota(p => ({ ...p, banco: e.target.value }))} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addCuota} style={{ flex: 1, padding: '10px', borderRadius: 10, background: co.orange, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Agregar cuotas</button>
              <button onClick={() => setShowAddCuota(false)} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista compromisos */}
      <div style={{ background: t.card, borderRadius: 20, padding: 18, border: '1px solid ' + t.border }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>📋 Tus Compromisos</div>
        {data.compromisos.map((c, i) => {
          const isEdit = editId === c.id;
          const esCuota = c.tipo === 'cuotas';
          const pctCuota = esCuota ? Math.round((c.cuotasPagadas / c.numCuotas) * 100) : 0;
          return (
            <div key={c.id} style={{ paddingBottom: 14, borderBottom: i < data.compromisos.length - 1 ? '1px solid ' + t.border : 'none', marginBottom: i < data.compromisos.length - 1 ? 14 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 22 }}>{esCuota ? '💳' : getIcon(c.nombre)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text, textDecoration: c.pagado ? 'line-through' : 'none', opacity: c.pagado ? 0.6 : 1 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>
                      {esCuota ? `Cuota ${c.cuotasPagadas + 1} de ${c.numCuotas}` : (c.banco ? c.banco + ' · ' : '')}Día {c.dia} · {diasHasta(c.dia)}d
                    </div>
                    {esCuota && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ height: 3, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctCuota}%`, background: co.green, borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{pctCuota}% pagado · Quedan {fmt((c.numCuotas - c.cuotasPagadas) * c.monto)}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c.pagado ? co.green : t.text }}>{fmt(c.monto)}</div>
                  {c.pagado && c.fechaPago && <div style={{ fontSize: 9, color: co.green }}>Pagado {c.fechaPago}</div>}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => setConfirmar(c)} style={{ background: c.pagado ? co.green : 'transparent', color: c.pagado ? '#fff' : t.text, border: '1px solid ' + (c.pagado ? co.green : t.border), padding: '4px 9px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                      {c.pagado ? '✓ Pag.' : 'Pagar'}
                    </button>
                    <button onClick={() => setEditId(isEdit ? null : c.id)} style={{ background: 'transparent', color: t.muted, border: '1px solid ' + t.border, padding: '4px 7px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                    <button onClick={() => del(c.id)} style={{ background: 'transparent', color: co.red, border: '1px solid ' + co.red + '33', padding: '4px 7px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              </div>
              {isEdit && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 3 }}>MONTO ($)</div>
                    <input type="number" value={c.monto || ''} onChange={e => upd(c.id, { monto: Number(e.target.value) || 0 })} style={inp} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 3 }}>DÍA VENCE</div>
                    <input type="number" min="1" max="31" value={c.dia} onChange={e => upd(c.id, { dia: Number(e.target.value) })} style={inp} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 3 }}>BANCO / INSTITUCIÓN</div>
                    <input value={c.banco || ''} onChange={e => upd(c.id, { banco: e.target.value })} style={inp} />
                  </div>
                  <button onClick={() => setEditId(null)} style={{ gridColumn: '1/-1', padding: '9px', borderRadius: 9, background: co.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>✓ Guardar</button>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={() => setData(d => ({ ...d, compromisos: d.compromisos.map(c => ({ ...c, pagado: false, fechaPago: null })) }))}
          style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 12, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
          🔄 Nuevo mes — reiniciar pagados
        </button>
      </div>

      {/* Modal confirmar pago */}
      {confirmar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: t.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 8 }}>
              {confirmar.pagado ? '↩️ Desmarcar pago' : '✅ Confirmar pago'}
            </div>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>
              {confirmar.pagado ? 'Desmarcar' : 'Marcar como pagado'} <strong>{confirmar.nombre}</strong> por <strong>{fmt(confirmar.monto)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setConfirmar(null)} style={{ padding: '12px', borderRadius: 12, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancelar</button>
              <button onClick={() => confirmarPago(confirmar)} style={{ padding: '12px', borderRadius: 12, background: confirmar.pagado ? co.orange : co.green, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                {confirmar.pagado ? 'Desmarcar' : '✓ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GASTOS ──
function GastosView({ data, setData, t, isDark }) {
  const [modal, setModal] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [nuevaCat, setNuevaCat] = useState('');
  const [iconSel, setIconSel] = useState('📦');
  const [colorSel, setColorSel] = useState('#94A3B8');
  const [expandCat, setExpandCat] = useState(null);
  const [filtro, setFiltro] = useState('todo');
  const fotoRef = useRef();

  const ICONOS = ['🛒','🍽️','☕','⛽','🏋️','💰','🛍️','💊','🎬','📦','🚗','✈️','🎮','💼','🏆','🐾','💇','📚','🍺','🎁'];
  const COLORES = ['#3B82F6','#F59E0B','#D97706','#10B981','#8B5CF6','#059669','#EC4899','#7C3AED','#EF4444','#94A3B8','#005F73','#F97316'];

  const mesG = data.gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth() === MES && d.getFullYear() === AÑO; });
  const totalGast = mesG.filter(g => g.tipo === 'gasto').reduce((s, g) => s + g.monto, 0);
  const totalIng = mesG.filter(g => g.tipo === 'ingreso').reduce((s, g) => s + g.monto, 0);
  const compPag = data.compromisos.filter(c => c.pagado).reduce((s, c) => s + Number(c.monto || 0), 0);

  const delCat = id => { if (window.confirm('¿Eliminar categoría?')) setData(d => ({ ...d, categorias: d.categorias.filter(c => c.id !== id), gastos: d.gastos.filter(g => g.catId !== id) })); };
  const delGasto = id => setData(d => ({ ...d, gastos: d.gastos.filter(g => g.id !== id) }));
  const addCat = () => {
    if (!nuevaCat.trim()) return;
    setData(d => ({ ...d, categorias: [...d.categorias, { id: 'cat_' + Date.now(), nombre: nuevaCat, icon: iconSel, color: colorSel }] }));
    setNuevaCat(''); setShowAddCat(false);
  };

  // Foto de ticket → Claude Vision
  const handleFoto = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = ev.target.result.split(',')[1];
      try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 100, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type || 'image/jpeg', data: b64 } }, { type: 'text', text: 'Extrae el TOTAL a pagar de este ticket/boleta. Solo JSON: {"monto":12990,"descripcion":"Supermercado Lider"}' }] }] })
        });
        const d = await r.json();
        const res = JSON.parse((d.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim());
        if (res.monto) setModal({ tipo: 'gasto', monto: res.monto, desc: res.descripcion || '' });
      } catch { alert('No pude leer el ticket'); }
    };
    reader.readAsDataURL(file);
  };

  const listaFiltrada = filtro === 'todo' ? mesG : mesG.filter(g => g.tipo === filtro);

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[{ l: 'Gastado', v: totalGast, c: co.red, bg: 'rgba(231,111,81,0.08)' }, { l: 'Ingresos', v: totalIng, c: co.green, bg: 'rgba(42,157,143,0.08)' }, { l: 'Cuentas ✓', v: compPag, c: co.primary, bg: 'rgba(0,95,115,0.08)' }].map(({ l, v, c, bg }) => (
          <div key={l} style={{ background: bg, borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: '1px solid ' + c + '22' }}>
            <div style={{ fontSize: 10, color: c, fontWeight: 700, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      {/* Botones acción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setModal({ tipo: 'gasto' })} style={{ padding: '13px', borderRadius: 13, background: co.red, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>↗ Gasto</button>
        <button onClick={() => setModal({ tipo: 'ingreso' })} style={{ padding: '13px', borderRadius: 13, background: co.green, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>↙ Ingreso</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <button onClick={() => fotoRef.current?.click()} style={{ padding: '11px', borderRadius: 12, background: t.card, color: co.primary, border: '2px solid ' + co.primary + '44', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>📸 Foto ticket</button>
        <button onClick={() => setShowAddCat(!showAddCat)} style={{ padding: '11px', borderRadius: 12, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Categoría</button>
      </div>
      <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />

      {/* Nueva categoría */}
      {showAddCat && (
        <div style={{ background: t.card, borderRadius: 14, padding: 14, border: '1px solid ' + t.border, marginBottom: 12 }}>
          <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} placeholder="Nombre categoría..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1px solid ' + t.border, background: t.bg, color: t.text, fontSize: 14, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {ICONOS.map(ic => <button key={ic} onClick={() => setIconSel(ic)} style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${iconSel === ic ? co.primary : t.border}`, background: iconSel === ic ? co.primary + '18' : t.bg, fontSize: 16, cursor: 'pointer' }}>{ic}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {COLORES.map(c => <button key={c} onClick={() => setColorSel(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: `3px solid ${colorSel === c ? t.text : 'transparent'}`, cursor: 'pointer' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCat} style={{ flex: 1, padding: '9px', borderRadius: 9, background: co.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Crear</button>
            <button onClick={() => setShowAddCat(false)} style={{ padding: '9px 13px', borderRadius: 9, background: 'transparent', color: t.muted, border: '1px solid ' + t.border, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>
      )}

      {/* Categorías */}
      {data.categorias.map(cat => {
        const gc = mesG.filter(g => g.catId === cat.id);
        const total = gc.reduce((s, g) => s + g.monto, 0);
        const isExp = expandCat === cat.id;
        return (
          <div key={cat.id} style={{ background: t.card, borderRadius: 14, marginBottom: 8, border: '1px solid ' + t.border, overflow: 'hidden' }}>
            <div onClick={() => setExpandCat(isExp ? null : cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{cat.nombre}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{gc.length} movimiento{gc.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: total > 0 ? cat.color : t.muted }}>{fmt(total)}</div>
                {totalGast > 0 && total > 0 && <div style={{ fontSize: 10, color: t.muted }}>{Math.round((total / totalGast) * 100)}%</div>}
              </div>
              <span style={{ fontSize: 13, color: t.muted, transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>⌄</span>
            </div>
            {totalGast > 0 && total > 0 && <div style={{ height: 2, background: t.border, margin: '0 15px 8px' }}><div style={{ height: '100%', width: `${Math.min((total / totalGast) * 100, 100)}%`, background: cat.color, borderRadius: 2 }} /></div>}
            {isExp && (
              <div style={{ borderTop: '1px solid ' + t.border, padding: '8px 15px 12px' }}>
                {gc.length === 0 ? <div style={{ fontSize: 12, color: t.muted, textAlign: 'center', padding: '8px 0' }}>Sin movimientos este mes</div>
                  : gc.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid ' + t.border + '44' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{g.desc || 'Sin descripción'}</div>
                        <div style={{ fontSize: 10, color: t.muted }}>{g.fecha} · {g.origen === 'banco' ? '🏦 Banco' : g.tipo === 'ingreso' ? '💚 Ingreso' : '❤️ Gasto'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: g.tipo === 'ingreso' ? co.green : t.text }}>{g.tipo === 'ingreso' ? '+' : ''}{fmt(g.monto)}</div>
                        <button onClick={() => delGasto(g.id)} style={{ background: 'transparent', color: co.red, border: 'none', cursor: 'pointer', fontSize: 13 }}>✕</button>
                      </div>
                    </div>
                  ))}
                <button onClick={() => { setModal({ tipo: 'gasto', catId: cat.id }); }} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 9, background: cat.color + '15', color: cat.color, border: '1px solid ' + cat.color + '33', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
                  + Agregar a {cat.nombre}
                </button>
                <button onClick={() => delCat(cat.id)} style={{ width: '100%', marginTop: 5, padding: '7px', borderRadius: 9, background: 'transparent', color: co.red, border: '1px solid ' + co.red + '22', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
                  🗑️ Eliminar categoría
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Todos los movimientos */}
      {mesG.length > 0 && (
        <div style={{ background: t.card, borderRadius: 18, padding: 16, border: '1px solid ' + t.border, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Todos los movimientos</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['todo', 'Todo'], ['gasto', 'Gastos'], ['ingreso', 'Ingresos']].map(([v, l]) => (
                <button key={v} onClick={() => setFiltro(v)} style={{ padding: '4px 9px', borderRadius: 18, border: '1px solid ' + (filtro === v ? co.primary : t.border), background: filtro === v ? co.primary + '15' : 'transparent', color: filtro === v ? co.primary : t.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
              ))}
            </div>
          </div>
          {listaFiltrada.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(g => {
            const cat = data.categorias.find(c => c.id === g.catId);
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 9, marginBottom: 9, borderBottom: '1px solid ' + t.border + '55' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: (cat?.color || '#94A3B8') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{cat?.icon || '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{g.desc || cat?.nombre || 'Sin descripción'}</div>
                  <div style={{ fontSize: 10, color: t.muted }}>{g.fecha} · {cat?.nombre}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: g.tipo === 'ingreso' ? co.green : t.text }}>{g.tipo === 'ingreso' ? '+' : '-'}{fmt(g.monto)}</div>
                <button onClick={() => delGasto(g.id)} style={{ background: 'transparent', color: co.red, border: 'none', cursor: 'pointer', fontSize: 13 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {modal && <ModalMovimiento tipo={modal.tipo} monto={modal.monto} desc={modal.desc} catId={modal.catId} data={data} setData={setData} t={t} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── MODAL MOVIMIENTO ──
function ModalMovimiento({ tipo: tipoI, monto: montoI, desc: descI, catId: catIdI, data, setData, t, onClose }) {
  const [tipo, setTipo] = useState(tipoI || 'gasto');
  const [monto, setMonto] = useState(montoI || '');
  const [desc, setDesc] = useState(descI || '');
  const [catId, setCatId] = useState(catIdI || data.categorias[0]?.id || 'otros');
  const [fecha, setFecha] = useState(NOW.toISOString().split('T')[0]);

  const guardar = () => {
    if (!monto) return;
    setData(d => ({ ...d, gastos: [{ id: Date.now(), tipo, catId, monto: Number(monto), desc, fecha, origen: 'manual' }, ...d.gastos] }));
    onClose();
  };
  const inp = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11, border: '1px solid ' + t.border, background: t.bg, color: t.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const col = tipo === 'gasto' ? co.red : co.green;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', zIndex: 300, backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', background: t.card, borderRadius: '22px 22px 0 0', padding: '18px 16px 40px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 34, height: 4, background: t.border, borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['gasto', '↗ Gasto', co.red], ['ingreso', '↙ Ingreso', co.green]].map(([v, l, c]) => (
            <button key={v} onClick={() => setTipo(v)} style={{ padding: '11px', borderRadius: 12, border: `2px solid ${tipo === v ? c : t.border}`, background: tipo === v ? c + '18' : t.bg, color: tipo === v ? c : t.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16, background: t.bg, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 5 }}>MONTO ($)</div>
          <input type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} autoFocus
            style={{ ...inp, fontSize: 34, fontWeight: 900, textAlign: 'center', border: 'none', background: 'transparent', color: col }} />
          {monto && <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>{fmt(Number(monto))}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 5 }}>DESCRIPCIÓN</div>
          <input placeholder={tipo === 'gasto' ? 'Ej: Copec, Almuerzo, Farmacia...' : 'Ej: Sueldo mayo, Comisión...'} value={desc} onChange={e => setDesc(e.target.value)} style={inp} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 7 }}>CATEGORÍA</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.categorias.map(c => (
              <button key={c.id} onClick={() => setCatId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 18, border: `1.5px solid ${catId === c.id ? c.color : t.border}`, background: catId === c.id ? c.color + '18' : t.bg, color: catId === c.id ? c.color : t.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {c.icon} {c.nombre}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 5 }}>FECHA</div>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inp} />
        </div>
        <button onClick={guardar} disabled={!monto} style={{ width: '100%', padding: '14px', borderRadius: 13, border: 'none', background: !monto ? t.border : `linear-gradient(135deg,${col},${col}99)`, color: !monto ? t.muted : '#fff', fontSize: 16, fontWeight: 800, cursor: !monto ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {tipo === 'gasto' ? 'Guardar gasto' : 'Guardar ingreso'}
        </button>
      </div>
    </div>
  );
}

// ── ANÁLISIS ──
function AnalisisView({ data, setData, t }) {
  const [tab, setTab] = useState('fondo');
  const { historial, fondoEmergencia, fondoActual, metaAhorro, gastos, compromisos, ingresos } = data;

  // Datos para gráfico últimos 6 meses
  const meses6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(AÑO, MES - (5 - i), 1);
    const m = d.getMonth(); const a = d.getFullYear();
    const hist = historial?.find(h => h.mes === m && h.año === a);
    const actual = m === MES && a === AÑO;
    let gast = 0;
    if (actual) {
      gast = gastos.filter(g => { const dd = new Date(g.fecha); return dd.getMonth() === m && dd.getFullYear() === a && g.tipo === 'gasto'; }).reduce((s, g) => s + g.monto, 0);
    } else if (hist) {
      gast = hist.totalGast || 0;
    }
    return { mes: MESES_NOM[m], gast, comp: hist?.totalComp || (actual ? compromisos.filter(c => c.activo).reduce((s, c) => s + Number(c.monto || 0), 0) : 0) };
  });
  const maxVal = Math.max(...meses6.map(m => Math.max(m.gast, m.comp)), 1);

  // Calendario
  const primerDia = new Date(AÑO, MES, 1).getDay();
  const diasMes = new Date(AÑO, MES + 1, 0).getDate();
  const pagosXDia = {};
  compromisos.filter(c => c.activo && c.monto > 0).forEach(c => {
    if (!pagosXDia[c.dia]) pagosXDia[c.dia] = [];
    pagosXDia[c.dia].push(c);
  });

  const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid ' + t.border, background: t.bg, color: t.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' };
  const fondoPct = fondoEmergencia > 0 ? Math.min((fondoActual / fondoEmergencia) * 100, 100) : 0;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: t.card, borderRadius: 12, padding: 4, border: '1px solid ' + t.border }}>
        {[['fondo', '🛡️ Fondo'], ['grafico', '📊 Gráfico'], ['calendario', '📅 Calendario'], ['historial', '🗓️ Historial']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, background: tab === id ? co.primary : 'transparent', color: tab === id ? '#fff' : t.muted }}>{l}</button>
        ))}
      </div>

      {/* Fondo de emergencia */}
      {tab === 'fondo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: t.card, borderRadius: 18, padding: 18, border: '1px solid ' + t.border }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>🛡️ Fondo de Emergencia</div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>FARO recomienda tener 3-6 meses de gastos guardados para emergencias.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 4 }}>META ($)</div>
                <input type="number" value={fondoEmergencia || ''} onChange={e => setData(d => ({ ...d, fondoEmergencia: Number(e.target.value) || 0 }))} placeholder="Ej: 3000000" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, marginBottom: 4 }}>AHORRADO ($)</div>
                <input type="number" value={fondoActual || ''} onChange={e => setData(d => ({ ...d, fondoActual: Number(e.target.value) || 0 }))} placeholder="Ej: 500000" style={inp} />
              </div>
            </div>
            {fondoEmergencia > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: t.muted }}>Progreso</span>
                  <span style={{ fontWeight: 700, color: fondoPct >= 100 ? co.green : fondoPct >= 50 ? co.yellow : co.red }}>{Math.round(fondoPct)}%</span>
                </div>
                <div style={{ height: 8, background: t.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${fondoPct}%`, background: fondoPct >= 100 ? co.green : fondoPct >= 50 ? co.yellow : co.red, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 12, color: t.muted }}>
                  {fondoActual >= fondoEmergencia ? '✅ ¡Meta alcanzada!' : `Faltan ${fmt(fondoEmergencia - fondoActual)} para completar tu fondo`}
                </div>
              </>
            )}
          </div>

          {/* Meta de ahorro */}
          <div style={{ background: t.card, borderRadius: 18, padding: 18, border: '1px solid ' + t.border }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 12 }}>🎯 Meta de Ahorro Mensual</div>
            <input type="number" value={metaAhorro || ''} onChange={e => setData(d => ({ ...d, metaAhorro: Number(e.target.value) || 0 }))} placeholder="Ej: 200000" style={inp} />
            {metaAhorro > 0 && ingresos > 0 && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: co.primary + '10', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: co.primary, fontWeight: 700 }}>Para ahorrar {fmt(metaAhorro)} debes gastar máximo {fmt(ingresos - metaAhorro)} este mes</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráfico */}
      {tab === 'grafico' && (
        <div style={{ background: t.card, borderRadius: 18, padding: 18, border: '1px solid ' + t.border }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 4 }}>📊 Últimos 6 meses</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: co.red }} /><span style={{ fontSize: 11, color: t.muted }}>Gastos</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: co.primary }} /><span style={{ fontSize: 11, color: t.muted }}>Compromisos</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
            {meses6.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: '85%' }}>
                  <div style={{ flex: 1, background: co.red + 'CC', borderRadius: '3px 3px 0 0', height: `${(m.gast / maxVal) * 100}%`, minHeight: m.gast > 0 ? 2 : 0 }} />
                  <div style={{ flex: 1, background: co.primary + 'CC', borderRadius: '3px 3px 0 0', height: `${(m.comp / maxVal) * 100}%`, minHeight: m.comp > 0 ? 2 : 0 }} />
                </div>
                <div style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>{m.mes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendario */}
      {tab === 'calendario' && (
        <div style={{ background: t.card, borderRadius: 18, padding: 18, border: '1px solid ' + t.border }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 14 }}>📅 {MESES_NOM[MES]} {AÑO}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
            {DIAS_MES.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: t.muted, fontWeight: 700, padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array.from({ length: primerDia }, (_, i) => <div key={'e' + i} />)}
            {Array.from({ length: diasMes }, (_, i) => {
              const dia = i + 1;
              const pagos = pagosXDia[dia] || [];
              const esHoy = dia === NOW.getDate();
              const tieneVenc = pagos.length > 0;
              return (
                <div key={dia} style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 8, background: esHoy ? co.primary : tieneVenc ? co.red + '18' : 'transparent', border: esHoy ? 'none' : tieneVenc ? '1px solid ' + co.red + '44' : '1px solid transparent' }}>
                  <div style={{ fontSize: 12, fontWeight: esHoy || tieneVenc ? 800 : 400, color: esHoy ? '#fff' : tieneVenc ? co.red : t.text }}>{dia}</div>
                  {tieneVenc && <div style={{ fontSize: 8, color: esHoy ? '#fff' : co.red }}>{pagos.length > 1 ? pagos.length + 'v' : pagos[0].nombre.slice(0, 4)}</div>}
                </div>
              );
            })}
          </div>
          {Object.entries(pagosXDia).length > 0 && (
            <div style={{ marginTop: 14, borderTop: '1px solid ' + t.border, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 8 }}>VENCIMIENTOS DEL MES</div>
              {Object.entries(pagosXDia).sort((a, b) => Number(a[0]) - Number(b[0])).map(([dia, pagos]) => (
                <div key={dia} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid ' + t.border + '44' }}>
                  <div style={{ fontSize: 13, color: t.text }}>Día {dia} — {pagos.map(p => p.nombre).join(', ')}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{fmt(pagos.reduce((s, p) => s + p.monto, 0))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      {tab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => {
            const mesAct = { mes: MES, año: AÑO, totalComp: compromisos.filter(c => c.activo).reduce((s, c) => s + Number(c.monto || 0), 0), totalGast: gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth() === MES && d.getFullYear() === AÑO && g.tipo === 'gasto'; }).reduce((s, g) => s + g.monto, 0), totalIng: ingresos, fechaCierre: NOW.toISOString().split('T')[0] };
            setData(d => ({ ...d, historial: [...(d.historial || []).filter(h => !(h.mes === MES && h.año === AÑO)), mesAct] }));
            alert('Mes cerrado y guardado en historial ✅');
          }} style={{ padding: '13px', borderRadius: 13, background: co.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            📁 Cerrar mes y guardar en historial
          </button>
          {(!historial || historial.length === 0) ? (
            <div style={{ background: t.card, borderRadius: 14, padding: 20, textAlign: 'center', border: '1px solid ' + t.border }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 13, color: t.muted }}>Sin historial aún. Cierra el mes para guardar.</div>
            </div>
          ) : (
            [...(historial || [])].sort((a, b) => new Date(b.año, b.mes) - new Date(a.año, a.mes)).map((h, i) => (
              <div key={i} style={{ background: t.card, borderRadius: 14, padding: 16, border: '1px solid ' + t.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{MESES_NOM[h.mes]} {h.año}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>Cerrado {h.fechaCierre}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Compromisos', h.totalComp, co.primary], ['Gastos', h.totalGast, co.red], ['Ingresos', h.totalIng, co.green]].map(([l, v, c]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: t.muted, marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{fmt(v)}</div>
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

// ── AJUSTES ──
function AjustesView({ data, setData, t, onSyncGmail }) {
  const [tab, setTab] = useState('bancos');
  const [syncing, setSyn] = useState(false);
  const [msg, setMsg] = useState('');
  const [synCode, setSynCode] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid ' + t.border, background: t.bg, color: t.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' };

  const sincronizar = async () => {
    setSyn(true); setMsg('🔦 Buscando boletas...');
    try {
      let boletas = [];
      if (data.gmailWebAppUrl) {
        const res = await fetch(data.gmailWebAppUrl);
        const json = await res.json();
        boletas = (json.data || []).map(x => ({ key: x.key, nombre: x.nombre, monto: x.monto, diaVence: x.diaVence || null }));
      } else {
        const res = await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`, { headers: SB_HDR });
        const b = await res.json();
        boletas = (b || []).map(x => ({ key: x.key, nombre: x.nombre, monto: x.monto, diaVence: x.dia_vence || null }));
      }
      if (boletas.length > 0) { setMsg(`✅ ${boletas.length} boleta(s) detectada(s)`); onSyncGmail(boletas); }
      else setMsg('✓ Sin boletas nuevas');
    } catch (e) { setMsg('Error: ' + e.message); }
    setSyn(false);
  };

  // Exportar datos
  const exportar = () => {
    const exportData = { compromisos: data.compromisos, gastos: data.gastos, categorias: data.categorias, ingresos: data.ingresos, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `FARO_backup_${NOW.toISOString().split('T')[0]}.json`; a.click();
    setExportMsg('✅ Datos exportados');
    setTimeout(() => setExportMsg(''), 3000);
  };

  // Sincronización entre dispositivos
  const generarCodigo = async () => {
    const codigo = 'FARO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await fetch(`${SB_URL}/rest/v1/faro_sync`, {
        method: 'POST', headers: SB_HDR,
        body: JSON.stringify({ id: codigo, data: JSON.stringify(data), updated_at: new Date().toISOString() })
      });
      setData(d => ({ ...d, syncCode: codigo }));
      setSynCode(codigo);
    } catch { alert('Error generando código'); }
  };

  const conectarBanco = async (banco) => {
    try {
      const res = await fetch('/api/fintoc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'widget_token' }) });
      const json = await res.json();
      if (!json.ok) { alert('Error: ' + json.error); return; }
      if (!window.Fintoc) { alert('Cargando Fintoc, intenta en 2 segundos'); return; }
      window.Fintoc.create({
        holderType: 'individual', product: 'movements', country: 'cl',
        publicKey: FINTOC_PK, widgetToken: json.widget_token, institution: banco.id,
        onSuccess: linkToken => {
          setData(d => ({ ...d, fintocLinks: [...(d.fintocLinks || []), { token: linkToken, banco: banco.nombre, bancoId: banco.id }] }));
          alert('✅ ' + banco.nombre + ' conectado');
        },
        onExit: () => {},
      }).open();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const desconectarBanco = (bancoId) => {
    if (window.confirm('¿Desconectar este banco?'))
      setData(d => ({ ...d, fintocLinks: (d.fintocLinks || []).filter(l => l.bancoId !== bancoId) }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 5, background: t.card, borderRadius: 12, padding: 4, border: '1px solid ' + t.border }}>
        {[['bancos','🏦'],['gmail','📧'],['alertas','🔔'],['sync','🔄'],['cuenta','👤']].map(([id,ic]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'9px 4px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:16, background: tab===id ? co.primary : 'transparent' }}>{ic}</button>
        ))}
      </div>

      {tab==='bancos' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontSize:14, fontWeight:800, color:t.text }}>🏦 Conectar Banco</div>
              <div style={{ fontSize:11, fontWeight:700, color:co.green, background:co.green+'15', padding:'3px 8px', borderRadius:18 }}>Fintoc</div>
            </div>
            <div style={{ fontSize:12, color:t.muted, marginBottom:14 }}>Solo lectura — FARO nunca puede mover tu dinero</div>
            {BANCOS_FINTOC.map(banco => {
              const conectado = (data.fintocLinks||[]).find(l => l.bancoId===banco.id);
              return (
                <div key={banco.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid '+t.border+'44' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{banco.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{banco.nombre}</div>
                      {conectado && <div style={{ fontSize:10, color:co.green }}>✅ Conectado</div>}
                    </div>
                  </div>
                  {conectado
                    ? <button onClick={() => desconectarBanco(banco.id)} style={{ padding:'5px 11px', borderRadius:8, background:'transparent', color:co.red, border:'1px solid '+co.red+'44', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Desconectar</button>
                    : <button onClick={() => conectarBanco(banco)} style={{ padding:'5px 11px', borderRadius:8, background:co.primary, color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Conectar</button>
                  }
                </div>
              );
            })}
          </div>
          <div style={{ background:co.primary+'08', borderRadius:14, padding:'12px 14px', border:'1px solid '+co.primary+'22' }}>
            <div style={{ fontSize:12, fontWeight:700, color:co.primary, marginBottom:4 }}>🔐 Seguridad bancaria</div>
            <div style={{ fontSize:11, color:t.muted, lineHeight:1.5 }}>Fintoc usa conexión encriptada. FARO solo lee movimientos. Tus credenciales van directo al banco, FARO no las ve nunca.</div>
          </div>
        </div>
      )}

      {tab==='gmail' && (
        <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontSize:14, fontWeight:800, color:t.text }}>📧 Gmail Sync</div>
            <div style={{ fontSize:11, fontWeight:700, color:co.green }}>✓ Activo</div>
          </div>
          <div style={{ fontSize:12, color:t.muted, marginBottom:14 }}>Se sincroniza automáticamente al abrir FARO</div>
          <button onClick={sincronizar} disabled={syncing} style={{ width:'100%', padding:'11px', borderRadius:12, background:syncing?t.border:'linear-gradient(135deg,'+co.green+',#047857)', color:syncing?t.muted:'#fff', fontWeight:700, border:'none', cursor:syncing?'not-allowed':'pointer', fontFamily:'inherit', fontSize:14, marginBottom:10 }}>
            {syncing ? '⏳ Buscando...' : '🔄 Sincronizar ahora'}
          </button>
          {msg && <div style={{ fontSize:12, color:msg.startsWith('✅')||msg.startsWith('✓')?co.green:co.red, textAlign:'center', fontWeight:600, marginBottom:10 }}>{msg}</div>}
          <details style={{ cursor:'pointer' }}>
            <summary style={{ fontSize:11, color:t.muted, fontWeight:600, listStyle:'none' }}>⚙️ Configuración avanzada</summary>
            <div style={{ marginTop:10 }}>
              <input value={data.gmailWebAppUrl||''} onChange={e => setData(d => ({...d, gmailWebAppUrl:e.target.value.trim()}))} placeholder="https://script.google.com/macros/s/..."
                style={{ width:'100%', boxSizing:'border-box', padding:'9px 11px', borderRadius:9, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:12, fontFamily:'inherit' }} />
            </div>
          </details>
        </div>
      )}

      {tab==='alertas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
            <div style={{ fontSize:14, fontWeight:800, color:t.text, marginBottom:14 }}>💬 WhatsApp Alertas</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:4 }}>TU NÚMERO</div>
                <input value={data.telefono||''} onChange={e => setData(d => ({...d, telefono:e.target.value}))} placeholder="+56912345678"
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:14, fontFamily:'inherit' }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:4 }}>API KEY (CallMeBot)</div>
                <input value={data.whatsappKey||''} onChange={e => setData(d => ({...d, whatsappKey:e.target.value}))} placeholder="Ej: 123456"
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:10, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:14, fontFamily:'inherit' }} />
              </div>
            </div>
          </div>
          <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
            <div style={{ fontSize:14, fontWeight:800, color:t.text, marginBottom:6 }}>📅 FARO te habla</div>
            <div style={{ fontSize:12, color:t.muted, marginBottom:12 }}>Resumen semanal los lunes a las 9am</div>
            <button onClick={async () => {
              if (!data.telefono||!data.whatsappKey) { alert('Ingresa tu número y API Key primero'); return; }
              const comp = data.compromisos.filter(c=>c.activo&&!c.pagado).slice(0,3).map(c=>`${c.nombre}: ${fmt(c.monto)}`).join(', ');
              const mensaje = `🔦 FARO - Resumen\n\n💼 Ingresos: ${fmt(data.ingresos)}\n⏰ Pendientes: ${comp||'Todo pagado ✅'}\n\nScore: ${calcScore(data)}/100`;
              window.open(`https://api.callmebot.com/whatsapp.php?phone=${data.telefono}&text=${encodeURIComponent(mensaje)}&apikey=${data.whatsappKey}`,'_blank');
            }} style={{ width:'100%', padding:'11px', borderRadius:12, background:'#25D366', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
              💬 Enviar resumen ahora
            </button>
          </div>
        </div>
      )}

      {tab==='sync' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
            <div style={{ fontSize:14, fontWeight:800, color:t.text, marginBottom:6 }}>🔄 Sincronizar dispositivos</div>
            <div style={{ fontSize:12, color:t.muted, marginBottom:14 }}>Usa el mismo FARO en tu iPhone y computador</div>
            {(data.syncCode||synCode) ? (
              <div style={{ textAlign:'center', padding:16, background:co.primary+'10', borderRadius:12, border:'1px solid '+co.primary+'33', marginBottom:12 }}>
                <div style={{ fontSize:11, color:t.muted, marginBottom:6 }}>TU CÓDIGO</div>
                <div style={{ fontSize:24, fontWeight:900, color:co.primary, letterSpacing:3 }}>{data.syncCode||synCode}</div>
              </div>
            ) : (
              <button onClick={generarCodigo} style={{ width:'100%', padding:'11px', borderRadius:12, background:co.primary, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14, marginBottom:10 }}>
                🔑 Generar código
              </button>
            )}
            <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:6 }}>INGRESAR CÓDIGO DE OTRO DISPOSITIVO</div>
            <div style={{ display:'flex', gap:8 }}>
              <input placeholder="FARO-XXXXXX" value={synCode} onChange={e => setSynCode(e.target.value.toUpperCase())}
                style={{ flex:1, padding:'10px 12px', borderRadius:10, border:'1px solid '+t.border, background:t.bg, color:t.text, fontSize:13, fontWeight:700, letterSpacing:1, fontFamily:'inherit' }} />
              <button onClick={async () => {
                try {
                  const r = await fetch(`${SB_URL}/rest/v1/faro_sync?id=eq.${synCode}&select=data`,{headers:SB_HDR});
                  const rows = await r.json();
                  if (rows?.[0]?.data) { setData(JSON.parse(rows[0].data)); alert('✅ Sincronizado'); }
                  else alert('Código no encontrado');
                } catch { alert('Error'); }
              }} style={{ padding:'10px 14px', borderRadius:10, background:co.green, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Sync</button>
            </div>
          </div>
          <div style={{ background:t.card, borderRadius:18, padding:18, border:'1px solid '+t.border }}>
            <div style={{ fontSize:14, fontWeight:800, color:t.text, marginBottom:12 }}>💾 Exportar datos</div>
            <button onClick={exportar} style={{ width:'100%', padding:'11px', borderRadius:12, background:co.primary+'15', color:co.primary, border:'1px solid '+co.primary+'33', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
              ⬇️ Exportar JSON
            </button>
            {exportMsg && <div style={{ fontSize:12, color:co.green, textAlign:'center', marginTop:8 }}>{exportMsg}</div>}
          </div>
        </div>
      )}

      {tab==='cuenta' && (
        <div style={{ background:t.card, borderRadius:18, padding:20, border:'1px solid '+t.border }}>
          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,'+co.primary+','+co.secondary+')', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', margin:'0 auto 10px' }}>C</div>
            <div style={{ fontSize:17, fontWeight:700, color:t.text }}>Cristian</div>
            <div style={{ fontSize:12, color:t.muted }}>Score {calcScore(data)}/100 · {scoreLabel(calcScore(data))}</div>
          </div>

          {/* PIN */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:t.text, marginBottom:8 }}>🔐 PIN de seguridad</div>
            {data.pin ? (
              <button onClick={() => { if(window.confirm('¿Desactivar PIN?')) setData(d=>({...d,pin:null})); }}
                style={{ width:'100%', padding:'10px', borderRadius:10, background:'rgba(231,111,81,0.08)', color:co.red, border:'1px solid '+co.red+'33', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>
                🔓 Desactivar PIN
              </button>
            ) : (
              <button onClick={() => {
                const pin = prompt('Ingresa un PIN de 6 dígitos:');
                if (pin && /^\d{6}$/.test(pin)) { setData(d=>({...d,pin})); alert('✅ PIN activado'); }
                else if (pin) alert('El PIN debe tener exactamente 6 dígitos');
              }} style={{ width:'100%', padding:'10px', borderRadius:10, background:co.primary+'15', color:co.primary, border:'1px solid '+co.primary+'33', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>
                🔒 Activar PIN (6 dígitos)
              </button>
            )}
          </div>

          <button onClick={() => { if(window.confirm('¿Borrar TODOS los datos?')) setData(d=>({...d,compromisos:COMP_DEF,ingresos:1200000,gastos:[],categorias:CATS_DEF,boletasGmail:[],historial:[],fintocLinks:[],fondoEmergencia:0,fondoActual:0,metaAhorro:0})); }}
            style={{ width:'100%', padding:'11px', borderRadius:12, background:'rgba(231,111,81,0.08)', color:co.red, border:'1px solid '+co.red+'33', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>
            🔄 Resetear FARO
          </button>
        </div>
      )}
    </div>
  );
}

// ── MODAL ¿PUEDO COMPRARLO? ──
function ModalPuedoComprarlo({ data, t, onClose }) {
  const [monto, setMonto] = useState('');
  const mesG = data.gastos.filter(g => { const d = new Date(g.fecha); return d.getMonth()===MES && d.getFullYear()===AÑO && g.tipo==='gasto'; });
  const egreso = mesG.reduce((s,g) => s+g.monto, 0);
  const compPag = data.compromisos.filter(c=>c.pagado).reduce((s,c) => s+Number(c.monto||0), 0);
  const compPend = data.compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c) => s+Number(c.monto||0), 0);
  const disponible = data.ingresos - compPag - egreso - compPend;
  const puedo = Number(monto)>0 && disponible-Number(monto)>=0;
  const justo = puedo && disponible-Number(monto) < data.ingresos*0.1;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'flex-end', zIndex:300, backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:440, margin:'0 auto', background:t.card, borderRadius:'22px 22px 0 0', padding:'20px 16px 40px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:34, height:4, background:t.border, borderRadius:2, margin:'0 auto 16px' }} />
        <div style={{ fontSize:17, fontWeight:800, color:t.text, marginBottom:6 }}>🤔 ¿Puedo comprar esto?</div>
        <div style={{ fontSize:12, color:t.muted, marginBottom:16 }}>Disponible actual: <strong style={{ color:disponible>=0?co.green:co.red }}>{fmt(disponible)}</strong></div>
        <input type="number" placeholder="¿Cuánto cuesta?" value={monto} onChange={e=>setMonto(e.target.value)} autoFocus
          style={{ width:'100%', boxSizing:'border-box', padding:'14px', borderRadius:12, border:'2px solid '+t.border, background:t.bg, color:t.text, fontSize:22, fontWeight:900, textAlign:'center', fontFamily:'inherit', outline:'none', marginBottom:16 }} />
        {monto>0 && (
          <div style={{ padding:18, borderRadius:14, background:puedo?(justo?co.yellow+'18':co.green+'15'):co.red+'12', border:'1px solid '+(puedo?(justo?co.yellow:co.green):co.red)+'44', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>{puedo?(justo?'⚠️':'✅'):'❌'}</div>
            <div style={{ fontSize:16, fontWeight:800, color:puedo?(justo?co.yellow:co.green):co.red, marginBottom:6 }}>
              {puedo?(justo?'¡Justo!':'¡Sí puedes!'):'No por ahora'}
            </div>
            <div style={{ fontSize:13, color:t.muted }}>
              {puedo ? (justo?`Te quedarían solo ${fmt(disponible-Number(monto))} — un poco justo`:`Te quedarían ${fmt(disponible-Number(monto))} disponibles`) : `Te faltan ${fmt(Number(monto)-disponible)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PIN ──
function PinScreen({ pin, onDesbloqueado }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const handleNum = n => {
    if (input.length>=6) return;
    const nuevo = input+n;
    setInput(nuevo);
    if (nuevo.length===6) {
      if (nuevo===pin) { onDesbloqueado(); }
      else { setError(true); setIntentos(p=>p+1); setTimeout(()=>{ setInput(''); setError(false); },600); }
    }
  };
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0A3A60,#005F73)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,sans-serif', padding:20 }}>
      <div style={{ fontSize:52, marginBottom:12 }}>🔦</div>
      <div style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:4 }}>FARO</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:40 }}>Ingresa tu PIN</div>
      <div style={{ display:'flex', gap:14, marginBottom:40 }}>
        {Array.from({length:6},(_,i)=>(
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:i<input.length?(error?co.red:'#fff'):'rgba(255,255,255,0.3)' }} />
        ))}
      </div>
      {error && <div style={{ fontSize:12, color:co.red, marginBottom:16, fontWeight:700 }}>PIN incorrecto ({intentos} intento{intentos>1?'s':''})</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,72px)', gap:12 }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((n,i)=>(
          <button key={i} onClick={()=>n==='⌫'?setInput(p=>p.slice(0,-1)):n!==''?handleNum(String(n)):null}
            style={{ width:72, height:72, borderRadius:'50%', border:'none', background:n===''?'transparent':'rgba(255,255,255,0.15)', color:'#fff', fontSize:n==='⌫'?20:22, fontWeight:600, cursor:n!==''?'pointer':'default', fontFamily:'inherit' }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ──
export default function FaroApp() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('panorama');
  const [bloqueado, setBloqueado] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [data, setData] = useState({
    ingresos:1200000, telefono:'', whatsappKey:'', gmailWebAppUrl:'', boletasGmail:[],
    fintocLinks:[], compromisos:COMP_DEF, gastos:[], categorias:CATS_DEF,
    historial:[], fondoEmergencia:0, fondoActual:0, metaAhorro:0, pin:null, syncCode:null,
  });

  const t = {
    bg: isDark?co.bgDark:co.bgLight, card: isDark?co.cardDark:co.cardLight,
    text: isDark?co.textDark:co.textLight, muted: isDark?co.mutedDark:co.mutedLight,
    border: isDark?co.borderDark:co.borderLight,
  };

  useEffect(()=>{
    const d = S.get('faro_v4',null); const dk = S.get('faro_dark',false);
    if(d) setData(prev=>({...prev,...d, categorias:d.categorias?.length?d.categorias:CATS_DEF}));
    setIsDark(dk); if(d?.pin) setBloqueado(true); setLoaded(true);
  },[]);
  useEffect(()=>{ if(loaded) S.set('faro_v4',data); },[data,loaded]);
  useEffect(()=>{ if(loaded) S.set('faro_dark',isDark); },[isDark,loaded]);

  useEffect(()=>{
    if(typeof window==='undefined'||document.getElementById('fintoc-js')) return;
    const s=document.createElement('script'); s.id='fintoc-js'; s.src='https://js.fintoc.com/v1/'; document.head.appendChild(s);
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    const sync = async () => {
      try {
        let boletas=[];
        if(data.gmailWebAppUrl){ const r=await fetch(data.gmailWebAppUrl); const j=await r.json(); boletas=(j.data||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.diaVence||null})); }
        else { const r=await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:SB_HDR}); const b=await r.json(); boletas=(b||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null})); }
        if(boletas.length>0) setData(d=>({...d,boletasGmail:boletas}));
      } catch {}
    };
    sync();
  },[loaded]);

  const confirmarBoletas = useCallback(boletas => {
    if(!boletas.length){ setData(d=>({...d,boletasGmail:[]})); return; }
    setData(d=>({...d,
      compromisos:d.compromisos.map(comp=>{
        const match=boletas.find(b=>b.key===comp.gmailKey);
        if(match&&match.monto>0){ const p={monto:match.monto}; if(match.diaVence) p.dia=match.diaVence; return {...comp,...p}; }
        return comp;
      }),
      boletasGmail:[],
    }));
  },[]);

  if(!loaded) return(
    <div style={{ minHeight:'100vh', background:co.primary, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,sans-serif' }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🔦</div>
      <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:-1 }}>FARO</div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:6 }}>Cargando...</div>
    </div>
  );

  if(bloqueado&&data.pin) return <PinScreen pin={data.pin} onDesbloqueado={()=>setBloqueado(false)} />;

  const TABS=[['panorama','🔦','Inicio'],['compromisos','📋','Cuentas'],['gastos','💸','Gastos'],['analisis','📊','Análisis'],['ajustes','⚙️','Ajustes']];

  return(
    <div style={{ background:t.bg, minHeight:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:80 }}>
      <div style={{ maxWidth:440, margin:'0 auto', padding:'14px 14px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ background:co.primary, width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:17, color:'#fff' }}>🔦</span>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:t.text, letterSpacing:-0.5 }}>FARO</div>
              <div style={{ fontSize:9, fontWeight:700, color:t.muted }}>COPILOTO FINANCIERO</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {data.boletasGmail?.length>0&&(
              <div onClick={()=>setTab('panorama')} style={{ width:22, height:22, borderRadius:'50%', background:co.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', cursor:'pointer' }}>{data.boletasGmail.length}</div>
            )}
            {data.pin&&<button onClick={()=>setBloqueado(true)} style={{ background:'transparent', border:'none', fontSize:18, cursor:'pointer' }}>🔒</button>}
            <button onClick={()=>setIsDark(d=>!d)} style={{ background:t.card, border:'1px solid '+t.border, borderRadius:99, width:42, height:22, padding:2, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:isDark?'flex-end':'flex-start' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', background:isDark?co.secondary:co.yellow }} />
            </button>
          </div>
        </div>
        <div style={{ fontSize:11, color:t.muted, fontWeight:600 }}>{NOW.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</div>
        <div style={{ fontSize:22, fontWeight:900, color:t.text, marginTop:3, marginBottom:20 }}>Hola, Cristian 🔦</div>

        {tab==='panorama'    && <PanoramaView    data={data} setData={setData} onConfirmarBoletas={confirmarBoletas} t={t} />}
        {tab==='compromisos' && <CompromisosView data={data} setData={setData} t={t} />}
        {tab==='gastos'      && <GastosView      data={data} setData={setData} t={t} isDark={isDark} />}
        {tab==='analisis'    && <AnalisisView     data={data} setData={setData} t={t} />}
        {tab==='ajustes'     && <AjustesView      data={data} setData={setData} t={t} onSyncGmail={b=>{ setData(d=>({...d,boletasGmail:b})); setTab('panorama'); }} />}
      </div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:t.card, borderTop:'1px solid '+t.border, height:68, display:'flex', justifyContent:'space-around', alignItems:'center', zIndex:100 }}>
        {TABS.map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ background:'none', border:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer', fontFamily:'inherit', color:tab===id?co.primary:t.muted }}>
            <span style={{ fontSize:19, filter:tab===id?'none':'grayscale(1) opacity(0.5)' }}>{icon}</span>
            <span style={{ fontSize:9, fontWeight:tab===id?800:500 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
