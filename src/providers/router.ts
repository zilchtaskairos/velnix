/**
 * Velnix Provider Router.
 *
 * Tries each enabled provider in registry order until one returns a usable
 * source. If a provider throws or returns no sources, the router records the
 * failure and moves on to the next. When all providers fail (or none are
 * enabled), it returns a structured `no_source`/`no_provider` result.
 *
 *     Provider A  →  failed
 *     Provider B  →  failed
 *     Provider C  →  success  ← returned to the Velnix Player
 */

import "server-only";

import type { ResolverResponse } from "@/lib/types";

import { enabledProviders } from "./registry";
import { normalizeEpisode } from "./normalizer";
import type { ProviderContext } from "./types";

const TIMEOUT_MS = Number(process.env.VELNIX_RESOLVER_TIMEOUT_MS?.trim() || "8000");
const MAX_ATTEMPTS = Number(process.env.VELNIX_RESOLVER_MAX_ATTEMPTS?.trim() || "3");

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function resolveSource(
  ctx: ProviderContext,
): Promise<ResolverResponse> {
  const providers = enabledProviders();

  if (providers.length === 0) {
    return {
      status: "no_provider",
      message:
        "No playable provider is configured. Enable a provider in your environment, or supply credentials in src/providers/authorized-provider.ts.",
      attempts: PROVIDER_LABELS(),
    };
  }

  const attempts: ResolverResponse["attempts"] = [];
  const tryLimit = Math.min(MAX_ATTEMPTS, providers.length);

  for (let i = 0; i < tryLimit; i++) {
    const provider = providers[i];
    try {
      const result = await withTimeout(provider.resolve(ctx), TIMEOUT_MS, provider.label);
      if (!result.sources || result.sources.length === 0) {
        attempts.push({
          provider: provider.id,
          outcome: "failed",
          detail: "Provider returned no sources.",
        });
        continue;
      }
      attempts.push({ provider: provider.id, outcome: "success" });
      const data = normalizeEpisode(ctx.animeId, ctx.episode, result, ctx.animeTitle);
      return {
        status: "ok",
        message: data.isSample
          ? "Resolved a sample source for playback testing."
          : "Resolved playable source.",
        attempts,
        data,
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const isTimeout = /timed out/i.test(detail);
      attempts.push({
        provider: provider.id,
        outcome: "failed",
        detail,
      });
      // If the last attempt was a timeout and nothing remains, surface timeout.
      if (i === tryLimit - 1 && isTimeout) {
        return {
          status: "timeout",
          message: "All configured providers timed out.",
          attempts,
        };
      }
    }
  }

  return {
    status: "no_source",
    message: "No playable source currently available. All configured providers failed.",
    attempts,
  };
}

// Helper that lists disabled providers so the response explains what was skipped.
import { PROVIDERS } from "./registry";
function PROVIDER_LABELS(): { provider: string; outcome: "skipped"; detail?: string }[] {
  return PROVIDERS.map((p) => ({
    provider: p.id,
    outcome: "skipped" as const,
    detail: p.enabled ? "enabled" : "disabled",
  }));
}
