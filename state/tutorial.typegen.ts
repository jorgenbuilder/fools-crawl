// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.applyTutorialRules": {
      type: "done.invoke.applyTutorialRules";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.awaitFold": {
      type: "done.invoke.awaitFold";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.awaitTurn": {
      type: "done.invoke.awaitTurn";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.displayDialogue": {
      type: "done.invoke.displayDialogue";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.displayHints": {
      type: "done.invoke.displayHints";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.applyTutorialRules": {
      type: "error.platform.applyTutorialRules";
      data: unknown;
    };
    "error.platform.awaitFold": {
      type: "error.platform.awaitFold";
      data: unknown;
    };
    "error.platform.awaitTurn": {
      type: "error.platform.awaitTurn";
      data: unknown;
    };
    "error.platform.displayDialogue": {
      type: "error.platform.displayDialogue";
      data: unknown;
    };
    "error.platform.displayHints": {
      type: "error.platform.displayHints";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    applyTutorialRules: "done.invoke.applyTutorialRules";
    awaitFold: "done.invoke.awaitFold";
    awaitTurn: "done.invoke.awaitTurn";
    displayDialogue: "done.invoke.displayDialogue";
    displayHints: "done.invoke.displayHints";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    updateTutorialContext: "done.invoke.awaitFold";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isTutorialComplete: "done.state.TutorialMachine.Turn";
  };
  eventsCausingServices: {
    applyTutorialRules: "INITIALIZE";
    awaitFold: "done.invoke.displayHints";
    awaitTurn: "done.invoke.applyTutorialRules";
    displayDialogue:
      | "done.invoke.awaitTurn"
      | "done.state.TutorialMachine.Turn";
    displayHints: "done.invoke.displayDialogue";
  };
  matchesStates:
    | "AwaitingTurn"
    | "Done"
    | "Idle"
    | "Initialize"
    | "Turn"
    | "Turn.Dialogue"
    | "Turn.Done"
    | "Turn.Fold"
    | "Turn.Hints"
    | { Turn?: "Dialogue" | "Done" | "Fold" | "Hints" };
  tags: never;
}
