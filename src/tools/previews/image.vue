<template>
  <img
    v-if="result.imageData"
    :src="result.imageData"
    class="max-w-full h-auto rounded"
    alt="Generated image"
  />
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>
