// api/forms.js
const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('forms').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
