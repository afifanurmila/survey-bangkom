# Setup survei Next.js, Supabase, dan GitHub Pages

## Supabase

1. Buat proyek di Supabase Dashboard.
2. Buka **SQL Editor → New query**, jalankan seluruh [supabase/schema.sql](supabase/schema.sql).
3. Dari **Connect** atau **Settings → API Keys**, salin Project URL dan **publishable key**.
4. Di pengembangan lokal, buat `.env.local` dari `.env.example` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan masukkan secret/service-role key atau password database ke aplikasi browser.
5. Di **Authentication → Users → Add user**, buat pengguna admin. Matikan pendaftaran publik (signups) supaya pengunjung tidak dapat mendaftar sebagai administrator.

Project URL dan publishable key ditanamkan ke JavaScript publik ketika Next.js dibangun. Itu memang key untuk aplikasi browser; perlindungan data dilakukan melalui RLS di skema SQL. Pengunjung dapat mengirim survei, sementara data respons hanya bisa dibaca pengguna terautentikasi.

## Deploy ke repository `afifanurmila/survey-bangkom`

1. Pastikan source Next.js sudah berada di branch default `main`. Jangan push `.env.local`.
2. Di lokal, build dengan environment Supabase yang telah diisi:
   ```powershell
   $env:NEXT_PUBLIC_BASE_PATH='/survey-bangkom'
   pnpm build
   ```
3. Salin seluruh isi `out/` ke folder `docs/` di root repository. Pastikan file kosong `docs/.nojekyll` ada agar aset `_next` diterbitkan oleh GitHub Pages. Commit dan push perubahan `docs/`.
4. Repository → **Settings → Pages → Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/docs`, kemudian Save.
5. Situs tersedia di `https://afifanurmila.github.io/survey-bangkom/`; admin ada di `https://afifanurmila.github.io/survey-bangkom/admin/`.
6. Untuk domain khusus, ubah `NEXT_PUBLIC_BASE_PATH` menjadi string kosong sebelum build ulang, atur DNS sesuai instruksi Pages, lalu perbarui `docs/`.

Next.js menghasilkan static export ke folder `out`; folder `docs/` menyajikan hasil tersebut. Supabase mengelola database dan autentikasi. Static export cocok untuk pola client-side aplikasi ini; fitur yang memerlukan server Next.js tidak digunakan. [Panduan static export Next.js](https://nextjs.org/docs/app/guides/static-exports), [GitHub Pages source branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Menjalankan lokal

```powershell
pnpm install
pnpm dev
```

Untuk menguji build produksi lokal gunakan `pnpm build`. Analisis prioritas di admin memakai rata-rata kebutuhan dan gap positif sebagai ringkasan deskriptif. Ekspor CSV memuat jawaban lengkap dan perlu dijaga sebagai data internal.
