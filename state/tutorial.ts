import { assign, createMachine } from "xstate";
import { TarotDeck } from "./TarotDeck";
import { rules } from "./rules";
import { FoldingRules } from "./rules/FoldingRules";
import EscapeRules from "./rules/EscapeRules";
import { GameMachine } from "./game";
import { Animation } from "./graphics";
import { EventSystem } from "./events";
import Dialogue from "./dialogue";

namespace Tutorial {
  // The 5 of coins, 8 of wands, 5 of swords, and 3 of cups.
  export const TutorialCards = [32, 21, 4, 44];

  export function TutorialDeck() {
    const deck = TarotDeck.shuffleArray(TarotDeck.NewDeck());
    // Move tutorial room cards to the top of the deck.
    TutorialCards.forEach((card) => {
      deck.splice(deck.indexOf(card), 1);
      deck.unshift(card);
    });
    return deck;
  }

  export function PlayerIsNew(): boolean {
    return true;
    // return localStorage.getItem("tutorial") === null;
  }

  export function EndTutorial() {
    localStorage.setItem("tutorial", "done");
  }

  export async function ApplyTutorialRules() {
    rules.removeRule(FoldingRules.InRoom);
    rules.removeRule(EscapeRules.NoEnemies);
    rules.removeRule(EscapeRules.SingleRoom);
    return;
  }

  export async function RemoveTutorialRules() {
    rules.registerRule(FoldingRules.InRoom);
    rules.registerRule(EscapeRules.NoEnemies);
    rules.registerRule(EscapeRules.SingleRoom);
    return;
  }

  /** Return once the game state has reached the player's turn. */
  async function AwaitTurn() {
    return new Promise<void>((resolve) => {
      const unsubscribe = GameMachine.use.subscribe((state) => {
        if (state.state.matches("Dungeon.PlayerTurn")) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /** Return once the the deal animation has been completed. */
  async function AwaitDeal() {
    return new Promise<void>((resolve) => {
      const unsubscribe = Animation.Events.System.subscribe(
        Animation.Events.Keys.DealComplete,
        () => {
          unsubscribe();
          resolve();
        }
      );
    });
  }

  export async function DisplayDialogue(context: TutorialContext) {
    Dialogue.Events.System.emit(
      Dialogue.Events.Keys.DisplayDialogue,
      context.steps[0].dialogue
    );
  }

  export async function DisplayHints(context: TutorialContext) {
    Dialogue.Events.System.emit(
      Dialogue.Events.Keys.DisplayDialogue,
      context.steps[0].hint.text
    );
  }

  /** Return once a discard animation completes. */
  async function AwaitDiscard() {
    return new Promise<void>((resolve) => {
      const unsubscribe = Animation.Events.System.subscribe(
        Animation.Events.Keys.DiscardComplete,
        () => {
          unsubscribe();
          resolve();
        }
      );
    });
  }

  /** Return once the player has activated a specific card. */
  function AwaitFold(context: TutorialContext) {
    const rule = FoldingRules.SpecificCard(
      TutorialCards[context.steps[0].foldCard]
    );
    rules.registerRule(rule);
    return new Promise<void>((resolve) => {
      const unsubscribe = GameMachine.use.subscribe((state) => {
        if (state.state.matches("Dungeon.FoldCard")) {
          unsubscribe();
          rules.removeRule(rule);
          resolve();
        }
      });
    });
  }

  interface TutorialContext {
    steps: {
      foldCard: number;
      dialogue: string[];
      hint: {
        text: string;
        coordinates: { x: number; y: number };
        direction: "up" | "down" | "left" | "right";
      };
    }[];
  }

  const context: TutorialContext = {
    steps: [
      {
        foldCard: 0,
        dialogue: ["COINS provide a shield to block incoming attacks."],
        hint: {
          text: "Choose the 5 of Coins to take the shield.",
          coordinates: { x: 0, y: 0 },
          direction: "down",
        },
      },
      {
        foldCard: 1,
        dialogue: [
          "SWORDS and WANDS attack and damage you.",
          "Your shield will block monsters of decreasing power.",
        ],
        hint: {
          text: "Choose the 8 of WANDS to fight.",
          coordinates: { x: 0, y: 0 },
          direction: "down",
        },
      },
      {
        foldCard: 2,
        dialogue: [
          "The last blocked monster's power is displayed next to your 🛡️ shield value.",
          "A monster that matches or exceeds this number will break your shield.",
        ],
        hint: {
          text: "Choose the 5 of SWORDS to fight.",
          coordinates: { x: 0, y: 0 },
          direction: "down",
        },
      },
      {
        foldCard: 3,
        dialogue: [
          "CUPS are healing potions. Drinking more than one in a row has no effect.",
        ],
        hint: {
          text: "Choose the 3 of CUPS to heal.",
          coordinates: { x: 0, y: 0 },
          direction: "down",
        },
      },
      // TODO: Escape tutorial.
    ],
  };

  export const Machine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QBUCuAXA9gJwJYEMAbAWXwGMALXAOzADoBJa3dAw3ALzAGIJNa6NAG6YA1vXwAHSYQCeaLHiIAlVITgBtAAwBdRKEmZYLXP30gAHogC0AZjoBWABxaA7ABYAnA4CMP1z5Org4ANCCyiA7u9r4ATA6utrHusYHBAL7pYQo4bKSUNPQAggDu+CbUUGjY1Lz89MJiEmUs1dTaekgghsasZl1WCHaOLokpDrGekwBsQaHhiK6e7nQ+tu4Onq7bTklatpnZGLlE+VQCbXUCsOj46PQ5SiTk5w+oNR3mPSb9oIPWTicdDcWgcsx8sWmEN20zCEQQsS0Pi0dHcTgmgVs6O23kOIEeeRehTolz411u9xJxyeZ2JbQ0Pk6BiMP2o5kGsUhdGmsVstmcSMR0w2sIWCKRKLRGN22KWDjxBNORIu72odAAImxMFBUDwyQ1qCJxHQILhYDJ8LJNURtbrPl1vn02QMbDFRl5fP40vN4X5AnR+Xz3NtXLtEQcsvjqYSCiqanQABI0dCwK4Go30U3mwiWpPUFP25m9UzOv6ukZudbxSYzOZwxBrab2Na89HxWyeLQ8hXRpWxt7xgBimEIEDTgkNTTo+Ba6GHo8L3RZTvZ5YFY2rU08s2C9YQPmmWlidCc02cwWS7h87i7PcUMdejAg6m4DAAcgxkAwigAZBgALQAUUXR0S1Xfd-EcG81m2TkHCPVI935FYllcWJ0ScYMm1STJI2oTAIDgcxFWefsvmXMCXSGRtgVcUFwUhaFbFFeFEjoTxr07Nw1kw-ZYjvE5SMfJgTCITgwHI4tfksRAtD3aJ+MjEjaQEUpylYSo2kk1lwImWj9j9aYAl2fYWMQWYUWSQFPA43koncdwBJpZUB1LJcpLc-5fArDxvD8YzdzFDj7BcTYglmMKtE8JyHzpVUNS1HUJIdCjpMGHwHDoVJIW2LQkW8WwIR9Bs8p8LK2yPI8myMxSjnvPtHzaRNk3gFKPPA2xXFWCZcpsw9PE64r90vRx4NDIqYoauKhxHCBtJXKi9MwkzgylfkMrM-c0RWdYUl5BD3ChSahOmtV1XqebKLLIYUW2WYnGvfw8vgyYfD3QJQW5Tk-H2PkAlqqN6pOgRztoS60pKlY1jcaZbJ5OisT3RFtm5TsnA4w9+R646VPoBhn2SosdKoiEUPWNZHqWNakY4k9eV81Dph5JtcPSIA */

      initial: "Idle",
      id: "TutorialMachine",
      schema: {
        context: {} as TutorialContext,
      },
      tsTypes: {} as import("./tutorial.typegen").Typegen0,
      context,
      states: {
        Initialize: {
          invoke: {
            src: "applyTutorialRules",
            id: "applyTutorialRules",
            onDone: {
              target: "AwaitingTurn",
              description: `Changes the rules of the game during the tutorial. Disallows escape and folding any cards, until supersceded by new tutorial rules.`,
            },
          },
        },

        AwaitingTurn: {
          invoke: {
            src: "awaitTurn",
            id: "awaitTurn",
            onDone: {
              target: "Turn",
              description: `Observes the Dungeon Machine to determine when the player's first turn has begun.`,
            },
          },
        },

        Turn: {
          states: {
            Dialogue: {
              invoke: {
                src: "displayDialogue",
                id: "displayDialogue",
                onDone: {
                  target: "Hints",
                  description: `Displays the first dialogue for the user to read, and returns when the dialogue has been dismissed.`,
                },
              },
            },

            Hints: {
              invoke: {
                src: "displayHints",
                id: "displayHints",
                onDone: {
                  target: "Fold",
                  description: `Displays the hint and indicator UI elements. Returns immediately.`,
                },
              },
            },

            Fold: {
              invoke: {
                src: "awaitFold",
                id: "awaitFold",
                onDone: {
                  target: "Done",
                  description: `Adds a rule which allows the player to fold a specific card. Observes to Dungeon Machine for the card to be folded, then cleans up the rule and returns.`,
                },
              },
            },

            Done: {
              type: "final",
              entry: "updateTutorialContext",
              description: `Update context to reflect the completion of this step.`,
            },
          },

          initial: "Dialogue",

          onDone: [
            {
              target: "Done",
              cond: "isTutorialComplete",
            },
            {
              target: "Turn",
              internal: true,
            },
          ],
        },

        Done: {
          type: "final",
          invoke: {
            src: "endTutorial",
            id: "endTutorial",
          },
        },

        Idle: {
          on: {
            INITIALIZE: "Initialize",
          },
        },
      },

      description: `Controls the flow of the game by altering rules, triggers the display of tutorial UIs, and observes the Dungeon Machine to progress through the tutorial as the player plays through it.

Context provides the steps of the tutorial, which will be iterated by the machine until they have all been completed.`,
    },
    {
      services: {
        applyTutorialRules: ApplyTutorialRules,
        awaitTurn: () => Promise.all([AwaitTurn(), AwaitDeal()]),
        displayDialogue: DisplayDialogue,
        displayHints: DisplayHints,
        awaitFold: (context) =>
          Promise.all([AwaitFold(context), AwaitDiscard()]),
        endTutorial: RemoveTutorialRules,
      },
      guards: {
        isTutorialComplete: (context) => context.steps.length === 0,
      },
      actions: {
        updateTutorialContext: assign({
          steps: (context) => context.steps.slice(1),
        }),
      },
    }
  );
}

export default Tutorial;
