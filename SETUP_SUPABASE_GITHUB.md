# Setup survei Next.js, Supabase, dan GitHub Pages

## Supabase

1. Buat proyek di Supabase Dashboard.
2. Buka **SQL Editor → New query**, jalankan seluruh [supabase/schema.sql](supabase/schema.sql).
3. Dari **Connect** atau **Settings → API Keys**, salin Project URL dan **publishable key**.
4. Di pengembangan lokal, buat `.env.local` dari `.env.example` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan masukkan secret/service-role key atau password database ke aplikasi browser.
5. Di **Authentication → Users → Add user**, buat pengguna admin. Matikan pendaftaran publik (signups) supaya pengunjung tidak dapat mendaftar sebagai administrator.

Project URL dan publishable key ditanamkan ke JavaScript publik ketika Next.js dibangun. Itu memang key untuk aplikasi browser; perlindungan data dilakukan melalui RLS di skema SQL. Pengunjung dapat mengirim survei, sementara data respons hanya bisa dibaca pengguna terautentikasi.

## Deploy ke repository `afifanurmila/survey-bangkom`

1. Push seluruh source Next.js ke branch default `main`, termasuk folder `app/`, `lib/`, `supabase/`, `package.json`, `pnpm-lock.yaml`, `next.config.mjs`, `.github/workflows/pages.yml`, dan `.env.example`. Jangan push `.env.local`.
2. Repository → **Settings → Secrets and variables → Actions → Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key
   - (opsional) `NEXT_PUBLIC_BASE_PATH` = `/survey-bangkom` (nilai workflow bawaan sudah ini)
3. Repository → **Settings → Pages → Build and deployment**, pilih **GitHub Actions** sebagai source.
4. Buka tab **Actions**, pantau workflow *Deploy survey to GitHub Pages*. Setelah sukses, halaman survei berada di `https://afifanurmila.github.io/survey-bangkom/`; admin di `https://afifanurmila.github.io/survey-bangkom/admin/`.
5. Tambahkan domain khusus di Pages settings bila dibutuhkan. Untuk domain khusus, ubah variable `NEXT_PUBLIC_BASE_PATH` menjadi string kosong, lalu jalankan ulang deployment. Pengaturan DNS dilakukan melalui penyedia domain.

Workflow Next.js menghasilkan folder `out` dengan static export. GitHub Pages menyajikan hasil build itu, sedangkan Supabase mengelola database dan autentikasi. Static export cocok untuk pola client-side yang digunakan aplikasi ini; fitur yang memerlukan server Next.js tidak digunakan. [Panduan static export Next.js](https://nextjs.org/docs/app/guides/static-exports), [GitHub Pages dengan Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Menjalankan lokal

```powershell
pnpm install
pnpm dev
```

Untuk menguji build produksi lokal gunakan `pnpm build`. Analisis prioritas di admin memakai rata-rata kebutuhan dan gap positif sebagai ringkasan deskriptif. Ekspor CSV memuat jawaban lengkap dan perlu dijaga sebagai data internal.
