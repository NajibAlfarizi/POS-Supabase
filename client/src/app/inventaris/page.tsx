/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, refreshAccessToken } from "@/lib/api/authHelper";
import { getInventaris, exportInventarisCSV, addInventaris, getAuditLogInventaris } from "@/lib/api/inventarisHelper";
import { getKategori } from "@/lib/api/kategoriHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, AlertTriangle, Plus, Download, Pencil, Trash2 } from "lucide-react";
import { getRiwayatStok, stokMasuk, stokKeluar, stokPenyesuaian, getTipeTransaksiStok } from "@/lib/api/stokHelper";

export default function InventarisPage() {
  const router = useRouter();
  // State utama
  const [inventaris, setInventaris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>("none");
  // State form tambah
  const [namaItem, setNamaItem] = useState("");
  const [stokFormItem, setStokFormItem] = useState("");
  const [satuanItem, setSatuanItem] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  // State audit log
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  // State profile
  const [profile, setProfile] = useState<any>(null);
  // State stok
  const [showStokModal, setShowStokModal] = useState(false);
  const [stokAction, setStokAction] = useState<string>("");
  const [stokJumlah, setStokJumlah] = useState("");
  const [stokKeterangan, setStokKeterangan] = useState("");
  const [stokItem, setStokItem] = useState<any>(null);
  const [riwayatStok, setRiwayatStok] = useState<any[]>([]);
  const [loadingRiwayatStok, setLoadingRiwayatStok] = useState(false);
  const [tipeTransaksiStok, setTipeTransaksiStok] = useState<string[]>([]);

  // Ambil tipe transaksi stok
  useEffect(() => {
    let user;
    try {
      user = getProfile();
    } catch {
      return;
    }
    if (!user?.access_token) return;
    (async () => {
      try {
        const tipe = await getTipeTransaksiStok(user.access_token);
        setTipeTransaksiStok(tipe);
      } catch {}
    })();
  }, []);

  // Handler audit log
  const handleShowAuditLog = async () => {
    let user;
    try {
      user = getProfile();
    } catch {
      router.replace("/login");
      return;
    }
    setLoadingAudit(true);
    try {
      const data = await getAuditLogInventaris(user.access_token);
      setAuditLog(data);
      setShowAuditModal(true);
    } catch {
      setError("Gagal mengambil audit log inventaris.");
    }
    setLoadingAudit(false);
  };

  // Handler buka modal stok
  const handleOpenStokModal = async (item: any) => {
    setStokItem(item);
    setShowStokModal(true);
    setStokAction("");
    setStokJumlah("");
    setStokKeterangan("");
    setLoadingRiwayatStok(true);
    let user;
    try {
      user = getProfile();
    } catch {
      setLoadingRiwayatStok(false);
      return;
    }
    try {
      const riwayat = await getRiwayatStok(user.access_token, item.id_inventaris);
      setRiwayatStok(riwayat);
    } catch {
      setRiwayatStok([]);
    }
    setLoadingRiwayatStok(false);
  };

  // Handler submit stok
  const handleSubmitStok = async (e: any) => {
    e.preventDefault();
    let user;
    try {
      user = getProfile();
    } catch {
      router.replace("/login");
      return;
    }
    if (!stokAction || !stokJumlah || isNaN(Number(stokJumlah)) || Number(stokJumlah) < 0) {
      setError("Aksi, jumlah, dan keterangan wajib diisi.");
      return;
    }
    if (!stokItem || typeof stokItem !== "object" || !stokItem.id_inventaris) {
      setError("Item inventaris tidak valid.");
      return;
    }
    try {
      if (stokAction === "masuk") {
        await stokMasuk(user.access_token, { id_inventaris: stokItem.id_inventaris, jumlah: Number(stokJumlah), keterangan: stokKeterangan });
      } else if (stokAction === "keluar") {
        await stokKeluar(user.access_token, { id_inventaris: stokItem.id_inventaris, jumlah: Number(stokJumlah), keterangan: stokKeterangan });
      } else if (stokAction === "penyesuaian") {
        await stokPenyesuaian(user.access_token, { id_inventaris: stokItem.id_inventaris, jumlah: Number(stokJumlah), keterangan: stokKeterangan });
      }
      // Refresh inventaris
      const data = await getInventaris(user.access_token);
      setInventaris(data);
      setShowStokModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Gagal update stok.");
    }
  };

  useEffect(() => {
    // Ambil user dari localStorage
    let user = null;
    try {
      user = getProfile();
      setProfile(user);
    } catch (e) {
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
        const [inventarisData, kategoriData] = await Promise.all([
          getInventaris(token),
          getKategori(token)
        ]);
        setInventaris(inventarisData);
        setKategoriList(kategoriData);
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
              const [inventarisData2, kategoriData2] = await Promise.all([
                getInventaris(refreshed.access_token),
                getKategori(refreshed.access_token)
              ]);
              setInventaris(inventarisData2);
              setKategoriList(kategoriData2);
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
          setError("Gagal mengambil data inventaris atau kategori.");
        }
      }
      setLoading(false);
    })();
  }, [router]);

  // Export CSV
  const handleExportCSV = async () => {
    let user;
    try {
      user = getProfile();
    } catch {
      router.replace("/login");
      return;
    }
    try {
      const blob = await exportInventarisCSV(user.access_token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventaris.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Gagal export CSV");
    }
  };

  // Filter & search
  const filteredInventaris = inventaris.filter(item => {
    const matchSearch = search ? item.nama_item.toLowerCase().includes(search.toLowerCase()) : true;
    const matchKategori = filterKategori && filterKategori !== "all" ? String(item.kategori_id) === filterKategori : true;
    return matchSearch && matchKategori;
  });

  // Badge warna stok
  const getStokBadge = (stok: number) => {
    if (stok === 0) return "bg-red-500 text-white";
    if (stok <= 3) return "bg-yellow-400 text-black";
    return "bg-green-500 text-white";
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header / Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7 text-yellow-500" /> Inventaris
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddModal(true)} variant="default" className="flex items-center gap-2"><Plus className="w-4 h-4" />Tambah Item</Button>
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2"><Download className="w-4 h-4" />Export CSV</Button>
          <Button onClick={handleShowAuditLog} variant="secondary" className="flex items-center gap-2">Audit Log</Button>
        </div>
      {/* Modal Audit Log Inventaris */}
      <Dialog open={showAuditModal} onOpenChange={() => setShowAuditModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Perubahan Inventaris</DialogTitle>
          </DialogHeader>
          {loadingAudit ? (
            <div>Loading...</div>
          ) : auditLog.length === 0 ? (
            <div className="text-gray-500">Belum ada riwayat perubahan inventaris.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-700 dark:text-gray-200">
                    <th className="py-2 px-3 text-left">Waktu</th>
                    <th className="py-2 px-3 text-left">User</th>
                    <th className="py-2 px-3 text-left">Aksi</th>
                    <th className="py-2 px-3 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(log => (
                    <tr key={log.id} className="border-b">
                      <td className="py-2 px-3">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-2 px-3">{log.user_profiles?.name || '-'}</td>
                      <td className="py-2 px-3">{log.action}</td>
                      <td className="py-2 px-3">
                        <pre className="whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">{JSON.stringify(log.detail, null, 2)}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Input placeholder="Cari nama item..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-xs" />
        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger className="min-w-[120px]">Pilih Kategori</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.filter(kat => kat.status === "active").map(kat => (
              <SelectItem key={kat.id_kategori} value={String(kat.id_kategori)}>{kat.nama_kategori}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Daftar Inventaris */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          {/* Tabel Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/20">
              <thead>
                <tr className="text-gray-700 dark:text-gray-200">
                  <th className="py-2 px-3 text-left">Nama Item</th>
                  <th className="py-2 px-3 text-left">Kategori</th>
                  <th className="py-2 px-3 text-left">Stok</th>
                  <th className="py-2 px-3 text-left">Satuan</th>
                  <th className="py-2 px-3 text-left">Harga Beli</th>
                  <th className="py-2 px-3 text-left">Harga Jual</th>
                  <th className="py-2 px-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventaris.map(item => (
                  <tr key={item.id_inventaris} className="border-b border-white/20">
                    <td className="py-2 px-3 font-semibold">
                      {item.nama_item}
                      {item.stok_warning && (
                        <span className="ml-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="inline w-4 h-4" />
                          {item.stok_warning}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">{item.kategori?.nama_kategori || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStokBadge(item.stok)}`}>{item.stok}</span>
                      {item.stok <= 3 && (
                        <span className="ml-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">Stok Rendah</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{item.satuan}</td>
                    <td className="py-2 px-3">Rp{item.harga_beli?.toLocaleString()}</td>
                    <td className="py-2 px-3">Rp{item.harga_jual?.toLocaleString()}</td>
                    <td className="py-2 px-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditItem(item); setShowEditModal(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => { setDeleteItem(item); setShowDeleteModal(true); }}><Trash2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="secondary" onClick={() => handleOpenStokModal(item)}>Lihat & Kelola Stok</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Card List Mobile */}
          <div className="md:hidden grid gap-4">
            {filteredInventaris.map(item => (
              <div key={item.id_inventaris} className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/20 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-lg">
                  {item.nama_item}
                  {item.stok_warning && (
                    <span className="ml-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="inline w-4 h-4" />
                      {item.stok_warning}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold">Kategori:</span> {item.kategori?.nama_kategori || '-'}
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold">Stok:</span> <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStokBadge(item.stok)}`}>{item.stok}</span>
                  {item.stok <= 3 && (
                    <span className="ml-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">Stok Rendah</span>
                  )}
                </div>
                <div className="flex gap-2 text-sm"><span className="font-semibold">Satuan:</span> {item.satuan}</div>
                <div className="flex gap-2 text-sm"><span className="font-semibold">Harga Beli:</span> Rp{item.harga_beli?.toLocaleString()}</div>
                <div className="flex gap-2 text-sm"><span className="font-semibold">Harga Jual:</span> Rp{item.harga_jual?.toLocaleString()}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditItem(item); setShowEditModal(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => { setDeleteItem(item); setShowDeleteModal(true); }}><Trash2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenStokModal(item)}>Lihat & Kelola Stok</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {/* Modal Tambah/Edit Item */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={() => { setShowAddModal(false); setShowEditModal(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showAddModal ? "Tambah Item" : "Edit Item"}</DialogTitle>
          </DialogHeader>
          {/* TODO: Form tambah/edit item inventaris */}

          <form className="grid gap-4 mt-2" onSubmit={async e => {
            e.preventDefault();
            let user;
            try {
              user = getProfile();
            } catch {
              router.replace("/login");
              return;
            }
            if (!namaItem || selectedKategori === "none" || !satuanItem) {
              setError("Nama item, kategori, dan satuan wajib diisi.");
              return;
            }
            if (!stokFormItem || isNaN(Number(stokFormItem)) || Number(stokFormItem) < 0) {
              setError("Stok wajib diisi dan harus berupa angka positif.");
              return;
            }
            try {
              await addInventaris(user.access_token, {
                nama_item: namaItem,
                kategori_id: selectedKategori,
                stok: Number(stokFormItem),
                satuan: satuanItem,
                harga_beli: Number(hargaBeli) || 0,
                harga_jual: Number(hargaJual) || 0
              });
              // Refresh data
              const data = await getInventaris(user.access_token);
              setInventaris(data);
              setShowAddModal(false);
              setSelectedKategori("none");
              setNamaItem("");
              setStokFormItem("");
              setSatuanItem("");
              setHargaBeli("");
              setHargaJual("");
            } catch (err: any) {
              setError(err?.response?.data?.error || "Gagal tambah inventaris.");
            }
          }}>
            <Input placeholder="Nama Item" required value={namaItem} onChange={e => setNamaItem(e.target.value)} />
            <Select required value={selectedKategori} onValueChange={setSelectedKategori}>
              <SelectTrigger>
                {selectedKategori === "none"
                  ? "Pilih Kategori"
                  : kategoriList.find(kat => String(kat.id_kategori) === selectedKategori)?.nama_kategori || "Pilih Kategori"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pilih Kategori</SelectItem>
                {kategoriList.filter(kat => kat.status === "active").map(kat => (
                  <SelectItem key={kat.id_kategori} value={String(kat.id_kategori)}>{kat.nama_kategori}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={0} placeholder="Stok" required value={stokFormItem} onChange={e => setStokFormItem(e.target.value)} />
            <Input placeholder="Satuan" required value={satuanItem} onChange={e => setSatuanItem(e.target.value)} />
            <Input type="number" min={0} placeholder="Harga Beli" value={hargaBeli} onChange={e => setHargaBeli(e.target.value)} />
            <Input type="number" min={0} placeholder="Harga Jual" value={hargaJual} onChange={e => setHargaJual(e.target.value)} />
            <DialogFooter>
              <Button type="submit">{showAddModal ? "Tambah" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Konfirmasi Hapus */}
      <Dialog open={showDeleteModal} onOpenChange={() => setShowDeleteModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div>Yakin ingin menghapus item <span className="font-bold">{deleteItem?.nama_item}</span>? Data tidak akan hilang, hanya dinonaktifkan.</div>
          <DialogFooter>
            <Button variant="destructive">Hapus</Button>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Stok */}
      <Dialog open={showStokModal} onOpenChange={() => setShowStokModal(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manajemen Stok: {stokItem?.nama_item}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3 mb-4" onSubmit={handleSubmitStok}>
            <Select value={stokAction} onValueChange={setStokAction} required>
              <SelectTrigger>Pilih Aksi</SelectTrigger>
              <SelectContent>
                <SelectItem value="masuk">Stok Masuk</SelectItem>
                <SelectItem value="keluar">Stok Keluar</SelectItem>
                <SelectItem value="penyesuaian">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min={0} placeholder="Jumlah" required value={stokJumlah} onChange={e => setStokJumlah(e.target.value)} />
            <Input placeholder="Keterangan" value={stokKeterangan} onChange={e => setStokKeterangan(e.target.value)} />
            <DialogFooter>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
          <div className="mt-2">
            <h3 className="font-semibold mb-2">Riwayat Stok</h3>
            {loadingRiwayatStok ? (
              <div>Loading...</div>
            ) : riwayatStok.length === 0 ? (
              <div className="text-gray-500">Belum ada riwayat stok.</div>
            ) : (
              <div className="overflow-x-auto max-h-64">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-1 px-2 text-left">Tanggal</th>
                      <th className="py-1 px-2 text-left">User</th>
                      <th className="py-1 px-2 text-left">Aksi</th>
                      <th className="py-1 px-2 text-left">Jumlah</th>
                      <th className="py-1 px-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatStok.map((r, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-1 px-2">{new Date(r.tanggal).toLocaleString()}</td>
                        <td className="py-1 px-2">{r.user?.name || '-'}</td>
                        <td className="py-1 px-2">{r.tipe_transaksi}</td>
                        <td className="py-1 px-2">{r.jumlah}</td>
                        <td className="py-1 px-2">{r.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Section Manajemen Stok Inventaris */}
      {filteredInventaris.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Manajemen Stok Inventaris</h2>
          <div className="grid gap-4">
            {filteredInventaris.map(item => (
              <div key={item.id_inventaris} className="flex items-center justify-between bg-white/40 dark:bg-black/40 rounded-xl p-4 shadow">
                <div>
                  <div className="font-semibold text-lg">{item.nama_item}</div>
                  <div className="text-sm text-gray-600">Stok: <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStokBadge(item.stok)}`}>{item.stok}</span>
                    {item.stok <= 3 && (
                      <span className="ml-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">Stok Rendah</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Satuan: {item.satuan}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleOpenStokModal(item)}>Lihat & Kelola Stok</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
