import { ToolPlugin, ToolContext, ToolResult } from "./type";
import MarkdownView from "./views/markdown.vue";
import MarkdownPreview from "./previews/markdown.vue";

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
        description: "The markdown content to display. Embed images ONLY IF the user explicitly asks for it, in following format: ![Detailed image prompt](__too_be_replaced_image_path__)",
      },
    },
    required: ["title", "markdown"],
  },
};

const pushMarkdown = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  const markdown = args.markdown as string;
  const title = args.title as string;

  return {
    message: `Created markdown document: ${title}`,
    title,
    markdown,
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
