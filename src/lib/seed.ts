import type { Product, ShopData } from "./types";
import { uid, todayBn } from "./utils";

// Clean lightweight inline SVG icons for bag types
const makeBagSvg = (color: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="16" fill="#fdfbf7"/>
    <path d="M35 32 C35 20, 65 20, 65 32" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <rect x="20" y="32" width="60" height="50" rx="10" fill="${color}" fill-opacity="0.85"/>
    <rect x="42" y="38" width="16" height="14" rx="4" fill="#fbbf24"/>
    <text x="50" y="94" font-size="9" font-family="sans-serif" font-weight="bold" fill="#666" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_BAG_PRODUCTS: Product[] = [
  {
    id: "bag_01",
    name: "লুক্স লেদার শোল্ডার ব্যাগ (Luxe Shoulder Bag)",
    code: "BG-101",
    cat: "শোল্ডার ব্যাগ (Shoulder Bag)",
    buy: 700,
    sell: 1350,
    low: 3,
    img: makeBagSvg("#78350f", "SHOULDER"),
    active: true,
    variants: [
      { id: "v1_1", size: "স্ট্যান্ডার্ড", color: "কালো (Black)", qty: 12 },
      { id: "v1_2", size: "স্ট্যান্ডার্ড", color: "ট্যান (Tan)", qty: 8 },
      { id: "v1_3", size: "স্ট্যান্ডার্ড", color: "মেরুন (Maroon)", qty: 5 },
    ],
  },
  {
    id: "bag_02",
    name: "ক্লাসিক এলিগ্যান্ট হ্যান্ডব্যাগ (Classic Handbag)",
    code: "BG-102",
    cat: "লেডিস হ্যান্ডব্যাগ (Handbag)",
    buy: 850,
    sell: 1650,
    low: 2,
    img: makeBagSvg("#831843", "HANDBAG"),
    active: true,
    variants: [
      { id: "v2_1", size: "মিডিয়াম", color: "ক্রিম / বেইজ (Cream)", qty: 10 },
      { id: "v2_2", size: "মিডিয়াম", color: "কালো (Black)", qty: 15 },
      { id: "v2_3", size: "মিডিয়াম", color: "প্যাস্টেল পিংক", qty: 4 },
    ],
  },
  {
    id: "bag_03",
    name: "ক্যানভাস ট্রাভেল টোট ব্যাগ (Everyday Canvas Tote)",
    code: "BG-103",
    cat: "টোট ব্যাগ (Tote Bag)",
    buy: 380,
    sell: 790,
    low: 4,
    img: makeBagSvg("#0f766e", "TOTE"),
    active: true,
    variants: [
      { id: "v3_1", size: "লার্জ", color: "হোয়াইট / অফ-হোয়াইট", qty: 20 },
      { id: "v3_2", size: "লার্জ", color: "অলিভ গ্রিন", qty: 14 },
      { id: "v3_3", size: "লার্জ", color: "নেভি ব্লু", qty: 7 },
    ],
  },
  {
    id: "bag_04",
    name: "স্মার্ট ওয়াটারপ্রুফ ব্যাকপ্যাক (Anti-Theft Backpack)",
    code: "BG-104",
    cat: "ব্যাকপ্যাক (Backpack)",
    buy: 920,
    sell: 1750,
    low: 2,
    img: makeBagSvg("#1e293b", "BACKPACK"),
    active: true,
    variants: [
      { id: "v4_1", size: "স্ট্যান্ডার্ড", color: "কালো (Black)", qty: 9 },
      { id: "v4_2", size: "স্ট্যান্ডার্ড", color: "কফি (Coffee)", qty: 2 },
    ],
  },
  {
    id: "bag_05",
    name: "চেইন স্ট্র্যাপ স্লিং ব্যাগ (Chain Sling Clutch)",
    code: "BG-105",
    cat: "ক্রসবডি / স্লিং ব্যাগ (Crossbody)",
    buy: 480,
    sell: 980,
    low: 3,
    img: makeBagSvg("#c2410c", "SLING"),
    active: true,
    variants: [
      { id: "v5_1", size: "মিনি / কমপ্যাক্ট", color: "মেরুন (Maroon)", qty: 6 },
      { id: "v5_2", size: "মিনি / কমপ্যাক্ট", color: "কালো (Black)", qty: 11 },
      { id: "v5_3", size: "মিনি / কমপ্যাক্ট", color: "ট্যান (Tan)", qty: 1 },
    ],
  },
];

export function getInitialSeedData(): ShopData {
  return {
    products: INITIAL_BAG_PRODUCTS,
    orders: [
      {
        id: "BG-" + Math.floor(1000 + Math.random() * 9000),
        ts: Date.now() - 3600000 * 2,
        date: todayBn(),
        customer: "নুসরাত জাহান",
        phone: "01712345678",
        address: "বাসা ১৮, রোড ৪, ধানমন্ডি, ঢাকা",
        items: [
          {
            productId: "bag_01",
            variantId: "v1_1",
            productName: "লুক্স লেদার শোল্ডার ব্যাগ (Luxe Shoulder Bag)",
            variantLabel: "স্ট্যান্ডার্ড কালো (Black)",
            qty: 1,
            price: 1350,
            buy: 700,
          },
        ],
        total: 1350,
        cod: 1430, // 1350 + 80 delivery
        zone: "inside",
        dcost: 80,
        dcharge: 80,
        status: "Pending",
        payment: "ক্যাশ অন ডেলিভারি (COD)",
        note: "বিকেলে ডেলিভারি দিলে ভালো হয়",
      },
      {
        id: "BG-" + Math.floor(1000 + Math.random() * 9000),
        ts: Date.now() - 3600000 * 26,
        date: todayBn(),
        customer: "তানিয়া আক্তার",
        phone: "01819876543",
        address: "জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম",
        items: [
          {
            productId: "bag_02",
            variantId: "v2_1",
            productName: "ক্লাসিক এলিগ্যান্ট হ্যান্ডব্যাগ (Classic Handbag)",
            variantLabel: "মিডিয়াম ক্রিম / বেইজ (Cream)",
            qty: 1,
            price: 1650,
            buy: 850,
          },
        ],
        total: 1650,
        cod: 1780, // 1650 + 130 delivery
        zone: "outside",
        dcost: 115,
        dcharge: 130,
        steadfastId: "CID-94812",
        trackingCode: "SF-883921",
        liveStatus: "in_transit",
        status: "Shipped",
        payment: "ক্যাশ অন ডেলিভারি (COD)",
        note: "সাবধানে হ্যান্ডেল করবেন",
      },
    ],
    moves: [
      { id: uid(), date: todayBn(), text: "🎉 ব্যাগ শপ অটোমেশন সিস্টেম চালু হলো" },
      { id: uid(), date: todayBn(), text: "👜 প্রাথমিক ৫টি জনপ্রিয় ব্যাগের স্টক যুক্ত করা হলো" },
    ],
    ads: [],
    notifs: [
      {
        id: uid(),
        ts: Date.now() - 10000,
        title: "স্বাগতম!",
        body: "আপনার ব্যাগ শপ সিস্টেম প্রস্তুত। স্টেডফাস্ট ও সুপাবেস সেটআপ গাইড দেখুন।",
      },
    ],
    settings: {
      shopName: "আমার ব্যাগের দোকান",
      fxRate: 130,
      mockSteadfast: false,
      ship: {
        inside: { cost: 80, fee: 80 },
        sub: { cost: 100, fee: 100 },
        outside: { cost: 115, fee: 130 },
      },
    },
    salesDay: { start: Date.now() - 3600000 * 12 },
    salesDays: [],
    monthAds: [],
  };
}
