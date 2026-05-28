import { NextResponse } from 'next/server';

const FINTOC_API = 'https://api.fintoc.com/v1';

// Keywords para detectar pagos automáticamente
const PAYMENT_KEYWORDS = {
  enel:          ['enel', 'enel distribucion', 'enelchile'],
  aguas_andinas: ['aguas andinas', 'aguasandinas'],
  metrogas:      ['metrogas', 'metro gas'],
  entel:         ['entel', 'boletaentel'],
  vtr:           ['vtr', 'liberty networks'],
  movistar:      ['movistar', 'telefonica'],
  claro:         ['claro'],
  scotiabank:    ['scotiabank', 'credito hipotecario', 'dividendo'],
  gastos_comunes:['gastos comunes', 'comunidad edificio', 'administracion'],
};

function detectarCompromiso(descripcion) {
  const desc = descripcion.toLowerCase();
  for (const [key, keywords] of Object.entries(PAYMENT_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) return key;
  }
  return null;
}

// GET: obtener movimientos de un link_token
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action    = searchParams.get('action');
  const linkToken = searchParams.get('link_token');

  const headers = {
    'Authorization': process.env.FINTOC_SECRET_KEY,
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'movements') {
      // 1. Obtener cuentas del link
      const accountsRes = await fetch(
        `${FINTOC_API}/links/${linkToken}/accounts`,
        { headers }
      );
      const accounts = await accountsRes.json();

      if (!Array.isArray(accounts)) {
        return NextResponse.json({ ok: false, error: 'Error obteniendo cuentas', raw: accounts });
      }

      // 2. Obtener movimientos de cada cuenta (últimos 60 días)
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const sinceStr = since.toISOString().split('T')[0];

      const todosMovimientos = [];

      for (const account of accounts) {
        const movRes = await fetch(
          `${FINTOC_API}/links/${linkToken}/accounts/${account.id}/movements?since=${sinceStr}`,
          { headers }
        );
        const movimientos = await movRes.json();

        if (Array.isArray(movimientos)) {
          movimientos.forEach(mov => {
            todosMovimientos.push({
              id:          mov.id,
              fecha:       mov.post_date || mov.transaction_date,
              descripcion: mov.description || '',
              monto:       Math.abs(mov.amount),
              tipo:        mov.amount < 0 ? 'cargo' : 'abono',
              banco:       account.institution?.name || '',
              cuenta:      account.name || account.number,
              // Detectar si es pago de una cuenta
              compromiso:  detectarCompromiso(mov.description || ''),
            });
          });
        }
      }

      return NextResponse.json({
        ok:         true,
        data:       todosMovimientos,
        total:      todosMovimientos.length,
        timestamp:  new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no reconocida' });

  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

// POST: crear widget_token para el frontend
export async function POST(request) {
  const headers = {
    'Authorization': process.env.FINTOC_SECRET_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(`${FINTOC_API}/widget_tokens`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ widget_type: 'movements' }),
    });
    const data = await res.json();

    if (data.widget_token) {
      return NextResponse.json({ ok: true, widget_token: data.widget_token });
    }
    return NextResponse.json({ ok: false, error: 'No se pudo crear widget token', raw: data });

  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
