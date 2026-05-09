import z from "zod";
import { protectedProcedure } from "../context";
import { resumeGroupDto } from "../dto/resume-group";
import { resumeMutationRateLimit } from "../middleware/rate-limit";
import { resumeGroupService } from "../services/resume-group";

export const resumeGroupRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/resume-groups",
			tags: ["Resume Groups"],
			operationId: "listResumeGroups",
			summary: "List all resume groups",
			description:
				"Returns a list of all resume groups belonging to the authenticated user. Each group includes its current resume count. Requires authentication.",
			successDescription: "A list of the user's resume groups, sorted alphabetically by name.",
		})
		.output(resumeGroupDto.list.output)
		.handler(async ({ context }) => {
			return resumeGroupService.list({ userId: context.user.id });
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/resume-groups",
			tags: ["Resume Groups"],
			operationId: "createResumeGroup",
			summary: "Create a new resume group",
			description:
				"Creates a new resume group with the given name. Group names must be unique within a user's account. Requires authentication.",
			successDescription: "The newly created resume group.",
		})
		.input(resumeGroupDto.create.input)
		.use(resumeMutationRateLimit)
		.output(resumeGroupDto.create.output)
		.errors({
			RESUME_GROUP_NAME_ALREADY_EXISTS: {
				message: "A resume group with this name already exists.",
				status: 400,
			},
		})
		.handler(async ({ context, input }) => {
			return resumeGroupService.create({ userId: context.user.id, name: input.name });
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/resume-groups/{id}",
			tags: ["Resume Groups"],
			operationId: "updateResumeGroup",
			summary: "Rename a resume group",
			description:
				"Renames an existing resume group. Group names must be unique within a user's account. Requires authentication.",
			successDescription: "The updated resume group.",
		})
		.input(resumeGroupDto.update.input)
		.use(resumeMutationRateLimit)
		.output(resumeGroupDto.update.output)
		.errors({
			RESUME_GROUP_NAME_ALREADY_EXISTS: {
				message: "A resume group with this name already exists.",
				status: 400,
			},
		})
		.handler(async ({ context, input }) => {
			return resumeGroupService.update({ id: input.id, userId: context.user.id, name: input.name });
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/resume-groups/{id}",
			tags: ["Resume Groups"],
			operationId: "deleteResumeGroup",
			summary: "Delete a resume group",
			description:
				"Deletes a resume group. Resumes that belong to the group are not deleted; their group association is cleared and they become ungrouped. Requires authentication.",
			successDescription: "The resume group was deleted successfully. Resumes in the group are preserved.",
		})
		.input(resumeGroupDto.delete.input)
		.use(resumeMutationRateLimit)
		.output(z.void())
		.handler(async ({ context, input }) => {
			return resumeGroupService.delete({ id: input.id, userId: context.user.id });
		}),
};
