interface CompanyAgreementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyAgreementPage({
  params,
}: CompanyAgreementPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Agreement</h1>
        <p className="text-sm text-muted-foreground">
          Agreement view for company ID: {id}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          This page is ready for deployment and can be expanded with the full
          agreement UI next.
        </p>
      </div>
    </div>
  );
}
