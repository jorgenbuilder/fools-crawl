import { TarotDeck } from "../TarotDeck";
import { GameConstants, GameLogic } from "../game";
import { Rule } from "./RuleEngine";

namespace PotionRules {
  function potionValue(card: number): number {
    return Math.min(TarotDeck.getTarotCard(card).value, 11);
  }

  function applyPotionAsHealing(
    state: GameLogic.GameState
  ): GameLogic.GameState {
    const card = state.foldingCard;
    if (card === undefined) throw new Error(`No folding card.`);
    return {
      ...state,
      health: Math.min(
        state.health + potionValue(card),
        GameConstants.MAX_HEALTH
      ),
      wasLastActionPotion: true,
    };
  }

  export class AllYouCanEat implements Rule {
    name = "All You Can Eat";
    static description =
      "Players can drink as many potions as they want in a row.";
    static checks = {
      canDrink: (state: GameLogic.GameState) => true,
    };
    static actions = { drinkPotion: applyPotionAsHealing };
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
    static actions = { drinkPotion: applyPotionAsHealing };
  }

  export class SubsequenceSickness implements Rule {
    name = "Subsequence Sickness";
    static description =
      "Drinking more than one potion in a row will make you sick and lose health.";
    static checks = {
      canDrink: (state: GameLogic.GameState) => true,
    };
    static actions = {
      drinkPotion: (state: GameLogic.GameState) => {
        if (!state.wasLastActionPotion) {
          return applyPotionAsHealing(state);
        } else {
          const card = state.foldingCard;
          if (card === undefined) throw new Error(`No folding card.`);
          return {
            ...state,
            health: Math.max(state.health - potionValue(card), 0),
            wasLastActionPotion: true,
          };
        }
      },
    };
  }
}

export default PotionRules;
