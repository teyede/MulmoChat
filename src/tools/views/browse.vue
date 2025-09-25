<template>
  <div class="w-full h-full">
    <!-- Twitter embed -->
    <div
      v-if="selectedResult?.url && isTwitterUrl(selectedResult.url)"
      class="overflow-auto p-4 bg-white h-full"
    >
      <div
        v-if="selectedResult.twitterEmbedHtml"
        v-html="selectedResult.twitterEmbedHtml"
      />
      <div
        v-else-if="selectedResult.twitterEmbedHtml === null"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center">
          <div class="text-gray-600 mb-4">Unable to load Twitter embed</div>
          <a
            :href="selectedResult.url"
            target="_blank"
            class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open on Twitter/X
          </a>
        </div>
      </div>
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
          ></div>
          <div class="text-gray-600">Loading Twitter embed...</div>
        </div>
      </div>
    </div>

    <!-- Generic URL iframe -->
    <div
      v-if="selectedResult?.url && !isTwitterUrl(selectedResult.url)"
      class="w-full h-full"
    >
      <iframe
        :src="selectedResult.url"
        class="w-full h-full rounded"
        frameborder="0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
}>();

function isTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "twitter.com" ||
      urlObj.hostname === "www.twitter.com" ||
      urlObj.hostname === "x.com" ||
      urlObj.hostname === "www.x.com"
    );
  } catch {
    return false;
  }
}
</script>
