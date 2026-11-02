import React from "react";

export default function ProductImg({
  src,
  size = 44,
  alt = "ব্যাগ",
}: {
  src?: string;
  size?: number;
  alt?: string;
}) {
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-lg select-none"
      >
        👜
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-xl border border-stone-200 object-cover bg-white"
      loading="lazy"
    />
  );
}
