# Kinarya Yukflix Backend (Local MySQL Database)

Backend API untuk **Yukflix** yang menggunakan database lokal MySQL / MariaDB (database: `kinarya-yukflix`), menggantikan ketergantungan pada Supabase Cloud.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MySQL / MariaDB (`mysql2/promise`)
- **Authentication**: JWT & bcryptjs
- **Media Uploads**: Multer (Local storage di `backend/uploads/`)

---

## 🚀 Setup & Menjalankan

### 1. Prasyarat
- Pastikan MySQL lokal (XAMPP / Laragon / MariaDB) aktif pada port `3306`.
- Pastikan konfigurasi database di `backend/.env` sudah sesuai:
  ```env
  PORT=5000
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=kinarya-yukflix
  JWT_SECRET=kinarya-yukflix-secret-key-2026
  ```

### 2. Inisialisasi Database (Migrasi & Seeder)
Jalankan perintah berikut dari folder root:
```bash
npm run backend:init
```
Perintah ini akan secara otomatis:
- Membuat database `kinarya-yukflix` jika belum ada.
- Membuat semua tabel: `admin_users`, `films`, `genres`, `film_genres`, `behind_the_scenes`, `faqs`, `faq_answers`, `themes`, `site_settings`.
- Mengisi data default:
  - **Akun Admin**: `admin@yukflix.com` / `admin123`
  - **Pengaturan Situs**: nama, tagline, footer text
  - **Tema Default**: `YukFlix Default`
  - **Genre Default**: Action, Drama, Komedi, Horor, Romantis, Sci-Fi, Dokumenter

Atau impor langsung file SQL:
`database/schema.mysql.sql` melalui phpMyAdmin / MySQL CLI.

---

### 3. Menjalankan Backend Server
Dari folder root:
```bash
npm run backend:dev
```
Backend akan berjalan di **`http://localhost:5000`**.

---

### 4. Menjalankan Frontend
Di terminal lain dari folder root:
```bash
npm run dev
```
Frontend Vite sudah dikonfigurasi dengan reverse proxy ke `http://localhost:5000` untuk semua rute `/api` dan `/uploads`.

---

## 🔑 Akun Default Admin
- **Email**: `admin@yukflix.com`
- **Password**: `admin123`
- **Login URL**: `http://localhost:5173/admin/login`

---

## 📡 Daftar Endpoint API

### Otentikasi (`/api/auth`)
- `POST /api/auth/login` - Login admin (mengembalikan JWT token & info user)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Ambil profil admin yang sedang login (Protected)

### Film (`/api/films`)
- `GET /api/films` - Ambil semua film (query params: `?featured=true`, `?coming_soon=true`, `?limit=5`)
- `GET /api/films/:id` - Ambil film berdasarkan ID (termasuk genres & BTS)
- `GET /api/films/slug/:slug` - Ambil film berdasarkan slug (termasuk genres & BTS)
- `POST /api/films` - Tambah film baru (Protected)
- `PUT /api/films/:id` - Perbarui film (Protected)
- `DELETE /api/films/:id` - Hapus film (Protected)
- `POST /api/films/bts` - Tambah Behind The Scenes (Protected)
- `DELETE /api/films/bts/:id` - Hapus Behind The Scenes (Protected)

### Genre (`/api/genres`)
- `GET /api/genres` - Ambil semua genre
- `GET /api/genres/:id` - Ambil genre berdasarkan ID
- `POST /api/genres` - Tambah genre (Protected)
- `PUT /api/genres/:id` - Perbarui genre (Protected)
- `DELETE /api/genres/:id` - Hapus genre (Protected)

### FAQ (`/api/faqs`)
- `GET /api/faqs` - Ambil semua FAQ berserta jawabannya
- `GET /api/faqs/:id` - Ambil FAQ berdasarkan ID
- `POST /api/faqs` - Tambah FAQ (Protected)
- `PUT /api/faqs/:id` - Perbarui FAQ (Protected)
- `DELETE /api/faqs/:id` - Hapus FAQ (Protected)
- `POST /api/faqs/answers` - Tambah jawaban FAQ (Protected)
- `PUT /api/faqs/answers/:id` - Perbarui jawaban FAQ (Protected)
- `DELETE /api/faqs/answers/:id` - Hapus jawaban FAQ (Protected)

### Tema (`/api/themes`)
- `GET /api/themes` - Ambil daftar tema
- `POST /api/themes` - Tambah tema (Protected)
- `PUT /api/themes/:id` - Perbarui tema (Protected)
- `POST /api/themes/:id/activate` - Aktifkan tema (Protected)
- `DELETE /api/themes/:id` - Hapus tema (Protected)

### Pengaturan Situs (`/api/settings`)
- `GET /api/settings` - Ambil semua pengaturan situs
- `PUT /api/settings` - Perbarui / upsert pengaturan situs (Protected)

### Media Upload (`/api/upload`)
- `POST /api/upload?folder={posters|backdrops|bts|media}` - Upload file gambar/media lokal (Protected)

### Dashboard Stats (`/api/stats`)
- `GET /api/stats` - Statistik total film, genre, featured, coming soon, dan recent films (Protected)

