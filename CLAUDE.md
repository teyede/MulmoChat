# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 application called "MulmoChat" that provides a multi-modal voice chat interface with OpenAI's GPT-4 Realtime API. The application features a comprehensive plugin system with various AI-powered tools including image generation, web browsing, search, mapping, and interactive games.

## Key Commands

- **Development server**: `npm run dev` (runs both client and server concurrently)
- **Client only**: `npm run dev:client`
- **Server only**: `npm run dev:server` or `npm run server`
- **Build for production**: `npm run build` (builds both client and server)
- **Build server only**: `npm run build:server`
- **Lint**: `npm run lint`
- **Format code**: `npm run format`
- **Preview production build**: `npm run preview`
- **Start production**: `npm run start`

## Architecture

### Core Components

- **App.vue** (src/App.vue): Main application component managing WebRTC connection, tool execution, and UI state
- **Sidebar.vue** (src/components/Sidebar.vue): Left panel with voice controls, tool results display, and text input
- **GoogleMap.vue** (src/components/GoogleMap.vue): Google Maps integration component

### Server Architecture

- **Express.js server** (server/index.ts): Handles API endpoints and serves the client
- **API routes** (server/routes/api.ts): REST endpoints for starting sessions, Twitter embeds, and search
- **Types** (server/types.ts): TypeScript interfaces for API responses

### Plugin System

The application implements a comprehensive plugin architecture located in `src/tools/`:

**IMPORTANT**: Keep all plugin-specific code out of App.vue. The plugin system is designed to be modular and self-contained - App.vue should only handle generic plugin execution through the centralized plugin interface.

#### Core Plugin Interface (src/tools/type.ts)
- **ToolPlugin**: Defines plugin structure with tool definition, execute function, and metadata
- **ToolResult**: Standardized result format for all plugins
- **ToolContext**: Provides context like images to plugin execution

#### Available Plugins
1. **generateImage** (src/tools/generateImage.ts): Google Gemini image generation
2. **editImage** (src/tools/editImage.ts): Image editing capabilities
3. **browse** (src/tools/browse.ts): Web browsing and content extraction
4. **exa** (src/tools/exa.ts): AI-powered search using Exa API
5. **map** (src/tools/map.ts): Google Maps location and directions
6. **mulmocast** (src/tools/mulmocast.ts): Podcast/audio content integration
7. **othello** (src/tools/othello.ts): Interactive Othello game with AI

#### Plugin Components and Previews
Each plugin has associated Vue components:
- **Components** (src/tools/views/): Full-view components for displaying tool results
- **Previews** (src/tools/previews/): Sidebar thumbnail previews of tool results

### Key Integration Points

The application integrates multiple AI services and APIs:
1. **OpenAI Realtime API**: Voice chat with WebRTC and function calling
2. **Google Gemini**: Image generation and editing
3. **Exa API**: AI-powered web search
4. **Google Maps API**: Location services and mapping
5. **Twitter API**: Tweet embedding (server-side)

### State Management

- **System prompt**: Stored in localStorage with key `system_prompt_v2`
- **API keys**: Managed server-side with ephemeral keys for client
- **Tool results**: Reactive array of plugin execution results
- **WebRTC state**: Connection status, streams, and data channels
- **UI state**: Selected results, generating status, user input

### WebRTC Flow

1. Client requests ephemeral key from `/api/start` endpoint
2. Creates RTCPeerConnection with data channel for OpenAI communication
3. Establishes media tracks for bidirectional audio
4. Sends session configuration with system prompt and available tools
5. Handles real-time message exchange for voice and function calls
6. Processes tool calls asynchronously and returns results

### Tool Execution Flow

1. OpenAI model decides to call a function based on conversation
2. Function call received via WebRTC data channel
3. Arguments parsed and plugin executed with context
4. Result displayed in sidebar and main canvas
5. Response sent back to OpenAI model
6. Optional follow-up instructions processed

## Mulmocast NPM Package API

### Overview

The mulmocast npm package provides programmatic TypeScript/JavaScript API to create movies from MulmoScript. It exports both Node.js and browser-compatible modules with full TypeScript type definitions.

### Installation

```bash
npm install mulmocast
```

**Requirements**: Node.js >= 20.0.0, FFmpeg installed on system

### Main Entry Points

```typescript
// Node.js import
import { movie, movieFilePath } from 'mulmocast';
import type { MulmoStudioContext, MulmoCanvasDimension, BeatMediaType, MulmoFillOption } from 'mulmocast';

// Package exports:
// - Node: "./lib/index.node.js" (types: "./lib/index.node.d.ts")
// - Browser: "./lib/index.browser.js" (types: "./lib/index.browser.d.ts")
```

### Key Function: `movie()`

The primary function to create a movie from MulmoScript:

```typescript
function movie(context: MulmoStudioContext): Promise<void>
```

**Parameters:**
- `context: MulmoStudioContext` - Studio context object containing:
  - The MulmoScript data (JSON/YAML format with beats)
  - Audio files for each beat
  - Image files for visual content
  - Canvas dimensions and layout settings
  - Output file path and settings
  - Localization options (language, captions)

**Returns:** `Promise<void>` - Resolves when the video MP4 file is created

### Supporting Functions

1. **`movieFilePath(context: MulmoStudioContext): string`**
   ```typescript
   function movieFilePath(context: MulmoStudioContext): string
   ```
   - Generates the output video file path based on the context
   - Returns the full path where the video will be saved

2. **`getVideoPart(inputIndex: number, mediaType: BeatMediaType, duration: number, canvasInfo: MulmoCanvasDimension, fillOption: MulmoFillOption, speed: number)`**
   ```typescript
   function getVideoPart(
     inputIndex: number,
     mediaType: BeatMediaType,
     duration: number,
     canvasInfo: MulmoCanvasDimension,
     fillOption: MulmoFillOption,
     speed: number
   ): { videoId: string; videoPart: string }
   ```
   - Generates video processing parameters for FFmpeg filtering
   - Handles different media types (image, video, screen)
   - Returns video filter configuration with `videoId` and `videoPart`

3. **`getAudioPart(inputIndex: number, duration: number, delay: number, mixAudio: number)`**
   ```typescript
   function getAudioPart(
     inputIndex: number,
     duration: number,
     delay: number,
     mixAudio: number
   ): { audioId: string; audioPart: string }
   ```
   - Creates audio processing parameters for mixing
   - Handles audio trimming, delay, and volume mixing
   - Returns audio filter configuration with `audioId` and `audioPart`

### Usage Pattern

The typical workflow to create a movie:

1. Prepare your MulmoScript JSON with beats defining the content
2. Generate audio files for narration (using audio generation)
3. Prepare image/video files for visuals (using image generation)
4. Create a `MulmoStudioContext` with all resources
5. Call `movie(context)` to generate the final MP4 video

The package uses FFmpeg internally for video generation, combining audio, images, and transitions into a single video file.

### MulmoScript Format

Basic structure:
```typescript
interface MulmoScript {
  $mulmocast: { version: string };
  beats: Array<{
    text: string;
    image?: string;
    audio?: string;
  }>;
}

// Example:
const script: MulmoScript = {
  "$mulmocast": { "version": "1.0" },
  "beats": [
    {
      "text": "Hello World",
      "image": "path/to/image.png",
      "audio": "path/to/audio.mp3"
    }
  ]
};
```

### CLI Alternative

The package also provides CLI commands via the `mulmo` binary:
- `mulmo movie <script.json>` - Generate movie from script
- `mulmo audio <script.json>` - Generate audio only
- `mulmo images <script.json>` - Generate images only

## File Restrictions

- **Do not read src/tools/blank.ts**: This file is too long and should be avoided when analyzing the codebase