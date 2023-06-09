import * as THREE from "three";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { ArchetypeBucket, World as ECS } from "miniplex";
import { Audio } from "./audio";
import { TarotDeck } from "./TarotDeck";
import { GameConstants, GameMachine } from "./game";
import { EventSystem } from "./events";

gsap.registerPlugin(CustomEase);

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
    card: TarotDeck.TarotCard;
    geometry: THREE.PlaneGeometry;
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

  export const CardGeometry = new THREE.PlaneGeometry(1, 1.73, 10, 1);
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
        (GraphicsConstants.CARD_SIZE[1] + GraphicsConstants.SPACING) / 2 -
        0.25,
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
    portrait: boolean,
    deckSize: number
  ) {
    const position = portrait
      ? GraphicsEntities.DefaultVec3.clone().set(
          0,
          -(
            GraphicsConstants.CARD_SIZE[1] +
            GraphicsConstants.CARD_SIZE[0] / 2 +
            GraphicsConstants.SPACING +
            0.162 +
            0.25
          ),
          deckSize * 0.01 - i * 0.01
        )
      : GraphicsEntities.DefaultVec3.clone().set(
          2.8,
          0,
          deckSize * 0.01 - i * 0.01
        );
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
            GraphicsConstants.CARD_SIZE[1] +
              GraphicsConstants.CARD_SIZE[0] / 2 +
              GraphicsConstants.SPACING +
              0.1 -
              0.25,
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
      geometry: GraphicsEntities.CardGeometry.clone(),
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
      position: GraphicsEntities.DefaultVec3.clone().set(0, 0, 6),
      rotation: GraphicsEntities.DefaultEuler.clone(),
    };
  }
}

export namespace Animation {
  export function MoveCamera(
    camera: GraphicsEntities.Camera,
    to: { position: THREE.Vector3; rotation: THREE.Euler }
  ) {
    gsap.to(camera.position, {
      delay: 0.5,
      x: to.position.x,
      y: to.position.y,
      z: to.position.z,
      duration: 0.5,
    });
    gsap.to(camera.rotation, {
      x: to.rotation.x,
      y: to.rotation.y,
      z: to.rotation.z,
      duration: 0.5,
    });
  }

  /** Shuffles the remaining room cards back into the draw pile. */
  export function Escape(
    cards: GraphicsEntities.Card[],
    portrait: boolean,
    deckSize: number
  ) {
    const timeline = gsap.timeline();
    const prep = portrait
      ? CardLayouts.RoomGrid(cards[0], 3)
      : CardLayouts.RoomRow(cards[0], 3);
    const deck = CardLayouts.InDeck(cards[0], 0, portrait, deckSize);
    timeline
      .add("start")
      .to(
        cards.map((card, i) => card.position),
        {
          x: prep.position.x,
          y: prep.position.y,
          z: prep.position.z,
          duration: 0.25,
        },
        "start"
      )
      .to(
        cards.map((card) => card.rotation),
        {
          x: prep.rotation.x,
          y: Math.PI,
          z: prep.rotation.z,
          duration: 0.125,
        },
        "start"
      )
      .call(() => Audio.PlaySound("slide"))
      .add("deck")
      .to(
        cards.map((card) => card.position),
        {
          x: deck.position.x,
          y: deck.position.y,
          z: 0,
        },
        "deck"
      );
    return timeline;
  }

  /** Performs an attack animation with a specific card. */
  export function MonsterCardAttack(
    card: GraphicsEntities.Card,
    positionInDiscard: number,
    portrait: boolean,
    block: boolean | "break"
  ) {
    const timeline = gsap.timeline();
    return timeline
      .to(card.position, {
        z: 0.5,
        duration: 0.125,
        ease: "power2.out",
      })
      .add("attack")
      .call(
        () => Audio.PlaySound(card.card.suit === "wands" ? "whoosh" : "whip"),
        null,
        0.5
      )
      .call(
        () => card.card.suit === "swords" && Audio.PlaySound("slice"),
        null,
        0.6
      )
      .call(
        () =>
          block === "break"
            ? Audio.PlaySound("damage")
            : block && Audio.PlaySound("block"),
        null,
        0.6
      )
      .to(
        card.position,
        {
          y: card.position.y - 0.5,
          ease: CustomEase.create(
            "custom",
            "M0,0 C0,-0.668 0.634,-0.652 0.634,-0.652 0.634,-0.652 1,1 1,1"
          ),
          duration: 0.25,
        },
        "attack"
      )
      .to(
        card.rotation,
        {
          z: "random(-1, 1)",
          ease: CustomEase.create(
            "custom",
            "M0,0 C0,-0.668 0.634,-0.652 0.634,-0.652 0.634,-0.652 1,1 1,1"
          ),
        },
        "attack"
      )
      .call(() => {
        Animation.CameraShake(
          GraphicsEntities.WithCamera,
          Math.max(card.card.value, 0) / 10
        );
        card.card.suit === "wands" && Audio.PlaySound("whack");
      })
      .add("reset")
      .to(
        card.position,
        {
          y: card.position.y,
          duration: 0.125,
        },
        "reset"
      )
      .to(
        card.rotation,
        {
          z: 0,
          duration: 0.1,
        },
        "reset"
      )
      .add(() => Discard(card, positionInDiscard, portrait));
  }

  /** Performs a "use item" animation on a specific card. */
  export function ItemCardUse(
    card: GraphicsEntities.Card,
    positionInDiscard: number,
    portrait: boolean,
    fail: boolean
  ) {
    const timeline = gsap.timeline();
    return timeline
      .to(card.position, {
        z: 0.5,
        duration: 0.125,
        ease: "power2.out",
      })
      .add("use")
      .to(card.position, {
        y: card.position.y + 0.125,
        z: card.position.z + 0.25,
        duration: 0.125,
      })
      .call(() => {
        if (card.card.suit === "cups") {
          !fail && Audio.PlaySound("glug");
        } else {
          Audio.PlaySound("shield");
        }
      })
      .to(card.position, {
        y: card.position.y,
        z: card.position.z,
        duration: 0.125,
      })
      .to(card.position, {
        y: card.position.y,
        duration: 0.25,
      })
      .add(() => Discard(card, positionInDiscard, portrait));
  }

  /** Moves a specific card onto the top of the discard pile. */
  export function Discard(
    card: GraphicsEntities.Card,
    positionInDiscard: number,
    portrait: boolean
  ) {
    const timeline = gsap.timeline({
      ease: "power1",
    });
    const discard = CardLayouts.InDiscard(card, positionInDiscard, portrait);
    return timeline
      .add("discard")
      .call(() => Audio.PlaySound("slide"))
      .to(
        card.position,
        {
          x: discard.position.x,
          y: discard.position.y,
          duration: 0.125,
        },
        "discard"
      )
      .to(
        card.position,
        {
          z: discard.position.z,
          duration: 0.1,
        },
        "discard"
      )
      .to(
        card.rotation,
        {
          x: discard.rotation.x,
          y: discard.rotation.y,
          z: discard.rotation.z,
          duration: 0.125,
        },
        "discard"
      )
      .add("done")
      .call(() => Events.System.emit(Events.Keys.DiscardComplete, undefined));
  }

  /** Move all cards in the deck (draw pile) into their correct position. */
  export function OrganizeDrawPile(
    /** A selector on the ECS containing all cards in the draw pile. */
    cards: GraphicsEntities.Card[],
    /** Whether the screen is in portrait orientation. */
    portrait: boolean,
    /** The number of cards remaining in the deck (draw pile). */
    deckSize: number
  ) {
    const timeline = gsap.timeline();
    let i = 0;
    for (const card of cards) {
      const deck = CardLayouts.InDeck(card, i, portrait, deckSize);
      timeline.to(
        card.position,
        {
          x: deck.position.x,
          y: deck.position.y,
          z: deck.position.z,
          duration: 0.25,
        },
        0
      );
      timeline.to(
        card.rotation,
        {
          x: deck.rotation.x,
          y: deck.rotation.y,
          z: deck.rotation.z,
          duration: 0.25,
        },
        0
      );
      i++;
    }
    return timeline;
  }

  /** Move all cards in the discard pile into their correct position. */
  export function OrganizeDiscardPile(
    /** A selector on the ECS containing all cards in the discard pile. */
    cards: GraphicsEntities.Card[],
    /** Whether the screen is in portrait orientation. */
    portrait: boolean
  ) {
    const timeline = gsap.timeline();
    let i = 0;
    for (const card of cards) {
      const discard = CardLayouts.InDiscard(card, i, portrait);
      timeline.to(
        card.position,
        {
          x: discard.position.x,
          y: discard.position.y,
          z: discard.position.z,
          duration: 0.25,
        },
        0
      );
      timeline.to(
        card.rotation,
        {
          x: discard.rotation.x,
          y: discard.rotation.y,
          z: discard.rotation.z,
          duration: 0.25,
        },
        0
      );
      i++;
    }
    return timeline;
  }

  /** Move all cards in the room into their correct position. */
  export function OrganizeRoom(
    /** A selector on the ECS containing all cards in the room. */
    cards: GraphicsEntities.Card[],
    /** Whether the screen is in portrait orientation. */
    portrait: boolean
  ) {
    const timeline = gsap.timeline();
    let i = 0;
    for (const card of cards) {
      const room = portrait
        ? CardLayouts.RoomGrid(card, i)
        : CardLayouts.RoomRow(card, i);
      timeline.to(
        card.position,
        {
          x: room.position.x,
          y: room.position.y,
          z: room.position.z,
          duration: 0.25,
        },
        0
      );
      i++;
    }
    return timeline;
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

    const start = camera.position.clone();

    gsap.killTweensOf(camera.position);
    gsap
      .timeline()
      .to(camera.position, {
        y: start.y + 0.1,
        duration: 0.125,
      })
      .to(camera.position, {
        y: start.y,
        duration: 0.25,
      });
  }

  /** Deal cards. */
  export function Deal(cards: GraphicsEntities.Card[], portrait: boolean) {
    const timeline = gsap.timeline().delay(0.25);
    // Index for the animation.
    let i = 0;
    // Index for the event emission.
    let i2 = 0;
    const state = { angle: 0 };
    const geometry = GraphicsEntities.CardGeometry.clone();
    for (const card of cards) {
      const to = portrait
        ? CardLayouts.RoomGrid(card, i)
        : CardLayouts.RoomRow(card, i);
      timeline
        .add("lift")
        .to(
          card.position,
          {
            z: card.position.z + 1,
            duration: 0.125,
          },
          "lift"
        )
        .to(
          state,
          {
            angle: 5,
            duration: 0.125,
            onUpdate: () => {
              card.geometry = geometry.clone();
              const buffer = card.geometry.attributes
                .position as THREE.BufferAttribute;
              bend(buffer, state.angle, "right");
              buffer.needsUpdate = true;
            },
          },
          "lift"
        )
        .call(() => Audio.PlaySound("pick"))
        .add("deal")
        .to(
          card.position,
          {
            x: to.position.x,
            y: to.position.y,
            z: to.position.z,
            duration: 0.125,
          },
          "deal"
        )
        .to(
          card.rotation,
          {
            x: to.rotation.x,
            y: to.rotation.y,
            z: to.rotation.z,
            duration: 0.125,
          },
          "deal"
        )
        .to(
          state,
          {
            angle: 0,
            duration: 0.25,
            onUpdate: () => {
              card.geometry = geometry.clone();
              const buffer = card.geometry.attributes
                .position as THREE.BufferAttribute;
              bend(buffer, state.angle, "right");
              buffer.needsUpdate = true;
            },
          },
          "deal"
        )
        .call(() => Audio.PlaySound("place"))
        .add("done")
        .call(() => {
          if (i2 === cards.length - 1)
            Events.System.emit(Events.Keys.DealComplete, undefined);
          i2++;
        });
      i++;
    }
    return timeline;
  }

  function bend(
    buffer: THREE.BufferAttribute,
    angle: number,
    side: "both" | "left" | "right" = "right"
  ) {
    if (angle === 0) return;
    const array = buffer.array as number[];
    for (let i = 0; i < array.length; i += 3) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];
      if (side === "right") {
        if (x < 0) continue;
      } else if (side === "left") {
        if (x > 0) continue;
      }
      const theta = x * angle;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);
      array[i] = -(z - 1.0 / angle) * sinTheta;
      array[i + 1] = y;
      array[i + 2] = (z - 1.0 / angle) * cosTheta + 1.0 / angle;
    }
    buffer.needsUpdate = true;
  }

  /** Allows subscription to animation system events. */
  export namespace Events {
    export enum Keys {
      DealComplete = "DealComplete",
      DiscardComplete = "DiscardComplete",
    }

    export type AnimationEventMap = {
      [Keys.DealComplete]: void;
      [Keys.DiscardComplete]: void;
    };

    export const System = new EventSystem<AnimationEventMap>();
  }
}
