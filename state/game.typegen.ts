// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.game.GamePlay.ClearRoom:invocation[0]": {
      type: "done.invoke.game.GamePlay.ClearRoom:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.game.GamePlay.Deal:invocation[0]": {
      type: "done.invoke.game.GamePlay.Deal:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.game.GamePlay.Escape:invocation[0]": {
      type: "done.invoke.game.GamePlay.Escape:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.game.GamePlay.FoldCard:invocation[0]": {
      type: "done.invoke.game.GamePlay.FoldCard:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.game.GamePlay.Start:invocation[0]": {
      type: "done.invoke.game.GamePlay.Start:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    clearRoom: "done.invoke.game.GamePlay.ClearRoom:invocation[0]";
    deal: "done.invoke.game.GamePlay.Deal:invocation[0]";
    escapeRoom: "done.invoke.game.GamePlay.Escape:invocation[0]";
    foldCard: "done.invoke.game.GamePlay.FoldCard:invocation[0]";
    newGame: "done.invoke.game.GamePlay.Start:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    assignGameState:
      | "done.invoke.game.GamePlay.ClearRoom:invocation[0]"
      | "done.invoke.game.GamePlay.Deal:invocation[0]"
      | "done.invoke.game.GamePlay.Escape:invocation[0]"
      | "done.invoke.game.GamePlay.FoldCard:invocation[0]"
      | "done.invoke.game.GamePlay.Start:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isDungeonComplete: "";
    isHealthDepleted: "";
    isRoomComplete: "";
    isRoomEscapable: "ESCAPE";
  };
  eventsCausingServices: {
    clearRoom: "";
    deal:
      | "done.invoke.game.GamePlay.ClearRoom:invocation[0]"
      | "done.invoke.game.GamePlay.Escape:invocation[0]"
      | "done.invoke.game.GamePlay.Start:invocation[0]";
    escapeRoom: "ESCAPE";
    foldCard: "FOLD_CARD";
    newGame: "NEW_GAME";
  };
  matchesStates:
    | "GamePlay"
    | "GamePlay.ClearRoom"
    | "GamePlay.Deal"
    | "GamePlay.EndTurn"
    | "GamePlay.Escape"
    | "GamePlay.FoldCard"
    | "GamePlay.GameOver"
    | "GamePlay.PlayerTurn"
    | "GamePlay.Start"
    | "GamePlay.Win"
    | "Menu"
    | {
        GamePlay?:
          | "ClearRoom"
          | "Deal"
          | "EndTurn"
          | "Escape"
          | "FoldCard"
          | "GameOver"
          | "PlayerTurn"
          | "Start"
          | "Win";
      };
  tags: never;
}
