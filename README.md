# Pokédex

Aplikasi Pokédex sederhana berbasis web untuk menjelajahi Pokémon dari generasi 1 sampai 9. Dibuat dengan HTML, CSS, dan JavaScript dasar (tanpa framework atau library), dengan data dari [PokéAPI](https://pokeapi.co/).

## Fitur

- **Daftar Pokémon per generasi:** pilih Gen 1 (Kanto) sampai Gen 9 (Paldea), total 1025 Pokémon.
- **Detail lengkap:** gambar official artwork, tipe berwarna, deskripsi, tinggi, berat, dan 6 stat dasar dalam bentuk bar.
- **Pencarian:** cari berdasarkan nama atau nomor (misalnya `pika` atau `25`).
- **Filter:** saring berdasarkan tipe, atau tampilkan favorit saja.
- **Favorit:** tandai Pokémon dengan ♥. Pilihan tersimpan di browser.
- **Shiny:** ganti gambar ke versi shiny dengan satu klik.
- **Tangisan:** putar suara Pokémon yang dipilih.
- **Rantai evolusi:** lihat tahap evolusi, lalu klik untuk pindah ke Pokémon tersebut (generasi berganti otomatis bila perlu).
- **Dark mode:** ganti tema gelap atau terang. Pilihan tersimpan, dan kunjungan pertama mengikuti tema perangkat.
- **Loading cepat:** data diambil paralel dengan progress bar, lalu disimpan di `localStorage` agar kunjungan berikutnya instan.
- **Penanganan error:** pesan dan tombol "Coba lagi" muncul kalau gagal memuat data.
- **Responsif:** tampilan menyesuaikan layar HP.
- **Navigasi keyboard:** gunakan `↑` / `↓` untuk pindah Pokémon, `Tab` untuk memfokuskan item daftar, dan `Enter` untuk memilihnya.

## Struktur folder

```
pokedex/
├── pokedex.html    # Struktur halaman
├── pokedex.css     # Tampilan, warna tipe, dark mode, responsif
├── pokedex.js      # Pengambilan data dan semua logika
├── pikachuuu.jpg   # Gambar latar (tambahkan sendiri)
└── ss.png          # Tangkapan layar (opsional, untuk README)
```

## Cara menjalankan

1. Unduh atau salin semua file ke satu folder.
2. Pastikan gambar latar `pikachuuu.jpg` ada di folder yang sama dengan `pokedex.html`. Tanpa gambar ini, latar tampil sebagai warna biru gelap.
3. Buka `pokedex.html` di browser.
4. Pastikan terhubung ke internet, karena data, gambar, dan suara diambil dari PokéAPI.

Kalau ingin menjalankan lewat server lokal (opsional):

```bash
# Python
python -m http.server 8000

# lalu buka http://localhost:8000/pokedex.html
```

## Cara pakai

| Aksi | Cara |
| --- | --- |
| Melihat detail Pokémon | Klik nama di daftar kanan |
| Pindah ke Pokémon berikutnya atau sebelumnya | Tombol `↓` / `↑` |
| Mencari | Ketik di kolom pencarian |
| Ganti generasi | Dropdown generasi |
| Menyaring tipe | Dropdown tipe |
| Menyimpan favorit | Tombol **♡ Favorit** |
| Melihat versi shiny | Tombol **✨ Shiny** |
| Mendengar tangisan | Tombol **🔊 Tangisan** |
| Ganti tema | Tombol 🌙 / ☀️ di pojok kanan atas |

## Data yang disimpan di browser

Aplikasi memakai `localStorage` untuk:

| Kunci | Isi |
| --- | --- |
| `pokedex-cache-v2-gen-N` | Data Pokémon untuk generasi ke-N |
| `pokedex-favorites` | Daftar nomor Pokémon favorit |
| `pokedex-theme` | Tema terpilih (`light` atau `dark`) |

Untuk mengosongkan data, hapus data situs di pengaturan browser atau jalankan di konsol:

```js
localStorage.clear();
```

## Kustomisasi

- **Mengganti latar:** ubah nama file di `body { background-image: url('...') }` pada `pokedex.css`.
- **Mengubah warna tema:** warna aksen merah ada di `#ff5350` pada `pokedex.css`. Cari dan ganti nilainya.
- **Mengubah jumlah pemuatan paralel:** ubah `batchSize` di bagian atas `pokedex.js`. Nilai lebih kecil lebih ringan untuk API, nilai lebih besar lebih cepat.
- **Menambah atau mengubah rentang generasi:** edit objek `generations` di `pokedex.js`.

## Catatan

- Pemuatan pertama tiap generasi membutuhkan ratusan permintaan ke API, jadi bisa memakan waktu. Setelah itu data tersimpan.
- Beberapa Pokémon mungkin tidak memiliki suara atau gambar shiny. Tombolnya akan menyesuaikan.
- Aplikasi ini hanya untuk belajar dan penggunaan pribadi.

## Kredit

- Data, gambar, dan suara: [PokéAPI](https://pokeapi.co/) dan repo [PokeAPI/sprites](https://github.com/PokeAPI/sprites).
- Pokémon dan semua nama, gambar, serta karakternya adalah merek dagang dan hak cipta Nintendo, Game Freak, dan The Pokémon Company. Proyek ini tidak berafiliasi dengan mereka.
