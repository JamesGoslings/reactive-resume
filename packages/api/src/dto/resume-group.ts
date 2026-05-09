import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import * as schema from "@reactive-resume/db/schema";

const resumeGroupSchema = createSelectSchema(schema.resumeGroup, {
	id: z.string().describe("The ID of the resume group."),
	name: z.string().min(1).max(64).describe("The name of the resume group."),
	userId: z.string().describe("The ID of the user who owns the group."),
	createdAt: z.date().describe("The date and time the group was created."),
	updatedAt: z.date().describe("The date and time the group was last updated."),
});

const resumeGroupOutputSchema = resumeGroupSchema.omit({ userId: true }).extend({
	resumeCount: z.number().int().nonnegative().describe("Number of resumes currently in this group."),
});

export const resumeGroupDto = {
	list: {
		input: z.void(),
		output: z.array(resumeGroupOutputSchema),
	},

	create: {
		input: resumeGroupSchema.pick({ name: true }),
		output: resumeGroupOutputSchema,
	},

	update: {
		input: resumeGroupSchema.pick({ id: true, name: true }),
		output: resumeGroupOutputSchema,
	},

	delete: {
		input: resumeGroupSchema.pick({ id: true }),
		output: z.void(),
	},
};
