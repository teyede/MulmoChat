<template>
  <div class="p-4 space-y-4">
    <div role="toolbar" class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        MulmoChat
        <span class="text-sm text-gray-500 font-normal"
          >NLUI of AI-native Operating System</span
        >
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
        :plugin-results="toolResults"
        :is-generating-image="isGeneratingImage"
        :generating-message="generatingMessage"
        :selected-result="selectedResult"
        :user-input="userInput"
        :is-muted="isMuted"
        @start-chat="startChat"
        @stop-chat="stopChat"
        @toggle-mute="toggleMute"
        @select-result="handleSelectResult"
        @send-text-message="sendTextMessage"
        @update:user-input="userInput = $event"
        @upload-images="handleUploadImages"
      />

      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <div class="flex-1 border rounded bg-gray-50 overflow-hidden">
          <component
            v-if="
              selectedResult &&
              getToolPlugin(selectedResult.toolName)?.viewComponent
            "
            :is="getToolPlugin(selectedResult.toolName).viewComponent"
            :selected-result="selectedResult"
            :send-text-message="sendTextMessage"
            :google-map-key="startResponse?.googleMapKey || null"
            @update-result="handleUpdateResult"
          />
          <div
            v-if="!selectedResult"
            class="w-full h-full flex items-center justify-center"
          >
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
  toolExecute,
  ToolResult,
  ToolContext,
  getToolPlugin,
} from "./tools/type";
import { createUploadedImageResult } from "./tools/generateImage";
import type { StartApiResponse } from "../server/types";
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
const toolResults = ref<ToolResult[]>([]);
const isGeneratingImage = ref(false);
const generatingMessage = ref("");
const pendingToolArgs: Record<string, string> = {};
const showConfigPopup = ref(false);
const selectedResult = ref<ToolResult | null>(null);
const userInput = ref("");
const startResponse = ref<StartApiResponse | null>(null);

watch(systemPrompt, (val) => {
  localStorage.setItem(SYSTEM_PROMPT_KEY, val);
});

const chatActive = ref(false);
const conversationActive = ref(false);
const isMuted = ref(false);

const webrtc = {
  pc: null as RTCPeerConnection | null,
  dc: null as RTCDataChannel | null,
  localStream: null as MediaStream | null,
  remoteStream: null as MediaStream | null,
};

const sleep = async (milliseconds: number) => {
  return await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function scrollToBottomOfSideBar(): void {
  sidebarRef.value?.scrollToBottom();
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

async function processToolCall(
  msg: any,
  id: string,
  argStr: string,
): Promise<void> {
  try {
    const args = typeof argStr === "string" ? JSON.parse(argStr) : argStr;
    isGeneratingImage.value = true;
    generatingMessage.value =
      getToolPlugin(msg.name)?.generatingMessage || "Processing...";
    scrollToBottomOfSideBar();
    const context: ToolContext = {
      currentResult: selectedResult.value,
    };
    const promise = toolExecute(context, msg.name, args);
    const waitingMessage = getToolPlugin(msg.name)?.waitingMessage;
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

    // Check if this is an update to the currently selected result
    if (
      result.updating &&
      context.currentResult &&
      result.toolName === context.currentResult.toolName
    ) {
      // Find and update the existing result
      const index = toolResults.value.findIndex(
        (r) => r.uuid === context.currentResult?.uuid,
      );
      if (index !== -1) {
        toolResults.value[index] = result;
      } else {
        console.error("ERR:Failed to find the result to update");
      }
      selectedResult.value = result;
    } else {
      // Add as new result
      toolResults.value.push(result);
      selectedResult.value = result;
      scrollToBottomOfSideBar();
      scrollCurrentResultToTop();
    }

    const outputPayload: Record<string, unknown> = {
      status: result.message,
    };
    if (result.jsonData) {
      outputPayload.data = result.jsonData;
    }
    console.log(`RES:${result.toolName}\n`, outputPayload);
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
      const delay = getToolPlugin(msg.name)?.delayAfterExecution;
      if (delay) {
        await sleep(delay);
      }
      console.log(`INS:${result.toolName}\n${result.instructions}`);
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
  } finally {
    isGeneratingImage.value = false;
    generatingMessage.value = "";
  }
}

async function messageHandler(event: MessageEvent): Promise<void> {
  const msg = JSON.parse(event.data);
  const id = msg.id || msg.call_id;

  switch (msg.type) {
    case "error":
      console.error("Error", msg.error);
      break;

    case "response.text.delta":
      currentText.value += msg.delta;
      break;

    case "response.completed":
      if (currentText.value.trim()) {
        messages.value.push(currentText.value);
      }
      currentText.value = "";
      break;

    case "response.function_call_arguments.delta":
      pendingToolArgs[id] = (pendingToolArgs[id] || "") + msg.delta;
      break;

    case "response.function_call_arguments.done": {
      const argStr = pendingToolArgs[id] || msg.arguments || "";
      delete pendingToolArgs[id];
      await processToolCall(msg, id, argStr);
      break;
    }
    case "response.created":
      conversationActive.value = true;
      break;
    case "response.done":
      conversationActive.value = false;
      break;
  }
}

async function startChat(): Promise<void> {
  // Gard against double start
  if (chatActive.value || connecting.value) return;

  connecting.value = true;

  // Call the start API endpoint to get ephemeral key
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

    if (!startResponse.value?.ephemeralKey) {
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
        Authorization: `Bearer ${startResponse.value.ephemeralKey}`,
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

async function sendTextMessage(providedText?: string): Promise<void> {
  const text = (providedText || userInput.value).trim();
  if (!text) return;

  // Wait for conversation to be active (up to 5 seconds)
  for (let i = 0; i < 5 && conversationActive.value; i++) {
    console.log(`WAIT:${i} \n`, text);
    await sleep(1000);
  }

  const dc = webrtc.dc;
  if (!chatActive.value || !dc || dc.readyState !== "open") {
    console.warn(
      "Cannot send text message because the data channel is not ready.",
    );
    return;
  }

  console.log(`MSG:\n`, text);
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
  if (!providedText) {
    userInput.value = "";
  }
}

function handleSelectResult(result: ToolResult): void {
  selectedResult.value = result;
  scrollCurrentResultToTop();
}

function handleUpdateResult(updatedResult: ToolResult): void {
  // Update the result in the pluginResults array using uuid comparison
  const index = toolResults.value.findIndex(
    (r) => r.uuid === updatedResult.uuid,
  );
  if (index !== -1) {
    toolResults.value[index] = updatedResult;
  }
  // Update the selected result only if it matches the updated result
  if (selectedResult.value?.uuid === updatedResult.uuid) {
    selectedResult.value = updatedResult;
  }
}

function handleUploadImages(
  imageDataArray: string[],
  fileNamesArray: string[],
): void {
  imageDataArray.forEach((imageData, index) => {
    const fileName = fileNamesArray[index];
    const result = createUploadedImageResult(
      imageData,
      fileName,
      "Uploaded by the user",
    );

    // Add UUID to make it a complete ToolResult
    const completeResult = {
      ...result,
      uuid: crypto.randomUUID(),
    };

    toolResults.value.push(completeResult);
    selectedResult.value = completeResult;
  });

  scrollToBottomOfSideBar();
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
  isMuted.value = false;
}

function toggleMute(): void {
  if (webrtc.localStream) {
    const audioTracks = webrtc.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    isMuted.value = !isMuted.value;
  }
}
</script>

<style scoped></style>
