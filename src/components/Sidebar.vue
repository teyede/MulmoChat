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
        Stop
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
          <ImagePreview :result="result" />
          <ExaPreview :result="result" />
          <BrowsePreview :result="result" />
          <MulmocastPreview :result="result" />
          <MapPreview :result="result" />
          <OthelloPreview :result="result" />
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
import ImagePreview from "../tools/previews/image.vue";
import ExaPreview from "../tools/previews/exa.vue";
import BrowsePreview from "../tools/previews/browse.vue";
import MulmocastPreview from "../tools/previews/mulmocast.vue";
import MapPreview from "../tools/previews/map.vue";
import OthelloPreview from "../tools/previews/othello.vue";

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

function scrollToBottom(): void {
  nextTick(() => {
    if (imageContainer.value) {
      imageContainer.value.scrollTop = imageContainer.value.scrollHeight;
    }
  });
}

defineExpose({
  audioEl,
  scrollToBottom,
});
</script>
