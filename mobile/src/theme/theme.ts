// Visual identity carried over from nenjukkuneethi.org (marina teal, brass, paper,
// night), extended with a sepia reading mode designed for the phone. Interactions
// are re-thought for mobile; only the palette + type voice are shared with the web.

export type ThemeName = "light" | "dark" | "sepia";

export type Palette = {
  name: ThemeName;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string; // marina
  primaryText: string; // on primary
  accent: string; // brass
  border: string;
  highlight: string; // search/reading highlight
  statusBar: "light" | "dark";
};

const marina = "#0E5D63";
const marinaLight = "#1B7F87";
const brass = "#B98A2F";

export const palettes: Record<ThemeName, Palette> = {
  light: {
    name: "light",
    bg: "#FAF7F1",
    surface: "#FFFFFF",
    surfaceAlt: "#F1ECE2",
    text: "#0F1720",
    textMuted: "rgba(15,23,32,0.66)",
    textFaint: "rgba(15,23,32,0.45)",
    primary: marina,
    primaryText: "#FAF7F1",
    accent: brass,
    border: "rgba(15,23,32,0.12)",
    highlight: "rgba(185,138,47,0.28)",
    statusBar: "dark",
  },
  sepia: {
    name: "sepia",
    bg: "#F4ECD8",
    surface: "#FBF4E3",
    surfaceAlt: "#EADFC4",
    text: "#3B2F1E",
    textMuted: "rgba(59,47,30,0.68)",
    textFaint: "rgba(59,47,30,0.45)",
    primary: "#0D5158",
    primaryText: "#FBF4E3",
    accent: "#9A6E1F",
    border: "rgba(59,47,30,0.16)",
    highlight: "rgba(154,110,31,0.30)",
    statusBar: "dark",
  },
  dark: {
    name: "dark",
    bg: "#0C1116",
    surface: "#131B23",
    surfaceAlt: "#1B2530",
    text: "#EDE7DB",
    textMuted: "rgba(237,231,219,0.66)",
    textFaint: "rgba(237,231,219,0.45)",
    primary: marinaLight,
    primaryText: "#0C1116",
    accent: brass,
    border: "rgba(255,255,255,0.12)",
    highlight: "rgba(185,138,47,0.34)",
    statusBar: "light",
  },
};

export const spacing = (n: number) => n * 4;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

// Reading typography. Tamil body uses Noto Serif Tamil (loaded in App). Font size
// and line-height are user-controlled (see reading prefs); these are the anchors.
export const fontSteps = [16, 18, 20, 22, 25, 28] as const; // body px
export const lineHeightSteps = [1.5, 1.7, 1.9] as const;
export const tamilFont = "NotoSerifTamil_500Medium";
export const tamilFontBold = "NotoSerifTamil_600SemiBold";
