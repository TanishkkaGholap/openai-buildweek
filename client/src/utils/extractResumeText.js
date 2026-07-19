import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

async function extractFromPdf(arrayBuffer) {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join(" "));
  }
  return pageTexts.join("\n\n");
}

async function extractFromDocx(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract plain text from an uploaded resume file (.pdf, .docx, or .txt).
 * Throws a user-readable Error on unsupported types or extraction failure.
 */
export async function extractResumeText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return file.text();
  }

  if (name.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const text = await extractFromPdf(buffer);
    if (!text.trim()) {
      throw new Error(
        "Couldn't find any text in that PDF — it may be a scanned image. Try pasting the text manually."
      );
    }
    return text;
  }

  if (name.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const text = await extractFromDocx(buffer);
    if (!text.trim()) {
      throw new Error("Couldn't find any text in that document.");
    }
    return text;
  }

  throw new Error("Unsupported file type. Please upload a .pdf, .docx, or .txt file.");
}
