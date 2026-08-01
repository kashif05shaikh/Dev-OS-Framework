import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type NameDialogState = {
  title: string;
  label?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void | Promise<void>;
} | null;

export function NameDialog({
  state,
  onOpenChange,
}: {
  state: NameDialogState;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(state?.initialValue ?? "");
  }, [state]);

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = value.trim();
            if (!trimmed) return;
            void state?.onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{state?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="name-dialog-input">{state?.label ?? "Name"}</Label>
            <Input
              id="name-dialog-input"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              {state?.submitLabel ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}