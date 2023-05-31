import * as THREE from "three";
import gsap from "gsap";
import { ArchetypeBucket, World as ECS } from "miniplex";
import { TarotDeck } from "./game"; // Meant to be unidirectional. Careful!

export namespace GraphicsConstants {
  /** Dimensions of the cards. */
  export const CARD_SIZE = [1, 1.73];
  /** Spacing between cards in the layout. */
  export const SPACING = 0.025;
}

export namespace GraphicsEntities {
  export type PositionComponent = { position: THREE.Vector3 };
  export type RotationComponent = { rotation: THREE.Euler };
  export type DestinationComponent = {
    destination: {
      position?: THREE.Vector3;
      rotation?: THREE.Euler;
    };
  };

  /** A Graphics card in the game. */
  export type Card = {
    card: { index: number; suit: TarotDeck.Suit; value: number };
  } & PositionComponent &
    RotationComponent &
    DestinationComponent;

  /** The camera in our Graphics game scene. */
  export type Camera = {
    camera: null;
  } & PositionComponent &
    RotationComponent;
  // DestinationComponent;

  /** Union type defining all possible entities of our Graphics world. */
  type Entity = Camera | Card;

  /** Union type defining all possible components of our Graphics world. */
  type Component = PositionComponent | RotationComponent | DestinationComponent;

  /** The ECS containing all Graphics game objects. */
  export const World = new ECS<Entity | Component>();

  /** A default vector of zero values. */
  export const DefaultVec3 = new THREE.Vector3(0, 0, 0);
  export const DefaultEuler = new THREE.Euler(0, 0, 0);

  export const WithCard = World.with<Card>("card");
  export const WithDestination = World.with<
    DestinationComponent & PositionComponent & RotationComponent
  >("destination", "position", "rotation");
  export const WithCamera = World.with<Camera>("camera");
}

export namespace GraphicsSystems {
  /** Lerp all entities toward their destinations. */
  export function DestinationSystem(
    time: number,
    /** A selector on the ECS of entities with a destination component. */
    bucket: ArchetypeBucket<
      GraphicsEntities.DestinationComponent &
        GraphicsEntities.PositionComponent &
        GraphicsEntities.RotationComponent
    >
  ) {
    // TODO: Remove destination component when reached within a threshold.
    let i = 0;
    const ease = 0.125;
    for (const entity of bucket.entities) {
      if (!!entity.destination?.position)
        entity.position.lerp(entity.destination.position, ease);
      // Can't lerp a euler, gotta do quaternions, i.e. im out!
      // if (!!entity.destination?.rotation)
      //   entity.rotation.lerp(entity.destination.rotation, ease);
      i++;
    }
  }
}

/** Place cards into their positions on the game board. */
export namespace CardLayouts {
  /** Arrange room cards in a grid for portrait orientation. */
  export function RoomGrid(card: GraphicsEntities.Card, i: number) {
    const GRID_SIZE = 2; // 2x2 grid
    const position = GraphicsEntities.DefaultVec3.clone().set(
      (i % GRID_SIZE) *
        (GraphicsConstants.CARD_SIZE[0] + GraphicsConstants.SPACING) -
        (GraphicsConstants.CARD_SIZE[0] + GraphicsConstants.SPACING) / 2,
      Math.floor(i / GRID_SIZE) *
        (GraphicsConstants.CARD_SIZE[1] + GraphicsConstants.SPACING) -
        (GraphicsConstants.CARD_SIZE[1] + GraphicsConstants.SPACING) / 2,
      0
    );
    const rotation = GraphicsEntities.DefaultEuler.clone().set(
      card.rotation.x,
      0,
      0
    );
    return { position, rotation };
  }

  /** Arrange room cards in a row for landscape orientation. */
  export function RoomRow(card: GraphicsEntities.Card, i: number) {
    const position = GraphicsEntities.DefaultVec3.clone().set(
      -(3 * GraphicsConstants.CARD_SIZE[0] + 3 * GraphicsConstants.SPACING) /
        2 +
        i * (GraphicsConstants.SPACING + GraphicsConstants.CARD_SIZE[0]),
      0,
      0
    );
    const rotation = GraphicsEntities.DefaultEuler.clone().set(
      card.rotation.x,
      0,
      0
    );
    return { position, rotation };
  }

  /** Arrange cards in the deck. */
  export function InDeck(
    card: GraphicsEntities.Card,
    i: number,
    portrait: boolean
  ) {
    const position = portrait
      ? GraphicsEntities.DefaultVec3.clone().set(
          0,
          GraphicsConstants.CARD_SIZE[1] +
            GraphicsConstants.CARD_SIZE[0] / 2 +
            GraphicsConstants.SPACING +
            0.5,
          -i * 0.01
        )
      : GraphicsEntities.DefaultVec3.clone().set(2.8, 0, -i * 0.01);
    const rotation = portrait
      ? GraphicsEntities.DefaultEuler.clone().set(
          card.rotation.x,
          Math.PI, // face down
          Math.PI * 0.5 // turn sideways
        )
      : GraphicsEntities.DefaultEuler.clone().set(
          card.rotation.x,
          Math.PI, // face down
          0
        );
    return { position, rotation };
  }

  /** Arrange cards in the discard pile. */
  export function InDiscard(
    card: GraphicsEntities.Card,
    i: number,
    portrait: boolean
  ) {
    return {
      position: portrait
        ? GraphicsEntities.DefaultVec3.clone().set(
            0,
            -(
              GraphicsConstants.CARD_SIZE[1] +
              GraphicsConstants.CARD_SIZE[0] / 2 +
              GraphicsConstants.SPACING +
              0.5
            ),
            i * 0.01
          )
        : GraphicsEntities.DefaultVec3.clone().set(-2.8, 0, i * 0.01),
      rotation: portrait
        ? GraphicsEntities.DefaultEuler.clone().set(
            card.rotation.x,
            card.rotation.y,
            Math.PI * 0.5 // turn sideways
          )
        : GraphicsEntities.DefaultEuler.clone().set(
            card.rotation.x,
            card.rotation.y,
            0
          ),
    };
  }

  /** A default position for a card. */
  export function DefaultCard(): Omit<GraphicsEntities.Card, "card"> {
    return {
      position: GraphicsEntities.DefaultVec3.clone(),
      rotation: GraphicsEntities.DefaultEuler.clone().set(0, Math.PI, 0), // face down
      destination: {
        position: GraphicsEntities.DefaultVec3.clone(),
        rotation: GraphicsEntities.DefaultEuler.clone().set(0, Math.PI, 0), // face down
      },
    };
  }

  /** A default position for the camera. */
  export function DefaultCamera(): Omit<GraphicsEntities.Camera, "camera"> {
    return {
      // position: GraphicsEntities.DefaultVec3.clone().set(0, 0, 0),
      // rotation: GraphicsEntities.DefaultEuler.clone(),
      // destination: {
      position: GraphicsEntities.DefaultVec3.clone().set(0, 0, 5),
      rotation: GraphicsEntities.DefaultEuler.clone(),
      // },
    };
  }
}

export namespace Animation {
  export function MoveCard(
    card: GraphicsEntities.Card,
    to: { position: THREE.Vector3; rotation: THREE.Euler }
  ) {
    gsap.to(card.position, {
      x: to.position.x,
      y: to.position.y,
      duration: 0.25,
    });
    gsap.to(card.position, {
      z: to.position.z,
      duration: 0.125,
    });
    gsap.to(card.rotation, {
      x: to.rotation.x,
      y: to.rotation.y,
      z: to.rotation.z,
      duration: 0.125,
    });
  }

  export function SendToDiscard(
    card: GraphicsEntities.Card,
    i: number,
    portrait: boolean
  ) {
    const { position, rotation } = CardLayouts.InDiscard(card, i, portrait);
    gsap
      .timeline({})
      .add("start")
      .to(
        card.position,
        {
          z: card.position.z + 1,
          duration: 0.2,
        },
        "start"
      )
      .to(
        card.position,
        {
          x: position.x,
          y: position.y,
          z: position.z,
          duration: 0.2,
        },
        "end"
      )
      .to(
        card.position,
        {
          x: position.x,
          y: position.y,
          duration: 0.4,
        },
        "start"
      );
  }

  export function MoveCardFrom(
    card: GraphicsEntities.Card,
    from: { position: THREE.Vector3; rotation: THREE.Euler },
    to: { position: THREE.Vector3; rotation: THREE.Euler }
  ) {
    gsap
      .timeline({
        delay: 0.25,
      })
      .delay(0.5)
      .to(card.position, {
        z: from.position.z + 0.5,
        duration: 0.125,
      })
      .add("start")
      .to(
        card.position,
        {
          x: to.position.x,
          y: to.position.y,
          z: to.position.z,
          duration: 0.25,
        },
        "start"
      )
      .to(
        card.rotation,
        {
          x: to.rotation.x,
          y: to.rotation.y,
          z: to.rotation.z,
          duration: 0.125,
        },
        "start"
      );
  }

  /** Makes all of the cards in the deck dance. */
  export function DancingCards(
    /** Elapsed time. */
    time: number,
    /** A selector on the ECS containing all cards. */
    bucket: ArchetypeBucket<GraphicsEntities.Card>,
    /** Whether the screen is in portrait orientation. */
    portrait: boolean
  ) {
    let i = 0;
    for (const { position, rotation } of bucket.entities) {
      const radius = portrait ? 1 : 3;
      const theta = (i / bucket.entities.length) * Math.PI * 2 + time * 1;

      position.set(
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
  export function DyingCards(
    /** A selector on the ECS containing all cards. */
    bucket: ArchetypeBucket<GraphicsEntities.Card>
  ) {
    for (const { position } of bucket.entities) {
      position.x += 0.0125 - Math.random() * 0.025;
      position.y += 0.0125 - Math.random() * 0.025;
    }
  }

  function randomVec3(scale: number) {
    return GraphicsEntities.DefaultVec3.clone().set(
      Math.random() * scale - scale / 2,
      Math.random() * scale - scale / 2,
      0
    );
  }

  /** Shakes the camera indicating damage. */
  export function CameraShake(
    /** A selector on the ECS containing the camera. */
    bucket: ArchetypeBucket<GraphicsEntities.Camera>,
    shakeIntensity = 0.2,
    shakeDuration = 250,
    shakeCount = 10
  ) {
    const camera = bucket.entities[0];
    if (!camera) return;

    const interval = shakeDuration / shakeCount;
    const intensityDecayFactor = 1 / shakeCount;

    for (let i = 0; i < shakeCount; i++) {
      setTimeout(() => {
        const currentIntensity =
          shakeIntensity * (1 - intensityDecayFactor * i);
        const vec = randomVec3(currentIntensity);
        camera.position.x = vec.x * currentIntensity;
        camera.rotation.z = vec.x * Math.PI * currentIntensity * 0.25;
      }, interval * i);
    }

    // Reset camera position after shaking
    setTimeout(() => {
      camera.position.set(0, 0, camera.position.z);
      camera.rotation.set(0, 0, 0);
    }, shakeDuration);
  }
}
