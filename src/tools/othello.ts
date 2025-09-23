import { ToolPlugin, ToolContext, ToolResult } from "./type";
import { playOthello, Command, OthelloState, Side, Cell } from "./othelloLogic";

const toolName = "playOthello";

const toolDefinition = {
  type: "function" as const,
  name: toolName,
  description:
    "Play Othello/Reversi game with the user. You can start a new game, make moves, or pass turns.",
  parameters: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["new_game", "move", "pass"],
        description:
          "The action to perform: start a new game, make a move, or pass the turn",
      },
      row: {
        type: "number",
        description:
          "Row position for the move (0-7, required for 'move' action)",
        minimum: 0,
        maximum: 7,
      },
      col: {
        type: "number",
        description:
          "Column position for the move (0-7, required for 'move' action)",
        minimum: 0,
        maximum: 7,
      },
      board: {
        type: "array",
        description:
          "Current 8x8 board state (required for 'move' and 'pass' actions)",
        items: {
          type: "array",
          items: {
            type: "string",
            enum: [".", "B", "W"],
          },
        },
      },
      currentSide: {
        type: "string",
        enum: ["B", "W"],
        description:
          "Current player's side (required for 'move' and 'pass' actions)",
      },
    },
    required: ["action"],
    additionalProperties: false,
  },
};

const othello = async (
  context: ToolContext,
  args: Record<string, any>,
): Promise<ToolResult> => {
  try {
    let command: Command;

    if (args.action === "new_game") {
      const randomAssignment = Math.random() < 0.5;
      command = {
        action: "new_game",
        playerNames: randomAssignment
          ? { B: "computer", W: "user" }
          : { B: "user", W: "computer" },
      };
    } else if (args.action === "move") {
      if (
        typeof args.row !== "number" ||
        typeof args.col !== "number" ||
        !args.board ||
        !args.currentSide
      ) {
        throw new Error(
          "Move action requires row, col, board, and currentSide parameters",
        );
      }
      command = {
        action: "move",
        row: args.row,
        col: args.col,
        board: args.board,
        currentSide: args.currentSide as Side,
      };
    } else if (args.action === "pass") {
      if (!args.board || !args.currentSide) {
        throw new Error(
          "Pass action requires board and currentSide parameters",
        );
      }
      command = {
        action: "pass",
        board: args.board,
        currentSide: args.currentSide as Side,
      };
    } else {
      throw new Error(`Unknown action: ${args.action}`);
    }

    const state = playOthello(command);

    let message = "";
    if (state.lastAction.type === "new_game") {
      message = "Started a new Othello game! Black (●) goes first.";
    } else if (state.lastAction.type === "move") {
      message = `Played at (${state.lastAction.row}, ${state.lastAction.col}) and flipped ${state.lastAction.flipped} pieces.`;
    } else if (state.lastAction.type === "pass") {
      message = "Passed the turn.";
    }

    if (state.isTerminal) {
      if (state.winner === "draw") {
        message += " Game over - it's a draw!";
      } else if (state.winner) {
        message += ` Game over - ${state.winner === "B" ? "Black" : "White"} wins!`;
      }
    }

    return {
      toolName,
      message,
      jsonData: state,
      instructions:
        "The game state has been updated. Show the board and provide information about the current state. If it's the user's turn, suggest legal moves they can make. Otherwise, make a move.",
    };
  } catch (error) {
    console.error("*** Othello game error", error);
    return {
      toolName,
      message: `Othello game error: ${error instanceof Error ? error.message : "Unknown error"}`,
      instructions:
        "Acknowledge that there was an error with the Othello game and suggest trying again.",
    };
  }
};

export const plugin: ToolPlugin = {
  toolDefinition,
  execute: othello,
  generatingMessage: "Processing Othello move...",
  isEnabled: () => true,
};
