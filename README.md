🏥 Jadwal Dokter - RSU Siaga Medika

Aplikasi web modern untuk menampilkan jadwal praktek dokter spesialis di RSU Siaga Medika Purbalingga.

https://img.shields.io/badge/version-1.0.0-blue.svg
https://img.shields.io/badge/license-MIT-green.svg

✨ Fitur

· 📱 Responsif - Optimal di semua device
· 🔄 Real-time - Update otomatis setiap 2 menit
· 🏖️ Tracker Cuti - Info dokter yang cuti
· ⚡ Offline Support - Tetap bisa dipakai tanpa internet
· 🎨 Modern UI - Design glassmorphism yang elegan

🚀 Quick Start

```bash
# Clone repo
# Buka file index.html di browser
# Atau deploy ke hosting favorit
```

📁 Struktur

```
jadwal-dokter/
├── index.html          # File utama
├── README.md          # Dokumentasi
└── (Single file app - no dependencies!)
```

🛠️ Teknologi

· Pure HTML/CSS/JS - No frameworks, lightweight
· Material Icons - Modern icon system
· Google Sheets - Backend data storage
· LocalStorage - Caching system

📊 Status Dokter

Status Keterangan
🟢 BUKA Praktek normal
🟡 PENUH Kuota penuh
🔵 SELESAI Jadwal selesai
🟣 CUTI Sedang cuti
🔴 TIDAK Tidak praktek

🌐 Deployment

GitHub Pages

1. Push ke GitHub repo
2. Settings → Pages → Pilih branch

Netlify

```bash
# Drag & drop folder ke netlify.com
# Atau connect GitHub repo
```

Manual

Upload index.html ke web server manapun.

🔧 Konfigurasi

Edit bagian CONFIG di file JavaScript:

```javascript
const CONFIG = {
  MAIN_SHEET_URL: "your-google-sheets-url",
  REFRESH_INTERVAL: 120000, // 2 menit
  CACHE_DURATION: 600000    // 10 menit
};
```

📞 Support

Found a bug? Open an issue

---


"Melayani dengan Hati, Berkualitas dengan Teknologi"
