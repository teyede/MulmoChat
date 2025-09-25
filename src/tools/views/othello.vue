<template>
  <div
    v-if="selectedResult?.toolName === 'playOthello'"
    class="w-full h-full flex items-center justify-center p-4"
  >
    <canvas
      ref="othelloCanvas"
      width="480"
      height="520"
      class="border border-gray-300 rounded"
      @click="handleOthelloCanvasClick"
      @mousemove="handleOthelloCanvasMouseMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { ToolResult } from "../type";

const props = defineProps<{
  selectedResult: ToolResult | null;
  userInput: string;
  sendTextMessage: () => void;
}>();

const emit = defineEmits<{
  "update:user-input": [value: string];
}>();

const othelloCanvas = ref<HTMLCanvasElement | null>(null);

watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === "playOthello" && newResult.jsonData) {
      nextTick(() => {
        renderOthelloBoard(newResult.jsonData);
      });
    }
  },
);

function renderOthelloBoard(gameState: any): void {
  const canvas = othelloCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cellSize = 60;
  const boardSize = 8;

  // Clear canvas
  ctx.fillStyle = "#3d6b20";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw turn indicator at the top
  const currentPlayer = gameState.playerNames[gameState.currentSide];
  const colorName = gameState.currentSide === "B" ? "Black" : "White";
  const turnText = `Current Turn: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} (${colorName})`;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(turnText, canvas.width / 2, 20);

  // Adjust board position to account for turn indicator
  const boardOffsetY = 40;

  // Draw grid lines
  ctx.strokeStyle = "#2d5016";
  ctx.lineWidth = 2;
  for (let i = 0; i <= boardSize; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * cellSize, boardOffsetY);
    ctx.lineTo(i * cellSize, boardOffsetY + boardSize * cellSize);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, boardOffsetY + i * cellSize);
    ctx.lineTo(boardSize * cellSize, boardOffsetY + i * cellSize);
    ctx.stroke();
  }

  // Draw pieces
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = gameState.board[row][col];
      if (cell !== ".") {
        const centerX = col * cellSize + cellSize / 2;
        const centerY = boardOffsetY + row * cellSize + cellSize / 2;
        const radius = cellSize / 2 - 5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = cell === "B" ? "#000000" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // Draw position labels on legal moves (light grey, no background highlighting)
  // Only show playable cells when it's the human player's turn
  const isComputerTurn =
    gameState.playerNames &&
    gameState.playerNames[gameState.currentSide] === "computer";
  if (
    gameState.legalMoves &&
    gameState.legalMoves.length > 0 &&
    !isComputerTurn
  ) {
    ctx.fillStyle = "#cccccc";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const move of gameState.legalMoves) {
      const centerX = move.col * cellSize + cellSize / 2;
      const centerY = boardOffsetY + move.row * cellSize + cellSize / 2;
      const label = String.fromCharCode(65 + move.col) + (move.row + 1);
      ctx.fillText(label, centerX, centerY);
    }
  }
}

function handleOthelloCanvasClick(event: MouseEvent): void {
  const canvas = othelloCanvas.value;
  if (!canvas || !props.selectedResult?.jsonData) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const boardOffsetY = 40;
  const col = Math.floor(x / 60);
  const row = Math.floor((y - boardOffsetY) / 60);

  if (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const gameState = props.selectedResult.jsonData;

    // Check if this is a legal move
    const isLegalMove = gameState.legalMoves?.some(
      (move: any) => move.row === row && move.col === col,
    );

    if (isLegalMove && !gameState.isTerminal) {
      // Convert coordinates to chess notation (A-H, 1-8)
      const columnLetter = String.fromCharCode(65 + col); // A-H
      const rowNumber = row + 1; // 1-8
      emit(
        "update:user-input",
        `I want to play at ${columnLetter}${rowNumber}, which is column=${col}, row=${row} `,
      );
      props.sendTextMessage();
    }
  }
}

function handleOthelloCanvasMouseMove(event: MouseEvent): void {
  const canvas = othelloCanvas.value;
  if (!canvas || !props.selectedResult?.jsonData) return;

  const gameState = props.selectedResult.jsonData;
  const isComputerTurn =
    gameState.playerNames &&
    gameState.playerNames[gameState.currentSide] === "computer";

  // Don't change cursor if it's computer's turn or game is over
  if (isComputerTurn || gameState.isTerminal) {
    canvas.style.cursor = "default";
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const boardOffsetY = 40;
  const col = Math.floor(x / 60);
  const row = Math.floor((y - boardOffsetY) / 60);

  if (row >= 0 && row < 8 && col >= 0 && col < 8) {
    // Check if this is a legal move
    const isLegalMove = gameState.legalMoves?.some(
      (move: any) => move.row === row && move.col === col,
    );

    canvas.style.cursor = isLegalMove ? "pointer" : "default";
  } else {
    canvas.style.cursor = "default";
  }
}
</script>
