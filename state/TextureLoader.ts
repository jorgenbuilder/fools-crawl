import * as THREE from "three";
import { create } from "zustand";
import { TarotDeck } from "./TarotDeck";
import { GameConstants, GameMachine } from "./game";

export const PreloadWorker =
  typeof window === "undefined" ? null : new Worker("preload-worker.js");

class TextureLoader {
  private readonly initialized: boolean = false;
  private readonly assets: string[];
  private readonly onAssetLoaded: (i: number, buffer: ArrayBuffer) => void;
  private readonly chunkSize: number;
  private readonly delay: number;

  constructor(
    assets: string[],
    onAssetLoaded: (i: number, buffer: ArrayBuffer) => void,
    chunkSize: number = 4,
    delay: number = 2000
  ) {
    this.assets = assets;
    this.onAssetLoaded = onAssetLoaded;
    this.chunkSize = chunkSize;
    this.delay = delay;
    if (!this.initialized) this.LoadAll();
    this.initialized = true;
  }

  static loader = new THREE.TextureLoader();

  private async LoadAsset(asset: string) {
    const i = this.assets.indexOf(asset);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      PreloadWorker.onmessage = (e) => resolve(e.data);
      PreloadWorker.postMessage({ url: asset });
    });
    this.onAssetLoaded(i, buffer);
  }

  private async LoadChunk(chunk: string[]) {
    for (const asset of chunk) {
      await this.LoadAsset(asset);
    }
  }

  public async LoadAll() {
    const priority = [...GameMachine.use.getState().state.context.deck];
    for (let i = 0; i < this.assets.length; i += this.chunkSize) {
      await this.LoadChunk(
        priority.slice(i, i + this.chunkSize).map((i) => this.assets[i])
      );
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
  }
}

export const useTextureStore = create<{
  /** A cache of card art textures. */
  cardArt: THREE.Texture[];
}>((set, get) => ({
  cardArt: Array(GameConstants.DECK_SIZE)
    .fill(0)
    .map(() => new THREE.Texture()),
  textureLoader: new TextureLoader(
    Array(56)
      .fill(0)
      .map((_, i) => TarotDeck.getTarotCard(i))
      .map((card) => `/deck-2/${card.suit[0].toUpperCase()}${card.value}.png`),
    (i, buffer) => {
      createImageBitmap(new Blob([buffer]), { imageOrientation: "flipY" }).then(
        (image) => {
          get().cardArt[i].image = image;
          get().cardArt[i].needsUpdate = true;
        }
      );
    }
  ),
}));
