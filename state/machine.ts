import { createMachine } from "xstate";
import { create } from "zustand";
import xstate from "zustand-middleware-xstate";
import type { Store } from "zustand-middleware-xstate";
import {
  _activateCard,
  _canEscape,
  _deal,
  _escape,
  _newGame,
  _roomCompleted,
  deck,
  player,
  room,
  useStore,
} from "./store";
import { Howl } from "howler";

const gameOver = new Howl({
  src: ["/audio/8bit-explode7.wav"],
});

const machine = createMachine(
  {
    id: "game",
    initial: "menu",
    states: {
      menu: {
        on: {
          NEW_GAME: "game",
        },
      },
      game: {
        on: {
          END_GAME: "menu",
        },
        initial: "start",
        onDone: [],
        states: {
          start: {
            invoke: {
              src: "newGame",
              onDone: "deal",
            },
          },
          deal: {
            invoke: {
              src: "deal",
              onDone: "playerTurn",
            },
          },
          playerTurn: {
            on: {
              ACTIVATE_CARD: "activateCard",
              ESCAPE: { cond: "canEscape", target: "escape" },
            },
          },
          escape: {
            invoke: {
              src: "escape",
              onDone: "deal",
            },
          },
          activateCard: {
            invoke: {
              src: "activateCard",
              onDone: "endTurn",
            },
          },
          endTurn: {
            always: [
              { cond: "isDungeonComplete", target: "win" },
              { cond: "isHealthDepleted", target: "lose" },
              {
                cond: "roomComplete",
                actions: ["roomCompleted"],
                target: "deal",
              },
              { target: "playerTurn" },
            ],
          },
          win: {
            on: {
              NEW_GAME: "start",
            },
          },
          lose: {
            on: {
              NEW_GAME: "start",
            },
            invoke: { src: "lose" },
          },
        },
      },
    },
  },
  {
    services: {
      newGame: async () => _newGame(),
      deal: async () => setTimeout(_deal, 500),
      // @ts-ignore
      activateCard: async (context: unknown, event: { index: number }) => {
        _activateCard(event.index);
      },
      lose: async () => {
        gameOver.play();
      },
      escape: async () => _escape(),
    },
    actions: {
      roomCompleted: () => _roomCompleted(),
    },
    guards: {
      isDungeonComplete: () =>
        deck.entities[0].deck.cards.length === 0 &&
        room.entities[0].room.cards.length === 0,
      isHealthDepleted: () => player.entities[0].player.health <= 0,
      roomComplete: () => room.entities[0].room.cards.length === 0,
      canEscape: () => _canEscape(),
    },
  }
);

export const useStateMachine = create<Store<typeof machine>>()(xstate(machine));
