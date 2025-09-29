<template>
  <div class="bg-green-50 rounded overflow-hidden">
    <div
      v-if="firstBeatImage"
      class="w-full aspect-video bg-gray-200"
      style="position: relative"
    >
      <img
        :src="`data:image/png;base64,${firstBeatImage}`"
        :alt="result.mulmoScript?.title || 'Presentation'"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="p-2">
      <div class="text-green-600 font-medium text-sm truncate">
        {{ result.mulmoScript?.title || result.title || "Presentation" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";
import { computed } from "vue";

const props = defineProps<{
  result: ToolResult;
}>();

const firstBeatImage = computed(() => {
  const firstBeat = props.result.mulmoScript?.beats?.[0];
  if (firstBeat?.id && props.result.images?.[firstBeat.id]) {
    return props.result.images[firstBeat.id];
  }
  return null;
});
</script>
