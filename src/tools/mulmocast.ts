import { ToolPlugin, ToolContext, ToolResult } from "./type";
import { blankImageBase64 } from "./blank";
import MulmocastView from "./views/mulmocast.vue";
import MulmocastPreview from "./previews/mulmocast.vue";
import type { MulmoScript } from "mulmocast";

const toolName = "pushMulmoScript";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description:
    "Let MulmoCast to process a given MulmoScript to generate a presentation of a given topic or story.",
  parameters: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "The title of the presentation" },
      lang: {
        type: "string",
        description: "The language of the presentation, such as en, ja, etc.",
      },
      beats: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description:
                "The text to be spoken by the presenter, which is also used to generate an image. Typically 50 to 70 words.",
            },
          },
          required: ["text"],
          additionalProperties: false,
        },
        minItems: 1,
      },
      style: {
        type: "string",
        enum: ["photorealistic", "anime", "comicstrips"],
        description: "The visual style for image generation",
      },
    },
    required: ["title", "lang", "beats", "style"],
    additionalProperties: false,
  },
};

const mulmocast = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  console.log("MULMOSCRIPT:\n", JSON.stringify(args, null, 2));

  const { title, beats, style: styleParam } = args;

  const styleMap = {
    photorealistic:
      "<style>Photo realistic and cinematic. Let the art convey the story and emotions without text. Use the last image for the aspect ratio.</style>",
    anime:
      "<style>A highly polished 2D digital illustration in anime and manga style, featuring clean linework, soft shading, vivid colors, and expressive facial detailing. The composition emphasizes clarity and visual impact with a minimalistic background and a strong character focus. The lighting is even and bright, giving the image a crisp and energetic feel, reminiscent of high-quality character art used in Japanese visual novels or mobile games. Let the art convey the story and emotions without text. Use the last image for the aspect ratio.</style>",
    comicstrips:
      "<style>Ghibli style multi-panel comic strips in landscape mode. Use speech bubbles with short, natural dialogue (1–6 words). Keep text minimal. Use the last image for the aspect ratio.</style>",
  };

  const style =
    styleMap[styleParam as keyof typeof styleMap] || styleMap.photorealistic;

  // Generate HTML from MulmoScript
  let htmlContent = `<h1 style="font-size: 2em; margin-bottom: 1em;">${title}</h1>`;

  // Generate images for each beat concurrently
  const imagePromises = beats.map(async (beat: { text: string }) => {
    const prompt = `generate image appropriate for the text. <text>${beat.text}</text>${style}`;

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, images: [blankImageBase64] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageData) {
          return data.imageData;
        }
      }
    } catch (error) {
      console.error(
        "EXC: exception\nFailed to generate image for beat:",
        error,
      );
    }
    return null;
  });

  const images = await Promise.all(imagePromises);

  // Build HTML with images and text
  beats.forEach((beat: { text: string }, index: number) => {
    if (images[index]) {
      htmlContent += `<img src="data:image/png;base64,${images[index]}" style="max-width: 100%; margin: 1em 0;" alt="${beat.text}" />`;
    }
    htmlContent += `<p style="margin-bottom: 1em;">${beat.text}</p>`;
  });

  // Construct MulmoScript object
  const mulmoScript: MulmoScript = {
    $mulmocast: { version: "1.1" },
    canvasSize: {
      width: 1536,
      height: 1080,
    },
    imageParams: {
      provider: "gemini",
      model: "gemini-2.0-flash-001",
      style,
    },
    audioParams: {
      padding: 0.2,
      introPadding: 0.5,
      closingPadding: 0.5,
      outroPadding: 0.5,
      bgmVolume: 0,
      audioVolume: 1,
      suppressSpeech: false,
    },
    soundEffectParams: {},
    speechParams: {
      speakers: {
        Presenter: {
          voiceId: "shimmer",
        },
      },
    },
    title,
    lang: args.lang,
    beats: beats.map((beat: { text: string }) => ({
      speaker: "Presenter",
      text: beat.text,
    })),
  };

  return {
    message: `Mulmocast has processed the MulmoScript for "${title}" with ${beats.length} beats.`,
    title,
    htmlData: htmlContent,
    instructions: "Acknowledge that the mulmocast operation was completed.",
    mulmoScript,
  };
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute: mulmocast,
  generatingMessage: "Processing with Mulmocast...",
  waitingMessage: "Tell the user that you are processing with Mulmocast.",
  isEnabled: () => true,
  viewComponent: MulmocastView,
  previewComponent: MulmocastPreview,
};
