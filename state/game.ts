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

import { createMachine, assign, interpret } from "xstate";
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
import Tutorial from "./tutorial";
import { CardArt } from "./CardArt";

export namespace GameConstants {
  /** Number of cards in the deck. */
  export const DECK_SIZE = 56;
  /** Maximum HP of the player. */
  export const MAX_HEALTH = 20;
}

export namespace GameLogic {
  export interface GameState {
    /** The original deck of cards for the dungeon. */
    deck: number[];
    /** The cards remaining in the dungeon. */
    draw: number[];
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
    const deck = NewDeck();
    return {
      deck,
      draw: [...deck],
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
  export function NewGame(): GameState {
    const state = DefaultGameState();
    CardArt.prioritize(state.deck);
    return state;
  }

  export function NewGameWithTutorial(): GameState {
    const state = DefaultGameState();
    state.deck = Tutorial.TutorialDeck();
    state.draw = [...state.deck];
    CardArt.prioritize(state.deck);
    const tutorialActor = interpret(Tutorial.Machine);
    tutorialActor.onTransition((state) => {
      console.log("Tutorial transition", state.value);
    });
    tutorialActor.start();
    tutorialActor.send("INITIALIZE");
    return state;
  }

  export function Restart(state: GameState): GameState {
    const restart = DefaultGameState();
    // NOTE: Reusing same deck is a tough question
    // restart.deck = [...state.deck];
    // restart.draw = [...state.deck];
    return restart;
  }

  /** Deal a room of cards from the draw pile. */
  export function Deal({ draw, ...state }: GameState): GameState {
    const room = draw.splice(0, 4);
    return { ...state, room, draw };
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

  /** Player flees the room: replace cards into the draw pile. */
  export function EscapeRoom({ room, draw, ...state }: GameState): GameState {
    return {
      ...state,
      draw: [...draw, ...room.filter((x) => x !== undefined)],
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
  export function IsDungeonComplete({ draw, room }: GameState): boolean {
    return (
      draw.length === 0 && room.filter((x) => x !== undefined).length === 0
    );
  }

  /** Determines whether the player is out of health. */
  export function IsHealthDepleted({ health }: GameState): boolean {
    return health <= 0;
  }

  /** Determines whether given card is in the room. */
  export function IsCardFoldable(
    state: GameState,
    foldingCard: number
  ): boolean {
    return rules.determine(
      { ...state, foldingCard },
      Rules.Determination.canFold
    );
  }
}

export namespace GameMachine {
  // Player actions
  type ActionNewGame = {
    type: "NEW_GAME";
    state?: Partial<GameLogic.GameState>;
  };
  export type ActionFoldCard = { type: "FOLD_CARD"; index: number };
  type ActionEscape = { type: "ESCAPE" };
  type Action = ActionNewGame | ActionFoldCard | ActionEscape;

  export const Machine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoCyYB2ArgMQByAogOoD6A4gILZkDaADALqKgAOA9rAJYAXfjzycQAD0QAmAJyYAjAFYWANlUAWAOwAOaRpaytAGhABPREcxLZAZgVyttjUtVGFAXw+nUGTABECPBhRTABlQRQAJ0EiCFEsfjwANx4AayxfLEDgsFCI6MEEJNSAYxRhUVY2avFeAUqxJElEW1tVRQNZDTtXbpYTc0tpHUwtB3HZBR17JRcvH3RsoJC8ALAUABs4hMwS9MylgJW8tf8NzeKUnnLG6trm+qERJtApBC0WBUxZFmkVJRyVQKdq2UwWBCyEaYVRzP5KZwaf7tBYgLLHXKhAAKmxQZjAUQAKgQongCjEiBJYJFBFgUAAzWlRAAULAAlER0TlVpgcXiCcTSeTBA9uHxnqJxO8FCwdPIWBoFEjPhNFUpwZYlN9VDNPlp1CpxjpUVyTtjcfiiSS8EQAGIAeQAMv4qABhOgAJX8opAT0aUsQIJ0o1sSh06h1SoUMp0Gsh0i01lsLAGWmkOr+ipNR25p15FoF1qIZDC7qxzHYdXF-ua0oU6kUTh0araAwRcZmSkwct0GmBCeUbWzflzoVtPE2EFd0QgOzwiWuGUwpsxa3Hk+nUQgVzKFRe90rj2rLwDCCVyZhCZsaZUyi0Gjj0c0mGTI00Oi0n4Rxu8aJzZrWMhYHKLgwDnBdUiXFceSAkCwB3G49yqdgfT9E9a0QLVbBfLRZBUdRujw6QOyVMZbB7HQEXTEYNGHZZV0wMg8AgQUbVQ49JQws9FRYMYegVBQ0zsI1H1se9MDUAwb26T5ujojEYOY1iiCYBQOCPBp0LeQNBMTKYkUojQNF1WxiKGM8xI0CTNAGf4ZMMWjf2gvMmJYosmGkdSxU0zjtLPQTRmBWRVGkewxKMfRH2oxRVBTXQ02MlglCUeTR0ApT3NsLzfQ414WjPaRSLhHRo2jQF9AfcyHBTbs3E+LowzsRzFhHADMFdTYNiiD0eB4NBwL2RdDlahiOq6nq+oQ259xQw9vIlPL3i1Dpm1UZNxi0ZK1HVKqlV4nV7DsUN01kWRUraigklIShaAYCtsrQ3z8qVLsXGCpVPz7RUE0fIyrNij9PwOwr03OhiaCWe1kgJa7qHoRh2J8xbAxcTA3uBbR700CZRPGbtBNOqigTkpz-wYj04EiCl4nnQbIKwKJKcKNLEYW09o1GGZ7GkaQkuSxKdohaMDBhGYFCOwE3CheTXUZiowDSlS5pypH2Y6HnebDZL9H1ZRVDjfQOl019nHsEFdBluXaUV1SHty08kQ6MTrxYNpFViowDb7RsnD+U3o3IrRLY2WliUEHgon4LZFZpiCDkwUorbAMOI6jzYWeVx7kYQABaXmxj+ZsNtcYyXFjcyjNGVxwwRJLeZBaR5IKZiZxj3Z9iXROQ7AZuIFbgDWZrPyxMTTbummYMkTDfU40r6wdVhZNAS+UyUtJvxhUVqkaTpRkCVZDl0U3gfM-trjbHkELlFOpweh1U79fMtbEw57RYW22FVC8X88B4CA4HEFkKsqsuI5yVFZFUHNdLfSMnGHOKgYTcwcpoC+hV5K4EIMAtmXFFQwmmA4BEqh7zJkMI-CE7RuxzDLhVL4KZmp-hGqsLBQ98r7Q-G4fB3R7CGVkHGNMiZkQjE-MmSutgwY8mFMwrSz0eZjDsFfZsbQtTtnMlCJ2d4MyCQMElcReZzhbCkU9Ja6ZrDNhKkZdMSjBbDHUUocYSIeifh0eveiPI+SWlYpIjS2C-K-ETEQoyDljIzF4aohBgk5jBVlICciX8XEKTzO4wspJDHZwcAmfG6hTI6FocoSqEI8K8QiX2EqyI1prxaq4vM64pwzlSezZUElZTBkMAiXSj4FTyFQbCXQYl6wKl0aEWCKBQL1K4lMeQ0ZiGaD7EYPsHZCrdg2oqTa-E4mVISUMjKKTvEsOlG9JMUIXAj1kM2USSUfi8wvjKciPMLbxLSu1Tq0QJpoDGX5Q0EljITHvJROQ1iCrGQks2AYageYKh5oMtYl08pZwaTYQ5vNVohQvmQlGRlrBGG6BoM2rgExQswBDDAUMCTvOel8UYKYDozDWuRFwuNvg5PGM4VpgIKkMKqaECm1JChkveECnU+opglS4dMZKUUgWygMCFTG4Y9DB3lmlPlgZEwDDpV8QqPFuiPnEvWYMRhwynMrgq0OBBw6R2jgBZVudgoF1KiVT6DhYHmXsImMMlc1oJnTEZJukQW5biVbs6R7x1qYATG0Uq9YtTCLjK60xLh6ybVhJjX1zMrVBqMYgMBXZ3qyiEU2d1oSISSzDQCSicx7xHO-h4IAA */
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
          on: { NEW_GAME: "CreateDungeon" },
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
                  cond: "isCardFoldable",
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
              on: { NEW_GAME: "Restart" },
            },

            GameOver: {
              on: { NEW_GAME: "Restart" },
            },

            Restart: {
              invoke: {
                src: "restartDungeon",
                id: "restartDungeon",
                onDone: {
                  target: "Start",
                  actions: "assignGameState",
                },
              },
            },
          },
        },

        CreateDungeon: {
          always: [
            {
              target: "CreateTutorialDungeon",
              cond: "isPlayerNew",
            },
            "StandardDungeon",
          ],
        },

        CreateTutorialDungeon: {
          invoke: {
            src: "createTutorialDungeon",
            id: "createTutorialDungeon",
            onDone: "StartDungeon",
          },
        },

        StandardDungeon: {
          invoke: {
            src: "createStandardDungeon",
            id: "createStandardDungeon",
            onDone: "StartDungeon",
          },
        },

        StartDungeon: {
          entry: "assignGameState",

          always: "Dungeon",
        },
      },

      initial: "Menu",
    },
    {
      services: {
        newGame: async (context) => context,
        restartDungeon: async (context) => GameLogic.Restart(context),
        deal: async (context) => GameLogic.Deal(context),
        foldCard: async (context, event) =>
          GameLogic.FoldCard(context, event.index),
        escapeRoom: async (context) => GameLogic.EscapeRoom(context),
        clearRoom: async (context) => GameLogic.ClearRoom(context),
        createTutorialDungeon: async (context) =>
          GameLogic.NewGameWithTutorial(),
        createStandardDungeon: async (context) => GameLogic.NewGame(),
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
        isCardFoldable: (context, event) =>
          GameLogic.IsCardFoldable(context, event.index),
        isPlayerNew: (context) => Tutorial.PlayerIsNew(),
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
      console.log("State", state.value);
      const { portrait } = useArbitraryStore.getState();

      // Stack cards in the draw pile when the game starts.
      if (state.matches("Dungeon.Start")) {
        Audio.Stop();
        // Audio.PlaySound("ambience");
        Animation.OrganizeDrawPile(
          GraphicsEntities.WithCard.entities,
          portrait,
          GraphicsEntities.WithCard.entities.length
        );

        Animation.MoveCamera(GraphicsEntities.WithCamera.entities[0], {
          position: GraphicsEntities.DefaultVec3.clone().set(
            0,
            0,
            portrait ? 5.25 : 4
          ),
          rotation: GraphicsEntities.DefaultEuler.clone().set(0, 0, 0),
        });
      }

      // Deal cards at the start of the turn.
      if (state.matches("Dungeon.PlayerTurnStart")) {
        const cards = state.context.room.map(
          (i) => GraphicsEntities.WithCard.entities[i]
        );
        const draw = state.context.draw.map(
          (x) => GraphicsEntities.WithCard.entities[x]
        );
        Animation.Deal(cards, portrait);
        Animation.OrganizeDrawPile(draw, portrait, state.context.draw.length);
      }

      // Discard cards when the player folds.
      if (state.matches("Dungeon.FoldCard")) {
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

      // Move room cards back to the draw pile when the player escapes.
      if (state.matches("Dungeon.Escape")) {
        const cards = state.context.room
          .map((x) => GraphicsEntities.WithCard.entities[x])
          .filter((x) => x !== undefined);
        const draw = state.context.draw.map(
          (x) => GraphicsEntities.WithCard.entities[x]
        );
        Animation.OrganizeDrawPile(draw, portrait, state.context.draw.length);
        Animation.Escape(cards, portrait, state.context.draw.length);
      }

      if (state.matches("Dungeon.Win") || state.matches("Dungeon.GameOver")) {
        Animation.MoveCamera(
          GraphicsEntities.WithCamera.entities[0],
          CardLayouts.DefaultCamera()
        );
      }
    });
  }

  function SubscribeToScreenSize() {
    return useArbitraryStore.subscribe(({ portrait }, prev) => {
      const camera = GraphicsEntities.WithCamera.entities[0];
      if (!camera) return;
      if (!GameMachine.use.getState().state.matches("Dungeon")) return;
      if (portrait === prev.portrait) return;
      const cards = GraphicsEntities.WithCard.entities;
      const {
        state: {
          context: { draw, discard, room },
        },
      } = GameMachine.use.getState();
      Animation.OrganizeDrawPile(
        draw.map((x) => cards[x]),
        portrait,
        GraphicsEntities.WithCard.entities.length
      );
      Animation.OrganizeDiscardPile(
        discard.map((x) => cards[x]),
        portrait
      );
      Animation.OrganizeRoom(
        room.map((x) => cards[x]),
        portrait
      );
      Animation.MoveCamera(GraphicsEntities.WithCamera.entities[0], {
        position: GraphicsEntities.DefaultVec3.clone().set(
          0,
          0,
          portrait ? 7 : 4
        ),
        rotation: GraphicsEntities.DefaultEuler.clone().set(0, 0, 0),
      });
    });
  }

  /** Initializes Graphics entities. */
  function init() {
    if (GraphicsEntities.World.entities.length > 0) return;
    addCards();
    addCamera();
    SubscribeToGameState();
    SubscribeToScreenSize();
  }

  init();
}
