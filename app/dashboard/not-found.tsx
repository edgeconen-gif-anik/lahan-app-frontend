import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      action={
        <Button asChild>
          <Link href="/dashboard">Go to overview</Link>
        </Button>
      }
      className="py-24"
    />
  );
}
