import type { DialogProps } from "../../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { FoldersIcon, PlusIcon } from "@phosphor-icons/react";
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
import { cn } from "@reactive-resume/utils/style";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useDialogStore } from "../../store";

export function MoveResumeToGroupDialog({ data }: DialogProps<"resume.groups.move">) {
	const { openDialog, closeDialog } = useDialogStore();

	const { data: groups, isLoading } = useQuery(orpc.resumeGroup.list.queryOptions());
	const { mutate: updateResume, isPending } = useMutation(orpc.resume.update.mutationOptions());

	const handleSelect = (targetGroupId: string | null) => {
		// No-op if the user picks the resume's current group.
		if (targetGroupId === data.currentGroupId) {
			closeDialog();
			return;
		}

		const toastId = toast.loading(t`Moving resume...`);

		updateResume(
			{ id: data.resumeId, groupId: targetGroupId },
			{
				onSuccess: () => {
					toast.success(t`Resume has been moved successfully.`, { id: toastId });
					closeDialog();
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
					<Trans>Move to group</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>Choose a group to move this resume to, or remove it from any group.</Trans>
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-1">
				<Button
					variant="ghost"
					disabled={isPending}
					className={cn("w-full justify-start", data.currentGroupId === null && "bg-accent")}
					onClick={() => {
						handleSelect(null);
					}}
				>
					<Trans>Ungrouped</Trans>
					{data.currentGroupId === null && (
						<span className="ms-auto text-xs opacity-60">
							<Trans>Current</Trans>
						</span>
					)}
				</Button>

				<div className="max-h-72 space-y-1 overflow-y-auto">
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
						<Button
							key={group.id}
							variant="ghost"
							disabled={isPending}
							className={cn("w-full justify-start", data.currentGroupId === group.id && "bg-accent")}
							onClick={() => {
								handleSelect(group.id);
							}}
						>
							<span className="truncate">{group.name}</span>
							<span className="ms-auto text-xs opacity-60">
								{data.currentGroupId === group.id ? <Trans>Current</Trans> : group.resumeCount}
							</span>
						</Button>
					))}
				</div>

				<Button
					variant="outline"
					className="mt-2 w-full justify-start"
					onClick={() => {
						openDialog("resume.groups.create", undefined);
					}}
				>
					<PlusIcon />
					<Trans>Create a new group</Trans>
				</Button>
			</div>

			<DialogFooter>
				<Button variant="outline" disabled={isPending} onClick={closeDialog}>
					<Trans>Cancel</Trans>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
