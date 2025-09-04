import supabase from '../config/supabase.js';

// Endpoint: GET /api/laporan/statistik
// Query: kategori, merek, barang
export const getLaporanStatistik = async (req, res) => {
  try {
    const { kategori, merek, barang } = req.query;
    let filter = {};
    if (kategori) filter.kategori = kategori;
    if (merek) filter.merek = merek;
    if (barang) filter.id_sparepart = barang;

    // Query transaksi dengan relasi sparepart, merek, kategori_barang
    const { data: transaksi, error } = await supabase
      .from('transaksi')
      .select('*, sparepart:sparepart(*, merek(*), kategori_barang(*))')
      .order('tanggal', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    // Filter manual
    let filtered = transaksi;
    if (filter.kategori) filtered = filtered.filter(t => t.sparepart?.id_kategori_barang === filter.kategori);
    if (filter.merek) filtered = filtered.filter(t => t.sparepart?.id_merek === filter.merek);
    if (filter.id_sparepart) filtered = filtered.filter(t => t.id_sparepart === filter.id_sparepart);

    // Statistik kategori
    const kategoriStat = {};
    filtered.forEach(t => {
      const kat = t.sparepart?.kategori_barang?.nama_kategori || '-';
      kategoriStat[kat] = (kategoriStat[kat] || 0) + 1;
    });
    const kategoriChart = {
      labels: Object.keys(kategoriStat),
      datasets: [{ label: 'Transaksi', data: Object.values(kategoriStat), backgroundColor: '#3b82f6' }]
    };

    // Statistik merek
    const merekStat = {};
    filtered.forEach(t => {
      const mk = t.sparepart?.merek?.nama_merek || '-';
      merekStat[mk] = (merekStat[mk] || 0) + 1;
    });
    const merekChart = {
      labels: Object.keys(merekStat),
      datasets: [{ data: Object.values(merekStat), backgroundColor: ['#3b82f6', '#10b981', '#f59e42', '#ef4444'] }]
    };

    // Statistik barang
    const barangStat = {};
    filtered.forEach(t => {
      const brg = t.sparepart?.nama_barang || '-';
      barangStat[brg] = (barangStat[brg] || 0) + 1;
    });
    const barangChart = {
      labels: Object.keys(barangStat),
      datasets: [{ label: 'Transaksi', data: Object.values(barangStat), backgroundColor: '#6366f1' }]
    };

    // Analisis sederhana
    const analisis = [];
    if (!filtered || filtered.length === 0) analisis.push('Tidak ada transaksi pada filter ini.');
    else {
      const topKategori = Object.entries(kategoriStat).sort((a,b) => b[1]-a[1])[0];
      if (topKategori) analisis.push(`Kategori paling banyak transaksi: ${topKategori[0]} (${topKategori[1]} transaksi)`);
      const topMerek = Object.entries(merekStat).sort((a,b) => b[1]-a[1])[0];
      if (topMerek) analisis.push(`Merek paling banyak transaksi: ${topMerek[0]} (${topMerek[1]} transaksi)`);
      const topBarang = Object.entries(barangStat).sort((a,b) => b[1]-a[1])[0];
      if (topBarang) analisis.push(`Barang paling banyak transaksi: ${topBarang[0]} (${topBarang[1]} transaksi)`);
      analisis.push(`Total transaksi: ${filtered.length}`);
    }

    res.json({ kategori: kategoriChart, merek: merekChart, barang: barangChart, analisis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
