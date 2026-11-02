# 👜 BagBox - ফেসবুক ব্যাগ শপ ম্যানেজার ও স্টেডফাস্ট অটোমেশন

অনলাইন ব্যাগ ও হ্যান্ডব্যাগ শপের জন্য মোবাইল-বান্ধব SaaS অর্ডার ম্যানেজমেন্ট, ফেসবুক মেসেঞ্জার স্মার্ট পেস্ট, স্টেডফাস্ট কুরিয়ার পার্সেল তৈরি ও হিসাব সমাধান।

---

## 🚫 গিটহাবে (GitHub) যে ফাইলগুলো আপলোড করবেন না:

`.gitignore` ফাইলে এগুলো অলরেডি বন্ধ করে দেওয়া আছে:
- ❌ **`.env` বা `.env.local`** (এখানে আপনার আসল পাসওয়ার্ড ও সিক্রেট কী থাকে — গিটহাবে আপলোড করলে হ্যাক হতে পারে!)
- ❌ **`node_modules/`** (এটি বিশাল সাইজের প্যাকেজ ফোল্ডার — Vercel নিজে ইনস্টল করে নেবে)
- ❌ **`dist/` বা `build/`** (বিল্ড ফোল্ডার)
- ❌ **`.playwright-cli/` ও `.aistudio/`** (টেস্টিং ও ক্যাশ ফাইল)
- ❌ **`.zip` ফাইলসমূহ**

---

## ✅ গিটহাবে (GitHub) যে ফাইলগুলো আপলোড করবেন:

- 📄 `package.json`
- 📄 `index.html`
- 📄 `vite.config.ts`
- 📄 `tsconfig.json`
- 📄 `server.ts`
- 📄 `.env.example`
- 📄 `.gitignore`
- 📁 `src/` (এর ভেতরের সমস্ত কোড ফাইল)

---

## 🚀 ভার্সেল (Vercel) Environment Variables:

ভার্সেলে ডেপ্লয় করার সময় **Settings > Environment Variables** এ গিয়ে নিচের কী-গুলো দিন:

```env
STEADFAST_API_KEY="আপনার_স্টেডফাস্ট_এপিআই_কি"
STEADFAST_SECRET_KEY="আপনার_স্টেডফাস্ট_সিক্রেট_কি"
STEADFAST_BASE_URL="https://portal.packzy.com/api/v1"

SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="আপনার_সুপাবেস_সার্ভিস_রোল_কি"
SUPABASE_ANON_KEY="আপনার_সুপাবেস_অ্যানন_কি"

VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="আপনার_সুপাবেস_অ্যানন_কি"

SHOP_ID="bag_store_1"
```
