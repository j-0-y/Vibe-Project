"use client";
import React, { useEffect, useState } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { steadApi } from "@/lib/api";
import { resetSupabaseClient, SUPABASE_SQL_SCHEMA } from "@/lib/supabase";
import { Btn, Card, inputCls, Field } from "@/components/ui";

export default function SetupTab() {
  const { db, mutateAndSync, pushNow, cloudMsg, resetToDemoData, notify } = useShop();
  const { role, userEmail, shopId, logout, setView } = useAuth();

  // Shop Name & FX Rate
  const [shopName, setShopName] = useState(db.settings?.shopName || "আমার ব্যাগের দোকান");
  const [fxRate, setFxRate] = useState((db.settings?.fxRate || 130).toString());

  // Steadfast state
  const [sfKey, setSfKey] = useState(db.settings?.steadfast?.key || "");
  const [sfSecret, setSfSecret] = useState(db.settings?.steadfast?.secret || "");
  const [sfBase, setSfBase] = useState(
    db.settings?.steadfast?.base || "https://portal.packzy.com/api/v1"
  );
  const [sfBalance, setSfBalance] = useState<string | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  // Delivery Charges (Customer Fee & Courier Cost)
  const [insideFee, setInsideFee] = useState((db.settings?.ship?.inside?.fee ?? 80).toString());
  const [insideCost, setInsideCost] = useState((db.settings?.ship?.inside?.cost ?? 80).toString());
  const [subFee, setSubFee] = useState((db.settings?.ship?.sub?.fee ?? 100).toString());
  const [subCost, setSubCost] = useState((db.settings?.ship?.sub?.cost ?? 100).toString());
  const [outsideFee, setOutsideFee] = useState((db.settings?.ship?.outside?.fee ?? 130).toString());
  const [outsideCost, setOutsideCost] = useState((db.settings?.ship?.outside?.cost ?? 115).toString());

  // Supabase Credentials
  const [sbUrl, setSbUrl] = useState(db.settings?.supabase?.url || "");
  const [sbAnonKey, setSbAnonKey] = useState(db.settings?.supabase?.anonKey || "");
  const [copiedSql, setCopiedSql] = useState(false);

  // BD Courier API Key
  const [bdKey, setBdKey] = useState(db.settings?.bdCourierKey || "");
  const [testingBd, setTestingBd] = useState(false);
  const [bdTestMsg, setBdTestMsg] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever db.settings updates (e.g. from cloud or reload)
  useEffect(() => {
    if (db.settings) {
      if (db.settings.shopName) setShopName(db.settings.shopName);
      if (db.settings.fxRate) setFxRate(db.settings.fxRate.toString());
      if (db.settings.ship?.inside) {
        setInsideFee((db.settings.ship.inside.fee ?? 80).toString());
        setInsideCost((db.settings.ship.inside.cost ?? 80).toString());
      }
      if (db.settings.ship?.sub) {
        setSubFee((db.settings.ship.sub.fee ?? 100).toString());
        setSubCost((db.settings.ship.sub.cost ?? 100).toString());
      }
      if (db.settings.ship?.outside) {
        setOutsideFee((db.settings.ship.outside.fee ?? 130).toString());
        setOutsideCost((db.settings.ship.outside.cost ?? 115).toString());
      }
      if (db.settings.steadfast?.key) setSfKey(db.settings.steadfast.key);
      if (db.settings.steadfast?.secret) setSfSecret(db.settings.steadfast.secret);
      if (db.settings.supabase?.url) setSbUrl(db.settings.supabase.url);
      if (db.settings.supabase?.anonKey) setSbAnonKey(db.settings.supabase.anonKey);
      if (db.settings.bdCourierKey) setBdKey(db.settings.bdCourierKey);
    }
  }, [db.settings]);

  // Load stored steadfast, supabase, and bd courier creds from server or localStorage
  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem("steadfast_creds") || "{}");
      if (l.key && !sfKey) setSfKey(l.key);
      if (l.secret && !sfSecret) setSfSecret(l.secret);
      const b = localStorage.getItem("bd_courier_api_key");
      if (b && !bdKey) setBdKey(b);
    } catch {}

    // Also pull directly from shared server config for instant cross-device sync
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (!cfg) return;
        if (cfg.supabase?.url) setSbUrl(cfg.supabase.url);
        if (cfg.supabase?.anonKey) setSbAnonKey(cfg.supabase.anonKey);
        if (cfg.steadfast?.key) setSfKey(cfg.steadfast.key);
        if (cfg.steadfast?.secret) setSfSecret(cfg.steadfast.secret);
        if (cfg.bdCourierKey) setBdKey(cfg.bdCourierKey);
        if (cfg.shopName) setShopName(cfg.shopName);
      })
      .catch(() => {});
  }, []);

  const saveSettings = async () => {
    const cleanName = shopName.trim() || "আমার ব্যাগের দোকান";
    const steadfast = {
      key: sfKey.trim(),
      secret: sfSecret.trim(),
      base: sfBase.trim().replace(/\/$/, ""),
    };

    try {
      localStorage.setItem("steadfast_creds", JSON.stringify(steadfast));
      localStorage.setItem("bd_courier_api_key", bdKey.trim());
    } catch {}

    const supabase = {
      url: sbUrl.trim(),
      anonKey: sbAnonKey.trim(),
    };

    setIsSaving(true);

    // Save to central server for instant cross-device sync (Mobile & Laptop)
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: cleanName,
          fxRate: +fxRate || 130,
          steadfast,
          supabase,
          bdCourierKey: bdKey.trim(),
          ship: {
            inside: { cost: +insideCost || 80, fee: +insideFee || 80 },
            sub: { cost: +subCost || 100, fee: +subFee || 100 },
            outside: { cost: +outsideCost || 115, fee: +outsideFee || 130 },
          },
        }),
      });
    } catch (cfgErr) {
      console.warn("Server config sync warning:", cfgErr);
    }

    await mutateAndSync((d) => {
      d.settings = d.settings || {};
      d.settings.shopName = cleanName;
      d.settings.fxRate = +fxRate || 130;
      d.settings.steadfast = steadfast;
      d.settings.supabase = supabase;
      d.settings.bdCourierKey = bdKey.trim();
      d.settings.ship = {
        inside: { cost: +insideCost || 80, fee: +insideFee || 80 },
        sub: { cost: +subCost || 100, fee: +subFee || 100 },
        outside: { cost: +outsideCost || 115, fee: +outsideFee || 130 },
      };
    });

    resetSupabaseClient();
    setIsSaving(false);
    notify("সেটিংস সংরক্ষিত!", `দোকানের নাম "${cleanName}", ডেলিভারি চার্জ ও BD Courier API সংরক্ষিত হয়েছে।`);
    alert("✅ সমস্ত সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
  };

  const testBdCourier = async () => {
    if (!bdKey.trim()) {
      alert("আগে BD Courier API Key ইনপুট ফিল্ডে পেস্ট করুন");
      return;
    }
    setTestingBd(true);
    setBdTestMsg(null);
    try {
      const res = await fetch("/api/bdcourier/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bdcourier-key": bdKey.trim(),
        },
        body: JSON.stringify({ phone: "01711000000", apiKey: bdKey.trim() }),
      });
      const d = await res.json();
      if (d.configured && !d.warning) {
        setBdTestMsg("✅ BD Courier API সংযোগ সফল হয়েছে!");
      } else {
        setBdTestMsg(d.warning || d.message || "API Key সক্রিয় আছে!");
      }
    } catch {
      setBdTestMsg("সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি");
    } finally {
      setTestingBd(false);
    }
  };

  const checkSteadfastBalance = async () => {
    setCheckingBalance(true);
    setSfBalance(null);
    try {
      const res = await steadApi("get_balance");
      if (res && res.current_balance !== undefined) {
        setSfBalance(`৳${res.current_balance.toLocaleString("bn-BD")}`);
      } else {
        setSfBalance("ব্যালেন্স পাওয়া যায়নি");
      }
    } catch {
      setSfBalance("সংযোগ সমস্যা");
    } finally {
      setCheckingBalance(false);
    }
  };

  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `bagbox_backup_${Date.now()}.json`);
    dlAnchor.click();
  };

  const copySqlScript = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      prompt("কপি করুন:", SUPABASE_SQL_SCHEMA);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
          ⚙️ দোকান ও সিস্টেম সেটিংস
        </h2>
        <button
          onClick={() => setView("admin")}
          className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
        >
          👑 অ্যাডমিন প্যানেল
        </button>
      </div>

      {/* Account and Cloud Status */}
      <Card>
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-2.5">
          <div>
            <div className="text-xs text-stone-500">বর্তমান অ্যাকাউন্ট:</div>
            <div className="font-black text-stone-900 text-sm">{userEmail || "owner@bagshop.com"}</div>
            <div className="text-[11px] text-amber-900 font-bold mt-0.5">
              দোকান ID: <code className="bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{shopId || "bag_store_1"}</code>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-stone-700">{cloudMsg}</div>
            <button
              onClick={() => void pushNow()}
              className="mt-1 text-xs font-bold text-amber-800 hover:underline cursor-pointer"
            >
              🔄 এখনই সিঙ্ক করুন
            </button>
          </div>
        </div>

        <Field label="দোকানের নাম (Header ও স্লিপে দেখাবে) *" hint="নাম পরিবর্তন করে নিচে সেভ চাপুন">
          <input
            className={inputCls}
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="যেমন: আমার ব্যাগের দোকান"
          />
        </Field>
      </Card>

      {/* Delivery Charges (Both Customer Charge & Courier Cost) */}
      <Card>
        <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-1.5">
          📦 কাস্টমার ডেলিভারি চার্জ ও কুরিয়ার খরচ
        </h3>
        <p className="text-xs text-stone-500 mb-3">
          অর্ডার তৈরি করার সময় এই রেট স্বয়ংক্রিয়ভাবে জোন অনুযায়ী যোগ হবে।
        </p>

        {/* Inside Dhaka */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 mb-2.5">
          <span className="font-bold text-xs text-stone-800 block mb-1.5">
            📍 ঢাকার ভেতর (Inside Dhaka)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Field label="কাস্টমার চার্জ (৳)">
              <input
                type="number"
                className={inputCls}
                value={insideFee}
                onChange={(e) => setInsideFee(e.target.value)}
              />
            </Field>
            <Field label="কুরিয়ার খরচ (৳)">
              <input
                type="number"
                className={inputCls}
                value={insideCost}
                onChange={(e) => setInsideCost(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Sub Dhaka */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 mb-2.5">
          <span className="font-bold text-xs text-stone-800 block mb-1.5">
            📍 সাব-ঢাকা (সাভার, গাজীপুর, টঙ্গী, নারায়ণগঞ্জ ইত্যাদি)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Field label="কাস্টমার চার্জ (৳)">
              <input
                type="number"
                className={inputCls}
                value={subFee}
                onChange={(e) => setSubFee(e.target.value)}
              />
            </Field>
            <Field label="কুরিয়ার খরচ (৳)">
              <input
                type="number"
                className={inputCls}
                value={subCost}
                onChange={(e) => setSubCost(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Outside Dhaka */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 mb-2.5">
          <span className="font-bold text-xs text-stone-800 block mb-1.5">
            📍 ঢাকার বাইরে (অন্যান্য ৬৩ জেলা)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Field label="কাস্টমার চার্জ (৳)">
              <input
                type="number"
                className={inputCls}
                value={outsideFee}
                onChange={(e) => setOutsideFee(e.target.value)}
              />
            </Field>
            <Field label="কুরিয়ার খরচ (৳)">
              <input
                type="number"
                className={inputCls}
                value={outsideCost}
                onChange={(e) => setOutsideCost(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-2">
          <Field label="ফেসবুক অ্যাড ডলার রেট (BDT/USD)" hint="১ ডলারে কত টাকা খরচ হয়">
            <input
              type="number"
              className={inputCls}
              value={fxRate}
              onChange={(e) => setFxRate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Steadfast Courier Settings */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            🚚 স্টেডফাস্ট কুরিয়ার সংযোগ (API)
          </h3>
          <Btn
            small
            color="green"
            onClick={checkSteadfastBalance}
            disabled={checkingBalance}
          >
            {checkingBalance ? "চেক হচ্ছে..." : "💰 ব্যালেন্স চেক"}
          </Btn>
        </div>

        {sfBalance && (
          <div className="mb-3 bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl text-center">
            <span className="text-xs text-emerald-800 font-medium">স্টেডফাস্ট বর্তমান ব্যালেন্স: </span>
            <span className="text-base font-black text-emerald-950">{sfBalance}</span>
          </div>
        )}

        <div className="space-y-2">
          <Field label="Steadfast Api-Key" hint="portal.packzy.com থেকে কপি করে দিন">
            <input
              type="password"
              className={inputCls}
              value={sfKey}
              onChange={(e) => setSfKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
          <Field label="Steadfast Secret-Key">
            <input
              type="password"
              className={inputCls}
              value={sfSecret}
              onChange={(e) => setSfSecret(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Field>
        </div>
      </Card>

      {/* BD Courier Fraud Check Settings */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            🛡️ বিডি কুরিয়ার ফ্রড চেক সংযোগ (BD Courier API)
          </h3>
          <Btn
            small
            color="green"
            onClick={testBdCourier}
            disabled={testingBd}
          >
            {testingBd ? "টেস্ট হচ্ছে..." : "🔍 API টেস্ট করুন"}
          </Btn>
        </div>

        <p className="text-xs text-stone-500 mb-2.5">
          পার্সেল বুক করার আগেই কাস্টমারের আগের ডেলিভারি সাকসেস ও রিটার্ন রেকর্ড বিডি কুরিয়ার লাইভ ডাটাবেস থেকে চেক করতে আপনার API Key এখানে দিন:
        </p>

        {bdTestMsg && (
          <div className="mb-3 bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-center text-xs font-bold text-stone-800">
            {bdTestMsg}
          </div>
        )}

        <Field label="BD Courier API Key" hint="bdcourier.com থেকে পাওয়া আপনার API Key পেস্ট করুন">
          <input
            type="password"
            className={inputCls}
            value={bdKey}
            onChange={(e) => setBdKey(e.target.value)}
            placeholder="যেমন: bdc_live_xxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </Field>
      </Card>

      {/* Supabase Integration Configuration */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            ☁️ সুপাবেস ক্লাউড ডাটাবেস (Supabase)
          </h3>
          <Btn small color={copiedSql ? "green" : "gray"} onClick={copySqlScript}>
            {copiedSql ? "✅ কপি হয়েছে" : "📋 SQL স্ক্রিপ্ট কপি"}
          </Btn>
        </div>
        <p className="text-xs text-stone-500 mb-2">
          সুপাবেস প্রজেক্টের Project Settings &gt; API থেকে URL ও anon key এখানে দিতে পারেন:
        </p>
        <div className="space-y-2">
          <Field label="Supabase URL">
            <input
              className={inputCls}
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
            />
          </Field>
          <Field label="Supabase Anon Key">
            <input
              type="password"
              className={inputCls}
              value={sbAnonKey}
              onChange={(e) => setSbAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            />
          </Field>
        </div>
      </Card>

      {/* Save Settings Button */}
      <Btn color="amber" onClick={saveSettings} disabled={isSaving}>
        {isSaving ? "সংরক্ষিত হচ্ছে..." : "💾 সমস্ত সেটিংস সেভ করুন"}
      </Btn>

      {/* Backup and Data Reset */}
      <Card className="border-stone-200">
        <h3 className="font-bold text-stone-900 text-sm mb-2">
          💾 ব্যাকআপ ও ডেটা ম্যানেজমেন্ট
        </h3>
        <a
          href="/bagbox-source-code.zip"
          download="bagbox-source-code.zip"
          className="w-full mb-2.5 p-2.5 bg-amber-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-950"
        >
          ⬇️ GitHub এর জন্য রেডিমেড ZIP ডাউনলোড (.zip)
        </a>
        <div className="w-full">
          <Btn small color="gray" onClick={exportBackup}>
            📥 সম্পূর্ণ ব্যাকআপ ডাউনলোড করুন (JSON)
          </Btn>
        </div>
      </Card>
    </div>
  );
}
