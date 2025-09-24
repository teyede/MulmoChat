<template>
  <div
    v-if="selectedResult?.toolName === 'pushMulmoScript'"
    class="w-full h-full overflow-auto p-4 bg-white"
    v-html="selectedResult.htmlData"
  />
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  selectedResult: ToolResult | null;
}>();
</script>