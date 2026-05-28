'use client';
import React, { useState, useEffect } from 'react';

// ── STORAGE ──
const S = {
  isArtifact: typeof window !== "undefined" && typeof window.storage !== "undefined",
  async get(k,d){ try{ if(this.isArtifact){ const r=await window.storage.get(k); return r?JSON.parse(r.value):d; } const r=localStorage.getItem(k); return r?JSON.parse(r):d; }catch{ return d; } },
  async set(k,v){ try{ if(this.isArtifact){ await window.storage.set(k,JSON.stringify(v)); } else { localStorage.setItem(k,JSON.stringify(v)); } }catch{} },
};

// ── Supabase hardcodeado (sin URL manual) ──
const SB_URL = "https://tiayaaxtiyqobmhojhgm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYXlhYXh0aXlxb2JtaG9qaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4NTUsImV4cCI6MjA5NTM5ODg1NX0.bB4XQQni1z3Jn8odCmLTGqbATJS_iNsfeifDA81T0pE";

const co = {
  bgLight:'#F4F7F6', bgDark:'#0D1B2A',
  cardLight:'#FFFFFF', cardDark:'#1B263B',
  textLight:'#1E293B', textDark:'#E2E8F0',
  textMutedLight:'#64748B', textMutedDark:'#94A3B8',
  primary:'#005F73', secondary:'#0A9396',
  green:'#2A9D8F', yellow:'#E9C46A', orange:'#F4A261', red:'#E76F51',
  borderLight:'#E2E8F0', borderDark:'#2C3E50'
};

const fmtFull = v => v ? '$' + Math.round(Math.abs(v)).toLocaleString('es-CL') : '$0';
const NOW = new Date();
const MES_ACTUAL = NOW.getMonth();
const AÑO_ACTUAL = NOW.getFullYear();

const COMP_DEFAULT = [
  { id:1, nombre:'Dividendo',      monto:550000,  dia:5,  banco:'Scotiabank',    pagado:false, activo:true, gmailKey:'scotiabank'    },
  { id:2, nombre:'Gastos Comunes', monto:1148896, dia:10, banco:'',              pagado:false, activo:true, gmailKey:'gastos_comunes'},
  { id:3, nombre:'Celular',        monto:12990,   dia:28, banco:'Entel',         pagado:false, activo:true, gmailKey:'entel'         },
  { id:4, nombre:'Agua',           monto:698781,  dia:22, banco:'Aguas Andinas', pagado:false, activo:true, gmailKey:'aguas_andinas' },
  { id:5, nombre:'Luz',            monto:663141,  dia:8,  banco:'Enel',          pagado:false, activo:true, gmailKey:'enel'          },
  { id:6, nombre:'Gas',            monto:0,       dia:18, banco:'Metrogas',      pagado:false, activo:true, gmailKey:'metrogas'      },
  { id:7, nombre:'Internet/TV',    monto:0,       dia:15, banco:'VTR',           pagado:false, activo:true, gmailKey:'vtr'           },
];

const CATS_DEFAULT = [
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

function diasHasta(dia) {
  const v = new Date(NOW.getFullYear(), NOW.getMonth(), dia);
  if (v < NOW) v.setMonth(v.getMonth() + 1);
  return Math.ceil((v - NOW) / (864e5));
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
function calcTension(compromisos, ingresos, gastosMes) {
  if (!ingresos) return 0;
  const comp = compromisos.filter(c=>c.activo&&!c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  return Math.min(100, Math.round(((comp+gastosMes)/ingresos)*100));
}
function tensionInfo(v) {
  if (v<50) return {label:'Zona tranquila', color:co.green,  emoji:'🟢'};
  if (v<85) return {label:'Zona de cuidado',color:co.yellow, emoji:'🟡'};
  return           {label:'Zona crítica',   color:co.red,    emoji:'🚨'};
}

// ── BANNER GMAIL ──
function GmailBanner({boletas, onConfirmar, onDescartar, t, isDark}) {
  if (!boletas?.length) return null;
  return (
    <div style={{background:isDark?'linear-gradient(135deg,#064E3B,#065F46)':'linear-gradient(135deg,#ECFDF5,#D1FAE5)',border:'1px solid '+co.green+'44',borderRadius:18,padding:'16px',marginBottom:24}}>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <span style={{fontSize:24}}>📨</span>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:isDark?'#ECFDF5':'#064E3B'}}>FARO detectó {boletas.length} boleta{boletas.length>1?'s':''} nueva{boletas.length>1?'s':''}</div>
          <div style={{fontSize:12,color:t.textMuted}}>Confirmar carga automática de montos</div>
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

// ── PANORAMA ──
function PanoramaView({data, onConfirmarBoletas, t, isDark}) {
  const {ingresos, compromisos, boletasGmail, gastos} = data;

  const mesG   = gastos.filter(g=>{const d=new Date(g.fecha);return d.getMonth()===MES_ACTUAL&&d.getFullYear()===AÑO_ACTUAL;});
  const egreso = mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const ingAd  = mesG.filter(g=>g.tipo==='ingreso').reduce((s,g)=>s+g.monto,0);
  const ingTotal = ingresos + ingAd;

  const totalComp = compromisos.filter(c=>c.activo).reduce((s,c)=>s+Number(c.monto||0),0);
  const compPag   = compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);
  const totalSal  = compPag + egreso;
  const disponible = ingTotal - totalSal - (totalComp - compPag);
  const pctCub    = totalComp>0?Math.min((compPag/totalComp)*100,100):0;
  const tension   = calcTension(compromisos, ingTotal, egreso);
  const tInfo     = tensionInfo(tension);
  const proximos  = compromisos.filter(c=>c.activo&&!c.pagado&&c.monto>0).map(c=>({...c,dias:diasHasta(c.dia)})).sort((a,b)=>a.dias-b.dias);

  return (
    <div>
      <GmailBanner boletas={boletasGmail} onConfirmar={onConfirmarBoletas} onDescartar={()=>onConfirmarBoletas([])} t={t} isDark={isDark}/>

      {/* Hero */}
      <div style={{background:isDark?'linear-gradient(135deg,#1E3A8A,#0F172A)':'linear-gradient(135deg,#0A3A60,#005F73)',borderRadius:24,padding:24,color:'#fff',marginBottom:20,boxShadow:'0 10px 25px rgba(0,95,115,0.15)'}}>
        <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:1,opacity:0.7,marginBottom:4}}>ESTE MES NECESITAS</div>
        <div style={{fontSize:34,fontWeight:900,marginBottom:14,letterSpacing:-0.5}}>{fmtFull(totalComp)}</div>
        <div style={{background:'rgba(255,255,255,0.1)',borderRadius:99,height:5,overflow:'hidden',marginBottom:8}}>
          <div style={{background:'#fff',width:`${pctCub}%`,height:'100%',borderRadius:99,transition:'width 0.5s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:0.8,marginBottom:16}}>
          <span>Pagado: {fmtFull(compPag)} ({Math.round(pctCub)}%)</span>
          <span>Pendiente: {fmtFull(totalComp-compPag)}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:14}}>
          {[
            ['💼 Ingresos', fmtFull(ingTotal), '#fff'],
            [disponible>=0?'💚 Disponible':'🔴 Faltan', fmtFull(Math.abs(disponible)), disponible>=0?'#A7F3D0':'#FCA5A5'],
            ['💸 Gastado', fmtFull(egreso), '#FCA5A5'],
          ].map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:9,opacity:0.7,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* Tensión */}
      <div style={{background:t.card,borderRadius:20,padding:18,marginBottom:20,border:'1px solid '+t.border,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:t.text}}>Índice de tensión</div>
          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{tInfo.emoji} {tInfo.label}</div>
          <div style={{fontSize:11,color:t.textMuted,marginTop:4}}>Compromisos + gastos vs ingresos</div>
        </div>
        <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'99%',border:`3px solid ${tInfo.color}`,fontSize:15,fontWeight:900,color:tInfo.color}}>{tension}%</div>
      </div>

      {/* Próximos vencimientos */}
      {proximos.length>0&&(
        <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
          <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>⏰ Próximos vencimientos</div>
          {proximos.map((c,i)=>{
            const urg=c.dias<=3,prox=c.dias<=7;
            return(
              <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:12,borderBottom:i<proximos.length-1?'1px solid '+t.border:'none',marginBottom:i<proximos.length-1?12:0}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:22}}>{getIcon(c.nombre)}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:urg?co.red:prox?co.orange:t.textMuted,fontWeight:urg||prox?700:400}}>
                      {urg?`🚨 Vence en ${c.dias}d`:prox?`⏰ ${c.dias} días`:`Día ${c.dia} del mes`}{c.banco?' · '+c.banco:''}
                    </div>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:t.text}}>{fmtFull(c.monto)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── COMPROMISOS ──
function CompromisosView({data, setData, t}) {
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
    setData(d=>({...d,compromisos:[...d.compromisos,{id:newId,nombre:nuevoNombre,monto:Number(nuevoMonto),dia:Number(nuevoDia),banco:'',pagado:false,activo:true,gmailKey:''}]}));
    setNN(''); setNM(''); setND('10');
  };

  return(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>💰 Ingresos del Mes</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <div style={{fontSize:13,color:t.textMuted}}>Sueldo base</div>
          {editandoSueldo?(
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="number" value={valorSueldo} onChange={e=>setVS(e.target.value)} autoFocus
                style={{width:130,padding:'8px 12px',borderRadius:10,border:'2px solid '+co.primary,background:t.bg,color:t.text,fontWeight:800,textAlign:'right',fontSize:14}}/>
              <button onClick={()=>{setData(d=>({...d,ingresos:Number(valorSueldo)||0}));setES(false);}} style={{padding:'8px 14px',borderRadius:10,background:co.green,color:'#fff',border:'none',fontWeight:700,cursor:'pointer'}}>OK</button>
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:16,fontWeight:800,color:t.text}}>{fmtFull(data.ingresos)}</span>
              <button onClick={()=>{setVS(data.ingresos||'');setES(true);}} style={{padding:'6px 12px',borderRadius:8,background:'transparent',color:co.primary,border:'1px solid '+co.primary,fontWeight:700,fontSize:11,cursor:'pointer'}}>Modificar</button>
            </div>
          )}
        </div>
      </div>

      <div style={{background:t.card,borderRadius:24,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>➕ Agregar compromiso</div>
        <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
            <input type="text" placeholder="Ej: Netflix, TAG..." value={nuevoNombre} onChange={e=>setNN(e.target.value)}
              style={{padding:'10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13}}/>
            <input type="number" placeholder="Monto" value={nuevoMonto} onChange={e=>setNM(e.target.value)}
              style={{padding:'10px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:13}}/>
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
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {data.compromisos.map(c=>(
            <div key={c.id} style={{paddingBottom:14,borderBottom:'1px solid '+t.border}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
                  <span style={{fontSize:22}}>{getIcon(c.nombre)}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text,textDecoration:c.pagado?'line-through':'none',opacity:c.pagado?0.5:1}}>{c.nombre}</div>
                    <div style={{fontSize:11,color:t.textMuted}}>{c.banco?' '+c.banco+' ·':''} Día {c.dia} · {diasHasta(c.dia)}d</div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                  <div style={{fontSize:15,fontWeight:800,color:c.pagado?co.green:t.text}}>{fmtFull(c.monto)}</div>
                  <div style={{display:'flex',gap:5}}>
                    <input type="number" value={c.monto===0?'':c.monto} onChange={e=>upd(c.id,{monto:Number(e.target.value)||0})}
                      placeholder="Editar" style={{width:90,padding:'4px 7px',borderRadius:7,border:'1px solid '+t.border,background:t.bg,color:t.textMuted,fontSize:11,textAlign:'right'}}/>
                    <button onClick={()=>toggle(c.id)} style={{background:c.pagado?co.green:'transparent',color:c.pagado?'#fff':t.text,border:'1px solid '+(c.pagado?co.green:t.border),padding:'4px 9px',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700}}>
                      {c.pagado?'✓ Pag.':'Pagar'}
                    </button>
                    <button onClick={()=>del(c.id)} style={{background:'transparent',color:co.red,border:'1px solid '+co.red+'33',padding:'4px 7px',borderRadius:7,cursor:'pointer',fontSize:12}}>🗑️</button>
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

// ── GASTOS (movimientos bancarios) ──
function GastosView({data, setData, t, isDark}) {
  const {gastos, categorias, compromisos} = data;
  const [modalTipo,setModalTipo] = useState(null); // 'gasto'|'ingreso'|null
  const [showAddCat,setShowAddCat] = useState(false);
  const [nuevaCat,setNuevaCat]   = useState('');
  const [iconSel,setIconSel]     = useState('📦');
  const [colorSel,setColorSel]   = useState('#94A3B8');
  const [expandCat,setExpandCat] = useState(null);
  const [filtro,setFiltro]       = useState('todo'); // 'todo'|'gasto'|'ingreso'

  const ICONOS  = ['🛒','🍽️','☕','⛽','🏋️','💰','🛍️','💊','🎬','📦','🚗','✈️','🎮','🐾','💇','📚','🍺','🎁','💼','🏆'];
  const COLORES = ['#3B82F6','#F59E0B','#D97706','#10B981','#8B5CF6','#059669','#EC4899','#7C3AED','#EF4444','#94A3B8','#005F73','#F97316'];

  const mesG      = gastos.filter(g=>{const d=new Date(g.fecha);return d.getMonth()===MES_ACTUAL&&d.getFullYear()===AÑO_ACTUAL;});
  const totalGast = mesG.filter(g=>g.tipo==='gasto').reduce((s,g)=>s+g.monto,0);
  const totalIng  = mesG.filter(g=>g.tipo==='ingreso').reduce((s,g)=>s+g.monto,0);
  const compPag   = compromisos.filter(c=>c.pagado).reduce((s,c)=>s+Number(c.monto||0),0);

  const delCat   = id => { if(window.confirm('¿Eliminar categoría?')) setData(d=>({...d,categorias:d.categorias.filter(c=>c.id!==id),gastos:d.gastos.filter(g=>g.catId!==id)})); };
  const delGasto = id => setData(d=>({...d,gastos:d.gastos.filter(g=>g.id!==id)}));
  const addCat   = () => {
    if(!nuevaCat.trim()) return;
    setData(d=>({...d,categorias:[...d.categorias,{id:'cat_'+Date.now(),nombre:nuevaCat,icon:iconSel,color:colorSel}]}));
    setNuevaCat(''); setShowAddCat(false);
  };

  const listaFiltrada = filtro==='todo' ? mesG : mesG.filter(g=>g.tipo===filtro);

  return(
    <div>
      {/* Resumen */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
        {[
          {label:'Gastado',  val:totalGast,  color:co.red,    bg:'rgba(231,111,81,0.08)'},
          {label:'Ingresos', val:totalIng,   color:co.green,  bg:'rgba(42,157,143,0.08)'},
          {label:'Cuentas ✓',val:compPag,    color:co.primary,bg:'rgba(0,95,115,0.08)'},
        ].map(({label,val,color,bg})=>(
          <div key={label} style={{background:bg,borderRadius:16,padding:'14px 10px',textAlign:'center',border:'1px solid '+color+'22'}}>
            <div style={{fontSize:10,color,fontWeight:700,marginBottom:4}}>{label}</div>
            <div style={{fontSize:14,fontWeight:900,color}}>{fmtFull(val)}</div>
          </div>
        ))}
      </div>

      {/* Botones */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        <button onClick={()=>setModalTipo('gasto')} style={{padding:'14px',borderRadius:14,background:co.red,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
          ↗ Agregar gasto
        </button>
        <button onClick={()=>setModalTipo('ingreso')} style={{padding:'14px',borderRadius:14,background:co.green,color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
          ↙ Agregar ingreso
        </button>
      </div>

      {/* Agregar categoría */}
      <button onClick={()=>setShowAddCat(!showAddCat)} style={{width:'100%',padding:'11px',borderRadius:12,background:'transparent',color:co.primary,border:'2px solid '+co.primary,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginBottom:16}}>
        + Nueva categoría
      </button>

      {showAddCat&&(
        <div style={{background:t.card,borderRadius:16,padding:16,border:'1px solid '+t.border,marginBottom:16}}>
          <input value={nuevaCat} onChange={e=>setNuevaCat(e.target.value)} placeholder="Nombre (ej: Uber, Streaming...)"
            style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,marginBottom:10}}/>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:6}}>ÍCONO</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {ICONOS.map(ic=><button key={ic} onClick={()=>setIconSel(ic)} style={{width:34,height:34,borderRadius:8,border:`2px solid ${iconSel===ic?co.primary:t.border}`,background:iconSel===ic?co.primary+'18':t.bg,fontSize:17,cursor:'pointer'}}>{ic}</button>)}
          </div>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:6}}>COLOR</div>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {COLORES.map(c=><button key={c} onClick={()=>setColorSel(c)} style={{width:28,height:28,borderRadius:'50%',background:c,border:`3px solid ${colorSel===c?t.text:'transparent'}`,cursor:'pointer'}}/>)}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addCat} style={{flex:1,padding:'10px',borderRadius:10,background:co.primary,color:'#fff',border:'none',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Crear</button>
            <button onClick={()=>setShowAddCat(false)} style={{padding:'10px 14px',borderRadius:10,background:'transparent',color:t.textMuted,border:'1px solid '+t.border,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
          </div>
        </div>
      )}

      {/* Categorías con totales */}
      {categorias.map(cat=>{
        const gastosCat = mesG.filter(g=>g.catId===cat.id);
        const total     = gastosCat.reduce((s,g)=>s+g.monto,0);
        const isExp     = expandCat===cat.id;
        return(
          <div key={cat.id} style={{background:t.card,borderRadius:16,marginBottom:10,border:'1px solid '+t.border,overflow:'hidden'}}>
            <div onClick={()=>setExpandCat(isExp?null:cat.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer'}}>
              <div style={{width:40,height:40,borderRadius:12,background:cat.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{cat.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:t.text}}>{cat.nombre}</div>
                <div style={{fontSize:11,color:t.textMuted}}>{gastosCat.length} movimiento{gastosCat.length!==1?'s':''}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:16,fontWeight:800,color:total>0?cat.color:t.textMuted}}>{fmtFull(total)}</div>
                {totalGast>0&&total>0&&<div style={{fontSize:10,color:t.textMuted}}>{Math.round((total/totalGast)*100)}%</div>}
              </div>
              <span style={{fontSize:14,color:t.textMuted,marginLeft:4,transform:isExp?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s',display:'inline-block'}}>⌄</span>
            </div>
            {totalGast>0&&total>0&&(
              <div style={{height:3,background:t.border,margin:'0 16px 10px'}}>
                <div style={{height:'100%',width:`${Math.min((total/totalGast)*100,100)}%`,background:cat.color,borderRadius:2}}/>
              </div>
            )}
            {isExp&&(
              <div style={{borderTop:'1px solid '+t.border,padding:'8px 16px 14px'}}>
                {gastosCat.length===0
                  ?<div style={{fontSize:12,color:t.textMuted,textAlign:'center',padding:'10px 0'}}>Sin movimientos este mes</div>
                  :gastosCat.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(g=>(
                    <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid '+t.border+'55'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:t.text}}>{g.desc||'Sin descripción'}</div>
                        <div style={{fontSize:10,color:t.textMuted}}>{g.fecha} · {g.tipo==='ingreso'?'💚 Ingreso':'❤️ Gasto'}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{fontSize:14,fontWeight:700,color:g.tipo==='ingreso'?co.green:t.text}}>{g.tipo==='ingreso'?'+':''}{fmtFull(g.monto)}</div>
                        <button onClick={()=>delGasto(g.id)} style={{background:'transparent',color:co.red,border:'none',cursor:'pointer',fontSize:14}}>✕</button>
                      </div>
                    </div>
                  ))
                }
                <button onClick={()=>setModalTipo('gasto')} style={{width:'100%',marginTop:8,padding:'8px',borderRadius:10,background:cat.color+'18',color:cat.color,border:'1px solid '+cat.color+'33',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:700}}>
                  + Agregar a {cat.nombre}
                </button>
                <button onClick={()=>delCat(cat.id)} style={{width:'100%',marginTop:6,padding:'7px',borderRadius:9,background:'transparent',color:co.red,border:'1px solid '+co.red+'22',cursor:'pointer',fontFamily:'inherit',fontSize:11}}>
                  🗑️ Eliminar categoría
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Todos los movimientos */}
      {mesG.length>0&&(
        <div style={{background:t.card,borderRadius:20,padding:18,border:'1px solid '+t.border,marginTop:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:800,color:t.text}}>Todos los movimientos</div>
            <div style={{display:'flex',gap:6}}>
              {[['todo','Todo'],['gasto','Gastos'],['ingreso','Ingresos']].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltro(v)} style={{padding:'4px 10px',borderRadius:20,border:'1px solid '+(filtro===v?co.primary:t.border),background:filtro===v?co.primary+'18':'transparent',color:filtro===v?co.primary:t.textMuted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
          </div>
          {listaFiltrada.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(g=>{
            const cat = categorias.find(c=>c.id===g.catId);
            return(
              <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:10,marginBottom:10,borderBottom:'1px solid '+t.border+'66'}}>
                <div style={{width:36,height:36,borderRadius:10,background:(cat?.color||'#94A3B8')+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{cat?.icon||'📦'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.text}}>{g.desc||cat?.nombre||'Sin descripción'}</div>
                  <div style={{fontSize:10,color:t.textMuted}}>{g.fecha} · {cat?.nombre}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:g.tipo==='ingreso'?co.green:t.text}}>{g.tipo==='ingreso'?'+':'-'}{fmtFull(g.monto)}</div>
                <button onClick={()=>delGasto(g.id)} style={{background:'transparent',color:co.red,border:'none',cursor:'pointer',fontSize:13}}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {modalTipo&&<ModalMovimiento tipo={modalTipo} data={data} setData={setData} t={t} isDark={isDark} onClose={()=>setModalTipo(null)} precat={expandCat}/>}
    </div>
  );
}

// ── MODAL MOVIMIENTO (Gasto / Ingreso) ──
function ModalMovimiento({tipo:tipoInicial, data, setData, t, isDark, onClose, precat}) {
  const [tipo,setTipo]   = useState(tipoInicial);
  const [monto,setMonto] = useState('');
  const [desc,setDesc]   = useState('');
  const [catId,setCatId] = useState(precat||data.categorias[0]?.id||'otros');
  const [fecha,setFecha] = useState(NOW.toISOString().split('T')[0]);

  const guardar = () => {
    if(!monto) return;
    setData(d=>({...d, gastos:[{id:Date.now(),tipo,catId,monto:Number(monto),desc,fecha,origen:'manual'},...d.gastos]}));
    onClose();
  };

  const inp = {width:'100%',boxSizing:'border-box',padding:'11px 13px',borderRadius:11,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit',outline:'none'};
  const colorActivo = tipo==='gasto'?co.red:co.green;

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-end',zIndex:300,backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:440,margin:'0 auto',background:t.card,borderRadius:'24px 24px 0 0',padding:'20px 16px 44px',maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:t.border,borderRadius:2,margin:'0 auto 16px'}}/>

        {/* Selector tipo */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[['gasto','↗ Gasto',co.red],['ingreso','↙ Ingreso',co.green]].map(([v,l,c])=>(
            <button key={v} onClick={()=>setTipo(v)} style={{padding:'12px',borderRadius:14,border:`2px solid ${tipo===v?c:t.border}`,background:tipo===v?c+'18':t.bg,color:tipo===v?c:t.textMuted,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>

        {/* Monto grande */}
        <div style={{textAlign:'center',marginBottom:18,background:t.bg,borderRadius:16,padding:'16px'}}>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:6}}>MONTO ($)</div>
          <input type="number" placeholder="0" value={monto} onChange={e=>setMonto(e.target.value)} autoFocus
            style={{...inp,fontSize:36,fontWeight:900,textAlign:'center',border:'none',background:'transparent',color:colorActivo}}/>
          {monto&&<div style={{fontSize:13,color:t.textMuted,marginTop:4}}>{fmtFull(Number(monto))}</div>}
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:6}}>DESCRIPCIÓN</div>
          <input placeholder={tipo==='gasto'?'Ej: Copec, Sushi, Supermercado...':'Ej: Sueldo mayo, Comisión...'} value={desc} onChange={e=>setDesc(e.target.value)} style={inp}/>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:8}}>CATEGORÍA</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {data.categorias.map(c=>(
              <button key={c.id} onClick={()=>setCatId(c.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 11px',borderRadius:20,border:`1.5px solid ${catId===c.id?c.color:t.border}`,background:catId===c.id?c.color+'18':t.bg,color:catId===c.id?c.color:t.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                {c.icon} {c.nombre}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:6}}>FECHA</div>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
        </div>

        <button onClick={guardar} disabled={!monto} style={{width:'100%',padding:'15px',borderRadius:14,border:'none',background:!monto?t.border:`linear-gradient(135deg,${colorActivo},${colorActivo}99)`,color:!monto?t.textMuted:'#fff',fontSize:16,fontWeight:800,cursor:!monto?'not-allowed':'pointer',fontFamily:'inherit'}}>
          {tipo==='gasto'?'Guardar gasto':'Guardar ingreso'}
        </button>
      </div>
    </div>
  );
}

// ── AJUSTES ──
function AjustesView({data, setData, t, isDark, onSyncGmail, onConectarBanco, onSyncBanco}) {
  const [syncing,setSyn] = useState(false);
  const [msg,setMsg]     = useState('');

  // Sync directo a Apps Script (si tiene URL) o Supabase como fallback
  const sincronizar = async () => {
    setSyn(true); setMsg('🔦 Buscando boletas...');
    try {
      let boletas = [];
      if(data.gmailWebAppUrl) {
        // Llama directo al Apps Script → datos frescos
        const res  = await fetch(data.gmailWebAppUrl);
        const json = await res.json();
        boletas = (json.data||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.diaVence||null}));
      } else {
        // Fallback: Supabase
        const res = await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}});
        const b = await res.json();
        boletas = (b||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}));
      }
      if(boletas.length>0){ setMsg(`✅ ${boletas.length} boleta(s) detectada(s)`); onSyncGmail(boletas); }
      else setMsg('✓ Sin boletas nuevas');
    } catch(e){ setMsg('Error: '+e.message); }
    setSyn(false);
  };

  const inp = {width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid '+t.border,background:t.bg,color:t.text,fontSize:14,fontFamily:'inherit'};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Gmail */}
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:800,color:t.text}}>📧 Gmail Sync</div>
          <div style={{fontSize:11,fontWeight:700,color:co.green}}>✓ Activo</div>
        </div>
        <div style={{fontSize:12,color:t.textMuted,marginBottom:14}}>Se sincroniza automáticamente al abrir FARO</div>
        <button onClick={sincronizar} disabled={syncing} style={{width:'100%',padding:'11px',borderRadius:12,background:syncing?t.border:'linear-gradient(135deg,'+co.green+',#047857)',color:syncing?t.textMuted:'#fff',fontWeight:700,border:'none',cursor:syncing?'not-allowed':'pointer',fontFamily:'inherit',fontSize:14,marginBottom:10}}>
          {syncing?'⏳ Buscando...':'🔄 Sincronizar ahora'}
        </button>
        {msg&&<div style={{fontSize:12,color:msg.startsWith('✅')||msg.startsWith('✓')?co.green:co.red,textAlign:'center',fontWeight:600,marginBottom:10}}>{msg}</div>}
        {/* URL opcional (avanzado) */}
        <details style={{cursor:'pointer'}}>
          <summary style={{fontSize:11,color:t.textMuted,fontWeight:600,listStyle:'none'}}>⚙️ Configuración avanzada</summary>
          <div style={{marginTop:10}}>
            <div style={{fontSize:11,color:t.textMuted,marginBottom:6}}>URL de tu Apps Script (opcional)</div>
            <input value={data.gmailWebAppUrl||''} onChange={e=>setData(d=>({...d,gmailWebAppUrl:e.target.value.trim()}))} placeholder="https://script.google.com/macros/s/..." style={{...inp,fontSize:12}}/>
          </div>
        </details>
      </div>

      {/* WhatsApp */}
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:14}}>💬 WhatsApp Alertas</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:4}}>TU NÚMERO</div><input value={data.telefono||''} onChange={e=>setData(d=>({...d,telefono:e.target.value}))} placeholder="+56912345678" style={inp}/></div>
          <div><div style={{fontSize:11,color:t.textMuted,fontWeight:700,marginBottom:4}}>API KEY (CallMeBot)</div><input value={data.whatsappKey||''} onChange={e=>setData(d=>({...d,whatsappKey:e.target.value}))} placeholder="Ej: 123456" style={inp}/></div>
        </div>
      </div>

      {/* Banco — Fintoc real */}
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:800,color:t.text}}>🏦 Conectar Banco</div>
          <div style={{fontSize:11,fontWeight:700,color:co.green,background:'rgba(42,157,143,0.12)',padding:'3px 8px',borderRadius:20}}>Beta</div>
        </div>
        <div style={{fontSize:12,color:t.textMuted,marginBottom:14}}>Conecta Santander o Scotiabank — FARO detecta tus pagos y los marca automáticamente</div>
        <button
          onClick={onConectarBanco}
          style={{width:'100%',padding:'13px',borderRadius:12,background:'linear-gradient(135deg,#E31837,#B5001F)',color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>
          🔴 Conectar Santander
        </button>
        <button
          onClick={onConectarBanco}
          style={{width:'100%',padding:'13px',borderRadius:12,background:'linear-gradient(135deg,#F4821F,#C46200)',color:'#fff',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',marginBottom:12}}>
          🟠 Conectar Scotiabank
        </button>
        {data.fintocLinks?.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
            {data.fintocLinks.map((l,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:co.green+'0F',borderRadius:12,border:'1px solid '+co.green+'33'}}>
                <div style={{fontSize:13,fontWeight:600,color:t.text}}>✅ {l.banco||'Banco conectado'}</div>
                <button onClick={()=>onSyncBanco(l.token)} style={{fontSize:11,fontWeight:700,color:co.primary,background:'transparent',border:'1px solid '+co.primary+'33',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontFamily:'inherit'}}>Sync</button>
              </div>
            ))}
          </div>
        )}
        <div style={{padding:'10px 12px',background:'rgba(0,95,115,0.06)',borderRadius:10,border:'1px solid '+co.primary+'22'}}>
          <div style={{fontSize:11,color:co.primary,fontWeight:700,marginBottom:2}}>🔦 Cómo funciona</div>
          <div style={{fontSize:11,color:t.textMuted,lineHeight:1.5}}>Al conectar tu banco, FARO detecta pagos de Enel, Agua, Entel, etc. y los marca como pagados automáticamente.</div>
        </div>
      </div>

      {/* Cuenta */}
      <div style={{background:t.card,borderRadius:20,padding:20,border:'1px solid '+t.border}}>
        <div style={{fontSize:15,fontWeight:800,color:t.text,marginBottom:16}}>👤 Cuenta</div>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,'+co.primary+','+co.secondary+')',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',margin:'0 auto 8px'}}>C</div>
          <div style={{fontSize:16,fontWeight:700,color:t.text}}>Cristian</div>
          <div style={{fontSize:12,color:t.textMuted}}>{data.gastos.length} movimientos · {data.categorias.length} categorías</div>
        </div>
        <button onClick={()=>{if(window.confirm('¿Borrar todos los datos?')){setData(d=>({...d,compromisos:COMP_DEFAULT,ingresos:1200000,gastos:[],categorias:CATS_DEFAULT,boletasGmail:[]}));}}}
          style={{width:'100%',padding:'11px',borderRadius:12,background:'rgba(231,111,81,0.08)',color:co.red,border:'1px solid '+co.red+'33',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700}}>
          🔄 Resetear FARO
        </button>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ──
export default function FaroApp() {
  const [isDark,setIsDark] = useState(false);
  const [activeTab,setTab] = useState('panorama');
  const [loaded,setLoaded] = useState(false);
  const [data,setData]     = useState({
    ingresos:1200000, telefono:'', whatsappKey:'', gmailWebAppUrl:'', boletasGmail:[], fintocLinks:[],
    compromisos:COMP_DEFAULT, gastos:[], categorias:CATS_DEFAULT,
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
      if(d) setData(prev=>({...prev,...d,categorias:d.categorias?.length?d.categorias:CATS_DEFAULT}));
      setIsDark(dk); setLoaded(true);
    });
  },[]);
  useEffect(()=>{ if(loaded) S.set('faro_data',data); },[data,loaded]);
  useEffect(()=>{ if(loaded) S.set('faro_dark',isDark); },[isDark,loaded]);

  // ── Auto-sync silencioso al abrir ──
  useEffect(()=>{
    if(!loaded) return;
    const sync = async () => {
      try {
        let boletas = [];
        if(data.gmailWebAppUrl) {
          const res  = await fetch(data.gmailWebAppUrl);
          const json = await res.json();
          boletas = (json.data||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.diaVence||null}));
        } else {
          const res = await fetch(`${SB_URL}/rest/v1/boletas?confirmado=eq.false&select=*`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`}});
          const b   = await res.json();
          boletas   = (b||[]).map(x=>({key:x.key,nombre:x.nombre,monto:x.monto,diaVence:x.dia_vence||null}));
        }
        if(boletas.length>0) setData(d=>({...d,boletasGmail:boletas}));
      } catch {}
    };
    sync();
  },[loaded]);

  // ── Cargar Fintoc.js ──
  useEffect(()=>{
    if(typeof window==='undefined') return;
    if(document.getElementById('fintoc-script')) return;
    const script = document.createElement('script');
    script.id  = 'fintoc-script';
    script.src = 'https://js.fintoc.com/v1/';
    document.head.appendChild(script);
  },[]);

  // ── Conectar banco via Fintoc widget ──
  const conectarBanco = async () => {
    try {
      // Obtener widget_token del backend
      const res  = await fetch('/api/fintoc', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'widget_token'})
      });
      const json = await res.json();
      if(!json.ok){ alert('Error: '+json.error); return; }

      // Abrir widget Fintoc
      if(!window.Fintoc){ alert('Cargando Fintoc... intenta en 2 segundos'); return; }
      window.Fintoc.create({
        holderType:  'individual',
        product:     'movements',
        country:     'cl',
        publicKey:   'pk_test_2AkTwWsyF3U9KcstazbQsyh6EDs3g2-ye_yy6DMa25x',
        widgetToken: json.widget_token,
        onSuccess: linkToken => {
          // Guardar link token y sincronizar
          setData(d=>({...d, fintocLinks:[...d.fintocLinks, {token:linkToken, banco:'Banco conectado'}]}));
          syncMovimientosBanco(linkToken);
        },
        onExit: () => {},
      }).open();
    } catch(e){ alert('Error conectando banco: '+e.message); }
  };

  // ── Sincronizar movimientos bancarios ──
  const syncMovimientosBanco = async linkToken => {
    try {
      const res  = await fetch(`/api/fintoc?action=movements&link_token=${linkToken}`);
      const json = await res.json();
      if(!json.ok){ console.error(json.error); return; }

      const movimientos = json.data || [];

      // Detectar pagos de compromisos y marcarlos automáticamente
      setData(d=>{
        let nuevosCompromisos = [...d.compromisos];
        const nuevosGastos    = [...d.gastos];

        movimientos.forEach(mov=>{
          // Si detectó un compromiso, marcarlo como pagado
          if(mov.compromiso){
            nuevosCompromisos = nuevosCompromisos.map(c=>{
              if(c.gmailKey===mov.compromiso && !c.pagado){
                return {...c, pagado:true};
              }
              return c;
            });
          }
          // Agregar movimiento a gastos si no existe
          const existe = d.gastos.some(g=>g.id==='banco_'+mov.id);
          if(!existe){
            nuevosGastos.unshift({
              id:     'banco_'+mov.id,
              tipo:   mov.tipo==='cargo'?'gasto':'ingreso',
              catId:  mov.compromiso||'otros',
              monto:  mov.monto,
              desc:   mov.descripcion,
              fecha:  mov.fecha?.split('T')[0]||new Date().toISOString().split('T')[0],
              origen: 'banco',
              banco:  mov.banco,
            });
          }
        });

        return {...d, compromisos:nuevosCompromisos, gastos:nuevosGastos};
      });
    } catch(e){ console.error('Error sync banco:', e); }
  };

  const confirmarBoletas = boletas => {
    if(!boletas.length){ setData(d=>({...d,boletasGmail:[]})); return; }
    setData(d=>({
      ...d,
      compromisos: d.compromisos.map(comp=>{
        const match = boletas.find(b=>b.key===comp.gmailKey);
        if(match&&match.monto>0){
          const patch={monto:match.monto};
          if(match.diaVence) patch.dia=match.diaVence;
          return {...comp,...patch};
        }
        return comp;
      }),
      boletasGmail:[],
    }));
  };

  if(!loaded) return(
    <div style={{minHeight:'100vh',background:co.primary,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,sans-serif'}}>
      <div style={{fontSize:56,marginBottom:12}}>🔦</div>
      <div style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:-1}}>FARO</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:6}}>Tu copiloto financiero</div>
    </div>
  );

  return (
    <div style={{background:t.bg,minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',paddingBottom:80}}>
      <div style={{maxWidth:440,margin:'0 auto',padding:'16px 16px 0'}}>
        {/* Header */}
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
              <div onClick={()=>setTab('panorama')} style={{width:22,height:22,borderRadius:'50%',background:co.green,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',cursor:'pointer'}}>{data.boletasGmail.length}</div>
            )}
            <button onClick={()=>setIsDark(d=>!d)} style={{background:t.card,border:'1px solid '+t.border,borderRadius:99,width:44,height:24,padding:2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:isDark?'flex-end':'flex-start'}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:isDark?co.secondary:co.yellow}}/>
            </button>
          </div>
        </div>
        <div style={{fontSize:12,color:t.textMuted,fontWeight:600}}>{NOW.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</div>
        <div style={{fontSize:24,fontWeight:900,color:t.text,marginTop:4,marginBottom:24}}>Hola, Cristian 🔦</div>

        {activeTab==='panorama'   &&<PanoramaView    data={data} onConfirmarBoletas={confirmarBoletas} t={t} isDark={isDark}/>}
        {activeTab==='compromisos'&&<CompromisosView data={data} setData={setData} t={t} isDark={isDark}/>}
        {activeTab==='gastos'     &&<GastosView      data={data} setData={setData} t={t} isDark={isDark}/>}
        {activeTab==='ajustes'    &&<AjustesView     data={data} setData={setData} t={t} isDark={isDark} onSyncGmail={b=>{setData(d=>({...d,boletasGmail:b}));setTab('panorama');}} onConectarBanco={conectarBanco} onSyncBanco={syncMovimientosBanco}/>}
      </div>

      {/* Nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:t.card,borderTop:'1px solid '+t.border,height:68,display:'flex',justifyContent:'space-around',alignItems:'center',zIndex:100}}>
        {[['panorama','🔦','Panorama'],['compromisos','📋','Compromisos'],['gastos','💸','Gastos'],['ajustes','⚙️','Ajustes']].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{background:'none',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',color:activeTab===id?co.primary:t.textMuted}}>
            <span style={{fontSize:20,filter:activeTab===id?'none':'grayscale(1) opacity(0.5)'}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:activeTab===id?800:500}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
