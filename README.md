# Survei Kebutuhan Bangkom Deputi I LAN RI

Aplikasi survei dan dashboard admin berbasis **Next.js 16**, React, dan Supabase. Next.js mengekspor situs statis ke GitHub Pages; Supabase menyediakan PostgreSQL, autentikasi admin, dan kebijakan Row Level Security.

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Isi `.env.local` dengan Project URL dan publishable key dari Supabase. Jangan pernah menambahkan secret/service-role key ke aplikasi browser.

## Setup database dan admin

Jalankan `supabase/schema.sql` di Supabase SQL Editor. Buat akun administrator melalui Authentication → Users, dan nonaktifkan pendaftaran publik. Detail setup dan GitHub Pages ada di `SETUP_SUPABASE_GITHUB.md`.

## Halaman

- `/` — kuesioner responden.
- `/admin/` — login admin, ringkasan prioritas, daftar respons, ekspor CSV, dan editor konfigurasi survei.

## Deploy

Static export dibuat ke `out/` dan salin hasilnya ke `docs/`. Konfigurasi GitHub Pages menggunakan branch `main` dengan folder `/docs`. Cara lengkap memperbarui situs ada di `SETUP_SUPABASE_GITHUB.md`.
