import { cn } from "@/lib/utils";

const WIDTHS = {
  /** Settings and other short forms. */
  narrow: "max-w-2xl",
  /** Create / edit forms. */
  form: "max-w-5xl",
  /** Detail pages. */
  detail: "max-w-6xl",
  /** Lists and dashboards. */
  wide: "max-w-[1600px]",
} as const;

type PageContainerProps = React.ComponentProps<"div"> & {
  width?: keyof typeof WIDTHS;
};

/**
 * Standard page wrapper. The dashboard layout already provides the outer
 * padding, so pages must not add their own.
 */
export function PageContainer({
  width = "wide",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full space-y-6", WIDTHS[width], className)}
      {...props}
    />
  );
}
