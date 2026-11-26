import { Google_Sans, Google_Sans_Flex } from "next/font/google";

/** Google Sans Flex for Latin, Google Sans for Georgian and Cyrillic: one family across all three languages. */
export const sansFlex = Google_Sans_Flex({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-flex",
  display: "swap",
});
export const sans = Google_Sans({
  subsets: ["georgian", "cyrillic"],
  variable: "--font-sans-intl",
  display: "swap",
});

export const fontVariables = `${sansFlex.variable} ${sans.variable}`;
