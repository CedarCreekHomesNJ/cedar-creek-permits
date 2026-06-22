// api/forms/fill.js
// Draws each placement's text directly onto the original PDF using pdf-lib
// (vector text, not a re-rasterized image -- sharper output than the local
// Pillow-based version). Placements are stored as percentages of the page
// (xPct, yPct) from the browser's click position on the rendered preview,
// so they map directly onto the PDF's own width/height in points.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { supabase } = require('../../lib/supabase');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { form_id, placements } = req.body || {};
    if (!form_id || !placements) return res.status(400).json({ error: 'Missing form_id or placements' });

    const { data: form, error: formErr } = await supabase.from('forms').select('*').eq('id', form_id).single();
    if (formErr || !form) return res.status(404).json({ error: 'Form not found' });

    const { data: pdfBlob, error: dlErr } = await supabase.storage.from('permit-uploads').download(form.filename);
    if (dlErr) return res.status(500).json({ error: 'Could not download original PDF: ' + dlErr.message });

    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = Math.max(width * 0.018, 10);

    for (const p of placements) {
      if (!p.value) continue;
      const x = (p.xPct / 100) * width;
      // PDF y-origin is bottom-left; xPct/yPct were measured from the
      // top-left of the rendered preview image, so flip the y axis.
      const y = height - (p.yPct / 100) * height - fontSize * 0.8;
      page.drawText(String(p.value), {
        x, y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const filledBytes = await pdfDoc.save();
    const outName = `${randomUUID()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from('permit-filled')
      .upload(outName, Buffer.from(filledBytes), { contentType: 'application/pdf' });
    if (upErr) return res.status(500).json({ error: 'Could not save filled PDF: ' + upErr.message });

    const { data: urlData } = supabase.storage.from('permit-filled').getPublicUrl(outName);
    return res.status(200).json({ ok: true, url: urlData.publicUrl, filename: outName, form_name: form.name });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
