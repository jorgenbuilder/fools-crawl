import * as THREE from "three";
import { GameMachine } from "./game";

export const PreloadWorker =
  typeof window === "undefined" ? null : new Worker("preload-worker.js");

export class TextureLoader {
  private readonly assets: string[];
  private readonly chunkSize: number;
  private readonly delay: number;

  private cache: THREE.Texture[];
  private cancelled: number = -1;
  private priority: number[];

  constructor(assets: string[], chunkSize: number = 4, delay: number = 250) {
    this.assets = assets;
    this.chunkSize = chunkSize;
    this.delay = delay;
    this.cache = Array(assets.length)
      .fill(0)
      .map(() => new THREE.Texture());
    this.priority = [];
    this.LoadAll();
  }

  static loader = new THREE.TextureLoader();

  private async LoadAsset(asset: string) {
    if (PreloadWorker === null) return;
    const i = this.assets.indexOf(asset);
    if (this.cache[i].image !== null) return; // Skip images that were already loaded
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

  private async LoadAll(cancelVersion: number = 0) {
    for (let i = 0; i < this.assets.length; i += this.chunkSize) {
      if (this.cancelled >= cancelVersion) {
        break;
      }
      await this.LoadChunk(
        this.priority.slice(i, i + this.chunkSize).map((i) => this.assets[i])
      );
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
  }

  private cancel() {
    this.cancelled += 1;
  }

  public prioritize(newPriority: number[]) {
    this.cancel();
    this.priority = newPriority;
    this.LoadAll(this.cancelled + 1);
  }

  public getTexture(i: number) {
    return this.cache[i];
  }
}
