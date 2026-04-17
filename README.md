# 🎓 Alumni Monitor — UMM Tracking System

Sistem monitoring alumni berbasis web untuk Universitas Muhammadiyah Malang.

## ⚙️ Cara Menjalankan

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Jalankan Server
```bash
cd alumni-monitor
python app.py
```

### 3. Buka Browser
```
http://localhost:5000
```

---

## 🗂️ Struktur Proyek

```
alumni-monitor/
├── app.py                  ← Backend Flask (12 langkah pseudocode)
├── requirements.txt
├── data/
│   └── alumni_data.json    ← Data tersimpan otomatis
├── templates/
│   └── index.html          ← SPA Frontend
└── static/
    ├── css/style.css
    └── js/app.js
```

---

## 📌 Fitur Sistem

| Langkah | Fitur | Status |
|---------|-------|--------|
| 1 | Load & Simpan Data Alumni | ✅ |
| 2 | Generate Profil Monitoring | ✅ |
| 3 | Definisi Event Indicators | ✅ |
| 4 | Event Source Mapping (5 kategori) | ✅ |
| 5 | Generate Search Queries | ✅ |
| 6 | Deteksi Event Alumni | ✅ (Simulasi) |
| 7 | Ekstraksi Informasi Event | ✅ |
| 8 | Validasi Event (confidence score) | ✅ |
| 9 | Career Timeline Construction | ✅ |
| 10 | Status Update Alumni | ✅ |
| 11 | Evidence Storage | ✅ |
| 12 | Monitoring Cycle (90 hari) | ✅ |

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/alumni` | Daftar semua alumni |
| POST | `/api/alumni` | Tambah alumni baru |
| GET | `/api/alumni/:id` | Detail alumni |
| PUT | `/api/alumni/:id` | Update alumni |
| DELETE | `/api/alumni/:id` | Hapus alumni |
| POST | `/api/alumni/:id/monitor` | Monitoring satu alumni |
| POST | `/api/monitor/all` | Monitoring semua alumni |
| GET | `/api/stats` | Statistik dashboard |
| POST | `/api/seed` | Isi data contoh |

---

## Link Web Publish

```
https://daily-project-3--alsaputra0912.replit.app
```
