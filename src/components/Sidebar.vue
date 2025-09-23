<template>
  <div class="w-[30%] bg-gray-50 border rounded p-4 flex flex-col space-y-4">
    <!-- Voice chat controls -->
    <div class="space-y-2 flex-shrink-0">
      <button
        v-if="!chatActive"
        @click="$emit('startChat')"
        :disabled="connecting"
        class="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {{ connecting ? "Connecting..." : "Start Voice Chat" }}
      </button>
      <button
        v-else
        @click="$emit('stopChat')"
        class="w-full px-4 py-2 bg-red-600 text-white rounded"
      >
        Stop Voice Chat
      </button>
      <audio ref="audioEl" autoplay></audio>
    </div>

    <!-- Generated images container -->
    <div class="flex-1 flex flex-col min-h-0">
      <div
        ref="imageContainer"
        class="border rounded p-2 overflow-y-auto space-y-2 flex-1"
      >
        <div
          v-if="!pluginResults.length && !isGeneratingImage"
          class="text-gray-500 text-sm"
        >
          Feel free to ask me any questions...
        </div>
        <div
          v-for="(result, index) in pluginResults"
          :key="index"
          class="cursor-pointer hover:opacity-75 transition-opacity border rounded p-2"
          :class="{ 'ring-2 ring-blue-500': selectedResult === result }"
          @click="$emit('selectResult', result)"
        >
          <img
            v-if="result.imageData"
            :src="`data:image/png;base64,${result.imageData}`"
            class="max-w-full h-auto rounded"
            alt="Generated image"
          />
          <div
            v-else-if="result.toolName === 'exaSearch'"
            class="text-center p-4 bg-purple-50 rounded"
          >
            <div class="text-purple-600 font-medium">🔍 Search Result</div>
            <div class="text-xs text-gray-600 mt-1 truncate">
              {{
                result.jsonData?.query ||
                extractQueryFromMessage(result.message)
              }}
            </div>
          </div>
          <div
            v-else-if="result.url"
            class="text-center p-4 bg-blue-50 rounded"
          >
            <div class="text-blue-600 font-medium">🌐 Web Page</div>
            <div class="text-xs text-gray-600 mt-1 truncate">
              {{ result.title || result.url }}
            </div>
          </div>
          <div
            v-else-if="result.htmlData"
            class="text-center p-4 bg-green-50 rounded"
          >
            <div class="text-green-600 font-medium">📄 Presentation</div>
            <div class="text-xs text-gray-600 mt-1 truncate">
              {{ result.title || "Interactive content" }}
            </div>
          </div>
          <div
            v-else-if="result.location"
            class="text-center p-4 bg-blue-50 rounded"
          >
            <div class="text-blue-600 font-medium">🗺️ Map Location</div>
            <div class="text-xs text-gray-600 mt-1 truncate">
              {{
                typeof result.location === "string"
                  ? result.location
                  : `${result.location.lat}, ${result.location.lng}`
              }}
            </div>
          </div>
          <div
            v-else-if="result.toolName === 'playOthello'"
            class="p-3 bg-green-50 rounded"
          >
            <div v-if="result.jsonData" class="space-y-1">
              <!-- Othello board display -->
              <div class="flex justify-center">
                <div
                  class="inline-block"
                  style="background-color: #2d5016; padding: 1px"
                >
                  <div class="grid grid-cols-8" style="gap: 1px">
                    <template
                      v-for="(row, rowIndex) in result.jsonData.board"
                      :key="rowIndex"
                    >
                      <div
                        v-for="(cell, colIndex) in row"
                        :key="`${rowIndex}-${colIndex}`"
                        class="w-4 h-4 flex items-center justify-center"
                        style="background-color: #3d6b20"
                      >
                        <div
                          v-if="cell === 'B'"
                          class="w-3 h-3 bg-black rounded-full"
                        ></div>
                        <div
                          v-else-if="cell === 'W'"
                          class="w-3 h-3 bg-white rounded-full"
                        ></div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <!-- Game info -->
              <div class="text-xs text-center space-y-1">
                <div v-if="!result.jsonData.isTerminal" class="text-gray-600">
                  {{ result.jsonData.currentSide === "B" ? "⚫" : "⚪" }}
                  {{
                    capitalizeFirst(
                      result.jsonData.playerNames[result.jsonData.currentSide],
                    )
                  }}
                  to play
                </div>
                <div v-else class="font-medium">
                  {{ getGameResult(result.jsonData) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center p-4 bg-gray-50 rounded">
            <div class="text-gray-600 font-medium">📋 Text Result</div>
            <div class="text-xs text-gray-500 mt-1 truncate">
              {{ result.message }}
            </div>
          </div>
        </div>
        <div
          v-if="isGeneratingImage"
          class="flex items-center justify-center py-4"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <span class="ml-2 text-sm text-gray-600">{{
            generatingMessage
          }}</span>
        </div>
      </div>
    </div>

    <div class="space-y-2 flex-shrink-0">
      <input
        :value="userInput"
        @input="
          $emit('update:userInput', ($event.target as HTMLInputElement).value)
        "
        @keyup.enter.prevent="$emit('sendTextMessage')"
        :disabled="!chatActive"
        type="text"
        placeholder="Type a message"
        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        @click="$emit('sendTextMessage')"
        :disabled="!chatActive || !userInput.trim()"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Send Message
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, defineProps, defineEmits } from "vue";
import type { ToolResult } from "../tools/type";

defineProps<{
  chatActive: boolean;
  connecting: boolean;
  pluginResults: ToolResult[];
  isGeneratingImage: boolean;
  generatingMessage: string;
  selectedResult: ToolResult | null;
  userInput: string;
}>();

defineEmits<{
  startChat: [];
  stopChat: [];
  selectResult: [result: ToolResult];
  sendTextMessage: [];
  "update:userInput": [value: string];
}>();

const audioEl = ref<HTMLAudioElement | null>(null);
const imageContainer = ref<HTMLDivElement | null>(null);

function scrollToBottomOfImageContainer(): void {
  nextTick(() => {
    if (imageContainer.value) {
      imageContainer.value.scrollTop = imageContainer.value.scrollHeight;
    }
  });
}

function extractQueryFromMessage(message: string): string {
  const match = message.match(/relevant results for "([^"]+)"/);
  return match ? match[1] : message;
}

function getGameResult(gameState: any): string {
  if (!gameState.isTerminal) return "";
  if (gameState.winner === "draw") return "Draw!";
  if (gameState.winner === "B") return "⚫ Black Wins!";
  if (gameState.winner === "W") return "⚪ White Wins!";
  return "Game Over";
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

defineExpose({
  audioEl,
  scrollToBottomOfImageContainer,
});
</script>
