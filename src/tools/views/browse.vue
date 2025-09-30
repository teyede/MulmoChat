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

    <!-- Generic URL iframe or extracted content -->
    <div
      v-if="selectedResult?.url && !isTwitterUrl(selectedResult.url)"
      class="w-full h-full relative flex flex-col"
    >
      <!-- Toggle button -->
      <button
        @click="iframeError = !iframeError"
        class="absolute top-2 right-2 z-10 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
      >
        {{ iframeError ? 'Show iframe' : 'Show extracted' }}
      </button>

      <!-- Extracted content fallback -->
      <div
        v-if="iframeError"
        class="w-full h-full overflow-auto p-6 bg-white"
      >
        <div class="max-w-4xl mx-auto">
          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div class="text-sm text-yellow-800">
              This page cannot be displayed in an iframe. Showing extracted content instead.
            </div>
          </div>

          <!-- Article header -->
          <article>
            <h1 class="text-3xl font-bold mb-3 text-gray-900">{{ extractedTitle }}</h1>

            <div v-if="extractedByline" class="text-sm text-gray-600 mb-2">
              By {{ extractedByline }}
            </div>

            <div v-if="extractedExcerpt" class="text-lg text-gray-700 mb-4 italic border-l-4 border-blue-500 pl-4">
              {{ extractedExcerpt }}
            </div>

            <div class="flex items-center gap-4 mb-6 text-sm text-gray-500">
              <a
                :href="selectedResult.url"
                target="_blank"
                class="text-blue-600 hover:underline"
              >
                Open original page →
              </a>
              <span v-if="extractedLength">{{ extractedLength }} characters</span>
            </div>

            <!-- Main content -->
            <div class="text-gray-800 leading-relaxed">
              <div
                v-for="(paragraph, index) in formattedContent"
                :key="index"
                class="mb-4"
              >
                {{ paragraph }}
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- Iframe (hidden when error occurs) -->
      <div v-show="!iframeError" class="flex-1 min-h-0">
        <iframe
          ref="iframeRef"
          :src="selectedResult.url"
          class="w-full h-full rounded"
          frameborder="0"
          @error="handleIframeError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeError = ref(false);
const iframeLoadTimeout = ref<number | null>(null);

const extractedTitle = computed(() => {
  const jsonData = props.selectedResult?.jsonData;
  return jsonData?.data?.title || props.selectedResult?.title || "Untitled";
});

const extractedByline = computed(() => {
  const jsonData = props.selectedResult?.jsonData;
  return jsonData?.data?.byline || "";
});

const extractedExcerpt = computed(() => {
  const jsonData = props.selectedResult?.jsonData;
  return jsonData?.data?.excerpt || "";
});

const extractedLength = computed(() => {
  const jsonData = props.selectedResult?.jsonData;
  return jsonData?.data?.length || null;
});

const extractedContent = computed(() => {
  const jsonData = props.selectedResult?.jsonData;
  const content = jsonData?.data?.textContent || jsonData?.data?.text;
  if (!content) {
    return "No content available.";
  }
  return content;
});

const formattedContent = computed(() => {
  const content = extractedContent.value;
  if (content === "No content available.") {
    return [content];
  }

  // Split by double newlines for paragraphs, or single newlines if no double newlines exist
  const paragraphs = content.includes('\n\n')
    ? content.split('\n\n')
    : content.split('\n');

  // Filter out empty paragraphs and trim whitespace
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0);
});

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

function handleIframeError(): void {
  console.log("Iframe error detected, showing extracted content");
  iframeError.value = true;
  if (iframeLoadTimeout.value) {
    clearTimeout(iframeLoadTimeout.value);
  }
}

function setupIframeMonitoring(): void {
  iframeError.value = false;

  if (iframeLoadTimeout.value) {
    clearTimeout(iframeLoadTimeout.value);
  }

  // Set a timeout to detect X-Frame-Options blocking
  // Many sites that block iframes won't trigger @error, so we detect load timeout
  iframeLoadTimeout.value = window.setTimeout(() => {
    if (iframeRef.value) {
      try {
        // Try to access iframe content - will throw if blocked by CSP/X-Frame-Options
        const iframeDoc = iframeRef.value.contentDocument;
        if (!iframeDoc || iframeDoc.body?.innerHTML === "") {
          console.log("Iframe blocked by X-Frame-Options or CSP, showing extracted content");
          iframeError.value = true;
        }
      } catch (e) {
        console.log("Iframe access denied, showing extracted content");
        iframeError.value = true;
      }
    }
  }, 3000);
}

// Monitor iframe when selectedResult changes
watch(() => props.selectedResult?.url, (newUrl) => {
  if (newUrl && !isTwitterUrl(newUrl)) {
    setupIframeMonitoring();
  }
}, { immediate: true });

onMounted(() => {
  if (props.selectedResult?.url && !isTwitterUrl(props.selectedResult.url)) {
    setupIframeMonitoring();
  }
});
</script>
