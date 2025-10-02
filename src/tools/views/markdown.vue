<template>
  <div class="w-full h-full overflow-y-auto">
    <div class="min-h-full p-8">
      <div
        class="prose prose-slate dark:prose-invert max-w-none"
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
  if (!props.selectedResult.htmlData) return "";
  return marked(props.selectedResult.htmlData);
});
</script>
