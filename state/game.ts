/**
 * Basic Architecture:
 *
 * - The game logic is an xstate state machine.
 * - The game logic machine is be ingested into react state.
 * - Graphics entities are stored in an ECS and rendered by a system that implements threejs.
 * - The game logic machine pushes updates to the ECS. This is unidirectional and the ECS does not push updates to the machine.
 * - Updates from the logic machine to the ECS are handled using subscriptions to the machine, not directly in the machine.
 * - Audio is handled independently of the ECS and the state machine.
 * - Additional state that does not map to game logic and transitions is stored in zustand.
 *
 * Assumptions of the architecture:
 *
 * - Rendering is mostly independent of game logic.
 * - Game state does not change much, so it's okay to use react state.
 * - Render count should be monitored and a warning thrown if it gets too high.
 *
 * This file is a mixture of game logic and rendering logic. I might separate them later.
 *
 */

import { createMachine, assign } from "xstate";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import xstate from "zustand-middleware-xstate";
import type { Store } from "zustand-middleware-xstate";
import { Animation, CardLayouts, GraphicsEntities } from "./graphics";
import { useArbitraryStore } from "./zustand";
import { Audio } from "./audio";
import { TarotDeck } from "./TarotDeck";
import { rules } from "./rules";

export namespace GameConstants {
  /** Number of cards in the deck. */
  export const DECK_SIZE = 56;
  /** Maximum HP of the player. */
  export const MAX_HEALTH = 20;
}

export namespace GameLogic {
  export interface GameState {
    /** The cards remaining in the deck. */
    deck: number[];
    /** The cards representing the room. */
    room: (number | undefined)[];
    /** The pile of discards. */
    discard: number[];
    /** The player's health. */
    health: number;
    /** Whether the last action was a potion. */
    wasLastActionPotion: boolean;
    /** The player's shield. */
    shield: number;
    /** The damage value of the last monster the player received damage from. */
    lastMonsterBlocked?: number;
    /** Whether the player escaped the last room they were in. */
    didEscapeLastRoom: boolean;
  }

  /** Return a new object holding the default state of a new game. */
  export function DefaultGameState(): GameState {
    return {
      deck: NewDeck(),
      room: [],
      discard: [],
      health: GameConstants.MAX_HEALTH,
      wasLastActionPotion: false,
      shield: 0,
      lastMonsterBlocked: undefined,
      didEscapeLastRoom: false,
    };
  }

  /** Return a new deck of cards. */
  export function NewDeck() {
    return TarotDeck.shuffleArray(TarotDeck.NewDeck());
  }

  /** Start a new game. */
  export function NewGame(state: GameState): GameState {
    // If the deck is already fresh, we use it instead of creating a new one.
    // This allows prioritized preloading of card assets based on the deck order.
    // (Deck initialized on load, but also when user clicks "new game".)
    const newState = DefaultGameState();
    if (state.deck.length === GameConstants.DECK_SIZE) {
      if (!TarotDeck.isShuffled(state.deck)) {
        throw new Error("Ensure the deck is shuffled during initialization.");
      }
      return { ...newState, deck: state.deck };
    }
    return newState;
  }

  /** Deal a room of cards from the deck. */
  export function Deal({ deck, ...state }: GameState): GameState {
    const room = deck.splice(0, 4);
    return { ...state, room, deck };
  }

  /** Fold selected card from the current room. */
  export function FoldCard(
    state: GameState,
    index: number,
    monster = FightMonster,
    potion = DrinkPotion,
    shield = TakeShield
  ): GameState {
    const { suit, value } = TarotDeck.getTarotCard(index);
    let update: Partial<GameState> = {};
    switch (suit) {
      case "swords":
      case "wands":
        update = monster(state, value);
        break;
      case "cups":
        update = potion(state, value);
        break;
      case "pentacles":
        update = shield(state, value);
        break;
      default:
        console.error(`Unknown suit: ${suit}`);
    }
    update.discard = [...state.discard, index];
    update.room = state.room.map((x) => (x === index ? undefined : x));
    return { ...state, ...update };
  }

  /** If card is a monster, deal damage to the player. */
  export function FightMonster(state: GameState, value: number): GameState {
    GameEffects.Hooks.FightMonster(state, value);
    if (
      typeof state.lastMonsterBlocked !== "undefined" &&
      state.lastMonsterBlocked <= value
    )
      state.shield = 0;
    return {
      ...state,
      shield: state.shield,
      lastMonsterBlocked: value,
      health: Math.max(0, state.health - Math.max(0, value - state.shield)),
      wasLastActionPotion: false,
    };
  }

  /** If card is a potion, heal the player. */
  export function DrinkPotion(state: GameState, value: number): GameState {
    GameEffects.Hooks.DrinkPotion(state, value);
    if (!rules.canDrink(state)) return state;
    return {
      ...state,
      health: (state.health += Math.min(
        Math.min(11, value),
        GameConstants.MAX_HEALTH - state.health
      )),
      wasLastActionPotion: true,
    };
  }

  /** If card is a shield, replace the player's shield. */
  export function TakeShield(state: GameState, value: number): GameState {
    GameEffects.Hooks.TakeShield(state, value);
    return {
      ...state,
      shield: Math.min(11, value),
      wasLastActionPotion: false,
      lastMonsterBlocked: undefined,
    };
  }

  /** Player flees the room: replace cards into the deck. */
  export function EscapeRoom({ room, deck, ...state }: GameState): GameState {
    return {
      ...state,
      deck: [...deck, ...room.filter((x) => x !== undefined)],
      room: [],
      didEscapeLastRoom: true,
    };
  }

  /** Player has folded all cards in the room. */
  export function ClearRoom(state: GameState): GameState {
    return { ...state, didEscapeLastRoom: false };
  }

  /** Determines whether the player can escape the current room based on game state and rules. */
  export function IsRoomEscapable(state: GameState): boolean {
    return rules.canEscape(state);
  }

  /** Determines whether the player has completed the room based on game state. */
  export function IsRoomComplete({ room }: GameState): boolean {
    return room.filter((x) => x !== undefined).length === 0;
  }

  /** Determines whether the player has completed the dungeon based on game state. */
  export function IsDungeonComplete({ deck, room }: GameState): boolean {
    return (
      deck.length === 0 && room.filter((x) => x !== undefined).length === 0
    );
  }

  /** Determines whether the player is out of health. */
  export function IsHealthDepleted({ health }: GameState): boolean {
    return health <= 0;
  }
}

export namespace GameMachine {
  // Player actions
  type ActionNewGame = { type: "NEW_GAME" };
  export type ActionFoldCard = { type: "FOLD_CARD"; index: number };
  type ActionEscape = { type: "ESCAPE" };
  type Action = ActionNewGame | ActionFoldCard | ActionEscape;

  export const Machine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoCyYB2ArgMQByAogOoD6A4gILZkDaADALqKgAOA9rAJYAXfjzycQAD0QAmAJyYAjAFYWANgAc01dIDsAFiWzVAZgA0IAJ6IFLaZmO3j05Xp0290gL6fzqDJhp0MAAFABsUC0wAZUEUACdBIghRLH48ADceAGssPyxAjDCI6NiEhDTMgGMUYVFWNnrxXgFasSRJRAc9TCUFdT1ZBWNZHVUdFh1zKwRjVVVMEdclJXVjJWM+9W9fIICgosiAETAUUKSUzArs3N2CkPCjk9DyjJ5q1vrG9uahETbQKQIVSyOwsJwKaQsdY6Yx6dSyKadMaYKHqGwrIw6dQsWR6bYgPJ7QoPTAHMBxAAqBDieBi8USElgsUEWBQADMWXEABQsACUREJdwOpIe5KpNLpCS+3D4v1E4kBaLsxnUqkMzhx0MmlkQem0mF0OlkTmMOhUxg2+MF+xJZMp1LwRAAYgB5AAyhyoAGE6AAlQ7SkA-VoKxCLTDA5aQ9YsdT6Mw6hB6PQKCOyVZaTGGAx4nwE2424p28WOshRH3BZjsJqykPtQHoliYDyzC0w3Sq9SImbw5sKXFxliuUb9q0F4nFJ08UIQL3xCDnPCpV45TDWieRKczudxCAvKo1P6favfWt-UMICEsJsaI26Obp6R6buqGwG1R6Vs4vRqVRj-xCiSZCwNUXBgIuy6ZKu673MUwGgWA+5vIedTsIGwbnvWiCqvMShuHIcLSE+2jdlo3SGPoRE4tImg6F4eYwcKZB4BAJZEOhZ7ylhl4KEaCwwmiLAQlRz6JtiqZQrM4xDFiIyyP++SFpEzGsQ67EKBwp4tJhAJhiqBqCf0epKEROjatM4kousYxCaa8JGgpRKwcpLFsUw0iaTK2lcbpCAgvINFqLGvRKAML5xpgmjwkJshGMCYyOYBcGuWpTDGJ5Qacf8HQIOoqqKK++hjKq0jdkor6YPGqhgiCvSjMYiVKZgXqhCccS+jwPBoBBlwrjcAFNS1bUdV1SHvEeaEnl5crZYCAxKD0pofiqgzFQiibrOoKK8WCNjaGC5WNRumAUGkpCULQDBVhlGE+TlNjyAoH5ojCRhLLY3arKmKijJ+0jDDiyhHc5Tkuuk5LndQ9CMBx3mzdYOIFXCvHDB+ZofYmv0GYsyYKMmDgNfieA8BAcDiHkNZwxeAC0fSRQMGwwnRoVguZiDUyoEYbFRRgbIs9E7P4uCEJTM0XimEZ9BC1nxteRjdrMkWhQYmjJkJ165oLikbqLda+YrwLOCYII2S43a8ToigKLx-bLRs2iE1rTnCpKgi6zpOX9GmRvDFo0mhQrH4LL0TgeGaqp40owPCscpzu3dgIqAtuiGEM83VbI6yB90mdDE+KcRwY0e2qK9oSqUbtaWL3HxQs3N9HCvtGmVkIorFvE2f0WJ-gx44g8WDrx-DfnXoo5XGj+yayKzCt5c2IeBboEymsXk7TrO85Dxe1tGAsHeuP2MJDEo3YDPMr40TC1VL30q-KSBKBgVv3FDBszZrNi0+6LFbMzEHuehwLq+IuvcBrHRUiWZ+vkIQWnsERWKeoRy-m7HRYwlVXyhTMumWK-Q77NVavEEaaAoE5ThAtfQExNC6GTKgl8+gCpuDogg40sY8GnWyrdYeEIPCVTjMsBwIIISjE+hoOu-Y9RGFjNbTW+YwEgzuGDckJDARjDQcMSOaIv5yxQemSqD0jQeC0GsBQ3hvBAA */
      id: "game",
      predictableActionArguments: true,
      schema: {
        context: {} as GameLogic.GameState,
        events: {} as Action,
        services: {} as {
          [key: string]: { data: Partial<GameLogic.GameState> };
        },
      },
      tsTypes: {} as import("./game.typegen").Typegen0,
      initial: "Menu",
      context: GameLogic.DefaultGameState(),
      states: {
        Menu: {
          on: { NEW_GAME: "GamePlay" },
        },
        GamePlay: {
          initial: "Start",
          onDone: [],
          states: {
            Start: {
              invoke: {
                src: "newGame",
                onDone: { actions: "assignGameState", target: "Deal" },
              },
            },
            Deal: {
              invoke: {
                src: "deal",
                onDone: {
                  actions: "assignGameState",
                  target: "PlayerTurnStart",
                },
              },
            },
            PlayerTurnStart: {
              after: { 0: "PlayerTurn" },
            },
            PlayerTurn: {
              on: {
                FOLD_CARD: "FoldCard",
                ESCAPE: { cond: "isRoomEscapable", target: "Escape" },
              },
            },
            FoldCard: {
              invoke: {
                src: "foldCard",
                onDone: { actions: "assignGameState", target: "EndTurn" },
              },
            },
            Escape: {
              invoke: {
                src: "escapeRoom",
                onDone: { actions: "assignGameState", target: "Deal" },
              },
            },
            EndTurn: {
              always: [
                { cond: "isDungeonComplete", target: "Win" },
                { cond: "isHealthDepleted", target: "GameOver" },
                {
                  cond: "isRoomComplete",
                  target: "ClearRoom",
                },
                { target: "PlayerTurn" },
              ],
            },
            ClearRoom: {
              invoke: {
                src: "clearRoom",
                onDone: { actions: "assignGameState", target: "Deal" },
              },
            },
            Win: {
              on: { NEW_GAME: "Start" },
            },
            GameOver: {
              on: { NEW_GAME: "Start" },
              entry: "gameOverHook",
            },
          },
        },
      },
    },
    {
      services: {
        newGame: async (context) => GameLogic.NewGame(context),
        deal: async (context) => GameLogic.Deal(context),
        foldCard: async (context, event) =>
          GameLogic.FoldCard(context, event.index),
        escapeRoom: async (context) => GameLogic.EscapeRoom(context),
        clearRoom: async (context) => GameLogic.ClearRoom(context),
      },
      actions: {
        assignGameState: assign((_, event) => event.data),
        gameOverHook: (context) => GameEffects.Hooks.GameOver(context),
      },
      guards: {
        isDungeonComplete: (context) => GameLogic.IsDungeonComplete(context),
        isHealthDepleted: (context) => GameLogic.IsHealthDepleted(context),
        isRoomComplete: (context) => GameLogic.IsRoomComplete(context),
        isRoomEscapable: (context) => GameLogic.IsRoomEscapable(context),
      },
    }
  );

  export const use = create<Store<typeof Machine>>()(devtools(xstate(Machine)));
}

/**
 * Namespace responsible for pushing unidirectional updates from the game machine to the ECS (graphics renderer) and audio renderer.
 */
export namespace GameEffects {
  // TODO: Add a nice preloader
  // TODO: Move camera out when game ends (6)
  // TODO: Maybe I should make the game state emit events?
  // TODO: xstate loses state whenever you refresh the page.
  /** These hooks allow us to push updates to the graphics ECS based on events in the game state. */
  export namespace Hooks {
    export function FightMonster(state: GameLogic.GameState, value: number) {
      // Would be nice if I didn't have to introspect the state here, and if it just published a nice event.
    }

    export function DrinkPotion(state: GameLogic.GameState, value: number) {}

    export function TakeShield(state: GameLogic.GameState, value: number) {}

    export function GameOver(state: GameLogic.GameState) {}

    export function DealCard(state: GameLogic.GameState) {}
  }

  /** Adds cards to the game world. */
  function addCards() {
    for (let i = 0; i < GameConstants.DECK_SIZE; i++) {
      GraphicsEntities.World.add({
        ...CardLayouts.DefaultCard(),
        card: TarotDeck.getTarotCard(i),
      });
    }
  }

  /** Adds a camera to the game world. */
  export function addCamera() {
    GraphicsEntities.World.add({
      camera: null,
      position: GraphicsEntities.DefaultVec3.clone(),
      rotation: GraphicsEntities.DefaultEuler.clone(),
    });
    Animation.MoveCamera(
      GraphicsEntities.WithCamera.entities[0],
      CardLayouts.DefaultCamera()
    );
  }

  /** Subscribes to the game machine and updates the game world accordingly. */
  function SubscribeToGameState() {
    GameMachine.use.subscribe(({ state }) => {
      const { portrait } = useArbitraryStore.getState();

      // Stack cards in the deck when the game starts.
      if (state.matches("GamePlay.Start")) {
        for (const card of GraphicsEntities.WithCard.entities) {
          setTimeout(() => {
            // Timer because dancing card animation in card component hijacks this
            Animation.MoveCard(
              card,
              CardLayouts.InDeck(
                card,
                state.context.deck.indexOf(card.card.index),
                portrait
              )
            );
          }, 10);
        }

        Animation.MoveCamera(GraphicsEntities.WithCamera.entities[0], {
          position: GraphicsEntities.DefaultVec3.clone().set(
            0,
            0,
            portrait ? 7 : 4
          ),
          rotation: GraphicsEntities.DefaultEuler.clone().set(0, 0, 0),
        });
      }

      // Deal cards at the start of the turn.
      if (state.matches("GamePlay.PlayerTurnStart")) {
        for (const card of state.context.room) {
          const i = state.context.room.indexOf(card);
          const gameObj = GraphicsEntities.WithCard.entities[card];
          setTimeout(() => {
            Animation.MoveCardFrom(
              gameObj,
              CardLayouts.InDeck(
                gameObj,
                state.context.deck.indexOf(gameObj.card.index),
                portrait
              ),
              portrait
                ? CardLayouts.RoomGrid(gameObj, i)
                : CardLayouts.RoomRow(gameObj, i)
            );
            GameEffects.Hooks.DealCard(state.context);
          }, 250 * (i + 2));
        }
      }

      // Discard cards when the player folds.
      if (state.matches("GamePlay.FoldCard")) {
        const card = (state.event as GameMachine.ActionFoldCard).index;
        const gameObj = GraphicsEntities.WithCard.entities[card];
        if (["swords", "wands"].includes(gameObj.card.suit)) {
          Animation.MonsterCardAttack(
            gameObj,
            state.context.discard.length,
            portrait
          );
        } else {
          Animation.ItemCardUse(
            gameObj,
            state.context.discard.length,
            portrait,
            state.context.wasLastActionPotion
          );
        }
      }

      // Move room cards back to the deck when the player escapes.
      if (state.matches("GamePlay.Escape")) {
        const cards = state.context.room
          .map((x) => GraphicsEntities.WithCard.entities[x])
          .filter((x) => x !== undefined);
        Animation.Escape(cards, portrait);
      }

      if (state.matches("GamePlay.Win") || state.matches("GamePlay.GameOver")) {
        Animation.MoveCamera(
          GraphicsEntities.WithCamera.entities[0],
          CardLayouts.DefaultCamera()
        );
      }
    });
  }

  /** Initializes Graphics entities. */
  function init() {
    if (GraphicsEntities.World.entities.length > 0) return;
    addCards();
    addCamera();
    SubscribeToGameState();
  }

  init();
}
