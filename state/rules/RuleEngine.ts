import { createHash } from "crypto";
import { GameLogic } from "../game";

/** The list of checks that can be made against our rule engine. */
export enum RuleChecks {
  canEscape = "canEscape",
  canDrink = "canDrink",
}

/** List of actions that can be made by our rule engine. */
export enum RuleActions {
  drinkPotion = "drinkPotion",
}

/** A rule implements a method for one or more of our checks. */
export interface Rule {
  name: string;
  description?: string;
  checks?: { [key in RuleChecks]?: (state: GameLogic.GameState) => boolean };
  actions?: {
    [key in RuleActions]?: (state: GameLogic.GameState) => GameLogic.GameState;
  };
  /** Cause the rule check to ignore subsequent rules. */
  absolute?: boolean;
}

type RuleEngineMethods = {
  [K in RuleChecks]: (state: GameLogic.GameState) => boolean;
} & {
  [K in RuleActions]: (state: GameLogic.GameState) => GameLogic.GameState;
};

interface DeterminationLogEntry {
  timestamp: Date;
  state: GameLogic.GameState;
  check: RuleChecks;
  determination: boolean;
  rules: [string, boolean][];
  allRules: string[];
}

/** Applies a set of rules to make boolean determinations on player actions. */
export class RuleEngine implements RuleEngineMethods {
  private rules: { [name: string]: Rule } = {};
  private log: Map<string, DeterminationLogEntry> = new Map();

  /** Determine whether player can escape the current room. */
  canEscape: (state: GameLogic.GameState) => boolean = this.makeCheckMethod(
    RuleChecks.canEscape
  );

  /** Determine whether the player can drink a potion. */
  canDrink: (state: GameLogic.GameState) => boolean = this.makeCheckMethod(
    RuleChecks.canDrink
  );

  /** Perform the drinkPotion action. */
  drinkPotion: (state: GameLogic.GameState) => GameLogic.GameState =
    this.makeActionMethod(RuleActions.drinkPotion);

  /** Create a handler that makes a boolean determination according to applicable rules. */
  private makeCheckMethod(
    checkName: RuleChecks
  ): (state: GameLogic.GameState) => boolean {
    return (state: GameLogic.GameState) => {
      let determination = false;
      const determiningRules: [string, boolean][] = [];
      for (let rule of Object.values(this.rules).filter(
        (rule) => rule.checks?.[checkName]
      )) {
        const result = rule.checks[checkName](state);
        determiningRules.push([rule.name, result]);
        if (rule.absolute) {
          determination = result;
          break;
        }
        determination = determination || result;
      }
      this.logRuleDetermination(
        checkName,
        state,
        determination,
        determiningRules
      );
      return determination;
    };
  }

  /** Record a rule determination to the log. */
  private logRuleDetermination(
    checkName: RuleChecks,
    state: GameLogic.GameState,
    determination: boolean,
    determiningRules: [string, boolean][]
  ): void {
    const logKey = createHash("sha1")
      .update(JSON.stringify([checkName, state]))
      .digest("base64");
    if (!this.log.has(logKey)) {
      this.log.set(logKey, {
        timestamp: new Date(),
        state,
        check: checkName,
        determination,
        rules: determiningRules,
        allRules: Object.keys(this.rules),
      });
    }
  }

  /** Create a handler that mutates game state according to applicable rules. */
  private makeActionMethod(
    actionName: RuleActions
  ): (state: GameLogic.GameState) => GameLogic.GameState {
    return (state: GameLogic.GameState) => {
      let update = state;
      for (let rule of Object.values(this.rules).filter(
        (rule) => rule.actions?.[actionName]
      )) {
        update = rule.actions[actionName](state);
      }

      return update;
    };
  }

  registerRule(rule: Rule): void {
    this.rules[rule.name] = rule;
  }

  removeRule(rule: Rule): void {
    delete this.rules[rule.name];
  }

  applyRuleSet(ruleSet: Rule[]): void {
    for (let rule of ruleSet) {
      this.registerRule(rule);
    }
  }

  resetRules(): void {
    this.rules = {};
  }

  dumpLog() {
    return this.log;
  }
}
