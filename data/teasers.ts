/**
 * Chapter teasers — 2–3 sentences under the chapter title in the Reader.
 *
 * RULES (per docs/ux-backlog.md): every teaser is WRITTEN against the actual
 * chapter text and verified before it ships; never generated blind, never
 * invented. Coverage grows chapter by chapter alongside the translation
 * sessions (the translator has read the chapter closely anyway).
 * A chapter with no entry simply shows no teaser.
 */
export type Teaser = { ta: string; en?: string };

export const teasers: Record<string, Teaser> = {
  "v1-ch01": {
    ta: "வாழ்க்கை வரலாறு எழுதுமளவுக்கு நான் என்ன பெரிய மனிதனா என்று நெஞ்சே எழுப்பிய கேள்விக்கு, சின்னவர்களுக்கும் வரலாறு உண்டு என்ற தீர்ப்புடன் தொடங்கும் முதல் அத்தியாயம். லெனின் மறைந்த, காந்தியடிகள் சிறையிலிருந்து விடுதலையான, காவிரி ஒப்பந்தம் கையெழுத்தான 1924-இல் — திருக்குவளையில் ஒரு பிறப்பு.",
    en: "The opening chapter begins with a question raised by my own heart: \"Am I such a great man that I should write an autobiography?\" It proceeds to pronounce its own verdict—that the humble, too, possess a history. And so it arrives at 1924: the year Lenin died, Gandhiji was released from prison, the Cauvery Agreement was signed—and a child was born in Thirukkuvalai.",
  },
};
