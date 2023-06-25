export type GameEvent<K extends keyof any, T extends Record<K, any>> = {
  type: K;
  data: T[K];
};

export class EventSystem<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: ((event: GameEvent<K, T>) => void)[] } =
    {};

  subscribe<K extends keyof T>(
    type: K,
    callback: (event: GameEvent<K, T>) => void
  ): () => void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type]!.push(callback);

    // return an unsubscriber function
    return () => {
      this.unsubscribe(type, callback);
    };
  }

  unsubscribe<K extends keyof T>(
    type: K,
    callback: (event: GameEvent<K, T>) => void
  ) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type]!.filter(
        (listener) => listener !== callback
      );
    }
  }

  emit<K extends keyof T>(type: K, data: T[K]) {
    const event: GameEvent<K, T> = { type, data } as any;
    if (this.listeners[type]) {
      this.listeners[type]!.forEach((listener) => {
        listener(event);
      });
    }
  }
}
