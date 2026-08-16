# App Store metadata — தமிழ் (Tamil localization)

Tamil (`ta`) is a **supported App Store storefront localization** (confirmed against Apple's
current App Store localizations list — Tamil is among the 50 supported languages). Add it as a
full localization alongside English; do not fold it into English.

> **Length caveat:** App Store character limits count Unicode characters, and Tamil uses
> combining vowel signs / virama, so a Tamil grapheme spans several code points. The keyword
> field is additionally **byte-counted** (Tamil ≈ 3 bytes/char), which makes 100 very tight.
> Every Tamil field below is kept short, but **verify the exact count inside App Store Connect**
> before submitting — do not assume the English counts carry over.

Copy is written as natural Tamil, not a mechanical translation, and introduces **no** product
claim that isn't already in [`metadata.en.md`](metadata.en.md).

---

## App Name  _(limit 30)_
```
நெஞ்சுக்கு நீதி
```
The memoir's own Tamil title (≈15 code points).

## Subtitle  _(limit 30 — verify Tamil count in ASC)_
```
கலைஞரின் சுயசரிதை, ஆஃப்லைன்
```
"Kalaignar's autobiography, offline." ≈27 code points; verify length in ASC.

## Promotional Text  _(limit 170 — verify in ASC)_
```
கலைஞர் மு. கருணாநிதியின் ஆறு தொகுதி சுயசரிதை — தமிழிலும் ஆங்கிலத்திலும் படியுங்கள். தேடல், காலக்கோடு, கருப்பொருள், மனிதர்கள், இடங்கள், முரசொலி கடிதங்கள். ஆஃப்லைனில்.
```
Only shipped features.

## Description  _(limit 4000 — verify in ASC)_
```
நெஞ்சுக்கு நீதி — கலைஞர் மு. கருணாநிதியின் (1924–2005) முழு ஆறு தொகுதி சுயசரிதையையும், அவரது முரசொலி கடிதங்களையும் கொண்ட ஒரு பூர்வீக வாசிப்பு தொகுப்பு. iPhone மற்றும் iPad-இல், ஆஃப்லைனில் நிதானமாக வாசிக்கும் வகையில் உருவாக்கப்பட்ட ஒரு சுதந்திர டிஜிட்டல் பதிப்பு.

முழு சுயசரிதை
நெஞ்சுக்கு நீதியின் ஆறு தொகுதிகளும், 391 அத்தியாயங்களும் (1924–2005) — மூல தமிழ் உரையிலிருந்து, தொகுதி வாரியாக, அத்தியாயம் வாரியாக.

தமிழிலும் ஆங்கிலத்திலும்
மூல தமிழில் (Noto Serif Tamil எழுத்துருவில்) படியுங்கள்; மொழிபெயர்ப்பு உள்ள இடங்களில் ஒரே தொடுதலில் ஆங்கிலத்திற்கு மாறுங்கள். மொழிபெயர்ப்பாளர் குறிப்பு எப்போதும் கலைஞரின் சொற்களிலிருந்து தனித்துக் காட்டப்படும்.

தேடல்
391 அத்தியாயங்கள் முழுவதும் தமிழ் முழு-உரைத் தேடல். முடிவைத் தொட்டால், அந்தப் பகுதி சிறப்பித்துக் காட்டப்படும்.

காலக்கோடு
1924 முதல் சுயசரிதையின் முக்கிய நிகழ்வுகளைக் காலவரிசையில் காணுங்கள் — ஒவ்வொரு நிகழ்வையும் தொட்டால் அது வரும் அத்தியாயம் திறக்கும்.

கருப்பொருள், மனிதர்கள், இடங்கள்
கருப்பொருள் வாரியாகவும், கதையை வடிவமைத்த மனிதர்கள் வழியாகவும், நிகழ்ந்த இடங்கள் வழியாகவும் தொகுப்பை ஆராயுங்கள் — ஒவ்வொன்றும் நேரடியாக சுயசரிதைக்கு இணைக்கிறது.

முரசொலி கடிதங்கள்
ஏழு தொகுதிகளில் 346 முரசொலி கடிதங்களைத் தமிழில் (ஆங்கிலம் உள்ள இடங்களில் அதனுடன்) படியுங்கள்.

வாசிப்புக்காக
எழுத்து அளவு, வரி இடைவெளி, தீம் (ஒளி / செபியா / இருள்) மாற்றிக்கொள்ளுங்கள். அத்தியாயங்களைக் குறியிட்டு, நிறுத்திய இடத்திலிருந்து தொடருங்கள்; நீண்ட அழுத்தத்தில் ஒரு பகுதியைப் பகிருங்கள்.

ஆஃப்லைனில்
அத்தியாயங்களைப் பதிவிறக்கி ஆஃப்லைனில் படியுங்கள். உங்கள் குறிப்புகள், வாசிப்பு நிலை, விருப்பங்கள் அனைத்தும் உங்கள் சாதனத்தில் மட்டுமே இருக்கும்.

அணுகல்தன்மை
Dynamic Type, VoiceOver குறிச்சொற்கள், தலைப்பு அமைப்பு, தமிழ்-முதன்மை எழுத்துரு.

இந்தப் பதிப்பு பற்றி
இது ஒரு சுதந்திர, இலாப-நோக்கற்ற டிஜிட்டல் பதிப்பு. இது அதிகாரப்பூர்வ வெளியீடு அல்ல; எந்த நபர், குடும்பம், கட்சி அல்லது நிறுவனத்துடனும் தொடர்பையோ ஆதரவையோ உரிமை கோரவில்லை. மூல படைப்புகளின் பதிப்புரிமை அந்தந்த உரிமையாளர்களிடமே உள்ளது; இந்தப் பதிப்பு மூல ஆதாரத்தைக் குறிப்பிடுகிறது. திருத்தங்களை nenjukkuneethi.org வழியாகத் தெரிவிக்கலாம்.
```

## Keywords  _(limit 100 bytes — Tamil ≈3 bytes/char, so very tight; verify in ASC)_
Recommended (mixes Latin names — 1 byte each — with a few high-value Tamil terms to stay within
the byte budget):
```
கலைஞர்,கருணாநிதி,முரசொலி,சுயசரிதை
```
≈93 bytes (Tamil is byte-expensive; 100-byte cap). Verify the **byte** count in ASC. If it
overflows, drop the longer Tamil terms first and rely on the Latin names in the English keyword
set for cross-locale reach.

## Notes
- The Tamil-first identity is preserved: the Tamil name is the memoir's own title, and the app
  ships Tamil-primary content.
- No claim here exceeds the English metadata; both localizations assert the same shipped features
  and the same "independent digital edition" positioning.
