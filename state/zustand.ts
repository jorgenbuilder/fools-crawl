import { create } from "zustand";

/**
 * Stores arbitrary state that does not map to game logic and transitions.
 */
export const useArbitraryStore = create<{
  /** Whether the screen is in portrait mode. True if screen is taller than it is wide. */
  portrait: boolean;
  /** Set screen portrait flag, i.e. in response to a screen resize event. */
  setPortrait: (portrait: boolean) => void;
}>((set, get) => ({
  portrait: false,
  setPortrait: (portrait) => set({ portrait }),
}));

namespace ObserveWindow {
  let waitForQuietTimeout: number = undefined;

  /** Reads window dimensions and determines whether the screen is a portrait orientation. */
  function setPortraitFlag() {
    useArbitraryStore
      .getState()
      .setPortrait(window.innerWidth / window.innerHeight < 1);
  }

  /** Debounces the setPortraitFlag function using wait for quiet strategy. */
  function debouncedSetPortraitFlag() {
    window.clearTimeout(waitForQuietTimeout);
    waitForQuietTimeout = window.setTimeout(setPortraitFlag, 100);
  }

  /** Determines initial portrait orientation flag value and binds a recalculation to the window resize event. */
  function bindWindowListeners() {
    window.addEventListener("resize", debouncedSetPortraitFlag);
    setPortraitFlag();
  }

  /** Unbinds the window resize event listener. */
  export function unbindWindowListeners() {
    window.removeEventListener("resize", debouncedSetPortraitFlag);
  }

  // TODO: Reflow entities in the ECS when portrait orientation changes.

  export function init() {
    if (typeof window !== "undefined") {
      unbindWindowListeners();
      bindWindowListeners();
    }
  }
}

ObserveWindow.init();
