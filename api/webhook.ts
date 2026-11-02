export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Steadfast sometimes hits GET to verify the URL. Must return 200.
  if (req.method === "GET") {
    return res.status(200).json({
      status: "success",
      message: "Webhook active. Send POST for events.",
    });
  }

  if (req.method !== "POST") {
    return res.status(200).json({ status: "success", message: "Ignored (not POST)." });
  }

  let b = req.body || {};
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      b = {};
    }
  }

  const base = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_KEY;
  const shop = process.env.SHOP_ID || "bag_store_1";

  const norm = (v: any) => (v === null || v === undefined ? "" : String(v));
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const invoice = norm(b.invoice || b.invoice_id || b.order_invoice);
  const consignment_id = norm(b.consignment_id || b.consignmentId || b.cid);
  const status = norm(b.status || b.delivery_status || b.deliveryStatus);
  const notification_type = norm(b.notification_type || (status ? "delivery_status" : "tracking_update"));
  const tracking_message = norm(b.tracking_message || b.message).slice(0, 300);
  const provider_updated_at = norm(b.updated_at || b.update_at);

  // Steadfast test ping
  if (!invoice && !consignment_id && !status && !tracking_message) {
    return res.status(200).json({ status: "success", message: "Webhook ping received successfully." });
  }

  if (base && svc) {
    try {
      const H = {
        "Content-Type": "application/json",
        apikey: svc,
        Authorization: `Bearer ${svc}`,
      };

      const payload = {
        shop_id: shop,
        notification_type,
        invoice,
        consignment_id,
        status,
        cod_amount: num(b.cod_amount ?? 0),
        delivery_charge: num(b.delivery_charge ?? 0),
        tracking_message,
        provider_updated_at,
        ts: Date.now(),
      };

      await fetch(`${base}/rest/v1/shop_events`, {
        method: "POST",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("[webhook] DB persist error:", e);
    }
  }

  // Always return 200 so Steadfast never pauses the merchant's webhook
  return res.status(200).json({
    status: "success",
    message: "Webhook received successfully.",
  });
}
