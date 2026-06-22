// api/forms/[id].js
const { supabase } = require('../../lib/supabase');

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // look up the filename first so we can also remove the stored PDF
    const { data: form } = await supabase.from('forms').select('filename').eq('id', id).single();
    if (form && form.filename) {
      await supabase.storage.from('permit-uploads').remove([form.filename]);
      await supabase.storage.from('permit-uploads').remove([form.filename.replace('.pdf', '_thumb.png')]);
    }
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
