"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Btn, Card } from "@/components/ui";

const PAINS = [
  { icon: "📦", text: "স্টোর রুমে বসে বসে ব্যাগের স্টক গুনছেন?" },
  { icon: "📝", text: "কাগজের খাতায় হিসাব লিখে লাভ-ক্ষতি বুঝতে কষ্ট হচ্ছে?" },
  { icon: "😰", text: "স্টকে কালার আছে কি না নিশ্চিত না হয়েই কাস্টমারকে 'আছে' বলছেন?" },
  { icon: "🚚", text: "প্রতিটি অর্ডারের নাম-ঠিকানা স্টেডফাস্টে টাইপ করতে সময় নষ্ট হচ্ছে?" },
];

const FEATURES = [
  {
    icon: "👜",
    t: "ছবি ও কালারসহ ব্যাগের স্টক",
    d: "প্রতিটি ব্যাগের ছবি, কোড এবং কালো, বাদামী, ট্যান, মেরুন কালার অনুযায়ী কত পিস আছে তা লাইভ ট্র্যাক।",
  },
  {
    icon: "⚡",
    t: "১০-সেকেন্ডে মেসেঞ্জার রিপ্লাই",
    d: "কাস্টমার ফেসবুকে ব্যাগের দাম বা স্টক জানতে চাইলেই ১ ক্লিকে সুন্দর বাংলা রিপ্লাই কপি-পেস্ট।",
  },
  {
    icon: "📋",
    t: "স্মার্ট পেস্ট (Smart Paste)",
    d: "মেসেঞ্জারে কাস্টমারের পুরো চ্যাট একবারে পেস্ট করলেই নাম, ফোন, ঠিকানা ও জেলা স্বয়ংক্রিয় আলাদা হয়ে যাবে।",
  },
  {
    icon: "🚚",
    t: "১ ক্লিকে স্টেডফাস্ট পার্সেল",
    d: "অর্ডার সেভ করতেই স্বয়ংক্রিয়ভাবে স্টেডফাস্টে বুকিং, ইনভয়েস, CID ও ট্র্যাকিং কোড তৈরি।",
  },
  {
    icon: "🛡️",
    t: "কাস্টমার ফ্রড ও কুরিয়ার চেক",
    d: "পার্সেল পাঠানোর আগেই কাস্টমারের আগের ডেলিভারি সাকসেস রেট ও রিটার্ন রেকর্ড যাচাই করুন।",
  },
  {
    icon: "📊",
    t: "আসল লাভ-ক্ষতির লাইভ হিসাব",
    d: "ক্যাশ কালেকশন − ব্যাগের কেনা দাম − কুরিয়ার − ফেসবুক বুস্টিং অ্যাড খরচ = আসল নিট প্রফিট।",
  },
];

export default function LandingView() {
  const { setView } = useAuth();

  return (
    <div className="min-h-screen bg-[#fcf8f5] text-stone-900 font-sans select-none antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-950/10 px-4 py-3 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-900 text-white flex items-center justify-center text-lg shadow-xs">
              👜
            </div>
            <div>
              <span className="text-base font-black text-stone-900">BagBox SaaS</span>
              <span className="hidden sm:inline text-xs text-stone-500 ml-2">• ফেসবুক ব্যাগ শপ অটোমেশন</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("login")}
              className="text-xs font-bold bg-amber-900 text-white px-3.5 py-1.5 rounded-lg hover:bg-amber-950 shadow-xs cursor-pointer"
            >
              🔐 লগইন করুন
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-xl mx-auto px-4 pt-7 pb-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-3 border border-amber-200">
          ✨ ফেসবুক ও অনলাইন ব্যাগ শপের জন্য তৈরি
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight leading-snug">
          ফেসবুক ব্যাগ শপ পরিচালনা ও কুরিয়ার অটোমেশন এখন সহজ!
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
          মেসেঞ্জারের কাস্টমার চ্যাট স্মার্ট পেস্ট, স্টেডফাস্ট কুরিয়ারে অটো পার্সেল, লাইভ ট্র্যাকিং এবং ফেসবুক অ্যাড খরচসহ খাঁটি লাভ-ক্ষতির হিসাব।
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-5 space-y-2.5">
          <Btn color="amber" onClick={() => setView("login")}>
            🔐 অ্যাকাউন্টে লগইন করুন (Email & Password)
          </Btn>
          <Btn color="dark" small onClick={() => setView("login")}>
            👑 সুপার অ্যাডমিন প্যানেল লগইন
          </Btn>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="max-w-xl mx-auto px-4 py-4">
        <div className="bg-red-50/60 rounded-2xl border border-red-200/80 p-4">
          <h2 className="text-xs font-black text-red-900 uppercase tracking-wider mb-2.5">
            আপনি কি এই সমস্যাগুলোর মুখোমুখি হচ্ছেন?
          </h2>
          <div className="space-y-2">
            {PAINS.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-stone-800">
                <span className="text-base shrink-0">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-xl mx-auto px-4 py-4">
        <h2 className="text-base font-black text-stone-950 mb-3 flex items-center gap-2">
          <span>🚀</span>
          <span>BagBox আপনার সময় ও টাকা যেভাবে বাঁচায়</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <Card key={i} className="p-3.5">
              <div className="text-2xl mb-1.5">{f.icon}</div>
              <h3 className="font-bold text-stone-900 text-sm mb-1">{f.t}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3 Step Flow */}
      <section className="max-w-xl mx-auto px-4 py-6">
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-900/20 text-center p-5">
          <h3 className="font-black text-stone-900 text-sm mb-1">
            সুপার অ্যাডমিন যেভাবে দোকান ও ইউজার পরিচালনা করে
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            লগইন ছাড়া কেউ সিস্টেমে বা দোকানে প্রবেশ করতে পারবে না।
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs text-stone-700">
            <div className="bg-white p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-amber-900 text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                ১
              </div>
              <div className="font-bold">অ্যাডমিন লগইন</div>
              <div className="text-[10px] text-stone-400 mt-0.5">vibeupbd@gmail.com</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-amber-900 text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                ২
              </div>
              <div className="font-bold">দোকান তৈরি</div>
              <div className="text-[10px] text-stone-400 mt-0.5">মালিক ও শপ আইডি দিন</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-amber-900 text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                ৩
              </div>
              <div className="font-bold">ইউজার পাসওয়ার্ড</div>
              <div className="text-[10px] text-stone-400 mt-0.5">স্টাফ ও মালিক লগইন</div>
            </div>
          </div>

          <div className="mt-5">
            <Btn color="amber" onClick={() => setView("login")}>
              🔐 লগইন করে শুরু করুন
            </Btn>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <p>👜 BagBox SaaS — Made for Bangladeshi Bag Sellers</p>
        <div className="mt-2 flex justify-center gap-4 text-[11px] font-bold text-amber-900">
          <button onClick={() => setView("login")} className="hover:underline cursor-pointer">
            দোকানে লগইন
          </button>
          <span>•</span>
          <button onClick={() => setView("login")} className="hover:underline cursor-pointer">
            সুপার অ্যাডমিন লগইন
          </button>
        </div>
      </footer>
    </div>
  );
}
