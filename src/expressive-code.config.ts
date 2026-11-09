import type { ExpressiveCodeConfig } from "./types/config";

// Kept in its own module: `astro.config.mjs` imports this file with plain Node,
// which cannot load the image imports that `src/config.ts` now contains.
export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
