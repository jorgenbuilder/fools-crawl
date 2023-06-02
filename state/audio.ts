import { Howl } from "howler";

export namespace Audio {
  /** Define sounds and their source files here. */
  const SoundConf = {
    potion: "/audio/8bit-powerup7.wav",
    fail: "/audio/8bit-shoot6.wav",
    shield: "/audio/8bit-pickup6.wav",
    deal: "/audio/8bit-blip10.wav",
    lose: "/audio/8bit-explode7.wav",
    damage: new Array(5)
      .fill(0)
      .map((_, i) => `/audio/8bit-damage${i + 6}.wav`),
    pick: new Array(6).fill(0).map((_, i) => `/audio/cards/pick${i + 1}.wav`),
    place: new Array(6).fill(0).map((_, i) => `/audio/cards/place${i + 1}.wav`),
    slice: new Array(4).fill(0).map((_, i) => `/audio/cards/slice${i + 1}.wav`),
    slide: new Array(9).fill(0).map((_, i) => `/audio/cards/slide${i + 1}.wav`),
    whip: new Array(5).fill(0).map((_, i) => `/audio/cards/whip${i + 1}.wav`),
    whoosh: new Array(5)
      .fill(0)
      .map((_, i) => `/audio/cards/whoosh${i + 1}.wav`),
  };

  export type Sounds = keyof typeof SoundConf;

  /** The sounds loaded into memory. */
  const SoundBuffers = new Map<string, Howl | Howl[]>();

  /** Load buffers for all sounds. */
  function init() {
    for (const key in SoundConf) {
      const src = SoundConf[key];
      if (typeof src === "string") {
        SoundBuffers.set(key, new Howl({ src }));
      } else {
        SoundBuffers.set(
          key,
          src.map((s) => new Howl({ src: s }))
        );
      }
    }
  }

  /** Play a sound. */
  export function PlaySound(name: Sounds) {
    const buffer = SoundBuffers.get(name);
    if (buffer instanceof Howl) {
      buffer.play();
    } else {
      const index = Math.floor(Math.random() * buffer.length);
      buffer[index].play();
    }
  }

  init();
}
