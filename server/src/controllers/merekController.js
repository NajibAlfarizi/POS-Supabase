import supabase from '../config/supabase.js';

// Ambil semua merek
export const getAllMerek = async (req, res) => {
  const { data, error } = await supabase.from('merek').select('*').order('nama_merek', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah merek baru
export const addMerek = async (req, res) => {
  const { nama_merek } = req.body;
  if (!nama_merek) return res.status(400).json({ error: 'Nama merek wajib diisi.' });
  const { data, error } = await supabase.from('merek').insert({ nama_merek }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Edit merek
export const updateMerek = async (req, res) => {
  const { id } = req.params;
  const { nama_merek } = req.body;
  if (!nama_merek) return res.status(400).json({ error: 'Nama merek wajib diisi.' });
  const { data, error } = await supabase.from('merek').update({ nama_merek }).eq('id_merek', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

// Hapus merek
export const deleteMerek = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('merek').delete().eq('id_merek', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Merek berhasil dihapus.' });
};

// Statistik jumlah sparepart per merek dan breakdown per kategori
export const getSparepartStatByMerek = async (req, res) => {
  // Ambil semua merek
  const { data: merekList, error: merekError } = await supabase.from('merek').select('id_merek, nama_merek');
  if (merekError) return res.status(500).json({ error: merekError.message });

  // Ambil semua kategori
  const { data: kategoriList, error: kategoriError } = await supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori');
  if (kategoriError) return res.status(500).json({ error: kategoriError.message });

  // Ambil semua sparepart
  const { data: sparepartList, error: sparepartError } = await supabase.from('sparepart').select('id_merek, id_kategori_barang');
  if (sparepartError) return res.status(500).json({ error: sparepartError.message });

  // Hitung jumlah sparepart per merek dan breakdown per kategori
  const stat = merekList.map(merek => {
    const sparepartByMerek = sparepartList.filter(sp => sp.id_merek === merek.id_merek);
    const totalSparepart = sparepartByMerek.length;
    const kategoriBreakdown = kategoriList.map(kat => ({
      id_kategori_barang: kat.id_kategori_barang,
      nama_kategori: kat.nama_kategori,
      jumlah: sparepartByMerek.filter(sp => sp.id_kategori_barang === kat.id_kategori_barang).length
    }));
    return {
      id_merek: merek.id_merek,
      nama_merek: merek.nama_merek,
      total_sparepart: totalSparepart,
      kategori_breakdown: kategoriBreakdown
    };
  });

  res.json(stat);
};

// List kategori barang per merek
export const getKategoriBarangByMerek = async (req, res) => {
  const { id } = req.params;
  // Ambil semua kategori yang punya sparepart dengan merek tertentu
  const { data: kategoriList, error } = await supabase
    .from('kategori_barang')
    .select('id_kategori_barang, nama_kategori')
    .in('id_kategori_barang',
      (await supabase
        .from('sparepart')
        .select('id_kategori_barang')
        .eq('id_merek', id)
      ).data?.map(sp => sp.id_kategori_barang) || []
    );
  if (error) return res.status(500).json({ error: error.message });
  res.json(kategoriList);
};

// Statistik penjualan per merek
export const getPenjualanStatByMerek = async (req, res) => {
  // Ambil semua merek
  const { data: merekList, error: merekError } = await supabase.from('merek').select('id_merek, nama_merek');
  if (merekError) return res.status(500).json({ error: merekError.message });

  // Ambil semua sparepart
  const { data: sparepartList, error: sparepartError } = await supabase.from('sparepart').select('id_merek, terjual, jumlah, sisa');
  if (sparepartError) return res.status(500).json({ error: sparepartError.message });

  // Hitung statistik penjualan per merek
  const stat = merekList.map(merek => {
    const sparepartByMerek = sparepartList.filter(sp => sp.id_merek === merek.id_merek);
    const totalTerjual = sparepartByMerek.reduce((sum, sp) => sum + (sp.terjual || 0), 0);
    const totalStok = sparepartByMerek.reduce((sum, sp) => sum + (sp.jumlah || 0), 0);
    const totalSisa = sparepartByMerek.reduce((sum, sp) => sum + (sp.sisa || 0), 0);
    return {
      id_merek: merek.id_merek,
      nama_merek: merek.nama_merek,
      total_terjual: totalTerjual,
      total_stok: totalStok,
      total_sisa: totalSisa
    };
  });

  res.json(stat);
};

// Filter & search merek (partial search)
export const searchMerek = async (req, res) => {
  const { q } = req.query;
  let query = supabase.from('merek').select('*').order('nama_merek', { ascending: true });
  if (q && q.length > 0) {
    query = query.ilike('nama_merek', `%${q}%`);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
