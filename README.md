# Yukflix Monorepo

Struktur proyek Yukflix telah dipisahkan menjadi:
- **`app/`**: Frontend web aplikasi berbasis Vue 3, Vite, Tailwind CSS, dan Pinia.
- **`backend/`**: Backend REST API berbasis Express.js, MySQL/MariaDB (`kinarya-yukflix`), JWT auth, dan upload media lokal.
- **`database/`**: Skema database SQL (`schema.mysql.sql` untuk MySQL dan `schema.sql` untuk Supabase).

---

## 🚀 Panduan Menjalankan

### 1. Backend Server
Buka terminal dan masuk ke folder `backend`:
```bash
cd backend
npm install
npm run dev
```
*(Backend berjalan di `http://localhost:5000`)*

Untuk inisialisasi / migrasi database lokal:
```bash
npm run init-db
# atau migrasi data dari supabase:
npm run migrate:supabase
```

### 2. Frontend App
Buka terminal lain dan masuk ke folder `app`:
```bash
cd app
npm install
npm run dev
```
*(Frontend berjalan di `http://localhost:5173`)*

---

## ⚡ Shortcuts dari Root Folder
Anda juga dapat menjalankan perintah langsung dari root folder `yukflix`:
- `npm run dev:app` : Menjalankan frontend dev server
- `npm run build:app` : Build frontend untuk production
- `npm run dev:backend` : Menjalankan backend server
- `npm run init:backend` : Inisialisasi skema tabel MySQL
- `npm run migrate:supabase` : Migrasi data & aset dari Supabase ke MySQL
