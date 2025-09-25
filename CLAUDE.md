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

## File Restrictions

- **Do not read src/tools/blank.ts**: This file is too long and should be avoided when analyzing the codebase