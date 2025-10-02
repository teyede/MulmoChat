<template>
  <div class="p-2">
    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
      {{ displayTitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  result: ToolResult;
}>();

const displayTitle = computed(() => {
  // Use the title from the result if available
  if (props.result.title) {
    return props.result.title;
  }

  // Otherwise extract first # heading from markdown
  if (props.result.htmlData) {
    const match = props.result.htmlData.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1];
    }
  }

  return "Markdown Document";
});
</script>
