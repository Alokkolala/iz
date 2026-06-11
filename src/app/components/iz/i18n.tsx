import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "ru" | "kk";

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "en", label: "EN", flag: "🇬🇧" },
  { id: "ru", label: "RU", flag: "🇷🇺" },
  { id: "kk", label: "KK", flag: "🇰🇿" },
];

type Dict = Record<string, { en: string; ru: string; kk: string }>;

export const STRINGS: Dict = {
  brand_sub: { en: "IZ · MANGYSTAU", ru: "IZ · МАҢҒЫСТАУ", kk: "IZ · МАҢҒЫСТАУ" },
  splash_title: {
    en: "Leave your trace in Mangystau.",
    ru: "Оставь свой след в Маңғыстау.",
    kk: "Маңғыстауда ізіңді қалдыр.",
  },
  splash_cta: { en: "Start trip", ru: "Начать путь", kk: "Сапарды баста" },

  // Pulse
  pulse_kicker: { en: "Mangystau is live", ru: "Маңғыстау в эфире", kk: "Маңғыстау эфирде" },
  pulse_title: { en: "Welcome to Mangystau", ru: "Добро пожаловать в Маңғыстау", kk: "Маңғыстауға қош келдің" },
  pulse_today: { en: "Tourists exploring today", ru: "Туристов сегодня в пути", kk: "Бүгін саяхаттаушылар" },
  top_spot: { en: "Top spot now", ru: "Топ-место сейчас", kk: "Үздік орын қазір" },
  best_light: { en: "Best light", ru: "Лучший свет", kk: "Үздік жарық" },
  weather: { en: "Caspian weather", ru: "Погода на Каспии", kk: "Каспий ауа райы" },
  windy: { en: "Windy · 24°C", ru: "Ветрено · 24°C", kk: "Желді · 24°C" },
  next_shot: {
    en: "Your next viral shot is 12 m away",
    ru: "Твой вирусный кадр в 12 м",
    kk: "Вирусты кадрың 12 м қашықта",
  },
  start_crew: { en: "Start Crew Mode", ru: "Режим команды", kk: "Команда режимі" },
  live_now: { en: "exploring now", ru: "в пути сейчас", kk: "қазір жолда" },
  greet_hi: { en: "Hi, I'm Iz!", ru: "Привет, я Iz!", kk: "Сәлем, мен Iz!" },
  bubble1: { en: "Mangystau is awake", ru: "Маңғыстау проснулся", kk: "Маңғыстау оянды" },
  bubble2: { en: "Best light in 24 min", ru: "Лучший свет через 24 мин", kk: "Үздік жарық 24 мин-та" },
  bubble3: { en: "Let's leave a trace", ru: "Оставим след вместе", kk: "Бірге із қалдырайық" },
  moments: { en: "Moments around you", ru: "Моменты рядом", kk: "Маңайдағы сәттер" },
  featured_today: { en: "Featured today", ru: "Сегодня в фокусе", kk: "Бүгін назарда" },
  featured_explore: { en: "Explore spot", ru: "Открыть место", kk: "Орынды ашу" },
  golden_now: { en: "Golden hour now", ru: "Золотой час сейчас", kk: "Алтын сағат қазір" },
  spot_bozzhyra: { en: "Bozzhyra Canyon", ru: "Каньон Бозжыра", kk: "Бозжыра шатқалы" },
  spot_bozzhyra_sub: { en: "Sunset cliffs · 92 km", ru: "Скалы на закате · 92 км", kk: "Күн батардағы жартастар · 92 км" },
  spot_tuzbair: { en: "Tuzbair Saltmarsh", ru: "Тузбаир", kk: "Тұзбайыр" },
  spot_blue: { en: "Blue Bay", ru: "Голубая бухта", kk: "Көк шығанақ" },
  trending: { en: "Trending now", ru: "В тренде", kk: "Тренд" },
  your_journey: { en: "Your journey", ru: "Твой путь", kk: "Сапарың" },
  journey_empty: { en: "Capture a shot to start your trace", ru: "Сделай кадр, чтобы начать след", kk: "Із қалдыру үшін кадр түсір" },
  golden_hour: { en: "Golden hour", ru: "Золотой час", kk: "Алтын сағат" },
  golden_in: { en: "starts in {m} min", ru: "через {m} мин", kk: "{m} мин-та" },
  golden_live: { en: "happening now", ru: "идёт сейчас", kk: "қазір" },
  quests_done_short: { en: "Quests", ru: "Задания", kk: "Тапсырма" },
  start_capturing: { en: "Capture your first shot", ru: "Сделай первый кадр", kk: "Алғашқы кадрыңды түсір" },

  // Crew
  crew_kicker: { en: "Find your crew", ru: "Найди свою команду", kk: "Командаңды тап" },
  crew_title: { en: "Crew Map", ru: "Карта команды", kk: "Команда картасы" },
  crew_name: { en: "Aqtau Trip Crew", ru: "Команда Ақтау", kk: "Ақтау командасы" },
  crew_status: { en: "3 nearby, 1 moving", ru: "3 рядом, 1 в движении", kk: "3 жақын, 1 жолда" },
  tap_pin: { en: "Tap a pin to see a friend", ru: "Нажми на метку друга", kk: "Досты көру үшін белгіні бас" },
  set_meet: { en: "Set meet point", ru: "Точка встречи", kk: "Кездесу нүктесі" },
  you: { en: "You", ru: "Вы", kk: "Сіз" },
  navigate: { en: "Navigate", ru: "Маршрут", kk: "Бағыт" },
  ping: { en: "Ping", ru: "Пинг", kk: "Пинг" },
  ping_sent: { en: "Ping sent to", ru: "Пинг отправлен", kk: "Пинг жіберілді" },
  rally_crew: { en: "Rally crew to point", ru: "Собрать команду", kk: "Команданы жинау" },
  rallying: { en: "Crew is on the way", ru: "Команда в пути", kk: "Команда жолда" },
  stop_rally: { en: "Stop rally", ru: "Остановить сбор", kk: "Жинауды тоқтату" },
  crew_list: { en: "Crew members", ru: "Участники", kk: "Қатысушылар" },
  km_away: { en: "km away", ru: "км от вас", kk: "км қашықта" },
  active_now: { en: "active now", ru: "сейчас в сети", kk: "қазір желіде" },
  remove_friend: { en: "Remove", ru: "Удалить", kk: "Жою" },
  recenter: { en: "Recenter", ru: "Центр", kk: "Орталық" },
  arrived: { en: "Arrived at meet point", ru: "На точке встречи", kk: "Кездесу нүктесінде" },
  no_crew_title: { en: "No crew yet", ru: "Пока нет команды", kk: "Команда әзірге жоқ" },
  no_crew_sub: { en: "Add friends to see them live on the map", ru: "Добавь друзей — увидишь их на карте", kk: "Достарыңды қос — картадан көресің" },
  members: { en: "members", ru: "участников", kk: "қатысушы" },
  your_name: { en: "Your name", ru: "Ваше имя", kk: "Атыңыз" },
  save: { en: "Save", ru: "Сохранить", kk: "Сақтау" },
  tap_to_name: { en: "Tap to add your name", ru: "Нажми, чтобы добавить имя", kk: "Атыңды қосу үшін бас" },
  explorer: { en: "Mangystau Explorer", ru: "Исследователь Маңғыстау", kk: "Маңғыстау зерттеушісі" },

  // Lens
  lens_kicker: { en: "Lens · AI creative director", ru: "Lens · AI креативный директор", kk: "Lens · AI шығармашылық директор" },
  lens_title: { en: "Shoot the moment", ru: "Поймай момент", kk: "Сәтті түсір" },
  no_plan: { en: "No shot plan yet", ru: "Плана кадра пока нет", kk: "Кадр жоспары әзірге жоқ" },
  no_plan_sub: {
    en: "Tap generate and I'll direct your viral frame.",
    ru: "Нажми генерировать — срежиссирую твой кадр.",
    kk: "Генерациялауды бас — кадрыңды режиссёрлаймын.",
  },
  scanning: { en: "Reading light & composition…", ru: "Читаю свет и композицию…", kk: "Жарық пен композицияны оқып жатырмын…" },
  your_plan: { en: "Your shot plan", ru: "Твой план кадра", kk: "Кадр жоспарың" },
  generate: { en: "Generate shot plan", ru: "Сгенерировать план", kk: "Жоспар жасау" },
  regenerate: { en: "Regenerate shot plan", ru: "Сгенерировать заново", kk: "Қайта жасау" },
  scanning_btn: { en: "Scanning…", ru: "Сканирую…", kk: "Сканерлеу…" },
  tip_left: { en: "Stand 2 meters left", ru: "Встань на 2 м левее", kk: "2 метр солға тұр" },
  tip_wide: { en: "Use 0.5× wide angle", ru: "Сними на 0.5× ширик", kk: "0.5× кең бұрышпен түсір" },
  tip_sea: { en: "Face the sea, keep horizon low", ru: "Лицом к морю, горизонт ниже", kk: "Теңізге қара, көкжиекті төмен ұста" },
  tip_reel: { en: "Best format: 7-sec Reel", ru: "Формат: Reel 7 сек", kk: "Формат: 7 сек Reel" },
  tip_caption: { en: "Caption: first signal from Mangystau", ru: "Подпись: первый сигнал из Маңғыстау", kk: "Жазба: Маңғыстаудан алғашқы сигнал" },
  // Lens categories
  cat_pose: { en: "Pose", ru: "Поза", kk: "Поза" },
  cat_angle: { en: "Angle", ru: "Ракурс", kk: "Бұрыш" },
  cat_light: { en: "Light", ru: "Свет", kk: "Жарық" },
  cat_caption: { en: "Caption", ru: "Подпись", kk: "Жазба" },
  cat_tags: { en: "Tags", ru: "Теги", kk: "Тегтер" },
  pose_1: { en: "Turn 45° away from the camera", ru: "Развернись на 45° от камеры", kk: "Камерадан 45°-қа бұрыл" },
  pose_2: { en: "Look toward the horizon, not the lens", ru: "Смотри на горизонт, не в объектив", kk: "Объективке емес, көкжиекке қара" },
  pose_3: { en: "Relax shoulders, weight on back foot", ru: "Расслабь плечи, вес на заднюю ногу", kk: "Иығыңды бос ұста, салмақты артқы аяққа" },
  angle_2: { en: "Get low — shoot from waist height", ru: "Снимай низко — от пояса", kk: "Төменнен — бел деңгейінен түсір" },
  light_2: { en: "Backlight the sun for a warm rim glow", ru: "Снимай против солнца для тёплого контура", kk: "Жылы контур үшін күнге қарсы түсір" },
  light_at: { en: "Golden light", ru: "Золотой свет", kk: "Алтын жарық" },
  caption_text: { en: "first signal from Mangystau — where the sea meets the desert.", ru: "первый сигнал из Маңғыстау — где море встречает пустыню.", kk: "Маңғыстаудан алғашқы сигнал — теңіз бен шөл түйіскен жер." },
  copy: { en: "Copy", ru: "Копировать", kk: "Көшіру" },
  copied: { en: "Copied!", ru: "Скопировано!", kk: "Көшірілді!" },
  copy_tags: { en: "Copy all tags", ru: "Копировать теги", kk: "Тегтерді көшіру" },
  shots_saved_n: { en: "shots saved", ru: "кадров сохранено", kk: "кадр сақталды" },
  framing: { en: "Rule-of-thirds framing on", ru: "Сетка третей включена", kk: "Үштіктер торы қосулы" },
  ref_reel_title: {
    en: "What this shot can look like",
    ru: "Каким может быть этот кадр",
    kk: "Бұл кадр қандай болуы мүмкін",
  },
  ref_by: { en: "by", ru: "автор", kk: "автор" },

  // Quests
  quests_kicker: { en: "Shell Trail", ru: "Тропа ракушек", kk: "Бақалшақ соқпағы" },
  quests_title: { en: "Quests", ru: "Задания", kk: "Тапсырмалар" },
  your_badges: { en: "Your badges", ru: "Твои значки", kk: "Белгілерің" },
  q1: { en: "Catch the golden hour near the sea", ru: "Поймай золотой час у моря", kk: "Теңіз жағасында алтын сағатты ұста" },
  q2: { en: "Create a shell-frame photo", ru: "Сделай фото в рамке-ракушке", kk: "Бақалшақ жақтаулы фото жаса" },
  q3: { en: "Shoot a road transition", ru: "Сними дорожный переход", kk: "Жол транзишн түсір" },
  q4: { en: "Find the horizon line", ru: "Найди линию горизонта", kk: "Көкжиек сызығын тап" },
  q1h: { en: "Best light starts in 24 min", ru: "Свет через 24 мин", kk: "Жарық 24 минуттан соң" },
  q2h: { en: "Find a natural frame", ru: "Найди природную рамку", kk: "Табиғи жақтау тап" },
  q3h: { en: "Reel-ready movement", ru: "Движение для Reel", kk: "Reel үшін қозғалыс" },
  q4h: { en: "Keep it low & level", ru: "Низко и ровно", kk: "Төмен әрі түзу" },
  completed: { en: "Completed · reward earned", ru: "Готово · награда получена", kk: "Орындалды · сыйлық алынды" },
  badge_creator: { en: "Caspian Creator", ru: "Каспийский Креатор", kk: "Каспий Креаторы" },
  badge_scout: { en: "Desert Scout", ru: "Разведчик Пустыни", kk: "Шөл Барлаушысы" },
  badge_hunter: { en: "Shell Hunter", ru: "Охотник за Ракушками", kk: "Бақалшақ Аңшысы" },

  // Profile
  profile_kicker: { en: "Leave your trace", ru: "Оставь свой след", kk: "Ізіңді қалдыр" },
  profile_title: { en: "Profile", ru: "Профиль", kk: "Профиль" },
  role: { en: "Aqtau Trip Crew · Explorer", ru: "Команда Ақтау · Исследователь", kk: "Ақтау командасы · Зерттеуші" },
  traces: { en: "Traces", ru: "Следы", kk: "Іздер" },
  shots: { en: "Shots", ru: "Кадры", kk: "Кадрлар" },
  spots: { en: "Spots", ru: "Места", kk: "Орындар" },
  earned_badges: { en: "Earned badges", ru: "Полученные значки", kk: "Алынған белгілер" },
  recent_traces: { en: "Recent traces", ru: "Последние следы", kk: "Соңғы іздер" },
  today_t: { en: "Today · 18:24", ru: "Сегодня · 18:24", kk: "Бүгін · 18:24" },
  yesterday_t: { en: "Yesterday · 07:10", ru: "Вчера · 07:10", kk: "Кеше · 07:10" },
  twodays_t: { en: "2 days ago", ru: "2 дня назад", kk: "2 күн бұрын" },

  // functional
  just_now: { en: "just now", ru: "только что", kk: "қазір ғана" },
  add_friend: { en: "Add friend", ru: "Добавить друга", kk: "Дос қосу" },
  friend_name: { en: "Friend's name", ru: "Имя друга", kk: "Дос аты" },
  add: { en: "Add", ru: "Добавить", kk: "Қосу" },
  upload_photo: { en: "Upload your photo", ru: "Загрузить фото", kk: "Фото жүктеу" },
  change_photo: { en: "Change photo", ru: "Сменить фото", kk: "Фотоны ауыстыру" },
  shot_saved: { en: "Saved to your traces", ru: "Сохранено в следы", kk: "Іздерге сақталды" },
  tap_progress: { en: "Tap a quest to make progress", ru: "Нажми на задание, чтобы продвинуться", kk: "Ілгерілеу үшін тапсырманы бас" },
  quest_done: { en: "Quest complete!", ru: "Задание выполнено!", kk: "Тапсырма орындалды!" },
  meet_mode: { en: "Tap the map to drop a meet point", ru: "Нажми на карту — поставить точку", kk: "Нүкте қою үшін картаны бас" },
  meet_here: { en: "Meet here", ru: "Встреча тут", kk: "Кездесу осында" },
  cancel: { en: "Cancel", ru: "Отмена", kk: "Болдырмау" },
  empty_traces: { en: "No traces yet — go explore!", ru: "Пока нет следов — исследуй!", kk: "Әзірге із жоқ — зертте!" },
  st_nearby: { en: "Nearby", ru: "Рядом", kk: "Жақын" },
  st_moving: { en: "Moving", ru: "В движении", kk: "Жолда" },

  // nav
  nav_pulse: { en: "Home", ru: "Главная", kk: "Басты" },
  nav_crew: { en: "Crew", ru: "Команда", kk: "Команда" },
  nav_lens: { en: "Lens", ru: "Линза", kk: "Линза" },
  nav_profile: { en: "Profile", ru: "Профиль", kk: "Профиль" },

  // auth
  sign_out: { en: "Sign out", ru: "Выйти", kk: "Шығу" },
  security: { en: "Security", ru: "Безопасность", kk: "Қауіпсіздік" },
  change_password: { en: "Change password", ru: "Сменить пароль", kk: "Құпиясөзді өзгерту" },
  new_password: { en: "New password", ru: "Новый пароль", kk: "Жаңа құпиясөз" },
  pw_too_short: { en: "Password must be at least 6 characters", ru: "Минимум 6 символов", kk: "Кемінде 6 таңба" },
  pw_changed: { en: "Password updated", ru: "Пароль обновлён", kk: "Құпиясөз жаңартылды" },
  danger_zone: { en: "Danger zone", ru: "Опасная зона", kk: "Қауіпті аймақ" },
  delete_account: { en: "Delete account", ru: "Удалить аккаунт", kk: "Аккаунтты жою" },
  delete_warning: { en: "This permanently deletes your account, saved photos, and crew invites. This can't be undone.", ru: "Это безвозвратно удалит ваш аккаунт, сохранённые кадры и приглашения. Действие нельзя отменить.", kk: "Бұл аккаунтыңыз бен сақталған кадрларды толығымен жояды. Қайтару мүмкін емес." },
  delete_confirm: { en: "Yes, delete", ru: "Да, удалить", kk: "Иә, жою" },

  // invites
  invite_by_email: { en: "Invite by email", ru: "Пригласить по email", kk: "Email-мен шақыру" },
  invitee_email: { en: "Friend's email", ru: "Email друга", kk: "Достың email" },
  send_invite: { en: "Send invite", ru: "Отправить", kk: "Жіберу" },
  invite_sent: { en: "Invite sent", ru: "Приглашение отправлено", kk: "Шақыру жіберілді" },
  pending_invites: { en: "Pending invites", ru: "Входящие приглашения", kk: "Кіріс шақырулар" },
  invite_to_crew: { en: "Invitation to join a crew", ru: "Приглашение в команду", kk: "Командаға шақыру" },
  accept: { en: "Accept", ru: "Принять", kk: "Қабылдау" },
  decline: { en: "Decline", ru: "Отклонить", kk: "Бас тарту" },

  // lens save / history
  save_shot: { en: "Save shot", ru: "Сохранить", kk: "Сақтау" },
  saved: { en: "Saved", ru: "Сохранено", kk: "Сақталды" },
  history: { en: "History", ru: "История", kk: "Тарих" },

  // home continue
  continue_card: { en: "Pick up where you left off", ru: "Продолжить с того места", kk: "Қалдырған жерден жалғастыру" },
  open: { en: "Open", ru: "Открыть", kk: "Ашу" },

  // voice chat
  voice_open_drop: { en: "Talk to Iz", ru: "Поговорить с Iz", kk: "Iz-пен сөйлесу" },
  voice_kicker: { en: "Talk to Iz", ru: "Поговори с Iz", kk: "Iz-пен сөйлес" },
  voice_title: { en: "Voice chat", ru: "Голосовой чат", kk: "Дауыстық чат" },
  voice_tap_to_talk: { en: "Tap the bead to talk", ru: "Нажми каплю, чтобы говорить", kk: "Сөйлесу үшін тамшыны бас" },
  voice_listening: { en: "Listening…", ru: "Слушаю…", kk: "Тыңдап тұрмын…" },
  voice_thinking: { en: "Thinking…", ru: "Думаю…", kk: "Ойлап тұрмын…" },
  voice_speaking: { en: "Speaking…", ru: "Говорю…", kk: "Сөйлеп тұрмын…" },
  voice_intro_hint: {
    en: "Ask about a spot, the best light, or how to get there.",
    ru: "Спроси про место, лучший свет или как добраться.",
    kk: "Орын, жарық немесе жол туралы сұра.",
  },
  voice_no_support: {
    en: "Your browser doesn't support voice. Try Chrome.",
    ru: "Браузер не поддерживает голос. Открой в Chrome.",
    kk: "Браузер дауысты қолдамайды. Chrome-да ашыңыз.",
  },
  voice_mic_denied: {
    en: "Microphone permission denied.",
    ru: "Доступ к микрофону запрещён.",
    kk: "Микрофонға рұқсат жоқ.",
  },
  voice_stop: { en: "Stop", ru: "Стоп", kk: "Тоқта" },
  voice_close: { en: "Close", ru: "Закрыть", kk: "Жабу" },
  voice_open_maps: { en: "Open in Maps", ru: "Открыть в Картах", kk: "Картадан ашу" },
  voice_route_to: { en: "Route to", ru: "Маршрут до", kk: "Бағыт:" },
  voice_locating: { en: "Locating you…", ru: "Определяю вас…", kk: "Орныңызды табудамын…" },
  voice_open_all: { en: "Open all", ru: "Все на карте", kk: "Барлығын ашу" },
  voice_none_nearby: {
    en: "Nothing found nearby — try a wider area",
    ru: "Рядом ничего не нашлось — попробуйте шире",
    kk: "Жақын маңда ештеңе табылмады",
  },
  voice_route_btn: { en: "Route", ru: "Маршрут", kk: "Бағыт" },
  voice_now: { en: "Now", ru: "Сейчас", kk: "Қазір" },
  voice_tomorrow: { en: "Tomorrow", ru: "Завтра", kk: "Ертең" },
  voice_wind: { en: "Wind", ru: "Ветер", kk: "Жел" },
  voice_sunrise: { en: "Sunrise", ru: "Восход", kk: "Күн шығу" },
  voice_sunset: { en: "Sunset", ru: "Закат", kk: "Күн бату" },
  voice_compose_placeholder: { en: "Ask anything…", ru: "Спроси что угодно…", kk: "Не болса да сұра…" },
  voice_send: { en: "Send", ru: "Отправить", kk: "Жіберу" },
  voice_web_results: { en: "Web results", ru: "Из интернета", kk: "Интернеттен" },
  voice_route_stops: { en: "Route", ru: "Маршрут", kk: "Бағыт" },
  voice_open_route: { en: "Open in Maps", ru: "Открыть маршрут", kk: "Картадан ашу" },
  voice_recommendations: { en: "For you", ru: "Тебе", kk: "Саған" },
  voice_recommend_show_me: { en: "Show me", ru: "Покажи мне", kk: "Маған көрсет" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof STRINGS) => string;
}

// Pin the context to a module-global so Fast Refresh re-evaluating this file
// (e.g. after editing STRINGS) reuses the same Context instance instead of
// minting a new one and desyncing the mounted Provider from consumers.
const g = globalThis as unknown as { __IZ_I18N_CTX__?: ReturnType<typeof createContext<I18nCtx | null>> };
const Ctx = g.__IZ_I18N_CTX__ ?? (g.__IZ_I18N_CTX__ = createContext<I18nCtx | null>(null));

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const t = (key: keyof typeof STRINGS) => STRINGS[key]?.[lang] ?? String(key);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
