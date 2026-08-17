/**
 * Velnix Provider catalog — describes available providers for the Watch page's
 * SERVER selector. This exposes provider *metadata* (ids, labels, capabilities)
 * only — never credentials or internals. Used so the UI can list providers and
 * show which one resolved the current episode.
 */

import { NextResponse } from "next/server";
import { enabledProviders, PROVIDERS } from "@/providers/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const enabled = enabledProviders();
  const catalog = PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    enabled: p.enabled,
    // Capability hints (diagnostics only):
    capabilities:
      p.id === "demo" || p.id === "sample"
        ? ["HLS", "SUB"]
        : ["HLS", "MP4", "SUB", "DUB", "DL"],
  }));

  return NextResponse.json({
    status: "ok",
    count: enabled.length,
    providers: catalog,
    enabledIds: enabled.map((p) => p.id),
  });
}
