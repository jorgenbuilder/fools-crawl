import * as THREE from "three";
import { World } from "miniplex";
import { TarotDeck } from "./game"; // Meant to be unidirectional. Careful!
import { useArbitraryStore } from "./zustand";

//////////////////////////
// Graphical Constants //
////////////////////////

/** Dimensions of the cards. */
export const CARD_SIZE = [1, 1.73];
/** Spacing between cards in the layout. */
const SPACING = 0.025;

////////////////////////////////////////
// Graphical Entities and Components //
//////////////////////////////////////

type PositionComponent = { position: THREE.Vector3 };
type RotationComponent = { rotation: THREE.Vector3 };
type DestinationComponent = {
  destination: {
    position?: THREE.Vector3;
    rotation?: THREE.Vector3;
  };
};

/** A graphical card in the game. */
type CardEntity = {
  card: { index: number; suit: TarotDeck.Suit; value: number };
} & PositionComponent &
  RotationComponent &
  DestinationComponent;

/** The camera in our graphical game scene. */
type CameraEntity = {
  camera: null;
} & PositionComponent &
  RotationComponent &
  DestinationComponent;

/** The player's health and shield. Move to machine. @deprecated */
type PlayerEntity = {
  player: {
    shield: number;
    health: number;
  };
};

/** The cards remaining in the deck. Move to machine. @deprecated */
type DeckEntity = {
  deck: { cards: number[] };
};

/** The cards representing the room. Move to machine. @deprecated */
type RoomEntity = {
  room: { cards: number[] };
};

/** The pile of discards. Move to machine. @deprecated */
type DiscardEntity = {
  discard: { cards: number[] };
};

/** Union type defining all possible entities of our graphical world. */
type Entity =
  | CameraEntity
  | CardEntity
  // ----
  | PlayerEntity
  | DeckEntity
  | RoomEntity
  | DiscardEntity;

/** Union type defining all possible components of our graphical world. */
type Component = PositionComponent | RotationComponent | DestinationComponent;

//////////////////////
// Graphical World //
////////////////////

/** The ECS containing all graphical game objects. */
export const GraphicalWorld = new World<Entity | Component>();

/** A default vector of zero values. */
const DefaultVec3 = new THREE.Vector3(0, 0, 0);

/** A default position for a card. */
export function newCard(): Omit<CardEntity, "card"> {
  return {
    position: DefaultVec3.clone(),
    rotation: DefaultVec3.clone().set(0, Math.PI, 0), // face down
    destination: {
      position: DefaultVec3.clone(),
      rotation: DefaultVec3.clone().set(0, Math.PI, 0), // face down
    },
  };
}

export function newCamera(): Omit<CameraEntity, "camera"> {
  return {
    position: DefaultVec3.clone().set(0, 0, 0),
    rotation: DefaultVec3.clone(),
    destination: {
      position: DefaultVec3.clone().set(0, 0, 5),
      rotation: DefaultVec3.clone(),
    },
  };
}

export namespace GraphicalEntities {
  export const WithCard = GraphicalWorld.with<CardEntity>("card");
  export const WithDestination = GraphicalWorld.with<
    DestinationComponent & PositionComponent & RotationComponent
  >("destination", "position", "rotation");
  export const WithCamera = GraphicalWorld.with<CameraEntity>("camera");
}

export namespace GameSystems {
  /** Lerp all entities toward their destinations. */
  export function DestinationSystem(time: number) {
    // TODO: Remove destination component when reached within a threshold.
    let i = 0;
    const ease = 0.125;
    for (const entity of GraphicalEntities.WithDestination.entities) {
      if (!!entity.destination?.position)
        entity.position.lerp(entity.destination.position, ease);
      if (!!entity.destination?.rotation)
        entity.rotation.lerp(entity.destination.rotation, ease);
      i++;
    }
  }
}

/** Place cards into their positions on the game board. */
export namespace CardLayouts {
  /** Arrange room cards in a grid for portrait orientation. */
  export function RoomGrid(card: CardEntity, i: number) {
    const GRID_SIZE = 2; // 2x2 grid

    card.destination.position = DefaultVec3.clone().set(
      (i % GRID_SIZE) * (CARD_SIZE[0] + SPACING) - (CARD_SIZE[0] + SPACING) / 2,
      Math.floor(i / GRID_SIZE) * (CARD_SIZE[1] + SPACING) -
        (CARD_SIZE[1] + SPACING) / 2,
      0
    );
    card.destination.rotation = DefaultVec3.clone().set(card.rotation.x, 0, 0);
  }

  /** Arrange room cards in a row for landscape orientation. */
  export function RoomRow(card: CardEntity, i: number) {
    card.destination.position = DefaultVec3.clone().set(
      -(3 * CARD_SIZE[0] + 3 * SPACING) / 2 + i * (SPACING + CARD_SIZE[0]),
      0,
      0
    );
    card.destination.rotation = DefaultVec3.clone().set(card.rotation.x, 0, 0);
  }

  export function InDeck(card: CardEntity, i: number) {
    const { portrait } = useArbitraryStore.getState();
    if (portrait) {
      card.destination.position = DefaultVec3.clone().set(
        0,
        CARD_SIZE[1] + CARD_SIZE[0] / 2 + SPACING + 0.5,
        -i * 0.01
      );
      card.destination.rotation = DefaultVec3.clone().set(
        card.rotation.x,
        card.rotation.y,
        Math.PI * 0.5 // turn sideways
      );
    } else {
      card.destination.position = DefaultVec3.clone().set(2.8, 0, -i * 0.01);
      card.destination.rotation = DefaultVec3.clone().set(
        card.rotation.x,
        Math.PI, // face down
        0
      );
    }
  }

  export function InDiscard(card: CardEntity, i: number) {
    const { portrait } = useArbitraryStore.getState();
    if (portrait) {
      card.destination.position = DefaultVec3.clone().set(
        0,
        -(CARD_SIZE[1] + CARD_SIZE[0] / 2 + SPACING + 0.5),
        -i * 0.01
      );
      card.destination.rotation = DefaultVec3.clone().set(
        card.rotation.x,
        card.rotation.y,
        Math.PI * 0.5 // turn sideways
      );
    } else {
      card.destination.position = DefaultVec3.clone().set(-2.8, 0, -i * 0.01);
      card.destination.rotation = DefaultVec3.clone().set(
        card.rotation.x,
        card.rotation.y,
        0
      );
    }
  }
}

export namespace Animation {
  /** Makes all of the cards in the deck dance. */
  export function DancingCards(time: number) {
    const { portrait } = useArbitraryStore.getState();

    let i = 0;
    for (const { destination, rotation } of GraphicalEntities.WithCard
      .entities) {
      const radius = portrait ? 1 : 3;
      const theta =
        (i / GraphicalEntities.WithCard.entities.length) * Math.PI * 2 +
        time * 1;

      destination.position.set(
        radius * Math.cos(theta),
        radius * Math.sin(theta) * 0.5,
        (i % (56 / 26)) * 0.01 + i * 0.015
      );

      // Untap all cards
      rotation.z = 0;

      i++;
    }
  }

  /** Makes all of the cards in the deck drift entropically. */
  export function DyingCards() {
    for (const { destination } of GraphicalEntities.WithCard.entities) {
      destination.position.x += 0.0125 - Math.random() * 0.025;
      destination.position.y += 0.0125 - Math.random() * 0.025;
    }
  }

  /** Shakes the camera indicating damage. */
  export function CameraShake() {
    // TODO: might be cool with rotation too
    const camera = GraphicalEntities.WithCamera.entities[0];
    if (!camera) return;
    camera.destination.position = DefaultVec3.clone().set(
      Math.random() * 0.2 - 0.1,
      Math.random() * 0.2 - 0.1,
      camera.position.z
    );
    setTimeout(() => {
      camera.destination.position = DefaultVec3.clone().set(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1,
        camera.position.z
      );
    }, 50);
    setTimeout(() => {
      camera.destination.position = DefaultVec3.clone().set(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1,
        camera.position.z
      );
    }, 100);
    setTimeout(() => {
      camera.destination.position = DefaultVec3.clone().set(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1,
        camera.position.z
      );
    }, 150);
    setTimeout(() => {
      camera.destination.position = DefaultVec3.clone().set(
        0,
        0,
        camera.position.z
      );
    }, 250);
  }
}
