import * as THREE from "three";
import { TarotDeck } from "./TarotDeck";
import { GameMachine } from "./game";

export const PreloadWorker =
  typeof window === "undefined" ? null : new Worker("preload-worker.js");

class TextureLoader {
  private readonly assets: string[];
  private readonly chunkSize: number;
  private readonly delay: number;

  private cache: THREE.Texture[];

  constructor(assets: string[], chunkSize: number = 4, delay: number = 250) {
    this.assets = assets;
    this.chunkSize = chunkSize;
    this.delay = delay;
    this.cache = Array(assets.length)
      .fill(0)
      .map(() => new THREE.Texture());
    this.LoadAll();
  }

  static loader = new THREE.TextureLoader();

  private async LoadAsset(asset: string) {
    if (PreloadWorker === null) return;
    const i = this.assets.indexOf(asset);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      PreloadWorker.onmessage = (e) => resolve(e.data);
      PreloadWorker.postMessage({ url: asset });
    });
    createImageBitmap(new Blob([buffer]), { imageOrientation: "flipY" }).then(
      (image) => {
        this.cache[i].image = image;
        this.cache[i].needsUpdate = true;
      }
    );
  }

  private async LoadChunk(chunk: string[]) {
    for (const asset of chunk) {
      await this.LoadAsset(asset);
    }
  }

  private async LoadAll() {
    const priority = [...GameMachine.use.getState().state.context.deck];
    for (let i = 0; i < this.assets.length; i += this.chunkSize) {
      await this.LoadChunk(
        priority.slice(i, i + this.chunkSize).map((i) => this.assets[i])
      );
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
  }

  public getTexture(i: number) {
    return this.cache[i];
  }
}

export const CardArt = new TextureLoader(
  Array(56)
    .fill(0)
    .map((_, i) => TarotDeck.getTarotCard(i))
    .map((card) => `/deck-2/${card.suit[0].toUpperCase()}${card.value}.png`)
);
