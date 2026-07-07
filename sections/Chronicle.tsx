"use client";

import { Feather, Landmark, Scale, Users, Sparkles, Flame, BookMarked } from "lucide-react";
import { chronicleStrands } from "@/data/chronicle";
import { RefChips, Reveal, SectionHeading } from "@/components/shared";
import { useLang } from "@/lib/i18n";

const ICONS: Record<string, typeof Feather> = {
  ideology: Sparkles,
  creativity: Feather,
  sacrifice: Flame,
  party: Users,
  autonomy: Landmark,
  justice: Scale,
};

export default function Chronicle() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="chronicle" className="relative overflow-hidden bg-ink py-24 text-paper dark:bg-black" aria-labelledby="chronicle-label">
      {/* faint watermark glyph, in the hero's language */}
      <span aria-hidden className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none font-tamil text-[24rem] leading-none text-paper/[0.03]">
        நீதி
      </span>

      <div className="relative mx-auto max-w-content px-4 sm:px-6">
        <Reveal>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-brass">
            <BookMarked className="h-4 w-4" aria-hidden />
            {ta ? "நினைவேட்டுக்கு அப்பால்" : "More than a memoir"}
          </p>
          <h2 id="chronicle-label" className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight sm:text-4xl">
            {ta
              ? "ஒரு வாழ்க்கை வரலாறு மட்டுமல்ல — திராவிட இயக்கத்தின் வரலாறு"
              : "Not a life story alone — a chronicle of the Dravidian movement"}
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-paper/80">
            {ta ? (
              <>
                <p>
                  நெஞ்சுக்கு நீதி ஒரு நினைவேடு மட்டுமல்ல; அது திராவிட இயக்கத்தின் விரிவான வரலாற்றுப் பதிவு. சுயசரிதையை
                  அது கடிதங்கள், கட்டுரைகள், கவிதைகள், கழக வளர்ச்சி, மாநில சுயாட்சி, சமூக நீதி, பகுத்தறிவு ஆகியவற்றுடன்
                  பிணைக்கிறது.
                </p>
                <p>
                  அதன் தனிச்சிறப்பு இதுதான்: ஒரு மாபெரும் அரசியல் ஆளுமையை மனிதநேயத்துடன் காட்டியபடியே, மொழி–சமூகப்
                  போராட்டங்களிலிருந்து ஆட்சி மைல்கற்கள் வரை தமிழ்நாட்டின் மாற்றத்தை—திராவிட அரசியலின் கீழ்—ஒரு
                  முதன்மை வரலாற்று ஆவணமாகப் பதிவு செய்கிறது. கருத்தியல், படைப்பாற்றல், தியாகம், மக்கள்நலச் செயல் ஆகியவற்றைப்
                  பிணைக்கும் அந்த 'திராவிட முறையை' இது உள்ளடக்குகிறது.
                </p>
              </>
            ) : (
              <>
                <p>
                  Nenjukku Neethi is not only a memoir; it is a detailed chronicle of the Dravidian movement. It
                  blends autobiography with letters, essays and poems, and with insight into the party&rsquo;s growth,
                  state autonomy, social justice, and rationalism.
                </p>
                <p>
                  Its special quality lies in how it humanizes a towering political figure while serving as a primary
                  historical document of Tamil Nadu&rsquo;s transformation under Dravidian politics — from linguistic and
                  social struggles to governance milestones. It embodies the &ldquo;Dravidian method&rdquo; of blending
                  ideology, creativity, sacrifice, and people-centric action.
                </p>
              </>
            )}
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chronicleStrands.map((s, i) => {
            const Ic = ICONS[s.id] ?? Sparkles;
            return (
              <Reveal key={s.id} delay={(i % 3) * 0.06}>
                <article className="flex h-full flex-col rounded-2xl border border-paper/15 bg-paper/[0.04] p-6 backdrop-blur">
                  <Ic className="h-6 w-6 text-brass" aria-hidden />
                  <p className="mt-3 font-tamil text-sm text-brass/90" lang="ta">{s.tamil}</p>
                  <h3 className="font-display text-xl font-medium">{ta ? s.tamil.split(" · ")[0] : s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-paper/70" lang={lang}>
                    {ta ? s.body.ta : s.body.en}
                  </p>
                  <div className="mt-4">
                    <RefChips refs={s.refs} />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="mt-12 max-w-3xl border-l-2 border-brass/50 pl-4 font-display text-lg italic text-paper/75">
            {ta
              ? "\u201cவாழ்க்கையைப் போராட்டம் என்பர் சிலர். என் வாழ்விலோ, போராட்டமே வாழ்க்கை.\u201d"
              : "\u201cSome describe life as struggle. In my case, the struggle itself is life.\u201d"}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
