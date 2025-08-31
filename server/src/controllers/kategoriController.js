import supabase from '../config/supabase.js';
// Ambil audit log kategori beserta nama user
export const getAuditLogKategori = async (req, res) => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*, user_profiles(name)')
    .eq('table_name', 'kategori')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
// Fungsi untuk mencatat audit log
const logAudit = async ({ user_id, action, table_name, record_id, detail }) => {
  const { error } = await supabase.from('audit_log').insert({
    user_id,
    action,
    table_name,
    record_id,
    detail,
    created_at: new Date().toISOString()
  });
  if (error) {
    console.error('Audit log error:', error.message);
  }
};

// Ambil semua kategori
export const getKategori = async (req, res) => {
  // Return all categories (active and inactive)
  const { data, error } = await supabase
    .from('kategori')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah kategori
export const addKategori = async (req, res) => {
  const { nama_kategori, status } = req.body;
  // Validasi field wajib
  if (!nama_kategori) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
  }
  // Validasi nama unik
  const { data: existing } = await supabase
    .from('kategori')
    .select('id_kategori')
    .eq('nama_kategori', nama_kategori)
    .single();
  if (existing) {
    return res.status(400).json({ error: 'Nama kategori sudah terdaftar.' });
  }
  // Validasi status
  const statusList = ['active', 'inactive'];
  if (status && !statusList.includes(status)) {
    return res.status(400).json({ error: 'Status kategori tidak valid.' });
  }
  const { data, error } = await supabase.from('kategori').insert({
    nama_kategori,
    status: status || 'active'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Update kategori
export const updateKategori = async (req, res) => {
  const { id } = req.params;
  const { nama_kategori, status } = req.body;
  // Validasi nama unik jika diubah
  if (nama_kategori) {
    const { data: existing } = await supabase
      .from('kategori')
      .select('id_kategori')
      .eq('nama_kategori', nama_kategori)
      .neq('id_kategori', id)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Nama kategori sudah terdaftar.' });
    }
  }
  // Validasi status
  const statusList = ['active', 'inactive'];
  if (status && !statusList.includes(status)) {
    return res.status(400).json({ error: 'Status kategori tidak valid.' });
  }
  const { data, error } = await supabase.from('kategori').update({
    nama_kategori,
    status
  }).eq('id_kategori', id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
  }
  // Audit log
  const user_id = req.user?.id || null;
  await logAudit({
    user_id,
    action: 'edit',
    table_name: 'kategori',
    record_id: id, // id_kategori bertipe uuid
    detail: { before: req.body, after: data[0] }
  });
  res.json(data[0]);
};

// Soft delete kategori (set status to 'inactive')
export const deleteKategori = async (req, res) => {
  const { id } = req.params;
  // Update status to 'inactive' instead of deleting
  const { data, error } = await supabase
    .from('kategori')
    .update({ status: 'inactive' })
    .eq('id_kategori', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
  }
  // Audit log
  const user_id = req.user?.id || null;
  await logAudit({
    user_id,
    action: 'delete',
    table_name: 'kategori',
    record_id: id, // id_kategori bertipe uuid
    detail: { after: data[0] }
  });
  res.json({ message: 'Kategori berhasil di-nonaktifkan' });
};

// Aktifkan kategori (set status to 'active')
export const activateKategori = async (req, res) => {
  const { id } = req.params;
  // Update status to 'active'
  const { data, error } = await supabase
    .from('kategori')
    .update({ status: 'active' })
    .eq('id_kategori', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
  }
  // Audit log
  const user_id = req.user?.id || null;
  await logAudit({
    user_id,
    action: 'activate',
    table_name: 'kategori',
    record_id: id,
    detail: { after: data[0] }
  });
  res.json({ message: 'Kategori berhasil diaktifkan' });
};

// Statistik kategori: jumlah item & total transaksi per kategori, dengan filter
export const getKategoriStatistik = async (req, res) => {
  const { status, minTransaksi } = req.query;
  // Ambil semua kategori
  let kategoriQuery = supabase.from('kategori').select('id_kategori, nama_kategori, status');
  if (status) kategoriQuery = kategoriQuery.eq('status', status);
  const { data: kategoriData, error: kategoriError } = await kategoriQuery;
  if (kategoriError) return res.status(500).json({ error: kategoriError.message });

  // Ambil semua transaksi
  const { data: trxData } = await supabase.from('transaksi').select('id_kategori, total_harga');

  // Gabungkan statistik
  let statistik = kategoriData.map(kat => {
    const transaksiKategori = trxData.filter(t => t.id_kategori === kat.id_kategori);
    const jumlah_transaksi = transaksiKategori.length;
    const total_transaksi = transaksiKategori.reduce((sum, t) => sum + Number(t.total_harga), 0);
    return {
      ...kat,
      jumlah_transaksi,
      total_transaksi
    };
  });
  // Filter minTransaksi jika ada
  if (minTransaksi) {
    statistik = statistik.filter(s => s.total_transaksi >= Number(minTransaksi));
  }
  res.json(statistik);
};