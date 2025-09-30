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
          @click="generateMovie"
          :disabled="isGenerating"
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
          :style="{
            opacity: isGenerating ? 0.6 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
          }"
        >
          <span class="material-icons" style="font-size: 1.2em">{{
            isGenerating ? "hourglass_empty" : "movie"
          }}</span>
          {{ isGenerating ? "Generating..." : "Generate Movie" }}
        </button>
      </div>
    </div>
    <template v-if="selectedResult?.mulmoScript?.beats">
      <div
        v-for="beat in selectedResult.mulmoScript.beats"
        :key="beat.id"
        style="margin-bottom: 1em"
      >
        <img
          v-if="beat.id && selectedResult.images?.[beat.id]"
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
import { ref } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
}>();

const isGenerating = ref(false);

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

const generateMovie = async () => {
  if (!props.selectedResult?.mulmoScript || isGenerating.value) return;

  isGenerating.value = true;

  try {
    const response = await fetch("/api/generate-movie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mulmoScript: props.selectedResult.mulmoScript,
        uuid: props.selectedResult.uuid,
        images: props.selectedResult.images,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.details || error.error || "Failed to generate movie",
      );
    }

    const result = await response.json();
    alert(`Movie generated successfully!\nPath: ${result.outputPath}`);
  } catch (error) {
    console.error("Movie generation failed:", error);
    alert(
      `Failed to generate movie: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    isGenerating.value = false;
  }
};
</script>
