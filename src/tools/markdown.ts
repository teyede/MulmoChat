import { ToolPlugin, ToolContext, ToolResult } from "./type";
import MarkdownView from "./views/markdown.vue";
import MarkdownPreview from "./previews/markdown.vue";
import { generateImageCommon } from "./generateImage";

const toolName = "pushMarkdown";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description: "Generate and display a document in markdown format.",
  parameters: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Title for the document",
      },
      markdown: {
        type: "string",
        description:
          "The markdown content to display. Embed images ONLY IF the user explicitly asks for it, in following format: ![Detailed image prompt](__too_be_replaced_image_path__)",
      },
    },
    required: ["title", "markdown"],
  },
};

const pushMarkdown = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  let markdown = args.markdown as string;
  const title = args.title as string;
  let docUuid: string | undefined;

  // Detect all image placeholders in the format: ![prompt](__too_be_replaced_image_path__)
  const imageRegex = /!\[([^\]]+)\]\(__too_be_replaced_image_path__\)/g;
  const matches = [...markdown.matchAll(imageRegex)];

  if (matches.length > 0) {
    // Generate a UUID for this markdown document
    docUuid = crypto.randomUUID();
    const images: Record<string, string> = {};

    // Generate images for each placeholder
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const prompt = match[1];
      const imageId = `image_${i}`;

      try {
        // Generate the image using the existing generateImageCommon function
        const imageResult = await generateImageCommon(context, prompt, false);

        if (imageResult.imageData) {
          images[imageId] = imageResult.imageData;
        }
      } catch (error) {
        console.error(`Failed to generate image for prompt: ${prompt}`, error);
      }
    }

    // Save images to server and get URLs
    if (Object.keys(images).length > 0) {
      try {
        const response = await fetch("/api/save-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid: docUuid,
            images,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrls = data.imageUrls as Record<string, string>;

          // Replace placeholders with actual image URLs
          let imageIndex = 0;
          markdown = markdown.replace(imageRegex, (match, prompt) => {
            const imageId = `image_${imageIndex}`;
            const imageUrl = imageUrls[imageId];
            imageIndex++;
            return imageUrl ? `![${prompt}](${imageUrl})` : match;
          });
        }
      } catch (error) {
        console.error("Failed to save images:", error);
      }
    }
  }

  return {
    message: `Created markdown document: ${title}`,
    title,
    markdown,
    uuid: docUuid,
    instructions:
      "Acknowledge that the document has been created and is displayed to the user.",
  };
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute: pushMarkdown,
  generatingMessage: "Creating document...",
  isEnabled: () => true,
  viewComponent: MarkdownView,
  previewComponent: MarkdownPreview,
};
