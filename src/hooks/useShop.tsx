"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSupabase, resetSupabaseClient } from "@/lib/supabase";
import { uid } from "@/lib/utils";
import { getInitialSeedData } from "@/lib/seed";
import type { ShopData } from "@/lib/types";
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

interface LocalStoreState {
  data: ShopData;
  updatedAt: number;
  hasUserEdited: boolean;
}

function loadLocal(): LocalStoreState {
  if (typeof window === "undefined") {
    return { data: getInitialSeedData(), updatedAt: 0, hasUserEdited: false };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        return {
          data: normalize(parsed),
          updatedAt: Number(parsed.updated_at || 0),
          hasUserEdited: Boolean(parsed.hasUserEdited || parsed.updated_at),
        };
      }
    }
  } catch {}
  return { data: getInitialSeedData(), updatedAt: 0, hasUserEdited: false };
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
  const initialLocal = useRef<LocalStoreState>(loadLocal());
  const [db, setDb] = useState<ShopData>(initialLocal.current.data);
  const [ready, setReady] = useState(false);
  const [cloudMsg, setCloudMsg] = useState("☁️ ক্লাউড সিঙ্ক সক্রিয়");
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [unread, setUnread] = useState(0);

  const lastPush = useRef(0);
  const localUpdatedAt = useRef<number>(initialLocal.current.updatedAt);
  const hasLocalEdits = useRef<boolean>(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const persistLocal = (d: ShopData, ts: number, markedUserEdited = false) => {
    try {
      localUpdatedAt.current = ts;
      (d as any).updated_at = ts;
      if (markedUserEdited) (d as any).hasUserEdited = true;
      localStorage.setItem(LS_KEY, JSON.stringify(d));
    } catch {
      console.warn("Local storage quota exceeded");
    }
  };

  const pushNow = useCallback(async () => {
    if (!shopId) return;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    try {
      const now = Date.now();
      lastPush.current = now;
      const d = dbRef.current;
      persistLocal(d, now, true);

      const payload = {
        products: d.products,
        orders: d.orders,
        moves: d.moves.slice(0, 100),
        ads: d.ads,
        notifs: (d.notifs || []).slice(0, 60),
        settings: d.settings || {},
        salesDay: d.salesDay ?? null,
        salesDays: (d.salesDays || []).slice(0, 365),
        monthAds: d.monthAds || [],
        updated_at: now,
      };

      // 1. Sync to central server (cross-device sync)
      try {
        await fetch("/api/shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: shopId, data: payload, updatedAt: now }),
        });
      } catch (err) {
        console.warn("Server sync error:", err);
      }

      // 2. Sync to Supabase cloud
      const sb = getSupabase();
      if (sb) {
        try {
          const res = await sb.from("shops").upsert({
            id: shopId,
            data: payload,
            updated_at: now,
          });
          if (!res.error) {
            setCloudMsg("☁️ সুপাবেস ক্লাউডে সিঙ্ক হয়েছে ✅");
            setIsCloudSynced(true);
            return;
          } else {
            console.warn("Supabase upsert returned error:", res.error);
          }
        } catch (sbErr) {
          console.warn("Supabase push error:", sbErr);
        }
      }

      setCloudMsg("☁️ ক্লাউডে সিঙ্ক হয়েছে ✅");
      setIsCloudSynced(true);
    } catch (e: unknown) {
      setCloudMsg("⚠️ লোকাল সেভ (ক্লাউড বাকি)");
      console.warn("Push error:", e);
    }
  }, [shopId]);

  const mutate = useCallback(
    (fn: (d: ShopData) => void) => {
      hasLocalEdits.current = true;
      const now = Date.now();
      setDb((prev) => {
        const copy: ShopData = JSON.parse(JSON.stringify(prev));
        fn(copy);
        persistLocal(copy, now, true);
        dbRef.current = copy;
        return copy;
      });

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void pushNow();
      }, 500);
    },
    [pushNow]
  );

  const mutateAndSync = useCallback(
    async (fn: (d: ShopData) => void) => {
      hasLocalEdits.current = true;
      const now = Date.now();
      setDb((prev) => {
        const copy: ShopData = JSON.parse(JSON.stringify(prev));
        fn(copy);
        persistLocal(copy, now, true);
        dbRef.current = copy;
        return copy;
      });
      await pushNow();
    },
    [pushNow]
  );

  const pullNow = useCallback(async () => {
    if (!shopId) {
      setReady(true);
      return;
    }

    try {
      // Step 1: Pull shared system config (keys, URLs) across devices
      try {
        const cfgRes = await fetch("/api/config");
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg && (cfg.supabase?.url || cfg.steadfast?.key || cfg.bdCourierKey)) {
            try {
              if (cfg.steadfast) {
                localStorage.setItem("steadfast_creds", JSON.stringify(cfg.steadfast));
              }
              if (cfg.bdCourierKey) {
                localStorage.setItem("bd_courier_api_key", cfg.bdCourierKey);
              }
              resetSupabaseClient();
            } catch {}
          }
        }
      } catch (cfgErr) {
        console.warn("Config pull error:", cfgErr);
      }

      // Step 2: Try pulling from Supabase
      const sb = getSupabase();
      let loadedFromRemote = false;

      if (sb) {
        try {
          const res = await sb
            .from("shops")
            .select("data, updated_at")
            .eq("id", shopId)
            .maybeSingle();

          if (!res.error && res.data && res.data.data) {
            const remoteUpdatedAt = Number(
              res.data.updated_at || (res.data.data as any)?.updated_at || 0
            );

            const shouldAdopt =
              remoteUpdatedAt > localUpdatedAt.current ||
              (!hasLocalEdits.current && localUpdatedAt.current === 0);

            if (shouldAdopt) {
              localUpdatedAt.current = remoteUpdatedAt;
              hasLocalEdits.current = false;
              const normalized = normalize(res.data.data);
              setDb(normalized);
              persistLocal(normalized, remoteUpdatedAt, false);
              dbRef.current = normalized;

              // Auto-extract Steadfast & BD Courier credentials across devices
              if (normalized.settings?.steadfast?.key) {
                try {
                  localStorage.setItem(
                    "steadfast_creds",
                    JSON.stringify(normalized.settings.steadfast)
                  );
                } catch {}
              }
              if (normalized.settings?.bdCourierKey) {
                try {
                  localStorage.setItem(
                    "bd_courier_api_key",
                    normalized.settings.bdCourierKey
                  );
                } catch {}
              }

              setCloudMsg("☁️ সুপাবেস থেকে ডাটা সিঙ্ক হয়েছে ✅");
              setIsCloudSynced(true);
              loadedFromRemote = true;
            } else if (hasLocalEdits.current && localUpdatedAt.current > remoteUpdatedAt) {
              // Local changes happened on this device, push to Supabase
              void pushNow();
              loadedFromRemote = true;
            } else {
              loadedFromRemote = true;
            }
          }
        } catch (sbErr) {
          console.warn("Supabase pull error:", sbErr);
        }
      }

      // Step 3: Central server sync fallback
      if (!loadedFromRemote) {
        try {
          const serverRes = await fetch(`/api/shop?id=${encodeURIComponent(shopId)}`);
          if (serverRes.ok) {
            const resJson = await serverRes.json();
            if (resJson?.success && resJson?.data) {
              const remoteUpdatedAt = Number(resJson.updatedAt || resJson.data?.updated_at || 0);
              const shouldAdopt =
                remoteUpdatedAt > localUpdatedAt.current ||
                (!hasLocalEdits.current && localUpdatedAt.current === 0);

              if (shouldAdopt) {
                localUpdatedAt.current = remoteUpdatedAt;
                hasLocalEdits.current = false;
                const normalized = normalize(resJson.data);
                setDb(normalized);
                persistLocal(normalized, remoteUpdatedAt, false);
                dbRef.current = normalized;

                if (normalized.settings?.steadfast?.key) {
                  try {
                    localStorage.setItem(
                      "steadfast_creds",
                      JSON.stringify(normalized.settings.steadfast)
                    );
                  } catch {}
                }
                if (normalized.settings?.bdCourierKey) {
                  try {
                    localStorage.setItem(
                      "bd_courier_api_key",
                      normalized.settings.bdCourierKey
                    );
                  } catch {}
                }

                setCloudMsg("☁️ ক্লাউড ডাটা সিঙ্ক হয়েছে ✅");
                setIsCloudSynced(true);
              }
            }
          }
        } catch (servErr) {
          console.warn("Server shop pull error:", servErr);
        }
      }
    } catch (err) {
      console.warn("Pull error:", err);
    } finally {
      setReady(true);
    }
  }, [shopId, pushNow]);

  const resetToDemoData = useCallback(() => {
    const fresh = getInitialSeedData();
    const now = Date.now();
    hasLocalEdits.current = true;
    setDb(fresh);
    persistLocal(fresh, now, true);
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

    // 1. Supabase Realtime WebSocket subscription
    const sb = getSupabase();
    let ch: RealtimeChannel | null = null;
    if (sb && shopId) {
      try {
        ch = sb
          .channel(`shop_${shopId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "shops" },
            (payload) => {
              const newShopId = (payload.new as any)?.id;
              if (newShopId && newShopId !== shopId) return;

              // Don't overwrite if we just pushed in the last 2 seconds
              if (Date.now() - lastPush.current < 2000) return;

              const remoteUpdatedAt = Number(
                (payload.new as any)?.updated_at || (payload.new as any)?.data?.updated_at || 0
              );
              if (remoteUpdatedAt > localUpdatedAt.current) {
                const newData = (payload.new as any)?.data;
                if (newData) {
                  localUpdatedAt.current = remoteUpdatedAt;
                  hasLocalEdits.current = false;
                  const normalized = normalize(newData);
                  setDb(normalized);
                  persistLocal(normalized, remoteUpdatedAt, false);
                  dbRef.current = normalized;
                  setCloudMsg("⚡ ক্লাউড থেকে ইনস্ট্যান্ট আপডেট এলো");
                }
              }
            }
          )
          .subscribe();
      } catch {}
    }

    // 2. Periodic sync check (every 8 seconds for real-time multi-device sync without reload)
    const syncInterval = setInterval(() => {
      // Don't pull if we just pushed in the last 3 seconds
      if (Date.now() - lastPush.current > 3000) {
        void pullNow();
      }
    }, 8000);

    // 3. Window Focus & Visibility Listener (Syncs when you switch back to Laptop/Phone tab)
    const onFocus = () => {
      if (Date.now() - lastPush.current > 2000) {
        void pullNow();
      }
    };
    window.addEventListener("focus", onFocus);
    const onVisChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastPush.current > 2000) {
        void pullNow();
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisChange);
      if (ch && sb) {
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
