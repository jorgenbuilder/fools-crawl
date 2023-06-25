import { create } from "zustand";
import { EventSystem } from "./events";

namespace Dialogue {
  export namespace Events {
    export enum Keys {
      DisplayDialogue = "DisplayDialogue",
    }

    export type DialogueEventMap = {
      [Keys.DisplayDialogue]: string[] | string;
    };

    export const System = new EventSystem<DialogueEventMap>();
  }

  type DialogueState = {
    queue: string[];
    enqueue: (text: string) => void;
  };

  export const use = create<DialogueState>((set) => ({
    queue: [],
    enqueue: (text: string) => {
      // Split the text into lines and add each line to the queue
      const lines = text.split("\n");
      set((state) => ({ queue: [...state.queue, ...lines] }));
    },
  }));

  Events.System.subscribe(Events.Keys.DisplayDialogue, ({ data }) => {
    if (Array.isArray(data)) {
      for (const line of data) {
        use.setState((state) => ({ queue: [...state.queue, line] }));
      }
    } else if (typeof data === "string") {
      use.setState((state) => ({ queue: [...state.queue, data] }));
    }
  });
}
export default Dialogue;
