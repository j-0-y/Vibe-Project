"use client";
import React, { useRef, useState } from "react";
import { useShop } from "@/hooks/useShop";
import type { Product, Variant } from "@/lib/types";
import { todayBn, uid, BAG_CATEGORIES, BAG_COLORS, BAG_SIZES } from "@/lib/utils";
import { compressImage } from "@/lib/image";
import { Btn, Modal, inputCls, Field } from "@/components/ui";
import ProductImg from "@/components/shared/ProductImg";

interface Row {
  vid: string;
  size: string;
  color: string;
  qty: number;
  img?: string;
}

export default function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { mutateAndSync } = useShop();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || "");
  const [code, setCode] = useState(product?.code || "");
  const [cat, setCat] = useState(product?.cat || BAG_CATEGORIES[0]);
  const [buy, setBuy] = useState(product?.buy?.toString() || "");
  const [sell, setSell] = useState(product?.sell?.toString() || "");
  const [low, setLow] = useState((product?.low ?? 3).toString());
  const [rows, setRows] = useState<Row[]>(
    product && product.variants.length
      ? product.variants.map((v) => ({
          vid: v.id,
          size: v.size,
          color: v.color,
          qty: v.qty,
          img: v.img || "",
        }))
      : [
          { vid: uid(), size: "স্ট্যান্ডার্ড", color: "কালো (Black)", qty: 10, img: "" },
          { vid: uid(), size: "স্ট্যান্ডার্ড", color: "বাদামী (Brown)", qty: 5, img: "" },
        ]
  );
  const [img, setImg] = useState(product?.img || "");
  const [active, setActive] = useState(product?.active !== false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setRow = (i: number, k: keyof Row, val: string | number) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  };

  const addRow = () => {
    setRows((rs) => [
      ...rs,
      { vid: uid(), size: "স্ট্যান্ডার্ড", color: "ট্যান (Tan)", qty: 5, img: "" },
    ]);
  };

  const pickVariantImg = async (i: number, f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const compressed = await compressImage(f);
      setRow(i, "img", compressed);
    } catch {
      alert("ভ্যারিয়েন্ট ছবি প্রসেস করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) {
      alert("কমপক্ষে ১টি ভ্যারিয়েন্ট থাকতে হবে");
      return;
    }
    setRows((rs) => rs.filter((_, j) => j !== i));
  };

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const compressed = await compressImage(f);
      setImg(compressed);
    } catch {
      alert("ছবি প্রসেস করা যায়নি, অন্য ছবি নির্বাচন করুন");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy) {
      alert("ছবি প্রসেসিং হচ্ছে, ২ সেকেন্ড পর সেভ দিন");
      return;
    }
    const nm = name.trim();
    if (!nm) {
      alert("ব্যাগের নাম লিখুন");
      return;
    }
    if (!rows.length) {
      alert("কমপক্ষে ১টি কালার/সাইজ ভ্যারিয়েন্ট যোগ করুন");
      return;
    }

    const vars: Variant[] = rows.map((r) => ({
      id: r.vid || uid(),
      size: (r.size || "স্ট্যান্ডার্ড").trim(),
      color: (r.color || "কালো").trim(),
      qty: parseInt(String(r.qty)) || 0,
      img: r.img ? r.img.trim() : undefined,
    }));

    const total = vars.reduce((a, v) => a + v.qty, 0);

    await mutateAndSync((d) => {
      if (isEdit && product) {
        const p = d.products.find((x) => x.id === product.id);
        if (!p) return;
        p.name = nm;
        p.code = code.trim() || ("BG-" + Math.floor(100 + Math.random() * 900));
        p.cat = cat;
        p.buy = +buy || 0;
        p.sell = +sell || 0;
        p.low = +low || 3;
        p.variants = vars;
        p.img = img;
        p.active = active;
        d.moves.unshift({
          id: uid(),
          date: todayBn(),
          text: `✏️ আপডেট: ${nm} (এখন মোট ${total} pcs)`,
        });
      } else {
        d.products.unshift({
          id: uid(),
          name: nm,
          code: code.trim() || ("BG-" + Math.floor(100 + Math.random() * 900)),
          cat,
          buy: +buy || 0,
          sell: +sell || 0,
          low: +low || 3,
          variants: vars,
          img,
          active,
        });
        d.moves.unshift({
          id: uid(),
          date: todayBn(),
          text: `➕ নতুন ব্যাগ যুক্ত: ${nm} (${total} pcs)`,
        });
      }
    });

    onClose();
  };

  return (
    <Modal
      title={isEdit ? "✏️ ব্যাগের তথ্য এডিট করুন" : "👜 নতুন ব্যাগ যুক্ত করুন"}
      onClose={onClose}
    >
      <div className="space-y-3.5">
        {/* Photo Upload & Preview */}
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
          <ProductImg src={img} size={64} alt={name || "ব্যাগ"} />
          <div className="flex-1">
            <span className="block text-xs font-bold text-stone-700">ব্যাগের ছবি</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <div className="mt-1 flex items-center gap-2">
              <Btn
                small
                color="gray"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                {busy ? "কম্প্রেস হচ্ছে..." : "📷 ছবি আপলোড"}
              </Btn>
              {img && (
                <button
                  type="button"
                  onClick={() => setImg("")}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  ছবি সরান
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name and Code */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Field label="ব্যাগের নাম *">
              <input
                className={inputCls}
                placeholder="যেমন: প্রিমিয়াম লেদার শোল্ডার ব্যাগ"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </div>
          <div>
            <Field label="আইটেম কোড">
              <input
                className={inputCls}
                placeholder="BG-101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Category */}
        <Field label="ক্যাটাগরি">
          <select
            className={inputCls}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {BAG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        {/* Pricing & Alert */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Field label="কেনা দাম (৳)" hint="COGS হিসাবের জন্য">
              <input
                type="number"
                className={inputCls}
                placeholder="650"
                value={buy}
                onChange={(e) => setBuy(e.target.value)}
              />
            </Field>
          </div>
          <div>
            <Field label="বিক্রি দাম (৳) *" hint="কাস্টমার দাম">
              <input
                type="number"
                className={inputCls}
                placeholder="1350"
                value={sell}
                onChange={(e) => setSell(e.target.value)}
              />
            </Field>
          </div>
          <div>
            <Field label="লো স্টক অ্যালার্ট" hint="কম পিস সতর্কবার্তা">
              <input
                type="number"
                className={inputCls}
                placeholder="3"
                value={low}
                onChange={(e) => setLow(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Variants: Color + Size/Type + Qty + Variant Image */}
        <div className="border-t border-stone-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-stone-700 block">
                কালার ও সাইজ ভ্যারিয়েন্ট ({rows.length}টি)
              </span>
              <span className="text-[10px] text-amber-800 font-medium">
                📷 প্রতিটি কালারের জন্য ছবি যুক্ত করতে পারবেন
              </span>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              + ভ্যারিয়েন্ট যোগ
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rows.map((r, i) => (
              <div
                key={r.vid || i}
                className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs"
              >
                {/* Variant Image Uploader */}
                <div className="shrink-0">
                  <input
                    id={`var-img-${i}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickVariantImg(i, e.target.files?.[0])}
                  />
                  {r.img ? (
                    <div className="relative group">
                      <img
                        src={r.img}
                        alt={r.color}
                        className="w-8 h-8 rounded-lg object-cover border border-amber-400 shadow-2xs"
                      />
                      <label
                        htmlFor={`var-img-${i}`}
                        className="absolute inset-0 bg-black/50 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity font-bold text-center leading-tight"
                        title="ছবি পরিবর্তন করুন"
                      >
                        বদলে
                      </label>
                      <button
                        type="button"
                        onClick={() => setRow(i, "img", "")}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] hover:bg-red-700 shadow-xs cursor-pointer leading-none"
                        title="ছবি মুছুন"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`var-img-${i}`}
                      className="w-8 h-8 rounded-lg border border-dashed border-stone-300 bg-white hover:border-amber-500 hover:bg-amber-50 flex flex-col items-center justify-center text-stone-400 hover:text-amber-800 cursor-pointer transition-colors"
                      title="এই কালারের ছবি আপলোড করুন"
                    >
                      <span className="text-xs leading-none">📷</span>
                      <span className="text-[8px] font-bold leading-none mt-0.5">ছবি</span>
                    </label>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    list="color-presets"
                    className="w-full rounded-lg border border-stone-300 bg-white p-1.5 text-xs focus:outline-none"
                    placeholder="কালার (যেমন: কালো)"
                    value={r.color}
                    onChange={(e) => setRow(i, "color", e.target.value)}
                  />
                  <datalist id="color-presets">
                    {BAG_COLORS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="w-20">
                  <input
                    list="size-presets"
                    className="w-full rounded-lg border border-stone-300 bg-white p-1.5 text-xs focus:outline-none"
                    placeholder="সাইজ"
                    value={r.size}
                    onChange={(e) => setRow(i, "size", e.target.value)}
                  />
                  <datalist id="size-presets">
                    {BAG_SIZES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="w-14">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-stone-300 bg-white p-1.5 text-xs text-center font-bold focus:outline-none"
                    placeholder="পিস"
                    value={r.qty}
                    onChange={(e) => setRow(i, "qty", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="p-1 text-stone-400 hover:text-red-600 cursor-pointer text-sm"
                  aria-label="Remove variant"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded text-amber-700 accent-amber-700"
          />
          <span className="text-xs text-stone-700 font-medium">
            সক্রিয় (অর্ডার নেওয়ার জন্য উপলভ্য থাকবে)
          </span>
        </label>

        {/* Save button */}
        <div className="pt-2">
          <Btn color="amber" onClick={save} disabled={busy}>
            {busy ? "প্রসেসিং হচ্ছে..." : isEdit ? "💾 আপডেট সেভ করুন" : "➕ ব্যাগ সেভ করুন"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
