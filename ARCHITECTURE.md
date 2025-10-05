# MulmoChat Architecture

## Overview

MulmoChat is a prototype **AI-native operating system** designed from the ground up to leverage Large Language Models (LLMs) and their function calling capabilities. Unlike traditional operating systems where users navigate through menus and launch applications, MulmoChat uses **conversation as the primary interface** and provides **installable capabilities** instead of standalone applications.

## Core Philosophy

### Conversation-First Interface

The fundamental shift in MulmoChat is that **voice/text chat replaces the traditional GUI** as the primary interaction model:

- **No application launcher** - No icons, no start menu, no app switcher
- **Natural language intent** - Users express what they want to do in plain language
- **LLM orchestration** - The AI model automatically routes requests to appropriate capabilities
- **Context-aware responses** - The system adapts its interface based on conversation flow

### Capabilities, Not Applications

Traditional operating systems organize functionality into **applications** - monolithic bundles of UI, logic, and data. MulmoChat introduces a new paradigm:

| Traditional OS | MulmoChat |
|----------------|-----------|
| Application with fixed UI | Capability plugin with dynamic views |
| User browses and launches apps | LLM invokes tools based on intent |
| App-centric workflow | Task-centric conversation |
| Static menu of features | Dynamic capability discovery |

**Capabilities** in MulmoChat are:
- **Modular plugins** that provide specific functionality
- **Declaratively registered** with the LLM via function definitions
- **UI-agnostic** in their core logic, with context-specific view components
- **Composable** - LLM can chain multiple tools to accomplish complex tasks

### Function Calling as Operating System Primitive

In traditional operating systems, applications communicate with the kernel through **system calls**. In MulmoChat:

- **OpenAI's function calling** becomes the fundamental IPC mechanism
- **Plugins register tool definitions** that describe their capabilities
- **LLM acts as the scheduler/router** deciding when and how to invoke tools
- **WebRTC data channel** serves as the communication bus

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  ┌────────────────┐                    ┌─────────────────┐  │
│  │   Sidebar      │                    │  Main Canvas    │  │
│  │  - Voice UI    │                    │  - Dynamic View │  │
│  │  - Tool Prev.  │                    │  - Tool Result  │  │
│  └────────────────┘                    └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      App.vue (Core)                          │
│  - WebRTC Connection Management                              │
│  - Tool Execution Engine                                     │
│  - Result State Management                                   │
│  - Dynamic Component Rendering                               │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────┐
│   Plugin System          │  │  WebRTC to OpenAI    │
│   (src/tools/)           │  │  Realtime API        │
│                          │  │                      │
│  - Tool Registry         │  │  - Voice Streams     │
│  - Execution Dispatch    │  │  - Function Calls    │
│  - Result Formatting     │  │  - Message Exchange  │
└──────────────────────────┘  └──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Ecosystem                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Image   │  │  Browse  │  │   Map    │  │  Music   │   │
│  │   Gen    │  │   Web    │  │ Location │  │ Playback │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Canvas  │  │ Markdown │  │  Othello │  │   Quiz   │   │
│  │  Drawing │  │   Docs   │  │   Game   │  │Interactive│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Mulmocast │  │   Exa    │  │   Edit   │                  │
│  │ Podcast  │  │  Search  │  │  Image   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. App.vue - System Kernel

**Location**: `src/App.vue`

**Responsibilities**:
- **WebRTC orchestration** - Manages connection to OpenAI Realtime API
- **Audio streaming** - Bidirectional voice communication
- **Tool execution** - Generic plugin invocation framework
- **State management** - Tool results, UI state, conversation state
- **Dynamic rendering** - Component selection based on tool results

**Key Functions**:
- `startChat()` (line 298) - Initializes WebRTC connection with ephemeral key
- `messageHandler()` (line 251) - Processes OpenAI events (function calls, responses)
- `processToolCall()` (line 143) - Executes plugin with context and arguments
- `sendTextMessage()` (line 400) - Sends user text input to LLM
- `handleSelectResult()` (line 447) - Updates selected result for main canvas

**Design Principle**: App.vue remains **completely plugin-agnostic**. It knows nothing about specific tools - only the generic `ToolPlugin` interface.

#### 2. Plugin System

**Location**: `src/tools/`

##### Core Interface (`type.ts`)

```typescript
// Plugin contract that all tools must implement
export interface ToolPlugin {
  toolDefinition: {
    type: "function";
    name: string;
    description: string;
    parameters?: {
      type: "object";
      properties: { [key: string]: any };
      required: string[];
    };
  };
  execute: (
    context: ToolContext,
    args: Record<string, any>
  ) => Promise<ToolResult>;
  generatingMessage: string;
  waitingMessage?: string;
  isEnabled: (startResponse?: StartApiResponse) => boolean;
  delayAfterExecution?: number;
  viewComponent?: any;      // Vue component for main canvas
  previewComponent?: any;   // Vue component for sidebar thumbnail
}
```

**Key Interfaces**:

- **`ToolContext`** (line 15) - Execution context passed to plugins
  - `currentResult` - Currently selected tool result (for updates/edits)

- **`ToolResult`** (line 19) - Standardized plugin output
  - `message` - Status message sent back to LLM
  - `title` - Display title
  - `jsonData` - Structured data for LLM
  - `instructions` - Follow-up instructions for LLM
  - `data` - Tool-specific data for views
  - `viewState` - Persistent view state
  - `updating` - Flag to update existing result vs create new

- **`ToolPlugin`** (line 37) - Plugin contract
  - `toolDefinition` - OpenAI function calling schema
  - `execute()` - Main execution logic
  - `viewComponent` - Full-screen view component
  - `previewComponent` - Sidebar thumbnail component

**Plugin Registry**:
- `pluginList` (line 62) - Array of all available plugins
- `pluginTools()` (line 76) - Generates tool definitions for OpenAI session
- `toolExecute()` (line 90) - Dispatches execution to appropriate plugin
- `getToolPlugin()` (line 108) - Retrieves plugin metadata

##### Plugin Structure

Each plugin follows a consistent pattern:

**Plugin File** (e.g., `generateImage.ts`):
```typescript
// 1. Tool definition (OpenAI function schema)
const toolDefinition = {
  type: "function" as const,
  name: "generateImage",
  description: "Generate an image from a text prompt.",
  parameters: { /* ... */ }
};

// 2. Execute function
const generateImage = async (
  context: ToolContext,
  args: Record<string, any>
): Promise<ToolResult> => {
  // Implementation
  return {
    data: { imageData, prompt },
    message: "image generation succeeded",
    instructions: "Acknowledge the image was generated."
  };
};

// 3. Export plugin
export const plugin: ToolPlugin = {
  toolDefinition,
  execute: generateImage,
  generatingMessage: "Generating image...",
  isEnabled: () => true,
  viewComponent: ImageView,
  previewComponent: ImagePreview
};
```

**View Component** (`views/image.vue`):
- Full-screen display in main canvas
- Receives `selectedResult` prop
- Can emit `update-result` to modify result data

**Preview Component** (`previews/image.vue`):
- Thumbnail display in sidebar
- Receives `result` prop
- Compact representation for history

#### 3. WebRTC Communication Layer

**Connection Flow**:

1. **Session Initialization** (`startChat()`):
   ```
   Client → /api/start → Server
   Server → OpenAI API → Ephemeral Key
   Server → Client (ephemeralKey + API keys)
   ```

2. **WebRTC Setup**:
   ```
   Create RTCPeerConnection
   Create data channel "oai-events"
   Add audio tracks (microphone → LLM)
   Create offer SDP
   POST to OpenAI /v1/realtime/calls
   Receive answer SDP
   Connection established
   ```

3. **Session Configuration**:
   ```json
   {
     "type": "session.update",
     "session": {
       "model": "gpt-realtime",
       "instructions": "system prompt + user language",
       "tools": [/* plugin tool definitions */]
     }
   }
   ```

**Message Types**:

- **From OpenAI**:
  - `response.text.delta` - Incremental text response
  - `response.function_call_arguments.delta` - Incremental function args
  - `response.function_call_arguments.done` - Complete function call
  - `response.created` / `response.done` - Conversation state
  - `error` - Error messages

- **To OpenAI**:
  - `conversation.item.create` - User message or function output
  - `response.create` - Trigger LLM response
  - `session.update` - Update system configuration

#### 4. Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User speaks/types: "Show me a picture of Mount Fuji"     │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. OpenAI LLM processes intent                               │
│    - Analyzes conversation context                           │
│    - Decides to call generateImage function                  │
│    - Extracts parameters: { prompt: "Mount Fuji" }          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Function call arrives via WebRTC data channel             │
│    Event: response.function_call_arguments.done              │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. messageHandler() processes event                          │
│    - Parses function name and arguments                      │
│    - Checks for duplicate calls (deduplication)              │
│    - Calls processToolCall()                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. processToolCall() orchestrates execution                  │
│    - Sets generatingMessage ("Generating image...")          │
│    - Creates ToolContext with currentResult                  │
│    - Sends waitingMessage to LLM (if configured)             │
│    - Calls toolExecute()                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. toolExecute() dispatches to plugin                        │
│    - Looks up plugin by name in registry                     │
│    - Calls plugin.execute(context, args)                     │
│    - Adds UUID and toolName to result                        │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Plugin executes (generateImage in this case)              │
│    - Calls /api/generate-image with prompt                   │
│    - Receives base64 image data                              │
│    - Returns ToolResult with imageData, message, instructions│
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. processToolCall() handles result                          │
│    - If updating=true: updates existing result               │
│    - Else: adds new result to toolResults array              │
│    - Sets as selectedResult (displays in main canvas)        │
│    - Scrolls sidebar to bottom, canvas to top                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Send function output back to OpenAI                       │
│    conversation.item.create with:                            │
│    - type: "function_call_output"                            │
│    - call_id: original call ID                               │
│    - output: { status, data }                                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Send follow-up instructions (if any)                     │
│     response.create with:                                    │
│     - instructions: "Acknowledge the image was generated"    │
│     (Triggers LLM to speak acknowledgment)                   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. UI updates                                               │
│     - Sidebar shows image preview                            │
│     - Main canvas shows full ImageView component             │
│     - LLM speaks: "Here's Mount Fuji for you"               │
└─────────────────────────────────────────────────────────────┘
```

**Key Implementation Details**:

- **Deduplication** (line 278): `processedToolCalls` Map prevents duplicate execution
- **Incremental parsing** (line 272): Function arguments arrive in deltas, assembled via `pendingToolArgs`
- **Result updating** (line 173): Tools can update existing results instead of creating new ones
- **Context passing** (line 154): `currentResult` enables tools to access previously selected result
- **Async execution** (line 171): Tools execute asynchronously while maintaining UI responsiveness

### Server Architecture

**Location**: `server/`

**Components**:
- **Express server** (`index.ts`) - HTTP server, static file serving
- **API routes** (`routes/api.ts`) - REST endpoints for tool backends
- **Types** (`types.ts`) - TypeScript interfaces

**Key Endpoints**:
- `GET /api/start` - Creates ephemeral OpenAI key, returns API keys
- `POST /api/generate-image` - Google Gemini image generation
- `GET /api/search` - Search API proxy
- `GET /api/twitter-embed/:tweetId` - Twitter embed fetching

## Plugin Ecosystem

### Current Plugins

| Plugin | Description | View | Preview |
|--------|-------------|------|---------|
| **generateImage** | Google Gemini image generation | Full image display | Thumbnail |
| **editImage** | Image editing with Gemini | Image editor | Thumbnail |
| **browse** | Web browsing with content extraction | Embedded iframe | URL preview |
| **exa** | AI-powered search with Exa API | Search results list | Result count |
| **map** | Google Maps location & directions | Interactive map | Location pin |
| **mulmocast** | Podcast/presentation generation | Video player | Episode info |
| **music** | Music playback control | Audio player | Now playing |
| **othello** | Interactive Othello game | Game board | Board state |
| **canvas** | Drawing and manipulation | Canvas editor | Drawing preview |
| **markdown** | Markdown document rendering | Formatted doc | Doc icon |
| **quiz** | Interactive quiz functionality | Quiz interface | Question preview |

### Plugin Capabilities

Plugins can:
- **Make API calls** - To external services or internal server endpoints
- **Update existing results** - Set `updating: true` to modify current view
- **Provide follow-up instructions** - Guide LLM's next response
- **Store view state** - Maintain UI state across interactions
- **Access context** - Use currently selected result as input
- **Control timing** - Set `delayAfterExecution` for pacing

### Adding a New Plugin

1. **Create plugin file** (`src/tools/myPlugin.ts`):
```typescript
import { ToolPlugin, ToolContext, ToolResult } from "./type";
import MyView from "./views/myPlugin.vue";
import MyPreview from "./previews/myPlugin.vue";

const toolDefinition = {
  type: "function" as const,
  name: "myPlugin",
  description: "What this plugin does",
  parameters: {
    type: "object" as const,
    properties: {
      param1: { type: "string", description: "..." }
    },
    required: ["param1"]
  }
};

const execute = async (
  context: ToolContext,
  args: Record<string, any>
): Promise<ToolResult> => {
  // Implementation
  return {
    data: { /* tool-specific data */ },
    message: "success",
    instructions: "Tell user what happened"
  };
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute,
  generatingMessage: "Processing...",
  isEnabled: () => true,
  viewComponent: MyView,
  previewComponent: MyPreview
};
```

2. **Create view component** (`src/tools/views/myPlugin.vue`):
```vue
<template>
  <div class="w-full h-full overflow-auto">
    <!-- Your UI here -->
    {{ selectedResult.data }}
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  selectedResult: ToolResult;
}>();
</script>
```

3. **Create preview component** (`src/tools/previews/myPlugin.vue`):
```vue
<template>
  <div class="truncate">
    {{ result.title || "Preview" }}
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>
```

4. **Register plugin** in `src/tools/type.ts`:
```typescript
import * as MyPlugin from "./myPlugin";

const pluginList = [
  // ... existing plugins
  MyPlugin,
];
```

That's it. The LLM can now use your plugin.

## Design Patterns & Principles

### 1. Separation of Concerns

**Plugin Logic ≠ UI**:
- Plugin execute functions are pure business logic
- View components handle presentation
- App.vue orchestrates but doesn't know plugin details

**Benefits**:
- Plugins can be tested independently
- UI can evolve without touching logic
- Same plugin can have multiple view modes

### 2. Declarative Capability Registration

Plugins **declare** what they can do via `toolDefinition`:
```typescript
{
  name: "generateImage",
  description: "Generate an image from a text prompt.",
  parameters: { /* OpenAPI schema */ }
}
```

The LLM **discovers** capabilities automatically and decides when to use them.

### 3. Context-Aware Execution

Every plugin receives `ToolContext`:
```typescript
{
  currentResult: ToolResult | null
}
```

This enables:
- **Chaining** - Next tool can use previous result
- **Updating** - Tools can modify existing results
- **State continuity** - Plugins understand conversation context

Example: `editImage` uses `context.currentResult.data.imageData` as input.

### 4. Asynchronous, Non-Blocking

All plugin execution is async:
- UI remains responsive during long operations
- Multiple tools can be called in sequence
- LLM receives updates incrementally

### 5. Result-Oriented Architecture

Everything revolves around **ToolResult**:
- Created by plugins
- Stored in `toolResults` array
- Selected for display via `selectedResult`
- Rendered by dynamic component selection

Results are **persistent** while tools are **ephemeral**.

### 6. Dynamic Component Rendering

```vue
<component
  v-if="selectedResult && getToolPlugin(selectedResult.toolName)?.viewComponent"
  :is="getToolPlugin(selectedResult.toolName).viewComponent"
  :key="selectedResult.uuid"
  :selected-result="selectedResult"
/>
```

UI adapts to content, not the other way around.

## State Management

### Application State

| State | Location | Purpose |
|-------|----------|---------|
| `chatActive` | App.vue ref | WebRTC connection status |
| `connecting` | App.vue ref | Connection in progress |
| `conversationActive` | App.vue ref | LLM actively responding |
| `isMuted` | App.vue ref | Microphone mute state |
| `toolResults` | App.vue ref | Array of all tool results (history) |
| `selectedResult` | App.vue ref | Currently displayed result |
| `isGeneratingImage` | App.vue ref | Tool execution in progress |
| `generatingMessage` | App.vue ref | Status message during execution |
| `userInput` | App.vue ref | Text input field value |
| `userLanguage` | App.vue ref | User's preferred language |
| `webrtc` | App.vue object | WebRTC connection objects |

### Plugin State

Plugins are **stateless** - they don't maintain internal state between invocations.

State is stored in:
- **ToolResult.data** - Plugin-specific data for rendering
- **ToolResult.viewState** - UI state (scroll position, selections, etc.)

### Persistent State

| Data | Storage | Key |
|------|---------|-----|
| User language | localStorage | `user_language_v1` |

System prompt and API keys are managed server-side.

## Communication Protocols

### WebRTC Data Channel

**Channel**: `oai-events`

**Message Format**: JSON

**Send to OpenAI**:
```typescript
// Configure session
{
  type: "session.update",
  session: { /* config */ }
}

// Send user message
{
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "..." }]
  }
}

// Send function output
{
  type: "conversation.item.create",
  item: {
    type: "function_call_output",
    call_id: "...",
    output: "JSON string"
  }
}

// Trigger response
{
  type: "response.create",
  response: { instructions: "..." }
}
```

**Receive from OpenAI**:
```typescript
// Text response (incremental)
{ type: "response.text.delta", delta: "..." }

// Function call (incremental)
{ type: "response.function_call_arguments.delta", delta: "..." }

// Function call complete
{
  type: "response.function_call_arguments.done",
  name: "toolName",
  call_id: "...",
  arguments: "{...}"
}

// Conversation state
{ type: "response.created" }
{ type: "response.done" }

// Errors
{ type: "error", error: {...} }
```

### HTTP API

**Client → Server**:
- `GET /api/start` - Initialize session, get ephemeral key
- `POST /api/generate-image` - Generate image via Gemini
- `GET /api/search?q=...` - Search query
- `GET /api/twitter-embed/:id` - Fetch tweet embed

**Server → External APIs**:
- OpenAI API - Ephemeral key generation
- Google Gemini - Image generation
- Exa API - AI-powered search
- Google Maps API - Location services

## Security Model

### API Key Management

**Server-Side**:
- OpenAI API key stored in server environment
- Creates ephemeral keys with limited scope
- Ephemeral keys expire after session

**Client-Side**:
- Receives ephemeral OpenAI key (single-use)
- Receives Google Maps API key (browser-restricted)
- Never has access to long-lived credentials

### Isolation

- Each plugin executes in isolated scope
- No shared global state between plugins
- WebRTC peer connection isolated per session

## Performance Considerations

### Optimizations

1. **Incremental Updates**:
   - Function arguments arrive in deltas
   - Text responses stream incrementally
   - UI updates reactively

2. **Deduplication**:
   - `processedToolCalls` Map prevents duplicate execution
   - Call ID tracking for idempotency

3. **Lazy Loading**:
   - Components loaded on-demand
   - View components only rendered when selected

4. **Efficient Rendering**:
   - Dynamic component with `:key="uuid"`
   - Prevents unnecessary re-renders
   - Component reuse where possible

### Scalability

**Current Limitations**:
- Single WebRTC connection per session
- All tool results stored in memory
- No result persistence across sessions

**Future Improvements**:
- Result pagination/virtualization
- IndexedDB for local persistence
- Service worker for offline capability
- Plugin lazy loading on demand

## Comparison: Traditional OS vs AI-Native OS

| Aspect | Traditional OS | MulmoChat (AI-Native) |
|--------|----------------|------------------------|
| **Primary Interface** | GUI (windows, menus, icons) | Conversation (voice/text chat) |
| **Application Model** | Monolithic apps with bundled UI | Modular capability plugins |
| **User Workflow** | Browse → Launch → Navigate | Speak → LLM routes → Result |
| **Discoverability** | App store, search, menus | Natural language, LLM suggests |
| **IPC Mechanism** | System calls, message passing | Function calling protocol |
| **State Management** | App lifecycle, persistence | Ephemeral tools, persistent results |
| **UI Paradigm** | Fixed application windows | Dynamic, context-aware views |
| **Multitasking** | Multiple app windows | Conversation history with previews |
| **Learning Curve** | Learn each app's interface | Learn to express intent in language |

## Future Directions

### Plugin Marketplace

- **Discovery**: Browse available capabilities
- **Installation**: Add plugins without code changes
- **Versioning**: Manage plugin updates
- **Sandboxing**: Secure plugin execution

### Advanced LLM Orchestration

- **Tool Composition**: LLM chains multiple tools automatically
  - Example: "Create a presentation about Tokyo" → search + generateImage + mulmocast
- **Parallel Execution**: Multiple tools invoked simultaneously
- **Conditional Logic**: LLM decides execution flow based on intermediate results

### Persistent Context

- **Long-Term Memory**: Conversation history across sessions
- **User Preferences**: Learned from interaction patterns
- **Project Workspaces**: Group related tool results
- **Cross-Session Resume**: Pick up where you left off

### Multi-Modal Native

- **Voice First**: Optimized for hands-free interaction
- **Image Understanding**: Upload images, LLM analyzes and acts
- **Video Processing**: Clips, editing, generation
- **Screen Sharing**: LLM sees and helps with what you're doing

### Ambient Computing

- **Always-On**: Background processing, proactive suggestions
- **Context Awareness**: Location, time, activity-aware
- **Multi-Device**: Seamless across phone, desktop, wearables
- **Interruption Handling**: Smart notification and focus management

### Collaborative Intelligence

- **Multi-User Sessions**: Shared conversation, collaborative editing
- **Agent Delegation**: LLM spawns sub-agents for complex tasks
- **Human-in-Loop**: LLM asks for clarification when uncertain
- **Expertise Routing**: Different LLMs for different domains

## Key Insights

### Why This Works

1. **LLMs as Universal Interface**: Natural language is the most flexible UI - no training needed
2. **Function Calling Maturity**: OpenAI's function calling is reliable enough for production use
3. **Separation of Intent and Implementation**: User expresses *what*, LLM decides *how*
4. **Composability**: Small, focused capabilities combine to accomplish complex tasks
5. **Context Preservation**: Conversation maintains state naturally

### Design Trade-offs

**Gains**:
- ✅ Zero learning curve for basic usage
- ✅ Discoverability through conversation
- ✅ Flexible, adaptive interface
- ✅ Easy to add new capabilities
- ✅ Natural multitasking via conversation history

**Challenges**:
- ⚠️ Requires reliable LLM (latency, availability)
- ⚠️ Ambiguous intent handling
- ⚠️ Determinism (same input may yield different tool calls)
- ⚠️ Privacy (conversation sent to LLM)
- ⚠️ Discoverability of advanced features

### Paradigm Shift

Traditional computing: **"I want to use App X to do Y"**
- User must know what app to use
- User must learn how to use app
- User navigates through app UI

AI-native computing: **"I want to do Y"**
- System figures out what capabilities to use
- System composes capabilities as needed
- System presents results in context-appropriate UI

This is the fundamental shift MulmoChat demonstrates: from **application-centric** to **intent-centric** computing.

## Conclusion

MulmoChat is not just a chatbot with plugins - it's a **proof of concept for a new operating system paradigm** where:

- **Conversation replaces GUI** as the primary interface
- **LLM orchestration replaces app switching** as the workflow model
- **Capabilities replace applications** as the unit of functionality
- **Function calling replaces system calls** as the IPC primitive
- **Dynamic views replace static windows** as the presentation layer

By building from the ground up with LLMs as a first-class primitive, MulmoChat demonstrates that the future of human-computer interaction may be fundamentally conversational, with the computer understanding intent and dynamically assembling the right capabilities to help - no icons, menus, or app launchers required.

The architecture described in this document provides a foundation for exploring this AI-native computing paradigm and pushing the boundaries of what's possible when we truly embrace LLMs as the operating system of the future.
