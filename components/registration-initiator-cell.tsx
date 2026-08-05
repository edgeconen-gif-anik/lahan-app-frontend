import type { RegistrationInitiator } from "@/lib/schema/registration-initiator";

type RegistrationInitiatorCellProps = {
  initiator?: RegistrationInitiator | null;
};

export function RegistrationInitiatorCell({
  initiator,
}: RegistrationInitiatorCellProps) {
  if (!initiator?.name && !initiator?.email) {
    return <span className="text-sm text-muted-foreground">Not recorded</span>;
  }

  return (
    <div className="flex flex-col text-sm">
      <span className="font-medium">{initiator.name || initiator.email}</span>
      {initiator.name && initiator.email ? (
        <span className="text-xs text-muted-foreground">{initiator.email}</span>
      ) : null}
    </div>
  );
}
