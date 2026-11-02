"use client";
import React, { useMemo, useState } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import {
  createParcel,
  returnParcel,
  steadLastError,
  fraudCheck,
  type FraudReport,
} from "@/lib/api";
import {
  uid,
  todayBn,
  codOf,
  totalQty,
  guessZone,
  zoneName,
  DEFAULT_SHIP,
  toEnDigits,
  parseCustomerBlock,
  isActive,
  type Zone,
} from "@/lib/utils";
import { restoreInto, deductInto } from "@/lib/stock";
import type { Order, OrderItem, OrderStatus, Product } from "@/lib/types";
import { Btn, Card, Modal, Empty, inputCls, Field, Badge } from "@/components/ui";
import ProductImg from "@/components/shared/ProductImg";

const BN_STATUS: Record<string, string> = {
  Pending: "পেন্ডিং",
  Packed: "প্যাকড",
  Shipped: "স্টেডফাস্টে 🚚",
  Delivered: "ডেলিভারড ✅",
  Cancelled: "ক্যানসেল",
  Returned: "রিটার্ন",
};

const ALL_STATUS: OrderStatus[] = [
  "Pending",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

/* ---------------- Messenger Quick Reply ---------------- */
function QuickReply() {
  const { db } = useShop();
  const [q, setQ] = useState("");

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const words = query.split(/\s+/);
    return (db.products || [])
      .filter(Boolean)
      .filter(isActive)
      .map((p) => {
        const hay = (
          p.name +
          " " +
          p.code +
          " " +
          p.cat +
          " " +
          p.variants.map((v) => v.size + " " + v.color).join(" ")
        ).toLowerCase();
        const score = words.filter((w) => w.length > 1 && hay.includes(w)).length;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [db.products, q]);

  const makeReplyText = (p: Product) => {
    const lines = (p.variants || []).map(
      (v) => `• ${(v.color + " " + (v.size || "")).trim()}: ${v.qty > 0 ? "✅ স্টকে আছে" : "❌ স্টক শেষ"}`
    );
    const avail = (p.variants || []).some((v) => v.qty > 0);
    return `${avail ? `জী আপু, আমাদের ${p.name} ✅ স্টকে এভেইলেবল আছে!` : `দুঃখিত আপু, ${p.name} এখন স্টক আউট ❌`}\n${lines.join(
      "\n"
    )}\nদাম: ৳${p.sell}\nডেলিভারি চার্জ: ঢাকার ভেতর ৳৮০, ঢাকার বাইরে ৳১৩০\n\nঅর্ডার করতে আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন 📩`;
  };

  const copyReply = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      alert("✅ মেসেজ কপি হয়েছে! ফেসবুকে পেস্ট করুন।");
    } catch {
      prompt("কপি করুন:", t);
    }
  };

  return (
    <Card className="mb-3 bg-stone-50/80 border-amber-900/15">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
          💬 ফেসবুক মেসেঞ্জার কুইক রিপ্লাই
        </h3>
        <span className="text-[11px] text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded-full font-medium">
          কাস্টমার মেসেজ জেনারেটর
        </span>
      </div>
      <p className="text-xs text-stone-500 mb-2">
        কাস্টমার ফেসবুকে যে ব্যাগের খোঁজ করছেন তা লিখুন, সঙ্গে সঙ্গে রেডি মেসেজ পেয়ে যাবেন।
      </p>
      <input
        className={inputCls}
        placeholder="যেমন: শোল্ডার ব্যাগ, কালো টোট, BG-101..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {hits.map(({ p }) => (
        <div key={p.id} className="mt-2 rounded-xl bg-white p-2.5 border border-stone-200 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900">{p.name} ({p.code})</span>
            <span className="font-black text-amber-800">৳{p.sell}</span>
          </div>
          <div className="mt-1 text-stone-500 flex flex-wrap gap-1">
            {p.variants.map((v) => (
              <span key={v.id} className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                {v.color}: {v.qty > 0 ? `${v.qty} pcs` : "শেষ ❌"}
              </span>
            ))}
          </div>
          <Btn small color="green" className="mt-2 w-full" onClick={() => copyReply(makeReplyText(p))}>
            📋 রিপ্লাই মেসেজ কপি করুন
          </Btn>
        </div>
      ))}
    </Card>
  );
}

/* ---------------- Create Order Modal ---------------- */
function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const { db, mutateAndSync, notify } = useShop();

  const [pasteText, setPasteText] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState<Zone>("outside");
  const [dcharge, setDcharge] = useState<number>(130);
  const [note, setNote] = useState("");
  const [autoSendSteadfast, setAutoSendSteadfast] = useState(true);
  const [busy, setBusy] = useState(false);

  // Selected order items
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  // Item selector states
  const [pickPid, setPickPid] = useState(db.products[0]?.id || "");
  const pickedProd = db.products.find((p) => p.id === pickPid);
  const [pickVid, setPickVid] = useState(pickedProd?.variants[0]?.id || "");
  const pickedVar = pickedProd?.variants.find((v) => v.id === pickVid);
  const [pickPrice, setPickPrice] = useState(pickedProd?.sell?.toString() || "");

  // Fraud check modal
  const [fraudReport, setFraudReport] = useState<FraudReport | null>(null);
  const [fraudChecking, setFraudChecking] = useState(false);

  // Handle Smart Paste
  const handleSmartPaste = (raw: string) => {
    setPasteText(raw);
    if (!raw.trim()) return;

    const parsed = parseCustomerBlock(raw);
    if (parsed.name) setCustomer(parsed.name);
    if (parsed.phone) setPhone(parsed.phone);
    if (parsed.address) setAddress(parsed.address);
    if (parsed.zone) {
      setZone(parsed.zone);
      const zKey = parsed.zone as "inside" | "sub" | "outside";
      const fee =
        db.settings?.ship?.[zKey]?.fee ?? DEFAULT_SHIP[zKey]?.fee ?? 130;
      setDcharge(fee);
    }
  };

  const handleZoneChange = (z: Zone) => {
    setZone(z);
    const zKey = z as "inside" | "sub" | "outside";
    const fee = db.settings?.ship?.[zKey]?.fee ?? DEFAULT_SHIP[zKey]?.fee ?? 130;
    setDcharge(fee);
  };

  const addItem = () => {
    if (!pickedProd || !pickedVar) {
      alert("ব্যাগ ও ভ্যারিয়েন্ট নির্বাচন করুন");
      return;
    }
    if (pickedVar.qty <= 0) {
      if (!confirm("⚠️ এই কালার/সাইজের ব্যাগ স্টকে শেষ! তবুও কি অর্ডারে যোগ করবেন?")) return;
    }

    const price = +pickPrice || pickedProd.sell || 0;
    const existingIdx = selectedItems.findIndex(
      (it) => it.productId === pickedProd.id && it.variantId === pickedVar.id
    );

    if (existingIdx >= 0) {
      setSelectedItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIdx ? { ...it, qty: it.qty + 1 } : it
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: pickedProd.id,
          variantId: pickedVar.id,
          productName: pickedProd.name,
          variantLabel: `${pickedVar.color} (${pickedVar.size})`,
          qty: 1,
          price,
          buy: pickedProd.buy,
        },
      ]);
    }
  };

  const removeItem = (idx: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const itemsTotal = selectedItems.reduce((acc, it) => acc + it.price * it.qty, 0);
  const [customCod, setCustomCod] = useState<string>("");
  const totalCod = customCod !== "" ? +customCod : itemsTotal + dcharge;

  const runFraudCheck = async () => {
    if (!phone) {
      alert("আগে কাস্টমারের ফোন নম্বর দিন");
      return;
    }
    setFraudChecking(true);
    try {
      const rep = await fraudCheck(phone);
      setFraudReport(rep);
    } catch {
      alert("ফ্রড চেক সংযোগ করা যায়নি");
    } finally {
      setFraudChecking(false);
    }
  };

  const submitOrder = async () => {
    if (!customer.trim()) {
      alert("কাস্টমারের নাম দিন");
      return;
    }
    const cleanPh = toEnDigits(phone).trim();
    if (!/^01\d{9}$/.test(cleanPh)) {
      alert("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)");
      return;
    }
    if (!address.trim()) {
      alert("কাস্টমারের ঠিকানা দিন");
      return;
    }
    if (selectedItems.length === 0) {
      alert("কমপক্ষে ১টি ব্যাগ অর্ডারে যোগ করুন");
      return;
    }

    setBusy(true);

    const orderId = "BG-" + Math.floor(1000 + Math.random() * 9000);
    const zKey = zone as "inside" | "sub" | "outside";
    const dcost = db.settings?.ship?.[zKey]?.cost ?? DEFAULT_SHIP[zKey]?.cost ?? 115;

    const newOrder: Order = {
      id: orderId,
      ts: Date.now(),
      date: todayBn(),
      customer: customer.trim(),
      phone: cleanPh,
      address: address.trim(),
      items: selectedItems,
      total: itemsTotal,
      cod: totalCod,
      zone,
      dcost,
      dcharge,
      status: "Pending",
      payment: "ক্যাশ অন ডেলিভারি (COD)",
      note: note.trim(),
    };

    // Auto-send to Steadfast if checked
    let steadfastSuccess = false;
    if (autoSendSteadfast) {
      try {
        const parcelRes = await createParcel(newOrder);
        if (parcelRes) {
          newOrder.steadfastId = parcelRes.cid;
          newOrder.trackingCode = parcelRes.tracking;
          newOrder.status = "Shipped";
          steadfastSuccess = true;
        }
      } catch (err) {
        console.warn("Steadfast auto-send failed:", err);
      }
    }

    // Deduct stock inventory and save
    await mutateAndSync((d) => {
      deductInto(d, selectedItems);
      d.orders.unshift(newOrder);
      d.moves.unshift({
        id: uid(),
        date: todayBn(),
        text: `📦 অর্ডার তৈরি (${orderId}): ${customer} - ${selectedItems.map((it) => `${it.productName} [${it.variantLabel}] x${it.qty}`).join(", ")}`,
      });
    });

    notify(
      "নতুন অর্ডার তৈরি!",
      `${customer} এর অর্ডার (${orderId}) তৈরি হয়েছে। ${steadfastSuccess ? "স্টেডফাস্টে পার্সেল পাঠানো হয়েছে ✅" : ""}`
    );

    setBusy(false);
    onClose();
  };

  return (
    <Modal title="🧾 নতুন ফেসবুক অর্ডার তৈরি করুন" onClose={onClose}>
      <div className="space-y-3.5">
        {/* Smart Paste Box */}
        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-900/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1">
              📋 ফেসবুক চ্যাট স্মার্ট পেস্ট (Smart Paste)
            </span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              নাম, ফোন ও ঠিকানা স্বয়ংক্রিয় আলাদা হবে
            </span>
          </div>
          <textarea
            rows={3}
            className="w-full text-xs rounded-xl border border-amber-900/20 bg-white p-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700"
            placeholder="ফেসবুক মেসেঞ্জারে কাস্টমারের পুরো মেসেজটা কপি করে এখানে পেস্ট করুন..."
            value={pasteText}
            onChange={(e) => handleSmartPaste(e.target.value)}
          />
        </div>

        {/* Customer Fields */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="কাস্টমারের নাম *">
            <input
              className={inputCls}
              placeholder="সাদিয়া ইসলাম"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </Field>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">মোবাইল নম্বর *</span>
              <button
                type="button"
                onClick={runFraudCheck}
                disabled={fraudChecking || !phone}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
              >
                {fraudChecking ? "চেক হচ্ছে..." : "🛡️ ফ্রড চেক"}
              </button>
            </div>
            <input
              className={inputCls}
              placeholder="01712345678"
              value={phone}
              onChange={(e) => setPhone(toEnDigits(e.target.value))}
            />
          </div>
        </div>

        {/* Address */}
        <Field label="সম্পূর্ণ ডেলিভারি ঠিকানা *">
          <input
            className={inputCls}
            placeholder="বাসা নং, রোড নং, এলাকা, থানা ও জেলা"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        {/* Zone & Delivery Fee */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="ডেলিভারি জোন">
            <select
              className={inputCls}
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value as Zone)}
            >
              <option value="inside">ঢাকার ভেতর (৳৮০)</option>
              <option value="sub">সাব-ঢাকা (৳১০০)</option>
              <option value="outside">ঢাকার বাইরে (৳১৩০)</option>
            </select>
          </Field>
          <Field label="ডেলিভারি চার্জ (৳)">
            <input
              type="number"
              className={inputCls}
              value={dcharge}
              onChange={(e) => setDcharge(+e.target.value || 0)}
            />
          </Field>
        </div>

        {/* Bag Selector Section */}
        <div className="border-t border-stone-200 pt-3">
          <span className="text-xs font-bold text-stone-800 block mb-2">
            👜 ব্যাগ নির্বাচন ও আইটেম যোগ
          </span>
          <div className="flex gap-2 mb-2">
            <select
              className="flex-1 text-xs rounded-xl border border-stone-200 bg-stone-50 p-2 focus:outline-none"
              value={pickPid}
              onChange={(e) => {
                setPickPid(e.target.value);
                const p = db.products.find((x) => x.id === e.target.value);
                setPickVid(p?.variants[0]?.id || "");
                setPickPrice(p?.sell?.toString() || "");
              }}
            >
              {db.products.filter(isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — ৳{p.sell}
                </option>
              ))}
            </select>
            <select
              className="w-36 text-xs rounded-xl border border-stone-200 bg-stone-50 p-2 focus:outline-none"
              value={pickVid}
              onChange={(e) => setPickVid(e.target.value)}
            >
              {(pickedProd?.variants || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.color} ({v.qty} pcs)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-28">
              <input
                type="number"
                placeholder="দাম ৳"
                className="w-full text-xs rounded-xl border border-stone-200 bg-white p-2 font-bold focus:outline-none"
                value={pickPrice}
                onChange={(e) => setPickPrice(e.target.value)}
              />
            </div>
            <Btn small color="amber" onClick={addItem} className="flex-1">
              + ব্যাগে যোগ করুন
            </Btn>
          </div>

          {/* Selected Items List */}
          {selectedItems.length > 0 && (
            <div className="mt-2.5 space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-600 block">
                অর্ডারের ব্যাগসমূহ ({selectedItems.length}টি)
              </span>
              {selectedItems.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-stone-200"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-stone-900 block truncate">
                      {it.productName}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {it.variantLabel} x {it.qty} = <b>৳{it.price * it.qty}</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-stone-400 hover:text-red-600 text-sm ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500">আইটেম মোট: ৳{itemsTotal} + ডেলিভারি: ৳{dcharge}</div>
            <div className="text-base font-black text-amber-950">
              মোট ক্যাশ কালেকশন (COD): ৳{totalCod}
            </div>
          </div>
          <div className="w-28 text-right">
            <label className="text-[10px] font-bold text-stone-600 block mb-0.5">ম্যানুয়াল COD?</label>
            <input
              type="number"
              placeholder="যেমন: 1450"
              className="w-full text-xs rounded-lg border border-stone-300 bg-white p-1 text-center font-bold focus:outline-none"
              value={customCod}
              onChange={(e) => setCustomCod(e.target.value)}
            />
          </div>
        </div>

        {/* Note */}
        <Field label="ডেলিভারি নোট (স্টেডফাস্ট পার্সেল নোটে যাবে)">
          <input
            className={inputCls}
            placeholder="যেমন: শুক্রবার ডেলিভারি দিতে হবে"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {/* Auto Send to Steadfast Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer bg-amber-50/60 p-2.5 rounded-xl border border-amber-900/15">
          <input
            type="checkbox"
            checked={autoSendSteadfast}
            onChange={(e) => setAutoSendSteadfast(e.target.checked)}
            className="w-4 h-4 text-amber-700 accent-amber-700 rounded"
          />
          <span className="text-xs font-bold text-stone-800">
            🚚 সেভ করার সাথে সাথে স্টেডফাস্টে পার্সেল তৈরি করুন
          </span>
        </label>

        {/* Submit Button */}
        <div className="pt-2">
          <Btn color="amber" onClick={submitOrder} disabled={busy}>
            {busy ? "অর্ডার সেভ হচ্ছে..." : "✅ অর্ডার কনফার্ম করুন"}
          </Btn>
        </div>
      </div>

      {/* Fraud Report Modal */}
      {fraudReport && (
        <Modal title="🛡️ কাস্টমার কুরিয়ার ও ফ্রড রিপোর্ট" onClose={() => setFraudReport(null)}>
          <div className="space-y-3">
            <div
              className="p-3 rounded-xl border text-center"
              style={{
                borderColor: fraudReport.risk_verdict?.color || "#16a34a",
                backgroundColor: `${fraudReport.risk_verdict?.color}15`,
              }}
            >
              <div
                className="text-base font-black"
                style={{ color: fraudReport.risk_verdict?.color || "#16a34a" }}
              >
                {fraudReport.risk_verdict?.label}
              </div>
              <p className="text-xs text-stone-700 mt-1">
                {fraudReport.risk_verdict?.action}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-stone-50 p-2 rounded-xl border">
                <div className="font-bold text-stone-800">{fraudReport.total} টি</div>
                <div className="text-stone-500 text-[10px]">মোট পার্সেল</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-800">{fraudReport.delivered} টি</div>
                <div className="text-emerald-600 text-[10px]">সফল ডেলিভারি</div>
              </div>
              <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                <div className="font-bold text-red-800">{fraudReport.cancelled} টি</div>
                <div className="text-red-600 text-[10px]">ক্যানসেল/রিটার্ন</div>
              </div>
            </div>

            <div className="text-center font-bold text-xs text-stone-700">
              সামগ্রিক সাকসেস রেট: <span className="text-emerald-700 font-black">{fraudReport.rate}%</span>
            </div>

            <Btn small color="gray" onClick={() => setFraudReport(null)}>
              ঠিক আছে
            </Btn>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

/* ---------------- Main Orders Tab ---------------- */
export default function OrdersTab() {
  const { db, mutateAndSync, notify } = useShop();
  const { role } = useAuth();
  const isOwner = role === "owner" || role === "admin";

  const [isCreating, setIsCreating] = useState(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "all" | "custom">("today");
  const [customDate, setCustomDate] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Filter orders by date & search
  const filteredOrders = useMemo(() => {
    const todayStart = db.salesDay?.start || 0;
    const now = Date.now();
    const oneDayMs = 86400000;

    return (db.orders || []).filter((o) => {
      // 1. Date Filter
      const ots = o.ts || 0;
      if (dateFilter === "today") {
        if (todayStart > 0 && ots < todayStart) return false;
      } else if (dateFilter === "yesterday") {
        if (todayStart > 0) {
          if (ots >= todayStart || ots < todayStart - oneDayMs) return false;
        }
      } else if (dateFilter === "custom" && customDate) {
        const orderDateStr = new Date(ots).toISOString().slice(0, 10);
        if (orderDateStr !== customDate) return false;
      }

      // 2. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = (
          o.id +
          " " +
          o.customer +
          " " +
          o.phone +
          " " +
          o.address +
          " " +
          (o.steadfastId || "") +
          " " +
          (o.trackingCode || "") +
          " " +
          o.items.map((it) => it.productName).join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [db.orders, db.salesDay?.start, dateFilter, customDate, search]);

  const updateOrderStatus = async (o: Order, newStatus: OrderStatus) => {
    if (newStatus === "Returned" && o.status !== "Returned") {
      if (confirm(`"${o.customer}" এর অর্ডারের ব্যাগগুলো কি স্টকে ফেরত যোগ করবেন?`)) {
        await mutateAndSync((d) => {
          restoreInto(d, o.items);
          const target = d.orders.find((x) => x.id === o.id);
          if (target) {
            target.status = "Returned";
            target.statusTs = Date.now();
          }
          d.moves.unshift({
            id: uid(),
            date: todayBn(),
            text: `↩️ রিটার্ন রিসিভ: অর্ডার ${o.id} এর ব্যাগ স্টকে ফেরত নেওয়া হলো`,
          });
        });
        return;
      }
    }

    await mutateAndSync((d) => {
      const target = d.orders.find((x) => x.id === o.id);
      if (target) {
        target.status = newStatus;
        target.statusTs = Date.now();
      }
    });
  };

  const dispatchToSteadfast = async (o: Order) => {
    if (o.steadfastId) {
      alert(`এই অর্ডারটি ইতিমধ্যে স্টেডফাস্টে পাঠানো হয়েছে (CID: ${o.steadfastId})`);
      return;
    }
    const res = await createParcel(o);
    if (!res) {
      alert("স্টেডফাস্টে পাঠানো যায়নি: " + (steadLastError() || "দয়া করে সেটিংস চেক করুন"));
      return;
    }

    await mutateAndSync((d) => {
      const target = d.orders.find((x) => x.id === o.id);
      if (target) {
        target.steadfastId = res.cid;
        target.trackingCode = res.tracking;
        target.status = "Shipped";
      }
    });

    notify("স্টেডফাস্ট পার্সেল তৈরি!", `${o.customer} এর পার্সেল সফলভাবে স্টেডফাস্টে পাঠানো হয়েছে। CID: ${res.cid}`);
  };

  const copyFacebookReply = async (o: Order) => {
    const itemsList = o.items.map((it) => `• ${it.productName} (${it.variantLabel}) - ${it.qty} পিস`).join("\n");
    const reply = `প্রিয় ${o.customer},\nআপনার ব্যাগের অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 👜✨\n\nঅর্ডার বিবরণ:\n${itemsList}\nমোট প্রদেয় টাকা (COD): ৳${codOf(o)}\nঠিকানা: ${o.address}\n\n${
      o.trackingCode
        ? `স্টেডফাস্ট ট্র্যাকিং কোড: ${o.trackingCode}\nকুরিয়ারের মাধ্যমে ২-৩ দিনের মধ্যে ডেলিভারি পেয়ে যাবেন।`
        : `খুব শীঘ্রই স্টেডফাস্ট কুরিয়ারে আপনার পার্সেল হ্যান্ডওভার করা হবে।`
    }\n\nআমাদের সাথে থাকার জন্য ধন্যবাদ! 💖`;

    try {
      await navigator.clipboard.writeText(reply);
      alert("✅ ফেসবুক রিপ্লাই কপি হয়েছে! মেসেঞ্জারে পাঠিয়ে দিন।");
    } catch {
      prompt("কপি করুন:", reply);
    }
  };

  const deleteOrder = async (o: Order) => {
    if (!confirm(`"${o.customer}" এর অর্ডার ${o.id} মুছে ফেলবেন?`)) return;
    const shouldRestore = confirm("এই অর্ডারের ব্যাগগুলো কি স্টকে ফেরত যোগ করবেন?");
    await mutateAndSync((d) => {
      if (shouldRestore) restoreInto(d, o.items);
      d.orders = d.orders.filter((x) => x.id !== o.id);
      d.moves.unshift({
        id: uid(),
        date: todayBn(),
        text: `🗑️ অর্ডার মুছে ফেলা হলো: ${o.id} (${o.customer})`,
      });
    });
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
          🧾 ফেসবুক অর্ডারসমূহ
        </h2>
        <div className="flex items-center gap-1.5">
          <Btn small color="amber" onClick={() => setIsCreating(true)}>
            + নতুন অর্ডার
          </Btn>
        </div>
      </div>

      {/* Quick Reply Toggle */}
      <button
        onClick={() => setShowQuickReply(!showQuickReply)}
        className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-amber-50 border border-amber-900/15 text-amber-900 flex items-center justify-between cursor-pointer"
      >
        <span>💬 ফেসবুক মেসেঞ্জার কুইক রিপ্লাই জেনারেটর</span>
        <span>{showQuickReply ? "▲ বন্ধ" : "▼ দেখুন"}</span>
      </button>

      {showQuickReply && <QuickReply />}

      {/* Filter Bar */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <input
          type="search"
          placeholder="🔍 কাস্টমারের নাম, ফোন, ইনভয়েস বা CID দিয়ে খুঁজুন..."
          className={inputCls}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              dateFilter === "today" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            আজ
          </button>
          <button
            onClick={() => setDateFilter("yesterday")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              dateFilter === "yesterday" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            গতকাল
          </button>
          <button
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              dateFilter === "all" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            সব অর্ডার ({db.orders.length})
          </button>
          <button
            onClick={() => setDateFilter("custom")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              dateFilter === "custom" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            তারিখ
          </button>
        </div>

        {dateFilter === "custom" && (
          <input
            type="date"
            className={inputCls}
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Empty text="কোন অর্ডার খুঁজে পাওয়া যায়নি" />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="relative">
              {/* Order Header */}
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 text-sm">{o.customer}</span>
                    <Badge status={o.status} />
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                    <a
                      href={`tel:${o.phone}`}
                      className="font-bold text-amber-900 hover:underline"
                    >
                      📞 {o.phone}
                    </a>
                    <span>• {zoneName(o.zone)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-amber-950">৳{codOf(o)}</div>
                  <span className="text-[10px] text-stone-400">{o.id}</span>
                </div>
              </div>

              {/* Address */}
              <div className="py-2 text-xs text-stone-700">
                <span className="font-bold text-stone-500">ঠিকানা:</span> {o.address}
                {o.note && (
                  <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg">
                    📝 নোট: {o.note}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs space-y-1 my-1">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-stone-800">
                      👜 <b>{it.productName}</b> [{it.variantLabel}] x{it.qty}
                    </span>
                    <span className="font-bold text-stone-700">@৳{it.price}</span>
                  </div>
                ))}
              </div>

              {/* Steadfast CID / Status line */}
              <div className="mt-2 flex items-center justify-between text-xs bg-stone-100/70 p-2 rounded-xl">
                <div>
                  {o.steadfastId ? (
                    <span className="font-bold text-purple-900">
                      CID: <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200">{o.steadfastId}</code>
                    </span>
                  ) : (
                    <span className="text-stone-500">স্টেডফাস্ট পার্সেল তৈরি হয়নি</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Status Dropdown */}
                  <select
                    className="text-xs rounded-lg border border-stone-300 bg-white p-1 font-bold focus:outline-none"
                    value={o.status}
                    onChange={(e) => updateOrderStatus(o, e.target.value as OrderStatus)}
                  >
                    {ALL_STATUS.map((st) => (
                      <option key={st} value={st}>
                        {BN_STATUS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-stone-100 pt-2 text-xs">
                <div className="flex items-center gap-1">
                  {!o.steadfastId && (
                    <Btn small color="green" onClick={() => dispatchToSteadfast(o)}>
                      🚚 স্টেডফাস্টে পাঠান
                    </Btn>
                  )}
                  {o.steadfastId && (
                    <Btn small color="blue" onClick={() => setTrackingOrder(o)}>
                      🔍 Live Track
                    </Btn>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Btn small color="gray" onClick={() => copyFacebookReply(o)}>
                    💬 রিপ্লাই কপি
                  </Btn>
                  {isOwner && (
                    <button
                      onClick={() => deleteOrder(o)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                      title="অর্ডার মুছুন"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {isCreating && <CreateOrderModal onClose={() => setIsCreating(false)} />}

      {/* Live Tracking Modal */}
      {trackingOrder && (
        <Modal
          title={`🚚 স্টেডফাস্ট লাইভ ট্র্যাকিং (${trackingOrder.id})`}
          onClose={() => setTrackingOrder(null)}
        >
          <div className="space-y-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
              <div><b>কাস্টমার:</b> {trackingOrder.customer} ({trackingOrder.phone})</div>
              <div><b>ঠিকানা:</b> {trackingOrder.address}</div>
              <div><b>Consignment ID:</b> {trackingOrder.steadfastId}</div>
              <div><b>ট্র্যাকিং কোড:</b> {trackingOrder.trackingCode || "N/A"}</div>
            </div>

            <div className="border-l-2 border-amber-700 pl-4 space-y-3 py-1">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-amber-700"></div>
                <div className="text-xs font-bold text-stone-900">পার্সেল পিকআপ সম্পন্ন হয়েছে</div>
                <div className="text-[10px] text-stone-500">স্টেডফাস্ট হাব কর্তৃক রিসিভড</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-600"></div>
                <div className="text-xs font-bold text-stone-900">গন্তব্যের হাবে ইন-ট্রানজিট</div>
                <div className="text-[10px] text-stone-500">ডেলিভারি রাইডারের নিকট প্রেরিত</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-stone-300"></div>
                <div className="text-xs font-bold text-stone-500">ডেলিভারি ও ক্যাশ কালেকশন</div>
                <div className="text-[10px] text-stone-400">প্রক্রিয়াধীন</div>
              </div>
            </div>

            <Btn small color="gray" onClick={() => setTrackingOrder(null)}>
              বন্ধ করুন
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
