import { TarotDeck } from "../TarotDeck";
import { GameConstants, GameLogic } from "../game";
import Rules from "./RuleEngine";

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

  export const AllYouCanEat: Rules.Rule = {
    name: "All You Can Eat",
    description: "Players can drink as many potions as they want in a row.",
    checks: {
      [Rules.Determination.canDrink]: (state: GameLogic.GameState) => true,
    },
    actions: { drinkPotion: applyPotionAsHealing },
  };

  export const SubsequenceImpotence: Rules.Rule = {
    name: "Subsequence Impotence",
    description: "Drinking more than one potion in a row causes has no effect.",
    checks: {
      [Rules.Determination.canDrink]: (state: GameLogic.GameState) => {
        return !state.wasLastActionPotion;
      },
    },
    actions: { [Rules.Mutation.drinkPotion]: applyPotionAsHealing },
  };

  export const SubsequenceSickness: Rules.Rule = {
    name: "Subsequence Sickness",
    description:
      "Drinking more than one potion in a row will make you sick and lose health.",
    checks: {
      [Rules.Determination.canDrink]: (state: GameLogic.GameState) => true,
    },
    actions: {
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
    },
  };

  // One potion per room
  // 5 potions per dungeon
}

export default PotionRules;
