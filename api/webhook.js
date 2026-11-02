// Vercel Serverless Function: Steadfast Webhook Receiver
// Resilient: Always returns 200 HTTP so Steadfast never pauses webhook delivery

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Steadfast hits GET to verify the URL
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'success',
      message: 'Steadfast webhook active. POST events supported.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'success', message: 'Ignored non-POST.' });
  }

  // Auth token check (optional: only checked if user set WEBHOOK_TOKEN)
  const expected = (process.env.WEBHOOK_TOKEN || '').trim();
  const gotAuth = req.headers.authorization || req.headers.Authorization || '';
  const qToken = (req.query && (req.query.token || req.query.auth)) || '';
  const got = String(gotAuth).trim() || (qToken ? `Bearer ${String(qToken).trim()}` : '');

  if (expected && got && got !== `Bearer ${expected}`) {
    console.warn('[webhook] token mismatch, returning 200 to avoid Steadfast pause');
    return res.status(200).json({ status: 'success', message: 'Webhook received.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  console.log('[Steadfast Webhook Event Received]:', JSON.stringify(body));

  // Forward / insert to Supabase if credentials are in env
  const base = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_KEY;
  const shopId = process.env.SHOP_ID || 'bag_store_1';

  if (base && svc) {
    try {
      const H = {
        'Content-Type': 'application/json',
        apikey: svc,
        Authorization: `Bearer ${svc}`,
        Prefer: 'return=minimal',
      };

      const eventPayload = {
        shop_id: shopId,
        notification_type: body.notification_type || (body.status ? 'delivery_status' : 'tracking_update'),
        invoice: String(body.invoice || body.invoice_id || ''),
        consignment_id: String(body.consignment_id || body.consignmentId || body.cid || ''),
        status: String(body.status || body.delivery_status || ''),
        cod_amount: Number(body.cod_amount || 0),
        delivery_charge: Number(body.delivery_charge || 0),
        tracking_message: String(body.tracking_message || body.message || '').slice(0, 300),
        provider_updated_at: String(body.updated_at || body.update_at || new Date().toISOString()),
        ts: Date.now(),
        data: body,
      };

      await fetch(`${base}/rest/v1/shop_events`, {
        method: 'POST',
        headers: H,
        body: JSON.stringify(eventPayload),
      });
    } catch (e) {
      console.warn('[webhook] Supabase event logging error:', e);
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Webhook received successfully.',
  });
}
