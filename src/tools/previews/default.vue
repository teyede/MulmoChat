<template>
  <div class="text-center p-4 bg-gray-50 rounded">
    <div class="text-gray-600 font-medium">📋 Text Result</div>
    <div class="text-xs text-gray-500 mt-1 truncate">
      {{ result.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>