import { ORPCError } from "@orpc/client";
import { and, asc, count, eq } from "drizzle-orm";
import { get } from "es-toolkit/compat";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { generateId } from "@reactive-resume/utils/string";

const RESUME_GROUP_NAME_UNIQUE_CONSTRAINT = "resume_group_user_id_name_unique";

export const resumeGroupService = {
	list: async (input: { userId: string }) => {
		// Single query that joins on resume to compute resumeCount per group.
		const rows = await db
			.select({
				id: schema.resumeGroup.id,
				name: schema.resumeGroup.name,
				createdAt: schema.resumeGroup.createdAt,
				updatedAt: schema.resumeGroup.updatedAt,
				resumeCount: count(schema.resume.id),
			})
			.from(schema.resumeGroup)
			.leftJoin(schema.resume, eq(schema.resume.groupId, schema.resumeGroup.id))
			.where(eq(schema.resumeGroup.userId, input.userId))
			.groupBy(schema.resumeGroup.id)
			.orderBy(asc(schema.resumeGroup.name));

		return rows;
	},

	create: async (input: { userId: string; name: string }) => {
		const id = generateId();

		try {
			const [group] = await db
				.insert(schema.resumeGroup)
				.values({ id, userId: input.userId, name: input.name })
				.returning({
					id: schema.resumeGroup.id,
					name: schema.resumeGroup.name,
					createdAt: schema.resumeGroup.createdAt,
					updatedAt: schema.resumeGroup.updatedAt,
				});

			if (!group) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create resume group" });

			return { ...group, resumeCount: 0 };
		} catch (error) {
			if (get(error, "cause.constraint") === RESUME_GROUP_NAME_UNIQUE_CONSTRAINT) {
				throw new ORPCError("RESUME_GROUP_NAME_ALREADY_EXISTS", { status: 400 });
			}

			console.error("Failed to create resume group:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create resume group" });
		}
	},

	update: async (input: { id: string; userId: string; name: string }) => {
		try {
			const [group] = await db
				.update(schema.resumeGroup)
				.set({ name: input.name })
				.where(and(eq(schema.resumeGroup.id, input.id), eq(schema.resumeGroup.userId, input.userId)))
				.returning({
					id: schema.resumeGroup.id,
					name: schema.resumeGroup.name,
					createdAt: schema.resumeGroup.createdAt,
					updatedAt: schema.resumeGroup.updatedAt,
				});

			if (!group) throw new ORPCError("NOT_FOUND");

			const countRows = await db
				.select({ resumeCount: count(schema.resume.id) })
				.from(schema.resume)
				.where(eq(schema.resume.groupId, group.id));
			const resumeCount = countRows[0]?.resumeCount ?? 0;

			return { ...group, resumeCount };
		} catch (error) {
			if (get(error, "cause.constraint") === RESUME_GROUP_NAME_UNIQUE_CONSTRAINT) {
				throw new ORPCError("RESUME_GROUP_NAME_ALREADY_EXISTS", { status: 400 });
			}

			if (error instanceof ORPCError) throw error;

			console.error("Failed to update resume group:", error);
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update resume group" });
		}
	},

	delete: async (input: { id: string; userId: string }) => {
		const result = await db
			.delete(schema.resumeGroup)
			.where(and(eq(schema.resumeGroup.id, input.id), eq(schema.resumeGroup.userId, input.userId)))
			.returning({ id: schema.resumeGroup.id });

		if (result.length === 0) throw new ORPCError("NOT_FOUND");
	},

	/**
	 * Verify that a group exists and belongs to the given user. Used by
	 * the resume service to gate `groupId` writes (so a user can't move
	 * their resume into someone else's group).
	 */
	assertOwned: async (input: { id: string; userId: string }) => {
		const [group] = await db
			.select({ id: schema.resumeGroup.id })
			.from(schema.resumeGroup)
			.where(and(eq(schema.resumeGroup.id, input.id), eq(schema.resumeGroup.userId, input.userId)));

		if (!group) throw new ORPCError("RESUME_GROUP_NOT_FOUND", { status: 404 });
	},
};
