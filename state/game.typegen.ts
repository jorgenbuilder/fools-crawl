
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.createStandardDungeon": { type: "done.invoke.createStandardDungeon"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.createTutorialDungeon": { type: "done.invoke.createTutorialDungeon"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.ClearRoom:invocation[0]": { type: "done.invoke.game.Dungeon.ClearRoom:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Deal:invocation[0]": { type: "done.invoke.game.Dungeon.Deal:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Escape:invocation[0]": { type: "done.invoke.game.Dungeon.Escape:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.FoldCard:invocation[0]": { type: "done.invoke.game.Dungeon.FoldCard:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Start:invocation[0]": { type: "done.invoke.game.Dungeon.Start:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.restartDungeon": { type: "done.invoke.restartDungeon"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.createStandardDungeon": { type: "error.platform.createStandardDungeon"; data: unknown };
"error.platform.createTutorialDungeon": { type: "error.platform.createTutorialDungeon"; data: unknown };
"error.platform.restartDungeon": { type: "error.platform.restartDungeon"; data: unknown };
"xstate.after(0)#game.Dungeon.PlayerTurnStart": { type: "xstate.after(0)#game.Dungeon.PlayerTurnStart" };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "clearRoom": "done.invoke.game.Dungeon.ClearRoom:invocation[0]";
"createStandardDungeon": "done.invoke.createStandardDungeon";
"createTutorialDungeon": "done.invoke.createTutorialDungeon";
"deal": "done.invoke.game.Dungeon.Deal:invocation[0]";
"escapeRoom": "done.invoke.game.Dungeon.Escape:invocation[0]";
"foldCard": "done.invoke.game.Dungeon.FoldCard:invocation[0]";
"newGame": "done.invoke.game.Dungeon.Start:invocation[0]";
"restartDungeon": "done.invoke.restartDungeon";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "assignFoldingCard": "FOLD_CARD";
"assignGameState": "done.invoke.createStandardDungeon" | "done.invoke.createTutorialDungeon" | "done.invoke.game.Dungeon.ClearRoom:invocation[0]" | "done.invoke.game.Dungeon.Deal:invocation[0]" | "done.invoke.game.Dungeon.Escape:invocation[0]" | "done.invoke.game.Dungeon.FoldCard:invocation[0]" | "done.invoke.game.Dungeon.Start:invocation[0]" | "done.invoke.restartDungeon";
"clearFoldingCard": "done.invoke.game.Dungeon.FoldCard:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isCardFoldable": "FOLD_CARD";
"isDungeonComplete": "";
"isHealthDepleted": "";
"isPlayerNew": "";
"isRoomComplete": "";
"isRoomEscapable": "ESCAPE";
        };
        eventsCausingServices: {
          "clearRoom": "";
"createStandardDungeon": "";
"createTutorialDungeon": "";
"deal": "done.invoke.game.Dungeon.ClearRoom:invocation[0]" | "done.invoke.game.Dungeon.Escape:invocation[0]" | "done.invoke.game.Dungeon.Start:invocation[0]";
"escapeRoom": "ESCAPE";
"foldCard": "FOLD_CARD";
"newGame": "" | "done.invoke.restartDungeon";
"restartDungeon": "NEW_GAME";
        };
        matchesStates: "CreateDungeon" | "CreateTutorialDungeon" | "Dungeon" | "Dungeon.ClearRoom" | "Dungeon.Deal" | "Dungeon.EndTurn" | "Dungeon.Escape" | "Dungeon.FoldCard" | "Dungeon.GameOver" | "Dungeon.PlayerTurn" | "Dungeon.PlayerTurnStart" | "Dungeon.Restart" | "Dungeon.Start" | "Dungeon.Win" | "Menu" | "StandardDungeon" | "StartDungeon" | { "Dungeon"?: "ClearRoom" | "Deal" | "EndTurn" | "Escape" | "FoldCard" | "GameOver" | "PlayerTurn" | "PlayerTurnStart" | "Restart" | "Start" | "Win"; };
        tags: never;
      }
  