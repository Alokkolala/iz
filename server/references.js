// Curated reference shots per Mangystau sight.
// Sources: Pexels (free license, no attribution required) + Wikimedia Commons (CC BY-SA — credit retained).
// `tip` is a one-line technique hook that anchors the reel to the AI's text critique.

const wm = (file, width = 900) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const wmPage = (file) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const pxPage = (id) => `https://www.pexels.com/photo/${id}/`;

// ---- Bozzhyra / Boszhira / Bozjyra ----------------------------------------
const bozzhyra = [
  { src: px(21419429), tip: "Wide foreground rock leading to the fangs — 24mm", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419429), license: "Pexels" },
  { src: px(21419426), tip: "Human figure for scale — keep them 1/3 from the edge", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419426), license: "Pexels" },
  { src: px(26311726), tip: "Cliff-edge hero pose, low sidelight", attribution: "Radis B", sourceUrl: pxPage(26311726), license: "Pexels" },
  { src: px(26311725), tip: "Hiker scale on the descent — show the path", attribution: "Radis B", sourceUrl: pxPage(26311725), license: "Pexels" },
  { src: px(26311720), tip: "Tight on rock texture — fill the frame", attribution: "Radis B", sourceUrl: pxPage(26311720), license: "Pexels" },
  { src: px(25460645), tip: "Barren canyon — let negative space breathe", attribution: "Yerzhan99", sourceUrl: pxPage(25460645), license: "Pexels" },
  { src: px(21419430), tip: "Layered ridges, telephoto compression", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419430), license: "Pexels" },
  { src: px(21419394), tip: "Eroded cliff edge from low angle", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419394), license: "Pexels" },

  { src: wm("Fangs of Bozzhyra.jpg"), tip: "Symmetry of the two fangs against deep sky", attribution: "Wikimedia Commons", sourceUrl: wmPage("Fangs of Bozzhyra.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Бозжыра утром.jpg"), tip: "First light from the upper deck", attribution: "Wikimedia Commons", sourceUrl: wmPage("Бозжыра утром.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Panorama \"Korablik\" of Bozzhyra.jpg"), tip: "Panorama from the Korablik viewpoint", attribution: "Wikimedia Commons", sourceUrl: wmPage("Panorama \"Korablik\" of Bozzhyra.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra Gorge 50MP Panorama.jpg"), tip: "Full-gorge panorama — stitch wide & flat", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra Gorge 50MP Panorama.jpg"), license: "CC BY-SA" },
  { src: wm("Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), tip: "Off-season cold tones — November palette", attribution: "Wikimedia Commons", sourceUrl: wmPage("Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Aurora outlier, Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), tip: "Aurora outlier as a foreground anchor", attribution: "Wikimedia Commons", sourceUrl: wmPage("Aurora outlier, Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra Valley in Karakiya, Mangystau, Kazakhstan (May 2024).jpg"), tip: "Spring green floor against the white cliffs", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra Valley in Karakiya, Mangystau, Kazakhstan (May 2024).jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra upper observation deck.jpg"), tip: "Standard upper deck framing — start here", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra upper observation deck.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra valley, Mangistau region, Kazakhstan.jpg"), tip: "Whole valley wide — establishing shot", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra valley, Mangistau region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra valley, Mangistau, Kazakhstan.jpg"), tip: "Side-on profile of the fangs ridge", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra valley, Mangistau, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: "Classic Bozjyra hero — golden hour", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, limestone formation.jpg"), tip: "Isolate one limestone tower — minimalist", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, limestone formation.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, northward view.jpg"), tip: "Northward facing — flatter light, more detail", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, northward view.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, erosionary formation.jpg"), tip: "Erosion texture, sidelit", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, erosionary formation.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, erosion hole.jpg"), tip: "Natural arch as a frame inside the frame", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, erosion hole.jpg"), license: "CC BY-SA" },
  { src: wm("Southeast view on Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: "Southeast view — second-best vantage", attribution: "Wikimedia Commons", sourceUrl: wmPage("Southeast view on Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, dombyra player.jpg"), tip: "Person + dombyra — cultural storytelling shot", attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, dombyra player.jpg"), license: "CC BY-SA" },
  { src: wm("Dombyra player in Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: "Tighter on musician — environmental portrait", attribution: "Wikimedia Commons", sourceUrl: wmPage("Dombyra player in Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Couple in traditional Kazakh clothing in Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: "Traditional clothing + landscape = story", attribution: "Wikimedia Commons", sourceUrl: wmPage("Couple in traditional Kazakh clothing in Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("On the ocean's bottom.jpg"), tip: "Top-down — old seabed texture", attribution: "Wikimedia Commons", sourceUrl: wmPage("On the ocean's bottom.jpg"), license: "CC BY-SA" },
];

// ---- Sherkala / Sherqala --------------------------------------------------
const sherkala = [
  { src: wm("Sherqala.jpg"), tip: "Full silhouette against open sky — minimal frame", attribution: "Wikimedia Commons", sourceUrl: wmPage("Sherqala.jpg"), license: "CC BY-SA" },
  { src: wm("Sherkala, Mangistau, Kazakhstan.jpg"), tip: "East-facing sunrise, low horizon", attribution: "Wikimedia Commons", sourceUrl: wmPage("Sherkala, Mangistau, Kazakhstan.jpg"), license: "CC BY-SA" },
];

// ---- Tuzbair -------------------------------------------------------------
const tuzbair = [
  { src: wm("Sor Tuzbair, Mangistau, Kazakhstan, November 2024.jpg"), tip: "Eroded white cliffs over the salt pan", attribution: "Wikimedia Commons", sourceUrl: wmPage("Sor Tuzbair, Mangistau, Kazakhstan, November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Mount Airakty. Kazakhstan, Mangistau. November 2024.jpg"), tip: "Airakty massif — context for the Tuzbair plateau", attribution: "Wikimedia Commons", sourceUrl: wmPage("Mount Airakty. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
];

// ---- Kyzylkup -------------------------------------------------------------
const kyzylkup = [
  { src: wm("Кызылкуп на рассвете.jpg"), tip: "Sunrise rake-light over the stripes", attribution: "Wikimedia Commons", sourceUrl: wmPage("Кызылкуп на рассвете.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Кызылкуп \" Тирамису\".jpg"), tip: "Telephoto compression of the layered ridges", attribution: "Wikimedia Commons", sourceUrl: wmPage("Кызылкуп \" Тирамису\".jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Kyzylkup site at Ustyurt National Park.jpg"), tip: "Wide context — show the scale of the formation", attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup site at Ustyurt National Park.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup site at Ustyurt Nature Reserve.jpg"), tip: "Second angle — same ridge from the reserve side", attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup site at Ustyurt Nature Reserve.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup.jpg"), tip: "Default establishing frame", attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup strange.jpg"), tip: "Look for the odd formations — break the obvious frame", attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup strange.jpg"), license: "CC BY-SA" },
];

// ---- Torysh (Valley of Balls) --------------------------------------------
const torysh = [
  { src: wm("Конкреции в Западном Казахстане. Concretions. Western Kazakhstan.JPG"), tip: "Ball as foreground anchor — low sidelight", attribution: "Wikimedia Commons", sourceUrl: wmPage("Конкреции в Западном Казахстане. Concretions. Western Kazakhstan.JPG"), license: "CC BY-SA" },
  { src: px(21419391), tip: "Cloud shadow over open plain — patience pays", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419391), license: "Pexels" },
];

// ---- Caspian / Aktau coast -----------------------------------------------
const caspian = [
  { src: px(20591586), tip: "Rocks + building — show the human edge of the coast", attribution: "Radis B", sourceUrl: pxPage(20591586), license: "Pexels" },
  { src: px(20591580), tip: "Promenade statue + gazebo as foreground", attribution: "Radis B", sourceUrl: pxPage(20591580), license: "Pexels" },
  { src: px(24778473), tip: "Houses on the shore — sense of place", attribution: "Radis B", sourceUrl: pxPage(24778473), license: "Pexels" },
  { src: px(20591590), tip: "Gazebo silhouette against Caspian", attribution: "Radis B", sourceUrl: pxPage(20591590), license: "Pexels" },
  { src: px(20591581), tip: "Promenade leading line into the sea", attribution: "Radis B", sourceUrl: pxPage(20591581), license: "Pexels" },
  { src: px(20049157), tip: "Columns frame — shoot through architecture", attribution: "Radis B", sourceUrl: pxPage(20049157), license: "Pexels" },
  { src: px(20049155), tip: "Barren rocks foreground, sea negative space", attribution: "Radis B", sourceUrl: pxPage(20049155), license: "Pexels" },
  { src: px(20591584), tip: "Rock cluster low, sea horizon high", attribution: "Radis B", sourceUrl: pxPage(20591584), license: "Pexels" },
  { src: px(35822731), tip: "Rocky coastal landscape — drone-style perspective", attribution: "Нурлан Шлюмбаев", sourceUrl: pxPage(35822731), license: "Pexels" },
  { src: px(20591589), tip: "Sun ray through clouds — wait for the gap", attribution: "Radis B", sourceUrl: pxPage(20591589), license: "Pexels" },
  { src: px(36732360), tip: "Fisherman silhouette at sunset — backlit story", attribution: "Mesut Yalçın", sourceUrl: pxPage(36732360), license: "Pexels" },
  { src: px(20048387), tip: "Seagull in motion — wait for the wing peak", attribution: "Radis B", sourceUrl: pxPage(20048387), license: "Pexels" },
  { src: px(20048416), tip: "Wave and rocks — fast shutter, freeze the splash", attribution: "Radis B", sourceUrl: pxPage(20048416), license: "Pexels" },
  { src: px(20049167), tip: "Fisherman on rocks — environmental portrait", attribution: "Radis B", sourceUrl: pxPage(20049167), license: "Pexels" },
  { src: px(22690987), tip: "Analog pier shot — try film grain in post", attribution: "Radis B", sourceUrl: pxPage(22690987), license: "Pexels" },
  { src: px(22690993), tip: "Mono film — Caspian works in B&W too", attribution: "Radis B", sourceUrl: pxPage(22690993), license: "Pexels" },
];

// ---- Generic Mangystau pool (fallback / low confidence) -------------------
const mangystau = [
  { src: px(35567974), tip: "Big sky, small subject — let the land breathe", attribution: "Mustafa KILIÇ", sourceUrl: pxPage(35567974), license: "Pexels" },
  { src: px(26311719), tip: "Ustyurt plateau — texture-first composition", attribution: "Radis B", sourceUrl: pxPage(26311719), license: "Pexels" },
  { src: px(21419399), tip: "Layered horizon, no centered subject", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419399), license: "Pexels" },
  { src: px(21419402), tip: "Wider Ustyurt — emphasize distance", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419402), license: "Pexels" },
  { src: px(21419393), tip: "Patchwork desert tones, midday flat light works", attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419393), license: "Pexels" },
  { src: wm("Mangystau nature.jpg"), tip: "Default Mangystau hero frame", attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau nature.jpg"), license: "CC BY-SA" },
  { src: wm("Mangystau Region by Sergio Agostinelli (DSCN8137).jpg"), tip: "Roadside frame — capture the journey", attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau Region by Sergio Agostinelli (DSCN8137).jpg"), license: "CC BY-SA" },
  { src: wm("Mangystau Region, Kazakhstan (48306252811).jpg"), tip: "Wide steppe — minimal foreground", attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau Region, Kazakhstan (48306252811).jpg"), license: "CC BY-SA" },
  { src: wm("Horses in Mangystau Province, Kazakhstan.jpg"), tip: "Horses as living foreground", attribution: "Wikimedia Commons", sourceUrl: wmPage("Horses in Mangystau Province, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Airakty Shomanai Mountains in Mangystau Region, Kazakhstan (April 2024).jpg"), tip: "Airakty range — spring greens against rock", attribution: "Wikimedia Commons", sourceUrl: wmPage("Airakty Shomanai Mountains in Mangystau Region, Kazakhstan (April 2024).jpg"), license: "CC BY-SA" },
  { src: wm("Plant on rock formation in Mangystau.jpg"), tip: "Small detail — tell a story with one plant", attribution: "Wikimedia Commons", sourceUrl: wmPage("Plant on rock formation in Mangystau.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 2.jpg"), tip: "Local POV — handheld, journal-style", attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 2.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 3.jpg"), tip: "Wide landscape, low angle", attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 3.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 6.jpg"), tip: "Texture study — get close to the rock", attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 6.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 8.jpg"), tip: "Late light on the steppe", attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 8.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 9.jpg"), tip: "Layered ridges in distance haze", attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 9.jpg"), license: "CC BY-SA" },
];

export const REFERENCES = { bozzhyra, sherkala, tuzbair, kyzylkup, torysh, caspian, mangystau };

// Loose synonyms / spellings the model is likely to return.
const SYNONYMS = [
  { slug: "bozzhyra", needles: ["bozzhyra", "bozzhira", "boszhira", "bozjyra", "bozhira", "fangs", "бозжыра", "бозжыра"] },
  { slug: "sherkala", needles: ["sherkala", "sherqala", "shirkala", "шерқала", "шеркала", "lion mountain"] },
  { slug: "tuzbair",  needles: ["tuzbair", "tuz bair", "sor tuzbair", "тузбаир", "тұзбайыр", "airakty"] },
  { slug: "torysh",   needles: ["torysh", "torish", "valley of balls", "valley of ball", "balls valley", "stone balls", "concretions", "торыш", "шар"] },
  { slug: "kyzylkup", needles: ["kyzylkup", "qyzylqup", "tiramisu", "кызылкуп", "қызылқұп"] },
  { slug: "caspian",  needles: ["caspian", "aktau", "ақтау", "актау", "каспий", "coast", "beach", "sea", "shore", "promenade"] },
];

export function pickReferences(sightGuess) {
  if (!sightGuess) return REFERENCES.mangystau;
  const s = sightGuess.toLowerCase();
  for (const { slug, needles } of SYNONYMS) {
    if (needles.some((n) => s.includes(n))) return REFERENCES[slug] ?? REFERENCES.mangystau;
  }
  return REFERENCES.mangystau;
}
