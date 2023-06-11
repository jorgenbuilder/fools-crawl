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
import { TarotDeck } from "./TarotDeck";
import { rules } from "./rules";
import { Audio } from "./audio";
import Rules from "./rules/RuleEngine";

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
    /** The card currently being folded by the player. */
    foldingCard?: number;
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
        update = potion(state);
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
    const update = { ...state };
    if (
      typeof update.lastMonsterBlocked !== "undefined" &&
      update.lastMonsterBlocked <= value
    )
      update.shield = 0;
    return {
      ...update,
      shield: update.shield,
      lastMonsterBlocked: update.shield === 0 ? undefined : value,
      health: Math.max(0, update.health - Math.max(0, value - update.shield)),
      wasLastActionPotion: false,
    };
  }

  /** If card is a potion, heal the player. */
  export function DrinkPotion(state: GameState): GameState {
    if (!rules.determine(state, Rules.Determination.canDrink)) return state;
    const update = rules.mutate(state, Rules.Mutation.drinkPotion);
    return update;
  }

  /** If card is a shield, replace the player's shield. */
  export function TakeShield(state: GameState, value: number): GameState {
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
    return rules.determine(state, Rules.Determination.canEscape);
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

  /** Determines whether given card is in the room. */
  export function IsCardInRoom({ room }: GameState, index: number): boolean {
    return room.includes(index);
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
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoCyYB2ArgMQByAogOoD6A4gILZkDaADALqKgAOA9rAJYAXfjzycQAD0QAmAJyYAjAFYWANgAc01dIDsAFiWzVAZgA0IAJ6IFLaZmO3j05Xp0290gL6fzqDJgARAjwYUUwAZUEUACdBIghRLH48ADceAGssPywgkLAwyJjBBGS0gGMUYVFWNhrxXgEqsSRJGXV5JWNZZVUbFhYXcysEY1UdTGl21VclLXUFBSNvX3Qc4NC8QLAUABt4xMxSjKzVwPX8zYDtnZLUngqmmrqWhqERZtApBFVVJUxejwOBRjFiGaRDRCjVSYbq9dTqVTdPTIhTLEDZM55MIABR2KAsYGiABUCNE8IVYkQJLAooIsCgAGZ06IAChYAEoiBjchtMLj8YSSWSKYJntw+G9ROIvjZZpgdJ1lAp4VCDBCRu0YQZ1G4BtItPq0dzzji8QTiaS8EQAGIAeQAMgEqABhOgAJQCYpArya0usxjlLB0LC6wPUKmMxh06tGfx0sn1ejUymcriNpx5Fz5ZsFlqIZHCruxzHY9QlvpaMoW8kj0icDnUTj0XXVuj0ikMslk4eDA2ROnT-kzYWtPB2EGdMQg+zwSTumUwxqxm1H48n0Qgt3KlXeT1LL3L7z9CAUXXbkYTozU00m6sMxnl+qDSmmxk0QcHa2XmDIsAqXDAGc5zSBcl15X9-zALd7h3ap2C9H0j0rRBXHGFhumkPRZTrKMzEsGROkwfoFiwnVu2VWRjE-TFwLwCAhStBDDylZCTyjds9FUIMfi42xZD0dR1XmOwnG0AN+MWfovB8dEMxNTYyDohiiCYBQOAPRokM+awFCw-4tAGENFjkEwhIUESDXErDZCk6jhwUpS8yYaR1PFTSWO0k9dJE4xTwE-p4VkJQlHVXtMA8RNpCDRYlhksCs0U+inOMVzvWYj5Wi8nR1AmWYlB0bRJiMZR1RMFgJnhdoAoE7RUTiuTv2dHZtmiN0eB4NAgMOecTiHeTMCalq2o66CHl3eD9zcyUMq+fzMGC9RbEwordDvRb-gMLQE044jZDs-qKGSUhKFoBgS1SxCPMymx5GBASFB0LppgVWwhN8+buObOsbO6JR9u-GhVltFJCWO6h6EYJj3Jm6x0MUaZ5keowZle-CEAK9siv0FFkQcKi0TwHgIDgcRsjLaHjwAWmVTB1D0SiHqjaQlCTKN1UplR-l85wFTGBUFT0ajcEIcnpuPPS4XMzoxmbfojBjaFw2RJRNGRQyWEF+q+uXUWK080Z-gTYEui0YNBjR4E-iUFwfjURbrYDf7eRFXWtMyunDecEwExBc3hlGdsgtPZaFQRXS-q1r9eSuXZXau2abImIxOgTWQdGZ8MFfbfLsp0BUjGKp2s35c0GJdjSxdYnUFHsMPjGbRYCsWGN4XCqNfn4ps5F0ovTQFC0yTjmGvO6ebJgDAq3EozQW5y5sCt81xmZZ3uVzHCcpyH49T0T9O1FBVWFHVVwcvmZUNC4pxdHxlZtfAv8UAArfWOynLpnMr7leVEK0YMmEFjprpRsKtraa1vlHBKjlB4Vz1tdQEuV0IIk0C+ZuaN9DlXrp0M+CZdA90jjRLMg0YjDTQM-Tyrhyr53DH5KMN1Srhlpqeb+qFGyO3wfZTAh0MqXWHt5B8zN0KRkjG4bQ0Y0bwjsAiQyBUVYKl8qvTAgMMDA0JGQ92o85BqF1BreMqNhjZWhCrBw-RhGcQet4bwQA */
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
      context: GameLogic.DefaultGameState(),

      states: {
        Menu: {
          on: { NEW_GAME: "Dungeon" },
        },

        Dungeon: {
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
                FOLD_CARD: {
                  cond: "isCardInRoom",
                  target: "FoldCard",
                  actions: "assignFoldingCard",
                },
                ESCAPE: { cond: "isRoomEscapable", target: "Escape" },
              },
            },
            FoldCard: {
              invoke: {
                src: "foldCard",
                onDone: {
                  actions: ["assignGameState", "clearFoldingCard"],
                  target: "EndTurn",
                },
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
        }
      },

      initial: "Menu"
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
        assignFoldingCard: assign((_, event) => ({ foldingCard: event.index })),
        clearFoldingCard: assign(() => ({ foldingCard: undefined })),
      },
      guards: {
        isDungeonComplete: (context) => GameLogic.IsDungeonComplete(context),
        isHealthDepleted: (context) => GameLogic.IsHealthDepleted(context),
        isRoomComplete: (context) => GameLogic.IsRoomComplete(context),
        isRoomEscapable: (context) => GameLogic.IsRoomEscapable(context),
        isCardInRoom: (context, event) =>
          GameLogic.IsCardInRoom(context, event.index),
      },
    }
  );

  export const use = create<Store<typeof Machine>>()(devtools(xstate(Machine)));
}

/**
 * Namespace responsible for pushing unidirectional updates from the game machine to the ECS (graphics renderer) and audio renderer.
 */
export namespace GameEffects {
  // TODO: Maybe I should make the game state emit events?
  // TODO: xstate loses state whenever you refresh the page.

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
        Audio.Stop();
        // Audio.PlaySound("ambience");
        Animation.OrganizeDeck(
          GraphicsEntities.WithCard.entities,
          portrait,
          GraphicsEntities.WithCard.entities.length
        );

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
        const cards = state.context.room.map(
          (i) => GraphicsEntities.WithCard.entities[i]
        );
        const deck = state.context.deck.map(
          (x) => GraphicsEntities.WithCard.entities[x]
        );
        Animation.Deal(cards, portrait);
        Animation.OrganizeDeck(deck, portrait, state.context.deck.length);
      }

      // Discard cards when the player folds.
      if (state.matches("GamePlay.FoldCard")) {
        const card = (state.event as GameMachine.ActionFoldCard).index;
        const gameObj = GraphicsEntities.WithCard.entities[card];
        if (["swords", "wands"].includes(gameObj.card.suit)) {
          const shieldBreak =
            typeof state.context.lastMonsterBlocked !== "undefined" &&
            state.context.lastMonsterBlocked <=
              TarotDeck.getTarotCard(state.context.foldingCard).value;
          const shieldBlock = !shieldBreak && state.context.shield > 0;
          Animation.MonsterCardAttack(
            gameObj,
            state.context.discard.length,
            portrait,
            shieldBreak ? "break" : shieldBlock
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
        const deck = state.context.deck.map(
          (x) => GraphicsEntities.WithCard.entities[x]
        );
        Animation.OrganizeDeck(deck, portrait, state.context.deck.length);
        Animation.Escape(cards, portrait, state.context.deck.length);
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
