// Curated reference shots per Mangystau sight.
// Sources: Pexels (free license) + Wikimedia Commons (CC BY-SA — credit retained).
// Tips are trilingual; the server picks the right language per request.

const wm = (file, width = 900) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const wmPage = (file) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const pxPage = (id) => `https://www.pexels.com/photo/${id}/`;

// trilingual tip
const t = (en, ru, kk) => ({ en, ru, kk });

// ---- Bozzhyra / Boszhira / Bozjyra ----------------------------------------
const bozzhyra = [
  { src: px(21419429), tip: t("Wide foreground rock leading to the fangs — 24mm", "Широкий передний план, ведущий к клыкам — 24мм", "Тістерге апаратын кең алдыңғы план — 24мм"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419429), license: "Pexels" },
  { src: px(21419426), tip: t("Human figure for scale — keep them 1/3 from the edge", "Человек для масштаба — держи его в 1/3 от края", "Масштаб үшін адам — оны жиектен 1/3 қашықта ұста"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419426), license: "Pexels" },
  { src: px(26311726), tip: t("Cliff-edge hero pose, low sidelight", "Геройская поза на краю обрыва, низкий боковой свет", "Жартас жиегіндегі батыр позасы, төмен бүйір жарық"), attribution: "Radis B", sourceUrl: pxPage(26311726), license: "Pexels" },
  { src: px(26311725), tip: t("Hiker scale on the descent — show the path", "Хайкер для масштаба на спуске — покажи тропу", "Жолда жаяу серуенші — соқпақты көрсет"), attribution: "Radis B", sourceUrl: pxPage(26311725), license: "Pexels" },
  { src: px(26311720), tip: t("Tight on rock texture — fill the frame", "Крупно на текстуре скалы — заполни кадр", "Жартас текстурасы жақыннан — кадрды толтыр"), attribution: "Radis B", sourceUrl: pxPage(26311720), license: "Pexels" },
  { src: px(25460645), tip: t("Barren canyon — let negative space breathe", "Пустой каньон — дай негативу дышать", "Бос шатқал — теріс кеңістікке тыныс ал"), attribution: "Yerzhan99", sourceUrl: pxPage(25460645), license: "Pexels" },
  { src: px(21419430), tip: t("Layered ridges, telephoto compression", "Слоистые хребты, телеобъектив сжимает план", "Қабатты жоталар, телеобъектив сығымдау"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419430), license: "Pexels" },
  { src: px(21419394), tip: t("Eroded cliff edge from low angle", "Эрозия скал с нижней точки", "Эрозияланған жартас жиегі төмен бұрыштан"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419394), license: "Pexels" },

  { src: wm("Fangs of Bozzhyra.jpg"), tip: t("Symmetry of the two fangs against deep sky", "Симметрия двух клыков на фоне глубокого неба", "Терең аспан фонында екі тістің симметриясы"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Fangs of Bozzhyra.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Бозжыра утром.jpg"), tip: t("First light from the upper deck", "Первый свет с верхней смотровой", "Жоғарғы алаңнан алғашқы жарық"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Бозжыра утром.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Panorama \"Korablik\" of Bozzhyra.jpg"), tip: t("Panorama from the Korablik viewpoint", "Панорама с обзорной «Кораблик»", "«Кораблик» бақылау нүктесінен панорама"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Panorama \"Korablik\" of Bozzhyra.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra Gorge 50MP Panorama.jpg"), tip: t("Full-gorge panorama — stitch wide & flat", "Панорама всего ущелья — сшивай широко и ровно", "Толық шатқал панорамасы — кең әрі түзу тігу"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra Gorge 50MP Panorama.jpg"), license: "CC BY-SA" },
  { src: wm("Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), tip: t("Off-season cold tones — November palette", "Холодные тона несезона — ноябрьская палитра", "Маусым сыртындағы суық реңктер — қараша палитрасы"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Aurora outlier, Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), tip: t("Aurora outlier as a foreground anchor", "Останец Аврора как якорь переднего плана", "Аврора жартасын алдыңғы план якорі ретінде"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Aurora outlier, Boszhira tract. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra Valley in Karakiya, Mangystau, Kazakhstan (May 2024).jpg"), tip: t("Spring green floor against the white cliffs", "Весенняя зелень снизу против белых скал", "Көктемгі жасыл түс ақ жартастарға қарсы"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra Valley in Karakiya, Mangystau, Kazakhstan (May 2024).jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra upper observation deck.jpg"), tip: t("Standard upper deck framing — start here", "Стандартная рамка с верхней площадки — начни отсюда", "Жоғарғы алаңнан стандартты кадр — осыдан баста"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra upper observation deck.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra valley, Mangistau region, Kazakhstan.jpg"), tip: t("Whole valley wide — establishing shot", "Долина целиком — установочный кадр", "Бүкіл алқап кең — танысу кадры"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra valley, Mangistau region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozzhyra valley, Mangistau, Kazakhstan.jpg"), tip: t("Side-on profile of the fangs ridge", "Боковой профиль хребта с клыками", "Тістер жотасының бүйірлік профилі"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozzhyra valley, Mangistau, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: t("Classic Bozjyra hero — golden hour", "Классический Бозжыра — золотой час", "Классикалық Бозжыра — алтын сағат"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, limestone formation.jpg"), tip: t("Isolate one limestone tower — minimalist", "Выдели одну известняковую башню — минимализм", "Бір әктас мұнарасын оқшаула — минимализм"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, limestone formation.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, northward view.jpg"), tip: t("Northward facing — flatter light, more detail", "Лицом на север — мягче свет, больше деталей", "Солтүстікке қарай — жұмсақ жарық, көп бөлшек"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, northward view.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, erosionary formation.jpg"), tip: t("Erosion texture, sidelit", "Текстура эрозии, боковой свет", "Эрозия текстурасы, бүйірден жарық"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, erosionary formation.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, erosion hole.jpg"), tip: t("Natural arch as a frame inside the frame", "Природная арка как рамка в рамке", "Табиғи арка — кадр ішіндегі кадр"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, erosion hole.jpg"), license: "CC BY-SA" },
  { src: wm("Southeast view on Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: t("Southeast view — second-best vantage", "Юго-восточный вид — вторая по силе точка", "Оңтүстік-шығыс көрініс — екінші ең жақсы нүкте"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Southeast view on Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Bozjyra, Manğystaw region, Kazakhstan, dombyra player.jpg"), tip: t("Person + dombyra — cultural storytelling shot", "Человек с домброй — культурный нарратив", "Адам мен домбыра — мәдени баяндау кадры"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Bozjyra, Manğystaw region, Kazakhstan, dombyra player.jpg"), license: "CC BY-SA" },
  { src: wm("Dombyra player in Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: t("Tighter on musician — environmental portrait", "Крупнее музыканта — портрет в среде", "Музыкантты жақыннан — орта портрет"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Dombyra player in Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Couple in traditional Kazakh clothing in Bozjyra, Manğystaw region, Kazakhstan.jpg"), tip: t("Traditional clothing + landscape = story", "Народный костюм + пейзаж = история", "Дәстүрлі киім + пейзаж = әңгіме"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Couple in traditional Kazakh clothing in Bozjyra, Manğystaw region, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("On the ocean's bottom.jpg"), tip: t("Top-down — old seabed texture", "Сверху вниз — текстура древнего морского дна", "Жоғарыдан төмен — ежелгі теңіз түбі текстурасы"), attribution: "Wikimedia Commons", sourceUrl: wmPage("On the ocean's bottom.jpg"), license: "CC BY-SA" },
];

// ---- Sherkala / Sherqala --------------------------------------------------
const sherkala = [
  { src: wm("Sherqala.jpg"), tip: t("Full silhouette against open sky — minimal frame", "Полный силуэт на фоне открытого неба — минимум в кадре", "Ашық аспан фонында толық силуэт — минимум кадрда"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Sherqala.jpg"), license: "CC BY-SA" },
  { src: wm("Sherkala, Mangistau, Kazakhstan.jpg"), tip: t("East-facing sunrise, low horizon", "Восход с востока, низкий горизонт", "Шығыстан күн шығу, төмен көкжиек"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Sherkala, Mangistau, Kazakhstan.jpg"), license: "CC BY-SA" },
];

// ---- Tuzbair -------------------------------------------------------------
const tuzbair = [
  { src: wm("Sor Tuzbair, Mangistau, Kazakhstan, November 2024.jpg"), tip: t("Eroded white cliffs over the salt pan", "Эрозия белых скал над солончаком", "Тұзды жазық үстіндегі эрозияланған ақ жартастар"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Sor Tuzbair, Mangistau, Kazakhstan, November 2024.jpg"), license: "CC BY-SA" },
  { src: wm("Mount Airakty. Kazakhstan, Mangistau. November 2024.jpg"), tip: t("Airakty massif — context for the Tuzbair plateau", "Массив Айракты — контекст для плато Тузбаир", "Айрақты массиві — Тұзбайыр үстіртінің контексті"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Mount Airakty. Kazakhstan, Mangistau. November 2024.jpg"), license: "CC BY-SA" },
];

// ---- Kyzylkup -------------------------------------------------------------
const kyzylkup = [
  { src: wm("Кызылкуп на рассвете.jpg"), tip: t("Sunrise rake-light over the stripes", "Скользящий свет на рассвете по полосам", "Таңертеңгі көлбеу жарық жолақтарға"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Кызылкуп на рассвете.jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Кызылкуп \" Тирамису\".jpg"), tip: t("Telephoto compression of the layered ridges", "Телеобъектив сжимает слоистые хребты", "Қабатты жоталарды телеобъектив сығады"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Кызылкуп \" Тирамису\".jpg"), license: "CC BY-SA 4.0" },
  { src: wm("Kyzylkup site at Ustyurt National Park.jpg"), tip: t("Wide context — show the scale of the formation", "Широкий контекст — покажи масштаб", "Кең контекст — формацияның ауқымын көрсет"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup site at Ustyurt National Park.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup site at Ustyurt Nature Reserve.jpg"), tip: t("Second angle — same ridge from the reserve side", "Второй ракурс — тот же хребет со стороны заповедника", "Екінші бұрыш — қорық жағынан сол жота"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup site at Ustyurt Nature Reserve.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup.jpg"), tip: t("Default establishing frame", "Базовый установочный кадр", "Әдепкі танысу кадры"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup.jpg"), license: "CC BY-SA" },
  { src: wm("Kyzylkup strange.jpg"), tip: t("Look for the odd formations — break the obvious frame", "Ищи странные формы — ломай очевидный кадр", "Әдеттен тыс формаларды тап — айқын кадрды бұз"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Kyzylkup strange.jpg"), license: "CC BY-SA" },
];

// ---- Torysh (Valley of Balls) --------------------------------------------
const torysh = [
  { src: wm("Конкреции в Западном Казахстане. Concretions. Western Kazakhstan.JPG"), tip: t("Ball as foreground anchor — low sidelight", "Шар как якорь переднего плана — низкий боковой свет", "Шарды алдыңғы план якорі ретінде — төмен бүйірлік жарық"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Конкреции в Западном Казахстане. Concretions. Western Kazakhstan.JPG"), license: "CC BY-SA" },
  { src: px(21419391), tip: t("Cloud shadow over open plain — patience pays", "Тень облака на равнине — терпение окупится", "Жазық дала үстіндегі бұлт көлеңкесі — шыдамдылық өтейді"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419391), license: "Pexels" },
];

// ---- Caspian / Aktau coast -----------------------------------------------
const caspian = [
  { src: px(20591586), tip: t("Rocks + building — show the human edge of the coast", "Скалы + здание — покажи рукотворную кромку берега", "Жартастар + ғимарат — жағалаудың адамдық шегін көрсет"), attribution: "Radis B", sourceUrl: pxPage(20591586), license: "Pexels" },
  { src: px(20591580), tip: t("Promenade statue + gazebo as foreground", "Статуя и беседка набережной как передний план", "Жағалаудағы мүсін мен альтан — алдыңғы план"), attribution: "Radis B", sourceUrl: pxPage(20591580), license: "Pexels" },
  { src: px(24778473), tip: t("Houses on the shore — sense of place", "Дома на берегу — ощущение места", "Жағадағы үйлер — орынды сезіну"), attribution: "Radis B", sourceUrl: pxPage(24778473), license: "Pexels" },
  { src: px(20591590), tip: t("Gazebo silhouette against Caspian", "Силуэт беседки на фоне Каспия", "Каспий фонында альтан силуэті"), attribution: "Radis B", sourceUrl: pxPage(20591590), license: "Pexels" },
  { src: px(20591581), tip: t("Promenade leading line into the sea", "Линия набережной уводит в море", "Жағалау сызығы теңізге апарады"), attribution: "Radis B", sourceUrl: pxPage(20591581), license: "Pexels" },
  { src: px(20049157), tip: t("Columns frame — shoot through architecture", "Колонны как рамка — снимай через архитектуру", "Бағандар — кадр шеңбері, сәулет арқылы түсір"), attribution: "Radis B", sourceUrl: pxPage(20049157), license: "Pexels" },
  { src: px(20049155), tip: t("Barren rocks foreground, sea negative space", "Голые скалы спереди, море как негатив", "Алдыңғы жалаңаш жартастар, теңіз — теріс кеңістік"), attribution: "Radis B", sourceUrl: pxPage(20049155), license: "Pexels" },
  { src: px(20591584), tip: t("Rock cluster low, sea horizon high", "Скопление камней внизу, горизонт моря выше", "Тас шоғыры төменде, теңіз көкжиегі жоғарыда"), attribution: "Radis B", sourceUrl: pxPage(20591584), license: "Pexels" },
  { src: px(35822731), tip: t("Rocky coastal landscape — drone-style perspective", "Скалистый берег — перспектива в стиле дрона", "Тасты жаға — дрон стилінде перспектива"), attribution: "Нурлан Шлюмбаев", sourceUrl: pxPage(35822731), license: "Pexels" },
  { src: px(20591589), tip: t("Sun ray through clouds — wait for the gap", "Луч сквозь облака — жди разрыв", "Бұлт арасынан сәуле — саңылауды күт"), attribution: "Radis B", sourceUrl: pxPage(20591589), license: "Pexels" },
  { src: px(36732360), tip: t("Fisherman silhouette at sunset — backlit story", "Силуэт рыбака на закате — контровой свет", "Күн батардағы балықшы силуэті — қарсы жарық"), attribution: "Mesut Yalçın", sourceUrl: pxPage(36732360), license: "Pexels" },
  { src: px(20048387), tip: t("Seagull in motion — wait for the wing peak", "Чайка в движении — лови пик крыла", "Қозғалыстағы шағала — қанат шыңын ұста"), attribution: "Radis B", sourceUrl: pxPage(20048387), license: "Pexels" },
  { src: px(20048416), tip: t("Wave and rocks — fast shutter, freeze the splash", "Волна и скалы — короткая выдержка, заморозь брызги", "Толқын мен жартас — қысқа экспозиция, шашыранды қата"), attribution: "Radis B", sourceUrl: pxPage(20048416), license: "Pexels" },
  { src: px(20049167), tip: t("Fisherman on rocks — environmental portrait", "Рыбак на скалах — портрет в среде", "Жартастағы балықшы — орта портрет"), attribution: "Radis B", sourceUrl: pxPage(20049167), license: "Pexels" },
  { src: px(22690987), tip: t("Analog pier shot — try film grain in post", "Пирс на плёнке — добавь зерно в обработке", "Аналогты айлақ — постта түйіршік қос"), attribution: "Radis B", sourceUrl: pxPage(22690987), license: "Pexels" },
  { src: px(22690993), tip: t("Mono film — Caspian works in B&W too", "Чёрно-белая плёнка — Каспий хорош и в Ч/Б", "Ақ-қара пленка — Каспий ақ-қарада да жақсы"), attribution: "Radis B", sourceUrl: pxPage(22690993), license: "Pexels" },
];

// ---- Generic Mangystau pool (fallback / low confidence) -------------------
const mangystau = [
  { src: px(35567974), tip: t("Big sky, small subject — let the land breathe", "Большое небо, маленький объект — дай земле дышать", "Үлкен аспан, кішкене нысан — жерге тыныс ал"), attribution: "Mustafa KILIÇ", sourceUrl: pxPage(35567974), license: "Pexels" },
  { src: px(26311719), tip: t("Ustyurt plateau — texture-first composition", "Плато Устюрт — композиция от текстуры", "Үстірт үстірті — текстурадан басталатын композиция"), attribution: "Radis B", sourceUrl: pxPage(26311719), license: "Pexels" },
  { src: px(21419399), tip: t("Layered horizon, no centered subject", "Слоистый горизонт, объект не по центру", "Қабатты көкжиек, орталықта нысан жоқ"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419399), license: "Pexels" },
  { src: px(21419402), tip: t("Wider Ustyurt — emphasize distance", "Шире Устюрт — подчеркни дистанцию", "Кеңірек Үстірт — қашықтықты баса көрсет"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419402), license: "Pexels" },
  { src: px(21419393), tip: t("Patchwork desert tones, midday flat light works", "Лоскутные пустынные тона, плоский полдень работает", "Шөл реңктерінің мозаикасы, тал түс жалпақ жарық сай келеді"), attribution: "Edoardo Tommasini", sourceUrl: pxPage(21419393), license: "Pexels" },
  { src: wm("Mangystau nature.jpg"), tip: t("Default Mangystau hero frame", "Базовый герой-кадр Маңғыстау", "Маңғыстаудың әдепкі батыр кадры"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau nature.jpg"), license: "CC BY-SA" },
  { src: wm("Mangystau Region by Sergio Agostinelli (DSCN8137).jpg"), tip: t("Roadside frame — capture the journey", "Кадр с обочины — поймай путь", "Жол жиегінен кадр — саяхатты қалдыр"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau Region by Sergio Agostinelli (DSCN8137).jpg"), license: "CC BY-SA" },
  { src: wm("Mangystau Region, Kazakhstan (48306252811).jpg"), tip: t("Wide steppe — minimal foreground", "Широкая степь — минимум переднего плана", "Кең дала — минимум алдыңғы план"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Mangystau Region, Kazakhstan (48306252811).jpg"), license: "CC BY-SA" },
  { src: wm("Horses in Mangystau Province, Kazakhstan.jpg"), tip: t("Horses as living foreground", "Лошади как живой передний план", "Жылқылар — тірі алдыңғы план"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Horses in Mangystau Province, Kazakhstan.jpg"), license: "CC BY-SA" },
  { src: wm("Airakty Shomanai Mountains in Mangystau Region, Kazakhstan (April 2024).jpg"), tip: t("Airakty range — spring greens against rock", "Хребет Айракты — весенняя зелень против скал", "Айрақты жотасы — көктемгі жасыл жартастарға қарсы"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Airakty Shomanai Mountains in Mangystau Region, Kazakhstan (April 2024).jpg"), license: "CC BY-SA" },
  { src: wm("Plant on rock formation in Mangystau.jpg"), tip: t("Small detail — tell a story with one plant", "Маленькая деталь — расскажи историю одним растением", "Кішкене деталь — бір өсімдікпен әңгіме айт"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Plant on rock formation in Mangystau.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 2.jpg"), tip: t("Local POV — handheld, journal-style", "Местный взгляд — с рук, в журнальном стиле", "Жергілікті көзқарас — қолдан, журналдық стильде"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 2.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 3.jpg"), tip: t("Wide landscape, low angle", "Широкий пейзаж, низкий ракурс", "Кең пейзаж, төмен бұрыш"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 3.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 6.jpg"), tip: t("Texture study — get close to the rock", "Этюд текстуры — подойди вплотную к камню", "Текстура зерттеуі — тасқа жақын кел"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 6.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 8.jpg"), tip: t("Late light on the steppe", "Поздний свет на степи", "Далада кешкі жарық"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 8.jpg"), license: "CC BY-SA" },
  { src: wm("Маңғыстау'22 9.jpg"), tip: t("Layered ridges in distance haze", "Слоистые хребты в дальней дымке", "Алыс тұманда қабатты жоталар"), attribution: "Wikimedia Commons", sourceUrl: wmPage("Маңғыстау'22 9.jpg"), license: "CC BY-SA" },
];

const BUCKETS = { bozzhyra, sherkala, tuzbair, kyzylkup, torysh, caspian, mangystau };

// Loose synonyms / spellings the model is likely to return.
const SYNONYMS = [
  { slug: "bozzhyra", needles: ["bozzhyra", "bozzhira", "boszhira", "bozjyra", "bozhira", "fangs", "бозжыра"] },
  { slug: "sherkala", needles: ["sherkala", "sherqala", "shirkala", "шерқала", "шеркала", "lion mountain"] },
  { slug: "tuzbair",  needles: ["tuzbair", "tuz bair", "sor tuzbair", "тузбаир", "тұзбайыр", "airakty"] },
  { slug: "torysh",   needles: ["torysh", "torish", "valley of balls", "valley of ball", "balls valley", "stone balls", "concretions", "торыш", "шар"] },
  { slug: "kyzylkup", needles: ["kyzylkup", "qyzylqup", "tiramisu", "кызылкуп", "қызылқұп"] },
  { slug: "caspian",  needles: ["caspian", "aktau", "ақтау", "актау", "каспий", "coast", "beach", "sea", "shore", "promenade"] },
];

function bucketFor(sightGuess) {
  if (!sightGuess) return BUCKETS.mangystau;
  const s = sightGuess.toLowerCase();
  for (const { slug, needles } of SYNONYMS) {
    if (needles.some((n) => s.includes(n))) return BUCKETS[slug] ?? BUCKETS.mangystau;
  }
  return BUCKETS.mangystau;
}

// Flatten trilingual tip to the requested language (defaults to ru).
export function pickReferences(sightGuess, lang = "ru") {
  const L = (lang === "en" || lang === "ru" || lang === "kk") ? lang : "ru";
  return bucketFor(sightGuess).map((ref) => ({
    src: ref.src,
    tip: ref.tip[L] ?? ref.tip.en,
    attribution: ref.attribution,
    sourceUrl: ref.sourceUrl,
    license: ref.license,
  }));
}
