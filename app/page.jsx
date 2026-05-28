'use client';
import React, { useState, useEffect } from 'react';

// --- ESTADO GLOBAL UNIFICADO ---
// Este componente central maneja los datos y los reparte a las vistas.
export default function FaroApp() {
  const [data, setData] = useState({
    ingresos: 3200000,
    compromisos: [
      { id: 1, nombre: 'Dividendo', monto: 550000, pagado: false },
      { id: 2, nombre: 'Gastos Comunes', monto: 1148896, pagado: false },
      { id: 3, nombre: 'Celular', monto: 12990, pagado: false },
      { id: 4, nombre: 'Agua', monto: 698781, pagado: false },
      { id: 5, nombre: 'Enel (Luz)', monto: 663141, pagado: false }
    ]
  });

  const [activeTab, setActiveTab] = useState('panorama');

  // Lógica para calcular totales en vivo
  const totalComp = data.compromisos.reduce((sum, item) => sum + Number(item.monto), 0);
  const pagado = data.compromisos.filter(c => c.pagado).reduce((sum, item) => sum + Number(item.monto), 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* VISTA PANORAMA */}
      {activeTab === 'panorama' && (
        <div style={{ background: '#005F73', color: 'white', padding: '20px', borderRadius: '15px' }}>
          <p style={{ fontSize: '12px' }}>DISPONIBLE REAL</p>
          <h1 style={{ fontSize: '32px' }}>${(data.ingresos - pagado).toLocaleString('es-CL')}</h1>
          <p>Total mensual: ${totalComp.toLocaleString('es-CL')}</p>
        </div>
      )}

      {/* VISTA COMPROMISOS */}
      {activeTab === 'compromisos' && (
        <div>
          <h3>Ingresos: {data.ingresos.toLocaleString('es-CL')}</h3>
          {data.compromisos.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>{c.nombre}</span>
              <span>${c.monto.toLocaleString('es-CL')}</span>
              <button onClick={() => {
                const nuevas = data.compromisos.map(item => item.id === c.id ? {...item, pagado: !item.pagado} : item);
                setData({...data, compromisos: nuevas});
              }}>
                {c.pagado ? 'Pagado' : 'Pagar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', width: '100%', display: 'flex', background: '#eee', padding: '10px' }}>
        <button onClick={() => setActiveTab('panorama')} style={{ flex: 1 }}>Panorama</button>
        <button onClick={() => setActiveTab('compromisos')} style={{ flex: 1 }}>Compromisos</button>
      </div>
    </div>
  );
}
