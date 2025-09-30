<template>
  <div class="w-full h-full overflow-auto p-4 bg-white">
    <div
      v-if="selectedResult?.mulmoScript?.title"
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1em;
      "
    >
      <h1 style="font-size: 2em; margin: 0">
        {{ selectedResult.mulmoScript.title }}
      </h1>
      <div style="display: flex; gap: 0.5em">
        <button
          @click="downloadMulmoScript"
          style="
            padding: 0.5em 1em;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 0.5em;
          "
        >
          <span class="material-icons" style="font-size: 1.2em">download</span>
          Script
        </button>
        <button
          v-if="selectedResult?.moviePath"
          @click="downloadMovie"
          style="
            padding: 0.5em 1em;
            background-color: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 0.5em;
          "
        >
          <span class="material-icons" style="font-size: 1.2em">download</span>
          Movie
        </button>
      </div>
    </div>
    <template v-if="selectedResult?.mulmoScript?.beats">
      <div
        v-for="(beat, index) in selectedResult.mulmoScript.beats"
        :key="beat.id"
        style="margin-bottom: 1em"
      >
        <video
          v-if="index === 0 && selectedResult?.moviePath && movieUrl"
          ref="videoEl"
          :src="movieUrl"
          controls
          style="max-width: 100%; margin: 1em 0"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleEnded"
        />
        <img
          v-else-if="beat.id && selectedResult.images?.[beat.id]"
          :src="`data:image/png;base64,${selectedResult.images[beat.id]}`"
          :alt="beat.text"
          style="max-width: 100%; margin: 1em 0"
        />
        <p style="margin-bottom: 1em">{{ beat.text }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
  setMute?: (muted: boolean) => void;
}>();

const movieUrl = ref<string | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);

onUnmounted(() => {
  if (movieUrl.value) {
    URL.revokeObjectURL(movieUrl.value);
  }
});

// Load movie automatically when moviePath exists
watch(
  () => props.selectedResult?.moviePath,
  async (moviePath) => {
    if (!moviePath) return;

    try {
      const response = await fetch("/api/download-movie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moviePath,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load movie");
      }

      const blob = await response.blob();
      if (movieUrl.value) {
        URL.revokeObjectURL(movieUrl.value);
      }
      movieUrl.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("Movie loading failed:", error);
    }
  },
  { immediate: true },
);

const downloadMulmoScript = () => {
  if (!props.selectedResult?.mulmoScript) return;

  const jsonString = JSON.stringify(props.selectedResult.mulmoScript, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mulmoscript.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadMovie = async () => {
  if (!props.selectedResult?.moviePath) return;

  try {
    const response = await fetch("/api/download-movie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        moviePath: props.selectedResult.moviePath,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to download movie");
    }

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : "movie.mp4";

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Movie download failed:", error);
    alert(
      `Failed to download movie: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

const handlePlay = () => {
  props.setMute?.(true);
};

const handlePause = () => {
  props.setMute?.(false);
};

const handleEnded = () => {
  props.setMute?.(false);
};
</script>
