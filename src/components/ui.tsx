"use client";
import React from "react";

export function Btn({
  children,
  onClick,
  color = "amber",
  small,
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: "amber" | "green" | "orange" | "blue" | "gray" | "red" | "dark";
  small?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const colors: Record<string, string> = {
    amber: "bg-[#b45309] text-white hover:bg-[#92400e] active:bg-[#78350f]",
    green: "bg-[#15803d] text-white hover:bg-[#166534] active:bg-[#14532d]",
    orange: "bg-[#ea580c] text-white hover:bg-[#c2410c] active:bg-[#9a3412]",
    blue: "bg-[#1d4ed8] text-white hover:bg-[#1e40af] active:bg-[#1e3a8a]",
    gray: "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300",
    red: "bg-[#b91c1c] text-white hover:bg-[#991b1b] active:bg-[#7f1d1d]",
    dark: "bg-[#292524] text-white hover:bg-[#1c1917]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`font-semibold transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none ${
        small ? "px-3 py-1.5 text-xs rounded-lg min-h-[34px]" : "w-full p-3 text-[15px] rounded-xl min-h-[44px]"
      } active:scale-[0.98] ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${
        colors[color]
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-amber-950/10 bg-white p-4 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block mb-2">
      {label ? <span className="block text-xs font-bold text-stone-700 mb-1">{label}</span> : null}
      {children}
      {hint ? <span className="block text-[11px] text-stone-500 mt-0.5">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-amber-900/20 bg-stone-50/60 p-2.5 text-stone-900 focus:bg-white focus:border-amber-700 focus:ring-1 focus:ring-amber-700/30 focus:outline-none transition-colors text-[15px]";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center p-0 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[22px] bg-white p-4.5 pb-8 sm:rounded-[22px] shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
        <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2.5">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 text-base"
            aria-label="বন্ধ"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({
  num,
  label,
  alert,
  icon,
}: {
  num: React.ReactNode;
  label: string;
  alert?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 text-center transition-all ${
        alert
          ? "border-red-300 bg-red-50 text-red-900 shadow-xs"
          : "border-stone-200/80 bg-white text-stone-800 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        {icon ? <span className="text-base">{icon}</span> : null}
        <div className={`text-2xl font-black ${alert ? "text-red-700" : "text-stone-900"}`}>
          {num}
        </div>
      </div>
      <div className="text-xs font-medium text-stone-500">{label}</div>
    </div>
  );
}

export function Badge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800 border-amber-300",
    Packed: "bg-blue-100 text-blue-800 border-blue-300",
    Shipped: "bg-purple-100 text-purple-800 border-purple-300",
    Delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
    Cancelled: "bg-stone-200 text-stone-700 border-stone-300",
    Returned: "bg-red-100 text-red-800 border-red-300",
  };

  const labels: Record<string, string> = {
    Pending: "পেন্ডিং",
    Packed: "প্যাকড",
    Shipped: "স্টেডফাস্টে 🚚",
    Delivered: "ডেলিভারড ✅",
    Cancelled: "ক্যানসেল",
    Returned: "রিটার্ন",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
        styles[status] || "bg-stone-100 text-stone-700 border-stone-300"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export function Empty({ text = "কিছু পাওয়া যায়নি" }: { text?: string }) {
  return (
    <div className="py-8 text-center text-sm text-stone-400">
      <div className="text-2xl mb-1">📭</div>
      <p>{text}</p>
    </div>
  );
}

export function Spinner({ text = "লোড হচ্ছে..." }: { text?: string }) {
  return (
    <div className="py-10 text-center text-stone-500">
      <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
