import { TarotDeck } from "../TarotDeck";
import { GameLogic } from "../game";
import Rules from "./RuleEngine";

namespace EscapeRules {
  export const Never: Rules.Rule = {
    name: "No Escape",
    absolute: true,
    description: "Player can never escape a room.",
    checks: {
      [Rules.Determination.canEscape]: (state: GameLogic.GameState) => false,
    },
  };

  export const Always: Rules.Rule = {
    name: "Always Escape",
    absolute: true,
    description: "Player can always escape a room.",
    checks: {
      [Rules.Determination.canEscape]: (state: GameLogic.GameState) => true,
    },
  };

  export const SingleRoom: Rules.Rule = {
    name: "Single Room",
    description:
      "Player can escape a room so long as they didn't escape the last room they were in.",
    checks: {
      [Rules.Determination.canEscape]: (state: GameLogic.GameState) =>
        !state.didEscapeLastRoom,
    },
  };

  export const NoEnemies: Rules.Rule = {
    name: "No Enemies",
    description:
      "Player can escape a room so long as there are no enemies in the room.",
    checks: {
      [Rules.Determination.canEscape]: (state: GameLogic.GameState) => {
        return (
          state.room
            .filter((x) => x !== undefined)
            .find((x) =>
              ["swords", "wands"].includes(TarotDeck.getTarotCard(x).suit)
            ) === undefined
        );
      },
    },
  };

  export const OneEnemy: Rules.Rule = {
    name: "One Enemy",
    description:
      "Player can escape a room so long as there is one or fewer enemies in the room.",
    checks: {
      [Rules.Determination.canEscape]: (state: GameLogic.GameState) => {
        return (
          state.room
            .filter((x) => x !== undefined)
            .filter((x) =>
              ["swords", "wands"].includes(TarotDeck.getTarotCard(x).suit)
            ).length <= 1
        );
      },
    },
  };
}

export default EscapeRules;
