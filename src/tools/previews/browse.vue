<template>
  <div
    v-if="result.toolName === 'browse'"
    class="text-center p-4 bg-blue-50 rounded"
  >
    <div class="text-blue-600 font-medium">🌐 Web Page</div>
    <div class="text-xs text-gray-600 mt-1 truncate">
      {{ result.title || result.url }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>
