"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and before hydration, true afterwards. Submit buttons use it so a quick tap
 * before JavaScript loads can't trigger a native form GET (which would put the phone number in the URL).
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
