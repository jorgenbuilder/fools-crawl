import * as THREE from "three";
import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { ArchetypeBucket, World as ECS } from "miniplex";
import { Audio } from "./audio";
import { TarotDeck } from "./TarotDeck";
import { GameConstants, GameMachine } from "./game";

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
    portrait: boolean,
    deckSize: number
  ) {
    const position = portrait
      ? GraphicsEntities.DefaultVec3.clone().set(
          0,
          GraphicsConstants.CARD_SIZE[1] +
            GraphicsConstants.CARD_SIZE[0] / 2 +
            GraphicsConstants.SPACING +
            0.5,
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
  }

  export function MonsterCardAttack(
    card: GraphicsEntities.Card,
    positionInDiscard: number,
    portrait: boolean
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
      .to(
        card.position,
        {
          y: -0.5,
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
        card.card.suit === "wands" && Audio.PlaySound("damage");
      })
      .add("reset")
      .to(
        card.position,
        {
          y: 0,
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
        y: 0.125,
        z: card.position.z + 0.25,
        duration: 0.125,
      })
      .call(() => {
        if (card.card.suit === "cups") {
          Audio.PlaySound(fail ? "fail" : "potion");
        } else {
          Audio.PlaySound("shield");
        }
      })
      .to(card.position, {
        y: 0,
        z: card.position.z,
        duration: 0.125,
      })
      .to(card.position, {
        y: 0,
        duration: 0.25,
      })
      .add(() => Discard(card, positionInDiscard, portrait));
  }

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
      );
  }

  /** Move all cards in the deck (draw pile) into their correct position. */
  export function OrganizeDeck(
    /** A selector on the ECS containing all cards. */
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
    let i = 0;
    for (const card of cards) {
      const to = portrait
        ? CardLayouts.RoomGrid(card, i)
        : CardLayouts.RoomRow(card, i);
      timeline
        .to(card.position, {
          z: card.position.z + 1,
          duration: 0.125,
        })
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
        .call(() => Audio.PlaySound("place"));
      i++;
    }
    // CardLayouts.InDeck(
    //   gameObj,
    //   state.context.deck.indexOf(gameObj.card.index),
    //   portrait
    // ),
    // portrait
    //   ? CardLayouts.RoomGrid(gameObj, i)
    //   : CardLayouts.RoomRow(gameObj, i)
  }
}
