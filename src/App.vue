<template>
  <div class="p-4 space-y-4">
    <div role="toolbar" class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        MulmoChat
        <span class="text-sm text-gray-500 font-normal">Multi-modal Chat</span>
      </h1>
      <button
        @click="showConfigPopup = true"
        class="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        title="Configuration"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Main content area with sidebar -->
    <div class="flex space-x-4" style="height: calc(100vh - 80px)">
      <Sidebar
        ref="sidebarRef"
        :chat-active="chatActive"
        :connecting="connecting"
        :plugin-results="pluginResults"
        :is-generating-image="isGeneratingImage"
        :generating-message="generatingMessage"
        :selected-result="selectedResult"
        :user-input="userInput"
        @start-chat="startChat"
        @stop-chat="stopChat"
        @select-result="handleSelectResult"
        @send-text-message="sendTextMessage"
        @update:user-input="userInput = $event"
      />

      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <div class="flex-1 border rounded bg-gray-50 overflow-hidden">
          <div
            v-if="selectedResult?.url && isTwitterUrl(selectedResult.url)"
            class="w-full h-full overflow-auto p-4 bg-white"
          >
            <div
              v-if="twitterEmbedData[selectedResult.url]"
              v-html="twitterEmbedData[selectedResult.url]"
            />
            <div
              v-else-if="twitterEmbedData[selectedResult.url] === null"
              class="h-full flex items-center justify-center"
            >
              <div class="text-center">
                <div class="text-gray-600 mb-4">
                  Unable to load Twitter embed
                </div>
                <a
                  :href="selectedResult.url"
                  target="_blank"
                  class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Open on Twitter/X
                </a>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
                ></div>
                <div class="text-gray-600">Loading Twitter embed...</div>
              </div>
            </div>
          </div>
          <iframe
            v-else-if="selectedResult?.url"
            :src="selectedResult.url"
            class="w-full h-full rounded"
            frameborder="0"
          />
          <div
            v-else-if="
              selectedResult?.toolName === 'exaSearch' &&
              selectedResult?.jsonData
            "
            class="w-full h-full overflow-auto p-6 bg-white"
          >
            <div class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">
                Search Results
                <span
                  v-if="selectedResult.jsonData.query"
                  class="text-lg font-normal text-gray-600"
                >
                  for "{{ selectedResult.jsonData.query }}"
                </span>
              </h2>
              <div class="space-y-6">
                <div
                  v-for="(result, index) in selectedResult.jsonData.results ||
                  selectedResult.jsonData"
                  :key="index"
                  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3
                        class="text-lg font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <a
                          :href="result.url"
                          target="_blank"
                          class="hover:underline"
                        >
                          {{ result.title }}
                        </a>
                      </h3>
                      <p class="text-sm text-gray-500 mt-1">{{ result.url }}</p>
                      <p
                        v-if="result.text"
                        class="text-gray-700 mt-2 line-clamp-3"
                      >
                        {{ result.text }}
                      </p>
                      <div
                        v-if="result.highlights && result.highlights.length"
                        class="mt-3"
                      >
                        <p class="text-sm font-medium text-gray-600 mb-1">
                          Key highlights:
                        </p>
                        <div class="space-y-1">
                          <p
                            v-for="(
                              highlight, hIndex
                            ) in result.highlights.slice(0, 3)"
                            :key="hIndex"
                            class="text-sm text-gray-600 italic"
                          >
                            "{{ highlight }}"
                          </p>
                        </div>
                      </div>
                      <p
                        v-if="result.publishedDate"
                        class="text-xs text-gray-400 mt-2"
                      >
                        Published:
                        {{
                          new Date(result.publishedDate).toLocaleDateString()
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="selectedResult?.htmlData"
            class="w-full h-full overflow-auto p-4 bg-white"
            v-html="selectedResult.htmlData"
          />
          <div
            v-else-if="selectedResult?.imageData"
            class="w-full h-full flex items-center justify-center p-4"
          >
            <img
              :src="`data:image/png;base64,${selectedResult.imageData}`"
              class="max-w-full max-h-full object-contain rounded"
              alt="Current generated image"
            />
          </div>
          <div
            v-else-if="selectedResult?.location && googleMapKey"
            class="w-full h-full p-4"
          >
            <GoogleMap
              :location="selectedResult.location"
              :api-key="googleMapKey"
              :zoom="15"
            />
          </div>
          <div
            v-else-if="selectedResult?.toolName === 'playOthello'"
            class="w-full h-full flex items-center justify-center p-4"
          >
            <canvas
              ref="othelloCanvas"
              width="480"
              height="520"
              class="border border-gray-300 rounded"
              @click="handleOthelloCanvasClick"
            />
          </div>
          <div v-else class="w-full h-full flex items-center justify-center">
            <div class="text-gray-400 text-lg">Canvas</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Popup -->
    <div
      v-if="showConfigPopup"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showConfigPopup = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Configuration</h2>
          <button
            @click="showConfigPopup = false"
            class="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
            </label>
            <textarea
              v-model="systemPrompt"
              placeholder="You are a helpful assistant."
              class="w-full border rounded px-3 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="flex justify-end">
            <button
              @click="showConfigPopup = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import {
  pluginTools,
  pluginExecute,
  ToolContext,
  ToolResult,
  pluginGeneratingMessage,
  pluginWaitingMessage,
  pluginDelayAfterExecution,
} from "./tools/type";
import type { StartApiResponse } from "../server/types";
import GoogleMap from "./components/GoogleMap.vue";
import Sidebar from "./components/Sidebar.vue";

const SYSTEM_PROMPT_KEY = "system_prompt_v2";
const DEFAULT_SYSTEM_PROMPT =
  "You are a teacher who explains various things in a way that even middle school students can easily understand. When words alone are not enough, you MUST use the generateImage API to draw pictures and use them to help explain. When you are talking about places, objects, people, movies, books and other things, you MUST use the generateImage API to draw pictures to make the conversation more engaging.";
const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null);
const connecting = ref(false);
const systemPrompt = ref(
  localStorage.getItem(SYSTEM_PROMPT_KEY) || DEFAULT_SYSTEM_PROMPT,
);
const messages = ref<string[]>([]);
const currentText = ref("");
const pluginResults = ref<ToolResult[]>([]);
const isGeneratingImage = ref(false);
const generatingMessage = ref("");
const pendingToolArgs: Record<string, string> = {};
const showConfigPopup = ref(false);
const selectedResult = ref<ToolResult | null>(null);
const userInput = ref("");
const twitterEmbedData = ref<{ [key: string]: string }>({});
const googleMapKey = ref<string | null>(null);
const startResponse = ref<StartApiResponse | null>(null);
const othelloCanvas = ref<HTMLCanvasElement | null>(null);

watch(systemPrompt, (val) => {
  localStorage.setItem(SYSTEM_PROMPT_KEY, val);
});

watch(selectedResult, (newResult) => {
  if (newResult?.url && isTwitterUrl(newResult.url)) {
    handleTwitterEmbed(newResult.url);
  }
  if (newResult?.toolName === "playOthello" && newResult.jsonData) {
    nextTick(() => {
      renderOthelloBoard(newResult.jsonData);
    });
  }
});
const chatActive = ref(false);

const webrtc = {
  pc: null as RTCPeerConnection | null,
  dc: null as RTCDataChannel | null,
  localStream: null as MediaStream | null,
  remoteStream: null as MediaStream | null,
};

const sleep = async (milliseconds: number) => {
  return await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function renderOthelloBoard(gameState: any): void {
  const canvas = othelloCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cellSize = 60;
  const boardSize = 8;

  // Clear canvas
  ctx.fillStyle = "#3d6b20";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw turn indicator at the top
  const currentPlayer = gameState.playerNames[gameState.currentSide];
  const colorName = gameState.currentSide === "B" ? "Black" : "White";
  const turnText = `Current Turn: ${currentPlayer} (${colorName})`;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(turnText, canvas.width / 2, 20);

  // Adjust board position to account for turn indicator
  const boardOffsetY = 40;

  // Draw grid lines
  ctx.strokeStyle = "#2d5016";
  ctx.lineWidth = 2;
  for (let i = 0; i <= boardSize; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * cellSize, boardOffsetY);
    ctx.lineTo(i * cellSize, boardOffsetY + boardSize * cellSize);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, boardOffsetY + i * cellSize);
    ctx.lineTo(boardSize * cellSize, boardOffsetY + i * cellSize);
    ctx.stroke();
  }

  // Draw pieces
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = gameState.board[row][col];
      if (cell !== ".") {
        const centerX = col * cellSize + cellSize / 2;
        const centerY = boardOffsetY + row * cellSize + cellSize / 2;
        const radius = cellSize / 2 - 5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = cell === "B" ? "#000000" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // Draw position labels on legal moves (light grey, no background highlighting)
  // Only show playable cells when it's the human player's turn
  const isComputerTurn =
    gameState.playerNames &&
    gameState.playerNames[gameState.currentSide] === "computer";
  if (
    gameState.legalMoves &&
    gameState.legalMoves.length > 0 &&
    !isComputerTurn
  ) {
    ctx.fillStyle = "#cccccc";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const move of gameState.legalMoves) {
      const centerX = move.col * cellSize + cellSize / 2;
      const centerY = boardOffsetY + move.row * cellSize + cellSize / 2;
      const label = String.fromCharCode(65 + move.col) + (move.row + 1);
      ctx.fillText(label, centerX, centerY);
    }
  }
}

function handleOthelloCanvasClick(event: MouseEvent): void {
  const canvas = othelloCanvas.value;
  if (!canvas || !selectedResult.value?.jsonData) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const boardOffsetY = 40;
  const col = Math.floor(x / 60);
  const row = Math.floor((y - boardOffsetY) / 60);

  if (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const gameState = selectedResult.value.jsonData;

    // Check if this is a legal move
    const isLegalMove = gameState.legalMoves?.some(
      (move: any) => move.row === row && move.col === col,
    );

    if (isLegalMove && !gameState.isTerminal) {
      // Convert coordinates to chess notation (A-H, 1-8)
      const columnLetter = String.fromCharCode(65 + col); // A-H
      const rowNumber = row + 1; // 1-8
      userInput.value = `I want to play at ${columnLetter}${rowNumber}, which is column=${col}, row=${row} `;
      sendTextMessage();
    }
  }
}

function scrollToBottomOfImageContainer(): void {
  sidebarRef.value?.scrollToBottomOfImageContainer();
}

function scrollCurrentResultToTop(): void {
  nextTick(() => {
    const mainContent = document.querySelector(
      ".flex-1.border.rounded.bg-gray-50.overflow-hidden",
    );
    if (mainContent) {
      const scrollableElement = mainContent.querySelector(
        "iframe, .w-full.h-full.overflow-auto, .w-full.h-full.flex",
      );
      if (scrollableElement) {
        if (scrollableElement.tagName === "IFRAME") {
          try {
            scrollableElement.contentWindow?.scrollTo(0, 0);
          } catch (e) {
            // Cross-origin iframe, can't scroll
          }
        } else {
          scrollableElement.scrollTop = 0;
        }
      }
    }
  });
}

function isTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "twitter.com" ||
      urlObj.hostname === "www.twitter.com" ||
      urlObj.hostname === "x.com" ||
      urlObj.hostname === "www.x.com"
    );
  } catch {
    return false;
  }
}

async function fetchTwitterEmbed(url: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/twitter-embed?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      throw new Error(`Twitter embed API error: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.html : null;
  } catch (error) {
    console.error("Failed to fetch Twitter embed:", error);
    return null;
  }
}

async function handleTwitterEmbed(url: string): Promise<void> {
  if (!isTwitterUrl(url) || url in twitterEmbedData.value) {
    return;
  }

  const embedHtml = await fetchTwitterEmbed(url);
  console.log("*** Twitter embed", url, embedHtml);
  twitterEmbedData.value[url] = embedHtml;
}

async function processToolCall(msg: any): Promise<void> {
  const id = msg.id || msg.call_id;
  try {
    const argStr = pendingToolArgs[id] || msg.arguments || "";
    const args = typeof argStr === "string" ? JSON.parse(argStr) : argStr;
    delete pendingToolArgs[id];
    isGeneratingImage.value = true;
    generatingMessage.value = pluginGeneratingMessage(msg.name);
    scrollToBottomOfImageContainer();
    const context: PluginContext = {
      images: [],
    };
    if (selectedResult.value?.imageData) {
      context.images = [selectedResult.value.imageData];
    }
    const promise = pluginExecute(context, msg.name, args);
    const waitingMessage = pluginWaitingMessage(msg.name);
    if (waitingMessage) {
      webrtc.dc?.send(
        JSON.stringify({
          type: "response.create",
          response: {
            instructions: waitingMessage,
            // e.g., the model might say: "Your image is ready."
          },
        }),
      );
    }

    const result = await promise;
    isGeneratingImage.value = false;
    pluginResults.value.push(result);
    selectedResult.value = result;
    scrollToBottomOfImageContainer();
    scrollCurrentResultToTop();

    const outputPayload: Record<string, unknown> = {
      status: result.message,
    };
    if (result.jsonData) {
      outputPayload.data = result.jsonData;
    }
    console.log("*** Function call output", outputPayload);
    webrtc.dc?.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: msg.call_id,
          output: JSON.stringify(outputPayload),
        },
      }),
    );
    if (result.instructions) {
      const delay = pluginDelayAfterExecution(msg.name);
      if (delay) {
        await sleep(delay);
      }
      console.log(
        "*** Sending instructions after function call:",
        result.instructions,
      );
      webrtc.dc?.send(
        JSON.stringify({
          type: "response.create",
          response: {
            instructions: result.instructions,
          },
        }),
      );
    }
  } catch (e) {
    console.error("Failed to parse function call arguments", e);
    // Let the model know that we failed to parse the function call arguments.
    webrtc.dc?.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: msg.call_id,
          output: `Failed to parse function call arguments: ${e}`,
        },
      }),
    );
    // We don't need to send "response.create" here.
  }
}

async function messageHandler(event: MessageEvent): Promise<void> {
  const msg = JSON.parse(event.data);
  // console.log("Message", event.data.length, msg.type);
  if (msg.type === "error") {
    console.error("Error", msg.error);
  }
  if (msg.type === "response.text.delta") {
    currentText.value += msg.delta;
  }
  if (msg.type === "response.completed") {
    if (currentText.value.trim()) {
      messages.value.push(currentText.value);
    }
    currentText.value = "";
  }
  if (msg.type === "response.function_call_arguments.delta") {
    const id = msg.id || msg.call_id;
    pendingToolArgs[id] = (pendingToolArgs[id] || "") + msg.delta;
  }
  if (msg.type === "response.function_call_arguments.done") {
    await processToolCall(msg);
  }
}

async function startChat(): Promise<void> {
  // Gard against double start
  if (chatActive.value || connecting.value) return;

  connecting.value = true;

  // Call the start API endpoint to get ephemeral key
  const config = {
    apiKey: undefined as string | undefined,
  };
  try {
    const response = await fetch("/api/start", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    startResponse.value = await response.json();
    config.apiKey = startResponse.value.ephemeralKey;
    googleMapKey.value = startResponse.value.googleMapKey;

    if (!config.apiKey) {
      throw new Error("No ephemeral key received from server");
    }
  } catch (err) {
    console.error("Failed to get ephemeral key:", err);
    alert("Failed to start session. Check console for details.");
    connecting.value = false;
    return;
  }

  try {
    webrtc.pc = new RTCPeerConnection();

    // Data channel for model events
    const dc = webrtc.pc.createDataChannel("oai-events");
    webrtc.dc = dc;
    dc.addEventListener("open", () => {
      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            model: "gpt-realtime",
            instructions: systemPrompt.value,
            audio: {
              output: {
                voice: "shimmer",
              },
            },
            tools: pluginTools(startResponse.value),
          },
        }),
      );
    });
    dc.addEventListener("message", messageHandler);
    dc.addEventListener("close", () => {
      webrtc.dc = null;
    });

    // Play remote audio
    webrtc.remoteStream = new MediaStream();
    webrtc.pc.ontrack = (event) => {
      webrtc.remoteStream.addTrack(event.track);
    };
    if (sidebarRef.value?.audioEl) {
      sidebarRef.value.audioEl.srcObject = webrtc.remoteStream;
    }

    // Send microphone audio
    webrtc.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    webrtc.localStream
      .getTracks()
      .forEach((track) => webrtc.pc.addTrack(track, webrtc.localStream));

    // Create and send offer SDP
    const offer = await webrtc.pc.createOffer();
    await webrtc.pc.setLocalDescription(offer);

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });
    const responseText = await response.text();

    await webrtc.pc.setRemoteDescription({ type: "answer", sdp: responseText });
    chatActive.value = true;
  } catch (err) {
    console.error(err);
    stopChat();
    alert("Failed to start voice chat. Check console for details.");
  } finally {
    connecting.value = false;
  }
}

function sendTextMessage(): void {
  const text = userInput.value.trim();
  if (!text) return;

  const dc = webrtc.dc;
  if (!chatActive.value || !dc || dc.readyState !== "open") {
    console.warn(
      "Cannot send text message because the data channel is not ready.",
    );
    return;
  }

  console.log("*** Sending text message:", text);
  dc.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    }),
  );
  dc.send(
    JSON.stringify({
      type: "response.create",
      response: {},
    }),
  );

  messages.value.push(`You: ${text}`);
  userInput.value = "";
}

function handleSelectResult(result: ToolResult): void {
  selectedResult.value = result;
  scrollCurrentResultToTop();
}

function stopChat(): void {
  if (webrtc.pc) {
    webrtc.pc.close();
    webrtc.pc = null;
  }
  if (webrtc.dc) {
    webrtc.dc.close();
    webrtc.dc = null;
  }
  if (webrtc.localStream) {
    webrtc.localStream.getTracks().forEach((track) => track.stop());
    webrtc.localStream = null;
  }
  if (webrtc.remoteStream) {
    webrtc.remoteStream.getTracks().forEach((track) => track.stop());
    webrtc.remoteStream = null;
  }
  if (sidebarRef.value?.audioEl) {
    sidebarRef.value.audioEl.srcObject = null;
  }
  chatActive.value = false;
}
</script>

<style scoped></style>
