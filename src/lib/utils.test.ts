import test from "node:test";
import assert from "node:assert/strict";
import {
  toEnDigits,
  validPhone,
  extractPhone,
  guessZone,
  parseCustomerBlock,
  codOf,
} from "./utils.ts";
import { restoreInto, deductInto } from "./stock.ts";
import type { ShopData, Product } from "./types.ts";

test("toEnDigits converts Bengali digits to English digits", () => {
  assert.equal(toEnDigits("০১৭১২৩৪৫৬৭৮"), "01712345678");
  assert.equal(toEnDigits("দাম ১২৫০ টাকা"), "দাম 1250 টাকা");
});

test("validPhone checks 11 digit Bangladeshi numbers", () => {
  assert.equal(validPhone("01712345678"), true);
  assert.equal(validPhone("01812345678"), true);
  assert.equal(validPhone("01912345678"), true);
  assert.equal(validPhone("01212345678"), false); // 012 invalid operator
  assert.equal(validPhone("0171234567"), false); // 10 digits
  assert.equal(validPhone("017123456789"), false); // 12 digits
});

test("extractPhone finds BD numbers with spaces, prefix +880 and dashes", () => {
  assert.equal(extractPhone("Call me at +8801712-345678 please"), "01712345678");
  assert.equal(extractPhone("নাম: সুমাইয়া, ফোন: ০১৭১২৩৪৫৬৭৮"), "01712345678");
  assert.equal(extractPhone("Phone: 01811 223344"), "01811223344");
});

test("guessZone correctly identifies Dhaka inside, sub-Dhaka and outside", () => {
  assert.equal(guessZone("House 12, Road 4, Dhanmondi, Dhaka"), "inside");
  assert.equal(guessZone("মিরপুর ১০, ঢাকা"), "inside");
  assert.equal(guessZone("সাভার বাসস্ট্যান্ড, সাভার"), "sub");
  assert.equal(guessZone("টঙ্গী বাজার, গাজীপুর"), "sub");
  assert.equal(guessZone("নারায়ণগঞ্জ চাষাড়া"), "sub");
  assert.equal(guessZone("কাজীর দেউড়ি, চট্টগ্রাম"), "outside");
  assert.equal(guessZone("জিন্দাবাজার, সিলেট"), "outside");
});

test("parseCustomerBlock parses Facebook Messenger order text", () => {
  const messengerMsg = `
    নাম: সাদিয়া ইসলাম
    মোবাইল: ০১৮১২৩৪৫৬৭৮
    ঠিকানা: বাসা নং ৪৫, রোড ৩, সেক্টর ৭, উত্তরা, ঢাকা
  `;
  const parsed = parseCustomerBlock(messengerMsg);
  assert.equal(parsed.name, "সাদিয়া ইসলাম");
  assert.equal(parsed.phone, "01812345678");
  assert.match(parsed.address, /উত্তরা/);
  assert.equal(parsed.zone, "inside");
});

test("parseCustomerBlock handles raw text without labels", () => {
  const rawMsg = `
    তানভীর আহমেদ
    01912345678
    চৌধুরীপাড়া, রাজশাহী
  `;
  const parsed = parseCustomerBlock(rawMsg);
  assert.equal(parsed.name, "তানভীর আহমেদ");
  assert.equal(parsed.phone, "01912345678");
  assert.equal(parsed.zone, "outside");
});

test("codOf calculates total or cod value correctly", () => {
  assert.equal(codOf({ cod: 1500, total: 1350 }), 1500);
  assert.equal(codOf({ cod: null, total: 1350 }), 1350);
});

test("stock deductInto and restoreInto correctly alters inventory quantities", () => {
  const initialShop: ShopData = {
    products: [
      {
        id: "p1",
        name: "Luxe Leather Bag",
        code: "BG-01",
        cat: "হ্যান্ডব্যাগ",
        buy: 600,
        sell: 1200,
        low: 2,
        variants: [
          { id: "v1", size: "Standard", color: "Black", qty: 10 },
          { id: "v2", size: "Standard", color: "Brown", qty: 5 },
        ],
      },
    ],
    orders: [],
    moves: [],
    ads: [],
    salesDay: null,
    salesDays: [],
    monthAds: [],
  };

  // Deduct 2 pcs of Black
  deductInto(initialShop, [
    {
      productId: "p1",
      variantId: "v1",
      productName: "Luxe Leather Bag",
      variantLabel: "Standard Black",
      qty: 2,
      price: 1200,
    },
  ]);

  assert.equal(initialShop.products[0].variants[0].qty, 8);

  // Restore 1 pc (e.g. partial return or cancel)
  restoreInto(initialShop, [
    {
      productId: "p1",
      variantId: "v1",
      productName: "Luxe Leather Bag",
      variantLabel: "Standard Black",
      qty: 1,
      price: 1200,
    },
  ]);

  assert.equal(initialShop.products[0].variants[0].qty, 9);
});
