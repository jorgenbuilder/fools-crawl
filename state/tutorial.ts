import { createMachine } from "xstate";
import { TarotDeck } from "./TarotDeck";
import { rules } from "./rules";
import { FoldingRules } from "./rules/FoldingRules";
import EscapeRules from "./rules/EscapeRules";
import { GameMachine } from "./game";

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

  export function ApplyTutorialRules() {
    rules.removeRule(FoldingRules.InRoom);
    rules.removeRule(EscapeRules.NoEnemies);
    rules.removeRule(EscapeRules.SingleRoom);
  }

  export function RemoveTutorialRules() {
    rules.registerRule(FoldingRules.InRoom);
    rules.registerRule(EscapeRules.NoEnemies);
    rules.registerRule(EscapeRules.SingleRoom);
  }

  export function AwaitTurn() {
    return new Promise<void>((resolve) => {
      const unsubscribe = GameMachine.use.subscribe((state) => {
        if (state.state.matches("PlayerTurn")) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  export function DisplayDialogue() {
    alert("dialogue");
  }

  export function DisplayHints() {
    alert("hints");
  }

  export function AwaitFold() {
    const rule = FoldingRules.SpecificCard(TutorialCards[0]);
    rules.registerRule(rule);
    return new Promise<void>((resolve) => {
      const unsubscribe = GameMachine.use.subscribe((state) => {
        if (state.state.matches("Folding")) {
          unsubscribe();
          rules.removeRule(rule);
          resolve();
        }
      });
    });
  }

  export const Machine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgEl9cAXXdAG1wC8wBiCAe0JIIDd2BrMCXQAHEXQCeAFQCuVdgCdadAEoy6cANoAGALqJQI9rGq5OBkAA9EAWgDMJAKwAObQHYALAE5HARl9uvs5ujgA0IBKIjh4OfgBMjm52cR5xQSEAvhnhaFh4hKQAggDu6Kb4ULIK+GycQrwCQuil1FX4OvpIIEYmNOZd1gj2Tq5JqY5xXpMAbMFhEYhuXh4kvnYejl5u287J2nZZORg4BMQkbbVcsFToVEK5JwXnMtUdFj2m-aCDHm4kzkEvFNpr5fh5ptpluFIghfFtYo5EYkEpC3NNpocQA98mcLhwrjc7iRsadSG1NL5OoZjJ98BZBslpk5EWs0es4tt1tDEHCksykW4UVt0ZiSU82iQACLKdhQGSsfH1fB8QQkCC4WDidASaX0WXyt5dD59OkDWyxUbePwBdLzGH+IIkOyOOzrbZuXZxfai444skvfAkAASBCosEuSpVQnVmro2pD+DDhupvTMpu+5pG7nZEymXlmIW5sLs0wcazidmcExdXm00ziPrypOe1RIADF2HQIBHuMrGsIWlQO13k90aSb6ZmXNnxpMZnMi74IXF-tMXCEUh5QXXG48zmQIBoWGQAHJkKRkQoAGTIAC0AKKj41pyewgJODzaVmClFxNJF50ViWQUq2cX5SzSLJshAfB2AgOALDFYh3nHF8zSGIEs08Hx-ECBcFgQPlnGmLxXSSfMPGCIFdz9chKBoegmDAFDUy+KxEG0IsYgbaCkKKQcCEqAMWNpV8JhIdwUiWFJXHBfCYWmNEnRBRE3G0Otdk2GjmzaESJ3Qmw-Cwq1cNtIsvDWEglh8StSMUr0MV430dIDKUZTlZijVQtjBl8RwSDSOJFLUr8bN8BJF3U3wAqrL04tLeztPFVyEzDPS0IzBA7D+PyOTUoEIVIwsCPCjwVkRdwAQSJLcVc4cIHSnyohXMDdm0MEq2dPzpkXSiVnWVIK20P9wV8Gr-VbSU6ka9N2KGbQrJCAEPUCSFsrtHlOWZJdnU8NI5nGqVpq81jZt8usrJiNTEhMgI4iLL1PyskEhrkzInKbJ4Dw0GbX1Kqz1jWUEAmWTqHos-4K2w4D0SCg4oKAA */
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
            { target: "AwaitingTurn" },
          ],
        },

        Done: {
          type: "final",
        },

        Idle: {
          on: {
            INITIALIZE: "Initialize",
          },
        },
      },

      initial: "Idle",

      description: `Controls the flow of the game by altering rules, triggers the display of tutorial UIs, and observes the Dungeon Machine to progress through the tutorial as the player plays through it.

Context provides the steps of the tutorial, which will be iterated by the machine until they have all been completed.`,
    },
    {
      services: {
        applyTutorialRules: async () => {},
        awaitTurn: async () => {},
        displayDialogue: async () => {},
        displayHints: async () => {},
        awaitFold: async () => {},
      },
      guards: {
        isTutorialComplete: () => false,
      },
    }
  );
}

export default Tutorial;
