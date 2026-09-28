# Setup survei Next.js, Supabase, dan GitHub Pages

## Supabase

1. Buka proyek di Supabase Dashboard.
2. Buka **SQL Editor → New query**, jalankan seluruh query dari [supabase/schema.sql](supabase/schema.sql). Skrip ini otomatis membuat tabel `users`, `survey_config`, `survey_responses`, RLS, dan memasukkan akun default `admin` dengan password `123456` (bcrypt).
3. Dari **Connect** atau **Settings → API Keys**, salin Project URL dan **publishable key**.
4. Di pengembangan lokal, buat `.env.local` dari `.env.example` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

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

## Menjalankan lokal

```powershell
pnpm install
pnpm dev
```
Kredensial login Admin default:
- **Username:** `admin`
- **Password:** `123456`
