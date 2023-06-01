import { GameLogic } from "../game";
import { Rule } from "./RuleEngine";

namespace PotionRules {
  export class AllYouCanEat implements Rule {
    name = "All You Can Eat";
    static description =
      "Players can drink as many potions as they want in a row.";
    static checks = {
      canDrink: (state: GameLogic.GameState) => true,
    };
  }

  export class SubsequenceImpotence implements Rule {
    name = "Subsequence Impotence";
    static description =
      "Drinking more than one potion in a row causes has no effect.";
    static checks = {
      canDrink: (state: GameLogic.GameState) => {
        return !state.wasLastActionPotion;
      },
    };
  }

  export class SubsequenceSickness implements Rule {
    name = "Subsequence Sickness";
    static description =
      "Drinking more than one potion in a row will make you sick and lose health.";
    static checks = {
      canDrink: (state: GameLogic.GameState) => {
        // TODO: lose hp
        return !state.wasLastActionPotion;
      },
    };
  }
}

export default PotionRules;
