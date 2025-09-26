<template>
  <div class="w-full h-full flex flex-col bg-white">
    <div class="flex-shrink-0 p-4 border-b bg-gray-50">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">Brush Size:</label>
            <input
              v-model.number="brushSize"
              type="range"
              min="1"
              max="50"
              class="w-20"
            />
            <span class="text-sm w-8">{{ brushSize }}</span>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">Color:</label>
            <input
              v-model="brushColor"
              type="color"
              class="w-12 h-8 rounded border"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="undo"
            :disabled="!canUndo"
            class="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Undo
          </button>
          <button
            @click="redo"
            :disabled="!canRedo"
            class="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Redo
          </button>
          <button
            @click="clear"
            class="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Clear
          </button>
          <button
            @click="save"
            class="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 p-4 overflow-hidden">
      <VueDrawingCanvas
        ref="canvasRef"
        v-model:image="canvasImage"
        :width="canvasWidth"
        :height="canvasHeight"
        :stroke-type="'dash'"
        :line-cap="'round'"
        :line-join="'round'"
        :fill-shape="false"
        :eraser="false"
        :lineWidth="brushSize"
        :color="brushColor"
        :background-color="'#FFFFFF'"
        :background-image="null"
        :watermark="null"
        :initial-image="[]"
        saveAs="png"
        :styles="{
          border: '1px solid #ddd',
          borderRadius: '8px',
        }"
        :lock="false"
        @mousemove="updateCanUndo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import VueDrawingCanvas from "vue-drawing-canvas";
import type { ToolResult } from "../type";

defineProps<{
  selectedResult: ToolResult | null;
}>();

const canvasRef = ref<any>(null);
const canvasImage = ref("");
const brushSize = ref(5);
const brushColor = ref("#000000");

const canvasWidth = ref(800);
const canvasHeight = ref(600);

const canUndo = computed(() => canvasRef.value?.canUndo() || false);
const canRedo = computed(() => canvasRef.value?.canRedo() || false);

const undo = () => {
  if (canvasRef.value) {
    canvasRef.value.undo();
  }
};

const redo = () => {
  if (canvasRef.value) {
    canvasRef.value.redo();
  }
};

const clear = () => {
  if (canvasRef.value) {
    canvasRef.value.reset();
  }
};

const save = async () => {
  if (canvasRef.value) {
    const imageData = await canvasRef.value.save();
    console.log("Canvas saved:", imageData);
  }
};

const updateCanUndo = () => {
  // This function can be used for manual updates if needed
  // The computed properties will automatically update
};

onMounted(async () => {
  await nextTick();

  const container = canvasRef.value?.$el?.parentElement;
  if (container) {
    const rect = container.getBoundingClientRect();
    canvasWidth.value = Math.max(600, rect.width - 32);
    canvasHeight.value = Math.max(400, rect.height - 120);
  }
});
</script>
