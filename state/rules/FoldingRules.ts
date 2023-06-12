import { GameLogic } from "../game";
import Rules from "./RuleEngine";

export namespace FoldingRules {
    export const InRoom: Rules.Rule = {
        name: "Fold in Room",
        description: "Players can fold any card in the current room.",
        checks: {
            [Rules.Determination.canFold]: (state: GameLogic.GameState) => {
                return typeof state.foldingCard === "number" && state.room.includes(state.foldingCard)
          },
        }
    };
    
    export const SpecificCard = (card: number): Rules.Rule => {
        return {
            name: "Fold Specific Card",
            description: "Players can fold a specific card.",
            checks: {
                [Rules.Determination.canFold]: (state: GameLogic.GameState) => {
                    return typeof state.foldingCard === "number" && state.foldingCard === card
                }
            }
        }
    }
}