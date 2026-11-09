import rss, { type RSSFeedItem } from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { url } from "@utils/url-utils";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { APIContext } from "astro";
import { siteConfig } from "@/config";

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

/**
 * Feed readers resolve relative URLs against the feed URL, not the page URL,
 * so root-relative assets produced by the Astro pipeline (e.g. `/_astro/x.svg`)
 * have to be turned into absolute URLs.
 */
function absolutizeUrls(html: string, site: URL): string {
	const toAbsolute = (value: string) => {
		if (!value.startsWith("/") || value.startsWith("//")) return value;
		return new URL(value, site).href;
	};

	return html
		.replace(
			/\b(src|href|poster)="(\/[^"]*)"/g,
			(_, attr: string, value: string) => `${attr}="${toAbsolute(value)}"`,
		)
		.replace(/\bsrcset="([^"]*)"/g, (_, value: string) => {
			const candidates = value.split(",").map((candidate) => {
				const [src, descriptor] = candidate.trim().split(/\s+/, 2);
				return descriptor ? `${toAbsolute(src)} ${descriptor}` : toAbsolute(src);
			});
			return `srcset="${candidates.join(", ")}"`;
		});
}

export async function GET(context: APIContext) {
	const blog = await getSortedPosts();
	const site = context.site ?? new URL("https://fuwari.vercel.app/");
	// RSS 2.0 requires an ISO-639 language code such as `zh-CN`;
	// `zh_CN` (the site config style) is rejected by validators and some readers.
	const siteLang = siteConfig.lang.replace(/_/g, "-");
	// Render post bodies with the same Astro markdown pipeline used by the post
	// pages, so math, code blocks, custom components and processed images match.
	const container = await AstroContainer.create();

	const items: RSSFeedItem[] = [];
	for (const post of blog) {
		const { Content } = await post.render();
		const postPath = url(`/posts/${post.slug}/`);
		const rendered = await container.renderToString(Content, {
			request: new Request(new URL(postPath, site)),
		});
		items.push({
			title: post.data.title,
			pubDate: post.data.published,
			description: post.data.description || "",
			link: postPath,
			content: absolutizeUrls(stripInvalidXmlChars(rendered), site),
			// Expose tags as <category>, so readers can filter/group by tag.
			categories: post.data.tags,
		});
	}

	// The feed content only changes when a post does, so report the newest post
	// date instead of the build time (a build timestamp would make every deploy
	// look like a content update).
	const lastContentUpdate = blog.reduce(
		(latest, post) => {
			const date = post.data.updated ?? post.data.published;
			return date > latest ? date : latest;
		},
		new Date(0),
	);
	const lastBuildDate =
		blog.length > 0
			? `<lastBuildDate>${lastContentUpdate.toUTCString()}</lastBuildDate>`
			: "";

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site,
		items,
		xmlns: {
			atom: "http://www.w3.org/2005/Atom",
		},
		customData: `<language>${siteLang}</language><atom:link href="${new URL("rss.xml", site).href}" rel="self" type="application/rss+xml"/>${lastBuildDate}`,
	});
}
