import { Rule, RuleEngine } from "./RuleEngine";
import EscapeRules from "./EscapeRules";
import PotionRules from "./PotionRules";

export const standardRules: Rule[] = [
  EscapeRules.SingleRoom,
  EscapeRules.NoEnemies,
  PotionRules.SubsequenceImpotence,
];

export const developmentRules: Rule[] = [
  EscapeRules.Always,
  PotionRules.AllYouCanEat,
];

export const rules = new RuleEngine();
rules.applyRuleSet(standardRules);

if (typeof window !== "undefined") {
  (window as any).rules = rules;
  (window as any).developmentRules = () => {
    rules.applyRuleSet(developmentRules);
  };
}
