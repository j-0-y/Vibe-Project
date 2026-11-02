"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Btn, Card, inputCls, Field } from "@/components/ui";

export default function LoginView() {
  const { login, loginError, setView } = useAuth();
  const [loginMode, setLoginMode] = useState<"shop" | "admin">("shop");
  const [email, setEmail] = useState("vibeupbd@gmail.com");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pass.trim()) {
      alert("ইমেইল এবং পাসওয়ার্ড দুটিই পূরণ করুন");
      return;
    }
    setBusy(true);
    await login(email, pass, loginMode);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf8f5] flex flex-col justify-center items-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-13 h-13 rounded-2xl bg-amber-900 text-white flex items-center justify-center text-3xl mx-auto shadow-sm mb-2">
            👜
          </div>
          <h1 className="text-xl font-black text-stone-900">
            {loginMode === "admin" ? "👑 সুপার অ্যাডমিন লগইন" : "🔐 ব্যাগ শপ লগইন প্যানেল"}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {loginMode === "admin"
              ? "সিস্টেম ও দোকান ম্যানেজমেন্টের জন্য অ্যাডমিন অ্যাক্সেস"
              : "আপনার ব্যাগের দোকান পরিচালনা করতে লগইন করুন"}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-stone-200/80 p-1 rounded-xl mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMode("shop");
              setEmail("vibeupbd@gmail.com");
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMode === "shop"
                ? "bg-amber-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🏪 দোকানের মালিক / স্টাফ
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("admin");
              setEmail("vibeupbd@gmail.com");
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMode === "admin"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            👑 সুপার অ্যাডমিন
          </button>
        </div>

        {/* Login Card */}
        <Card className="p-5 shadow-md border-amber-900/15">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
                ⚠️ {loginError}
              </div>
            )}

            <Field label="ইমেইল অ্যাড্রেস *">
              <input
                type="email"
                className={inputCls}
                placeholder="vibeupbd@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="পাসওয়ার্ড *">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={inputCls}
                  placeholder="পাসওয়ার্ড দিন"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-2.5 text-xs text-stone-500 font-medium hover:text-stone-800 cursor-pointer"
                >
                  {showPass ? "লুকান" : "দেখুন"}
                </button>
              </div>
            </Field>

            <div className="pt-2">
              <Btn
                type="submit"
                color={loginMode === "admin" ? "dark" : "amber"}
                disabled={busy}
              >
                {busy
                  ? "যাচাই হচ্ছে..."
                  : loginMode === "admin"
                  ? "👑 অ্যাডমিন প্যানেলে প্রবেশ করুন"
                  : "🔐 দোকানে প্রবেশ করুন"}
              </Btn>
            </div>
          </form>

          {/* Quick links */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={() => setView("landing")}
              className="hover:text-stone-900 font-medium cursor-pointer"
            >
              ← হোমপেজে ফিরুন
            </button>
            <span className="text-[11px] text-stone-400">
              🔒 সুরক্ষিত এনক্রিপ্টেড লগইন
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
