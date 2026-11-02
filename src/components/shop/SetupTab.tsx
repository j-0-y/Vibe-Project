"use client";
import React, { useEffect, useState } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { steadApi } from "@/lib/api";
import { DEFAULT_SHIP, type Zone } from "@/lib/utils";
import { resetSupabaseClient, SUPABASE_SQL_SCHEMA } from "@/lib/supabase";
import { Btn, Card, inputCls, Field } from "@/components/ui";

export default function SetupTab() {
  const { db, mutate, pushNow, cloudMsg, resetToDemoData } = useShop();
  const { role, userEmail, shopId, logout } = useAuth();

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

  // Delivery Charges
  const [insideFee, setInsideFee] = useState((db.settings?.ship?.inside?.fee ?? 80).toString());
  const [subFee, setSubFee] = useState((db.settings?.ship?.sub?.fee ?? 100).toString());
  const [outsideFee, setOutsideFee] = useState((db.settings?.ship?.outside?.fee ?? 130).toString());

  // Supabase Credentials
  const [sbUrl, setSbUrl] = useState(db.settings?.supabase?.url || "");
  const [sbAnonKey, setSbAnonKey] = useState(db.settings?.supabase?.anonKey || "");
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    // Load stored steadfast creds if present
    try {
      const l = JSON.parse(localStorage.getItem("steadfast_creds") || "{}");
      if (l.key && !sfKey) setSfKey(l.key);
      if (l.secret && !sfSecret) setSfSecret(l.secret);
    } catch {}
  }, []);

  const saveSettings = async () => {
    const steadfast = {
      key: sfKey.trim(),
      secret: sfSecret.trim(),
      base: sfBase.trim().replace(/\/$/, ""),
    };

    try {
      localStorage.setItem("steadfast_creds", JSON.stringify(steadfast));
    } catch {}

    const supabase = {
      url: sbUrl.trim(),
      anonKey: sbAnonKey.trim(),
    };

    mutate((d) => {
      d.settings = d.settings || {};
      d.settings.shopName = shopName.trim();
      d.settings.fxRate = +fxRate || 130;
      d.settings.steadfast = steadfast;
      d.settings.supabase = supabase;
      d.settings.ship = {
        inside: { cost: 80, fee: +insideFee || 80 },
        sub: { cost: 100, fee: +subFee || 100 },
        outside: { cost: 115, fee: +outsideFee || 130 },
      };
    });

    resetSupabaseClient();
    setTimeout(() => {
      void pushNow();
    }, 300);

    alert("✅ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
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
    } catch (e: unknown) {
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
      <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
        ⚙️ দোকান ও সিস্টেম সেটিংস
      </h2>

      {/* Account and Cloud Status */}
      <Card>
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-2.5">
          <div>
            <div className="text-xs text-stone-500">বর্তমান অ্যাকাউন্ট:</div>
            <div className="font-black text-stone-900 text-sm">{userEmail}</div>
            <div className="text-[11px] text-amber-900 font-bold mt-0.5">
              ভূমিকা: {role === "owner" ? "দোকানের মালিক (Owner)" : "স্টাফ (Staff)"}
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

        <Field label="দোকানের নাম">
          <input
            className={inputCls}
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="যেমন: আমার ব্যাগের দোকান"
          />
        </Field>
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

      {/* Delivery Charges */}
      <Card>
        <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
          📦 কাস্টমার ডেলিভারি চার্জ (টাকায়)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Field label="ঢাকার ভেতর (৳)">
            <input
              type="number"
              className={inputCls}
              value={insideFee}
              onChange={(e) => setInsideFee(e.target.value)}
            />
          </Field>
          <Field label="সাব-ঢাকা (৳)">
            <input
              type="number"
              className={inputCls}
              value={subFee}
              onChange={(e) => setSubFee(e.target.value)}
            />
          </Field>
          <Field label="ঢাকার বাইরে (৳)">
            <input
              type="number"
              className={inputCls}
              value={outsideFee}
              onChange={(e) => setOutsideFee(e.target.value)}
            />
          </Field>
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
      <Btn color="amber" onClick={saveSettings}>
        💾 সমস্ত সেটিংস সেভ করুন
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
        <div className="grid grid-cols-2 gap-2">
          <Btn small color="gray" onClick={exportBackup}>
            📥 ব্যাকআপ ডাউনলোড (JSON)
          </Btn>
          <Btn
            small
            color="red"
            onClick={() => {
              if (confirm("আপনি কি নিশ্চিত ডেমো ব্যাগের ডেটা রিলোড করতে চান?")) {
                resetToDemoData();
              }
            }}
          >
            ⚠️ ডেমো ডেটা রিলোড
          </Btn>
        </div>
      </Card>
    </div>
  );
}
