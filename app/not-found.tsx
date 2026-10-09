import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Button asChild>
            <Link href="/dashboard">Go to Lahan PMS</Link>
          </Button>
        }
      />
    </div>
  );
}
