import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import * as schema from "@reactive-resume/db/schema";
import { resumeDataSchema } from "@reactive-resume/schema/resume/data";
import { jsonPatchOperationSchema } from "@reactive-resume/utils/resume/patch";

const resumeSchema = createSelectSchema(schema.resume, {
	id: z.string().describe("The ID of the resume."),
	name: z.string().min(1).describe("The name of the resume."),
	slug: z.string().min(1).describe("The slug of the resume."),
	tags: z.array(z.string()).describe("The tags of the resume."),
	isPublic: z.boolean().describe("Whether the resume is public."),
	isLocked: z.boolean().describe("Whether the resume is locked."),
	password: z.string().min(6).nullable().describe("The password of the resume, if any."),
	data: resumeDataSchema,
	userId: z.string().describe("The ID of the user who owns the resume."),
	groupId: z.string().nullable().describe("The ID of the group this resume belongs to, or null if ungrouped."),
	createdAt: z.date().describe("The date and time the resume was created."),
	updatedAt: z.date().describe("The date and time the resume was last updated."),
});

/**
 * Group filter for the list endpoint.
 *   - omitted / undefined → return all resumes (current behaviour)
 *   - "ungrouped"         → only resumes whose groupId is NULL
 *   - <groupId string>    → only resumes belonging to that specific group
 */
const groupFilterSchema = z
	.union([z.literal("ungrouped"), z.string().min(1)])
	.optional()
	.describe(
		"Filter resumes by group. Pass a group ID to only return resumes in that group, or 'ungrouped' to only return resumes not in any group. Omit to return all resumes.",
	);

export const resumeDto = {
	list: {
		input: z
			.object({
				tags: z.array(z.string()).optional().default([]),
				sort: z.enum(["lastUpdatedAt", "createdAt", "name"]).optional().default("lastUpdatedAt"),
				group: groupFilterSchema,
			})
			.optional()
			.default({ tags: [], sort: "lastUpdatedAt" }),
		output: z.array(resumeSchema.omit({ data: true, password: true, userId: true })),
	},

	getById: {
		input: resumeSchema.pick({ id: true }),
		output: resumeSchema
			.omit({ password: true, userId: true, createdAt: true, updatedAt: true })
			.extend({ hasPassword: z.boolean() }),
	},

	getBySlug: {
		input: z.object({ username: z.string(), slug: z.string() }),
		output: resumeSchema.omit({
			password: true,
			userId: true,
			groupId: true,
			createdAt: true,
			updatedAt: true,
		}),
	},

	create: {
		input: resumeSchema.pick({ name: true, slug: true, tags: true }).extend({
			withSampleData: z.boolean().default(false),
			groupId: z
				.string()
				.optional()
				.describe("Optional group to place the new resume in. The group must belong to the authenticated user."),
		}),
		output: z.string().describe("The ID of the created resume."),
	},

	import: {
		input: resumeSchema.pick({ data: true }).extend({
			groupId: z
				.string()
				.optional()
				.describe("Optional group to place the imported resume in. The group must belong to the authenticated user."),
		}),
		output: z.string().describe("The ID of the imported resume."),
	},

	update: {
		input: resumeSchema
			.pick({ name: true, slug: true, tags: true, data: true, isPublic: true, groupId: true })
			.partial()
			.extend({ id: z.string() }),
		output: resumeSchema
			.omit({ password: true, userId: true, createdAt: true, updatedAt: true })
			.extend({ hasPassword: z.boolean() }),
	},

	setLocked: {
		input: resumeSchema.pick({ id: true, isLocked: true }),
		output: z.void(),
	},

	setPassword: {
		input: resumeSchema.pick({ id: true }).extend({ password: z.string().min(6).max(64) }),
		output: z.void(),
	},

	removePassword: {
		input: resumeSchema.pick({ id: true }),
		output: z.void(),
	},

	patch: {
		input: z.object({
			id: z.string().describe("The ID of the resume to patch."),
			operations: z
				.array(jsonPatchOperationSchema)
				.min(1)
				.describe("An array of JSON Patch (RFC 6902) operations to apply to the resume data."),
		}),
		output: resumeSchema
			.omit({ password: true, userId: true, createdAt: true, updatedAt: true })
			.extend({ hasPassword: z.boolean() }),
	},

	duplicate: {
		input: resumeSchema.pick({ id: true, name: true, slug: true, tags: true }).extend({
			groupId: z
				.string()
				.nullable()
				.optional()
				.describe(
					"Optional group to place the duplicated resume in. Defaults to the original resume's group. Pass `null` to create the duplicate as ungrouped.",
				),
		}),
		output: z.string().describe("The ID of the duplicated resume."),
	},

	delete: {
		input: resumeSchema.pick({ id: true }),
		output: z.void(),
	},
};
