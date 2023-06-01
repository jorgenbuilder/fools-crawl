import { GameConstants, GameLogic } from "../game";
import { rules, standardRules } from "../rules";
import EscapeRules from "../rules/EscapeRules";

namespace TestSuites {
  /** Ensure that the new game state is setup correctly. */
  export function NewGame(state: GameLogic.GameState) {
    it("Should start the player at full health", () => {
      expect(state.health).toBe(GameConstants.MAX_HEALTH);
    });
    it("Should start the player with no shield", () => {
      expect(state.shield).toBe(0);
    });
    it("Should start with the last action not being a potion", () => {
      expect(state.wasLastActionPotion).toBe(false);
    });
    it("Should start with null value for last blocked attack", () => {
      expect(state.lastMonsterBlocked).toBe(undefined);
    });
    it("Should start with the did escape last room flag set to false", () => {
      expect(state.didEscapeLastRoom).toBe(false);
    });
    it("Should start with an empty room", () => {
      expect(state.room).toEqual([]);
    });
    it("Should start with an discard pile", () => {
      expect(state.discard).toEqual([]);
    });
    it("Should start with a full deck", () => {
      expect(state.deck.length).toEqual(GameConstants.DECK_SIZE);
    });
  }

  /** Ensure rooms are dealt correctly. */
  export function DealingRooms(state: GameLogic.GameState) {
    const update = GameLogic.Deal(state);
    it("Should deal the correct number of cards", () => {
      expect(update.room.length).toBe(4);
    });
    it("Should remove dealt cards from the deck", () => {
      expect(update.deck.length).toBe(
        GameConstants.DECK_SIZE - update.room.length
      );
    });
  }

  export function FoldingCards(state: GameLogic.GameState) {
    describe("Folding a card", () => {
      const mock = (state: GameLogic.GameState) => state;
      const handlers = [
        jest.fn(mock), // monster
        jest.fn(mock), // potion
        jest.fn(mock), // shield
      ];
      beforeEach(() => {
        for (const handler of handlers) handler.mockClear();
      });
      it("Should move the card from the room to the discard pile", () => {
        const card = state.room[0];
        const update = GameLogic.FoldCard(state, card);
        expect(update.discard).toContain(card);
        expect(update.room).not.toContain(card);
      });
      it("Should call monster handler for swords", () => {
        const firstSwordsIndex = 0;
        GameLogic.FoldCard(state, firstSwordsIndex, ...handlers);
        expect(handlers[0]).toHaveBeenCalled();
        expect(handlers[1]).not.toHaveBeenCalled();
        expect(handlers[2]).not.toHaveBeenCalled();
      });
      it("Should call monster handler for wands", () => {
        const firstWandsIndex = 14;
        GameLogic.FoldCard(state, firstWandsIndex, ...handlers);
        expect(handlers[0]).toHaveBeenCalled();
        expect(handlers[1]).not.toHaveBeenCalled();
        expect(handlers[2]).not.toHaveBeenCalled();
      });
      it("Should call shield handler for pentacles", () => {
        const firstPentaclesIndex = 28;
        GameLogic.FoldCard(state, firstPentaclesIndex, ...handlers);
        expect(handlers[0]).not.toHaveBeenCalled();
        expect(handlers[1]).not.toHaveBeenCalled();
        expect(handlers[2]).toHaveBeenCalled();
      });
      it("Should call potion handler for cups", () => {
        const firstCupsIndex = 42;
        GameLogic.FoldCard(state, firstCupsIndex, ...handlers);
        expect(handlers[0]).not.toHaveBeenCalled();
        expect(handlers[1]).toHaveBeenCalled();
        expect(handlers[2]).not.toHaveBeenCalled();
      });
    });
  }

  /** Ensure the monster fighting mechanics work. */
  export function FightingMonsters(state = GameLogic.DefaultGameState()) {
    describe("Fighting monsters", () => {
      // Since we change the shield value a lot, we'll reset it after each test.
      afterEach(() => (state.shield = 0));

      it("Should reduce player health", () => {
        expect(GameLogic.FightMonster(state, 10).health).toBe(
          GameConstants.MAX_HEALTH - 10
        );
      });
      it("Should block damage", () => {
        state.shield = 10;
        const update = GameLogic.FightMonster(state, 10);
        expect(update.health).toBe(GameConstants.MAX_HEALTH);
        expect(update.lastMonsterBlocked).toBe(10);
      });
      it("Should block partial damage when monster value exceeds shield value", () => {
        state.shield = 10;
        const update = GameLogic.FightMonster(state, 11);
        expect(update.health).toBe(GameConstants.MAX_HEALTH - 1);
      });
      it("Should block monsters of decreasing value", () => {
        let i = 10;
        state.shield = i;
        while (i > 0) {
          const update = GameLogic.FightMonster(state, i);
          expect(update.health).toBe(GameConstants.MAX_HEALTH);
          expect(update.lastMonsterBlocked).toBe(i);
          i--;
        }
      });
      it("Should not block monsters of increasing value", () => {
        state.shield = 10;
        const update = GameLogic.FightMonster(state, 10);
        expect(update.health).toBe(GameConstants.MAX_HEALTH);
        expect(GameLogic.FightMonster(update, 11).health).toBe(
          GameConstants.MAX_HEALTH - 11
        );
      });
      it("Should not block monsters of equal value", () => {
        state.shield = 10;
        const update = GameLogic.FightMonster(state, 10);
        expect(update.health).toBe(GameConstants.MAX_HEALTH);
        expect(GameLogic.FightMonster(update, 10).health).toBe(
          GameConstants.MAX_HEALTH - 10
        );
      });
    });
  }

  export function DrinkingPotions(state = GameLogic.DefaultGameState()) {
    describe("Drinking potions", () => {
      let game = { ...state };
      beforeEach(() => {
        game = { ...state };
      });

      it("Should increase player health", () => {
        game.health = 10;
        const update = GameLogic.DrinkPotion(game, 1);
        expect(update.health).toBe(11);
        expect(update.wasLastActionPotion).toBe(true);
      });

      it("Should not increase health above max", () => {
        const update = GameLogic.DrinkPotion(game, 1);
        expect(update.health).toBe(GameConstants.MAX_HEALTH);
      });

      it("Should not increase health when drinking multiple potions in a row", () => {
        game.health = 10;
        const update = GameLogic.DrinkPotion(game, 1);
        expect(update.health).toBe(11);
        expect(update.wasLastActionPotion).toBe(true);
        const update2 = GameLogic.DrinkPotion(update, 1);
        expect(update2.health).toBe(11);
        expect(update2.wasLastActionPotion).toBe(true);
      });
    });
  }

  export function TakingShields(state = GameLogic.DefaultGameState()) {
    describe("Taking shields", () => {
      it("Should increase shield value", () => {
        expect(GameLogic.TakeShield(state, 1).shield).toBe(1);
      });
      it("Should replace shield value", () => {
        state.shield = 10;
        expect(GameLogic.TakeShield(state, 1).shield).toBe(1);
      });
      it("Should reset last block value", () => {
        state.lastMonsterBlocked = 10;
        expect(GameLogic.TakeShield(state, 1).lastMonsterBlocked).toBe(
          undefined
        );
      });
    });
  }

  export function EndingRooms(state: GameLogic.GameState) {
    describe("Escaping the room", () => {
      let game = { ...state };
      beforeEach(() => {
        game.room = [];
        game.didEscapeLastRoom = false;
        rules.resetRules();
      });

      it("Should move remaining cards to the deck and update didEscapeLastRoom", () => {
        game = GameLogic.EscapeRoom(state);
        expect(game.deck.length).toBe(state.deck.length + state.room.length);
        expect(game.didEscapeLastRoom).toBe(true);
      });

      it("Should return false if the never escape rule is set", () => {
        rules.registerRule(EscapeRules.Never);
        rules.registerRule(EscapeRules.Always);
        expect(GameLogic.IsRoomEscapable(game)).toBeFalsy();
      });

      it("Should return true if the always escape rule is set", () => {
        rules.registerRule(EscapeRules.Always);
        expect(GameLogic.IsRoomEscapable(game)).toBeTruthy();
      });

      it("Should return true if no enemies and the noEnemies rule is set", () => {
        rules.registerRule(EscapeRules.NoEnemies);
        game.room = [69, 70, 71, 72];
        expect(GameLogic.IsRoomEscapable(game)).toBeTruthy();
      });

      it("Should return false if enemies and the noEnemies rule is set", () => {
        rules.registerRule(EscapeRules.NoEnemies);
        game.room = [0, 1, 2, 3];
        expect(GameLogic.IsRoomEscapable(game)).toBeFalsy();
      });

      it("Should return true if player did not escape last room and the lastRoom rule is set", () => {
        rules.registerRule(EscapeRules.SingleRoom);
        rules.registerRule(EscapeRules.NoEnemies);
        game.didEscapeLastRoom = false;
        game.room = [0, 1, 2, 3];
        expect(GameLogic.IsRoomEscapable(game)).toBeTruthy();
      });

      it("Should return false if player escaped last room and the lastRoom rule is set", () => {
        rules.registerRule(EscapeRules.SingleRoom);
        game.didEscapeLastRoom = true;
        expect(GameLogic.IsRoomEscapable(game)).toBeFalsy();
      });
    });
    describe("Clearing the room", () => {
      it("Should update didEscapeLastRoom", () => {
        const update = { ...state, didEscapeLastRoom: true };
        expect(GameLogic.ClearRoom(update).didEscapeLastRoom).toBe(false);
      });
      it("Should determine if the room is complete if there are no more cards", () => {
        const update = { ...state, room: [0] };
        expect(GameLogic.IsRoomComplete(update)).toBe(false);

        const update2 = { ...state, room: [] };
        expect(GameLogic.IsRoomComplete(update2)).toBe(true);

        const update3 = { ...state, room: [undefined] };
        expect(GameLogic.IsRoomComplete(update3)).toBe(true);
      });
    });
  }

  export function EndingTheGame(state: GameLogic.GameState) {
    describe("Winning the game", () => {
      it("Should declare dungeon complete if deck and room are empty", () => {
        const update = { ...state, deck: [], room: [] };
        expect(GameLogic.IsDungeonComplete(update)).toBe(true);

        const update2 = { ...state, deck: [], room: [undefined] };
        expect(GameLogic.IsDungeonComplete(update2)).toBe(true);

        const update3 = { ...state, deck: [0], room: [] };
        expect(GameLogic.IsDungeonComplete(update3)).toBe(false);

        const update4 = { ...state, deck: [], room: [0] };
        expect(GameLogic.IsDungeonComplete(update4)).toBe(false);
      });
    });

    describe("Losing the game", () => {
      it("Should determine if the player is out of health", () => {
        const update = { ...state, health: 0 };
        expect(GameLogic.IsHealthDepleted(update)).toBe(true);
      });
    });
  }
}

describe("Game", () => {
  describe("Game deck", () => {
    it("Should have the correct number of cards", () => {
      expect(GameLogic.NewDeck().length).toBe(GameConstants.DECK_SIZE);
    });

    it("Should be shuffled", () => {
      expect(GameLogic.NewDeck()).not.toEqual(GameLogic.NewDeck());
    });

    describe("Dealing cards for a room", () =>
      TestSuites.DealingRooms(GameLogic.DefaultGameState()));
  });

  describe("Starting state for a new game", () => {
    describe("New game from scratch", () =>
      TestSuites.NewGame(GameLogic.DefaultGameState()));
    describe("New game from a game over state", () => {
      // TODO: initialize a machine, with a game over state, and then start a new game
    });
  });

  describe("Folding cards", () =>
    TestSuites.FoldingCards(GameLogic.Deal(GameLogic.DefaultGameState())));
  describe("Fighting monsters", () =>
    TestSuites.FightingMonsters(GameLogic.DefaultGameState()));
  describe("Drinking potions", () =>
    TestSuites.DrinkingPotions(GameLogic.DefaultGameState()));
  describe("Taking Shields", () =>
    TestSuites.TakingShields(GameLogic.DefaultGameState()));
  describe("Ending rooms", () =>
    TestSuites.EndingRooms(GameLogic.DefaultGameState()));
  describe("Ending the game", () =>
    TestSuites.EndingTheGame(GameLogic.DefaultGameState()));
});
