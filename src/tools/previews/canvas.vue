<template>
  <div
    class="flex items-center justify-center p-2 bg-gray-50 rounded border min-h-[60px]"
  >
    <!-- Show thumbnail if drawing exists -->
    <div
      v-if="hasDrawing"
      class="w-full h-full flex items-center justify-center"
    >
      <img
        :src="drawingImage"
        alt="Drawing thumbnail"
        class="max-w-full max-h-full object-contain rounded"
        style="max-height: 56px;"
      />
    </div>

    <!-- Show icon if no drawing -->
    <div v-else class="flex items-center gap-2 text-gray-600">
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
      <span class="text-sm font-medium">Drawing Canvas</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  result: ToolResult;
}>();

const hasDrawing = computed(() => {
  return props.result?.jsonData?.drawingState?.imageData;
});

const drawingImage = computed(() => {
  return props.result?.jsonData?.drawingState?.imageData || "";
});
</script>
