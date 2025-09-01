import React from "react";

const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Selamat Datang di Dashboard POS Sparepart</h1>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Petunjuk Penggunaan Aplikasi</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Login menggunakan akun yang telah diberikan oleh admin.</li>
          <li>Kelola data <b>sparepart</b>, <b>merek</b>, dan <b>kategori barang</b> melalui menu di sidebar.</li>
          <li>Tambah, edit, dan hapus data sparepart sesuai kebutuhan.</li>
          <li>Catat transaksi masuk dan keluar untuk setiap sparepart agar stok dan penjualan otomatis terupdate.</li>
          <li>Gunakan fitur <b>statistik</b> untuk melihat ringkasan penjualan dan stok sparepart.</li>
          <li>Manfaatkan fitur <b>search/filter</b> untuk mencari data dengan cepat.</li>
          <li>Export data transaksi dan sparepart ke format Excel/CSV untuk laporan.</li>
          <li>Perhatikan notifikasi stok rendah agar tidak kehabisan barang penting.</li>
          <li>Hanya admin/owner yang dapat mengelola data master dan melakukan penghapusan data.</li>
        </ul>
        <div className="mt-6 text-gray-600 text-sm">
          Untuk bantuan lebih lanjut, hubungi admin atau lihat dokumentasi aplikasi.
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
