<template>
  <div class="w-full h-full overflow-y-auto bg-white">
    <div v-if="!selectedResult.markdown" class="min-h-full p-8 flex items-center justify-center">
      <div class="text-gray-500">No markdown content available</div>
    </div>
    <div v-else class="min-h-full p-8">
      <div
        class="prose prose-slate max-w-none"
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
