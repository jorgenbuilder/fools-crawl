import { TarotDeck } from "../TarotDeck";

describe("Tarot Deck", () => {
  // Test getTarotCard
  describe("getTarotCard", () => {
    it("should return the correct card given an index", () => {
      const index = 10; // Index of a card in the TarotDeck
      const card = TarotDeck.getTarotCard(index);
      expect(card.index).toBe(10);
      expect(card.suit).toBe("swords");
      expect(card.value).toBe(11);
    });

    it("should throw an error for invalid indices", () => {
      const index = TarotDeck.DECK_SIZE; // Index out of range
      expect(() => TarotDeck.getTarotCard(index)).toThrow("Invalid index");
    });
  });

  // Test shuffleArray
  describe("shuffleArray", () => {
    const deck = TarotDeck.NewDeck();
    const originalArray = [...deck];
    const shuffledArray = TarotDeck.shuffleArray(deck);

    it("should properly shuffle an array", () => {
      expect(shuffledArray).not.toEqual(originalArray);
      expect(TarotDeck.isShuffled(shuffledArray)).toBe(true);
    });

    it("should mutate the original array", () => {
      expect(originalArray).not.toEqual(deck);
    });

    it("should return an array of the same length as the input array", () => {
      expect(shuffledArray.length).toBe(originalArray.length);
    });
  });
});
