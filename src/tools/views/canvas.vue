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
        :background-image="undefined"
        :watermark="undefined"
        :initial-image="[]"
        saveAs="png"
        :styles="{
          border: '1px solid #ddd',
          borderRadius: '8px',
        }"
        :lock="false"
        @mousemove="updateCanUndo"
        @mouseup="saveDrawingState"
        @touchend="saveDrawingState"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from "vue";
import VueDrawingCanvas from "vue-drawing-canvas";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

const canvasRef = ref<any>(null);
const canvasImage = ref("");
const brushSize = ref(5);
const brushColor = ref("#000000");

const canvasWidth = ref(800);
const canvasHeight = ref(600);

const canUndo = ref(false);
const canRedo = ref(false);

const undo = () => {
  if (canvasRef.value && canUndo.value) {
    try {
      canvasRef.value.undo();
      canRedo.value = true; // Enable redo after undo
      saveDrawingState();
    } catch (error) {
      console.warn('Undo operation failed:', error);
    }
  }
};

const redo = () => {
  if (canvasRef.value && canRedo.value) {
    try {
      canvasRef.value.redo();
      saveDrawingState();
    } catch (error) {
      console.warn('Redo operation failed:', error);
    }
  }
};

const clear = () => {
  if (canvasRef.value) {
    try {
      canvasRef.value.reset();
      canUndo.value = false;
      canRedo.value = false;
      saveDrawingState();
    } catch (error) {
      console.warn('Clear operation failed:', error);
    }
  }
};


const updateCanUndo = () => {
  if (canvasRef.value) {
    // Check if the canvas has undo/redo history
    // Since vue-drawing-canvas doesn't expose canUndo/canRedo methods,
    // we'll track this manually through the drawing state
    canUndo.value = true; // Assume we can undo after any drawing action
    canRedo.value = false; // Reset redo when new action is performed
  }
};

const saveDrawingState = async () => {
  if (canvasRef.value && props.selectedResult) {
    try {
      const imageData = await canvasRef.value.save();
      const drawingState = {
        imageData,
        brushSize: brushSize.value,
        brushColor: brushColor.value,
        canvasWidth: canvasWidth.value,
        canvasHeight: canvasHeight.value,
      };

      console.log('Saving drawing state:', drawingState);

      const updatedResult = {
        ...props.selectedResult,
        jsonData: {
          ...props.selectedResult.jsonData,
          drawingState,
        },
      };

      emit('updateResult', updatedResult);
    } catch (error) {
      console.error('Failed to save drawing state:', error);
    }
  }
};

const restoreDrawingState = async () => {
  console.log('Attempting to restore drawing state...');
  console.log('Selected result:', props.selectedResult);

  if (props.selectedResult?.jsonData?.drawingState) {
    const state = props.selectedResult.jsonData.drawingState;
    console.log('Found drawing state:', state);

    brushSize.value = state.brushSize || 5;
    brushColor.value = state.brushColor || "#000000";
    canvasWidth.value = state.canvasWidth || 800;
    canvasHeight.value = state.canvasHeight || 600;

    if (state.imageData && canvasRef.value) {
      console.log('Attempting to restore image data...');
      console.log('Canvas ref methods:', Object.keys(canvasRef.value));

      // Wait for canvas to be ready and then restore the image
      await nextTick();
      try {
        // For vue-drawing-canvas, we need to use the correct method
        // The component typically accepts initial images through props
        console.log('Using v-model to restore image');
        canvasImage.value = state.imageData;
      } catch (error) {
        console.warn('Failed to restore canvas image:', error);
        // Fallback to setting the v-model value
        canvasImage.value = state.imageData;
      }
    } else {
      console.log('No image data to restore or canvas ref not available');
    }
  } else {
    console.log('No drawing state found in selectedResult');
  }
};

// Watch for changes to automatically save drawing state
watch([brushSize, brushColor], () => {
  saveDrawingState();
});

// Watch for selectedResult changes to restore state
watch(() => props.selectedResult, async () => {
  if (props.selectedResult?.jsonData?.drawingState) {
    // Add a small delay to ensure canvas is fully mounted
    await new Promise(resolve => setTimeout(resolve, 100));
    await restoreDrawingState();
  }
}, { immediate: true });

onMounted(async () => {
  await nextTick();

  const container = canvasRef.value?.$el?.parentElement;
  if (container) {
    const rect = container.getBoundingClientRect();
    canvasWidth.value = Math.max(600, rect.width - 32);
    canvasHeight.value = Math.max(400, rect.height - 120);
  }

  // Restore state after canvas is mounted with a delay
  setTimeout(() => {
    restoreDrawingState();
  }, 200);
});
</script>
