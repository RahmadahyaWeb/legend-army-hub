# 🛡️ Legend Army - Guild Hub

Sistem Manajemen Guild League & Portal Guild resmi untuk **Legend Army**. Dibangun dengan **Next.js (App Router)** dan terintegrasi dengan **Neon Database (Serverless PostgreSQL)** untuk performa cepat, arsitektur modern, dan deployment instan di **Vercel**.

---

## 🚀 Tech Stack

* **Framework**: Next.js 15+ (App Router, Turbopack, Server & Client Components)
* **Database**: Neon Database (Serverless PostgreSQL via `@neondatabase/serverless`)
* **Styling**: Tailwind CSS v4 & Lucide Icons
* **Hosting**: Vercel (Native Next.js Support)
* **Integrations**: Discord Cloudflare Worker webhook untuk broadcast roster pertandingan

---

## ⚙️ Environment Variables Setup

Buat file `.env.local` di root folder proyek:

```bash
# Neon Database Connection String (PostgreSQL)
# Didapatkan dari Neon Console -> Connection Details -> Connection String
DATABASE_URL=postgresql://user:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# (Optional) Admin Credentials
ADMIN_DEFAULT_EMAIL=admin@legendarmy.com
ADMIN_DEFAULT_PASSWORD=adminpassword123
```

---

## 🗄️ Database Auto-Initialization

Schema database otomatis terinisialisasi saat endpoint API pertama kali dipanggil, atau dapat dipicu langsung melalui:
* Akses URL: `/api/db/init` (GET atau POST)

Tabel yang dibuat:
1. `members` — Data anggota guild (nickname, class, level, gear score, status, role).
2. `guild_leagues` — Data pertandingan dan turnamen Guild League.
3. `guild_league_teams` — Konfigurasi tim dan assignment lane (Top, Mid, Bot).
4. `guild_league_rosters` — Slot dan anggota tim per pertandingan.
5. `strategies` — Dokumen strategi dan taktik peta.
6. `attendances` — Presensi dan pencatatan kehadiran member.

---

## 📦 Scripts

* `npm run dev` — Menjalankan development server lokal di `http://localhost:3000`
* `npm run build` — Menjalankan kompilasi produksi Next.js
* `npm run start` — Menjalankan server produksi lokal

---

## 🚢 Panduan Deployment ke Vercel

1. Push repository ke GitHub / GitLab.
2. Di Dashboard **Vercel**:
   * Klik **Add New Project** -> Pilih repository `legend-army-hub`.
   * Framework Preset: **Next.js**.
   * Di bagian **Environment Variables**, tambahkan:
     * `DATABASE_URL`: Connection string PostgreSQL dari Neon Database.
     * `ADMIN_DEFAULT_EMAIL`: (Opsional) Email login admin.
     * `ADMIN_DEFAULT_PASSWORD`: (Opsional) Password login admin.
3. Klik **Deploy**. Selesai! 🎉
