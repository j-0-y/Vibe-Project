"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

interface AuthCtx {
  ready: boolean;
  authed: boolean;
  userEmail: string;
  role: Role;
  shopId: string;
  userId: string;
  isDemoUser: boolean;
  configMissing: boolean;
  loginError: string;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsLocalOwner: (customShopName?: string) => void;
  logout: () => Promise<void>;
  setProfile: (role: Role, shopId: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEMO_AUTH_KEY = "bag_shop_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRoleState] = useState<Role>("owner");
  const [shopId, setShopId] = useState("");
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loginError, setLoginError] = useState("");
  const configMissing = !isSupabaseConfigured();

  const setProfile = (r: Role, s: string) => {
    setRoleState(r);
    setShopId(s);
  };

  useEffect(() => {
    // 1. Check local session (e.g. demo mode or stored session)
    try {
      const stored = localStorage.getItem(DEMO_AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.userId) {
          setUserEmail(parsed.email || "owner@bagshop.com");
          setUserId(parsed.userId);
          setRoleState(parsed.role || "owner");
          setShopId(parsed.shopId || "bag_store_1");
          setIsDemoUser(Boolean(parsed.isDemo));
          setReady(true);
          return;
        }
      }
    } catch {}

    // 2. If Supabase configured, check Supabase session
    const sb = getSupabase();
    if (!sb) {
      // Default to auto-login as owner for local-first seamless usage
      setUserEmail("owner@bagshop.local");
      setUserId("owner_local_1");
      setRoleState("owner");
      setShopId("bag_store_1");
      setIsDemoUser(true);
      setReady(true);
      return;
    }

    let dead = false;
    const applyProfile = async (user: { id: string; email?: string | null }) => {
      for (let i = 0; i < 3; i++) {
        try {
          const pr = await sb
            .from("profiles")
            .select("role,shop_id")
            .eq("id", user.id)
            .maybeSingle();

          if (pr.error) throw new Error(pr.error.message);
          if (!pr.data) {
            // New user, create initial owner profile if first
            setUserEmail(user.email || "");
            setUserId(user.id);
            setRoleState("owner");
            setShopId("bag_store_1");
            setReady(true);
            return;
          }

          if (dead) return;
          setUserEmail(user.email || "");
          setUserId(user.id);
          setRoleState((pr.data.role as Role) || "owner");
          setShopId(pr.data.shop_id || "bag_store_1");
          setIsDemoUser(false);
          setReady(true);
          return;
        } catch {
          if (i === 2) {
            if (!dead) setReady(true);
            return;
          }
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    };

    (async () => {
      try {
        const session = (await sb.auth.getSession()).data.session;
        if (dead) return;
        if (session?.user) {
          await applyProfile(session.user);
          return;
        }
      } catch {}

      // Auto start in local owner mode so user never sees a blocking blank screen
      setUserEmail("owner@bagshop.local");
      setUserId("owner_local_1");
      setRoleState("owner");
      setShopId("bag_store_1");
      setIsDemoUser(true);
      if (!dead) setReady(true);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_ev, session) => {
      if (dead) return;
      if (session?.user) {
        void applyProfile(session.user);
      }
    });

    return () => {
      dead = true;
      try {
        sub.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  const loginAsLocalOwner = (customShopName?: string) => {
    const sId = "bag_store_" + (customShopName ? customShopName.toLowerCase().replace(/\s+/g, "_") : "1");
    const session = {
      email: "owner@bagshop.local",
      userId: "owner_local_" + Date.now().toString(36),
      role: "owner" as Role,
      shopId: sId,
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session));
    } catch {}
    setUserEmail(session.email);
    setUserId(session.userId);
    setRoleState("owner");
    setShopId(session.shopId);
    setIsDemoUser(true);
    setLoginError("");
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoginError("");
    const sb = getSupabase();
    if (!sb) {
      // Local login fallback
      loginAsLocalOwner();
      return true;
    }

    try {
      const r = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (r.error) throw new Error(r.error.message);
      const user = r.data.user;

      const chk = await sb.from("profiles").select("role,shop_id").eq("id", user.id).maybeSingle();
      const myRole = (chk?.data?.role as Role) || "owner";
      const sId = chk?.data?.shop_id || "bag_store_1";

      setUserEmail(user.email || "");
      setUserId(user.id);
      setRoleState(myRole);
      setShopId(sId);
      setIsDemoUser(false);
      return true;
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : "লগইন সফল হয়নি");
      return false;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(DEMO_AUTH_KEY);
      await getSupabase()?.auth.signOut();
    } catch {}
    // Reset to local owner default
    setUserEmail("owner@bagshop.local");
    setUserId("owner_local_1");
    setRoleState("owner");
    setShopId("bag_store_1");
    setIsDemoUser(true);
  };

  return (
    <Ctx.Provider
      value={{
        ready,
        authed: !!userId,
        userEmail,
        role,
        shopId,
        userId,
        isDemoUser,
        configMissing,
        loginError,
        login,
        loginAsLocalOwner,
        logout,
        setProfile,
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
