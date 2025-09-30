import express, { Request, Response, Router } from "express";
import { movie, movieFilePath } from "mulmocast";
import type { MulmoStudioContext } from "mulmocast";
import path from "path";
import fs from "fs/promises";

const router: Router = express.Router();

// Movie generation endpoint
router.post(
  "/generate-movie",
  async (req: Request, res: Response): Promise<void> => {
    const { context } = req.body as { context: MulmoStudioContext };

    if (!context) {
      res.status(400).json({ error: "MulmoStudioContext is required" });
      return;
    }

    try {
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), "output");
      await fs.mkdir(outputDir, { recursive: true });

      // Set output path if not already specified
      if (!context.outputPath) {
        const timestamp = Date.now();
        context.outputPath = path.join(outputDir, `movie-${timestamp}.mp4`);
      } else if (!path.isAbsolute(context.outputPath)) {
        context.outputPath = path.join(outputDir, context.outputPath);
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
