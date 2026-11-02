"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Role } from "@/lib/types";

export type ViewMode = "landing" | "login" | "admin" | "app";

export interface ShopMeta {
  id: string;
  name: string;
  ownerEmail: string;
  createdAt: number;
  updatedAt?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  role: Role;
  shop_id: string | null;
}

interface AuthCtx {
  ready: boolean;
  authed: boolean;
  userEmail: string;
  role: Role;
  shopId: string;
  userId: string;
  configMissing: boolean;
  loginError: string;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  allShops: ShopMeta[];
  allUsers: UserAccount[];
  login: (email: string, password: string, targetType?: "admin" | "shop") => Promise<boolean>;
  logout: () => Promise<void>;
  createShop: (id: string, name: string, ownerEmail: string) => Promise<boolean>;
  deleteShop: (id: string) => Promise<boolean>;
  createUser: (email: string, password: string, role: Role, shopId: string) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  switchShop: (shopId: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const AUTH_KEY = "vibeup_auth_session";
const ALL_SHOPS_KEY = "vibeup_all_shops";
const ALL_USERS_KEY = "vibeup_all_users";

const INITIAL_SHOPS: ShopMeta[] = [
  {
    id: "bag_store_1",
    name: "আমার ব্যাগের দোকান",
    ownerEmail: "vibeupbd@gmail.com",
    createdAt: Date.now() - 86400000 * 7,
  },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: "u_super_admin",
    email: "vibeupbd@gmail.com",
    password: "Vibeup420!",
    role: "admin",
    shop_id: null,
  },
  {
    id: "u_shop_owner",
    email: "vibeupbd@gmail.com",
    password: "Vibeup420!",
    role: "owner",
    shop_id: "bag_store_1",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRoleState] = useState<Role>("owner");
  const [shopId, setShopId] = useState("bag_store_1");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<ViewMode>("landing");

  // Multi-tenant Shops
  const [allShops, setAllShops] = useState<ShopMeta[]>(() => {
    try {
      const s = localStorage.getItem(ALL_SHOPS_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_SHOPS;
  });

  // Users Database
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    try {
      const u = localStorage.getItem(ALL_USERS_KEY);
      if (u) {
        const parsed: UserAccount[] = JSON.parse(u);
        return parsed.map((usr) => {
          if (usr.email.toLowerCase() === "vibeupbd@gmail.com") {
            return { ...usr, password: "Vibeup420!" };
          }
          return usr;
        });
      }
    } catch {}
    return INITIAL_USERS;
  });

  const configMissing = !isSupabaseConfigured();

  const saveShops = (shops: ShopMeta[]) => {
    setAllShops(shops);
    try {
      localStorage.setItem(ALL_SHOPS_KEY, JSON.stringify(shops));
    } catch {}
  };

  const saveUsers = (users: UserAccount[]) => {
    setAllUsers(users);
    try {
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    } catch {}
  };

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    // 1. Check stored active session (minimum 30 days persistence)
    let authenticated = false;
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        if (parsed?.expiresAt && now > parsed.expiresAt) {
          localStorage.removeItem(AUTH_KEY);
        } else if (parsed?.userId && parsed?.email) {
          // Auto-extend rolling session for 30 more days
          parsed.expiresAt = now + THIRTY_DAYS_MS;
          try {
            localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
          } catch {}
          setUserEmail(parsed.email);
          setUserId(parsed.userId);
          setRoleState(parsed.role || "owner");
          setShopId(parsed.shopId || "bag_store_1");
          authenticated = true;
        }
      }
    } catch {}

    // 2. Hash Routing & Route Protection
    const h = window.location.hash.replace("#", "");
    if (!authenticated) {
      if (h === "login" || h === "admin" || h === "app") {
        setView("login");
      } else {
        setView("landing");
      }
    } else {
      if (h === "admin") setView("admin");
      else if (h === "landing") setView("landing");
      else setView("app");
    }

    setReady(true);
  }, []);

  const login = async (email: string, pass: string, targetType?: "admin" | "shop"): Promise<boolean> => {
    setLoginError("");
    const em = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!em) {
      setLoginError("ইমেইল ঠিকানা দিন");
      return false;
    }
    if (!cleanPass) {
      setLoginError("পাসওয়ার্ড দিন");
      return false;
    }

    // Try Supabase auth first if configured
    const sb = getSupabase();
    if (sb) {
      try {
        const r = await sb.auth.signInWithPassword({ email: em, password: cleanPass });
        if (!r.error && r.data.user) {
          const user = r.data.user;
          const chk = await sb.from("profiles").select("role,shop_id").eq("id", user.id).maybeSingle();
          const myRole = (chk?.data?.role as Role) || (em === "vibeupbd@gmail.com" ? "admin" : "owner");
          const sId = chk?.data?.shop_id || (myRole === "admin" ? "" : "bag_store_1");

          const session = {
            email: em,
            userId: user.id,
            role: myRole,
            shopId: sId,
            expiresAt: Date.now() + THIRTY_DAYS_MS,
          };
          localStorage.setItem(AUTH_KEY, JSON.stringify(session));

          setUserEmail(em);
          setUserId(user.id);
          setRoleState(myRole);
          setShopId(sId);

          if (myRole === "admin" && targetType === "admin") {
            setView("admin");
            window.location.hash = "#admin";
          } else {
            setView("app");
            window.location.hash = "#app";
          }
          return true;
        }
      } catch {}
    }

    // Local / Database Verification (Strict email + password)
    // Find matching accounts
    const matchedUsers = allUsers.filter((u) => u.email.toLowerCase() === em);
    if (matchedUsers.length === 0) {
      setLoginError("এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।");
      return false;
    }

    // Match by targetType if specified (admin vs shop)
    let selectedUser = matchedUsers[0];
    if (targetType === "admin") {
      const adminAcc = matchedUsers.find((u) => u.role === "admin");
      if (adminAcc) selectedUser = adminAcc;
    } else {
      const shopAcc = matchedUsers.find((u) => u.role !== "admin");
      if (shopAcc) selectedUser = shopAcc;
    }

    const expectedPass =
      (em === "vibeupbd@gmail.com" ? "Vibeup420!" : selectedUser.password) || "Vibeup420!";
    if (cleanPass !== expectedPass) {
      setLoginError("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।");
      return false;
    }

    const sId = selectedUser.shop_id || (selectedUser.role === "admin" ? "" : (allShops[0]?.id || "bag_store_1"));
    const session = {
      email: em,
      userId: selectedUser.id,
      role: selectedUser.role,
      shopId: sId,
      expiresAt: Date.now() + THIRTY_DAYS_MS,
    };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {}

    setUserEmail(em);
    setUserId(selectedUser.id);
    setRoleState(selectedUser.role);
    setShopId(sId);

    if (selectedUser.role === "admin" && (!targetType || targetType === "admin")) {
      setView("admin");
      window.location.hash = "#admin";
    } else {
      setView("app");
      window.location.hash = "#app";
    }

    return true;
  };

  const logout = async () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      await getSupabase()?.auth.signOut();
    } catch {}
    setUserEmail("");
    setUserId("");
    setRoleState("staff");
    setShopId("");
    setView("login");
    window.location.hash = "#login";
  };

  const switchShop = (newShopId: string) => {
    setShopId(newShopId);
    try {
      const s = localStorage.getItem(AUTH_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        parsed.shopId = newShopId;
        localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
      }
    } catch {}
    setView("app");
    window.location.hash = "#app";
  };

  const createShop = async (id: string, name: string, ownerEmail: string): Promise<boolean> => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (allShops.some((s) => s.id === cleanId)) {
      alert("এই কোডের দোকান ইতিমধ্যে বিদ্যমান আছে");
      return false;
    }

    const newShop: ShopMeta = {
      id: cleanId,
      name: name.trim() || "আমার নতুন ব্যাগ শপ",
      ownerEmail: ownerEmail.trim().toLowerCase(),
      createdAt: Date.now(),
    };

    saveShops([newShop, ...allShops]);

    // If owner email doesn't have an account, create one with default password
    const oEm = ownerEmail.trim().toLowerCase();
    if (oEm && !allUsers.some((u) => u.email === oEm && u.shop_id === cleanId)) {
      saveUsers([
        ...allUsers,
        {
          id: "u_" + Date.now().toString(36),
          email: oEm,
          password: "Vibeup420!",
          role: "owner",
          shop_id: cleanId,
        },
      ]);
    }

    // Try Supabase if configured
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from("shops").insert({
          id: cleanId,
          data: {
            products: [],
            orders: [],
            moves: [{ id: "m1", date: new Date().toLocaleDateString("bn-BD"), text: "🎉 নতুন দোকান চালু হলো" }],
            settings: { shopName: newShop.name },
          },
          updated_at: Date.now(),
        });
      } catch {}
    }

    return true;
  };

  const deleteShop = async (id: string): Promise<boolean> => {
    saveShops(allShops.filter((s) => s.id !== id));
    return true;
  };

  const createUser = async (
    email: string,
    pass: string,
    r: Role,
    sId: string
  ): Promise<boolean> => {
    const em = email.trim().toLowerCase();
    const pw = pass.trim() || "Vibeup420!";

    const newUser: UserAccount = {
      id: "u_" + Date.now().toString(36),
      email: em,
      password: pw,
      role: r,
      shop_id: r === "admin" ? null : sId,
    };

    saveUsers([...allUsers, newUser]);
    return true;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    saveUsers(allUsers.filter((u) => u.id !== id));
    return true;
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    const clean = newPassword.trim();
    if (!clean) return false;

    // Update in allUsers for the current user
    const updated = allUsers.map((u) => {
      if (u.email.toLowerCase() === userEmail.toLowerCase()) {
        return { ...u, password: clean };
      }
      return u;
    });
    saveUsers(updated);

    // Update in Supabase Auth if online
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.auth.updateUser({ password: clean });
      } catch {}
    }

    alert("✅ আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
    return true;
  };

  return (
    <Ctx.Provider
      value={{
        ready,
        authed: Boolean(userId && userEmail),
        userEmail,
        role,
        shopId,
        userId,
        configMissing,
        loginError,
        view,
        setView,
        allShops,
        allUsers,
        login,
        logout,
        createShop,
        deleteShop,
        createUser,
        deleteUser,
        changePassword,
        switchShop,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
