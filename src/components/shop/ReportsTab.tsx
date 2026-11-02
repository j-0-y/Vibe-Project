"use client";
import React, { useMemo, useState } from "react";
import { useShop } from "@/hooks/useShop";
import { buyOf, codOf, uid, todayBn } from "@/lib/utils";
import type { MonthAd, Order, Product, SalesDay } from "@/lib/types";
import { Btn, Card, Stat, inputCls, Field } from "@/components/ui";

const GOOD = (o: Order) => !!o && o.status !== "Cancelled" && o.status !== "Returned";
const ots = (o: Order) => +(o.ts || 0);

function calculateDayTotals(orders: Order[], products: Product[]) {
  let ordersN = 0;
  let sales = 0;
  let cogs = 0;
  let delivery = 0;

  for (const o of orders) {
    if (!GOOD(o)) continue;
    ordersN++;
    sales += Math.max(0, codOf(o));
    delivery += (o.charge != null ? o.charge : o.dcost) || 0;
    for (const it of o.items || []) {
      cogs += buyOf(it, products) * (+it.qty || 0);
    }
  }

  return {
    orders: ordersN,
    sales,
    cogs,
    delivery,
    profit: sales - cogs - delivery,
  };
}

const curMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function ReportsTab() {
  const { db, mutateAndSync, notify } = useShop();

  // Current open sales day
  const dayStart = db.salesDay?.start ?? 0;
  const openOrders = useMemo(() => {
    return (db.orders || []).filter((o) => GOOD(o) && ots(o) >= dayStart);
  }, [db.orders, dayStart]);

  const openSummary = useMemo(() => {
    return calculateDayTotals(openOrders, db.products || []);
  }, [openOrders, db.products]);

  // Monthly Report
  const [selectedMonth, setSelectedMonth] = useState(curMonthKey());
  const fxRate = db.settings?.fxRate || 130;

  const currentMonthAd = useMemo(() => {
    return (db.monthAds || []).find((m) => m.month === selectedMonth);
  }, [db.monthAds, selectedMonth]);

  const [adUsdInput, setAdUsdInput] = useState(currentMonthAd?.usd?.toString() || "");

  // Orders in selected month
  const monthOrders = useMemo(() => {
    return (db.orders || []).filter((o) => {
      if (!GOOD(o)) return false;
      const d = new Date(o.ts || 0);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return k === selectedMonth;
    });
  }, [db.orders, selectedMonth]);

  const monthSummary = useMemo(() => {
    return calculateDayTotals(monthOrders, db.products || []);
  }, [monthOrders, db.products]);

  const monthAdBdt = currentMonthAd ? currentMonthAd.bdt : (+adUsdInput || 0) * fxRate;
  const monthFinalNet = monthSummary.profit - monthAdBdt;

  const saveMonthAd = async () => {
    const usd = +adUsdInput || 0;
    const bdt = Math.round(usd * fxRate);

    await mutateAndSync((d) => {
      d.monthAds = d.monthAds || [];
      const idx = d.monthAds.findIndex((m) => m.month === selectedMonth);
      if (idx >= 0) {
        d.monthAds[idx] = {
          id: d.monthAds[idx].id,
          month: selectedMonth,
          usd,
          rate: fxRate,
          bdt,
          ts: Date.now(),
        };
      } else {
        d.monthAds.push({
          id: uid(),
          month: selectedMonth,
          usd,
          rate: fxRate,
          bdt,
          ts: Date.now(),
        });
      }
    });

    notify("অ্যাড খরচ সংরক্ষিত", `${selectedMonth} মাসের বিজ্ঞাপন খরচ $${usd} (৳${bdt}) আপডেট করা হয়েছে`);
  };

  const closeSalesDay = async () => {
    if (openOrders.length === 0) {
      if (!confirm("চলতি সেলস ডে-তে কোন অর্ডার নেই। তবুও কি দিন সমাপ্ত করবেন?")) return;
    } else {
      if (
        !confirm(
          `আজকের সেলস ডে শেষ করবেন?\nমোট অর্ডার: ${openSummary.orders}টি\nমোট বিক্রি: ৳${openSummary.sales}\nমোট লাভ: ৳${openSummary.profit}`
        )
      ) {
        return;
      }
    }

    const now = Date.now();
    const closedDay: SalesDay = {
      id: uid(),
      start: dayStart,
      end: now,
      orders: openSummary.orders,
      sales: openSummary.sales,
      cogs: openSummary.cogs,
      delivery: openSummary.delivery,
      profit: openSummary.profit,
    };

    await mutateAndSync((d) => {
      d.salesDays = d.salesDays || [];
      d.salesDays.unshift(closedDay);
      d.salesDay = { start: now };
      d.moves.unshift({
        id: uid(),
        date: todayBn(),
        text: `🌙 সেলস ডে সমাপ্ত: ${openSummary.orders} অর্ডার, বিক্রি ৳${openSummary.sales}, লাভ ৳${openSummary.profit}`,
      });
    });

    notify("সেলস ডে সমাপ্ত!", "আজকের হিসাব ক্লোজ করে নতুন দিনের হিসাব চালু করা হয়েছে ✅");
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
          📊 দোকান হিসাব ও লাভ-ক্ষতির রিপোর্ট
        </h2>
      </div>

      {/* 🌅 Current Active Sales Day Card */}
      <Card className="border-amber-900/20 bg-gradient-to-br from-amber-50/50 to-white">
        <div className="flex items-center justify-between border-b border-amber-900/10 pb-2.5 mb-3">
          <div>
            <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1">
              🌅 চলতি সেলস ডে (লাইভ হিসাব)
            </span>
            <div className="text-[11px] text-stone-500 mt-0.5">
              শুরু: {dayStart ? new Date(dayStart).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" }) : "শুরু থেকে"}
            </div>
          </div>
          <Btn small color="dark" onClick={closeSalesDay}>
            🌙 দিন ক্লোজ করুন
          </Btn>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat num={openSummary.orders} label="আজকের অর্ডার" />
          <Stat num={`৳${openSummary.sales}`} label="মোট বিক্রি (COD)" />
          <Stat num={`৳${openSummary.cogs}`} label="পণ্যের কেনা দাম" />
          <Stat
            num={`৳${openSummary.profit}`}
            label="আজকের প্রফিট (Ad বাদে)"
            alert={openSummary.profit < 0}
          />
        </div>
      </Card>

      {/* 📅 Monthly Financial Statement */}
      <Card>
        <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            📅 মাসিক লাভ-ক্ষতির পূর্ণাঙ্গ বিবরণী
          </h3>
          <input
            type="month"
            className="text-xs rounded-lg border border-stone-300 p-1 bg-stone-50 focus:outline-none"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              const m = (db.monthAds || []).find((x) => x.month === e.target.value);
              setAdUsdInput(m?.usd?.toString() || "");
            }}
          />
        </div>

        {/* Facebook Ad Expense Input */}
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 mb-3">
          <div className="text-xs font-bold text-stone-800 mb-1.5">
            📢 ফেসবুক বুস্টিং / অ্যাড খরচ (ডলারে)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="যেমন: 50 ($ USD)"
                className="w-full text-xs rounded-xl border border-stone-300 bg-white p-2 focus:outline-none font-bold"
                value={adUsdInput}
                onChange={(e) => setAdUsdInput(e.target.value)}
              />
            </div>
            <div className="text-xs text-stone-500 shrink-0">
              রেট: ৳{fxRate}/$ = <b>৳{monthAdBdt}</b>
            </div>
            <Btn small color="amber" onClick={saveMonthAd}>
              💾 সেভ
            </Btn>
          </div>
        </div>

        {/* 9-Field Statement Table */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">১. মোট সফল অর্ডার সংখ্যা:</span>
            <span className="font-bold text-stone-900">{monthSummary.orders} টি</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">২. মোট বিক্রি / কালেকশন (Gross Sales):</span>
            <span className="font-black text-stone-900">৳{monthSummary.sales}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">৩. ব্যাগের পাইকারি কেনা খরচ (COGS):</span>
            <span className="text-red-700 font-bold">- ৳{monthSummary.cogs}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">৪. কুরিয়ার ডেলিভারি চার্জ খরচ:</span>
            <span className="text-red-700 font-bold">- ৳{monthSummary.delivery}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100 bg-stone-50/70 px-2 rounded-lg font-bold">
            <span className="text-stone-800">৫. বিজ্ঞাপন পূর্ব প্রফিট (Gross Profit):</span>
            <span className="text-stone-900">৳{monthSummary.profit}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">৬. ফেসবুক অ্যাড খরচ (USD):</span>
            <span className="text-stone-700 font-bold">${currentMonthAd?.usd || (+adUsdInput || 0)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-stone-100">
            <span className="text-stone-600">৭. মোট ফেসবুক বিজ্ঞাপন খরচ (BDT):</span>
            <span className="text-red-700 font-bold">- ৳{monthAdBdt}</span>
          </div>
          <div className="flex justify-between py-2.5 px-3 rounded-xl bg-amber-900 text-white font-black text-sm mt-2 shadow-sm">
            <span>৮. নিট লাভ (চূড়ান্ত লাভ / Final Net Profit):</span>
            <span className="text-amber-200 text-base">৳{monthFinalNet}</span>
          </div>
        </div>
      </Card>

      {/* 📜 Closed Sales Days History */}
      <Card>
        <h3 className="font-bold text-stone-900 text-sm mb-2.5">
          📜 বিগত সেলস ডে সমূহের হিস্ট্রি
        </h3>
        {(!db.salesDays || db.salesDays.length === 0) ? (
          <p className="text-xs text-stone-400 py-3 text-center">
            এখনও কোন দিন ক্লোজ করা হয়নি। রাতে "দিন ক্লোজ করুন" চাপলে এখানে হিসাব সংরক্ষণ থাকবে।
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {db.salesDays.map((sd, i) => (
              <div
                key={sd.id || i}
                className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-stone-900">
                    দিন #{db.salesDays.length - i} (
                    {new Date(sd.end).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })})
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {sd.orders} টি অর্ডার • বিক্রি: ৳{sd.sales}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-800">লাভ: ৳{sd.profit}</div>
                  <div className="text-[10px] text-stone-400">COGS: ৳{sd.cogs}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
