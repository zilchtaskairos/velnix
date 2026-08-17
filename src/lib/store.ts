/**
 * Velnix — client persistence layer.
 *
 * A tiny localStorage-backed reactive store. All social/personal features in
 * the prototype (Library, Continue Watching, Pulse, DMs, Profile,
 * Notifications, Claire chats, Comments, Premium, Settings) run against this
 * so the product is fully functional without a backend account system.
 *
 * When a real backend/database is added later, these stores are the exact
 * shapes the server should persist (see database/schema.sql).
 */

"use client";

import { useSyncExternalStore } from "react";

const NS = "velnix:";

export interface Store<T> {
  key: string;
  get(): T;
  set(updater: T | ((prev: T) => T)): void;
  subscribe(cb: () => void): () => void;
  use(): T;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("velnix:store", { detail: { key } }));
  } catch {
    /* quota / private mode — fail silently */
  }
}

export function createStore<T>(key: string, fallback: T): Store<T> {
  const listeners = new Set<() => void>();
  let cache: { v: T } | null = null;

  const get = (): T => {
    if (cache) return cache.v;
    const v = read<T>(key, fallback);
    cache = { v };
    return v;
  };

  const set = (updater: T | ((prev: T) => T)) => {
    const prev = get();
    const next =
      typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
    cache = { v: next };
    write(key, next);
    listeners.forEach((l) => l());
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = (e: Event) => {
      const ce = e as CustomEvent;
      if (!ce.detail || ce.detail.key === key) {
        cache = null;
        cb();
      }
    };
    window.addEventListener("velnix:store", onStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("velnix:store", onStorage);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    key,
    get,
    set,
    subscribe,
    use() {
      return useSyncExternalStore(subscribe, get, () => fallback);
    },
  };
}

// Reset cache on HMR to avoid stale reads in dev.
if (typeof window !== "undefined") {
  (window as unknown as { __velnixStores?: Record<string, Store<unknown>> }).__velnixStores ??= {};
}
