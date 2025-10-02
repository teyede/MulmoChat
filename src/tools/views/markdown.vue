<template>
  <div class="w-full h-full overflow-y-auto bg-white">
    <div
      v-if="!selectedResult.markdown"
      class="min-h-full p-8 flex items-center justify-center"
    >
      <div class="text-gray-500">No markdown content available</div>
    </div>
    <div v-else class="min-h-full p-4">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1em;
        "
      >
        <h1 style="font-size: 2em; margin: 0">
          {{ selectedResult.title || 'Document' }}
        </h1>
        <button
          @click="downloadMarkdown"
          style="
            padding: 0.5em 1em;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 0.5em;
          "
        >
          <span class="material-icons" style="font-size: 1.2em">download</span>
          Markdown
        </button>
      </div>
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

const downloadMarkdown = () => {
  if (!props.selectedResult?.markdown) return;

  const blob = new Blob([props.selectedResult.markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const filename = props.selectedResult.title
    ? `${props.selectedResult.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    : "document.md";
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
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
