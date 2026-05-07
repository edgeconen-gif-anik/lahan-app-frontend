import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report/report.service";

export const useReportData = (fiscalYear?: string) => {
  return useQuery({
    queryKey: ["reports", fiscalYear ?? "all"],
    queryFn: () => reportService.getData({ fiscalYear }),
  });
};
