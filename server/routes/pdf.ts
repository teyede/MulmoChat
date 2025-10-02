import express, { Request, Response, Router } from "express";
import puppeteer from "puppeteer";
import { marked } from "marked";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";

const router: Router = express.Router();

const isCI = process.env.CI === "true";

// PDF generation endpoint
router.post(
  "/generate-pdf",
  async (req: Request, res: Response): Promise<void> => {
    const { markdown, title, uuid } = req.body as {
      markdown: string;
      title: string;
      uuid: string;
    };

    if (!markdown) {
      res.status(400).json({ error: "Markdown content is required" });
      return;
    }

    if (!uuid) {
      res.status(400).json({ error: "UUID is required" });
      return;
    }

    try {
      // Generate HTML from markdown
      const htmlContent = marked(markdown);

      // Create complete HTML document with styling
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || "Document"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h2 {
      font-size: 1.75rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h4 {
      font-size: 1.25rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h5 {
      font-size: 1.125rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h6 {
      font-size: 1rem;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    p {
      margin-bottom: 1em;
    }
    code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    ul, ol {
      margin-bottom: 1em;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
`;

      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), "output");
      await fs.mkdir(outputDir, { recursive: true });

      // Create PDF file path with UUID
      const sanitizedTitle = (title || "document")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const pdfPath = path.join(outputDir, `${uuid}_${sanitizedTitle}.pdf`);

      // Launch puppeteer and generate PDF
      const browser = await puppeteer.launch({
        args: isCI ? ["--no-sandbox"] : [],
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded" });
        await page.pdf({
          path: pdfPath,
          format: "A4",
          printBackground: true,
          margin: {
            top: "20mm",
            right: "20mm",
            bottom: "20mm",
            left: "20mm",
          },
        });

        console.log("PDF generated:", pdfPath);

        res.json({
          success: true,
          message: "PDF generated successfully",
          pdfPath,
        });
      } finally {
        await browser.close();
      }
    } catch (error: unknown) {
      console.error("PDF generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to generate PDF",
        details: errorMessage,
      });
    }
  },
);

// PDF download endpoint
router.post(
  "/download-pdf",
  async (req: Request, res: Response): Promise<void> => {
    const { pdfPath } = req.body as { pdfPath: string };

    if (!pdfPath) {
      res.status(400).json({ error: "PDF path is required" });
      return;
    }

    try {
      // Check if file exists
      await fs.access(pdfPath);

      // Get the filename from the path
      const filename = path.basename(pdfPath);

      // Set headers for file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      // Stream the file
      const fileStream = createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error: unknown) {
      console.error("PDF download failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to download PDF",
        details: errorMessage,
      });
    }
  },
);

export default router;
