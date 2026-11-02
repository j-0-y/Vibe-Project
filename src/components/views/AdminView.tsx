"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";
import { Btn, Card, inputCls, Field } from "@/components/ui";

type AdminTab = "shops" | "users" | "settings";

export default function AdminView() {
  const {
    allShops,
    allUsers,
    createShop,
    deleteShop,
    createUser,
    deleteUser,
    changePassword,
    switchShop,
    userEmail,
    logout,
  } = useAuth();

  const [tab, setTab] = useState<AdminTab>("shops");

  // Create Shop Form
  const [shopCode, setShopCode] = useState("");
  const [shopName, setShopName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Create User Form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("staff");
  const [newUserShopId, setNewUserShopId] = useState(allShops[0]?.id || "bag_store_1");

  // Change Admin Password Form
  const [newAdminPass, setNewAdminPass] = useState("");

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopCode.trim()) {
      alert("দোকানের কোড ID দিন (যেমন: bag_luxe)");
      return;
    }
    const ok = await createShop(shopCode, shopName, ownerEmail);
    if (ok) {
      alert(`✅ নতুন দোকান "${shopName || shopCode}" সফলভাবে তৈরি হয়েছে!`);
      setShopCode("");
      setShopName("");
      setOwnerEmail("");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPass.trim()) {
      alert("ইমেইল এবং পাসওয়ার্ড দুটিই দিন");
      return;
    }
    const ok = await createUser(newUserEmail, newUserPass, newUserRole, newUserShopId);
    if (ok) {
      alert(`✅ ইউজার "${newUserEmail}" সফলভাবে তৈরি হয়েছে!`);
      setNewUserEmail("");
      setNewUserPass("");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim()) {
      alert("নতুন পাসওয়ার্ড দিন");
      return;
    }
    await changePassword(newAdminPass);
    setNewAdminPass("");
  };

  return (
    <div className="min-h-screen bg-[#fcf8f5] text-stone-900 font-sans antialiased pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-stone-900 text-white px-4 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">
                BagBox সুপার অ্যাডমিন প্যানেল
              </h1>
              <span className="text-[10px] text-amber-400 font-bold">
                অ্যাডমিন: {userEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                switchShop(allShops[0]?.id || "bag_store_1");
              }}
              className="text-xs font-bold bg-amber-800 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg cursor-pointer"
            >
              🏪 দোকানে প্রবেশ
            </button>
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-stone-400 hover:text-white px-2 py-1.5 cursor-pointer"
            >
              লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* Metric summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-3.5 text-center bg-white">
            <div className="text-2xl font-black text-amber-950">{allShops.length}</div>
            <div className="text-xs text-stone-500 font-medium">মোট খোলা দোকান</div>
          </Card>
          <Card className="p-3.5 text-center bg-white">
            <div className="text-2xl font-black text-blue-900">{allUsers.length}</div>
            <div className="text-xs text-stone-500 font-medium">মোট ইউজার / অ্যাকাউন্ট</div>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-stone-200/80 p-1 text-xs font-bold">
          <button
            onClick={() => setTab("shops")}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              tab === "shops" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🏪 দোকান খুলুন ({allShops.length})
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              tab === "users" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            👥 ইউজার তৈরি ({allUsers.length})
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              tab === "settings" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            🔑 পাসওয়ার্ড চেঞ্জ
          </button>
        </div>

        {/* 🏪 SHOPS TAB */}
        {tab === "shops" && (
          <div className="space-y-4">
            {/* Create Shop Form */}
            <Card className="p-4 border-amber-900/15">
              <h3 className="font-bold text-stone-900 text-sm mb-2.5 flex items-center gap-1.5">
                <span>➕</span>
                <span>নতুন ব্যাগ শপ (দোকান) খুলে দিন</span>
              </h3>
              <form onSubmit={handleCreateShop} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="দোকানের কোড ID *" hint="ইংরেজি ছোট হাতের">
                    <input
                      className={inputCls}
                      placeholder="যেমন: bag_luxe"
                      value={shopCode}
                      onChange={(e) => setShopCode(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="দোকানের নাম">
                    <input
                      className={inputCls}
                      placeholder="যেমন: লাক্স লেদার হাউস"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="মালিকের ইমেইল (Shop Owner Email)">
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="vibeupbd@gmail.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                  />
                </Field>

                <Btn type="submit" color="amber" small>
                  ➕ দোকান তৈরি করুন
                </Btn>
              </form>
            </Card>

            {/* Existing Shops List */}
            <Card className="p-4">
              <h3 className="font-bold text-stone-900 text-sm mb-2.5">
                🏪 সকল রেজিস্টার্ড দোকান তালিকা
              </h3>
              <div className="space-y-2.5">
                {allShops.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{s.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        ID: <code className="bg-white px-1 py-0.5 rounded border border-stone-200">{s.id}</code>
                      </div>
                      {s.ownerEmail && (
                        <div className="text-[11px] text-amber-900 mt-0.5">
                          মালিক: {s.ownerEmail}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => switchShop(s.id)}
                        className="px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-bold hover:bg-amber-950 cursor-pointer shadow-2xs"
                      >
                        👉 এই দোকানে ঢুকুন
                      </button>
                      {allShops.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`"${s.name}" দোকানটি কি মুছে ফেলবেন?`)) {
                              deleteShop(s.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="মুছুন"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 👥 USERS TAB */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Create User Form */}
            <Card className="p-4 border-amber-900/15">
              <h3 className="font-bold text-stone-900 text-sm mb-2.5 flex items-center gap-1.5">
                <span>➕</span>
                <span>নতুন ইউজার বা স্টাফ অ্যাকাউন্ট তৈরি করুন</span>
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="ইউজার ইমেইল *">
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="user@bagshop.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="লগইন পাসওয়ার্ড *">
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="পাসওয়ার্ড দিন"
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="রোল (Role)">
                    <select
                      className={inputCls}
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                    >
                      <option value="owner">মালিক (Owner)</option>
                      <option value="staff">স্টাফ (Staff)</option>
                      <option value="admin">সুপার অ্যাডমিন (Admin)</option>
                    </select>
                  </Field>

                  <Field label="কোন দোকানের জন্য">
                    <select
                      className={inputCls}
                      value={newUserShopId}
                      onChange={(e) => setNewUserShopId(e.target.value)}
                    >
                      {allShops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Btn type="submit" color="amber" small>
                  ➕ ইউজার অ্যাকাউন্ট তৈরি করুন
                </Btn>
              </form>
            </Card>

            {/* Users List */}
            <Card className="p-4">
              <h3 className="font-bold text-stone-900 text-sm mb-2.5">
                👥 সকল ইউজার অ্যাকাউন্ট তালিকা
              </h3>
              <div className="space-y-2">
                {allUsers.map((u) => {
                  const targetShop = allShops.find((s) => s.id === u.shop_id);
                  return (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">{u.email}</div>
                        <div className="text-[11px] text-stone-500">
                          পাসওয়ার্ড: <span className="font-mono font-bold text-stone-500">••••••••</span> • দোকান: {targetShop ? targetShop.name : (u.shop_id || "সকল দোকান")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-900"
                              : u.role === "owner"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {u.role === "admin" ? "অ্যাডমিন" : u.role === "owner" ? "মালিক" : "স্টাফ"}
                        </span>
                        {allUsers.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`"${u.email}" কি মুছে ফেলবেন?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="text-stone-400 hover:text-red-600 p-1"
                            title="মুছুন"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* 🔑 SETTINGS TAB (Change Super Admin Password) */}
        {tab === "settings" && (
          <Card className="p-4">
            <h3 className="font-bold text-stone-900 text-sm mb-2.5 flex items-center gap-1.5">
              <span>🔑</span>
              <span>সুপার অ্যাডমিনের পাসওয়ার্ড পরিবর্তন করুন</span>
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              আপনার বর্তমান ইমেইল: <b>{userEmail}</b>। এখানে নতুন পাসওয়ার্ড টাইপ করে সেভ চাপলে সাথে সাথে আপডেট হয়ে যাবে।
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <Field label="নতুন পাসওয়ার্ড দিন">
                <input
                  type="password"
                  className={inputCls}
                  placeholder="আপনার নতুন পাসওয়ার্ড"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  required
                />
              </Field>
              <Btn type="submit" color="amber" small>
                💾 পাসওয়ার্ড সেভ করুন
              </Btn>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
