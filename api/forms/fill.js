// api/forms/fill.js
// Draws each placement's text directly onto the original PDF using pdf-lib
// (vector text, not a re-rasterized image -- sharper output than the local
// Pillow-based version). Placements are stored as percentages (xPct, yPct)
// measured against the rendered preview image the user clicked on. That
// preview is produced by pdf.js in the browser, which renders pages
// honoring their internal /Rotate flag -- so the percentages always
// correspond to the VISUAL page orientation, not necessarily the PDF's
// raw, unrotated coordinate space. We account for that rotation explicitly
// below so text lands correctly regardless of how the source PDF is
// internally rotated.
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
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
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Raw page box (unrotated coordinate space pdf-lib draws into)
    const { width: rawW, height: rawH } = page.getSize();
    const rotation = ((page.getRotation().angle % 360) + 360) % 360; // normalize to 0/90/180/270

    // Visual width/height -- what the user actually saw and clicked on in
    // the browser preview, which is what xPct/yPct are measured against.
    const visualW = (rotation === 90 || rotation === 270) ? rawH : rawW;
    const visualH = (rotation === 90 || rotation === 270) ? rawW : rawH;

    const fontSize = Math.max(visualW * 0.018, 10);

    for (const p of placements) {
      if (!p.value) continue;

      // Position in VISUAL space first (top-left origin, matching the click)
      const vx = (p.xPct / 100) * visualW;
      const vy = (p.yPct / 100) * visualH;

      // Convert visual (top-left origin) into the page's own RAW coordinate
      // space (bottom-left origin), accounting for rotation. Each case maps
      // the visual click point through the inverse of the page's rotation.
      let x, y, textRotation;
      if (rotation === 0) {
        x = vx;
        y = rawH - vy - fontSize * 0.8;
        textRotation = 0;
      } else if (rotation === 90) {
        x = rawW - (vy - fontSize * 0.8);
        y = vx;
        textRotation = 90;
      } else if (rotation === 180) {
        x = rawW - vx;
        y = vy + fontSize * 0.8;
        textRotation = 180;
      } else { // 270
        x = vy - fontSize * 0.8;
        y = rawH - vx;
        textRotation = 270;
      }

      page.drawText(String(p.value), {
        x, y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        rotate: degrees(textRotation),
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
