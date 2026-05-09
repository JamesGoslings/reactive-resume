import type { DialogProps } from "../../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { FoldersIcon, PencilSimpleLineIcon, PlusIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useDialogStore } from "../../store";

export function ManageGroupsDialog(_: DialogProps<"resume.groups.manage">) {
	const confirm = useConfirm();
	const { openDialog, closeDialog } = useDialogStore();

	const { data: groups, isLoading } = useQuery(orpc.resumeGroup.list.queryOptions());
	const { mutate: deleteGroup } = useMutation(orpc.resumeGroup.delete.mutationOptions());

	const handleCreate = () => {
		openDialog("resume.groups.create", undefined);
	};

	const handleRename = (group: { id: string; name: string }) => {
		openDialog("resume.groups.update", { id: group.id, name: group.name });
	};

	const handleDelete = async (group: { id: string; name: string; resumeCount: number }) => {
		const confirmation = await confirm(t`Are you sure you want to delete this group?`, {
			description:
				group.resumeCount === 0
					? t`This group is empty.`
					: t`The ${group.resumeCount} resume(s) in "${group.name}" will become ungrouped, but they will not be deleted.`,
		});

		if (!confirmation) return;

		const toastId = toast.loading(t`Deleting group...`);

		deleteGroup(
			{ id: group.id },
			{
				onSuccess: () => {
					toast.success(t`Group has been deleted successfully.`, { id: toastId });
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			},
		);
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<FoldersIcon />
					<Trans>Manage groups</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>Create, rename, or delete groups. Deleting a group does not delete its resumes.</Trans>
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-2">
				<Button variant="outline" className="w-full justify-start gap-x-2" onClick={handleCreate}>
					<PlusIcon />
					<Trans>Create a new group</Trans>
				</Button>

				<div className="max-h-80 space-y-1 overflow-y-auto">
					{isLoading && (
						<p className="py-4 text-center text-sm opacity-60">
							<Trans>Loading...</Trans>
						</p>
					)}

					{!isLoading && (!groups || groups.length === 0) && (
						<p className="py-4 text-center text-sm opacity-60">
							<Trans>You don't have any groups yet.</Trans>
						</p>
					)}

					{groups?.map((group) => (
						<div key={group.id} className="flex items-center gap-x-2 rounded-md border px-3 py-2">
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium">{group.name}</div>
								<div className="text-xs opacity-60">
									<Trans>{group.resumeCount} resume(s)</Trans>
								</div>
							</div>

							<Button
								size="icon"
								variant="ghost"
								title={t`Rename group`}
								onClick={() => {
									handleRename(group);
								}}
							>
								<PencilSimpleLineIcon />
							</Button>

							<Button
								size="icon"
								variant="ghost"
								title={t`Delete group`}
								onClick={() => {
									void handleDelete(group);
								}}
							>
								<TrashSimpleIcon />
							</Button>
						</div>
					))}
				</div>
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={closeDialog}>
					<Trans>Close</Trans>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
