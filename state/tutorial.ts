import { createMachine } from "xstate";

const TutorialMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBUCuAXA9gJwJYEMAbAWXwGMALXAOzADoBJa3dAw3ALzAGIJNa6NAG6YA1vXwAHSYQCeaLHiIAlVITgBtAAwBdRKEmZYLXP30gAHogC0AZgDsdACwAOAJz37TgIxaXTpwAmLQA2ABoQWRtvNy06LW8newBWey1k4JjbZIBfHIiFHDZSShp6AEEAd3wTaig0bGpefnphMQlqlgbqbT0kEENjVjN+qwQ7R1cPL19-IL8IqIR7NzpA20CnEJDAlxDvEND7PIKMIqISqgFuugARNkwoVB4+ATbxOghcWBl8WXuiI9nr1zIMTCNQGMJs53J4fH4AsFAotED5HKlbLYPMk3DtPNkTiBCkoSOQrvQbgAJGjoWDNN7UEQfL4-Qh-anUWkg-pg4bUcxQhww7G2fy4lyBZK2FEIbZONa2ELJVzubybFy2QnE4pksp0G4AMUwhAg9NajPadHwnXQRpN3IMRnB-NGNiFUzhs0RC0iiFi8o8e283ns2zFIS1ZxJlz13TNdFg6Hw6ApUZ1pWuqEaDoGTr5AsQ3lsdFiblxWicot2GpcMrVSroUq2ypi9mySUjinT5P1Waar3oieTqa7F11mez3j6jqGphdkMQu2LDhcCScoUCbklbbrgQbTaVPg82VyhOomAgcHM2rHGbAoLzc4L4yLxY9MwR81rvvGyRi8T2JUtDLXYDjcTtzlJO9GGYVgiE4e8eUfCFLDdYtSy0UVFUrCVkR-OwEjoItAklZIQjcPZAi8CDo3HCobRoeo+wfWcULGbwXCIkJbBwtxRViGIkhlawAhLJxYi0TdgycZV7H8Gju1jZikNY+dUPGFxkmFT1P2Cb8lmCEJnGVKiePEg4XBcBTbx7G4AUIIFEJnZ1n2sDi6HI7j7GDFw5Is5IZU3QIxLA7JbHrYNrKg2y+zoDlaRYlzXQQYtNgcKU3CCLLV2lH8pSMyTAg4jUlTbcD8iJNMbKUxo6DtCBEvzZL3L4rdXCLAIJRlOTONFLxknSDEgkCKKYwnag7haRqn2Sux5RCfxNJDfwtEk9w61CVYwolDINn8ZIrIqm9or1W4ppUpKF2WYKNWbeZfE2HE60xYL118rRQ0lfZxLyPIgA */
  states: {
    Initialize: {
      invoke: {
            src: "applyTutorialRules",
            id: "applyTutorialRules",
          onDone: {
            target: "AwaitingTurn",
            description: `Changes the rules of the game during the tutorial. Disallows escape and folding any cards, until supersceded by new tutorial rules.`
          },
    }
    },

    AwaitingTurn: {
        invoke: {
            src: "awaitTurn",
          id: "awaitTurn",
          onDone: {
            target: "Turn",
            description: `Observes the Dungeon Machine to determine when the player's first turn has begun.`
          },
        }
    },

    Turn: {
      states: {
        Dialogue: {
          invoke: {
            src: "displayDialogue",
            id: "displayDialogue",
            onDone: {
              target: "Hints",
              description: `Displays the first dialogue for the user to read, and returns when the dialogue has been dismissed.`
            }
          }
        },

        Hints: {
          invoke: {
            src: "displayHints",
            id: "displayHints",
            onDone: {
              target: "Fold",
              description: `Displays the hint and indicator UI elements. Returns immediately.`
            }
          }
        },

        Fold: {
          invoke: {
            src: "awaitFold",
            id: "awaitFold",
            onDone: {
              target: "Done",
              description: `Adds a rule which allows the player to fold a specific card. Observes to Dungeon Machine for the card to be folded, then cleans up the rule and returns.`
            }
          }
        },

        Done: {
          type: "final",
          entry: "updateTutorialContext",
          description: `Update context to reflect the completion of this step.`
        }
      },

      initial: "Dialogue",

      onDone: [{
        target: "Done",
        cond: "isTutorialComplete"
      }, { target: "AwaitingTurn"}]
    },

    Done: {
      type: "final"
    }
  },

  initial: "Initialize",

  description: `Controls the flow of the game by altering rules, triggers the display of tutorial UIs, and observes the Dungeon Machine to progress through the tutorial as the player plays through it.

Context provides the steps of the tutorial, which will be iterated by the machine until they have all been completed.`
})

export default TutorialMachine;