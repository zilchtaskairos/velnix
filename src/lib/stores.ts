/**
 * Velnix — domain stores.
 *
 * Reactive, localStorage-backed state for every social/personal feature.
 * Anime & manga *metadata* is NEVER faked here — it always comes from AniList
 * via the backend. These stores hold only the app's own social content
 * (profiles, posts, messages, library entries, etc.) which legitimately lives
 * client-side in the prototype.
 */

import { createStore } from "./store";
import type { ContinueWatchingEntry } from "./types";

// ───────────────────────────── Continue Watching ─────────────────────────────

export const continueWatching = createStore<ContinueWatchingEntry[]>("continueWatching", []);

export function upsertContinueWatching(entry: ContinueWatchingEntry) {
  continueWatching.set((prev) => {
    const without = prev.filter((e) => e.animeId !== entry.animeId);
    return [entry, ...without].slice(0, 20);
  });
}

export function clearContinueWatching(animeId?: number) {
  continueWatching.set((prev) =>
    animeId ? prev.filter((e) => e.animeId !== animeId) : [],
  );
}

// ───────────────────────────── Watched episodes ─────────────────────────────

// watchedEpisodes[animeId] = number[] of episode numbers fully watched
export const watchedEpisodes = createStore<Record<number, number[]>>("watchedEp", {});

export function markWatched(animeId: number, episode: number) {
  watchedEpisodes.set((prev) => {
    const cur = prev[animeId] ?? [];
    if (cur.includes(episode)) return prev;
    return { ...prev, [animeId]: [...cur, episode].sort((a, b) => a - b) };
  });
}

export function unmarkWatched(animeId: number, episode: number) {
  watchedEpisodes.set((prev) => {
    const cur = prev[animeId] ?? [];
    return { ...prev, [animeId]: cur.filter((e) => e !== episode) };
  });
}

export function isWatched(animeId: number, episode: number): boolean {
  return (watchedEpisodes.get()[animeId] ?? []).includes(episode);
}

// ───────────────────────────── Library ─────────────────────────────

export type LibraryStatus =
  | "WATCHING"
  | "COMPLETED"
  | "PLANNED"
  | "PAUSED"
  | "DROPPED";

export interface LibraryEntry {
  id: number;
  kind: "anime" | "manga";
  title: string;
  coverImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
  status: LibraryStatus;
  episodesWatched?: number;
  totalEpisodes?: number | null;
  chaptersRead?: number;
  rating?: number; // 0-10
  favorite?: boolean;
  updatedAt: number;
}

export const library = createStore<Record<string, LibraryEntry>>("library", {});

export function libraryKey(id: number, kind: "anime" | "manga") {
  return `${kind}:${id}`;
}

export function setLibraryEntry(entry: LibraryEntry) {
  library.set((prev) => ({ ...prev, [libraryKey(entry.id, entry.kind)]: entry }));
}

export function removeLibraryEntry(id: number, kind: "anime" | "manga") {
  library.set((prev) => {
    const next = { ...prev };
    delete next[libraryKey(id, kind)];
    return next;
  });
}

export function toggleFavorite(id: number, kind: "anime" | "manga", partial: Partial<LibraryEntry>) {
  library.set((prev) => {
    const k = libraryKey(id, kind);
    const cur = prev[k];
    if (!cur) {
      return {
        ...prev,
        [k]: {
          id,
          kind,
          title: partial.title ?? "Untitled",
          coverImage: partial.coverImage ?? null,
          bannerImage: partial.bannerImage ?? null,
          color: partial.color ?? null,
          status: "PLANNED",
          favorite: true,
          updatedAt: Date.now(),
        },
      };
    }
    return { ...prev, [k]: { ...cur, favorite: !cur.favorite, updatedAt: Date.now() } };
  });
}

// ───────────────────────────── Profile ─────────────────────────────

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  backgroundUrl?: string | null;
  favoriteAnimeIds: number[];
  privacy: "PUBLIC" | "PRIVATE";
  isPremium: boolean;
  premiumUntil?: number | null;
  joinedAt: number;
  watchMinutesOverride?: number;
}

export const profile = createStore<UserProfile>("profile", {
  username: "you",
  displayName: "You",
  bio: "Anime, manga, and late-night marathons. ✦",
  avatarColor: "#ff2e6e",
  backgroundUrl: null,
  favoriteAnimeIds: [],
  privacy: "PUBLIC",
  isPremium: false,
  premiumUntil: null,
  joinedAt: Date.now(),
});

export function setProfile(updater: Partial<UserProfile>) {
  profile.set((prev) => ({ ...prev, ...updater }));
}

// ───────────────────────────── Pulse (social feed) ─────────────────────────────

export interface PulseAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  verified?: boolean;
}

export interface PulsePost {
  id: string;
  author: PulseAuthor;
  text: string;
  imageUrl?: string;
  animeId?: number;
  animeTitle?: string;
  tags: string[];
  createdAt: number;
  likes: number;
  liked?: boolean;
  comments: number;
  saved?: boolean;
}

const SEED_AUTHORS: PulseAuthor[] = [
  { id: "u1", username: "reina", displayName: "reina ✦", avatarColor: "#ff2e6e", verified: true },
  { id: "u2", username: "kaito.codes", displayName: "Kaito", avatarColor: "#5b8def" },
  { id: "u3", username: "miyu", displayName: "miyu", avatarColor: "#a855f7" },
  { id: "u4", username: "sho", displayName: "Sho", avatarColor: "#22c55e" },
];

// Pulse uses placeholder editorial imagery (Velnix-branded gradients) — these
// are not anime screenshots. Real anime images come from AniList when a post is
// tagged to an anime via Studio.
const SEED_POSTS: PulsePost[] = [
  {
    id: "p1",
    author: SEED_AUTHORS[0],
    text: "just finished the TYBW finale and my jaw is on the floor. the bankai reveals were unreal 🌸 who else is still processing?",
    animeId: 1,
    animeTitle: "Bleach: Thousand-Year Blood War",
    tags: ["bleach", "discussion", "wtf"],
    createdAt: Date.now() - 1000 * 60 * 42,
    likes: 1284,
    comments: 312,
  },
  {
    id: "p2",
    author: SEED_AUTHORS[1],
    text: "hot take: the slice-of-life episodes are what make the action hit harder. you need the quiet before the storm. change my mind.",
    tags: ["unpopular-opinion"],
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    likes: 642,
    comments: 88,
  },
  {
    id: "p3",
    author: SEED_AUTHORS[2],
    text: "spent 6 hours on this edit 🎴 turn the sound on. proud of how the sync came out!",
    imageUrl: "edit",
    tags: ["edit", "fanart", "wip"],
    createdAt: Date.now() - 1000 * 60 * 60 * 7,
    likes: 2310,
    comments: 145,
  },
  {
    id: "p4",
    author: SEED_AUTHORS[3],
    text: "recommend me something to start tonight? short (12 eps), good animation, happy-ish ending please 🙏",
    tags: ["recommendations"],
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    likes: 51,
    comments: 73,
  },
];

export const pulse = createStore<PulsePost[]>("pulse", SEED_POSTS);
export const pulseFollowing = createStore<PulseAuthor[]>("pulseFollowing", SEED_AUTHORS);

export function addPulsePost(post: PulsePost) {
  pulse.set((prev) => [post, ...prev]);
}

export function togglePulseLike(id: string) {
  pulse.set((prev) =>
    prev.map((p) =>
      p.id === id
        ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
        : p,
    ),
  );
}

export function togglePulseSave(id: string) {
  pulse.set((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
}

export function bumpPulseComment(id: string, delta = 1) {
  pulse.set((prev) => prev.map((p) => (p.id === id ? { ...p, comments: Math.max(0, p.comments + delta) } : p)));
}

// ───────────────────────────── DMs ─────────────────────────────

export interface DMContact {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  online?: boolean;
}

export interface DMMessage {
  id: string;
  from: "me" | "them";
  text: string;
  kind?: "text" | "anime" | "manga" | "post" | "sticker";
  refId?: number | string;
  refTitle?: string;
  refImage?: string | null;
  at: number;
}

export interface DMConversation {
  contact: DMContact;
  messages: DMMessage[];
  color: string;
  nickname?: string;
}

export const dms = createStore<DMConversation[]>("dms", [
  {
    contact: { id: "u1", username: "reina", displayName: "reina ✦", avatarColor: "#ff2e6e", online: true },
    color: "#ff2e6e",
    messages: [
      { id: "m1", from: "them", text: "are you caught up on the latest ep??", at: Date.now() - 1000 * 60 * 30 },
      { id: "m2", from: "me", text: "literally watching it right now 😭", at: Date.now() - 1000 * 60 * 28 },
      { id: "m3", from: "them", text: "no spoilers!! watch then text me", at: Date.now() - 1000 * 60 * 27 },
    ],
  },
  {
    contact: { id: "u2", username: "kaito.codes", displayName: "Kaito", avatarColor: "#5b8def" },
    color: "#5b8def",
    messages: [
      { id: "m1", from: "them", text: "party tonight? i finished work early", at: Date.now() - 1000 * 60 * 60 * 5 },
    ],
  },
  {
    contact: { id: "u3", username: "miyu", displayName: "miyu", avatarColor: "#a855f7" },
    color: "#a855f7",
    messages: [
      { id: "m1", from: "me", text: "loved your edit!!", at: Date.now() - 1000 * 60 * 60 * 26 },
      { id: "m2", from: "them", text: "thank you 🥹 took forever", at: Date.now() - 1000 * 60 * 60 * 25 },
    ],
  },
]);

export function sendDM(contactId: string, msg: DMMessage) {
  dms.set((prev) =>
    prev.map((c) =>
      c.contact.id === contactId ? { ...c, messages: [...c.messages, msg] } : c,
    ),
  );
}

export function setDMColor(contactId: string, color: string) {
  dms.set((prev) => prev.map((c) => (c.contact.id === contactId ? { ...c, color } : c)));
}

// ───────────────────────────── Notifications ─────────────────────────────

export type NotificationType =
  | "EPISODE"
  | "FRIEND"
  | "DM"
  | "PULSE"
  | "COMMENT"
  | "PARTY"
  | "CLAIRE"
  | "MANGA"
  | "PREMIUM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  at: number;
  href?: string;
}

export const notifications = createStore<AppNotification[]>("notifications", [
  { id: "n1", type: "EPISODE", title: "New Episode", body: "Bleach: TYBW — Episode 8 is out.", icon: "🎬", read: false, at: Date.now() - 1000 * 60 * 60, href: "/anime/1" },
  { id: "n2", type: "PULSE", title: "reina liked your comment", body: "“turn the sound on 🎴”", icon: "💜", read: false, at: Date.now() - 1000 * 60 * 60 * 4 },
  { id: "n3", type: "DM", title: "New message", body: "Kaito: party tonight?", icon: "✉️", read: false, at: Date.now() - 1000 * 60 * 60 * 5, href: "/dms" },
  { id: "n4", type: "CLAIRE", title: "Claire has picks for you", body: "3 new anime based on your taste.", icon: "☘︎", read: true, at: Date.now() - 1000 * 60 * 60 * 20, href: "/claire" },
  { id: "n5", type: "PARTY", title: "Party invite", body: "miyu invited you to a watch party.", icon: "🎉", read: true, at: Date.now() - 1000 * 60 * 60 * 30, href: "/party" },
]);

export function markAllNotificationsRead() {
  notifications.set((prev) => prev.map((n) => ({ ...n, read: true })));
}
export function clearNotifications() {
  notifications.set([]);
}

// ───────────────────────────── Claire chats ─────────────────────────────

export interface ClaireMessage {
  id: string;
  role: "user" | "claire";
  text: string;
  cards?: { id: number; title: string; image?: string | null; reason?: string }[];
  at: number;
}
export interface ClaireChat {
  id: string;
  title: string;
  messages: ClaireMessage[];
  updatedAt: number;
}

export const claireChats = createStore<ClaireChat[]>("claireChats", []);

export function createClaireChat(title: string): ClaireChat {
  const chat: ClaireChat = { id: `c${Date.now()}`, title, messages: [], updatedAt: Date.now() };
  claireChats.set((prev) => [chat, ...prev]);
  return chat;
}
export function appendClaireMessage(chatId: string, msg: ClaireMessage) {
  claireChats.set((prev) =>
    prev.map((c) =>
      c.id === chatId ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c,
    ),
  );
}
export function deleteClaireChat(chatId: string) {
  claireChats.set((prev) => prev.filter((c) => c.id !== chatId));
}

// ───────────────────────────── Comments ─────────────────────────────

export interface Comment {
  id: string;
  authorName: string;
  authorColor: string;
  text: string;
  likes: number;
  liked?: boolean;
  at: number;
}
// comments[key] = Comment[]  where key = `${animeId}:${episode}`
export const comments = createStore<Record<string, Comment[]>>("comments", {});

export function commentKey(animeId: number, episode: number) {
  return `${animeId}:${episode}`;
}
export function addComment(animeId: number, episode: number, text: string) {
  comments.set((prev) => {
    const k = commentKey(animeId, episode);
    const c: Comment = {
      id: `cm${Date.now()}`,
      authorName: profile.get().displayName,
      authorColor: profile.get().avatarColor,
      text,
      likes: 0,
      at: Date.now(),
    };
    return { ...prev, [k]: [c, ...(prev[k] ?? [])] };
  });
}
export function toggleCommentLike(animeId: number, episode: number, commentId: string) {
  comments.set((prev) => {
    const k = commentKey(animeId, episode);
    const list = prev[k] ?? [];
    return {
      ...prev,
      [k]: list.map((c) =>
        c.id === commentId ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c,
      ),
    };
  });
}

// ───────────────────────────── Settings / Premium ─────────────────────────────

export interface AppSettings {
  autoplay: boolean;
  autoNext: boolean;
  defaultQuality: string;
  preferredAudio: "sub" | "dub";
  reduceData: boolean;
  theme: "amoled" | "charcoal";
}

export const settings = createStore<AppSettings>("settings", {
  autoplay: true,
  autoNext: true,
  defaultQuality: "Auto",
  preferredAudio: "sub",
  reduceData: false,
  theme: "amoled",
});

export function activatePremium(days: number) {
  const until = Date.now() + days * 86400000;
  profile.set((prev) => ({ ...prev, isPremium: true, premiumUntil: until }));
}
export function deactivatePremium() {
  profile.set((prev) => ({ ...prev, isPremium: false, premiumUntil: null }));
}

// ───────────────────────────── Games ─────────────────────────────

export interface GameAccount {
  game: string;
  connected: boolean;
  username?: string;
}

export const gameAccounts = createStore<GameAccount[]>("gameAccounts", []);
