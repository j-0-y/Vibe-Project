import type { OrderItem, Product, ShopData } from "./types";

/**
 * Restores items back into product stock inventory (e.g. on return or order cancellation)
 */
export function restoreInto(d: ShopData, items: OrderItem[]) {
  (items || []).forEach((t) => {
    const p = d.products.find((x) => x.id === t.productId);
    const v = p?.variants.find((x) => x.id === t.variantId);
    if (v) v.qty += +t.qty || 0;
  });
}

/**
 * Deducts items from product stock inventory (e.g. on order creation)
 */
export function deductInto(d: ShopData, items: OrderItem[]) {
  (items || []).forEach((t) => {
    const p = d.products.find((x) => x.id === t.productId);
    const v = p?.variants.find((x) => x.id === t.variantId);
    if (v) v.qty -= +t.qty || 0;
  });
}

export function incomingQtyOf(order: { incoming?: OrderItem[] | null }): number {
  return (order.incoming || []).reduce((a, t) => a + (+t.qty || 0), 0);
}

export function incomingOfVariant(d: ShopData, pid: string, vid: string): number {
  let n = 0;
  (d.orders || []).forEach((o) =>
    (o.incoming || []).forEach((t) => {
      if (t.productId === pid && t.variantId === vid) n += +t.qty || 0;
    })
  );
  return n;
}

export function findVariant(p: Product | undefined, vid: string) {
  return p?.variants.find((x) => x.id === vid);
}
