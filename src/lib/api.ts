import type { Order, SteadEvent, FraudReport, FraudCourier } from "./types";
import { buildParcelBody } from "./utils";

export type { FraudReport, FraudCourier, SteadEvent };

let lastError = "";

export function steadLastError(): string {
  return lastError;
}

export interface SteadfastCredentials {
  key?: string;
  secret?: string;
  base?: string;
}

function getStoredSteadfastCreds(): SteadfastCredentials {
  try {
    const raw = localStorage.getItem("steadfast_creds");
    if (raw) return JSON.parse(raw);
    const dbRaw = localStorage.getItem("bag_shop_v1");
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (db?.settings?.steadfast?.key) return db.settings.steadfast;
    }
  } catch {}
  return { base: "https://portal.packzy.com/api/v1" };
}

/**
 * Universal Steadfast API caller:
 * Calls server proxy `/api/steadfast/...`
 * If the merchant has configured keys in Settings, passes them in custom headers.
 * If server is offline or mock mode is on, falls back to realistic simulation.
 */
export async function steadApi(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
  silent = false
): Promise<any> {
  lastError = "";
  const creds = getStoredSteadfastCreds();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (creds.key) headers["x-steadfast-key"] = creds.key;
  if (creds.secret) headers["x-steadfast-secret"] = creds.secret;
  if (creds.base) headers["x-steadfast-base"] = creds.base;

  try {
    const cleanSub = endpoint.replace(/^\//, "");
    const r = await fetch(`/api/steadfast/${cleanSub}`, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(body || {}) : undefined,
    });

    if (!r.ok) {
      const errTxt = await r.text();
      let parsedErr = "";
      try {
        const j = JSON.parse(errTxt);
        parsedErr = j.message || j.error || j.errors?.join?.(", ") || "";
      } catch {
        parsedErr = errTxt.slice(0, 150);
      }

      // If missing keys and mock mode or no keys set, simulate for non-technical user preview!
      if (!creds.key || !creds.secret) {
        return mockSteadfastResponse(endpoint, method, body);
      }

      lastError = parsedErr || `HTTP ${r.status}`;
      if (!silent) console.warn("[Steadfast API]", lastError);
      return null;
    }

    const json = await r.json();
    return json;
  } catch (err: unknown) {
    // If server proxy unreachable in dev preview, simulate for user
    if (!creds.key || !creds.secret) {
      return mockSteadfastResponse(endpoint, method, body);
    }
    lastError = err instanceof Error ? err.message : String(err);
    if (!silent) console.warn("[Steadfast Error]", lastError);
    return null;
  }
}

/**
 * Mock responses for smooth onboarding & non-technical testing before live approval
 */
function mockSteadfastResponse(endpoint: string, method: string, body?: any) {
  if (endpoint.includes("get_balance")) {
    return {
      status: 200,
      current_balance: 14500,
      message: "ডেমো ব্যালেন্স (লাইভ একাউন্ট বসালে রিয়েল ব্যালেন্স দেখাবে)",
    };
  }

  if (endpoint.includes("create_order")) {
    const cid = "CID-" + Math.floor(100000 + Math.random() * 900000);
    const tracking = "SF" + Math.floor(10000000 + Math.random() * 90000000);
    return {
      status: 200,
      consignment: {
        consignment_id: cid,
        tracking_code: tracking,
        invoice: body?.invoice || "INV-" + Date.now(),
        status: "in_review",
      },
      message: "পার্সেল সফলভাবে তৈরি হয়েছে (সিমুলেশন)",
    };
  }

  if (endpoint.includes("status_by_cid") || endpoint.includes("status_by_trackingcode")) {
    return {
      status: 200,
      delivery_status: "in_transit",
      history: [
        { time: "আজ সকাল ১০:৩০", status: "পার্সেল পিকআপ সম্পন্ন হয়েছে" },
        { time: "আজ দুপুর ০২:১৫", status: "স্টেডফাস্ট হাব-এ প্রক্রিয়াধীন" },
        { time: "আজ বিকাল ০৫:০০", status: "ডেলিভারি রাইডারের কাছে হস্তান্তরিত (In Transit)" },
      ],
    };
  }

  return { status: 200, message: "OK (Simulation)" };
}

/**
 * Creates single order parcel in Steadfast
 */
export async function createParcel(
  order: Order
): Promise<{ cid: string; tracking: string } | null> {
  const body = buildParcelBody(order);
  const j = await steadApi("create_order", "POST", body);

  if (!j) return null;

  const consignment = j.consignment || j.data || j;
  const cid = String(consignment.consignment_id || consignment.consignmentId || consignment.id || "");
  const tracking = String(consignment.tracking_code || consignment.trackingCode || "");

  if (!cid) {
    lastError = j.message || "Consignment ID পাওয়া যায়নি";
    return null;
  }

  return { cid, tracking };
}

/**
 * Bulk parcel creation in Steadfast
 */
export async function bulkParcels(
  orders: Order[]
): Promise<Array<{ invoice: string; cid: string; tracking: string }>> {
  const j = await steadApi(
    "create_order/bulk-order",
    "POST",
    { data: orders.map(buildParcelBody) },
    true
  );
  if (!j) return [];
  const rows = Array.isArray(j) ? j : j.data || j.consignments || [];
  return rows
    .filter((r: any) => r && (r.consignment_id || r.consignmentId))
    .map((r: any) => ({
      invoice: r.invoice || "",
      cid: String(r.consignment_id || r.consignmentId || ""),
      tracking: r.tracking_code || r.trackingCode || "",
    }));
}

/**
 * Request parcel return in Steadfast
 */
export async function returnParcel(cid: string): Promise<boolean> {
  const j = await steadApi("return_request", "POST", { consignment_id: cid });
  return Boolean(j && (j.status === 200 || j.status === "success"));
}

function getStoredBdCourierKey(): string {
  try {
    const key = localStorage.getItem("bd_courier_api_key");
    if (key) return key.trim();
    const dbRaw = localStorage.getItem("bag_shop_v1");
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (db?.settings?.bdCourierKey) return String(db.settings.bdCourierKey).trim();
    }
  } catch {}
  return "";
}

/**
 * Fraud check lookup (BD Courier Live API)
 */
export async function fraudCheck(phone: string): Promise<FraudReport | null> {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 11) return null;

  const key = getStoredBdCourierKey();

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (key) headers["x-bdcourier-key"] = key;

    const res = await fetch("/api/bdcourier/check", {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: digits, apiKey: key }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        total: data.total || 0,
        delivered: data.delivered || 0,
        cancelled: data.cancelled || 0,
        rate: data.rate || 0,
        couriers: data.couriers || [],
        reports: data.reports || [],
        risk_verdict: data.risk_verdict || {
          level: "safe",
          label: "তথ্য পাওয়া গেছে ✅",
          action: "নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পাঠান",
          color: "#16a34a",
          reasons: [],
        },
        source: key ? "BD Courier Live API" : "BD Courier (API Key দিন)",
      };
    }
  } catch (err) {
    console.warn("BD Courier check error:", err);
  }

  return {
    total: 0,
    delivered: 0,
    cancelled: 0,
    rate: 0,
    couriers: [],
    reports: [],
    risk_verdict: {
      level: "medium",
      label: key ? "কানেকশন সমস্যা" : "API Key সেট করুন ⚠️",
      action: key ? "পুনরায় চেষ্টা করুন" : "সেটিংস ট্যাবে BD Courier API Key যুক্ত করুন",
      color: "#eab308",
      reasons: [key ? "সার্ভার রেসপন্স দেয়নি" : "সেটিংস থেকে BD Courier API Key দিন"],
    },
    source: "BD Courier",
  };
}
