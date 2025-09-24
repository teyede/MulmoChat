<template>
  <div
    v-if="result.location"
    class="text-center p-4 bg-blue-50 rounded"
  >
    <div class="text-blue-600 font-medium">🗺️ Map Location</div>
    <div class="text-xs text-gray-600 mt-1 truncate">
      {{
        typeof result.location === "string"
          ? result.location
          : `${result.location.lat}, ${result.location.lng}`
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

defineProps<{
  result: ToolResult;
}>();
</script>