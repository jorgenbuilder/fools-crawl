import Rules from "./RuleEngine";
import EscapeRules from "./EscapeRules";
import PotionRules from "./PotionRules";

export const standardRules: Rules.Rule[] = [
  EscapeRules.SingleRoom,
  EscapeRules.NoEnemies,
  PotionRules.SubsequenceImpotence,
];

export const developmentRules: Rules.Rule[] = [
  EscapeRules.Always,
  PotionRules.AllYouCanEat,
];

export const hardRules: Rules.Rule[] = [
  EscapeRules.NoEnemies,
  PotionRules.SubsequenceSickness,
];

export const rules = new Rules.Engine();
rules.applyRuleSet(standardRules);

if (typeof window !== "undefined") {
  (window as any).rules = rules;
  (window as any).developmentRules = () => {
    rules.applyRuleSet(developmentRules);
  };
  (window as any).hardRules = () => {
    rules.resetRules();
    rules.applyRuleSet(hardRules);
  };
}
