<template>
  <div class="w-full h-full overflow-auto p-4 bg-white">
    <h1
      v-if="selectedResult?.mulmoScript?.title"
      style="font-size: 2em; margin-bottom: 1em"
    >
      {{ selectedResult.mulmoScript.title }}
    </h1>
    <template v-if="selectedResult?.mulmoScript?.beats">
      <div
        v-for="beat in selectedResult.mulmoScript.beats"
        :key="beat.id"
        style="margin-bottom: 1em"
      >
        <img
          v-if="selectedResult.images?.[beat.id]"
          :src="`data:image/png;base64,${selectedResult.images[beat.id]}`"
          :alt="beat.text"
          style="max-width: 100%; margin: 1em 0"
        />
        <p style="margin-bottom: 1em">{{ beat.text }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  selectedResult: ToolResult | null;
}>();
</script>
