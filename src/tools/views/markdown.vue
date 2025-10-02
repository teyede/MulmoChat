<template>
  <div class="w-full h-full overflow-y-auto bg-white">
    <div
      v-if="!selectedResult.markdown"
      class="min-h-full p-8 flex items-center justify-center"
    >
      <div class="text-gray-500">No markdown content available</div>
    </div>
    <div v-else class="min-h-full p-8">
      <div
        class="markdown-content prose prose-slate max-w-none"
        v-html="renderedHtml"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const renderedHtml = computed(() => {
  if (!props.selectedResult.markdown) {
    console.error("No markdown data in result:", props.selectedResult);
    return "";
  }
  console.log("Rendering markdown:", props.selectedResult.markdown);
  return marked(props.selectedResult.markdown);
});
</script>

<style scoped>
.markdown-content :deep(h1) {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h2) {
  font-size: 1.75rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h5) {
  font-size: 1.125rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-content :deep(h6) {
  font-size: 1rem;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}
</style>
