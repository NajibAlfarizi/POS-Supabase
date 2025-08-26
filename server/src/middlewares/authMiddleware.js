import supabase from "../config/supabase.js";

// Middleware: Autentikasi Supabase JWT
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token tidak ditemukan.' });
  }
  const token = authHeader.replace('Bearer ', '');

  // Verifikasi token Supabase
  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }

  req.user = user.user; // simpan user di request
  next();
};

// Middleware: Cek Role
export const authorizeRole = (role) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    // Ambil data profile user
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error || !profile) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    // role bisa string atau array
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(profile.role)) {
      return res.status(403).json({ error: 'Role tidak sesuai.' });
    }
    next();
  };
};
