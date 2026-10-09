"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  /** Shows a text box (e.g. rejection reason); its value is passed to onConfirm. */
  reason?: {
    label: string;
    defaultValue?: string;
    required?: boolean;
  };
  onConfirm: (reason?: string) => void;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  // Remount the body each time the dialog opens so the reason box resets.
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? <ConfirmDialogBody {...props} /> : null}
    </AlertDialog>
  );
}

function ConfirmDialogBody({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [reasonText, setReasonText] = useState(reason?.defaultValue ?? "");
  const needsReason = Boolean(reason?.required) && !reasonText.trim();

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          {destructive ? (
            <TriangleAlert className="h-5 w-5 text-destructive" />
          ) : null}
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div>{description}</div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      {reason ? (
        <div className="space-y-2">
          <Label htmlFor="confirm-dialog-reason">{reason.label}</Label>
          <Textarea
            id="confirm-dialog-reason"
            value={reasonText}
            onChange={(event) => setReasonText(event.target.value)}
            rows={3}
          />
        </div>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
        {/* Plain Button, not AlertDialogAction, so the dialog stays open while
            the request is running; the caller closes it on success. */}
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          disabled={isPending || needsReason}
          onClick={() => onConfirm(reason ? reasonText.trim() : undefined)}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
