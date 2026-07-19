import PDFDocument from "pdfkit";

/**
 * Stream a plain-text resume as a simple, readable PDF directly to an
 * HTTP response.
 */
export function streamResumePdf(res, { text, title = "Tailored Resume" }) {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.replace(/[^a-z0-9\-_ ]/gi, "").trim() || "tailored-resume"}.pdf"`
  );

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(16).text(title, { align: "left" });
  doc.moveDown();
  doc.font("Helvetica").fontSize(10.5);

  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) {
      doc.moveDown(0.5);
      continue;
    }
    doc.text(line, { align: "left" });
  }

  doc.end();
}
