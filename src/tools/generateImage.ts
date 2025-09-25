import { ToolPlugin, ToolContext, ToolResult } from "./type";
import ImageView from "./views/image.vue";
import ImagePreview from "./previews/image.vue";

const toolName = "generateImage";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description: "Generate an image from a text prompt.",
  parameters: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "Description of the desired image in English",
      },
    },
    required: ["prompt"],
  },
};

export async function generateImageCommon(
  context: ToolContext,
  prompt: string,
  editImage: boolean,
  thisToolName: string,
): Promise<ToolResult> {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, images: editImage ? context.images : [] }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.imageData) {
      console.log("*** Image generation succeeded", data.imageData.length);
      return {
        toolName: thisToolName,
        imageData: data.imageData,
        message: "image generation succeeded",
        instructions:
          "Acknowledge that the image was generated and has been already presented to the user.",
      };
    } else {
      console.log("*** Image generation failed");
      return {
        toolName: thisToolName,
        message: data.message || "image generation failed",
        instructions: "Acknowledge that the image generation failed.",
      };
    }
  } catch (error) {
    console.error("*** Image generation failed", error);
    return {
      toolName: thisToolName,
      message: "image generation failed",
      instructions: "Acknowledge that the image generation failed.",
    };
  }
}

const generateImage = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  const prompt = args.prompt as string;
  console.log("******** Generate image", prompt);
  return generateImageCommon(context, prompt, false, toolName);
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute: generateImage,
  generatingMessage: "Generating image...",
  isEnabled: () => true,
  viewComponent: ImageView,
  previewComponent: ImagePreview,
};
