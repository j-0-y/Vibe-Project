"use client";
import React, { useMemo, useState } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { totalQty, isLow, todayBn, uid, isActive, BAG_CATEGORIES } from "@/lib/utils";
import { Btn, Card, Modal, Empty, inputCls } from "@/components/ui";
import ProductImg from "@/components/shared/ProductImg";
import ProductModal from "./ProductModal";
import type { Product } from "@/lib/types";

function MoveModal({
  mode,
  onClose,
}: {
  mode: "in" | "out";
  onClose: () => void;
}) {
  const { db, mutateAndSync } = useShop();
  const [pid, setPid] = useState(db.products[0]?.id || "");
  const prod = db.products.find((p) => p.id === pid);
  const [vid, setVid] = useState(prod?.variants[0]?.id || "");
  const [qty, setQty] = useState("5");
  const [note, setNote] = useState("");
  const variant = prod?.variants.find((v) => v.id === vid);
  const q = parseInt(qty) || 0;

  const submit = async () => {
    if (!prod || !variant) {
      alert("ব্যাগ ও কালার সিলেক্ট করুন");
      return;
    }
    if (!(q > 0)) {
      alert("পিস সংখ্যা লিখুন");
      return;
    }
    if (mode === "out" && variant.qty < q) {
      alert(`স্টকে মাত্র ${variant.qty} pcs আছে!`);
      return;
    }

    await mutateAndSync((d) => {
      const p = d.products.find((x) => x.id === pid);
      const v = p?.variants.find((x) => x.id === vid);
      if (!v) return;
      v.qty = mode === "in" ? v.qty + q : v.qty - q;
      d.moves.unshift({
        id: uid(),
        date: todayBn(),
        text: `${mode === "in" ? "📥 স্টক ইন" : "📤 স্টক আউট"}: ${p?.name} [${v.color} - ${v.size}] ${q} pcs ${note ? `(${note})` : ""} (বর্তমান: ${v.qty})`,
      });
    });

    onClose();
  };

  return (
    <Modal
      title={mode === "in" ? "📥 স্টক ইন (নতুন চালান আসলো)" : "📤 স্টক আউট (ড্যামেজ বা ফেরত)"}
      onClose={onClose}
    >
      <div className="space-y-3">
        {mode === "out" && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg">
            ফেসবুক অর্ডারের জন্য এটা করার প্রয়োজন নেই — অর্ডার কনফার্ম করলে অটোমেটিক স্টক কমে যায়।
          </p>
        )}

        {/* Bag Preview & Model Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">ব্যাগ মডেল নির্বাচন করুন</label>
          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 bg-stone-50 mb-2">
            <ProductImg src={prod?.img} size={48} alt={prod?.name} />
            <div className="flex-1 min-w-0">
              <select
                className="w-full text-xs rounded-lg border border-stone-300 bg-white p-2 font-bold focus:outline-none"
                value={pid}
                onChange={(e) => {
                  setPid(e.target.value);
                  const p = db.products.find((x) => x.id === e.target.value);
                  setVid(p?.variants[0]?.id || "");
                }}
              >
                {db.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({totalQty(p)} pcs স্টকে)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visual Color Chips with Photos */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">কালার ও ভ্যারিয়েন্ট নির্বাচন করুন</label>
          <div className="flex flex-wrap gap-2">
            {(prod?.variants || []).map((v) => {
              const isSelected = v.id === vid;
              const varImg = v.img || prod?.img;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVid(v.id)}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-xs cursor-pointer text-left transition-all ${
                    isSelected
                      ? "border-amber-600 bg-amber-100 ring-2 ring-amber-600 shadow-xs"
                      : "border-stone-200 bg-white hover:border-amber-400"
                  }`}
                >
                  {varImg ? (
                    <img
                      src={varImg}
                      alt={v.color}
                      className="w-8 h-8 rounded-lg object-cover border border-amber-300 shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-stone-200 flex items-center justify-center text-xs shrink-0">
                      👜
                    </span>
                  )}
                  <div className="leading-tight">
                    <span className="font-bold text-stone-900 block text-xs">{v.color}</span>
                    <span className="text-[10px] text-stone-500 font-bold">স্টকে: {v.qty} pcs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">পরিমাণ (পিস)</label>
          <input
            type="number"
            className={inputCls}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">নোট / কারণ (ঐচ্ছিক)</label>
          <input
            className={inputCls}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="যেমন: চকবাজার থেকে নতুন লট আনা হলো"
          />
        </div>

        <div className="pt-2">
          <Btn color={mode === "in" ? "green" : "orange"} onClick={submit}>
            {mode === "in" ? "📥 স্টক ইন নিশ্চিত করুন" : "📤 স্টক আউট করুন"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function StockTab() {
  const { db, mutateAndSync } = useShop();
  const { role } = useAuth();
  const isOwner = role === "owner" || role === "admin";

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "low" | "inactive">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [moveMode, setMoveMode] = useState<"in" | "out" | null>(null);
  const [activeVariantImg, setActiveVariantImg] = useState<Record<string, string>>({});
  const [zoomImg, setZoomImg] = useState<{ src: string; title: string } | null>(null);

  const totalModels = db.products.length;
  const totalPcs = db.products.reduce((acc, p) => acc + totalQty(p), 0);
  const lowCount = db.products.filter(isLow).length;

  const filtered = useMemo(() => {
    return db.products.filter((p) => {
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = (
          p.name +
          " " +
          p.code +
          " " +
          p.cat +
          " " +
          p.variants.map((v) => v.color + " " + v.size).join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Cat filter
      if (catFilter !== "all" && p.cat !== catFilter) return false;

      // Status filter
      if (statusFilter === "active" && p.active === false) return false;
      if (statusFilter === "inactive" && p.active !== false) return false;
      if (statusFilter === "low" && !isLow(p)) return false;

      return true;
    });
  }, [db.products, search, catFilter, statusFilter]);

  const moveProductOrder = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= db.products.length) return;

    await mutateAndSync((d) => {
      const item = d.products.splice(index, 1)[0];
      d.products.splice(targetIdx, 0, item);
    });
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`"${p.name}" কি তালিকা থেকে মুছে ফেলবেন?`)) return;
    await mutateAndSync((d) => {
      d.products = d.products.filter((x) => x.id !== p.id);
      d.moves.unshift({
        id: uid(),
        date: todayBn(),
        text: `🗑️ মুছে ফেলা হলো: ${p.name}`,
      });
    });
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black text-stone-900 flex items-center gap-1.5">
          👜 ব্যাগের স্টক ম্যানেজমেন্ট
        </h2>
        {isOwner && (
          <Btn small color="amber" onClick={() => setIsAdding(true)}>
            + নতুন ব্যাগ
          </Btn>
        )}
      </div>

      {/* Stock summary mini-metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200 bg-white p-2.5 text-center shadow-xs">
          <div className="text-xl font-black text-stone-900">{totalModels}</div>
          <div className="text-[11px] font-medium text-stone-500">মোট মডেল</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-2.5 text-center shadow-xs">
          <div className="text-xl font-black text-emerald-700">{totalPcs}</div>
          <div className="text-[11px] font-medium text-stone-500">মোট পিস স্টকে</div>
        </div>
        <div
          className={`rounded-xl border p-2.5 text-center shadow-xs ${
            lowCount > 0 ? "border-red-300 bg-red-50 text-red-900" : "border-stone-200 bg-white text-stone-700"
          }`}
        >
          <div className={`text-xl font-black ${lowCount > 0 ? "text-red-700" : "text-stone-900"}`}>
            {lowCount}
          </div>
          <div className="text-[11px] font-medium text-stone-500">লো স্টক মডেল</div>
        </div>
      </div>

      {/* Quick Move Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Btn small color="green" onClick={() => setMoveMode("in")}>
          📥 স্টক ইন (নতুন চালান)
        </Btn>
        <Btn small color="gray" onClick={() => setMoveMode("out")}>
          📤 স্টক আউট (ড্যামেজ/ব্যক্তিগত)
        </Btn>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <input
          type="search"
          placeholder="🔍 ব্যাগের নাম, কোড বা কালার দিয়ে খুঁজুন..."
          className={inputCls}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === "all" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            সব ({totalModels})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === "active" ? "bg-amber-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            সক্রিয়
          </button>
          <button
            onClick={() => setStatusFilter("low")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === "low" ? "bg-red-700 text-white" : "bg-red-50 text-red-800 hover:bg-red-100"
            }`}
          >
            ⚠️ লো স্টক ({lowCount})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
              statusFilter === "inactive" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            বন্ধ
          </button>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-600 shrink-0">ক্যাটাগরি:</span>
          <select
            className="w-full text-xs rounded-lg border border-stone-200 bg-stone-50 p-1.5 focus:outline-none"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">সকল ক্যাটাগরি</option>
            {BAG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bag Items List */}
      {filtered.length === 0 ? (
        <Empty text="কোন ব্যাগ খুঁজে পাওয়া যায়নি" />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p, index) => {
            const pTotal = totalQty(p);
            const pIsLow = isLow(p);
            const margin = (p.sell || 0) - (p.buy || 0);

            return (
              <Card key={p.id} className="relative">
                <div className="flex gap-3.5">
                  {/* Large Product Image with Zoom Support */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setZoomImg({
                          src: activeVariantImg[p.id] || p.img || "",
                          title: p.name,
                        })
                      }
                      className="block cursor-pointer hover:opacity-95 transition-all rounded-2xl overflow-hidden focus:outline-none shadow-xs border-2 border-stone-200 hover:border-amber-500"
                      title="ছবি বড় করে দেখতে চাপুন"
                    >
                      <ProductImg src={activeVariantImg[p.id] || p.img} size={110} alt={p.name} />
                      <span className="absolute bottom-1.5 right-1.5 bg-stone-900/80 text-white rounded-md px-1.5 py-0.5 text-[10px] leading-none flex items-center gap-0.5 font-bold shadow-xs">
                        🔍 বড় ছবি
                      </span>
                    </button>
                    {activeVariantImg[p.id] && (
                      <button
                        type="button"
                        onClick={() => setActiveVariantImg((prev) => ({ ...prev, [p.id]: "" }))}
                        className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center cursor-pointer shadow-md hover:bg-black font-black"
                        title="মূল ছবিতে ফিরুন"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h3 className="font-black text-stone-900 text-sm md:text-base leading-snug">
                          {p.name}
                        </h3>
                        <div className="text-[11px] text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                            {p.code}
                          </span>
                          <span>{p.cat}</span>
                          {p.active === false && (
                            <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                              (বিক্রি বন্ধ)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-amber-950">৳{p.sell}</div>
                        {isOwner && (
                          <div className="text-[10px] text-emerald-700 font-bold">
                            লাভ: ৳{margin}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock by variant badges with clearly visible large 48px photo thumbnails */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {p.variants.map((v) => {
                        const isOut = v.qty <= 0;
                        const isUnderLow = v.qty <= (p.low || 3) && !isOut;
                        const isSelected = activeVariantImg[p.id] === v.img && !!v.img;
                        const varDisplayImg = v.img || p.img;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              if (v.img) {
                                setActiveVariantImg((prev) => ({
                                  ...prev,
                                  [p.id]: prev[p.id] === v.img ? "" : v.img!,
                                }));
                              } else {
                                setZoomImg({
                                  src: p.img || "",
                                  title: `${p.name} - ${v.color}`,
                                });
                              }
                            }}
                            className={`inline-flex items-center gap-2.5 text-xs p-1.5 pr-3 rounded-2xl font-medium border-2 transition-all text-left ${
                              isSelected
                                ? "ring-2 ring-amber-600 border-amber-600 bg-amber-100 shadow-xs"
                                : isOut
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isUnderLow
                                ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                                : "bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-stone-50"
                            } cursor-pointer`}
                            title={v.img ? "এই কালারের ছবি বড় দেখতে চাপুন" : "ছবি দেখতে চাপুন"}
                          >
                            {varDisplayImg ? (
                              <img
                                src={varDisplayImg}
                                alt={v.color}
                                className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <span className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-sm text-stone-600 shrink-0">
                                👜
                              </span>
                            )}
                            <div className="leading-tight">
                              <span className="font-black text-stone-900 block text-xs">{v.color}</span>
                              <span className={`text-[11px] font-black ${isOut ? "text-red-600" : "text-stone-600"}`}>
                                {isOut ? "০ (শেষ ❌)" : `${v.qty} pcs`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
                      <div className="flex items-center gap-1 text-stone-400">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => moveProductOrder(index, "up")}
                              disabled={index === 0}
                              className="px-1.5 py-0.5 rounded hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                              title="উপরে নিন"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveProductOrder(index, "down")}
                              disabled={index === db.products.length - 1}
                              className="px-1.5 py-0.5 rounded hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                              title="নিচে নিন"
                            >
                              ↓
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                            >
                              ✏️ এডিট
                            </button>
                            <button
                              onClick={() => deleteProduct(p)}
                              className="px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              title="মুছুন"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bag Modal */}
      {(isAdding || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setIsAdding(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Stock In / Out Modal */}
      {moveMode && (
        <MoveModal mode={moveMode} onClose={() => setMoveMode(null)} />
      )}

      {/* Bag Image Zoom Lightbox Modal */}
      {zoomImg && (
        <Modal title={zoomImg.title} onClose={() => setZoomImg(null)}>
          <div className="flex flex-col items-center p-2">
            <img
              src={zoomImg.src}
              alt={zoomImg.title}
              className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain border border-stone-200 shadow-lg bg-white"
            />
            <div className="mt-4 text-center">
              <Btn small color="gray" onClick={() => setZoomImg(null)}>
                বন্ধ করুন
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
