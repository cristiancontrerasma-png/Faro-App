import { NextResponse } from 'next/server';

const FINTOC_API = 'https://api.fintoc.com/v1';

const PAYMENT_KEYWORDS = {
  enel:          ['enel', 'enel distribucion', 'enelchile'],
  aguas_andinas: ['aguas andinas', 'aguasandinas'],
  metrogas:      ['metrogas', 'metro gas'],
  entel:         ['entel', 'boletaentel'],
  vtr:           ['vtr', 'liberty networks'],
  scotiabank:    ['scotiabank', 'credito hipotecario', 'dividendo'],
  gastos_comunes:['gastos comunes', 'comunidad edificio', 'administracion'],
};

function detectarCompromiso(descripcion) {
  const desc = (descripcion || '').toLowerCase();
  for (const [key, keywords] of Object.entries(PAYMENT_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) return key;
  }
  return null;
}

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
      const accountsRes = await fetch(`${FINTOC_API}/links/${linkToken}/accounts`, { headers });
      const accounts = await accountsRes.json();
      if (!Array.isArray(accounts)) return NextResponse.json({ ok: false, error: 'Error cuentas', raw: accounts });

      const since = new Date();
      since.setDate(since.getDate() - 60);
      const sinceStr = since.toISOString().split('T')[0];
      const todos = [];

      for (const account of accounts) {
        const movRes = await fetch(`${FINTOC_API}/links/${linkToken}/accounts/${account.id}/movements?since=${sinceStr}`, { headers });
        const movs = await movRes.json();
        if (Array.isArray(movs)) {
          movs.forEach(mov => todos.push({
            id:          mov.id,
            fecha:       mov.post_date || mov.transaction_date,
            descripcion: mov.description || '',
            monto:       Math.abs(mov.amount),
            tipo:        mov.amount < 0 ? 'cargo' : 'abono',
            banco:       account.institution?.name || '',
            compromiso:  detectarCompromiso(mov.description),
          }));
        }
      }
      return NextResponse.json({ ok: true, data: todos });
    }
    return NextResponse.json({ ok: false, error: 'Acción no reconocida' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const secretKey = process.env.FINTOC_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ ok: false, error: 'FINTOC_SECRET_KEY no configurada' });
  }

  try {
    // Fintoc: crear link_intent para el widget
    const res = await fetch(`${FINTOC_API}/link_intents`, {
      method: 'POST',
      headers: {
        'Authorization': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: 'movements',
        country: 'cl',
        holder_type: 'individual',
      }),
    });

    const data = await res.json();

    // Fintoc puede devolver widget_token o link_token
    const token = data.widget_token || data.link_intent_token || data.token;

    if (token) {
      return NextResponse.json({ ok: true, widget_token: token });
    }

    // Si falla, intentar endpoint alternativo
    const res2 = await fetch(`${FINTOC_API}/widget_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: 'movements',
        country: 'cl',
      }),
    });
    const data2 = await res2.json();
    const token2 = data2.widget_token || data2.token;

    if (token2) {
      return NextResponse.json({ ok: true, widget_token: token2 });
    }

    return NextResponse.json({ ok: false, error: 'No se pudo crear token', raw: data });

  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
