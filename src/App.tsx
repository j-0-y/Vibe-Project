"use client";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ShopProvider, useShop } from "@/hooks/useShop";
import HomeTab from "@/components/shop/HomeTab";
import StockTab from "@/components/shop/StockTab";
import OrdersTab from "@/components/shop/OrdersTab";
import ReportsTab from "@/components/shop/ReportsTab";
import SetupTab from "@/components/shop/SetupTab";
import GuideTab from "@/components/shop/GuideTab";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Modal, Btn, inputCls } from "@/components/ui";

type Tab = "home" | "stock" | "orders" | "reports" | "guide" | "setup";

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "হোম" },
  { id: "stock", icon: "👜", label: "স্টক" },
  { id: "orders", icon: "🧾", label: "অর্ডার" },
  { id: "reports", icon: "📊", label: "হিসাব" },
  { id: "guide", icon: "🚀", label: "গাইড" },
  { id: "setup", icon: "⚙️", label: "সেটআপ" },
];

function AppShell() {
  const { role, userEmail, logout } = useAuth();
  const { db, unread, markRead } = useShop();

  const [tab, setTab] = useState<Tab>("home");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const shopTitle = db.settings?.shopName || "আমার ব্যাগের দোকান";

  // Hash navigation support
  useEffect(() => {
    const fromHash = (): Tab | null => {
      try {
        const h = window.location.hash.replace("#", "") as Tab;
        if (h && TABS.some((t) => t.id === h)) return h;
      } catch {}
      return null;
    };

    const initial = fromHash();
    if (initial) {
      setTab(initial);
    } else {
      try {
        const last = sessionStorage.getItem("bag_lastTab") as Tab | null;
        if (last && TABS.some((t) => t.id === last)) setTab(last);
      } catch {}
    }

    const onHashChange = () => {
      const h = fromHash();
      if (h) {
        setTab(h);
        try {
          sessionStorage.setItem("bag_lastTab", h);
        } catch {}
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const go = (target: string) => {
    const id = target as Tab;
    setTab(id);
    try {
      sessionStorage.setItem("bag_lastTab", id);
      if (window.location.hash !== "#" + id) {
        window.history.pushState({ tab: id }, "", "#" + id);
      }
    } catch {}
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#fcf8f5] text-stone-900 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-950/10 px-4 py-2.5 shadow-2xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => go("home")}>
            <div className="w-8 h-8 rounded-xl bg-amber-900 text-white flex items-center justify-center text-lg shadow-xs">
              👜
            </div>
            <div>
              <h1 className="text-sm font-black text-stone-900 leading-tight">
                {shopTitle}
              </h1>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                Facebook & Steadfast Automation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => {
                setShowNotif(true);
                markRead();
              }}
              className="relative p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              aria-label="নোটিফিকেশন"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-xl bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xs font-black text-stone-700 cursor-pointer"
              aria-label="প্রোফাইল"
            >
              {role === "owner" ? "👑" : "👤"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3.5 pb-24">
        <ErrorBoundary fallbackText="পেজটি লোড করা সম্ভব হয়নি">
          {tab === "home" && <HomeTab go={go} />}
          {tab === "stock" && <StockTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "guide" && <GuideTab />}
          {tab === "setup" && <SetupTab />}
        </ErrorBoundary>
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-amber-950/10 px-2 py-1.5 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[54px] min-h-[46px] cursor-pointer ${
                  active
                    ? "text-amber-950 font-black scale-105"
                    : "text-stone-500 font-medium hover:text-stone-700"
                }`}
              >
                <span className="text-xl leading-none mb-0.5">{t.icon}</span>
                <span className={`text-[11px] leading-none ${active ? "font-bold text-amber-900" : ""}`}>
                  {t.label}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-800 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notifications Modal */}
      {showNotif && (
        <Modal title="🔔 নোটিফিকেশন হিস্ট্রি" onClose={() => setShowNotif(false)}>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(!db.notifs || db.notifs.length === 0) ? (
              <p className="text-xs text-stone-400 py-6 text-center">কোন নতুন নোটিফিকেশন নেই</p>
            ) : (
              db.notifs.map((n) => (
                <div key={n.id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                  <div className="font-bold text-stone-900">{n.title}</div>
                  <div className="text-stone-600 mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    {new Date(n.ts).toLocaleTimeString("bn-BD")}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Modal title="👤 অ্যাকাউন্ট ও শপ প্রোফাইল" onClose={() => setShowProfile(false)}>
          <div className="space-y-3.5 text-xs text-stone-800">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-900/15">
              <div className="font-bold text-amber-950 text-sm">{shopTitle}</div>
              <div className="text-stone-600 mt-1">ইউজার: {userEmail}</div>
              <div className="text-stone-600">রোল: {role === "owner" ? "দোকানের মালিক" : "স্টাফ"}</div>
            </div>

            <div className="space-y-2">
              <Btn small color="dark" onClick={() => { setShowProfile(false); go("guide"); }}>
                🚀 সেটআপ গাইড দেখুন
              </Btn>
              <Btn small color="gray" onClick={() => { setShowProfile(false); go("setup"); }}>
                ⚙️ সেটিংস ও ব্যালেন্স চেক
              </Btn>
              <Btn small color="red" onClick={() => { logout(); setShowProfile(false); }}>
                লগআউট করুন
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <AppShell />
      </ShopProvider>
    </AuthProvider>
  );
}
