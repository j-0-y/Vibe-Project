export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-bdcourier-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const phone = String(body.phone || req.query?.phone || "").trim().replace(/\D/g, "");
  const apiKey = (
    req.headers["x-bdcourier-key"] ||
    body.apiKey ||
    process.env.BD_COURIER_API_KEY ||
    ""
  ).trim();

  if (!phone || phone.length < 11) {
    return res.status(400).json({ error: "সঠিক ১১ ডিজিটের ফোন নম্বর দিন" });
  }

  // If no API Key configured yet
  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      message: "বিডি কুরিয়ার API Key কনফিগার করা হয়নি। সেটিংস ট্যাবে গিয়ে API Key যুক্ত করুন।",
      phone,
      total: 0,
      delivered: 0,
      cancelled: 0,
      rate: 0,
      risk_verdict: {
        level: "warning",
        label: "API Key প্রয়োজন ⚠️",
        action: "সেটিংস থেকে BD Courier API Key সেট করুন",
        color: "#eab308",
        reasons: ["লাইভ ডাটা পেতে BD Courier API Key প্রয়োজন"],
      },
    });
  }

  // Try BD Courier endpoints
  const endpoints = [
    "https://bdcourier.com/api/courier-check",
    "https://api.bdcourier.com/courier-check",
    "https://bdcourier.com/api/v1/courier-check",
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "api-key": apiKey,
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ phone }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // Parse BD Courier standard format
        const total = Number(data.total_parcels || data.total || data.data?.total || 0);
        const delivered = Number(data.success_parcels || data.delivered || data.data?.delivered || 0);
        const cancelled = Number(data.cancelled_parcels || data.cancelled || data.data?.cancelled || 0);
        const rate = total > 0 ? Math.round((delivered / total) * 100) : (data.success_rate || 0);

        let riskLevel: "safe" | "medium" | "high" = "safe";
        let label = "বিশ্বস্ত কাস্টমার ✅";
        let action = "নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পাঠান";
        let color = "#16a34a";

        if (total > 0 && rate < 60) {
          riskLevel = "high";
          label = "উচ্চ ঝুঁকিপূর্ণ কাস্টমার 🚨";
          action = "পার্সেল পাঠানোর আগে ডেলিভারি চার্জ অগ্রিম নিন";
          color = "#dc2626";
        } else if (total > 0 && rate < 80) {
          riskLevel = "medium";
          label = "সতর্কতা প্রয়োজন ⚠️";
          action = "অগ্রিম ডেলিভারি চার্জ নিয়ে কনফার্ম করুন";
          color = "#eab308";
        }

        const couriers = [];
        const rawC = data.courier_data || data.couriers || data.data?.courier_data || {};
        if (typeof rawC === "object") {
          for (const [k, v] of Object.entries(rawC as Record<string, any>)) {
            couriers.push({
              name: k.charAt(0).toUpperCase() + k.slice(1),
              orders: Number(v.total || v.orders || 0),
              delivered: Number(v.success || v.delivered || 0),
              cancelled: Number(v.cancelled || v.canceled || 0),
              rate: Number(v.rate || (v.total ? Math.round((v.success / v.total) * 100) : 0)),
            });
          }
        }

        return res.status(200).json({
          configured: true,
          phone,
          total,
          delivered,
          cancelled,
          rate,
          couriers: couriers.length > 0 ? couriers : undefined,
          reports: data.reports || [],
          risk_verdict: {
            level: riskLevel,
            label,
            action,
            color,
            reasons: [
              total > 0 ? `মোট ${total} পার্সেলের মধ্যে ${delivered} ডেলিভারি (${rate}%)` : "নতুন নম্বর",
            ],
          },
          source: "BD Courier Live API",
          raw: data,
        });
      }
    } catch {
      // Try next endpoint
    }
  }

  // If BD Courier request failed (e.g. invalid key or temporary server issue)
  return res.status(200).json({
    configured: true,
    warning: "BD Courier রেসপন্স দেয়নি। API Key সঠিক আছে কিনা যাচাই করুন।",
    phone,
    total: 0,
    delivered: 0,
    cancelled: 0,
    rate: 0,
    risk_verdict: {
      level: "medium",
      label: "API সংযোগ সমস্যা ⚠️",
      action: "সঠিক BD Courier API Key দিয়েছেন কি না পরীক্ষা করুন",
      color: "#eab308",
      reasons: ["বিডি কুরিয়ার সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি"],
    },
    source: "BD Courier Check",
  });
}
