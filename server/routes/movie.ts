import express, { Request, Response, Router } from "express";
import { movie, movieFilePath, initializeContext } from "mulmocast";
import type { MulmoScript } from "mulmocast";
import path from "path";
import fs from "fs/promises";

const router: Router = express.Router();

// Movie generation endpoint
router.post(
  "/generate-movie",
  async (req: Request, res: Response): Promise<void> => {
    const { mulmoScript, uuid } = req.body as {
      mulmoScript: MulmoScript;
      uuid: string;
    };

    if (!mulmoScript) {
      res.status(400).json({ error: "MulmoScript is required" });
      return;
    }

    if (!uuid) {
      res.status(400).json({ error: "UUID is required" });
      return;
    }

    try {
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), "output");
      await fs.mkdir(outputDir, { recursive: true });

      // Create script file with UUID
      const scriptPath = path.join(outputDir, `${uuid}.json`);
      await fs.writeFile(scriptPath, JSON.stringify(mulmoScript, null, 2));

      // Initialize context from the script file
      const context = await initializeContext({
        _: [],
        $0: "",
        file: scriptPath,
        o: outputDir,
        v: true,
      }, true);

      if (!context) {
        throw new Error("Failed to initialize MulmoStudioContext");
      }

      // Generate the movie
      await movie(context);

      const outputPath = movieFilePath(context);

      res.json({
        success: true,
        message: "Movie generated successfully",
        outputPath,
      });
    } catch (error: unknown) {
      console.error("Movie generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to generate movie",
        details: errorMessage,
      });
    }
  },
);

export default router;
