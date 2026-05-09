import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { ArrowLeftIcon, GearSixIcon, GridFourIcon, ListIcon, ReadCvLogoIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import { Label } from "@reactive-resume/ui/components/label";
import { Separator } from "@reactive-resume/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@reactive-resume/ui/components/tabs";
import { cn } from "@reactive-resume/utils/style";
import { Combobox } from "@/components/ui/combobox";
import { useDialogStore } from "@/dialogs/store";
import { orpc } from "@/libs/orpc/client";
import { DashboardHeader } from "../-components/header";
import { GridView } from "./-components/grid-view";
import { ListView } from "./-components/list-view";

type SortOption = "lastUpdatedAt" | "createdAt" | "name";

// "all" → no filter (default)
// "ungrouped" → only resumes without a group
// any other string → a specific group ID
const GROUP_ALL = "all" as const;
const GROUP_UNGROUPED = "ungrouped" as const;

const searchSchema = z.object({
	tags: z.array(z.string()).default([]),
	sort: z.enum(["lastUpdatedAt", "createdAt", "name"]).default("lastUpdatedAt"),
	view: z.enum(["grid", "list"]).default("grid"),
	group: z.string().default(GROUP_ALL),
});

type Search = z.output<typeof searchSchema>;

const defaultSearch: Search = { tags: [], sort: "lastUpdatedAt", view: "grid", group: GROUP_ALL };

export const Route = createFileRoute("/dashboard/resumes/")({
	component: RouteComponent,
	validateSearch: searchSchema,
	search: {
		middlewares: [stripSearchParams(defaultSearch)],
	},
});

function RouteComponent() {
	const { i18n } = useLingui();
	const { tags, sort, view, group } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { openDialog } = useDialogStore();

	const { data: allTags } = useQuery(orpc.resume.tags.list.queryOptions());
	const { data: groups } = useQuery(orpc.resumeGroup.list.queryOptions());

	// Translate the group filter into the API parameter:
	//   GROUP_ALL → undefined (server returns everything)
	//   GROUP_UNGROUPED → "ungrouped"
	//   <groupId> → that ID
	const apiGroup = group === GROUP_ALL ? undefined : group;
	const { data: resumes } = useQuery(
		orpc.resume.list.queryOptions({ input: { tags, sort, ...(apiGroup ? { group: apiGroup } : {}) } }),
	);

	const tagOptions = useMemo(() => {
		if (!allTags) return [];
		return allTags.map((tag) => ({ value: tag, label: tag }));
	}, [allTags]);

	const sortOptions = useMemo(() => {
		return [
			{ value: "lastUpdatedAt", label: i18n.t("Last Updated") },
			{ value: "createdAt", label: i18n.t("Created") },
			{ value: "name", label: i18n.t("Name") },
		];
	}, [i18n]);

	const groupOptions = useMemo(() => {
		const options: { value: string; label: React.ReactNode }[] = [
			{ value: GROUP_ALL, label: i18n.t("All Resumes") },
			{ value: GROUP_UNGROUPED, label: i18n.t("Ungrouped") },
		];
		if (groups && groups.length > 0) {
			for (const g of groups) {
				options.push({
					value: g.id,
					label: g.resumeCount > 0 ? `${g.name} (${g.resumeCount})` : g.name,
				});
			}
		}
		return options;
	}, [groups, i18n]);

	const activeGroup = useMemo(() => {
		if (group === GROUP_ALL || group === GROUP_UNGROUPED) return null;
		return groups?.find((g) => g.id === group) ?? null;
	}, [group, groups]);

	// Reset stale group selection: if URL has ?group=<id> but that group
	// no longer exists (deleted from another tab), drop back to "all".
	const isGroupSelectionStale =
		group !== GROUP_ALL && group !== GROUP_UNGROUPED && groups !== undefined && activeGroup === null;
	if (isGroupSelectionStale) {
		void navigate({ search: (prev) => ({ ...prev, group: GROUP_ALL }), replace: true });
	}

	return (
		<div className="space-y-4">
			<DashboardHeader icon={ReadCvLogoIcon} title={t`Resumes`} />

			<Separator />

			<div className="flex items-center gap-x-4">
				<div className="flex gap-2">
					<Label>
						<Trans>Sort by</Trans>
					</Label>
					<Combobox
						value={sort}
						options={sortOptions}
						placeholder={t`Sort by`}
						onValueChange={(value) => {
							if (!value) return;
							void navigate({ search: (prev) => ({ ...prev, sort: value as SortOption }) });
						}}
					/>
				</div>

				<div className={cn("flex gap-2", { hidden: tagOptions.length === 0 })}>
					<Label>
						<Trans>Filter by</Trans>
					</Label>
					<Combobox
						multiple
						value={tags}
						options={tagOptions}
						placeholder={t`Filter by`}
						onValueChange={(value) => {
							void navigate({ search: (prev) => ({ ...prev, tags: value ?? [] }) });
						}}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Label>
						<Trans>Group</Trans>
					</Label>
					<Combobox
						value={group}
						options={groupOptions}
						placeholder={t`Group`}
						onValueChange={(value) => {
							if (!value) return;
							void navigate({ search: (prev) => ({ ...prev, group: value }) });
						}}
					/>
					<Button
						size="icon"
						variant="ghost"
						title={t`Manage groups`}
						onClick={() => {
							openDialog("resume.groups.manage", undefined);
						}}
					>
						<GearSixIcon />
					</Button>
				</div>

				<Tabs className="ltr:ms-auto rtl:me-auto" value={view}>
					<TabsList>
						<TabsTrigger
							value="grid"
							nativeButton={false}
							className="rounded-r-none"
							render={<Link to="." search={(prev) => ({ ...prev, view: "grid" })} />}
						>
							<GridFourIcon />
							<Trans>Grid</Trans>
						</TabsTrigger>

						<TabsTrigger
							value="list"
							nativeButton={false}
							className="rounded-l-none"
							render={<Link to="." search={(prev) => ({ ...prev, view: "list" })} />}
						>
							<ListIcon />
							<Trans>List</Trans>
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{(activeGroup ?? group === GROUP_UNGROUPED) && (
				<div className="flex items-center gap-x-2 text-sm">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							void navigate({ search: (prev) => ({ ...prev, group: GROUP_ALL }) });
						}}
					>
						<ArrowLeftIcon />
						<Trans>All Resumes</Trans>
					</Button>
					<span className="opacity-60">/</span>
					<span className="font-medium">{activeGroup ? activeGroup.name : <Trans>Ungrouped</Trans>}</span>
				</div>
			)}

			{view === "list" ? (
				<ListView resumes={resumes ?? []} groupContext={apiGroup} />
			) : (
				<GridView resumes={resumes ?? []} groupContext={apiGroup} />
			)}
		</div>
	);
}
