<template>
  <div class="w-full h-full p-4">
    <GoogleMap
      :location="selectedResult.location"
      :api-key="googleMapKey"
      :zoom="15"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";
import GoogleMap from "../../components/GoogleMap.vue";

defineProps<{
  selectedResult: ToolResult | null;
  googleMapKey: string | null;
}>();
</script>
