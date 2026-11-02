"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { ShopData, Order } from "@/lib/types";
import { getInitialSeedData } from "@/lib/seed";
import { useAuth } from "./useAuth";

const LS_KEY = "bag_shop_v1";

function normalize(d: Partial<ShopData>): ShopData {
  const seed = getInitialSeedData();
  return {
    products: d.products || seed.products,
    orders: d.orders || seed.orders,
    moves: d.moves || seed.moves,
    ads: d.ads || [],
    notifs: (d.notifs || seed.notifs || []).slice(0, 60),
    settings: d.settings || seed.settings,
    salesDay: d.salesDay ?? seed.salesDay,
    salesDays: (d.salesDays || []).slice(0, 365),
    monthAds: d.monthAds || [],
  };
}

function loadLocal(): ShopData {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) return normalize(JSON.parse(s));
  } catch {}
  return getInitialSeedData();
}

interface ShopCtx {
  db: ShopData;
  ready: boolean;
  cloudMsg: string;
  isCloudSynced: boolean;
  mutate: (fn: (d: ShopData) => void) => void;
  mutateAndSync: (fn: (d: ShopData) => void) => Promise<void>;
  pushNow: () => Promise<void>;
  pullNow: () => Promise<void>;
  resetToDemoData: () => void;
  notify: (title: string, body: string) => void;
  unread: number;
  markRead: () => void;
}

const Ctx = createContext<ShopCtx | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { shopId, isDemoUser } = useAuth();
  const [db, setDb] = useState<ShopData>(() =>
    typeof window === "undefined" ? getInitialSeedData() : loadLocal()
  );
  const [ready, setReady] = useState(false);
  const [cloudMsg, setCloudMsg] = useState("💾 অফলাইন/লোকাল মোড");
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [unread, setUnread] = useState(0);

  const lastPush = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const persistLocal = (d: ShopData) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(d));
    } catch {
      console.warn("Local storage full or quota exceeded");
    }
  };

  const pushNow = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !shopId || isDemoUser) {
      persistLocal(dbRef.current);
      setCloudMsg("💾 লোকাল ডেটা সংরক্ষিত");
      return;
    }

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    try {
      lastPush.current = Date.now();
      const d = dbRef.current;
      const payload: Record<string, unknown> = {
        id: shopId,
        data: {
          products: d.products,
          orders: d.orders,
          moves: d.moves.slice(0, 100),
          ads: d.ads,
          notifs: (d.notifs || []).slice(0, 60),
          settings: d.settings || {},
          salesDay: d.salesDay ?? null,
          salesDays: (d.salesDays || []).slice(0, 365),
          monthAds: d.monthAds || [],
        },
        updated_at: Date.now(),
      };

      const res = await sb.from("shops").upsert(payload);
      if (res.error) throw new Error(res.error.message);

      setCloudMsg("☁️ ক্লাউডে সিঙ্ক হয়েছে ✅");
      setIsCloudSynced(true);
    } catch (e: unknown) {
      setCloudMsg("⚠️ লোকাল সেভ (ক্লাউড বাকি)");
      console.warn("Cloud push error:", e);
    }
  }, [shopId, isDemoUser]);

  const mutate = useCallback((fn: (d: ShopData) => void) => {
    setDb((prev) => {
      const copy: ShopData = JSON.parse(JSON.stringify(prev));
      fn(copy);
      persistLocal(copy);
      dbRef.current = copy;
      return copy;
    });

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void pushNow();
    }, 1200);
  }, [pushNow]);

  const mutateAndSync = useCallback(
    async (fn: (d: ShopData) => void) => {
      setDb((prev) => {
        const copy: ShopData = JSON.parse(JSON.stringify(prev));
        fn(copy);
        persistLocal(copy);
        dbRef.current = copy;
        return copy;
      });
      await pushNow();
    },
    [pushNow]
  );

  const pullNow = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !shopId || isDemoUser) {
      setReady(true);
      return;
    }

    try {
      const res = await sb.from("shops").select("data, updated_at").eq("id", shopId).maybeSingle();
      if (!res.error && res.data && res.data.data) {
        const normalized = normalize(res.data.data);
        setDb(normalized);
        persistLocal(normalized);
        setCloudMsg("☁️ ক্লাউড ডেটা লোড হয়েছে");
        setIsCloudSynced(true);
      }
    } catch (err) {
      console.warn("Pull error:", err);
    } finally {
      setReady(true);
    }
  }, [shopId, isDemoUser]);

  const resetToDemoData = useCallback(() => {
    const fresh = getInitialSeedData();
    setDb(fresh);
    persistLocal(fresh);
    dbRef.current = fresh;
    setCloudMsg("✨ ডেমো ডেটা রিলোড হয়েছে");
  }, []);

  const notify = useCallback((title: string, body: string) => {
    mutate((d) => {
      d.notifs = d.notifs || [];
      d.notifs.unshift({
        id: Date.now().toString(36),
        ts: Date.now(),
        title,
        body,
      });
    });
    setUnread((u) => u + 1);
  }, [mutate]);

  const markRead = useCallback(() => {
    setUnread(0);
  }, []);

  // Initial pull and realtime connection
  useEffect(() => {
    void pullNow();

    const sb = getSupabase();
    if (!sb || !shopId || isDemoUser) return;

    let ch: RealtimeChannel | null = null;
    try {
      ch = sb
        .channel(`shop_${shopId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "shops", filter: `id=eq.${shopId}` },
          (payload) => {
            if (Date.now() - lastPush.current < 2000) return;
            const newData = (payload.new as any)?.data;
            if (newData) {
              const normalized = normalize(newData);
              setDb(normalized);
              persistLocal(normalized);
              setCloudMsg("⚡ ক্লাউড থেকে আপডেট এলো");
            }
          }
        )
        .subscribe();
    } catch {}

    return () => {
      if (ch) {
        try {
          void sb.removeChannel(ch);
        } catch {}
      }
    };
  }, [pullNow, shopId, isDemoUser]);

  return (
    <Ctx.Provider
      value={{
        db,
        ready,
        cloudMsg,
        isCloudSynced,
        mutate,
        mutateAndSync,
        pushNow,
        pullNow,
        resetToDemoData,
        notify,
        unread,
        markRead,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useShop(): ShopCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop must be inside ShopProvider");
  return v;
}
