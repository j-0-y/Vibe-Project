"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { uid } from "@/lib/utils";
import { getInitialSeedData } from "@/lib/seed";
import type { Order, Product, ShopData } from "@/lib/types";
import { useAuth } from "./useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

const LS_KEY = "bag_shop_v1";

function loadLocal(): ShopData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        return normalize(parsed);
      }
    }
  } catch {}
  return getInitialSeedData();
}

function normalize(d: any): ShopData {
  return {
    products: Array.isArray(d?.products) ? d.products : [],
    orders: Array.isArray(d?.orders) ? d.orders : [],
    moves: Array.isArray(d?.moves) ? d.moves : [],
    ads: Array.isArray(d?.ads) ? d.ads : [],
    notifs: Array.isArray(d?.notifs) ? d.notifs : [],
    settings: d?.settings || {},
    salesDay: d?.salesDay ?? null,
    salesDays: Array.isArray(d?.salesDays) ? d.salesDays : [],
    monthAds: Array.isArray(d?.monthAds) ? d.monthAds : [],
  };
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { shopId } = useAuth();
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
    if (!sb || !shopId) {
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
  }, [shopId]);

  const mutate = useCallback(
    (fn: (d: ShopData) => void) => {
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
    },
    [pushNow]
  );

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
    if (!sb || !shopId) {
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
  }, [shopId]);

  const resetToDemoData = useCallback(() => {
    const fresh = getInitialSeedData();
    setDb(fresh);
    persistLocal(fresh);
    dbRef.current = fresh;
    void pushNow();
  }, [pushNow]);

  const notify = useCallback(
    (title: string, body: string) => {
      const n = { id: uid(), title, body, ts: Date.now() };
      mutate((d) => {
        d.notifs = d.notifs || [];
        d.notifs.unshift(n);
      });
      setUnread((u) => u + 1);
    },
    [mutate]
  );

  const markRead = useCallback(() => {
    setUnread(0);
  }, []);

  // Initial pull and realtime connection
  useEffect(() => {
    void pullNow();

    const sb = getSupabase();
    if (!sb || !shopId) return;

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
  }, [pullNow, shopId]);

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
