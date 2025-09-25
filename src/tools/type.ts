import * as GenerateImagePlugin from "./generateImage";
import * as EditImagePlugin from "./editImage";
import * as BrowsePlugin from "./browse";
import * as MulmocastPlugin from "./mulmocast";
import * as MapPlugin from "./map";
import * as ExaPlugin from "./exa";
import * as OthelloPlugin from "./othello";
import type { StartApiResponse } from "../../server/types";

export interface ToolContext {
  images: string[];
}

export interface ToolResult {
  toolName: string;
  message: string;
  title?: string;
  imageData?: string;
  url?: string;
  jsonData?: any;
  instructions?: string;
  htmlData?: string;
  location?: string | { lat: number; lng: number };
}

export interface ToolPlugin {
  toolDefinition: {
    type: "function";
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [key: string]: any;
      };
      required: string[];
    };
  };
  execute: (
    context: ToolContext,
    args: Record<string, any>,
  ) => Promise<ToolResult>;
  generatingMessage: string;
  waitingMessage?: string;
  isEnabled: (startResponse?: StartApiResponse) => boolean;
  delayAfterExecution?: number;
  viewComponent?: any; // Vue component for rendering results
}

const pluginList = [
  GenerateImagePlugin,
  EditImagePlugin,
  BrowsePlugin,
  MulmocastPlugin,
  MapPlugin,
  ExaPlugin,
  OthelloPlugin,
];

export const pluginTools = (startResponse?: StartApiResponse) => {
  return pluginList
    .filter((plugin) => plugin.plugin.isEnabled(startResponse))
    .map((plugin) => plugin.plugin.toolDefinition);
};

const plugins = pluginList.reduce(
  (acc, plugin) => {
    acc[plugin.plugin.toolDefinition.name] = plugin.plugin;
    return acc;
  },
  {} as Record<string, ToolPlugin>,
);

export const pluginExecute = (
  context: ToolContext,
  name: string,
  args: Record<string, any>,
) => {
  console.log("******** Plugin execute", name, args);
  const plugin = plugins[name];
  if (!plugin) {
    throw new Error(`Plugin ${name} not found`);
  }
  return plugin.execute(context, args);
};

export const pluginGeneratingMessage = (name: string) => {
  const plugin = plugins[name];
  if (!plugin) {
    throw new Error(`Plugin ${name} not found`);
  }
  return plugin.generatingMessage;
};

export const pluginWaitingMessage = (name: string) => {
  const plugin = plugins[name];
  if (!plugin) {
    throw new Error(`Plugin ${name} not found`);
  }
  return plugin.waitingMessage;
};

export const pluginDelayAfterExecution = (name: string) => {
  const plugin = plugins[name];
  if (!plugin) {
    throw new Error(`Plugin ${name} not found`);
  }
  return plugin.delayAfterExecution;
};

export const pluginViewComponent = (name: string) => {
  const plugin = plugins[name];
  if (!plugin) {
    return null;
  }
  return plugin.viewComponent;
};
