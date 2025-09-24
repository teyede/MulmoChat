<template>
  <div
    v-if="result.htmlData"
    class="text-center p-4 bg-green-50 rounded"
  >
    <div class="text-green-600 font-medium">📄 Presentation</div>
    <div class="text-xs text-gray-600 mt-1 truncate">
      {{ result.title || "Interactive content" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>