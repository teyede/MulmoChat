import { ToolPlugin, ToolContext, ToolResult } from "./type";
import CanvasView from "./views/canvas.vue";
import CanvasPreview from "./previews/canvas.vue";

const toolName = "openCanvas";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description:
    "Open a drawing canvas for the user to create drawings, sketches, or diagrams.",
  parameters: {
    type: "object" as const,
    properties: {
      instructions: {
        type: "string",
        description:
          "Optional instructions or suggestions for what the user should draw",
      },
    },
    required: [],
  },
};

const openCanvas = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  const instructions = args.instructions as string;

  return {
    toolName,
    message: "Drawing canvas opened",
    title: "Drawing Canvas",
    instructions: instructions
      ? `A drawing canvas has been opened. ${instructions}`
      : "A drawing canvas has been opened. You can draw, sketch, or create diagrams using the canvas tools.",
  };
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute: openCanvas,
  generatingMessage: "Opening drawing canvas...",
  isEnabled: () => true,
  viewComponent: CanvasView,
  previewComponent: CanvasPreview,
};
