// api/packages/[id].js
const { supabase } = require('../../lib/supabase');

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
