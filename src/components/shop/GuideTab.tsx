"use client";
import React, { useState } from "react";
import { Btn, Card } from "@/components/ui";
import { SUPABASE_SQL_SCHEMA } from "@/lib/supabase";

export default function GuideTab() {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      prompt("নিচের SQL কোডটি কপি করুন:", SUPABASE_SQL_SCHEMA);
    }
  };

  const sampleEnv = `# Steadfast Courier Keys
STEADFAST_API_KEY="আপনার_স্টেডফাস্ট_এপিআই_কি"
STEADFAST_SECRET_KEY="আপনার_স্টেডফাস্ট_সিক্রেট_কি"
STEADFAST_BASE_URL="https://portal.packzy.com/api/v1"

# Supabase Keys
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="আপনার_সুপাবেস_সার্ভিস_রোল_কি"
SUPABASE_ANON_KEY="আপনার_সুপাবেস_অ্যানন_কি"

# Client-side Supabase
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="আপনার_সুপাবেস_অ্যানন_কি"

# Shop Identifier
SHOP_ID="bag_store_1"
`;

  const copyEnv = async () => {
    try {
      await navigator.clipboard.writeText(sampleEnv);
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch {
      prompt("কপি করুন:", sampleEnv);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white p-4.5 rounded-2xl shadow-sm">
        <span className="text-amber-300 font-bold text-xs uppercase tracking-wider block mb-1">
          নন-টেকনিক্যাল মার্চেন্ট গাইড
        </span>
        <h2 className="text-xl font-black">
          🚀 নতুন ব্যাগ শপ ও স্টেডফাস্ট সেটআপ গাইড
        </h2>
        <p className="text-xs text-amber-100 mt-1 leading-relaxed">
          কোনো কোডিং জ্ঞান ছাড়াই আপনি কীভাবে সম্পূর্ণ নতুন স্টেডফাস্ট মার্চেন্ট অ্যাকাউন্ট,
          সুপাবেস ক্লাউড ডাটাবেস ও ভার্সেলে আপনার এই অ্যাপ লাইভ করবেন — তার সহজ বাংলা গাইড।
        </p>
      </div>

      {/* Step Navigation Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveStep(1)}
          className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-colors cursor-pointer ${
            activeStep === 1
              ? "bg-amber-900 text-white shadow-xs"
              : "bg-white text-stone-700 border border-stone-200"
          }`}
        >
          ১. স্টেডফাস্ট কুরিয়ার 🚚
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-colors cursor-pointer ${
            activeStep === 2
              ? "bg-amber-900 text-white shadow-xs"
              : "bg-white text-stone-700 border border-stone-200"
          }`}
        >
          ২. সুপাবেস ডাটাবেস ☁️
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-colors cursor-pointer ${
            activeStep === 3
              ? "bg-amber-900 text-white shadow-xs"
              : "bg-white text-stone-700 border border-stone-200"
          }`}
        >
          ৩. ভার্সেল ডেপ্লয়মেন্ট 🌐
        </button>
        <button
          onClick={() => setActiveStep(4)}
          className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-colors cursor-pointer ${
            activeStep === 4
              ? "bg-amber-900 text-white shadow-xs"
              : "bg-white text-stone-700 border border-stone-200"
          }`}
        >
          ৪. ফেসবুক অর্ডার ডিরেক্টরি 📋
        </button>
      </div>

      {/* Step 1: Steadfast Courier Setup */}
      {activeStep === 1 && (
        <Card className="space-y-3.5 border-amber-900/15">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base border-b border-stone-100 pb-2">
            <span>🚚</span>
            <span>স্টেপ ১: স্টেডফাস্ট মার্চেন্ট একাউন্ট তৈরি ও এপিআই কানেকশন</span>
          </div>

          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ১. স্টেডফাস্ট মার্চেন্ট পোর্টাল ভিজিট করুন:
              </span>
              <p>
                ব্রাউজারে যান:{" "}
                <a
                  href="https://portal.packzy.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-900 underline"
                >
                  portal.packzy.com
                </a>{" "}
                এবং আপনার নতুন ব্যাগের শপের নাম দিয়ে <b>"Merchant Registration"</b> সম্পন্ন করুন।
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ২. এপিআই কি (Api-Key & Secret-Key) সংগ্রহ করুন:
              </span>
              <p>
                লগইন করার পর বাম পাশের মেনু থেকে <b>Settings (সেটিংস)</b> বা <b>API</b> অপশনে যান।
                সেখানে আপনি দুটি চাবি পাবেন:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-600 font-medium">
                <li><b>Api-Key</b>: একটি দীর্ঘ কোড</li>
                <li><b>Secret-Key</b>: আরেকটি দীর্ঘ কোড</li>
              </ul>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ৩. এই অ্যাপের সেটিংস ট্যাবে বসিয়ে দিন:
              </span>
              <p>
                এই অ্যাপের <b>⚙️ সেটিংস ট্যাবে</b> যান &gt; <b>স্টেডফাস্ট সংযোগ</b> সেকশনে আপনার
                Api-Key ও Secret-Key পেস্ট করে <b>"সেভ করুন"</b> বাটনে চাপ দিন। সাথে সাথে{" "}
                <b>💰 ব্যালেন্স চেক</b> বাটনে চাপ দিয়ে আপনার একাউন্টের লাইভ ব্যালেন্স দেখতে পাবেন!
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-bold block mb-1">
                ৪. স্বয়ংক্রিয় স্ট্যাটাস আপডেটের জন্য ওয়েবহুক (Webhook):
              </span>
              <p>
                স্টেডফাস্ট ড্যাশবোর্ডে <b>Webhook Settings</b> এ গিয়ে Callback URL এ দিন:
                <br />
                <code className="bg-white px-2 py-1 rounded border border-amber-300 font-mono text-[11px] block mt-1 select-all">
                  https://আপনার-ভার্সেল-ডোমেইন.vercel.app/api/webhook
                </code>
                এর ফলে যখনই কোনো ব্যাগ কাস্টমার ডেলিভারি পেয়ে যাবে বা রিটার্ন হবে, স্টেডফাস্ট স্বয়ংক্রিয়ভাবে আপনার এই অ্যাপে স্ট্যাটাস পাঠিয়ে দেবে!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Supabase Setup */}
      {activeStep === 2 && (
        <Card className="space-y-3.5 border-amber-900/15">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base border-b border-stone-100 pb-2">
            <span>☁️</span>
            <span>স্টেপ ২: সুপাবেস (Supabase) ফ্রি ডাটাবেস তৈরি</span>
          </div>

          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ১. সুপাবেসে নতুন প্রজেক্ট তৈরি করুন:
              </span>
              <p>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-900 underline"
                >
                  supabase.com
                </a>{" "}
                এ গিয়ে ফ্রিতে সাইনআপ করুন &gt; <b>"New Project"</b> এ ক্লিক করুন।
                <br />
                প্রজেক্ট নেম দিন যেমন: <code>my-bag-shop</code> এবং রিজিয়ন সিলেক্ট করুন:{" "}
                <b>Singapore (ap-southeast-1)</b> যাতে বাংলাদেশ থেকে খুব দ্রুত লোড হয়।
              </p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-900/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-950 block">
                  ২. ১ ক্লিকে SQL স্ক্রিপ্ট কপি করুন:
                </span>
                <Btn small color={copiedSql ? "green" : "amber"} onClick={copySql}>
                  {copiedSql ? "✅ কপি হয়েছে!" : "📋 SQL কপি করুন"}
                </Btn>
              </div>
              <p className="text-[11px] text-amber-900">
                উপরের বাটনে চাপ দিয়ে পুরো ডাটাবেস টেবিল ও সিকিউরিটি স্ক্রিপ্ট কপি করে নিন।
                এরপর সুপাবেস ড্যাশবোর্ডের বাম পাশের <b>SQL Editor</b> এ গিয়ে <b>New Query</b> তে পেস্ট করে{" "}
                <b>"Run"</b> চাপুন। সাথে সাথে আপনার ডাটাবেস সম্পূর্ণ রেডি হয়ে যাবে!
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ৩. API কী সংগ্রহ করুন:
              </span>
              <p>
                সুপাবেসের বামে <b>Project Settings (আইকন ⚙️)</b> &gt; <b>API</b> তে যান।
                সেখান থেকে নিচের দুটি তথ্য কপি করে নিন:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-600 font-medium">
                <li><b>Project URL</b> (যেমন: <code>https://xyz.supabase.co</code>)</li>
                <li><b>anon public key</b> (ব্রাউজারের জন্য)</li>
                <li><b>service_role secret key</b> (ভার্সেল সার্ভারের জন্য)</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Vercel Deployment */}
      {activeStep === 3 && (
        <Card className="space-y-3.5 border-amber-900/15">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base border-b border-stone-100 pb-2">
            <span>🌐</span>
            <span>স্টেপ ৩: ভার্সেল (Vercel) এ ফ্রিতে লাইভ ডেপ্লয়মেন্ট</span>
          </div>

          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="bg-amber-100/70 p-3.5 rounded-xl border border-amber-900/30 text-center">
              <span className="font-extrabold text-amber-950 block mb-1.5 text-sm">
                📦 রেডিমেড সোর্স কোড ZIP (১ ক্লিকে ডাউনলোড)
              </span>
              <p className="text-[11px] text-amber-900 mb-2.5">
                GitHub-এ আপলোড করার জন্য প্রয়োজনীয় সব ক্লিন ফাইল (অপ্রয়োজনীয় ফাইল ছাড়া) এই জিপের ভেতরে প্রস্তুত করা আছে:
              </p>
              <a
                href="/bagbox-source-code.zip"
                download="bagbox-source-code.zip"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                ⬇️ bagbox-source-code.zip ডাউনলোড করুন
              </a>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ১. গিটহাব রিপোজিটরিতে কোড পুশ করুন:
              </span>
              <p>
                উপরের বাটন দিয়ে জিপটি ডাউনলোড করে আনজিপ করুন, তারপর GitHub-এ একটি নতুন রিপোজিটরি খুলে ফাইলগুলো আপলোড করে দিন।
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ২. ভার্সেলে ইমপোর্ট করুন:
              </span>
              <p>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-900 underline"
                >
                  vercel.com
                </a>{" "}
                এ গিয়ে <b>"Add New... &gt; Project"</b> ক্লিক করে আপনার গিটহাব রিপোজিটরিটি Import করুন।
              </p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-900/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-950 block">
                  ৩. Environment Variables দিন:
                </span>
                <Btn small color={copiedEnv ? "green" : "amber"} onClick={copyEnv}>
                  {copiedEnv ? "✅ ভেরিয়েবল কপি হয়েছে!" : "📋 ভেরিয়েবল কপি করুন"}
                </Btn>
              </div>
              <p className="text-[11px] text-amber-900 mb-2">
                ভার্সেল ডেপ্লয়মেন্ট স্ক্রিনে <b>Environment Variables</b> সেকশনে নিচের ভেরিয়েবলগুলো দিয়ে দিন:
              </p>
              <pre className="bg-stone-900 text-amber-300 p-2.5 rounded-xl font-mono text-[10px] overflow-x-auto">
                {sampleEnv}
              </pre>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
              <span className="font-bold block mb-1">
                ৪. Deploy বাটনে ক্লিক করুন:
              </span>
              <p>
                মাত্র ১ মিনিটের মধ্যে ভার্সেল আপনাকে একটি লাইভ লিংক (যেমন: <code>your-shop.vercel.app</code>) দিয়ে দেবে!
                আপনি চাইলে আপনার নিজস্ব .com ডোমেনও ২ মিনিটে যুক্ত করতে পারবেন।
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Daily Facebook Page Workflow */}
      {activeStep === 4 && (
        <Card className="space-y-3.5 border-amber-900/15">
          <div className="flex items-center gap-2 text-amber-950 font-black text-base border-b border-stone-100 pb-2">
            <span>📋</span>
            <span>স্টেপ ৪: প্রতিদিনের ফেসবুক শপ পরিচালনার ৫-সেকেন্ড রুল</span>
          </div>

          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ১. কাস্টমার দাম বা স্টক জিজ্ঞেস করলে (Quick Reply):
              </span>
              <p>
                <b>🧾 অর্ডার ট্যাবে</b> &gt; <b>💬 মেসেঞ্জার কুইক রিপ্লাই</b> এ ব্যাগের নাম লিখে ১ ক্লিকে মেসেজ কপি করে
                কাস্টমারকে পাঠিয়ে দিন।
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ২. কাস্টমার অর্ডার কনফার্ম করলে (Smart Paste):
              </span>
              <p>
                মেসেঞ্জারে কাস্টমার যে ঠিকানা ও ফোন নাম্বার দিয়েছেন, পুরো মেসেজটা কপি করে এই অ্যাপের{" "}
                <b>+ নতুন অর্ডার</b> এ গিয়ে <b>স্মার্ট পেস্ট বক্সে</b> পেস্ট করুন। সাথে সাথে নাম, ফোন ও ঠিকানা আলাদা হয়ে যাবে!
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ৩. ১ ক্লিকে স্টেডফাস্টে পার্সেল হ্যান্ডওভার:
              </span>
              <p>
                সেভ বাটনে চাপ দিলে অটোমেটিক স্টেডফাস্টে বুকিং হয়ে যাবে এবং Consignment ID (CID) তৈরি হবে।
                কুরিয়ার ম্যান এসে আপনার দোকান বা বাসা থেকে পার্সেল পিকআপ করে নিয়ে যাবে!
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-900 block mb-1">
                ৪. রাতে ঘুমানোর আগে দিন সমাপ্তি (Close Sales Day):
              </span>
              <p>
                <b>📊 হিসাব ট্যাবে</b> যান এবং <b>🌙 দিন ক্লোজ করুন</b> বাটনে চাপ দিন। আপনার আজকের মোট বিক্রি,
                পণ্যের কেনা খরচ ও আসল প্রফিট হিসাব হিস্ট্রিতে স্থায়ীভাবে সেভ হয়ে যাবে!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
