const PDFDocument = require('pdfkit');

function newDoc(res, filename) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

function header(doc, title) {
  doc.fontSize(16).font('Helvetica-Bold').text('Alfa Security', { align: 'left' });
  doc.fontSize(13).font('Helvetica-Bold').text(title, { align: 'left' });
  doc.moveDown(0.5);
  doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
}

function listSection(doc, title, entries) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(title);
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  if (entries.length === 0) {
    doc.fillColor('#666666').text('Nessun servizio', { indent: 10 });
  } else {
    for (const [nome, n] of entries) {
      doc.fillColor('#000000').text(`${nome}`, 60, doc.y, { continued: true, width: 400 });
      doc.text(`${n}`, { align: 'right' });
    }
  }
  doc.moveDown(1);
}

function generateMonthlySummaryPdf(res, summary) {
  const doc = newDoc(res, `riepilogo_${summary.year}_${String(summary.month).padStart(2, '0')}.pdf`);
  header(doc, `Riepilogo Mensile Servizi - ${summary.monthLabel}`);

  doc.fontSize(11).font('Helvetica-Bold').text(`Totale servizi: ${summary.total}`);
  doc.moveDown(1);

  listSection(doc, 'Per sito / locale / evento', summary.perSito);
  listSection(doc, 'Per operatore', summary.perOperatore);

  doc.fontSize(8).fillColor('#999999').text(
    `Generato il ${new Date().toLocaleString('it-IT')}`,
    50,
    doc.page.height - 60
  );

  doc.end();
}

function generateCommunicationPdf(res, communication) {
  const doc = newDoc(res, `comunicazione_${communication.id}.pdf`);
  header(doc, 'Comunicazione Servizi');

  doc.fontSize(10).font('Helvetica-Bold').text('Oggetto:', { continued: true });
  doc.font('Helvetica').text(` ${communication.subject}`);
  doc.font('Helvetica-Bold').text('Inviata il:', { continued: true });
  doc.font('Helvetica').text(` ${new Date(communication.sent_at).toLocaleString('it-IT')}`);
  doc.moveDown(1);

  doc.fontSize(9).font('Courier').fillColor('#000000').text(communication.body_text, {
    lineGap: 2,
  });

  doc.end();
}

module.exports = { generateMonthlySummaryPdf, generateCommunicationPdf };
