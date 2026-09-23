// Wave 7 (Batches 5a / 5b / 6) speech slugs — the Wave-7 speech route registry.
//
// 100 speeches vendored by scripts/import-wave7-speeches.mjs at the frozen P0 pins: முத்துக் குளியல் Part I (61)
// and Part II (36) — exactly the frozen census sets (their printed order lives on the two LibraryCollections) — and
// three assembly speeches. Each
// speech has exactly two routes, the reader (`/speeches/<slug>`) and its source page (`/speeches/<slug>/source`);
// the generic `/speeches/[slug]` route unions this registry with `SPEECH_SLUGS` under a de-duplicating `Set`, so
// each slug prerenders exactly once. Publication (catalogue / discovery / sitemap) is `SPEECH_SLUGS` +
// data/library.ts — this registry alone publishes nothing.
export const WAVE7_B5A_SPEECH_SLUGS = [
  "aadithanar-piranthanaal-vizha", "aazhvargal-aaivu-maiya-vizha-1997", "alagabath-maanadu",
  "annai-teresa-padathirappu", "annai-velangkanni-aalaya-velli-vizha", "bharathi-vizha", "bharathiyar-vizha-1997",
  "bharathiyum-pudhumaip-pengalum", "doctor-radhakrishnan-virudhu-vazhangu-vizha",
  "dr-ambedkar-palkalaikkazhaga-thodakka-vizha", "ezhaiyin-sirippil", "haikku-kavithaigal",
  "ilaignargal-kattalaiyidum-kaalam", "ilakkiyathil-tamilagam", "ilakkuvanar", "ilangkovadigal-1",
  "ilangkovadigal-2", "ilangkovadigal-3", "ilangkovadigal-4", "irasarasan-silai", "irumozhi-pothum",
  "ithayangal-iyanthirangal-aagavendam", "kalai-valarppom", "kalaivanar", "kambar-vizha-1", "kambar-vizha-2",
  "kannimara-pothu-noolaga-nootrandu-vizha", "kappalottiya-tamizhan", "karuthuch-suthanthiram",
  "koozhaangkallai-vairamaakkuvom", "kural-vazhi-nadappir", "maanagaratchiyil-sudhandhira-ponvizha",
  "maanavargalum-arasiyalum", "madurai-theendamai-ozhippu-maanadu", "malark-kaatchi", "manappuratchi-thevai",
  "mozhimanam-peruvom", "naam-jananayagam-naan-sarvathikaram", "naam-ore-saathi-tamizhsaathi", "nadaga-dasar",
  "nila-mutram", "paththirikaip-penne", "payitru-mozhi", "pazhaiya-varalaarum-ilaiya-thalaimuraiyum", "pirappokkum",
  "punitha-thomaiyar", "rukmani-lakshmipathi-nutrandu-vizha", "salem-periyar-palkalaikkazhaga-thodakka-vizha",
  "sangakala-tamizh-naanayangkal-nool-veliyeettu-vizha",
  "sudhandhira-ponvizha-thamizhaga-thiyagigal-vazhiyanuppu-vizha", "sudhandhira-thina-ponvizha", "tamilin-solvalam",
  "tamilisai-iyakkam", "tamilkkudi-magan", "tamizhukku-niram-undu", "thathuvam", "umamaheswaranar",
  "vallalar-vazhi-ethu", "valluvarkkor-aalayam", "vasathiyullor-vazhi-viduga", "yathum-oore-yavarum-kelir",
] as const;
export const WAVE7_B5B_SPEECH_SLUGS = [
  "ambur-sampangi-illa-manavizha", "annai-teresa-nool-veliyittu-vizha", "ayyanan-ambalam-padathirappu-vizha",
  "chennai-aazhvargal-aaivu-maiya-vizha-urai", "chennai-chennai-puranagar-vanigargal-sanga-maanadu",
  "chennai-erodu-tamizhanban-noolgal-veliyittu-vizha", "chennai-exnora-rotary-niruvanangalin-paarattu-vizha",
  "chennai-nathigam-ramasami-illa-manavizha", "chennai-thiraiyulagam-nadathiya-paarattu-vizha",
  "chennai-thiripura-orumaippattu-thina-koottam", "chennai-thiyagigal-manimandapa-thirappuvizha",
  "desiya-ilainjar-kondatta-thodakka-vizha", "indiya-suvishesha-thiruchabai-vizha",
  "isaithamizhin-unmai-varalaru-nool-veliyittu-vizha", "kanchi-manimozhiyar-illa-manavizha",
  "kanchipuram-cvm-annamalai-illa-manavizha", "karl-marx-mozhipeyarppu-noolgal-jamadhagni-veliyittu-vizha",
  "kavikko-abdul-raguman-manivizha", "madurai-madha-nallinakka-maanadu",
  "madurai-vazhakkarinjar-sanga-125-aavathu-aanduvizha", "may-thina-vizha",
  "murasoli-arakkattalai-virudhu-vazhangu-vizha", "muthamizh-peravai-vizha",
  "nagarkovil-jeevanandham-manimandapa-thirappuvizha", "nellikuppam-pugazhendhi-manavizha",
  "perayar-ezra-sargunam-manivizha", "pidil-kumbakonam-rajamanickam-pillai-nootraandu-vizha",
  "purusai-gopalarathinam-illa-manavizha", "puthandu-isaivizha", "rajapalayam-kumarasami-raja-nootraandu-vizha",
  "thiraippada-virudhu-vazhangum-vizha", "thiru-vi-ka-kalki-noolgalukku-parivuthogai-vazhangum-vizha",
  "thiruvalluvar-vizha", "thiruvannamalai-arunai-poriyiyal-kalloori-pattamalippu-vizha",
  "tn-rajarathinam-pillai-nootraandu-vizha", "veeran-sundaralingam-ninaivu-grama-thirappuvizha",
] as const;
export const WAVE7_B6_SPEECH_SLUGS = [
  "1971-namathu-vilakkam", "1973-03-07-financial-statement-reply", "1973-03-08-financial-statement-reply",
] as const;
export const WAVE7_SPEECH_SLUGS = [...WAVE7_B5A_SPEECH_SLUGS, ...WAVE7_B5B_SPEECH_SLUGS, ...WAVE7_B6_SPEECH_SLUGS] as const;
export type Wave7SpeechSlug = (typeof WAVE7_SPEECH_SLUGS)[number];
