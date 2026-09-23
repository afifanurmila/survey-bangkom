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

Workflow GitHub Actions di `.github/workflows/pages.yml` membangun static export Next.js dan mengirim folder `out` ke GitHub Pages. Atur repository variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, serta (opsional) `NEXT_PUBLIC_BASE_PATH`.
