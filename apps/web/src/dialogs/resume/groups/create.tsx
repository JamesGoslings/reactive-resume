import type { DialogProps } from "../../store";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { FoldersIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@reactive-resume/ui/components/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@reactive-resume/ui/components/dialog";
import { FormControl, FormItem, FormLabel, FormMessage } from "@reactive-resume/ui/components/form";
import { Input } from "@reactive-resume/ui/components/input";
import { useFormBlocker } from "@/hooks/use-form-blocker";
import { getResumeErrorMessage } from "@/libs/error-message";
import { orpc } from "@/libs/orpc/client";
import { useAppForm } from "@/libs/tanstack-form";
import { useDialogStore } from "../../store";

const formSchema = z.object({
	name: z.string().min(1).max(64),
});

export function CreateGroupDialog(_: DialogProps<"resume.groups.create">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);

	const { mutate: createGroup, isPending } = useMutation(orpc.resumeGroup.create.mutationOptions());

	const form = useAppForm({
		defaultValues: { name: "" },
		validators: { onSubmit: formSchema },
		onSubmit: ({ value }) => {
			const toastId = toast.loading(t`Creating group...`);

			createGroup(value, {
				onSuccess: () => {
					toast.success(t`Group has been created successfully.`, { id: toastId });
					closeDialog();
				},
				onError: (error) => {
					toast.error(getResumeErrorMessage(error), { id: toastId });
				},
			});
		},
	});

	useFormBlocker(form);

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-x-2">
					<FoldersIcon />
					<Trans>Create a new group</Trans>
				</DialogTitle>
				<DialogDescription>
					<Trans>Groups help you organise resume versions for different jobs, audiences, or campaigns.</Trans>
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="name">
					{(field) => (
						<FormItem hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
							<FormLabel>
								<Trans>Name</Trans>
							</FormLabel>
							<FormControl
								render={
									<Input
										min={1}
										max={64}
										autoFocus
										name={field.name}
										value={field.state.value}
										placeholder={t`e.g. Software Engineer 2026`}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								}
							/>
							<FormMessage errors={field.state.meta.errors} />
						</FormItem>
					)}
				</form.Field>

				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						<Trans>Create</Trans>
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
