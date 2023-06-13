import { TarotDeck } from "../TarotDeck"
import { GameConstants } from "../game";
import Tutorial from "../tutorial"

function CardsSuite(cards: number[]) {
    const tarot = Tutorial.TutorialCards.map(TarotDeck.getTarotCard);
    expect(tarot[0].value).toBe(5)
    expect(tarot[0].suit).toBe("pentacles")
    expect(tarot[1].value).toBe(8)
    expect(tarot[1].suit).toBe("wands")
    expect(tarot[2].value).toBe(5)
    expect(tarot[2].suit).toBe("swords")
    expect(tarot[3].value).toBe(3)
    expect(tarot[3].suit).toBe("cups")
}

describe("Tutorial", () => {
    
    describe("Deck", () => {

        test("Tutorial cards are defined correctly", () => {
            CardsSuite(Tutorial.TutorialCards);
        });

        test("Tutorial deck puts correct cards on top", () => {
            CardsSuite(Tutorial.TutorialDeck());
        })

        test("Tutorial deck is sane", () => {
            const deck = Tutorial.TutorialDeck()
            expect(TarotDeck.isShuffled(deck)).toBe(true);
            expect(deck.length).toBe(GameConstants.DECK_SIZE);
        });
    })

})