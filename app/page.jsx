'use client';
import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN INICIAL (Fuente de la verdad) ---
const getInitialData = () => ({
  ingresos: 3200000,
  compromisos: [
    { id: 1, nombre: 'Dividendo', monto: 550000, pagado: false },
    { id: 2, nombre: 'Gastos Comunes', monto: 1148896, pagado: false },
    { id: 3, nombre: 'Celular', monto: 12990, pagado: false },
    { id: 4, nombre: 'Agua', monto: 698781, pagado: false },
    { id: 5, nombre: 'Enel (Luz)', monto: 663141, pagado: false }
  ]
});

export default function FaroApp() {
  const [data, setData] = useState(null); // 'null' evita errores de carga inicial
  const [activeTab, setActiveTab] = useState('panorama');
  const [isDark, setIsDark] = useState(false);

  // 1. Carga desde almacenamiento
  useEffect(() => {
    const saved = localStorage.getItem('faro_data_v41');
    setData(saved ? JSON.parse(saved) : getInitialData());
  }, []);

  // 2. Persistencia automática
  useEffect(() => {
    if (data) localStorage.setItem('faro_data_v41', JSON.stringify(data));
  }, [data]);

  // 3. Pantalla de carga segura para iPhone
  if (!data) return <div style={{padding: 40, textAlign: 'center', fontFamily: 'sans-serif'}}>Iniciando FARO...</div>;

  // Acciones de actualización (Reactivas)
  const updateIngresos = (val) => setData({...data, ingresos: Number(val)});
  const togglePago = (id) => setData({...data, compromisos: data.compromisos.map(c => c.id === id ? {...c, pagado: !c.pagado} : c)});
  const updateMonto = (id, val) => setData({...data, compromisos: data.compromisos.map(c => c.id === id ? {...c, monto: Number(val)} : c)});

  return (
    <div style={{ background: isDark ? '#0D1B2A' : '#F4F7F6', minHeight: '100vh', transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '20px 20px 80px 20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 900, color: isDark ? '#FFF' : '#1E293B' }}>FARO</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>COPILOTO FINANCIERO</div>
          </div>
          <button onClick={() => setIsDark(!isDark)} style={{borderRadius: 10, border: 'none', padding: '5px 10px'}}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Vistas */}
        {activeTab === 'panorama' && <PanoramaView data={data} />}
        {activeTab === 'compromisos' && (
          <CompromisosView 
            data={data} 
            onUpdateIngresos={updateIngresos} 
            onToggle={togglePago} 
            onUpdateMonto={updateMonto} 
          />
        )}

        {/* Tab Bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', padding: 15 }}>
          <button onClick={() => setActiveTab('panorama')} style={{border:'none', background:'none'}}>🔦 Panorama</button>
          <button onClick={() => setActiveTab('compromisos')} style={{border:'none', background:'none'}}>📋 Compromisos</button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function PanoramaView({ data }) {
  const total = data.compromisos.reduce((s, c) => s + Number(c.monto), 0);
  const pagado = data.compromisos.filter(c => c.pagado).reduce((s, c) => s + Number(c.monto), 0);
  const disponible = Number(data.ingresos) - pagado;
  
  return (
    <div style={{ background: '#005F73', color: '#fff', padding: 20, borderRadius: 20 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>DISPONIBLE REAL</div>
      <div style={{ fontSize: 32, fontWeight: 900 }}>${disponible.toLocaleString('es-CL')}</div>
      <div style={{ marginTop: 10, fontSize: 13 }}>
        Total mensual: ${total.toLocaleString('es-CL')}
      </div>
    </div>
  );
}

function CompromisosView({ data, onUpdateIngresos, onToggle, onUpdateMonto }) {
  return (
    <div style={{ background: '#FFF', padding: 20, borderRadius: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: '#64748B' }}>SUELDO DISPONIBLE</label>
        <input type="number" value={data.ingresos} onChange={(e) => onUpdateIngresos(e.target.value)} style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ddd' }} />
      </div>
      
      {data.compromisos.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
          <span>{c.nombre}</span>
          <input type="number" value={c.monto} onChange={(e) => onUpdateMonto(c.id, e.target.value)} style={{ width: 80, padding: 5 }} />
          <button onClick={() => onToggle(c.id)} style={{ background: c.pagado ? '#2A9D8F' : '#eee', border: 'none', padding: '5px 10px', borderRadius: 5 }}>
            {c.pagado ? '✓' : 'Pagar'}
          </button>
        </div>
      ))}
    </div>
  );
}
