import type { Order, OrderItem, Product, ShipZone, Zone } from "./types";

export type { Zone };

/** Short unique id */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function todayBn(): string {
  return new Date().toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}

export function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("bn-BD");
}

export function isActive(p?: Product | null): boolean {
  return p ? p.active !== false : false;
}

/** Order revenue = COD (if set) or items total */
export function codOf(o: Pick<Order, "cod" | "total">): number {
  if (o.cod != null && String(o.cod) !== "") return +o.cod || 0;
  return +o.total || 0;
}

export function buyOf(it: OrderItem, products: Product[]): number {
  if (it.buy) return it.buy;
  const p = products.find((x) => x.id === it.productId);
  return p?.buy || 0;
}

export function totalQty(p: Product): number {
  return (p.variants || []).reduce((a, v) => a + (+v.qty || 0), 0);
}

export function isLow(p: Product): boolean {
  return (p.variants || []).some((v) => (+v.qty || 0) <= (+p.low || 0));
}

export function bnStatus(s: string): string {
  const m: Record<string, string> = {
    Pending: "পেন্ডিং",
    Packed: "প্যাকড",
    Shipped: "স্টেডফাস্টে 🚚",
    Delivered: "ডেলিভারড ✅",
    Cancelled: "ক্যানসেল",
    Returned: "রিটার্ন",
  };
  return m[s] || s;
}

export function zoneName(z?: string): string {
  return z === "inside" ? "ঢাকার ভেতর" : z === "sub" ? "সাব-ঢাকা" : "ঢাকার বাইরে";
}

export const DEFAULT_SHIP: Record<Zone, ShipZone> = {
  inside: { cost: 80, fee: 80 },
  sub: { cost: 100, fee: 100 },
  outside: { cost: 115, fee: 130 },
};

const OUTSIDE_EX = ["bandarban", "বান্দরবান", "coxsbazar", "cox's bazar", "cox bazar", "কক্সবাজার"];

const SUB_KEYS = [
  "savar", "সাভার", "gazipur", "গাজীপুর", "gajipur", "narayanganj", "নারায়ণগঞ্জ",
  "keraniganj", "কেরানীগঞ্জ", "munshiganj", "মুন্সিগঞ্জ", "dhamrai", "ধামরাই",
  "tongi", "টঙ্গী", "fatulla", "ফতুল্লা", "sonargaon", "সোনারগাঁ", "rupganj", "রূপগঞ্জ",
  "ashulia", "আশুলিয়া", "sreepur", "শ্রীপুর", "kaliganj", "কালীগঞ্জ", "kapasia", "কাপাসিয়া",
  "dohar", "দোহার", "nawabganj", "নবাবগঞ্জ", "joypara", "জয়পাড়া", "bandar", "বন্দর",
  "chashara", "চাষাড়া", "siddhirganj", "সিদ্ধিরগঞ্জ", "zinzira", "জিনজিরা",
  "hemayetpur", "হেমায়েতপুর", "konabari", "কোনাবাড়ী", "chowrasta", "চৌরাস্তা",
  "boardbazar", "বোর্ডবাজার", "mawna", "মাওনা", "pubail", "পূবাইল", "kaliakair", "কালিয়াকৈর",
  "araihazar", "আড়াইহাজার", "mawa", "মাওয়া", "sreenagar", "শ্রীনগর", "sirajdikhan", "সিরাজদিখান",
  "tongibari", "টঙ্গীবাড়ী", "birulia", "বিরুলিয়া", "jahangirnagar", "জাহাঙ্গীরনগর",
];

const INSIDE_KEYS = [
  "dhaka", "ঢাকা", "mirpur", "মিরপুর", "uttara", "উত্তরা", "uttora", "gulshan", "গুলশান",
  "banani", "বনানী", "dhanmondi", "ধানমন্ডি", "mohammadpur", "মোহাম্মদপুর", "mohakhali", "মহাখালী",
  "jatrabari", "যাত্রাবাড়ী", "wari", "ওয়ারী", "lalbagh", "লালবাগ", "tejgaon", "তেজগাঁও",
  "motijheel", "মতিঝিল", "khilgaon", "খিলগাঁও", "rampura", "রামপুরা", "badda", "বাড্ডা",
  "banasree", "বনশ্রী", "pallabi", "পল্লবী", "kafrul", "কাফরুল", "shahbagh", "শাহবাগ",
  "shahbag", "ramna", "রমনা", "kotwali", "কোতোয়ালি", "sutrapur", "সূত্রাপুর", "demra", "ডেমরা",
  "shampur", "শ্যামপুর", "jurain", "জুরাইন", "postagola", "পোস্তগোলা", "matuail", "মাতুয়াইল",
  "konapara", "কোনাপাড়া", "kamrangirchar", "কামরাঙ্গীরচর", "adabor", "আদাবর",
  "darussalam", "দারুসসালাম", "gabtoli", "গাবতলী", "aminbazar", "আমিনবাজার", "shyamoli", "শ্যামলী",
  "bosila", "বসিলা", "khilkhet", "খিলক্ষেত", "vatara", "ভাটারা", "kurmitola", "কুর্মিটোলা",
  "nikunja", "নিকুঞ্জ", "cantonment", "ক্যান্টনমেন্ট", "manikdi", "মানিকদী", "matikata", "মাটিকাটা",
  "dohs", "ডিওএইচএস", "baridhara", "বারিধারা", "niketon", "নিকেতন", "gulistan", "গুলিস্তান",
  "paltan", "পল্টন", "sadarghat", "সদরঘাট", "chawkbazar", "চকবাজার", "islampur", "ইসলামপুর",
  "bangshal", "বংশাল", "gendaria", "গেণ্ডারিয়া", "lalmatia", "লালমাটিয়া", "kalabagan", "কলাবাগান",
  "panthapath", "পান্থপথ", "farmgate", "ফার্মগেট", "karwan", "কারওয়ান", "kawran",
  "nakhalpara", "নাখালপাড়া", "malibagh", "মালিবাগ", "shantinagar", "শান্তিনগর", "moghbazar", "মগবাজার",
  "hatirjheel", "হাতিরঝিল", "hatirjhil", "sher-e-bangla", "শেরেবাংলা", "sher e bangla",
  "agargaon", "আগারগাঁও", "kazipara", "কাজীপাড়া", "senpara", "সেনপাড়া", "rupnagar", "রূপনগর",
  "shah ali", "শাহআলী", "bhashantek", "ভাষানটেক", "turag", "তুরাগ", "dakkhin khan", "দক্ষিণখান",
  "uttarkhan", "উত্তরখান", "shahjahanpur", "শাহজাহানপুর", "goran", "গোড়ান", "merul", "মেরুল",
  "elephant", "এলিফ্যান্ট", "kathalbagan", "কাঁঠালবাগান", "green road", "গ্রীনরোড",
  "hazaribagh", "হাজারীবাগ", "kamalapur", "কমলাপুর", "sayedabad", "সায়েদাবাদ",
  "maniknagar", "মানিকনগর", "mugda", "মুগদা", "basabo", "বাসাবো",
];

/** Address theke zone guess (default: outside = safe) */
export function guessZone(addr?: string): Zone {
  const a = (addr || "").toLowerCase();
  if (OUTSIDE_EX.some((k) => a.includes(k))) return "outside";
  if (SUB_KEYS.some((k) => a.includes(k))) return "sub";
  if (INSIDE_KEYS.some((k) => a.includes(k))) return "inside";
  return "outside";
}

/** Steadfast create_order body — invoice = order ID */
export function buildParcelBody(o: Order) {
  const body: Record<string, unknown> = {
    invoice: o.id,
    recipient_name: o.customer,
    recipient_phone: o.phone,
    recipient_address: o.address,
    cod_amount: codOf(o),
    delivery_type: 0,
  };
  const note = (o.note || "").trim();
  if (note) body.note = note.slice(0, 480);
  return body;
}

/** 11-digit 01XXXXXXXXX check (valid BD operator 013-019) */
export function validPhone(p: string): boolean {
  return /^01[3-9]\d{8}$/.test((p || "").trim());
}

/** Bangla/Arabic/fullwidth digits -> English */
export function toEnDigits(s: string): string {
  const map: Record<string, string> = {
    // Bengali digits
    "\u09E6": "0", "\u09E7": "1", "\u09E8": "2", "\u09E9": "3", "\u09EA": "4",
    "\u09EB": "5", "\u09EC": "6", "\u09ED": "7", "\u09EE": "8", "\u09EF": "9",
    // Arabic-Indic digits
    "\u0660": "0", "\u0661": "1", "\u0662": "2", "\u0663": "3", "\u0664": "4",
    "\u0665": "5", "\u0666": "6", "\u0667": "7", "\u0668": "8", "\u0669": "9",
    // Eastern Arabic-Indic digits
    "\u06F0": "0", "\u06F1": "1", "\u06F2": "2", "\u06F3": "3", "\u06F4": "4",
    "\u06F5": "5", "\u06F6": "6", "\u06F7": "7", "\u06F8": "8", "\u06F9": "9",
    // Fullwidth digits
    "\uFF10": "0", "\uFF11": "1", "\uFF12": "2", "\uFF13": "3", "\uFF14": "4",
    "\uFF15": "5", "\uFF16": "6", "\uFF17": "7", "\uFF18": "8", "\uFF19": "9",
  };
  return (s || "").replace(/[\u09E6-\u09EF\u0660-\u0669\u06F0-\u06F9\uFF10-\uFF19]/g, (ch) => map[ch] || ch);
}

/** Extract first BD mobile number (01XXXXXXXXX) */
export function extractPhone(text: string): string {
  const compact = toEnDigits(text || "").replace(/[\s\-.()]/g, "");
  const m = compact.match(/(?:\+?880|0)1[3-9]\d{8}/);
  if (!m) return "";
  let d = m[0].replace(/^\+/, "");
  if (d.startsWith("880")) d = "0" + d.slice(3);
  return d.length === 11 ? d : "";
}

function stripLabels(s: string): string {
  return (s || "")
    .replace(/^(name|naam|customer|নাম|ক্রেতা|phone|mobile|ফোন|মোবাইল|address|thikana|ঠিকানা|লোকেশন)\s*[:：\-–—]+\s*/i, "")
    .trim();
}

const ADDR_WORDS =
  /জেলা|থানা|পোষ্ট|পোস্ট|গ্রাম|বাসা|বাড়ি|হোল্ডিং|রোড|রাস্তা|এলাকা|মহল্লা|পাড়া|ডাকঘর|ডাক|upazila|zilla|district|thana|post|village|house|holding|road|area|zip|postal|address|thikana|ঠিকানা/i;

const FIRST_NAMES = new Set(
  (
    "joy rahim karim rakib tanvir hasan hossain ahmed ahmad mohammad md abdullah " +
    "arif asif sakib shakib tamim mahmud shahin sohel rubel sumon kamal jamal " +
    "kamrul nazmul imran fahim fahad nayeem abhi rony rana sajib akash hridoy " +
    "shakil shanto shuvo subho nusrat fatema mim sharmin shirin tania priya " +
    "puja sumaiya jannat ayesha khadija riya mousumi tonmoy nasir kabir " +
    "selim milon bipul jewel raju babul hannan mannan sadia farhana afsana " +
    "জয় রহিম করিম রাকিব তানভীর হাসান হোসেন আহমেদ মোহাম্মদ আব্দুল্লাহ " +
    "আরিফ আসিফ সাকিব শাকিব তামিম মাহমুদ শাহিন সোহেল রুবেল সুমন কামাল জামাল " +
    "কামরুল নাজমুল ইমরান ফাহিম ফাহাদ নাঈম অভি রনি রানা সজীব আকাশ হৃদয় " +
    "শান্ত শুভ নুসরাত ফাতেমা মিম শারমিন শিরিন তানিয়া প্রিয়া পূজা সাদিয়া ফারহানা " +
    "সুমাইয়া জান্নাত আয়েশা খাদিজা রিয়া মৌসুমী তন্ময় নাসির কবির সেলিম মিলন"
  ).split(/\s+/)
);

const DISTRICTS = new Set(
  (
    "dhaka chattogram chittagong cumilla comilla sylhet rajshahi khulna barishal barisal " +
    "rangpur mymensingh gazipur narayanganj narsingdi tangail kishoreganj manikganj " +
    "munshiganj netrokona jamalpur sherpur faridpur gopalganj madaripur rajbari " +
    "shariatpur bogura bogra joypurhat naogaon natore pabna sirajganj dinajpur " +
    "gaibandha kurigram lalmonirhat nilphamari panchagarh thakurgaon bagerhat " +
    "chuadanga jashore jessore jhenaidah kushtia magura meherpur narail satkhira " +
    "barguna bhola jhalokati patuakhali pirojpur bandarban brahmanbaria chandpur " +
    "coxsbazar feni lakshmipur noakhali rangamati khagrachari habiganj " +
    "moulvibazar sunamganj " +
    "ঢাকা চট্টগ্রাম কুমিল্লা সিলেট রাজশাহী খুলনা বরিশাল রংপুর ময়মনসিংহ গাজীপুর " +
    "নারায়ণগঞ্জ নরসিংদী টাঙ্গাইল কিশোরগঞ্জ মানিকগঞ্জ মুন্সিগঞ্জ নেত্রকোণা জামালপুর " +
    "শেরপুর ফরিদপুর গোপালগঞ্জ মাদারীপুর রাজবাড়ী শরীয়তপুর বগুড়া জয়পুরহাট নওগাঁ " +
    "নাটোর পাবনা সিরাজগঞ্জ দিনাজপুর গাইবান্ধা কুড়িগ্রাম লালমনিরহাট নীলফামারী " +
    "পঞ্চগড় ঠাকুরগাঁও বাগেরহাট চুয়াডাঙ্গা যশোর ঝিনাইদহ কুষ্টিয়া মাগুরা মেহেরপুর " +
    "নড়াইল সাতক্ষীরা বরগুনা ভোলা ঝালকাঠি পটুয়াখালী পিরোজপুর বান্দরবান " +
    "ব্রাহ্মণবাড়িয়া চাঁদপুর কক্সবাজার ফেনী লক্ষ্মীপুর নোয়াখালী রাঙ্গামাটি " +
    "খাগড়াছড়ি হবিগঞ্জ মৌলভীবাজার সুনামগঞ্জ"
  ).split(/\s+/)
);

const cleanTok = (w: string) => (w || "").toLowerCase().replace(/[.,]/g, "");

function nameScore(l: string): number {
  const t = (l || "").trim();
  if (!t) return -99;
  let s = 0;
  const words = t.split(/\s+/);
  const first = cleanTok(words[0]);
  if (/^(md|mohammad|mohammed|muhammad|mst|sheikh|syed|chowdhury|khan|মোঃ|মোহাম্মদ|মো|শেখ|সৈয়দ|চৌধুরী|খান)$/.test(first)) s += 3;
  if (FIRST_NAMES.has(first)) s += 3;
  if (words.length <= 3 && t.length <= 28 && /^[A-Za-z\u0980-\u09FF\s.'-]+$/.test(t)) s += 1;
  if (/\d/.test(t)) s -= 3;
  if (ADDR_WORDS.test(t)) s -= 4;
  return s;
}

function addrScore(l: string): number {
  const t = (l || "").trim();
  if (!t) return -99;
  let s = 0;
  if (ADDR_WORDS.test(t)) s += 3;
  s += Math.min((t.match(/,/g) || []).length, 2);
  if (/\d/.test(t)) s += 2;
  const firstTok = cleanTok((t.split(/[\s,]+/)[0] || ""));
  if (firstTok && DISTRICTS.has(firstTok)) s += 3;
  if (t.length > 45) s += 2;
  return s;
}

/**
 * Parses raw Facebook Messenger customer messages into Name, Phone, Address, Zone
 */
export function parseCustomerBlock(text: string): {
  name: string;
  phone: string;
  address: string;
  zone: Zone;
} {
  const raw = (text || "").trim();
  if (!raw) return { name: "", phone: "", address: "", zone: "outside" };

  const phone = extractPhone(raw);
  const lines = raw
    .split(/\r?\n|\\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name = "";
  const addrParts: string[] = [];

  for (const origLine of lines) {
    const l = stripLabels(origLine);
    const linePhone = extractPhone(l);

    // If this line only contains the phone number, skip adding to address
    if (linePhone && l.replace(/[\s\-.()+]/g, "").length <= 15) {
      continue;
    }

    // Explicit label check
    if (/^(name|naam|customer|নাম|ক্রেতা)\s*[:：\-–—]/i.test(origLine)) {
      if (!name) {
        name = l;
        continue;
      }
    }
    if (/^(address|thikana|ঠিকানা|লোকেশন)\s*[:：\-–—]/i.test(origLine)) {
      addrParts.push(l);
      continue;
    }

    // Scoring heuristic
    const nSc = nameScore(l);
    const aSc = addrScore(l);

    if (!name && nSc > aSc && nSc >= 2) {
      name = l;
    } else {
      addrParts.push(l);
    }
  }

  // Fallback: if name not set and there is a clean short line before address
  if (!name && addrParts.length > 1) {
    const first = addrParts[0];
    if (first.length <= 25 && !/\d/.test(first) && !ADDR_WORDS.test(first)) {
      name = addrParts.shift() || "";
    }
  }

  const address = addrParts.join(", ").trim();
  const zone = guessZone(address);

  return { name, phone, address, zone };
}

export const BAG_CATEGORIES = [
  "লেডিস হ্যান্ডব্যাগ (Handbag)",
  "শোল্ডার ব্যাগ (Shoulder Bag)",
  "টোট ব্যাগ (Tote Bag)",
  "ক্রসবডি / স্লিং ব্যাগ (Crossbody)",
  "ব্যাকপ্যাক (Backpack)",
  "পার্স ও ওয়ালেট (Purse/Wallet)",
  "ট্রাভেল / ডাফেল ব্যাগ (Travel Bag)",
  "অন্যান্য ব্যাগ",
];

export const BAG_COLORS = [
  "কালো (Black)",
  "বাদামী (Brown)",
  "ট্যান (Tan)",
  "মেরুন (Maroon)",
  "ক্রিম / বেইজ (Cream)",
  "প্যাস্টেল পিংক",
  "অলিভ গ্রিন",
  "নেভি ব্লু",
  "কফি (Coffee)",
  "হোয়াইট / অফ-হোয়াইট",
];

export const BAG_SIZES = [
  "স্ট্যান্ডার্ড",
  "মিডিয়াম",
  "লার্জ",
  "মিনি / কমপ্যাক্ট",
  "লেদার স্ট্র্যাপ",
  "চেইন স্ট্র্যাপ",
];
