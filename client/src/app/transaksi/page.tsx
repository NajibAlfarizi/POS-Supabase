/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getTransaksi,
  getRingkasanTransaksi,
  exportTransaksiCSV,
  exportTransaksiExcel,
  addTransaksi,
  updateTransaksi,
  deleteTransaksi,
  getDetailTransaksi
} from '@/lib/api/transaksiHelper';
import { apiWithRefresh } from '@/lib/api/authHelper';
import { getAllSparepart } from '@/lib/api/sparepartHelper';

// TODO: import helper untuk sparepart dan user jika diperlukan

const TransaksiPage: React.FC = () => {
  // Faktur dihapus, tidak ada state terkait faktur
  const router = useRouter();
  // State
  const [token, setToken] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [ringkasan, setRingkasan] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showRingkasan, setShowRingkasan] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  // Faktur dihapus, tidak ada state terkait faktur
  // fakturBlobUrl dihapus, hanya preview HTML
  const [filter, setFilter] = useState({
    tipe: '',
    sparepart: '',
    user: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    search: ''
  });
  const [sort, setSort] = useState({ field: 'tanggal', order: 'desc' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  // Fetch sparepart list for dropdown
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  // State untuk export dropdown
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Fetch transaksi list when token, filter, sort, page, or limit changes
  useEffect(() => {
    if (!token) return;
    const fetchTransaksi = async () => {
      try {
        const params = {
          ...filter,
          sort,
          page,
          limit,
        };
        const data = await apiWithRefresh(getTransaksi, token, setToken, setProfile, params);
        setTransaksiList(Array.isArray(data?.data) ? data.data : []);
        setTotal(typeof data?.total === 'number' ? data.total : (Array.isArray(data?.data) ? data.data.length : 0));
      } catch (err) {
        console.error("Gagal fetch transaksi:", err);
        setTransaksiList([]);
        setTotal(0);
      }
    };
    fetchTransaksi();
  }, [token, filter, sort, page, limit]);

  // Ambil token dari localStorage saat komponen mount
  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      setToken(user.access_token);
      setProfile(user);
    } catch {}
  }, []);

  // Fetch sparepart list ketika token tersedia
  useEffect(() => {
    if (!token) return;
    const fetchSparepart = async () => {
      try {
        const data = await apiWithRefresh(
          getAllSparepart,
          token,
          setToken,
          setProfile,
          router
        );
        if (!Array.isArray(data)) {
          console.error('Data sparepart bukan array:', data);
          setSparepartList([]);
        } else {
          setSparepartList(data);
        }
      } catch (err) {
        console.error('Gagal fetch sparepart:', err);
        setSparepartList([]);
      }
    };
    fetchSparepart();
  }, [token]);

  // Fetch ringkasan
  useEffect(() => {
    if (!token) return;
    const fetchRingkasan = async () => {
      try {
        const data = await apiWithRefresh(
          getRingkasanTransaksi,
          token,
          setToken,
          setProfile,
          router
        );
        setRingkasan(data);
      } catch {
        setRingkasan(null);
      }
    };
    fetchRingkasan();
  }, [token]);

  return (
  <div className="max-w-6xl mx-auto py-8 px-2" onClick={() => showExportDropdown && setShowExportDropdown(false)}>
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manajemen Transaksi</h1>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowForm(true)}>
            ➕ Tambah Transaksi
          </button>
          <div className="relative">
            <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold" onClick={e => { e.stopPropagation(); setShowExportDropdown(v => !v); }}>⬇️ Export</button>
            {/* Dropdown Export: CSV, Excel */}
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={async (e) => {
                  e.stopPropagation();
                  setShowExportDropdown(false);
                  try {
                    const blob = await apiWithRefresh(exportTransaksiCSV, token, setToken, () => {}, undefined);
                    const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'text/csv' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'transaksi.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    alert('Gagal export CSV');
                  }
                }}>CSV</button>
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={async (e) => {
                  e.stopPropagation();
                  setShowExportDropdown(false);
                  try {
                    const blob = await apiWithRefresh(exportTransaksiExcel, token, setToken, () => {}, undefined);
                    const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'transaksi.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    alert('Gagal export Excel');
                  }
                }}>Excel</button>
              </div>
            )}
          </div>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowRingkasan(true)}>
            🧾 Ringkasan
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-2 items-end">
        <select className="border px-3 py-2 rounded" value={filter.tipe} onChange={e => setFilter(f => ({ ...f, tipe: e.target.value }))}>
          <option value="">Tipe Transaksi</option>
          <option value="masuk">Masuk</option>
          <option value="keluar">Keluar</option>
        </select>
        {/* TODO: Autocomplete sparepart & user */}
        <input type="text" className="border px-3 py-2 rounded" placeholder="Cari barang..." value={filter.sparepart} onChange={e => setFilter(f => ({ ...f, sparepart: e.target.value }))} />
        <input type="date" className="border px-3 py-2 rounded" value={filter.tanggal_mulai} onChange={e => setFilter(f => ({ ...f, tanggal_mulai: e.target.value }))} />
        <input type="date" className="border px-3 py-2 rounded" value={filter.tanggal_selesai} onChange={e => setFilter(f => ({ ...f, tanggal_selesai: e.target.value }))} />
        <input type="text" className="border px-3 py-2 rounded" placeholder="Cari keterangan/ID..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setPage(1)}>🔍 Terapkan Filter</button>
        <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setFilter({ tipe: '', sparepart: '', user: '', tanggal_mulai: '', tanggal_selesai: '', search: '' })}>❌ Reset</button>
      </div>

      {/* 3. Tabel Data Transaksi */}
      <div className="bg-white rounded shadow p-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2"><input type="checkbox" /></th>
                <th className="px-2 py-2">Tanggal</th>
                <th className="px-2 py-2">Barang</th>
                <th className="px-2 py-2">Jumlah</th>
                <th className="px-2 py-2">Harga Total</th>
                <th className="px-2 py-2">Tipe</th>
                <th className="px-2 py-2">Keterangan</th>
                <th className="px-2 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(transaksiList) && transaksiList.length > 0 ? (
                transaksiList.map((trx, idx) => (
                  <tr key={trx.id_transaksi} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2"><input type="checkbox" /></td>
                    <td className="px-2 py-2">{trx.tanggal ? trx.tanggal.slice(0, 10) : '-'}</td>
                    <td className="px-2 py-2">{trx.sparepart?.nama_barang || '-'}</td>
                    <td className="px-2 py-2">{trx.jumlah}</td>
                    <td className="px-2 py-2">Rp{trx.harga_total}</td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trx.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trx.tipe}</span>
                    </td>
                    <td className="px-2 py-2">{trx.keterangan}</td>
                    <td className="px-2 py-2 flex gap-1">
                      <button className="text-blue-600" title="Lihat" onClick={() => { setSelectedTransaksi(trx); setShowDetail(true); }}>👁</button>
                      <button className="text-yellow-600" title="Edit" onClick={() => { setSelectedTransaksi(trx); setShowForm(true); }}>✏️</button>
                      <button className="text-red-600" title="Hapus" onClick={() => apiWithRefresh((tok) => deleteTransaksi(tok, trx.id_transaksi), token, setToken, () => {}, router)}>🗑</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">Menampilkan 0 data transaksi</td>
                </tr>
              )}
            </tbody>
          </table>
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span>Menampilkan {transaksiList.length} dari {total} transaksi</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
            <span>Halaman {page}</span>
            <button className="px-3 py-1 rounded border" disabled={transaksiList.length < limit} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
            <select className="border px-2 py-1 rounded" value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
      {/* 4. Detail Transaksi Modal/Drawer */}
      {showDetail && selectedTransaksi && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">👁</span>
              <h2 className="text-2xl font-bold">Detail Transaksi</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="mb-1">ID: <span className="font-bold">{selectedTransaksi.id_transaksi}</span></div>
                <div className="mb-1">Barang: <span className="font-bold">{selectedTransaksi.sparepart?.nama_barang || '-'}</span></div>
                <div className="mb-1">Jumlah: <span className="font-bold">{selectedTransaksi.jumlah}</span></div>
                <div className="mb-1">Harga Total: <span className="font-bold">Rp{selectedTransaksi.harga_total}</span></div>
              </div>
              <div>
                <div className="mb-1">Tanggal: <span className="font-bold">{selectedTransaksi.tanggal}</span></div>
                <div className="mb-1">User: <span className="font-bold">{selectedTransaksi.user_profiles?.name || '-'}</span></div>
                <div className="mb-1">Tipe: <span className={`font-bold px-2 py-1 rounded ${selectedTransaksi.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedTransaksi.tipe}</span></div>
                <div className="mb-1">Keterangan: <span className="font-bold">{selectedTransaksi.keterangan}</span></div>
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold" onClick={() => { setShowDetail(false); setShowForm(true); }}>✏️ Edit</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold" onClick={() => { apiWithRefresh((tok) => deleteTransaksi(tok, selectedTransaksi.id_transaksi), token, setToken, () => {}, undefined); setShowDetail(false); }}>🗑 Hapus</button>
              <button className="px-4 py-2 rounded-lg border font-semibold hover:bg-gray-100" onClick={() => setShowDetail(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Form Tambah/Edit Transaksi */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-lg p-8" onSubmit={async e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const id_sparepart = (form.id_sparepart as any)?.value || "";
            const jumlah = Number((form.jumlah as any)?.value) || 0;
            const tipe = (form.tipe as any)?.value || "";
            const keterangan = (form.keterangan as any)?.value || "";
            // Cari harga satuan dari sparepartList
            const sparepart = sparepartList.find(sp => sp.id_sparepart === id_sparepart);
            let harga_satuan = 0;
            if (tipe === 'keluar') {
              harga_satuan = sparepart?.harga_modal || 0;
            } else {
              harga_satuan = sparepart?.harga_jual || 0;
            }
            const harga_total = harga_satuan * jumlah;
            const payload = {
              id_sparepart,
              jumlah,
              harga_total,
              tipe,
              keterangan,
            };
            let trxRes;
            if (selectedTransaksi) {
              trxRes = await apiWithRefresh((tok) => updateTransaksi(tok, selectedTransaksi.id_transaksi, payload), token, setToken, setProfile, router);
            } else {
              trxRes = await apiWithRefresh((tok) => addTransaksi(tok, payload), token, setToken, setProfile, router);
            }
            // Fetch ulang data transaksi setelah submit
            try {
              const params = {
                ...filter,
                sort,
                page,
                limit,
              };
              const data = await apiWithRefresh(getTransaksi, token, setToken, setProfile, params);
              setTransaksiList(Array.isArray(data?.data) ? data.data : []);
            } catch (err) {
              console.error("Gagal fetch transaksi setelah submit:", err);
            }
            setShowForm(false);
            setSelectedTransaksi(null);
            // Tampilkan faktur jika tambah transaksi (bukan edit)
            if (!selectedTransaksi && trxRes && trxRes.id_transaksi) {
              // Tidak ada logic faktur
            }
          }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">{selectedTransaksi ? '✏️' : '➕'}</span>
              <h2 className="text-2xl font-bold">{selectedTransaksi ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative w-full col-span-2">
                <select
                  name="id_sparepart"
                  className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full"
                  defaultValue={selectedTransaksi?.id_sparepart || ''}
                  required
                >
                  <option value="">Pilih Barang...</option>
                  {sparepartList.map(sp => (
                    <option key={sp.id_sparepart} value={sp.id_sparepart}>
                      {sp.nama_barang}
                    </option>
                  ))}
                </select>
              </div>
              <input name="jumlah" type="number" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Jumlah" defaultValue={selectedTransaksi?.jumlah || ''} required />
              <select name="tipe" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" defaultValue={selectedTransaksi?.tipe || ''} required>
                <option value="">Tipe Transaksi</option>
                <option value="masuk">Masuk</option>
                <option value="keluar">Keluar</option>
              </select>
              <input name="keterangan" type="text" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Keterangan" defaultValue={selectedTransaksi?.keterangan || ''} />
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <button type="button" className="px-6 py-2 rounded-lg border font-semibold hover:bg-gray-100" onClick={() => { setShowForm(false); setSelectedTransaksi(null); }}>Batal</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Ringkasan Transaksi Modal/Drawer */}
      {showRingkasan && ringkasan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-yellow-300 w-full max-w-md p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🧾</span>
              <h2 className="text-2xl font-bold">Ringkasan Transaksi</h2>
            </div>
            <div className="space-y-4 mb-4">
              <div className="bg-blue-50 rounded p-4 flex flex-col items-center">
                <div className="text-sm text-gray-500">Total Transaksi</div>
                <div className="text-2xl font-bold">Rp{ringkasan.total_transaksi}</div>
              </div>
              <div className="bg-green-50 rounded p-4 flex flex-col items-center">
                <div className="text-sm text-gray-500">Cashflow</div>
                <div className="text-2xl font-bold">Rp{ringkasan.cashflow}</div>
              </div>
              <div className="bg-green-100 rounded p-2 flex justify-between">
                <span className="font-bold">🔼 Total Masuk</span>
                <span>Rp{ringkasan.total_masuk}</span>
              </div>
              <div className="bg-red-100 rounded p-2 flex justify-between">
                <span className="font-bold">🔽 Total Keluar</span>
                <span>Rp{ringkasan.total_keluar}</span>
              </div>
            </div>
            {/* TODO: grafik kecil opsional */}
            <div className="flex justify-end mt-6">
              <button className="px-6 py-2 rounded-lg border font-semibold hover:bg-gray-100" onClick={() => setShowRingkasan(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransaksiPage;
