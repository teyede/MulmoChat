import { ToolPlugin, ToolContext, ToolResult } from "./type";
import CanvasView from "./views/canvas.vue";
import CanvasPreview from "./previews/canvas.vue";

const toolName = "openCanvas";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description:
    "Open a drawing canvas for the user to create drawings, sketches, or diagrams.",
};

const openCanvas = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  return {
    toolName,
    message: "Drawing canvas opened",
    title: "Drawing Canvas",
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
