import avatarImage from "./assets/images/ayer.png";
import bannerImage from "./assets/images/spacestudio.webp";
import type {
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "云中小屋",
	subtitle: "技术博客",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		// Imported from `src/assets` so Astro optimizes it and emits a hashed,
		// cache-friendly URL. A `/public` path or remote URL still works as a fallback.
		src: bannerImage,
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [{ src: "/favicon.ico" }],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/SunforYou0", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	// Imported from `src/assets`, so the avatar goes through Astro's image pipeline.
	avatar: avatarImage,
	name: "SunYu",
	bio: "新手程序员的技术博客与随想记录",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github", // Visit https://icones.js.org/ for icon codes
			url: "https://github.com/SunforYou0",
		},
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:sunforyu@163.com",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

// Re-exported for backwards compatibility; `astro.config.mjs` imports the module
// directly to avoid loading the image imports above in a plain Node context.
export { expressiveCodeConfig } from "./expressive-code.config";
