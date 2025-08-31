/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, refreshAccessToken } from "@/lib/api/authHelper";
import { getInventaris } from "@/lib/api/inventarisHelper";
import { getRiwayatStok } from "@/lib/api/stokHelper";
import { BarChart, Package, ShoppingCart, FileText, AlertTriangle, PieChart, LineChart } from "lucide-react";


export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name?: string; email?: string; role?: string; access_token?: string; refresh_token?: string } | null>(null);
  const [inventaris, setInventaris] = useState<Array<any>>([]);
  const [riwayatStokDashboard, setRiwayatStokDashboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Ambil user dari localStorage
    let user = null;
    try {
      user = getProfile();
      setProfile(user);
    } catch (e) {
      // Debug: log error jika gagal getProfile
      console.error("getProfile error", e);
      router.replace("/login");
      return;
    }

    // Pastikan access_token dan refresh_token ada dan bertipe string
    if (!user || typeof user.access_token !== "string" || typeof user.refresh_token !== "string" || !user.access_token || !user.refresh_token) {
      console.error("Token missing or invalid", user);
      router.replace("/login");
      return;
    }

    // Fetch inventaris
    (async () => {
      setLoading(true);
  const token = user.access_token;
      try {
        const data = await getInventaris(token);
        setInventaris(data);
      } catch (err: any) {
        // Jika token expired/401, coba refresh token
        if (err?.response?.status === 401 && user?.refresh_token) {
          try {
            const refreshed = await refreshAccessToken(user.refresh_token);
            if (refreshed?.access_token) {
              // Update localStorage user
              const newUser = { ...user, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token };
              localStorage.setItem("user", JSON.stringify(newUser));
              setProfile(newUser);
              // Retry fetch inventaris dengan token baru
              const data2 = await getInventaris(refreshed.access_token);
              setInventaris(data2);
              setLoading(false);
              return;
            } else {
              localStorage.clear();
              router.replace("/login");
              return;
            }
          } catch {
            localStorage.clear();
            router.replace("/login");
            return;
          }
        } else {
          // handle error lain, optionally show toast
        }
      }
      setLoading(false);
    })();
  }, [router]);


  // Fetch riwayat stok terbaru untuk dashboard
  useEffect(() => {
    // Ambil riwayat stok dari semua inventaris, gabungkan, dan urutkan
    (async () => {
      if (!profile?.access_token || !inventaris.length) return;
      try {
        const allRiwayat: any[] = [];
        for (const item of inventaris) {
          const riwayat = await getRiwayatStok(profile.access_token, item.id_inventaris);
          if (Array.isArray(riwayat)) allRiwayat.push(...riwayat);
        }
        // Urutkan berdasarkan tanggal terbaru
        allRiwayat.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        setRiwayatStokDashboard(allRiwayat.slice(0, 10)); // Tampilkan 10 terbaru
      } catch {
        setRiwayatStokDashboard([]);
      }
    })();
  }, [inventaris]);


  // Dashboard summary from inventaris
  const jumlahInventaris = inventaris.length;
  const barangHampirHabis = inventaris.filter(item => item.stok_warning).length;
  const stokWarnings = inventaris.filter(item => item.stok_warning).map(item => item.stok_warning);

  // Helper untuk summary stok masuk/keluar
  const totalStokMasuk = riwayatStokDashboard.filter(r => r.tipe_transaksi === "masuk").reduce((sum, r) => sum + (r.jumlah || 0), 0);
  const totalStokKeluar = riwayatStokDashboard.filter(r => r.tipe_transaksi === "keluar").reduce((sum, r) => sum + (r.jumlah || 0), 0);

  return (
    <div className="flex flex-col gap-6 items-center min-h-svh p-4 md:p-8">
      <header className="w-full max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </header>
      {/* Notifikasi & Insight */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {barangHampirHabis > 0 && (
          <div className="bg-red-100/60 border border-red-300 rounded-xl shadow p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <span className="font-bold text-red-700">{barangHampirHabis} barang hampir habis!</span>
              <div className="text-xs text-red-600">{stokWarnings.join("; ")}</div>
            </div>
          </div>
        )}
        <div className="bg-yellow-100/60 border border-yellow-300 rounded-xl shadow p-4 flex items-center gap-3">
          <FileText className="w-6 h-6 text-yellow-700" />
          <div>
            <span className="font-bold text-yellow-700">Reminder ekspor laporan bulanan</span>
            <div className="text-xs text-yellow-700">Jangan lupa ekspor laporan keuangan sebelum akhir bulan.</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Penjualan Hari Ini: placeholder, replace with real data if available */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-2 border border-white/40 dark:border-white/20">
          <span className="text-2xl font-bold text-green-700">-</span>
          <span className="text-xs text-gray-700 dark:text-gray-200">Penjualan Hari Ini</span>
          <ShoppingCart className="w-7 h-7 text-yellow-500" />
        </div>
        {/* Jumlah Inventaris */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-2 border border-white/40 dark:border-white/20">
          <span className="text-2xl font-bold text-blue-700">{jumlahInventaris}</span>
          <span className="text-xs text-gray-700 dark:text-gray-200">Inventaris</span>
          <Package className="w-7 h-7 text-yellow-500" />
        </div>
        {/* Jumlah Kategori: placeholder, replace with real data if available */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-2 border border-white/40 dark:border-white/20">
          <span className="text-2xl font-bold text-purple-700">-</span>
          <span className="text-xs text-gray-700 dark:text-gray-200">Kategori</span>
          <BarChart className="w-7 h-7 text-yellow-500" />
        </div>
        {/* Stok Masuk / Keluar: tampilkan summary */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-2 border border-white/40 dark:border-white/20">
          <span className="text-2xl font-bold text-orange-700">{totalStokMasuk} / {totalStokKeluar}</span>
          <span className="text-xs text-gray-700 dark:text-gray-200">Stok Masuk / Keluar</span>
          <Package className="w-7 h-7 text-yellow-500" />
        </div>
      </div>

      {/* Grafik / Visualisasi Data */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="w-6 h-6 text-yellow-500" />
            <span className="font-bold">Tren Penjualan</span>
          </div>
          <div className="h-32 flex items-center justify-center text-gray-400">[Line Chart Placeholder]</div>
        </div>
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-6 h-6 text-yellow-500" />
            <span className="font-bold">Proporsi Kategori</span>
          </div>
          <div className="h-32 flex items-center justify-center text-gray-400">[Pie Chart Placeholder]</div>
        </div>
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-6 h-6 text-yellow-500" />
            <span className="font-bold">Top Produk Terlaris</span>
          </div>
          <div className="h-32 flex items-center justify-center text-gray-400">[Bar Chart Placeholder]</div>
        </div>
      </div>

      {/* Tabel Ringkasan / Activity Feed */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20">
          <div className="font-bold mb-2 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-yellow-500" /> Transaksi Terbaru</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-700 dark:text-gray-200">
                  <th className="py-1 px-2 text-left">ID</th>
                  <th className="py-1 px-2 text-left">Produk</th>
                  <th className="py-1 px-2 text-left">Total</th>
                  <th className="py-1 px-2 text-left">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {/* TODO: Integrasi data transaksi terbaru dari API */}
                <tr>
                  <td className="py-1 px-2" colSpan={4}>Belum ada data transaksi.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20">
          <div className="font-bold mb-2 flex items-center gap-2"><Package className="w-5 h-5 text-yellow-500" /> Riwayat Stok Terbaru</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-700 dark:text-gray-200">
                  <th className="py-1 px-2 text-left">No</th>
                  <th className="py-1 px-2 text-left">Tipe</th>
                  <th className="py-1 px-2 text-left">Produk</th>
                  <th className="py-1 px-2 text-left">Jumlah</th>
                  <th className="py-1 px-2 text-left">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {riwayatStokDashboard.length === 0 ? (
                  <tr>
                    <td className="py-1 px-2" colSpan={5}>Belum ada data riwayat stok.</td>
                  </tr>
                ) : (
                  riwayatStokDashboard.slice(0, 6).map((r, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-2">{idx + 1}</td>
                      <td className="py-1 px-2">{r.tipe_transaksi}</td>
                      <td className="py-1 px-2">{r.inventaris?.nama_item || '-'}</td>
                      <td className="py-1 px-2">{r.jumlah}</td>
                      <td className="py-1 px-2">{new Date(r.tanggal).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {riwayatStokDashboard.length > 6 && (
              <div className="flex justify-end mt-2">
                <a href="/inventaris" className="text-sm text-blue-600 hover:underline font-semibold">Lihat Riwayat Stok &rarr;</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Kategori (opsional) */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 dark:border-white/20 mt-4">
          <div className="font-bold mb-2 flex items-center gap-2"><BarChart className="w-5 h-5 text-yellow-500" /> Audit Log Kategori</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-700 dark:text-gray-200">
                  <th className="py-1 px-2 text-left">ID</th>
                  <th className="py-1 px-2 text-left">Aksi</th>
                  <th className="py-1 px-2 text-left">Kategori</th>
                  <th className="py-1 px-2 text-left">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {/* TODO: Integrasi audit log kategori dari API */}
                <tr>
                  <td className="py-1 px-2" colSpan={4}>Belum ada data audit kategori.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}