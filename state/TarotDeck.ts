import { GameConstants } from "./game";

export namespace TarotDeck {
  export const DECK_SIZE = 78;

  /** A tarot card suit: swords, wands, pentacles or cups. */
  export type Suit = "swords" | "wands" | "pentacles" | "cups";

  /** A specific tarot card. */
  export interface TarotCard {
    suit: Suit;
    value: number;
    index: number;
  }

  /** Map an index from 0-77 to a specific tarot card. */
  export function getTarotCard(index: number): TarotCard {
    if (index < 0 || index >= DECK_SIZE) throw new Error("Invalid index");
    const suit = (["swords", "wands", "pentacles", "cups"] as Suit[])[
      Math.floor(index / 14)
    ];
    const value = (index % 14) + 1;
    return { suit, value, index };
  }

  /** Return a new deck of cards (only indices, not card objects) */
  export function NewDeck() {
    return Array(GameConstants.DECK_SIZE)
      .fill(0)
      .map((_, i) => i);
  }

  /** Shuffle an array in place using a Fisher-Yates. */
  export function shuffleArray<T>(array: T[]) {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  /** Return true if the array is not in order. */
  export function isShuffled(array: number[]) {
    return !array.every((value, index) => value === index);
  }
}
