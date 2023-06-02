import { TarotDeck } from "../TarotDeck";
import { GameLogic } from "../game";
import { Rule } from "./RuleEngine";

namespace EscapeRules {
  export class Never implements Rule {
    name = "No Escape";
    static absolute = true;
    static description = "Player can never escape a room.";
    static checks = {
      canEscape: (state: GameLogic.GameState) => false,
    };
  }

  export class Always implements Rule {
    name = "Always Escape";
    static absolute = true;
    static description = "Player can always escape a room.";
    static checks = {
      canEscape: (state: GameLogic.GameState) => true,
    };
  }

  export class SingleRoom implements Rule {
    name = "Single Room Escape";
    static description =
      "Player can escape a room so long as they didn't escape the last room they were in.";
    static checks = {
      canEscape: (state: GameLogic.GameState) => !state.didEscapeLastRoom,
    };
  }

  export class NoEnemies implements Rule {
    name = "No Enemies Escape";
    static description =
      "Player can escape a room so long as there are no enemies in the room.";
    static checks = {
      canEscape: (state: GameLogic.GameState) => {
        return (
          state.room
            .filter((x) => x !== undefined)
            .find((x) =>
              ["swords", "wands"].includes(TarotDeck.getTarotCard(x).suit)
            ) === undefined
        );
      },
    };
  }

  export class OneEnemy implements Rule {
    name = "One Enemy Escape";
    static description =
      "Player can escape a room so long as there is one or fewer enemies in the room.";
    static checks = {
      canEscape: (state: GameLogic.GameState) => {
        return (
          state.room
            .filter((x) => x !== undefined)
            .filter((x) =>
              ["swords", "wands"].includes(TarotDeck.getTarotCard(x).suit)
            ).length <= 1
        );
      },
    };
  }
}

export default EscapeRules;
