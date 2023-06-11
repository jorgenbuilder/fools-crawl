
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.game.Dungeon.ClearRoom:invocation[0]": { type: "done.invoke.game.Dungeon.ClearRoom:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Deal:invocation[0]": { type: "done.invoke.game.Dungeon.Deal:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Escape:invocation[0]": { type: "done.invoke.game.Dungeon.Escape:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.FoldCard:invocation[0]": { type: "done.invoke.game.Dungeon.FoldCard:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.game.Dungeon.Start:invocation[0]": { type: "done.invoke.game.Dungeon.Start:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.after(0)#game.Dungeon.PlayerTurnStart": { type: "xstate.after(0)#game.Dungeon.PlayerTurnStart" };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "clearRoom": "done.invoke.game.Dungeon.ClearRoom:invocation[0]";
"deal": "done.invoke.game.Dungeon.Deal:invocation[0]";
"escapeRoom": "done.invoke.game.Dungeon.Escape:invocation[0]";
"foldCard": "done.invoke.game.Dungeon.FoldCard:invocation[0]";
"newGame": "done.invoke.game.Dungeon.Start:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "assignFoldingCard": "FOLD_CARD";
"assignGameState": "done.invoke.game.Dungeon.ClearRoom:invocation[0]" | "done.invoke.game.Dungeon.Deal:invocation[0]" | "done.invoke.game.Dungeon.Escape:invocation[0]" | "done.invoke.game.Dungeon.FoldCard:invocation[0]" | "done.invoke.game.Dungeon.Start:invocation[0]";
"clearFoldingCard": "done.invoke.game.Dungeon.FoldCard:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isCardInRoom": "FOLD_CARD";
"isDungeonComplete": "";
"isHealthDepleted": "";
"isRoomComplete": "";
"isRoomEscapable": "ESCAPE";
        };
        eventsCausingServices: {
          "clearRoom": "";
"deal": "done.invoke.game.Dungeon.ClearRoom:invocation[0]" | "done.invoke.game.Dungeon.Escape:invocation[0]" | "done.invoke.game.Dungeon.Start:invocation[0]";
"escapeRoom": "ESCAPE";
"foldCard": "FOLD_CARD";
"newGame": "NEW_GAME";
        };
        matchesStates: "Dungeon" | "Dungeon.ClearRoom" | "Dungeon.Deal" | "Dungeon.EndTurn" | "Dungeon.Escape" | "Dungeon.FoldCard" | "Dungeon.GameOver" | "Dungeon.PlayerTurn" | "Dungeon.PlayerTurnStart" | "Dungeon.Start" | "Dungeon.Win" | "Menu" | { "Dungeon"?: "ClearRoom" | "Deal" | "EndTurn" | "Escape" | "FoldCard" | "GameOver" | "PlayerTurn" | "PlayerTurnStart" | "Start" | "Win"; };
        tags: never;
      }
  