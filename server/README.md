# POS-Supabase Server

POS-Supabase Server adalah bagian dari proyek POS-Supabase yang dibangun menggunakan teknologi Node.js dan Express.js. Server ini bertugas untuk mengelola data transaksi dan data produk yang terkait dengan toko online.

## Fitur

Fitur-fitur yang dimiliki oleh POS-Supabase Server adalah sebagai berikut:

* Mengelola data transaksi, termasuk data pelanggan, data produk, dan data total transaksi
* Mengelola data produk, termasuk data nama produk, data harga produk, dan data stok produk
* Mengelola data pelanggan, termasuk data nama pelanggan, data alamat pelanggan, dan data nomor telepon pelanggan
* Mengelola data total transaksi, termasuk data total transaksi per hari, data total transaksi per minggu, dan data total transaksi per bulan
* Mengelola data stok produk, termasuk data stok produk per hari, data stok produk per minggu, dan data stok produk per bulan
* Mengelola data laporan, termasuk data laporan per hari, data laporan per minggu, dan data laporan per bulan

## Instalasi

Untuk menginstalasi POS-Supabase Server, Anda dapat mengikuti langkah-langkah berikut:

1. Clone repository ini ke dalam komputer Anda
2. Buka terminal dan jalankan perintah `npm install` untuk menginstalasi dependencies yang dibutuhkan
3. Buat file `.env` dan isi dengan variabel-variabel berikut:
	* `SUPABASE_URL`: URL dari Supabase instance Anda
	* `SUPABASE_KEY`: Key dari Supabase instance Anda
	* `PORT`: Port yang akan digunakan oleh server
4. Jalankan perintah `npm run dev` untuk menjalankan server dalam mode development
5. Buka browser dan akses `http://localhost:5000` untuk melihat halaman awal dari POS-Supabase Server

## Penggunaan

Untuk menggunakan POS-Supabase Server, Anda dapat mengikuti langkah-langkah berikut:

1. Buka browser dan akses `http://localhost:5000`
2. Klik tombol "Login" dan masukkan email dan password Anda
3. Klik tombol "Dashboard" untuk melihat halaman dashboard dari POS-Supabase Server
4. Klik tombol "Transaksi" untuk melihat data transaksi
5. Klik tombol "Produk" untuk melihat data produk
6. Klik tombol "Pelanggan" untuk melihat data pelanggan
7. Klik tombol "Laporan" untuk melihat data laporan

1. Buka browser atau gunakan aplikasi API client (Postman, Insomnia, dsb) dan akses endpoint berikut:
2. `GET /` — Cek status server
3. `POST /login` — Login dengan email dan password
4. `GET /dashboard` — Ambil data dashboard
5. `GET /transaksi` — Ambil data transaksi
6. `GET /produk` — Ambil data produk
7. `GET /pelanggan` — Ambil data pelanggan
8. `GET /laporan` — Ambil data laporan

## Lisensi

POS-Supabase Server berlisensi dibawah MIT License.
