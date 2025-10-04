<template>
  <div class="w-full h-full overflow-y-auto">
    <div class="min-h-full flex flex-col p-4">
      <div
        v-if="selectedResult.title"
        class="mb-4 text-center"
      >
        <h2 class="text-2xl font-bold text-gray-900">
          {{ selectedResult.title }}
        </h2>
      </div>
      <div
        ref="musicContainer"
        class="flex-1 flex items-center justify-center bg-white rounded-lg p-4"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { ToolResult } from "../type";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const musicContainer = ref<HTMLElement | null>(null);
let osmd: OpenSheetMusicDisplay | null = null;

const renderMusic = async () => {
  if (!musicContainer.value || !props.selectedResult.htmlData) {
    return;
  }

  try {
    // Clear previous rendering
    musicContainer.value.innerHTML = "";

    // Create new OSMD instance
    osmd = new OpenSheetMusicDisplay(musicContainer.value, {
      autoResize: true,
      backend: "svg",
      drawTitle: false,
    });

    // Load and render the MusicXML
    await osmd.load(props.selectedResult.htmlData);
    await osmd.render();
  } catch (error) {
    console.error("Error rendering music:", error);
    if (musicContainer.value) {
      musicContainer.value.innerHTML = `<div class="text-red-500">Error rendering sheet music: ${error instanceof Error ? error.message : "Unknown error"}</div>`;
    }
  }
};

onMounted(() => {
  renderMusic();
});

watch(
  () => props.selectedResult.htmlData,
  () => {
    renderMusic();
  },
);
</script>
