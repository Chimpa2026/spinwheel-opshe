# 🎡 Spin Wheel - Opshe Cosmetics

Web app spin wheel untuk event toko kosmetik, dibuat pakai Python (Flask).

## Cara Menjalankan

1. Install dependency (sekali saja):
   ```
   pip install -r requirements.txt
   ```

2. Jalankan server:
   ```
   python3 app.py
   ```

3. Buka browser:
   - Halaman spin (publik): http://localhost:5000
   - Halaman login admin: http://localhost:5000/login

## Login Admin Default

- **Username:** `admin`
- **Password:** `opshe123`

⚠️ Segera ganti password lewat menu **"Ganti Password"** di dashboard admin setelah login pertama kali, apalagi kalau app ini dipasang di laptop/tablet yang dipakai untuk event dan bisa diakses orang lain.

## Fitur

- **Halaman Spin (publik)** — pengunjung tinggal klik tombol SPIN, roda berputar dengan animasi + suara tik-tik yang melambat, jarum modern bergaya "gem pointer", ada efek suara "thunk" pas berhenti, lalu muncul hasil hadiah + confetti + chime kemenangan.
- **Logo toko** — admin bisa upload logo (PNG/JPG/WEBP/SVG) yang tampil diam di tengah roda (tidak ikut berputar).
- **Login Admin** — halaman khusus admin dengan username & password.
- **Dashboard Admin**:
  - Upload/hapus logo toko & atur handle Instagram
  - Tambah/hapus panel hadiah secara dinamis, **2 sampai 10 panel**
  - Lihat riwayat semua pemenang (waktu + hadiah)
  - Hapus riwayat
  - Ganti password admin

## Struktur File

```
spinwheel/
├── app.py                 # Backend Flask (routing, logic)
├── requirements.txt
├── data/
│   └── store.json         # Data hadiah, brand, admin, riwayat (auto-update)
├── templates/
│   ├── login.html
│   ├── admin.html
│   └── wheel.html
└── static/
    ├── css/style.css
    ├── js/wheel.js         # Gambar roda, animasi spin, efek suara, confetti
    ├── js/admin.js         # Tambah/hapus panel hadiah, preview logo
    └── uploads/            # Logo yang diupload admin tersimpan di sini
```

## Catatan Teknis

- Hasil spin ditentukan **di server** (route `/api/spin`), bukan di browser — jadi tidak bisa dicurangi lewat console browser.
- Data disimpan di file `data/store.json`, jadi tetap ada walau server di-restart. Tidak perlu database.
- Kalau mau pakai di banyak device sekaligus saat event (misalnya tablet buat pengunjung + HP admin buat pantau), jalankan server di satu laptop/PC, lalu device lain akses lewat IP laptop tersebut di jaringan WiFi yang sama, contoh: `http://192.168.1.5:5000`
- Untuk pemakaian jangka panjang / online publik, sebaiknya deploy pakai server production (misal Gunicorn) dan ganti `app.secret_key` di `app.py` dengan string acak yang rahasia.

## Kustomisasi Lanjutan

- Warna tiap panel roda bisa diubah di `static/js/wheel.js` pada array `COLORS`.
- Kalau mau lebih dari 6 hadiah, perlu sedikit ubah `app.py` (loop `range(6)`) dan `admin.html`.

## Deploy ke Railway via GitHub

### 1. Push ke GitHub

```
cd spinwheel
git init
git add .
git commit -m "Spin wheel Opshe"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME/NAMA-REPO` dengan repo GitHub lo (bikin dulu repo kosong di github.com kalau belum ada).

### 2. Connect ke Railway

1. Buka [railway.app](https://railway.app), login (bisa pakai akun GitHub).
2. **New Project → Deploy from GitHub repo** → pilih repo yang tadi di-push.
3. Railway otomatis mendeteksi ini project Python (lewat `requirements.txt` dan `Procfile`) dan langsung build & deploy.

### 3. Set Environment Variable (WAJIB)

Di dashboard Railway → project lo → tab **Variables**, tambahkan:

| Key | Value |
|---|---|
| `SECRET_KEY` | string acak & rahasia, contoh: `openssl rand -hex 32` di terminal |

Tanpa ini, app tetap jalan pakai fallback bawaan yang tidak aman untuk publik.

### 4. Generate domain

Di tab **Settings** project Railway → bagian **Networking** → klik **Generate Domain**. Nanti lo dapet URL publik kayak `namaapp.up.railway.app` yang bisa dibuka semua orang.

### ⚠️ Penting soal penyimpanan data

Railway pakai filesystem yang **tidak permanen** — tiap kali lo redeploy (push commit baru), isi `data/store.json` dan `static/uploads/` (logo yang diupload) bakal **ke-reset ke kondisi awal di repo**, karena filesystem-nya dibuat ulang dari image.

Supaya data hadiah, riwayat, dan logo tetap nempel walau redeploy, ada 2 opsi:
- **Railway Volume** (paling gampang): di tab **Settings** project → **Volumes** → tambah volume, mount ke path `/app/data` (dan `/app/static/uploads` kalau mau logo juga persisten). Ini bikin folder itu jadi penyimpanan permanen yang gak ke-reset.
- **Pindah ke database** (lebih ribet tapi lebih robust): ganti `data/store.json` jadi database beneran (misal PostgreSQL, Railway juga nyediain ini sebagai add-on).

Kalau event-nya cuma sekali jalan dan gak sering redeploy pas event berlangsung, tanpa volume juga sebenarnya aman-aman aja — data cuma ke-reset kalau lo push ulang kode.
