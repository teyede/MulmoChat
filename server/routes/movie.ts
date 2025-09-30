import express, { Request, Response, Router } from "express";
import {
  movie,
  audio,
  images,
  captions,
  movieFilePath,
  initializeContext,
} from "mulmocast";
import type { MulmoScript } from "mulmocast";
import path from "path";
import fs from "fs/promises";

const router: Router = express.Router();

// Movie generation endpoint
router.post(
  "/generate-movie",
  async (req: Request, res: Response): Promise<void> => {
    const {
      mulmoScript,
      uuid,
      images: beatImages,
    } = req.body as {
      mulmoScript: MulmoScript;
      uuid: string;
      images?: Record<string, string>;
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

      // Save images if provided
      if (beatImages && Object.keys(beatImages).length > 0) {
        const imagesDir = path.join(outputDir, "images", uuid);
        await fs.mkdir(imagesDir, { recursive: true });

        // Save each image as PNG file
        await Promise.all(
          Object.entries(beatImages).map(async ([beatId, base64Data]) => {
            const imagePath = path.join(imagesDir, `${beatId}.png`);
            // Remove data:image/png;base64, prefix if present
            const base64Image = base64Data.replace(
              /^data:image\/\w+;base64,/,
              "",
            );
            const imageBuffer = Buffer.from(base64Image, "base64");
            await fs.writeFile(imagePath, imageBuffer);
          }),
        );
      }

      // Initialize context from the script file
      const context = await initializeContext(
        {
          _: [],
          $0: "",
          file: scriptPath,
          o: outputDir,
          v: true,
        },
        true,
      );

      if (!context) {
        throw new Error("Failed to initialize MulmoStudioContext");
      }

      // Generate the movie
      await audio(context)
        .then(images)
        .then(captions)
        .then(movie)
        .then(async (_) => {
          const outputPath = movieFilePath(context);

          res.json({
            success: true,
            message: "Movie generated successfully",
            outputPath,
          });
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
