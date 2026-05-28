'use client';
import React, { useState, useEffect } from 'react';

const S = {
  isArtifact: typeof window !== "undefined" && typeof window.storage !== "undefined",
  async get(k,d){ try{ if(this.isArtifact){ const r=await window.storage.get(k); return r?JSON.parse(r.value):d; } const r=localStorage.getItem(k); return r?JSON.parse(r):d; }catch{ return d; } },
  async set(k,v){ try{ if(this.isArtifact){ await window.storage.set(k,JSON.stringify(v)); } else { localStorage.setItem(k,JSON.stringify(v)); } }catch{} },
};

const co = {
  bgLight:'#F4F7F6', bgDark:'#0D1B2A',
  cardLight:'#FFFFFF', cardDark:'#1B263B',
  textLight:'#1E293B', textDark:'#E2E8F0',
  textMutedLight:'#64748B', textMutedDark:'#94A3B8',
  primary:'#005F73', secondary:'#0A9396',
  green:'#2A9D8F', yellow:'#E9C46A', orange:'#F4A261', red:'#E76F51',
  borderLight:'#E2E8F0', borderDark:'#2C3E50'
};

const fmtFull = v => v ? '$' + Math.round(v).toLocaleString('es-CL') : '$0';

const COMP_DEFAULT = [
  { id:1, nombre:'Dividendo',      monto:550000,  dia:5,  banco:'Scotiabank',    pagado:false, activo:true, gmailKey:'scotiabank',    fechaVence:'05-06-2026' },
  { id:2, nombre:'Gastos Comunes', monto:1148896, dia:10, banco:'',              pagado:false, activo:true, gmailKey:'gastos_comunes', fechaVence:'10-06-2026' },
  { id:3, nombre:'Celular',        monto:12990,   dia:28, banco:'Entel',         pagado:false, activo:true, gmailKey:'entel',          fechaVence:'28-05-2026' },
  { id:4, nombre:'Agua',           monto:698781,  dia:22, banco:'Aguas Andinas', pagado:false, activo:true, gmailKey:'aguas_andinas',  fechaVence:'22-06-2026' },
  { id:5, nombre:'Luz',            monto:663141,  dia:8,  banco:'Enel',          pagado:false, activo:true, gmailKey:'enel',           fechaVence:'08-06-2026' },
  { id:6, nombre:'Gas',            monto:0,       dia:18, banco:'Metrogas',      pagado:false, activo:true, gmailKey:'metrogas',       fechaVence:'' },
  { id:7, nombre:'Internet/TV',    monto:0,       dia:15, banco:'VTR',           pagado:false, activo:true, gmailKey:'vtr',            fechaVence:'' },
];

const NOW = new Date();

function diasHasta(dia) {
  const h = NOW;
  const v = new Date(h.getFullYear(), h.getMonth(), dia);
  if (v < h) v.setMonth(v.getMonth() + 1);
  return Math.ceil((v - h) / (864e5));
}

function getIcon(n) {
  const l = n.toLowerCase();
  if (l.includes('gastos comunes')) return '🏢';
  if (l.includes('luz')||l.includes('enel')) return '💡';
  if (l.includes('agua')) return '💧';
  if (l.includes('gas')) return '🔥';
  if (l.includes('dividendo')) return '🏠';
  if (l.includes('celular')||l.includes('entel')) return '📱';
  if (l.includes('internet')||l.includes('tv')||l.includes('vtr')) return '📡';
  return '📋';
}

function calcTension(compromisos, ingresos) {
  if (!ingresos) return 0;
  const pendiente = compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  return Math.min(100, Math.round((pendiente / ingresos) * 100));
}
function tensionInfo(v) {
  if (v < 50) return { label:'Zona tranquila', color:co.green, emoji:'🟢' };
  if (v < 85) return { label:'Zona de cuidado', color:co.yellow, emoji:'🟡' };
  return { label:'Zona crítica', color:co.red, emoji:'🚨' };
}

function GmailBanner({ boletas, onConfirmar, onDescartar, t, isDark }) {
  if (!boletas?.length) return null;
  return (
    <div style={{background:isDark?'linear-gradient(135deg,#064E3B,#065F46)':'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'1px solid '+co.green+'44',borderRadius:18,padding:'16px 20px',marginBottom:24}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:14}}>
        <span style={{fontSize:24}}>📨</span>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:isDark?'#ECFDF5':'#064E3B'}}>FARO detectó {boletas.length} boleta{boletas.length>1?'s':''} nueva{boletas.length>1?'s':''}</div>
          <div style={{fontSize:12,color:t.textMuted}}>¿Cargar montos en FARO?</div>
        </div>
      </div>
      {boletas.map(b=>(
        <div key={b.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 13px',background:isDark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.6)',borderRadius:10,marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:isDark?'#ECFDF5':'#064E3B'}}>{b.nombre}</div>
            {b.diaVence&&<div style={{fontSize:11,color:co.green}}>📅 Vence día {b.diaVence}</div>}
          </div>
          <div style={{fontSize:15,fontWeight:800,color:co.green}}>{fmtFull(b.monto)}</div>
        </div>
      ))}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
        <button onClick={onDescartar} style={{padding:'11px',borderRadius:12,background:'transparent',color:t.textMuted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>Ignorar</button>
        <button onClick={()=>onConfirmar(boletas)} style={{padding:'11px',borderRadius:12,background:'linear-gradient(135deg,'+co.green+',#047857)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>✓ Cargar en FARO</button>
      </div>
    </div>
  );
}

function PanoramaView({ data, onConfirmarBoletas, t, isDark }) {
  const { ingresos, compromisos, boletasGmail } = data;
  const totalComp = compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const compPag   = compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const pctCub    = totalComp>0 ? Math.min((compPag/totalComp)*100,100) : 0;
  const tension   = calcTension(compromisos, ingresos);
  const tInfo     = tensionInfo(tension);
  const proximos  = compromisos.filter(c=>c.activo&&!c.pagado&&c.monto>0).map(c=>({...c,dias:diasHasta(c.dia)})).sort((a,b)=>a.dias-b.dias);

  return (
    <div>
      <GmailBanner boletas={boletasGmail} onConfirmar={onConfirmarBoletas} onDescartar={()=>onConfirmarBoletas([])} t={t} isDark={isDark}/>
      <div style={{background:isDark?'linear-gradient(135deg,#1E3A8A,#0F172A)':'linear-gradient(135deg,#0A3A60,#005F73)',borderRadius:24,padding:24,color:'#fff',marginBottom:24,boxShadow:'0 10px 25px rgba(0,95,115,0.15)'}}>
        <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1,opacity:0.7,marginBottom:6}}>ESTE MES NECESITAS</div>
        <div style={{fontSize:36,fontWeight:900,marginBottom:16,letterSpacing:-0.5}}>{fmtFull(totalComp)}</div>
        <div style={{background:'rgba(255,255,255,0.1)',borderRadius:99,height:6,overflow:'hidden',marginBottom:10}}>
          <div style={{background:'#fff',width:`${pctCub}%`,height:'100%',borderRadius:99,transition:'width 0.5s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.9}}>
          <span>Pagado: {fmtFull(compPag)} ({Math.round(pctCub)}%)</span>
          <span>Quedan {fmtFull(totalComp-compPag)}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:20,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16}}>
          <div><div style={{fontSize:11,opacity:0.7}}>💼 Ingresos</div><div style={{fontSize:16,fontWeight:800,marginTop:2}}>{fmtFull(ingresos)}</div></div>
          <div>
            <div style={{fontSize:11,opacity:0.7}}>{ingresos-totalComp>=0?'💚 Disponible':'🔴 Faltan'}</div>
            <div style={{fontSize:16,fontWeight:800,marginTop:2,color:ingresos-totalComp>=0?'#A7F3D0':'#FCA5A5'}}>{fmtFull(Math.abs(ingresos-totalComp))}</div>
          </div>
        </div>
      </div>
      <div style={{background:t.card,borderRadius:20,padding:20,marginBottom:24,border:'1px solid '+t.border,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:t.text}}>Índice de tensión</div>
          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{tInfo.emoji} {tInfo.label}</div>
        </div>
        <div style={{width:54,height:54,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'99%',border:`3px solid ${tInfo.color}`,fontSize:16,fontWeight:900,color:tInfo.color}}>
          {tension}%
        </div>
      </div>
      {proximos.length>0&&(
        <div style={{background:t.card,borderRadius:24,padding:22,border:'1px solid '+t.border}}>
          <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>⏰ Próximos vencimientos</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {proximos.map(c=>{
              const urg=c.dias<=3, prox=c.dias<=7;
              return(
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottom:'1px solid '+t.border}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:22}}>{getIcon(c.nombre)}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
                      <div style={{fontSize:11,color:urg?co.red:prox?co.orange:t.textMuted,fontWeight:urg||prox?700:400}}>
                        {urg?`🚨 Vence en ${c.dias}d`:prox?`⏰ ${c.dias} días`:`Día ${c.dia} del mes`}
                        {c.banco?' · '+c.banco:''}
                      </div>
                    </div>
                  </div>
                  <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmtFull(c.monto)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CompromisosView({ data, setData, t }) {
  const [nuevoNombre,setNN]=useState('');
  const [nuevoMonto,setNM]=useState('');
  const [nuevoDia,setND]=useState('10');
  const [editandoSueldo,setES]=useState(false);
  const [valorSueldo,setVS]=useState('');

  const upd   = (id,p) => setData(d=>({...d,compromisos:d.compromisos.map(c=>c.id===id?{...c,...p}:c)}));
  const del   = id => setData(d=>({...d,compromisos:d.compromisos.filter(c=>c.id!==id)}));
  const toggle= id => { const c=data.compromisos.find(x=>x.id===id); upd(id,{pagado:!c.pagado}); };

  const handleAdd = e => {
    e.preventDefault();
    if(!nuevoNombre||!nuevoMonto) return;
    const newId = Math.max(0,...data.compromisos.map(c=>c.id))+1;
    setData(d=>({...d,compromisos:[...d.compromisos,{id:newId,nombre:nuevoNombre,monto:Number(nuevoMonto),dia:Number(nuevoDia),banco:'',pagado:false,activo:true,gmailKey:'',fechaVence:''}]}));
    setNN(''); setNM(''); setND('10');
  };

  const guardarSueldo = () => { setData(d=>({...d,ingresos:Number(valorSueldo)||0})); setES(false); };

  return(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>💰 Ingresos del Mes</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <div style={{fontSize:13,color:t.textMuted}}>Sueldo + comisiones</div>
          {editandoSueldo ? (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="number" value={valorSueldo} onChange={e=>setVS(e.target.value)} autoFocus
                style={{width:120,padding:'8px 12px',borderRadius:10,border:'2px solid '+co.primary,background:t.bg,color:t.text,fontWeight:800,textAlign:'right',fontSize:14}}/>
              <button onClick={guardarSueldo} style={{padding:'8px 14px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer'}}>Guardar</button>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:16,fontWeight:800,color:t.text}}>{fmtFull(data.ingresos)}</span>
              <button onClick={()=>{setVS(data.ingresos||'');setES(true);}} style={{padding:'6px 12px',borderRadius:8,background:'transparent',color:co.primary,border:'1px solid '+co.primary,fontWeight:700,fontSize:11,cursor:'pointer'}}>Modificar</button>
            </div>
          )}
        </div>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>➕ Agregar cuenta</div>
        <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
            <input type="text" placeholder="Ej: Netflix, TAG..." value={nuevoNombre} onChange={e=>setNN(e.target.value)}
              style={{padding:'10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13}}/>
            <input type="number" placeholder="Monto ($)" value={nuevoMonto} onChange={e=>setNM(e.target.value)}
              style={{padding:'10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13,fontWeight:600}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:12,color:t.textMuted}}>Vence día:</span>
              <input type="number" min="1" max="31" value={nuevoDia} onChange={e=>setND(e.target.value)}
                style={{width:55,padding:'8px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:t.text,textAlign:'center',fontSize:13}}/>
            </div>
            <button type="submit" style={{padding:'10px',borderRadius:10,background:co.primary,color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>+ Añadir</button>
          </div>
        </form>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>📋 Tus Compromisos</div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {data.compromisos.map(c=>(
            <div key={c.id} style={{paddingBottom:14,borderBottom:'1px solid '+t.border}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                  <span style={{fontSize:22,flexShrink:0}}>{getIcon(c.nombre)}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:t.text,textDecoration:c.pagado?'line-through':'none',opacity:c.pagado?0.5:1}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:t.textMuted}}>{c.banco?' '+c.banco+' ·':''} Día {c.dia} · {diasHasta(c.dia)}d</div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:c.pagado?co.green:t.text}}>{fmtFull(c.monto)}</div>
                  <div style={{display:'flex',gap:6}}>
                    <input type="number" value={c.monto===0?'':c.monto} onChange={e=>upd(c.id,{monto:Number(e.target.value)||0})}
                      placeholder="Editar monto"
                      style={{width:100,padding:'5px 8px',borderRadius:8,border:'1px solid '+t.border,background:t.bg,color:t.textMuted,fontSize:11,textAlign:'right'}}/>
                    <button onClick={()=>toggle(c.id)} style={{background:c.pagado?co.green:'transparent',color:c.pagado?'#fff':t.text,border:'1px solid '+(c.pagado?co.green:t.border),padding:'5px 10px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>
                      {c.pagado?'✓ Pag.':'Pagar'}
                    </button>
                    <button onClick={()=>del(c.id)} style={{background:'transparent',color:co.red,border:'1px solid '+co.red+'44',padding:'5px 8px',borderRadius:8,cursor:'pointer',fontSize:13}}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>setData(d=>({...d,compromisos:d.compromisos.map(c=>({...c,pagado:false}))}))}
          style={{width:'100%',marginTop:16,padding:'10px',borderRadius:12,background:'transparent',color:t.textMuted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
          🔄 Nuevo mes — reiniciar pagados
        </button>
      </div>
    </div>
  );
}

function PresupuestoView({ t }) {
  return (
    <div style={{background:t.card,borderRadius:24,padding:24,border:'1px solid '+t.border,textAlign:'center'}}>
      <span style={{fontSize:40}}>🎯</span>
      <div style={{fontSize:16,fontWeight:800,color:t.text,marginTop:12,marginBottom:8}}>Presupuesto por categoría</div>
      <div style={{fontSize:13,color:t.textMuted}}>Próximamente podrás asignar límites de gasto por categoría.</div>
    </div>
  );
}

function AjustesView({ data, setData, t, isDark, onSyncGmail }) {
  const [syncing,setSyn]=useState(false);
  const [msg,setMsg]=useState('');

  const sincronizar = async () => {
    const SB_URL="https://tiayaaxtiyqobmhojhgm.supabase.co";
    const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
    setSyn(true); setMsg('Consultando Gmail...');
    try {
      const res = await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}});
      const b = await res.json();
      if(b.length>0){ setMsg(`✅ ${b.length} boleta(s) nueva(s)`); onSyncGmail(b.map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}))); }
      else setMsg('✓ Sin boletas nuevas');
    } catch(e){ setMsg('Error: '+e.message); }
    setSyn(false);
  };

  const inp = {width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit'};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:4}}>📧 Gmail Sync</div>
        <div style={{fontSize:12,color:t.textMuted,marginBottom:14}}>URL de tu Web App en script.google.com</div>
        <input value={data.gmailWebAppUrl||''} onChange={e=>setData(d=>({...d,gmailWebAppUrl:e.target.value.trim()}))} placeholder="https://script.google.com/macros/s/..." style={{...inp,marginBottom:10}}/>
        <button onClick={sincronizar} disabled={syncing} style={{width:'100%',padding:'11px',borderRadius:12,background:syncing?t.border:'linear-gradient(135deg,'+co.green+',#047857)',color:syncing?t.textMuted:'#fff',fontWeight:700,border:'none',cursor:syncing?'not-allowed':'pointer',fontFamily:'inherit',fontSize:14}}>
          {syncing?'⏳ Consultando...':'🔄 Sincronizar Gmail ahora'}
        </button>
        {msg&&<div style={{marginTop:8,fontSize:12,color:msg.startsWith('✅')||msg.startsWith('✓')?co.green:co.red,textAlign:'center',fontWeight:600}}>{msg}</div>}
      </div>
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>💬 WhatsApp Alertas</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:4}}>TU NÚMERO</div><input value={data.telefono||''} onChange={e=>setData(d=>({...d,telefono:e.target.value}))} placeholder="+56912345678" style={inp}/></div>
          <div><div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:4}}>API KEY (CallMeBot)</div><input value={data.whatsappKey||''} onChange={e=>setData(d=>({...d,whatsappKey:e.target.value}))} placeholder="Ej: 123456" style={inp}/></div>
        </div>
      </div>
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>👤 Cuenta</div>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,'+co.primary+','+co.secondary+')',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',margin:'0 auto 8px'}}>C</div>
          <div style={{fontSize:16,fontWeight:700,color:t.text}}>Cristian</div>
          <div style={{fontSize:12,color:t.textMuted}}>Usuario FARO</div>
        </div>
        <button onClick={()=>{if(window.confirm('¿Borrar todos los datos de FARO?')){setData(d=>({...d,compromisos:COMP_DEFAULT,ingresos:1200000,gastos:[],boletasGmail:[]}));}}}
          style={{width:'100%',padding:'11px',borderRadius:12,background:'rgba(231,111,81,0.08)',color:co.red,border:'1px solid '+co.red+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>
          🔄 Resetear FARO
        </button>
      </div>
    </div>
  );
}

export default function FaroApp() {
  const [isDark,setIsDark]=useState(false);
  const [activeTab,setTab]=useState('panorama');
  const [loaded,setLoaded]=useState(false);
  const [data,setData]=useState({
    ingresos:1200000, telefono:'', whatsappKey:'', gmailWebAppUrl:'', boletasGmail:[],
    compromisos:COMP_DEFAULT, gastos:[],
  });

  const t = {
    bg:        isDark?co.bgDark:co.bgLight,
    card:      isDark?co.cardDark:co.cardLight,
    text:      isDark?co.textDark:co.textLight,
    textMuted: isDark?co.textMutedDark:co.textMutedLight,
    border:    isDark?co.borderDark:co.borderLight,
  };

  useEffect(()=>{
    Promise.all([S.get('faro_data',null),S.get('faro_dark',false)]).then(([d,dk])=>{
      if(d) setData(prev=>({...prev,...d}));
      setIsDark(dk); setLoaded(true);
    });
  },[]);

  useEffect(()=>{ if(loaded) S.set('faro_data',data); },[data,loaded]);
  useEffect(()=>{ if(loaded) S.set('faro_dark',isDark); },[isDark,loaded]);

  useEffect(()=>{
    if(!loaded||!data.gmailWebAppUrl) return;
    const SB_URL="https://tiayaaxtiyqobmhojhgm.supabase.co";
    const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";
    fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}})
      .then(r=>r.json()).then(b=>{ if(b?.length>0) setData(d=>({...d,boletasGmail:b.map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}))})); })
      .catch(()=>{});
  },[loaded]);

  const confirmarBoletas = boletas => {
    if(!boletas.length){ setData(d=>({...d,boletasGmail:[]})); return; }
    setData(d=>({
      ...d,
      compromisos: d.compromisos.map(comp=>{
        const match = boletas.find(b=>b.key===comp.gmailKey);
        if(match&&match.monto>0){
          const patch = {monto:match.monto};
          if(match.diaVence) patch.dia = match.diaVence;
          return {...comp,...patch};
        }
        return comp;
      }),
      boletasGmail:[],
    }));
    setTab('panorama');
  };

  if(!loaded) return(
    <div style={{minHeight:'100vh',background:co.primary,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif'}}>
      <div style={{fontSize:56,marginBottom:12}}>🔦</div>
      <div style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:-1}}>FARO</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:6}}>Tu copiloto financiero</div>
    </div>
  );

  return (
    <div style={{background:t.bg,minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',paddingBottom:80,transition:'background 0.3s'}}>
      <div style={{maxWidth:440,margin:'0 auto',padding:'16px 16px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:co.primary,width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:18,color:'#fff'}}>🔦</span>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:t.text,letterSpacing:-0.5}}>FARO</div>
              <div style={{fontSize:10,fontWeight:700,color:t.textMuted}}>COPILOTO FINANCIERO</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {data.boletasGmail?.length>0&&(
              <div onClick={()=>setTab('panorama')} style={{width:22,height:22,borderRadius:'50%',background:co.green,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',cursor:'pointer'}}>
                {data.boletasGmail.length}
              </div>
            )}
            <button onClick={()=>setIsDark(d=>!d)} style={{background:t.card,border:'1px solid '+t.border,borderRadius:99,width:44,height:24,padding:2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:isDark?'flex-end':'flex-start'}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:isDark?co.secondary:co.yellow}}/>
            </button>
          </div>
        </div>
        <div style={{fontSize:12,color:t.textMuted,fontWeight:600}}>
          {NOW.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}
        </div>
        <div style={{fontSize:24,fontWeight:900,color:t.text,marginTop:4,marginBottom:24}}>Hola, Cristian 🔦</div>

        {activeTab==='panorama'   &&<PanoramaView    data={data} onConfirmarBoletas={confirmarBoletas} t={t} isDark={isDark}/>}
        {activeTab==='compromisos'&&<CompromisosView data={data} setData={setData} t={t} isDark={isDark}/>}
        {activeTab==='presupuesto'&&<PresupuestoView t={t}/>}
        {activeTab==='ajustes'    &&<AjustesView     data={data} setData={setData} t={t} isDark={isDark} onSyncGmail={b=>{setData(d=>({...d,boletasGmail:b}));setTab('panorama');}}/>}
      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:t.card,borderTop:'1px solid '+t.border,height:68,display:'flex',justifyContent:'space-around',alignItems:'center',zIndex:100}}>
        {[['panorama','🔦','Panorama'],['compromisos','📋','Compromisos'],['presupuesto','🎯','Presupuesto'],['ajustes','⚙️','Ajustes']].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{background:'none',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',color:activeTab===id?co.primary:t.textMuted}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:activeTab===id?800:500}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
