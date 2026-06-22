// api/packages.js
const { supabase } = require('../lib/supabase');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('packages').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const pkg = {
      id: body.id || 'pkg_' + randomUUID().slice(0, 8),
      name: body.name,
      form_ids: body.form_ids || [],
    };
    const { error } = await supabase.from('packages').upsert(pkg);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(pkg);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
