/**
 * Basic Architecture:
 *
 * - The game logic is an xstate state machine.
 * - The game logic machine is be ingested into react state.
 * - Graphical entities are stored in an ECS and rendered by a system that implements threejs.
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
import xstate from "zustand-middleware-xstate";
import type { Store } from "zustand-middleware-xstate";
import {
  CardLayouts,
  GraphicalEntities,
  GraphicalWorld,
  newCamera,
  newCard,
} from "./graphics";
import { useArbitraryStore } from "./zustand";

export namespace GameConstants {
  /** Number of cards in the deck. */
  export const DECK_SIZE = 56;
  /** Maximum HP of the player. */
  export const MAX_HEALTH = 20;
}

export namespace TarotDeck {
  /** A tarot card suit: swords, wands, pentacles or cups. */
  export type Suit = "swords" | "wands" | "pentacles" | "cups";

  /** A specific tarot card. */
  export interface TarotCard {
    suit: Suit;
    value: number;
    index: number;
  }

  /** Map an index from 0-77 to a specific tarot card. */
  export function getTarotCard(index: number): TarotCard {
    const suit = (["swords", "wands", "pentacles", "cups"] as Suit[])[
      Math.floor(index / 14)
    ];
    const value = (index % 14) + 1;
    return { suit, value, index };
  }

  /** Shuffle an array in place using a Fisher-Yates. */
  export function shuffleArray<T>(array: T[]) {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
}

export namespace GameLogic {
  export interface GameState {
    /** The cards remaining in the deck. */
    deck: number[];
    /** The cards representing the room. */
    room: number[];
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
  function NewDeck() {
    return TarotDeck.shuffleArray(
      Array(GameConstants.DECK_SIZE)
        .fill(0)
        .map((_, i) => i)
    );
  }

  /** Start a new game. */
  export function NewGame(): GameState {
    return DefaultGameState();
  }

  /** Deal a room of cards from the deck. */
  export function Deal({ deck, ...state }: GameState) {
    const room = deck.splice(0, 4);
    return { ...state, room };
  }

  /** Fold selected card from the current room. */
  export function FoldCard(state: GameState, index: number): GameState {
    const { suit, value } = TarotDeck.getTarotCard(index);
    let update: Partial<GameState> = {};
    switch (suit) {
      case "swords":
      case "wands":
        update = FightMonster(state, value);
        break;
      case "cups":
        update = DrinkPotion(state, value);
        break;
      case "pentacles":
        update = TakeShield(state, value);
        break;
      default:
        console.error(`Unknown suit: ${suit}`);
    }
    update.discard = [index, ...state.discard];
    update.room = state.room.filter((x) => x !== index);
    return { ...state, ...update };
  }

  /** If card is a monster, deal damage to the player. */
  export function FightMonster(
    state: GameState,
    value: number
  ): Partial<GameState> {
    if (
      typeof state.lastMonsterBlocked !== "undefined" &&
      state.lastMonsterBlocked <= value
    )
      state.shield = 0;
    return {
      shield: state.shield,
      lastMonsterBlocked: value,
      health: Math.max(0, state.health - Math.max(0, value - state.shield)),
      wasLastActionPotion: false,
    };
  }

  /** If card is a potion, heal the player. */
  export function DrinkPotion(
    state: GameState,
    value: number
  ): Partial<GameState> {
    if (state.wasLastActionPotion) return state;
    console.log("DRINK");
    return {
      health: (state.health += Math.min(
        Math.min(11, value),
        GameConstants.MAX_HEALTH - state.health
      )),
      wasLastActionPotion: true,
    };
  }

  /** If card is a shield, replace the player's shield. */
  export function TakeShield(
    state: GameState,
    value: number
  ): Partial<GameState> {
    return {
      shield: Math.min(11, value),
      wasLastActionPotion: false,
      lastMonsterBlocked: undefined,
    };
  }

  /** Determines whether the player can escape the current room based on game state. */
  export function IsRoomEscapable({
    room,
    didEscapeLastRoom,
  }: GameState): boolean {
    const noEnemiesRemain =
      room.find((x) =>
        ["swords", "wands"].includes(TarotDeck.getTarotCard(x).suit)
      ) === undefined;
    return noEnemiesRemain || !didEscapeLastRoom;
  }

  /** Determines whether the player has completed the room based on game state. */
  export function IsRoomComplete({ room }: GameState): boolean {
    return room.length === 0;
  }

  /** Determines whether the player has completed the dungeon based on game state. */
  export function IsDungeonComplete({ deck, room }: GameState): boolean {
    return deck.length === 0 && room.length === 0;
  }

  /** Determines whether the player is out of health. */
  export function IsHealthDepleted({ health }: GameState): boolean {
    return health <= 0;
  }

  /** Player flees the room: replace cards into the deck. */
  export function EscapeRoom({ room, deck, ...state }: GameState): GameState {
    return {
      ...state,
      deck: [...deck, ...room],
      room: [],
      didEscapeLastRoom: true,
    };
  }

  /** Player has folded all cards in the room. */
  export function ClearRoom(state: GameState): GameState {
    return { ...state, didEscapeLastRoom: false };
  }
}

export namespace GameMachine {
  // Player actions
  type ActionNewGame = { type: "NEW_GAME" };
  type ActionFoldCard = { type: "FOLD_CARD"; index: number };
  type ActionEscape = { type: "ESCAPE" };
  type Action = ActionNewGame | ActionFoldCard | ActionEscape;

  const Machine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoCyYB2ArgMQByAogOoD6A4gILZkDaADALqKgAOA9rAJYAXfjzycQAD0QAmAJyYAjAFYWANgAc01dIDsAFiWzVAZgA0IAJ6IFLaZmO3j05Xp0290gL6fzqDJhp0MAAFABsUC0wAZUEUACdBIghRLH48ADceAGssPyxAjDCI6NiEhDTMgGMUYVFWNnrxXgFasSRJRAc9TCUFdT1ZBWNZHVUdFh1zKwRjVVVMEdclJXVjJWM+9W9fIICgosiAETAUUKSUzArs3N2CkPCjk9DyjJ5q1vrG9uahETbQKQIVSyOwsJwKaQsdY6Yx6dSyKadMaYKHqGwrIw6dQsWR6bYgPJ7QoPTAHMBxAAqBDieCIADEAPIAGUOVAAwnQAEqHL7cPi-UTiQGLTDA5aQ9YsdT6MyWRB6PQKUWyVZaTGGAx4nwE277ElkynU2lkKIc4LMdhNfmtIXWKEsTAeWbGYww3TqDSImbwx0KXHSliuUZ+-GEu4HTB0nihCBs+IQc54VKvHKYMN64pRmNxuIQF5VGp-T6W77Wv62hAQlgOjQ6EGjYGaPRe1Q2TBaPTOnF6NSqUO64nFMiwapcMCJ5OZVPpweRYejsD5t6FursXkgH429qAj3zJRuORw6TSPTaL0dnqLY846SaHRebUz+5DvAQKk0ojrzfl7fWBR1hYYTRFgIWvZs5QQbElShWZxiGLERlkft-HDEkyFfd9aSYBQOFLFofwBRBZGMdR22A-pTyUY8dEmCCoJRdYxhA114TrZD8gzOcMKNT9pFwvl8MFX8EBBeRbzUKVeiUAYW2lTBNHhEDZCMYExnYolny4t8eKYYx+I3MshMIyCPUUVt9DGD1pC9JRW0wGVVDBEFelGYx1NQ4o2VCE44k5HgeDQCdLhTG4UM4zAvJ8vyAqXd4izXEsBIFf4OgQAYlB6V1VE7eEFEshEIPWUiQPGDY1EhNY+0fAdNMwCg0lIShaAYC19O-IzUpseQ8rhf9hmynQVGsuiNh6CZsqcYYcWUdzwruBl0nJRrqHoRgv0MlLAS6szephIwllsL1Rm6W9FgVBQFQcNz8TwHgIDgcQ8itQTNsQABaPp5IGDYYXvaSwVo6Y3t6R1HMGAwIWUW8dHU3BCGe5KK3WBZxIulUVEGYZwOmWYUSm6UTw9AwlFm2cEa3YzceBZwTBBJiXC9f8dBRRYLtPWFXRh6qwtnEp4kEcmCNS-plRp4YtDg6SvVmbpZF6JwPEGj0LpJ7mON545TkFjrARUDLdEMIZ0rB9ZpeyhZ5ZPA3lYMUnaoNTDtdekTq0UWziJ7BVZAB6X1FIiGnGxXQJldO2IyzWN4ydisFD9eZBmOtwRg2NYvQGeZW2h2ZbDgrY1Y0iN5xQMdo+EoZRs7FYcRz5TAaRWXLcVlZW1t-OPK0x28MRsvpBdexj2U09g17I7e-s1tpJolVlP6MOSUi+JorQUvjLhDL9AmTRdAVe9ZWmMZujytx70H4ipTn4p6pS9rnYhDx7OlZYHBBCFRi9D1SOIv1TyMKVY61HYPNarzUWnEFeqUxjGHsODFYfpbDVgKtMOspE3A4jrB4LQawFDeG8EAA */
      id: "game",
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
                onDone: { actions: "assignGameState", target: "PlayerTurn" },
              },
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
            },
          },
        },
      },
    },
    {
      services: {
        newGame: async () => GameLogic.NewGame(),
        deal: async (context) => GameLogic.Deal(context),
        foldCard: async (context, event) =>
          GameLogic.FoldCard(context, event.index),
        escapeRoom: async (context) => GameLogic.EscapeRoom(context),
        clearRoom: async (context) => GameLogic.ClearRoom(context),
      },
      actions: { assignGameState: assign((_, event) => event.data) },
      guards: {
        isDungeonComplete: (context) => GameLogic.IsDungeonComplete(context),
        isHealthDepleted: (context) => GameLogic.IsHealthDepleted(context),
        isRoomComplete: (context) => GameLogic.IsRoomComplete(context),
        isRoomEscapable: (context) => GameLogic.IsRoomEscapable(context),
      },
    }
  );

  export const use = create<Store<typeof Machine>>()(xstate(Machine));
}

/**
 * Namespace responsible for pushing unidirectional updates from the game machine to the ECS (graphics renderer) and audio renderer.
 */
namespace GameEffects {
  // TODO: Play sounds in the sound queue.
  // TODO: Play the deal card sound when dealing a card.
  // TODO: Handle all sounds using a generic effect queue?
  // TODO: Queue lose game sound when player dies.

  // TODO: Add a delay between dealing each card.

  // TODO: Shake the camera when a monster is discarded. (Maybe a queue of call-once effects?)
  // TODO: Move camera from 0 to initial position when loading finishes.
  // TODO: Move camera to initial position when starting a new game (portrait ? 5.5 : 4)
  // TODO: Move camera out when game ends (6)

  /** Adds cards to the game world. */
  function addCards() {
    for (let i = 0; i < GameConstants.DECK_SIZE; i++) {
      GraphicalWorld.add({
        ...newCard(),
        card: TarotDeck.getTarotCard(i),
      });
    }
  }

  /** Adds a camera to the game world. */
  function addCamera() {
    GraphicalWorld.add({
      camera: null,
      ...newCamera(),
    });
  }

  /** Subscribes to the game machine and updates the game world accordingly. */
  function SubscribeToGameState() {
    GameMachine.use.subscribe(({ state }) => {
      const { portrait } = useArbitraryStore.getState();
      if (state.matches("GamePlay")) {
        const { deck, discard, room } = state.context as GameLogic.GameState;
        GraphicalEntities.WithCard.entities.forEach((card) => {
          if (deck.includes(card.card.index)) {
            CardLayouts.InDeck(card, deck.indexOf(card.card.index));
          } else if (discard.includes(card.card.index)) {
            CardLayouts.InDiscard(card, discard.indexOf(card.card.index));
          } else if (room.includes(card.card.index)) {
            if (portrait) {
              CardLayouts.RoomGrid(card, room.indexOf(card.card.index));
            } else {
              CardLayouts.RoomRow(card, room.indexOf(card.card.index));
            }
          } else {
            console.error(`Card ${card.card.index} not found in game state.`);
            CardLayouts.InDeck(card, 0);
          }
        });
      }
    });
  }

  /** Initializes graphical entities. */
  function init() {
    if (GraphicalWorld.entities.length > 0) return;
    addCards();
    addCamera();
    SubscribeToGameState();
    console.log("Game effects initialized.");
  }

  init();
}
