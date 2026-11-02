"use client";
import React from "react";
import { useShop } from "@/hooks/useShop";
import { totalQty, isLow } from "@/lib/utils";
import { Btn, Card, Stat, Empty } from "@/components/ui";

export default function HomeTab({ go }: { go: (t: string) => void }) {
  const { db } = useShop();

  const designs = db.products.length;
  const pcs = db.products.reduce((a, p) => a + totalQty(p), 0);
  const lows = db.products.filter(isLow);
  const lowCount = lows.length;
  const pendingOrders = db.orders.filter(
    (o) => o.status === "Pending" || o.status === "Packed"
  ).length;

  return (
    <div className="space-y-3 pb-8">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat num={designs} label="মোট ব্যাগ মডেল" icon="👜" />
        <Stat num={pcs} label="মোট পিস স্টকে" icon="📦" />
        <Stat
          num={lowCount}
          label="লো স্টক মডেল"
          icon="⚠️"
          alert={lowCount > 0}
        />
        <Stat num={pendingOrders} label="পেন্ডিং অর্ডার" icon="🧾" />
      </div>

      {/* ⚡ Quick 1-Tap Actions */}
      <Card>
        <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
          <span>⚡</span>
          <span>দ্রুত কাজ (১ চাপে)</span>
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <button
            onClick={() => go("orders")}
            className="p-3 rounded-xl bg-amber-900 text-white font-bold text-xs hover:bg-amber-950 transition-all active:scale-95 shadow-xs flex flex-col items-center justify-center min-h-[64px] cursor-pointer"
          >
            <span className="text-xl mb-1">🧾</span>
            <span>নতুন অর্ডার</span>
          </button>
          <button
            onClick={() => go("stock")}
            className="p-3 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-all active:scale-95 shadow-xs flex flex-col items-center justify-center min-h-[64px] cursor-pointer"
          >
            <span className="text-xl mb-1">👜</span>
            <span>ব্যাগ স্টক</span>
          </button>
          <button
            onClick={() => go("reports")}
            className="p-3 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-all active:scale-95 shadow-xs flex flex-col items-center justify-center min-h-[64px] cursor-pointer"
          >
            <span className="text-xl mb-1">📊</span>
            <span>আজকের হিসাব</span>
          </button>
        </div>
      </Card>

      {/* 🚀 Setup Guide Banner */}
      <div
        onClick={() => go("guide")}
        className="cursor-pointer bg-gradient-to-r from-amber-900 to-stone-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs hover:opacity-95 transition-opacity"
      >
        <div>
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            নতুন মার্চেন্ট?
          </span>
          <span className="font-extrabold text-sm block">
            🚀 স্টেডফাস্ট ও সুপাবেস সেটআপ গাইড দেখুন
          </span>
          <span className="text-[11px] text-stone-300">
            নন-টেকনিক্যাল ৪-স্টেপ নির্দেশিকা ও রেডিমেড SQL স্ক্রিপ্ট
          </span>
        </div>
        <div className="text-2xl ml-2">➜</div>
      </div>

      {/* ⚠️ Low Stock Alert */}
      <Card>
        <h3 className="font-bold text-stone-900 text-sm mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>⚠️</span>
            <span>কম স্টক সতর্কতা</span>
          </span>
          {lows.length > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {lows.length}টি মডেল কম
            </span>
          )}
        </h3>

        {lows.length === 0 ? (
          <Empty text="সব ব্যাগের পর্যাপ্ত স্টক রয়েছে ✅" />
        ) : (
          <div className="space-y-2 mt-2">
            {lows.map((p) => (
              <div
                key={p.id}
                className="rounded-xl bg-amber-50/80 p-2.5 text-xs border border-amber-900/15"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">👜 {p.name}</span>
                  <span className="text-[10px] text-stone-500 font-semibold">{p.code}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.variants
                    .filter((v) => v.qty <= (p.low || 3))
                    .map((v) => (
                      <span
                        key={v.id}
                        className="bg-white px-2 py-0.5 rounded-md border border-red-200 text-red-700 font-black text-[11px]"
                      >
                        {v.color}: {v.qty <= 0 ? "শেষ ❌" : `${v.qty} pcs বাকি`}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Orders Overview */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <span>📦</span>
            <span>সর্বশেষ ফেসবুক অর্ডার</span>
          </h3>
          <button
            onClick={() => go("orders")}
            className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
          >
            সব দেখুন ➜
          </button>
        </div>

        {db.orders.length === 0 ? (
          <Empty text="কোন অর্ডার এখনও করা হয়নি" />
        ) : (
          <div className="space-y-2">
            {db.orders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200"
              >
                <div>
                  <div className="font-bold text-stone-900">{o.customer}</div>
                  <div className="text-[11px] text-stone-500">{o.phone} • {o.items.length} আইটেম</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-950">৳{o.cod || o.total}</div>
                  <div className="text-[10px] text-stone-400">{o.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
