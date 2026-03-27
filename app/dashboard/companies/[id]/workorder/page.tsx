interface CompanyWorkOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyWorkOrderPage({
  params,
}: CompanyWorkOrderPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Work Order</h1>
        <p className="text-sm text-muted-foreground">
          Work order view for company ID: {id}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          This page is ready for deployment and can be expanded with the full
          work order UI next.
        </p>
      </div>
    </div>
  );
}
