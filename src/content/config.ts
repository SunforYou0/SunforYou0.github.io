import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	// `image()` resolves a cover path relative to the post file and returns the
	// imported asset metadata, so covers go through Astro's image pipeline
	// (optimization, hashed URLs, intrinsic dimensions) instead of a manual glob.
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			published: z.date(),
			updated: z.date().optional(),
			draft: z.boolean().optional().default(false),
			description: z.string().optional().default(""),
			image: image().optional(),
			tags: z.array(z.string()).optional().default([]),
			category: z.string().optional().nullable().default(""),
			lang: z.string().optional().default(""),

			/* For internal use */
			prevTitle: z.string().default(""),
			prevSlug: z.string().default(""),
			nextTitle: z.string().default(""),
			nextSlug: z.string().default(""),
		}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
