<template>
  <div
    v-if="
      selectedResult?.toolName === 'generateImage' ||
      selectedResult?.toolName === 'editImage'
    "
    class="w-full h-full flex items-center justify-center p-4"
  >
    <img
      :src="`data:image/png;base64,${selectedResult.imageData}`"
      class="max-w-full max-h-full object-contain rounded"
      alt="Current generated image"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  selectedResult: ToolResult | null;
}>();
</script>
