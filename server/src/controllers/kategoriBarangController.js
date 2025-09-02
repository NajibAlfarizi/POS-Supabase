import supabase from '../config/supabase.js';

// Ambil semua kategori barang
export const getAllKategoriBarang = async (req, res) => {
  const { data, error } = await supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori').order('nama_kategori', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Tambah kategori barang baru
export const addKategoriBarang = async (req, res) => {
  const { nama_kategori } = req.body;
  if (!nama_kategori) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
  const { data, error } = await supabase.from('kategori_barang').insert({ nama_kategori }).select('id_kategori_barang, nama_kategori');
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Edit kategori barang
export const updateKategoriBarang = async (req, res) => {
  const { id } = req.params;
  const { nama_kategori } = req.body;
  if (!nama_kategori) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
  const { data, error } = await supabase.from('kategori_barang').update({ nama_kategori }).eq('id_kategori_barang', id).select('id_kategori_barang, nama_kategori');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

// Hapus kategori barang
export const deleteKategoriBarang = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('kategori_barang').delete().eq('id_kategori_barang', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Kategori barang berhasil dihapus.' });
};

// Statistik jumlah sparepart per kategori
export const getSparepartStatByKategori = async (req, res) => {
  // Ambil semua kategori
  const { data: kategoriList, error: kategoriError } = await supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori');
  if (kategoriError) return res.status(500).json({ error: kategoriError.message });

  // Ambil semua sparepart
  const { data: sparepartList, error: sparepartError } = await supabase.from('sparepart').select('id_kategori_barang');
  if (sparepartError) return res.status(500).json({ error: sparepartError.message });

  // Hitung jumlah sparepart per kategori
  const stat = kategoriList.map(kat => {
    const totalSparepart = sparepartList.filter(sp => sp.id_kategori_barang === kat.id_kategori_barang).length;
    return {
      id_kategori_barang: kat.id_kategori_barang,
      nama_kategori: kat.nama_kategori,
      total_sparepart: totalSparepart
    };
  });

  res.json(stat);
};

// List merek per kategori
export const getMerekByKategori = async (req, res) => {
  const { id } = req.params;
  // Ambil semua merek yang punya sparepart di kategori tertentu
  const { data: merekList, error } = await supabase
    .from('merek')
    .select('id_merek, nama_merek')
    .in('id_merek',
      (await supabase
        .from('sparepart')
        .select('id_merek')
        .eq('id_kategori_barang', id)
      ).data?.map(sp => sp.id_merek) || []
    );
  if (error) return res.status(500).json({ error: error.message });
  res.json(merekList);
};

// Statistik penjualan per kategori
export const getPenjualanStatByKategori = async (req, res) => {
  // Ambil semua kategori
  const { data: kategoriList, error: kategoriError } = await supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori');
  if (kategoriError) return res.status(500).json({ error: kategoriError.message });

  // Ambil semua sparepart
  const { data: sparepartList, error: sparepartError } = await supabase.from('sparepart').select('id_kategori_barang, terjual, jumlah, sisa');
  if (sparepartError) return res.status(500).json({ error: sparepartError.message });

  // Hitung statistik penjualan per kategori
  const stat = kategoriList.map(kat => {
    const sparepartByKategori = sparepartList.filter(sp => sp.id_kategori_barang === kat.id_kategori_barang);
    const totalTerjual = sparepartByKategori.reduce((sum, sp) => sum + (sp.terjual || 0), 0);
    const totalStok = sparepartByKategori.reduce((sum, sp) => sum + (sp.jumlah || 0), 0);
    const totalSisa = sparepartByKategori.reduce((sum, sp) => sum + (sp.sisa || 0), 0);
    return {
      id_kategori_barang: kat.id_kategori_barang,
      nama_kategori: kat.nama_kategori,
      total_terjual: totalTerjual,
      total_stok: totalStok,
      total_sisa: totalSisa
    };
  });

  res.json(stat);
};

// Filter/Search kategori
export const searchKategori = async (req, res) => {
  const { q } = req.query;
  let query = supabase.from('kategori_barang').select('id_kategori_barang, nama_kategori');
  if (q) {
    query = query.ilike('nama_kategori', `%${q}%`);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
