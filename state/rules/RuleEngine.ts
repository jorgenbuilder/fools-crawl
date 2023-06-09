import { createHash } from "crypto";
import { GameLogic } from "../game";

namespace Rules {
  /** The list of checks that can be made against our rule engine. */
  export enum Determination {
    canEscape = "canEscape",
    canDrink = "canDrink",
  }

  /** List of actions that can be made by our rule engine. */
  export enum Mutation {
    drinkPotion = "drinkPotion",
  }

  /** A rule implements a method for one or more of our checks. */
  export interface Rule {
    // TODO: It's possible that these names will collide, causing a rule to be overwritten.
    name: string;
    description?: string;
    checks?: {
      [key in Determination]?: (state: GameLogic.GameState) => boolean;
    };
    actions?: {
      [key in Mutation]?: (state: GameLogic.GameState) => GameLogic.GameState;
    };
    /** Cause the rule check to ignore subsequent rules. */
    absolute?: boolean;
  }

  interface DeterminationLogEntry {
    timestamp: Date;
    state: GameLogic.GameState;
    check: Determination;
    determination: boolean;
    rules: [string, boolean][];
    allRules: string[];
  }

  /** Applies a set of rules to make boolean determinations on player actions. */
  export class Engine {
    private rules: { [name: string]: Rule } = {};
    private log: Map<string, DeterminationLogEntry> = new Map();

    /** Make a boolean determination given a rule name and a game state. */
    determine(state: GameLogic.GameState, ruleName: Determination): boolean {
      let determination = false;
      const determiningRules: [string, boolean][] = [];
      for (let rule of Object.values(this.rules).filter(
        (rule) => rule.checks?.[ruleName]
      )) {
        const result = rule.checks[ruleName](state);
        determiningRules.push([rule.name, result]);
        if (rule.absolute) {
          determination = result;
          break;
        }
        determination = determination || result;
      }
      this.logRuleDetermination(
        ruleName,
        state,
        determination,
        determiningRules
      );
      return determination;
    }

    /** Return a new game state given an input game state and the action name to apply. */
    mutate(
      state: GameLogic.GameState,
      actionName: Mutation
    ): GameLogic.GameState {
      let update = state;
      for (let rule of Object.values(this.rules).filter(
        (rule) => rule.actions?.[actionName]
      )) {
        update = rule.actions[actionName](state);
      }

      return update;
    }

    /** Record a rule determination to the log. */
    private logRuleDetermination(
      checkName: Determination,
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
}

export default Rules;
