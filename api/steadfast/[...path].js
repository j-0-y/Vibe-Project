// Vercel Serverless Function: Steadfast API Proxy
// Proxies /api/steadfast/* -> portal.packzy.com/api/v1/*

const BASE = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-steadfast-key, x-steadfast-secret, x-steadfast-base');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-steadfast-key'] || process.env.STEADFAST_API_KEY;
  const secret = req.headers['x-steadfast-secret'] || process.env.STEADFAST_SECRET_KEY;
  const baseUrl = (req.headers['x-steadfast-base'] || BASE).replace(/\/$/, '');

  if (!key || !secret) {
    return res.status(500).json({
      error: 'STEADFAST_API_KEY/SECRET_KEY missing. Please configure in Vercel Environment Variables or App Settings.',
    });
  }

  const parts = req.query.path || [];
  const sub = '/' + (Array.isArray(parts) ? parts.join('/') : parts);
  const targetUrl = baseUrl + sub;

  try {
    const r = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': key,
        'Secret-Key': secret,
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'Steadfast unreachable: ' + String(e).slice(0, 200) });
  }
}
