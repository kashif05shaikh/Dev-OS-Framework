import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
} | null;

export function ConfirmDialog({
  state,
  onOpenChange,
}: {
  state: ConfirmState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={state !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>{state?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              void state?.onConfirm();
            }}
          >
            {state?.confirmLabel ?? "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}