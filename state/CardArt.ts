import { TarotDeck } from "./TarotDeck";
import { TextureLoader } from "./TextureLoader";

export const CardArt = new TextureLoader(
    Array(56)
      .fill(0)
      .map((_, i) => TarotDeck.getTarotCard(i))
      .map((card) => `/deck-2/${card.suit[0].toUpperCase()}${card.value}.png`)
  );
  