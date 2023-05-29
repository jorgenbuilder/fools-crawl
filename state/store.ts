import { World } from "miniplex";
import { lerp } from "three/src/math/MathUtils";
import { create } from "zustand";
import { Howl } from "howler";

export const DECK_SIZE = 56;
export const MAX_HEALTH = 20;

type Suit = "swords" | "wands" | "pentacles" | "cups";

type Entity = {
  position?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  destination?: { x: number; y: number; z: number };
  card?: { index: number; suit: Suit; value: number };
  camera?: null;
  player?: { shield: number; health: number };
  deck?: { cards: number[] };
  room?: { cards: number[] };
  discard?: { cards: number[] };
};

export const world = new World<Entity>();

export function getTarotCard(index: number) {
  const suit = (["swords", "wands", "pentacles", "cups"] as Suit[])[
    Math.floor(index / 14)
  ];
  const value = (index % 14) + 1;
  return { suit, value, index };
}

function addCards() {
  for (let i = 0; i < DECK_SIZE; i++) {
    world.add({
      position: { x: 0, y: 0, z: 0 },
      destination: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI * 1, z: 0 },
      card: getTarotCard(i),
    });
  }
}

addCards();

const cards = world.with("card");
const withDestination = world.with("destination");

export function dance(time: number) {
  let i = 0;
  for (const { destination } of cards.entities) {
    // Compute destination and rotation for each card
    const theta = (i / cards.entities.length) * Math.PI * 2 + time * 1;
    const radius = 3; // adjust to change the radius of the circle

    destination.x = radius * Math.cos(theta);
    destination.y = radius * Math.sin(theta) * 0.5;
    destination.z = (i % (DECK_SIZE / 26)) * 0.01 + i * 0.015;

    i++;
  }
}

export function die() {
  for (const { destination } of cards.entities) {
    destination.x += 0.0125 - Math.random() * 0.025;
    destination.y += 0.0125 - Math.random() * 0.025;
  }
}

export function destinationSystem(time: number) {
  let i = 0;
  const ease = 0.85;
  for (const { destination, position } of withDestination.entities) {
    position.x = lerp(destination.x, position.x, ease);
    position.y = lerp(destination.y, position.y, ease);
    position.z = lerp(destination.z, position.z, ease);

    i++;
  }
}

function shuffleArray(array) {
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

export function _newGame() {
  useStore.getState().reset();
  const cards = shuffleArray(
    Array(DECK_SIZE)
      .fill(0)
      .map((_, i) => i)
  );
  for (const deck of world.with("deck").entities) {
    world.remove(deck);
  }
  for (const discard of world.with("discard").entities) {
    world.remove(discard);
  }
  for (const room of world.with("room").entities) {
    world.remove(room);
  }
  for (const room of world.with("player").entities) {
    world.remove(room);
  }
  world.add({ deck: { cards } });
  world.add({ discard: { cards: [] } });
  world.add({ room: { cards: [] } });
  world.add({ player: { health: MAX_HEALTH, shield: 0 } });
  setTimeout(() => {
    for (const card of world.with("card").entities) {
      card.destination.x = 2.8;
      card.destination.y = 0;
      card.destination.z = 0;
      card.rotation.y = Math.PI * 1;
    }
  }, 100);
}

export const deck = world.with("deck");
export const discard = world.with("discard");
export const room = world.with("room");
export const player = world.with("player");

const drinkPotion = new Howl({
  src: ["/audio/8bit-powerup7.wav"],
});
const fail = new Howl({
  src: ["/audio/8bit-shoot6.wav"],
});

const shield = new Howl({
  src: ["/audio/8bit-pickup6.wav"],
});

export function _activateCard(index: number) {
  const cardEntity = world
    .with("card")
    .entities.find((c) => c.card.index === index);
  room.entities[0].room.cards = room.entities[0].room.cards.filter(
    (c) => c !== index
  );
  discard.entities[0].discard.cards.push(index);
  cardEntity.destination.x = -2.8;
  cardEntity.destination.y = 0;
  cardEntity.destination.z = 0;

  const _player = player.entities[0].player;

  const { setLastAction, lastAttack, lastPotion } = useStore.getState();
  setLastAction(cardEntity.card.suit, cardEntity.card.value);

  switch (cardEntity.card.suit) {
    case "swords":
    case "wands":
      if (lastAttack !== null && lastAttack <= cardEntity.card.value)
        _player.shield = 0;
      _player.health = Math.max(
        _player.health - Math.max(cardEntity.card.value - _player.shield, 0),
        0
      );
      shake();
      damage();
      break;
    case "pentacles":
      _player.shield = Math.min(11, cardEntity.card.value);
      shield.play();
      break;
    case "cups":
      if (lastPotion) {
        fail.play();
        return;
      }
      _player.health += Math.min(
        Math.min(11, cardEntity.card.value),
        MAX_HEALTH - _player.health
      );
      drinkPotion.play();
      break;
  }
}

const dealCard = new Howl({
  src: ["/audio/8bit-blip10.wav"],
});

const damageSounds = new Array(5)
  .fill(0)
  .map((_, i) => new Howl({ src: [`/audio/8bit-damage${i + 6}.wav`] }));
function damage() {
  const index = Math.floor(Math.random() * damageSounds.length);
  damageSounds[index].play();
}

export function _deal() {
  const cards = deck.entities[0].deck.cards;
  const hand = cards.splice(0, 4);
  let i = 0;
  function animate(i: number, card: number) {
    const cardEntity = world
      .with("card")
      .entities.find((c) => c.card.index === card);
    return () => {
      dealCard.play();
      cardEntity.destination.x = -1.5 + i * 1.025;
      cardEntity.destination.y = 0;
      cardEntity.destination.z = 0;
      cardEntity.rotation.y = 0;
    };
  }
  for (const card of hand) {
    setTimeout(animate(i, card), 250 * i);
    i++;
  }
  deck.entities[0].deck.cards = cards;
  room.entities[0].room.cards = hand;
}

const camera = world.with("camera");
function shake() {
  const _camera = camera.entities[0];
  if (!_camera) return;
  _camera.destination.x = Math.random() * 0.2 - 0.1;
  _camera.destination.y = Math.random() * 0.2 - 0.1;
  setTimeout(() => {
    _camera.destination.x = Math.random() * 0.2 - 0.1;
    _camera.destination.y = Math.random() * 0.2 - 0.1;
  }, 50);
  setTimeout(() => {
    _camera.destination.x = Math.random() * 0.2 - 0.1;
    _camera.destination.y = Math.random() * 0.2 - 0.1;
  }, 100);
  setTimeout(() => {
    _camera.destination.x = Math.random() * 0.2 - 0.1;
    _camera.destination.y = Math.random() * 0.2 - 0.1;
  }, 150);
  setTimeout(() => {
    _camera.destination.x = 0;
    _camera.destination.y = 0;
  }, 250);
}

export const useStore = create<{
  state: "menu" | "game";
  setState: (state: "menu" | "game") => void;
  newGame: () => void;
  lastPotion: boolean;
  lastAttack: null | number;
  setLastAction: (suit: Suit, value: number) => void;
  reset: () => void;
  escapedLastRoom: boolean;
  escapeRoom: () => void;
  clearRoom: () => void;
}>((set, get) => ({
  escapedLastRoom: false,
  escapeRoom: () => set({ escapedLastRoom: true }),
  clearRoom: () => set({ escapedLastRoom: false }),
  state: "menu",
  setState: (state) => set({ state }),
  newGame: () => {
    set({ state: "game" });
    _newGame();
    setTimeout(() => _deal(), 500);
  },
  lastPotion: false,
  lastAttack: null,
  setLastAction(suit, value) {
    if (suit === "cups") {
      set({ lastPotion: true });
    } else if (suit === "pentacles") {
      set({ lastPotion: false, lastAttack: null });
    } else {
      set({ lastPotion: false, lastAttack: value });
    }
  },
  reset() {
    set({ lastPotion: false, lastAttack: null });
  },
}));

export function _canEscape() {
  const noEnemiesRemain =
    room.entities[0].room.cards.find((x) =>
      ["swords", "wands"].includes(getTarotCard(x).suit)
    ) === undefined;
  const didEscape = useStore.getState().escapedLastRoom;
  return noEnemiesRemain || !didEscape;
}

export function _escape() {
  useStore.getState().escapeRoom();
  deck.entities[0].deck.cards = [
    ...deck.entities[0].deck.cards,
    ...room.entities[0].room.cards,
  ];
  for (const card of room.entities[0].room.cards) {
    const cardEntity = world
      .with("card")
      .entities.find((c) => c.card.index === card);
    cardEntity.destination.x = 2.8;
    cardEntity.destination.y = 0;
    cardEntity.destination.z = 0;
    cardEntity.rotation.y = Math.PI * 1;
  }
  room.entities[0].room.cards = [];
}

export function _roomCompleted() {
  useStore.getState().clearRoom();
}
