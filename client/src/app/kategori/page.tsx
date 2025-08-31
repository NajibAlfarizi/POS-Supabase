/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import {
  getProfile,
  refreshAccessToken,
} from "@/lib/api/authHelper";
import {
  getKategori,
  addKategori,
  updateKategori,
  getAuditLogKategori,
  activateKategori,
  getKategoriStatistik,
} from "@/lib/api/kategoriHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BarChart, Plus, Pencil, Trash2 } from "lucide-react";

export default function KategoriPage() {
  // Statistik State
  const [statistik, setStatistik] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMinTransaksi, setFilterMinTransaksi] = useState<number | ''>('');
  // Fetch statistik kategori
  const fetchStatistik = async (token: string) => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterMinTransaksi !== '') params.minTransaksi = filterMinTransaksi;
    const data = await getKategoriStatistik(token, params);
    setStatistik(data);
  };
  // ===== STATE =====
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<Kategori | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Kategori | null>(null);
  const [namaKategori, setNamaKategori] = useState("");
  const [statusKategori, setStatusKategori] =
    useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [auditLog, setAuditLog] = useState<AuditLogKategori[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // ===== TYPES =====
  type Kategori = {
    id_kategori: number;
    nama_kategori: string;
    status: "active" | "inactive";
  };
  type AuditLogKategori = {
    id: number;
    action: string;
    user_profiles?: { name: string };
    created_at: string;
    detail: any;
    before?: any;
    after?: any;
  };

  // ===== FETCH INITIAL DATA =====
  useEffect(() => {
    const init = async () => {
      try {
        const user = getProfile();
        if (!user || !user.access_token || !user.refresh_token) {
          router.replace("/login");
          return;
        }
        setProfile(user);
        await refreshKategori(user.access_token);
        await fetchStatistik(user.access_token);
      } catch (e) {
        console.error("Auth error", e);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line
  }, [router, filterStatus, filterMinTransaksi]);
  // UI: Statistik dan Filter
  const StatistikKategori = () => (
    <div className="mb-6 bg-white/60 dark:bg-black/40 rounded-xl shadow p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="font-bold text-lg flex items-center gap-2">
          <BarChart className="w-6 h-6 text-blue-500" /> Statistik Kategori
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-blue-300 px-2 py-1"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="number"
            min={0}
            value={filterMinTransaksi}
            onChange={e => setFilterMinTransaksi(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Min. Total Transaksi"
            className="rounded-lg border border-blue-300 px-2 py-1 w-40"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Nama Kategori</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Jumlah Transaksi</th>
              <th className="py-2 px-4 text-left">Total Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {statistik.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">Tidak ada data statistik.</td></tr>
            ) : statistik.map(s => (
              <tr key={s.id_kategori}>
                <td className="py-2 px-4 font-semibold">{s.nama_kategori}</td>
                <td className="py-2 px-4">{s.status}</td>
                <td className="py-2 px-4">{s.jumlah_transaksi ?? '-'}</td>
                <td className="py-2 px-4">Rp {s.total_transaksi.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===== HELPERS =====
  const refreshKategori = async (token?: string) => {
    try {
      const user = getProfile();
      const accessToken = token || user?.access_token;
      if (!accessToken) {
        router.replace("/login");
        return;
      }
      const data = await getKategori(accessToken);
      const log = await getAuditLogKategori(accessToken);
      setKategori(data);
      setAuditLog(log);
    } catch {
      setError("Gagal mengambil data kategori.");
    }
  };

  const handleTokenError = async (
    callback: (token: string) => Promise<void>
  ) => {
    try {
      const user = getProfile();
      const refreshed = await refreshAccessToken(
        user.refresh_token
      );
      if (refreshed?.access_token) {
        const newUser = {
          ...user,
          ...refreshed,
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        setProfile(newUser);
        await callback(refreshed.access_token);
      } else {
        localStorage.clear();
        router.replace("/login");
      }
    } catch {
      localStorage.clear();
      router.replace("/login");
    }
  };

  // ===== ACTIONS =====
  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getProfile();
    if (!namaKategori.trim()) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }
    if (
      kategori.some(
        (k) =>
          k.nama_kategori.toLowerCase() ===
          namaKategori.trim().toLowerCase()
      )
    ) {
      setError("Nama kategori sudah ada.");
      return;
    }
    try {
      await addKategori(user.access_token, {
        nama_kategori: namaKategori,
        status: statusKategori,
      });
      setShowAddModal(false);
      setNamaKategori("");
      setStatusKategori("active");
      setError("");
      await refreshKategori();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return handleTokenError((t) =>
          addKategori(t, {
            nama_kategori: namaKategori,
            status: statusKategori,
          }).then(() => refreshKategori(t))
        );
      }
      setError(
        err?.response?.data?.error || "Gagal tambah kategori."
      );
    }
  };

  const handleEditKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getProfile();
    if (!namaKategori.trim()) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }
    if (
      kategori.some(
        (k) =>
          k.nama_kategori.toLowerCase() ===
            namaKategori.trim().toLowerCase() &&
          k.id_kategori !== editItem?.id_kategori
      )
    ) {
      setError("Nama kategori sudah ada.");
      return;
    }
    try {
      await updateKategori(user.access_token, editItem!.id_kategori.toString(), {
        nama_kategori: namaKategori,
        status: statusKategori,
      });
      setShowEditModal(false);
      setEditItem(null);
      setNamaKategori("");
      setStatusKategori("active");
      setError("");
      await refreshKategori();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return handleTokenError((t) =>
          updateKategori(t, editItem!.id_kategori.toString(), {
            nama_kategori: namaKategori,
            status: statusKategori,
          }).then(() => refreshKategori(t))
        );
      }
      setError(
        err?.response?.data?.error || "Gagal edit kategori."
      );
    }
  };

  const handleNonaktifKategori = async () => {
    const user = getProfile();
    try {
      await updateKategori(user.access_token, deleteItem!.id_kategori.toString(), {
        status: "inactive",
      });
      setShowDeleteModal(false);
      setDeleteItem(null);
      setError("");
      await refreshKategori();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return handleTokenError((t) =>
          updateKategori(t, deleteItem!.id_kategori.toString(), {
            status: "inactive",
          }).then(() => refreshKategori(t))
        );
      }
      setError(
        err?.response?.data?.error ||
          "Gagal nonaktifkan kategori."
      );
    }
  };

  const handleAktifkanKategori = async (item: Kategori) => {
    const user = getProfile();
    try {
      await activateKategori(user.access_token, item.id_kategori.toString());
      setError("");
      await refreshKategori();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return handleTokenError((t) =>
          activateKategori(t, item.id_kategori.toString()).then(() =>
            refreshKategori(t)
          )
        );
      }
      setError(
        err?.response?.data?.error ||
          "Gagal aktifkan kategori."
      );
    }
  };

  // ===== FILTERING =====
  const filteredKategori = kategori.filter((k) =>
    k.nama_kategori.toLowerCase().includes(search.toLowerCase())
  );

  // ===== RENDER =====
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
  {/* Header */}
  <StatistikKategori />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white drop-shadow-lg">
          <BarChart className="w-6 h-6 text-blue-500" />
          Kategori
        </h1>
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg bg-black text-white hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            Tambah
          </Button>
          <Button
            onClick={() => setShowAuditLog(true)}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 rounded-xl shadow border border-blue-400 text-blue-700 hover:bg-blue-100"
          >
            <BarChart className="w-5 h-5 text-blue-500" />
            Audit Log
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl shadow bg-white/60 border border-blue-200 px-4 py-2"
        />
      </div>

      {/* Main */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : isMobile ? (
        // Mobile cards
        <div className="grid gap-4">
          {filteredKategori.map((item) => (
            <div
              key={item.id_kategori}
              className="rounded-2xl shadow-xl bg-white/60 dark:bg-black/40 p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between">
                <div className="font-bold text-lg">{item.nama_kategori}</div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === "active"
                      ? "bg-green-200 text-green-900"
                      : "bg-red-200 text-red-900"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditItem(item);
                    setNamaKategori(item.nama_kategori);
                    setStatusKategori(item.status);
                    setShowEditModal(true);
                  }}
                >
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                {item.status === "active" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDeleteItem(item);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Nonaktif
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAktifkanKategori(item)}
                  >
                    <Plus className="w-4 h-4" /> Aktifkan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop table
        <div className="overflow-x-auto">
          <table className="min-w-full text-base">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Nama</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredKategori.map((item) => (
                <tr key={item.id_kategori}>
                  <td className="py-3 px-4">{item.nama_kategori}</td>
                  <td className="py-3 px-4">{item.status}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditItem(item);
                        setNamaKategori(item.nama_kategori);
                        setStatusKategori(item.status);
                        setShowEditModal(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    {item.status === "active" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeleteItem(item);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Nonaktif
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAktifkanKategori(item)}
                      >
                        <Plus className="w-4 h-4" /> Aktifkan
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==== MODALS (Add/Edit/Delete/AuditLog) ==== */}
      {/* Tambah */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddKategori}>
            <Input
              value={namaKategori}
              onChange={(e) => setNamaKategori(e.target.value)}
              placeholder="Nama kategori"
              required
            />
            <DialogFooter>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditKategori}>
            <Input
              value={namaKategori}
              onChange={(e) => setNamaKategori(e.target.value)}
              placeholder="Nama kategori"
              required
            />
            <DialogFooter>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Kategori</DialogTitle>
          </DialogHeader>
          <p>
            Yakin menonaktifkan{" "}
            <b>{deleteItem?.nama_kategori}</b>?
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleNonaktifKategori}
            >
              Nonaktifkan
            </Button>
            <Button onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {auditLog.length === 0
              ? "Belum ada log."
              : auditLog.map((log) => (
                  <div key={log.id} className="border p-2 rounded">
                    <div>
                      <b>{log.action}</b> oleh{" "}
                      {log.user_profiles?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(
                        log.created_at
                      ).toLocaleString()}
                    </div>
                  </div>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
