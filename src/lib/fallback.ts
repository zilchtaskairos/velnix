/**
 * Velnix — Offline fallback catalog.
 *
 * PURPOSE: Velnix's PRIMARY metadata source is the live AniList API. This
 * catalog is a **graceful-degradation fallback** used ONLY when AniList is
 * unreachable (e.g. a network-isolated preview environment, or an outage).
 *
 * It contains REAL anime metadata (genuine titles, native titles, genres,
 * years, episode counts, studios and characters) so the product is fully
 * demonstrable offline. When the live API is available, it is always preferred
 * and this catalog is never consulted.
 *
 * Fallback IDs live in a dedicated range (20000001+) so they never collide
 * with real AniList IDs in production. Search, Home, Details, the Resolver and
 * Claire all function consistently against these IDs while offline.
 */

import "server-only";

import type { Anime, AnimeCard, AnimeFormat, AnimeSeason, AnimeStatus, Character, RelatedAnime, Song } from "./types";

interface Compact {
  t: string;          // title
  n?: string;         // native
  f: AnimeFormat;
  st: AnimeStatus;
  ep: number | null;
  yr: number;
  se: AnimeSeason | null;
  sc: number | null;
  g: string[];
  studio: string;
  d: string;          // description
  chars?: { name: string; role: string; va?: string }[];
}

const C: Compact[] = [
  { t: "Bleach: Thousand-Year Blood War", n: "ブリーチ 千年血戦篇", f: "TV", st: "RELEASING", ep: 13, yr: 2022, se: "FALL", sc: 88, g: ["Action", "Adventure", "Supernatural", "Fantasy"], studio: "Pierrot", d: "Ichigo Kurosaki and the Soul Reapers face their greatest threat as the Quincy army, led by Yhwach, declares war on the Soul Society.", chars: [{ name: "Ichigo Kurosaki", role: "Main", va: "Masakazu Morita" }, { name: "Rukia Kuchiki", role: "Main", va: "Fumiko Orikasa" }, { name: "Uryu Ishida", role: "Main", va: "Noriaki Sugiyama" }, { name: "Yhwach", role: "Antagonist", va: "Ryotaro Okiayu" }] },
  { t: "Jujutsu Kaisen", n: "呪術廻戦", f: "TV", st: "FINISHED", ep: 24, yr: 2020, se: "FALL", sc: 86, g: ["Action", "Supernatural", "Fantasy", "Horror"], studio: "MAPPA", d: "Yuji Itadori swallows a cursed finger to protect his friends and joins a secret society of sorcerers to fight malevolent curses.", chars: [{ name: "Yuji Itadori", role: "Main", va: "Junya Enoki" }, { name: "Megumi Fushiguro", role: "Main", va: "Yuma Uchida" }, { name: "Nobara Kugisaki", role: "Main", va: "Asami Seto" }, { name: "Satoru Gojo", role: "Main", va: "Yuichi Nakamura" }] },
  { t: "Jujutsu Kaisen Season 2", n: "呪術廻戦 第2期", f: "TV", st: "FINISHED", ep: 23, yr: 2023, se: "SUMMER", sc: 85, g: ["Action", "Supernatural", "Fantasy"], studio: "MAPPA", d: "Gojo's past and the devastating Shibuya Incident arc unfold as curses and sorcerers clash in the streets of Tokyo.", chars: [{ name: "Satoru Gojo", role: "Main", va: "Yuichi Nakamura" }, { name: "Suguru Geto", role: "Main", va: "Takahiro Sakurai" }] },
  { t: "Solo Leveling", n: "나 혼자만 레벨업", f: "TV", st: "RELEASING", ep: 12, yr: 2024, se: "WINTER", sc: 83, g: ["Action", "Adventure", "Fantasy"], studio: "A-1 Pictures", d: "Sung Jinwoo, the world's weakest hunter, gains the unique ability to level up infinitely and rises to become the strongest.", chars: [{ name: "Sung Jinwoo", role: "Main", va: "Taito Ban" }, { name: "Cha Hae-In", role: "Main", va: "Reina Ueda" }] },
  { t: "Frieren: Beyond Journey's End", n: "葬送のフリーレン", f: "TV", st: "FINISHED", ep: 28, yr: 2023, se: "FALL", sc: 91, g: ["Adventure", "Drama", "Fantasy"], studio: "Madhouse", d: "The elf mage Frieren outlives her hero party and embarks on a quiet journey to understand the humans she once travelled with.", chars: [{ name: "Frieren", role: "Main", va: "Atsumi Tanezaki" }, { name: "Fern", role: "Main", va: "Kana Ichinose" }, { name: "Stark", role: "Main", va: "Chiaki Kobayashi" }] },
  { t: "Demon Slayer", n: "鬼滅の刃", f: "TV", st: "FINISHED", ep: 26, yr: 2019, se: "SPRING", sc: 83, g: ["Action", "Supernatural", "Fantasy"], studio: "ufotable", d: "After his family is slaughtered and his sister turned into a demon, Tanjiro becomes a demon slayer to avenge them and cure her.", chars: [{ name: "Tanjiro Kamado", role: "Main", va: "Natsuki Hanae" }, { name: "Nezuko Kamado", role: "Main", va: "Akari Kito" }, { name: "Zenitsu Agatsuma", role: "Main", va: "Hiro Shimono" }] },
  { t: "Demon Slayer: Entertainment District Arc", n: "鬼滅の刃 遊郭編", f: "TV", st: "FINISHED", ep: 11, yr: 2021, se: "FALL", sc: 86, g: ["Action", "Supernatural"], studio: "ufotable", d: "Tanjiro and his friends team up with the flamboyant Sound Hashira Tengen Uzui to battle demons in the red-light district.", chars: [{ name: "Tengen Uzui", role: "Main", va: "Katsuyuki Konishi" }] },
  { t: "Attack on Titan", n: "進撃の巨人", f: "TV", st: "FINISHED", ep: 25, yr: 2013, se: "SPRING", sc: 84, g: ["Action", "Drama", "Fantasy"], studio: "WIT Studio", d: "Humanity lives within enormous walls to protect themselves from man-eating Titans, until one day the wall is breached.", chars: [{ name: "Eren Yeager", role: "Main", va: "Yuki Kaji" }, { name: "Mikasa Ackerman", role: "Main", va: "Yui Ishikawa" }, { name: "Armin Arlert", role: "Main", va: "Marina Inoue" }] },
  { t: "Attack on Titan: Final Season", n: "進撃の巨人 The Final Season", f: "TV", st: "FINISHED", ep: 16, yr: 2020, se: "WINTER", sc: 85, g: ["Action", "Drama", "Fantasy"], studio: "MAPPA", d: "The war moves beyond the walls as the truth of the world is revealed and the final battle for freedom begins.", chars: [{ name: "Eren Yeager", role: "Main", va: "Yuki Kaji" }] },
  { t: "Chainsaw Man", n: "チェンソーマン", f: "TV", st: "FINISHED", ep: 12, yr: 2022, se: "FALL", sc: 84, g: ["Action", "Supernatural"], studio: "MAPPA", d: "Denji merges with his chainsaw devil dog Pochita and joins a devil-hunting agency to pursue a normal life.", chars: [{ name: "Denji", role: "Main", va: "Kikunosuke Toya" }, { name: "Power", role: "Main", va: "Fairouz Ai" }, { name: "Makima", role: "Main", va: "Tomori Kusunoki" }] },
  { t: "Spy x Family", n: "SPY×FAMILY", f: "TV", st: "RELEASING", ep: 25, yr: 2022, se: "SPRING", sc: 82, g: ["Action", "Comedy", "Slice of Life"], studio: "Wit Studio / CloverWorks", d: "A spy, an assassin, and a telepathic child form a fake family for a mission, each hiding their true identity from the others.", chars: [{ name: "Loid Forger", role: "Main", va: "Takuya Eguchi" }, { name: "Anya Forger", role: "Main", va: "Atsumi Tanezaki" }, { name: "Yor Forger", role: "Main", va: "Saori Hayami" }] },
  { t: "My Hero Academia", n: "僕のヒーローアカデミア", f: "TV", st: "FINISHED", ep: 13, yr: 2016, se: "SPRING", sc: 79, g: ["Action", "Comedy"], studio: "Bones", d: "In a world where almost everyone has superpowers, the powerless Izuku Midoriya inherits a legendary quirk and trains to be a hero.", chars: [{ name: "Izuku Midoriya", role: "Main", va: "Daiki Yamashita" }, { name: "Katsuki Bakugo", role: "Main", va: "Nobuhiko Okamoto" }] },
  { t: "One Piece", n: "ONE PIECE", f: "TV", st: "RELEASING", ep: 1090, yr: 1999, se: "FALL", sc: 87, g: ["Action", "Adventure", "Comedy", "Fantasy"], studio: "Toei Animation", d: "Monkey D. Luffy and his pirate crew sail the Grand Line in search of the legendary treasure known as the One Piece.", chars: [{ name: "Monkey D. Luffy", role: "Main", va: "Mayumi Tanaka" }, { name: "Roronoa Zoro", role: "Main", va: "Kazuya Nakai" }, { name: "Nami", role: "Main", va: "Akemi Okamura" }] },
  { t: "Naruto", n: "ナルト", f: "TV", st: "FINISHED", ep: 220, yr: 2002, se: "FALL", sc: 79, g: ["Action", "Adventure", "Fantasy"], studio: "Pierrot", d: "Naruto Uzumaki, a young ninja with a sealed demon fox inside him, strives to become the strongest ninja and lead his village.", chars: [{ name: "Naruto Uzumaki", role: "Main", va: "Junko Takeuchi" }, { name: "Sasuke Uchiha", role: "Main", va: "Noriaki Sugiyama" }, { name: "Sakura Haruno", role: "Main", va: "Chie Nakamura" }] },
  { t: "Naruto: Shippuden", n: "ナルト 疾風伝", f: "TV", st: "FINISHED", ep: 500, yr: 2007, se: "WINTER", sc: 80, g: ["Action", "Adventure", "Fantasy"], studio: "Pierrot", d: "An older Naruto returns to his village and faces the criminal organization Akatsuki in a larger, darker ninja world.", chars: [{ name: "Naruto Uzumaki", role: "Main", va: "Junko Takeuchi" }] },
  { t: "Death Note", n: "デスノート", f: "TV", st: "FINISHED", ep: 37, yr: 2006, se: "FALL", sc: 83, g: ["Mystery", "Psychological", "Supernatural", "Thriller"], studio: "Madhouse", d: "High school student Light Yagami finds a notebook that kills anyone whose name is written in it, sparking a duel of wits with detective L.", chars: [{ name: "Light Yagami", role: "Main", va: "Mamoru Miyano" }, { name: "L", role: "Main", va: "Kappei Yamaguchi" }] },
  { t: "Fullmetal Alchemist: Brotherhood", n: "鋼の錬金術師 FULLMETAL ALCHEMIST", f: "TV", st: "FINISHED", ep: 64, yr: 2009, se: "SPRING", sc: 89, g: ["Action", "Adventure", "Drama", "Fantasy"], studio: "Bones", d: "Brothers Edward and Alphonse Elric seek the Philosopher's Stone to restore their bodies after a forbidden alchemy ritual goes wrong.", chars: [{ name: "Edward Elric", role: "Main", va: "Romi Park" }, { name: "Alphonse Elric", role: "Main", va: "Rie Kugimiya" }] },
  { t: "Steins;Gate", n: "シュタインズ・ゲート", f: "TV", st: "FINISHED", ep: 24, yr: 2011, se: "SPRING", sc: 88, g: ["Sci-Fi", "Psychological", "Drama"], studio: "White Fox", d: "A self-proclaimed mad scientist discovers his microwave can send texts to the past, with dangerous time-bending consequences.", chars: [{ name: "Rintaro Okabe", role: "Main", va: "Mamoru Miyano" }, { name: "Kurisu Makise", role: "Main", va: "Asami Imai" }] },
  { t: "Hunter x Hunter", n: "HUNTER×HUNTER", f: "TV", st: "FINISHED", ep: 148, yr: 2011, se: "FALL", sc: 89, g: ["Action", "Adventure", "Fantasy"], studio: "Madhouse", d: "Gon Freecss sets out to become a Hunter and find his missing father, making lifelong friends and dangerous enemies along the way.", chars: [{ name: "Gon Freecss", role: "Main", va: "Megumi Han" }, { name: "Killua Zoldyck", role: "Main", va: "Mariya Ise" }] },
  { t: "One Punch Man", n: "ワンパンマン", f: "TV", st: "FINISHED", ep: 12, yr: 2015, se: "FALL", sc: 84, g: ["Action", "Comedy", "Sci-Fi"], studio: "Madhouse", d: "Saitama is a hero so powerful he can defeat any villain with a single punch — and he's desperately bored by it.", chars: [{ name: "Saitama", role: "Main", va: "Makoto Furukawa" }, { name: "Genos", role: "Main", va: "Kaito Ishikawa" }] },
  { t: "Tokyo Revengers", n: "東京卍リベンジャーズ", f: "TV", st: "FINISHED", ep: 12, yr: 2021, se: "SPRING", sc: 76, g: ["Action", "Drama", "Supernatural"], studio: "LIDENFILMS", d: "A loser leaps back in time to save his ex-girlfriend by rewriting the future of a violent biker gang.", chars: [{ name: "Takemichi Hanagaki", role: "Main", va: "Yuki Shin" }] },
  { t: "Vinland Saga", n: "ヴィンランド・サガ", f: "TV", st: "FINISHED", ep: 24, yr: 2019, se: "SUMMER", sc: 86, g: ["Action", "Adventure", "Drama"], studio: "Wit Studio", d: "Young Thorfinn seeks revenge against the mercenary who killed his father amid the brutal Viking age.", chars: [{ name: "Thorfinn", role: "Main", va: "Yuto Uemura" }, { name: "Askeladd", role: "Main", va: "Naoya Uchida" }] },
  { t: "Re:ZERO -Starting Life in Another World-", n: "Re:ゼロから始める異世界生活", f: "TV", st: "RELEASING", ep: 25, yr: 2016, se: "SPRING", sc: 82, g: ["Drama", "Fantasy", "Psychological", "Thriller"], studio: "White Fox", d: "Transported to a fantasy world, Subaru discovers he can return from death — and relives every painful failure to save those he loves.", chars: [{ name: "Subaru Natsuki", role: "Main", va: "Yusuke Kobayashi" }, { name: "Emilia", role: "Main", va: "Rie Takahashi" }] },
  { t: "Your Name", n: "君の名は。", f: "MOVIE", st: "FINISHED", ep: 1, yr: 2016, se: "SUMMER", sc: 86, g: ["Romance", "Drama", "Supernatural"], studio: "CoMix Wave Films", d: "A boy and a girl who have never met mysteriously swap bodies and work to find each other as a comet threatens to change everything.", chars: [{ name: "Mitsuha Miyamizu", role: "Main", va: "Mone Kamishiraishi" }, { name: "Taki Tachibana", role: "Main", va: "Ryunosuke Kamiki" }] },
  { t: "Spirited Away", n: "千と千尋の神隠し", f: "MOVIE", st: "FINISHED", ep: 1, yr: 2001, se: "SUMMER", sc: 88, g: ["Adventure", "Supernatural", "Fantasy"], studio: "Studio Ghibli", d: "A young girl wanders into a world of spirits and must work in a bathhouse to free her parents from a witch's curse.", chars: [{ name: "Chihiro", role: "Main", va: "Rumi Hiiragi" }] },
  { t: "A Silent Voice", n: "聲の形", f: "MOVIE", st: "FINISHED", ep: 1, yr: 2016, se: "SUMMER", sc: 86, g: ["Romance", "Drama"], studio: "Kyoto Animation", d: "A former bully seeks redemption by reconnecting with the deaf girl he tormented in elementary school.", chars: [{ name: "Shoya Ishida", role: "Main", va: "Miyu Irino" }, { name: "Shoko Nishimiya", role: "Main", va: "Saori Hayami" }] },
  { t: "Dragon Ball Z", n: "ドラゴンボールZ", f: "TV", st: "FINISHED", ep: 291, yr: 1989, se: "SPRING", sc: 81, g: ["Action", "Adventure", "Comedy", "Fantasy"], studio: "Toei Animation", d: "Goku defends Earth from powerful foes including Saiyans, androids, and magical creatures across the universe.", chars: [{ name: "Goku", role: "Main", va: "Masako Nozawa" }, { name: "Vegeta", role: "Main", va: "Ryo Horikawa" }] },
  { t: "Code Geass", n: "コードギアス 反逆のルルーシュ", f: "TV", st: "FINISHED", ep: 25, yr: 2006, se: "FALL", sc: 84, g: ["Action", "Drama", "Sci-Fi", "Mecha"], studio: "Sunrise", d: "An exiled prince gains the power to command anyone and leads a rebellion against the empire that destroyed his family.", chars: [{ name: "Lelouch Lamperouge", role: "Main", va: "Jun Fukuyama" }] },
  { t: "Tokyo Ghoul", n: "東京喰種", f: "TV", st: "FINISHED", ep: 12, yr: 2014, se: "SUMMER", sc: 75, g: ["Action", "Horror", "Supernatural"], studio: "Pierrot", d: "After a fateful encounter, college student Kaneki becomes half-ghoul and struggles between his human side and monstrous hunger.", chars: [{ name: "Ken Kaneki", role: "Main", va: "Natsuki Hanae" }] },
  { t: "Mob Psycho 100", n: "モブサイコ100", f: "TV", st: "FINISHED", ep: 12, yr: 2016, se: "SUMMER", sc: 84, g: ["Action", "Comedy", "Supernatural"], studio: "Bones", d: "A powerful but meek psychic middle-schooler tries to live a normal life while suppressing his explosive emotions.", chars: [{ name: "Shigeo Kageyama", role: "Main", va: "Setsuo Ito" }, { name: "Arataka Reigen", role: "Main", va: "Takahiro Sakurai" }] },
  { t: "The Promised Neverland", n: "約束のネバーランド", f: "TV", st: "FINISHED", ep: 12, yr: 2019, se: "WINTER", sc: 81, g: ["Mystery", "Psychological", "Sci-Fi", "Thriller"], studio: "CloverWorks", d: "Orphans at a seemingly idyllic orphanage discover the horrifying truth about their home and plot a daring escape.", chars: [{ name: "Emma", role: "Main", va: "Sumire Morohoshi" }] },
  { t: "Haikyu!!", n: "ハイキュー!!", f: "TV", st: "FINISHED", ep: 25, yr: 2014, se: "SPRING", sc: 82, g: ["Sports", "Comedy", "Drama"], studio: "Production I.G", d: "A short, determined player joins his high school volleyball team and chases his dream of national glory.", chars: [{ name: "Shoyo Hinata", role: "Main", va: "Ayumu Murase" }, { name: "Tobio Kageyama", role: "Main", va: "Kaito Ishikawa" }] },
  { t: "Black Clover", n: "ブラッククローバー", f: "TV", st: "FINISHED", ep: 170, yr: 2017, se: "FALL", sc: 77, g: ["Action", "Comedy", "Fantasy"], studio: "Pierrot", d: "Born without magic in a magical world, Asta uses his physical strength and anti-magic sword to become the Wizard King.", chars: [{ name: "Asta", role: "Main", va: "Gakuto Kajiwara" }, { name: "Yuno", role: "Main", va: "Nobuhiko Okamoto" }] },
  { t: "Blue Lock", n: "ブルーロック", f: "TV", st: "RELEASING", ep: 24, yr: 2022, se: "FALL", sc: 80, g: ["Sports", "Drama"], studio: "Eight Bit", d: "Japan's top strikers are locked in a ruthless training program to forge the world's greatest egoist goalscorer.", chars: [{ name: "Yoichi Isagi", role: "Main", va: "Kazuki Ura" }] },
  { t: "Oshi no Ko", n: "推しの子", f: "TV", st: "RELEASING", ep: 11, yr: 2023, se: "SPRING", sc: 83, g: ["Drama", "Supernatural", "Psychological"], studio: "Doga Kobo", d: "Twins reincarnated as the children of their favorite idol navigate the dark side of the entertainment industry.", chars: [{ name: "Aqua Hoshino", role: "Main", va: "Takeo Otsuka" }, { name: "Ruby Hoshino", role: "Main", va: "Yurie Igoma" }] },
  { t: "Mushoku Tensei: Jobless Reincarnation", n: "無職転生", f: "TV", st: "RELEASING", ep: 11, yr: 2021, se: "WINTER", sc: 82, g: ["Adventure", "Drama", "Fantasy", "Ecchi"], studio: "Studio Bind", d: "A NEET is reborn in a magical world and resolves to live his new life to the fullest, training in magic from childhood.", chars: [{ name: "Rudeus Greyrat", role: "Main", va: "Yumi Uchiyama" }] },
  { t: "That Time I Got Reincarnated as a Slime", n: "転生したらスライムだった件", f: "TV", st: "RELEASING", ep: 24, yr: 2018, se: "FALL", sc: 80, g: ["Action", "Adventure", "Comedy", "Fantasy"], studio: "8bit", d: "Reincarnated as a slime in a fantasy world, a salaryman gains powerful abilities and builds a nation of monsters.", chars: [{ name: "Rimuru Tempest", role: "Main", va: "Miho Okasaki" }] },
  { t: "Cowboy Bebop", n: "カウボーイビバップ", f: "TV", st: "FINISHED", ep: 26, yr: 1998, se: "SPRING", sc: 86, g: ["Action", "Adventure", "Sci-Fi", "Drama"], studio: "Sunrise", d: "A ragtag crew of bounty hunters chases criminals across the solar system while running from their own pasts.", chars: [{ name: "Spike Spiegel", role: "Main", va: "Koichi Yamadera" }] },
  { t: "Neon Genesis Evangelion", n: "新世紀エヴァンゲリオン", f: "TV", st: "FINISHED", ep: 26, yr: 1995, se: "FALL", sc: 82, g: ["Action", "Drama", "Mecha", "Psychological", "Sci-Fi"], studio: "Gainax", d: "Reluctant teenager Shinji pilots a giant biomechanical mech to fight mysterious beings called Angels.", chars: [{ name: "Shinji Ikari", role: "Main", va: "Megumi Ogata" }, { name: "Rei Ayanami", role: "Main", va: "Megumi Hayashibara" }] },
  { t: "Made in Abyss", n: "メイドインアビス", f: "TV", st: "RELEASING", ep: 13, yr: 2017, se: "SUMMER", sc: 85, g: ["Adventure", "Drama", "Fantasy", "Horror", "Mystery"], studio: "Kinema Citrus", d: "A young orphan descends into a vast and deadly abyss to find her mother, accompanied by a robot boy.", chars: [{ name: "Riko", role: "Main", va: "Miyu Tomita" }] },
  { t: "Horimiya", n: "ホリミヤ", f: "TV", st: "FINISHED", ep: 13, yr: 2021, se: "WINTER", sc: 80, g: ["Comedy", "Romance", "Slice of Life"], studio: "CloverWorks", d: "Popular Hori and gloomy Miyamura discover each other's hidden sides and an unexpected romance blooms.", chars: [{ name: "Kyouko Hori", role: "Main", va: "Haruka Tomatsu" }, { name: "Izumi Miyamura", role: "Main", va: "Kouki Uchiyama" }] },
  { t: "Toradora!", n: "とらドラ!", f: "TV", st: "FINISHED", ep: 25, yr: 2008, se: "FALL", sc: 81, g: ["Comedy", "Romance", "Drama"], studio: "J.C.Staff", d: "A scary-looking boy and a tiny, fierce girl team up to help each other win over their crushes — and slowly fall for each other.", chars: [{ name: "Ryuji Takasu", role: "Main", va: "Junji Majima" }, { name: "Taiga Aisaka", role: "Main", va: "Rie Kugimiya" }] },
  { t: "Clannad: After Story", n: "CLANNAD ～AFTER STORY～", f: "TV", st: "FINISHED", ep: 24, yr: 2008, se: "FALL", sc: 87, g: ["Drama", "Romance", "Slice of Life", "Supernatural"], studio: "Kyoto Animation", d: "The emotional continuation of Tomoya and Nagisa's story as they navigate adulthood, family, and heartbreak.", chars: [{ name: "Tomoya Okazaki", role: "Main", va: "Kenji Nojima" }] },
  { t: "Cyberpunk: Edgerunners", n: "サイバーパンク エッジランナーズ", f: "TV", st: "FINISHED", ep: 10, yr: 2022, se: "SUMMER", sc: 85, g: ["Action", "Sci-Fi", "Drama"], studio: "Trigger", d: "A street kid in Night City becomes an edgerunner — a mercenary outlaw augmented with illegal cybertech.", chars: [{ name: "David Martinez", role: "Main", va: "Kenn" }, { name: "Lucy", role: "Main", va: "Aoi Yuki" }] },
  { t: "Bocchi the Rock!", n: "ぼっち・ざ・ろっく!", f: "TV", st: "FINISHED", ep: 12, yr: 2022, se: "FALL", sc: 85, g: ["Comedy", "Music", "Slice of Life"], studio: "CloverWorks", d: "A painfully shy girl joins a rock band and slowly confronts her social anxiety through music.", chars: [{ name: "Hitori Gotoh", role: "Main", va: "Yoshino Aoyama" }] },
  { t: "Tokyo Magnitude 8.0", n: "東京マグニチュード8.0", f: "TV", st: "FINISHED", ep: 11, yr: 2009, se: "SUMMER", sc: 78, g: ["Drama"], studio: "Bones", d: "A devastating earthquake hits Tokyo and a girl must find her way home with her younger brother." },
  { t: "Kaguya-sama: Love is War", n: "かぐや様は告らせたい", f: "TV", st: "FINISHED", ep: 12, yr: 2019, se: "WINTER", sc: 82, g: ["Comedy", "Romance", "Psychological"], studio: "A-1 Pictures", d: "Two elite student council members are too proud to confess their love and scheme to make the other confess first.", chars: [{ name: "Miyuki Shirogane", role: "Main", va: "Makoto Furukawa" }, { name: "Kaguya Shinomiya", role: "Main", va: "Aoi Koga" }] },
  { t: "The Eminence in Shadow", n: "陰の実力者になりたくて!", f: "TV", st: "RELEASING", ep: 20, yr: 2022, se: "FALL", sc: 81, g: ["Action", "Comedy", "Fantasy"], studio: "Nexus", d: "A boy reincarnated into a fantasy world pretends to be a background character while secretly running a shadow organization.", chars: [{ name: "Cid Kagenou", role: "Main", va: "Seiichiro Yamashita" }] },
  { t: "Dr. Stone", n: "Dr.STONE", f: "TV", st: "RELEASING", ep: 24, yr: 2019, se: "SUMMER", sc: 81, g: ["Adventure", "Comedy", "Sci-Fi"], studio: "TMS Entertainment", d: "After all humanity turns to stone, a genius boy revives thousands of years later and uses science to rebuild civilization.", chars: [{ name: "Senku Ishigami", role: "Main", va: "Yusuke Kobayashi" }] },
  { t: "Monster", n: "MONSTER", f: "TV", st: "FINISHED", ep: 74, yr: 2004, se: "SPRING", sc: 87, g: ["Drama", "Mystery", "Psychological", "Thriller"], studio: "Madhouse", d: "A brilliant surgeon hunts the serial killer he once saved, unearthing a monstrous conspiracy.", chars: [{ name: "Kenzo Tenma", role: "Main", va: "Hidenobu Kiuchi" }] },
];

const BASE = 20000001;
const byTitle = new Map<string, number>();
const ALL: Anime[] = C.map((c, i) => {
  const id = BASE + i;
  byTitle.set(c.t.toLowerCase(), id);
  return compactToAnime(c, id, i);
});

// Link sequels/relations where titles clearly belong together.
linkRelations();

function compactToAnime(c: Compact, id: number, idx: number): Anime {
  const characters: Character[] = (c.chars ?? []).map((ch) => ({
    id: id * 10 + Math.floor(Math.random() * 9000),
    name: ch.name,
    role: ch.role,
    image: null,
    voiceActors: ch.va ? [{ id: Math.floor(Math.random() * 1e7), name: ch.va, image: null, language: "Japanese" }] : [],
  }));
  const songs: Song[] = [];
  if (c.st !== "NOT_YET_RELEASED") {
    songs.push({ type: "OPENING", title: "Opening Theme", artist: "Various Artists" });
    if (c.f === "TV") songs.push({ type: "ENDING", title: "Ending Theme", artist: "Various Artists" });
  }
  return {
    id,
    title: { userPreferred: c.t, english: c.t, romaji: c.t, native: c.n ?? null },
    description: c.d,
    coverImage: { url: null, largeColor: pickColor(c.t) },
    bannerImage: null,
    format: c.f,
    status: c.st,
    episodes: c.ep,
    duration: c.f === "MOVIE" ? 110 : 24,
    season: c.se,
    seasonYear: c.yr,
    averageScore: c.sc,
    meanScore: c.sc,
    popularity: (90 - idx) * 1000,
    genres: c.g,
    studios: [{ id: Math.floor(Math.random() * 1e6), name: c.studio, isAnimation: true }],
    startDate: { year: c.yr },
    trailer: null,
    nextAiringEpisode: c.st === "RELEASING" ? { airingAt: Date.now() / 1000 + 86400, timeUntilAiring: 86400, episode: (c.ep ?? 1) + 1 } : null,
    relations: [],
    recommendations: [],
    characters,
    songs,
    externalLinks: [],
  };
}

function pickColor(seed: string): string {
  const palette = ["#ff2e6e", "#5b8def", "#a855f7", "#22c55e", "#f59e0b", "#06b6d4", "#f87171"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function linkRelations() {
  const rel: Record<string, string[]> = {
    "Bleach: Thousand-Year Blood War": ["Jujutsu Kaisen"],
    "Jujutsu Kaisen": ["Jujutsu Kaisen Season 2", "Chainsaw Man"],
    "Demon Slayer": ["Demon Slayer: Entertainment District Arc", "Jujutsu Kaisen"],
    "Demon Slayer: Entertainment District Arc": ["Demon Slayer"],
    "Attack on Titan": ["Attack on Titan: Final Season", "Vinland Saga"],
    "Attack on Titan: Final Season": ["Attack on Titan"],
    "Naruto": ["Naruto: Shippuden", "Bleach: Thousand-Year Blood War"],
    "Naruto: Shippuden": ["Naruto"],
  };
  for (const anime of ALL) {
    const t = anime.title.userPreferred ?? "";
    const recs = rel[t] ?? [];
    const pool = ALL.filter((a) => a.title.userPreferred !== t);
    // 2-4 recommendations by shared genre
    const rec = pool
      .map((a) => ({ a, s: a.genres.filter((g) => anime.genres.includes(g)).length }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => toRelated(x.a, "RECOMMENDATION"));
    anime.recommendations = rec;
    // explicit relations
    anime.relations = recs
      .map((r) => ALL.find((a) => a.title.userPreferred === r))
      .filter((x): x is Anime => !!x)
      .map((a) => toRelated(a, isSequel(a, anime) ? "SEQUEL" : "PREQUEL"));
    if (anime.relations.length === 0 && rec.length) anime.relations = rec.slice(0, 2).map((r) => ({ ...r, relationType: "SIDE_STORY" }));
  }
}

function isSequel(a: Anime, b: Anime) {
  return (a.seasonYear ?? 0) >= (b.seasonYear ?? 0);
}
function toRelated(a: Anime, relationType: string): RelatedAnime {
  return {
    id: a.id,
    title: a.title.userPreferred ?? "Untitled",
    coverImage: null,
    bannerImage: null,
    format: a.format,
    relationType,
    episodes: a.episodes,
    year: a.seasonYear,
  };
}

// ───────────────────────────── Public fallback API ─────────────────────────────

export const fallbackIsOffline = true;

export function fallbackSearch(term: string): { items: AnimeCard[]; pageInfo: { currentPage: number; hasNextPage: boolean; total: number } } {
  const q = term.toLowerCase();
  const items = ALL.filter((a) => {
    const hay = `${a.title.userPreferred} ${a.title.native ?? ""} ${a.genres.join(" ")} ${a.studios[0]?.name ?? ""}`.toLowerCase();
    return hay.includes(q);
  })
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
    .map(toCard);
  return { items, pageInfo: { currentPage: 1, hasNextPage: false, total: items.length } };
}

export function fallbackGetAnime(id: number): Anime | null {
  return ALL.find((a) => a.id === id) ?? null;
}

export function fallbackByGenre(genre: string, n = 18): AnimeCard[] {
  return ALL.filter((a) => a.genres.includes(genre))
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
    .slice(0, n)
    .map(toCard);
}

export interface FallbackHome {
  hero: Anime;
  trending: AnimeCard[];
  topAiring: AnimeCard[];
  popular: AnimeCard[];
  recommended: AnimeCard[];
  recentlyUpdated: AnimeCard[];
  newReleases: AnimeCard[];
}

export function fallbackHome(): FallbackHome {
  const byScore = [...ALL].sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
  const airing = ALL.filter((a) => a.status === "RELEASING");
  const recent = [...ALL].sort((a, b) => (b.seasonYear ?? 0) - (a.seasonYear ?? 0));
  return {
    hero: ALL.find((a) => a.title.userPreferred === "Bleach: Thousand-Year Blood War") ?? byScore[0],
    trending: byScore.slice(0, 18).map(toCard),
    topAiring: airing.slice(0, 18).map(toCard),
    popular: byScore.slice(0, 18).map(toCard),
    recommended: byScore.slice(8, 26).map(toCard),
    recentlyUpdated: airing.slice(0, 18).map(toCard),
    newReleases: recent.slice(0, 12).map(toCard),
  };
}

export function fallbackRecommend(term: string, taste: string[]): { results: AnimeCard[]; detected: string[] } {
  const lower = term.toLowerCase();
  const genreHits = ALL.flatMap((a) => a.genres).filter((g, i, arr) => arr.indexOf(g) === i);
  const detected = new Set<string>();
  for (const g of genreHits) if (lower.includes(g.toLowerCase())) detected.add(g);
  taste.forEach((g) => detected.add(g));
  // keyword -> genre
  if (/(romance|love|couple|date)/.test(lower)) detected.add("Romance");
  if (/(action|fight|battle|powerful)/.test(lower)) detected.add("Action");
  if (/(isekai|reincarnat|magic|fantasy)/.test(lower)) detected.add("Fantasy");
  if (/(mystery|detective|thriller)/.test(lower)) detected.add("Mystery");
  if (/(comedy|funny|wholesome|cozy)/.test(lower)) detected.add("Comedy");
  if (/(mecha|robot|sci|space|cyber)/.test(lower)) detected.add("Sci-Fi");

  const results = ALL.map((a) => ({ a, s: a.genres.filter((g) => detected.has(g)).length * 5 + (a.averageScore ?? 0) / 20 }))
    .filter((x) => {
      const name = (x.a.title.userPreferred ?? "").toLowerCase().split(":")[0];
      return lower.includes(name) || x.s > 0;
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => toCard(x.a));
  return { results, detected: Array.from(detected) };
}

function toCard(a: Anime): AnimeCard {
  return {
    id: a.id,
    title: a.title.userPreferred ?? "Untitled",
    nativeTitle: a.title.native ?? null,
    coverImage: a.coverImage?.url ?? null,
    bannerImage: a.bannerImage ?? null,
    color: a.coverImage?.largeColor ?? null,
    format: a.format,
    episodes: a.episodes,
    seasonYear: a.seasonYear,
    status: a.status,
    genres: a.genres,
    averageScore: a.averageScore,
  };
}

export const FALLBACK_MARKER = "__velnix_fallback__";
