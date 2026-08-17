/** Velnix — season/relations grouping logic (shared, framework-agnostic). */

import type { RelatedAnime } from "./types";

export interface SeasonGroup {
  key: string;
  label: string;
  items: { id: number; title: string; current?: boolean }[];
}

/** Build season/related tabs from an anime's relations. Only existing groups show. */
export function buildSeasonGroups(
  currentId: number,
  currentTitle: string,
  relations: RelatedAnime[],
): SeasonGroup[] {
  const main: SeasonGroup["items"] = [{ id: currentId, title: currentTitle, current: true }];

  const movies: SeasonGroup["items"] = [];
  const ovas: SeasonGroup["items"] = [];
  const specials: SeasonGroup["items"] = [];
  const onas: SeasonGroup["items"] = [];
  const spinoffs: SeasonGroup["items"] = [];

  for (const r of relations) {
    const rt = (r.relationType || "").toUpperCase();
    const f = (r.format || "").toUpperCase();
    const node = { id: r.id, title: r.title };
    if (f === "MOVIE") movies.push(node);
    else if (f === "OVA") ovas.push(node);
    else if (f === "SPECIAL") specials.push(node);
    else if (f === "ONA") onas.push(node);
    else if (["SPIN_OFF", "SIDE_STORY", "ALTERNATIVE"].includes(rt)) spinoffs.push(node);
    else if (["SEQUEL", "PREQUEL", "PARENT", "CONTAINS", "ADAPTATION", "OTHER", "COMPILATION"].includes(rt))
      main.push(node);
  }

  const groups: SeasonGroup[] = [{ key: "seasons", label: "Seasons", items: dedupe(main) }];
  if (movies.length) groups.push({ key: "movies", label: `Movies (${movies.length})`, items: dedupe(movies) });
  if (ovas.length) groups.push({ key: "ova", label: `OVAs (${ovas.length})`, items: dedupe(ovas) });
  if (specials.length) groups.push({ key: "specials", label: `Specials (${specials.length})`, items: dedupe(specials) });
  if (onas.length) groups.push({ key: "ona", label: `ONAs (${onas.length})`, items: dedupe(onas) });
  if (spinoffs.length) groups.push({ key: "spinoff", label: `Spin-offs (${spinoffs.length})`, items: dedupe(spinoffs) });

  return groups.filter((g) => g.items.length > 0);
}

function dedupe(items: SeasonGroup["items"]): SeasonGroup["items"] {
  const seen = new Set<number>();
  const out: SeasonGroup["items"] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}
