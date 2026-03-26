"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useContract } from "@/hooks/contract/useContracts";
import { toFormalNepaliDate } from "@/lib/date-utils";

export default function WorkOrderPage() {
  const params = useParams();
  const { data: contract } = useContract(params.id as string);

  if (!contract) return <div>Loading...</div>;

  const contractor =
    contract.company?.name || contract.userCommittee?.name;

  return (
    <div className="flex justify-center p-10 bg-gray-100 min-h-screen">

      <div className="relative w-[794px] h-[1123px] bg-white shadow-lg">

        {/* Letter background */}
        <Image
          src="/letter.png"
          alt="Letter"
          fill
          className="object-contain pointer-events-none"
        />

        {/* CONTENT OVERLAY */}

        <div className="absolute top-[220px] left-[120px] text-[15px] w-[560px] leading-7">

          <p>
            Contract No: <strong>{contract.contractNumber}</strong>
          </p>

          <p>
            Project: <strong>{contract.project?.name || contract.projectId}</strong>
          </p>

          <p>
            Contractor: <strong>{contractor}</strong>
          </p>

          <p>
            Amount: <strong>रु {Number(contract.contractAmount).toLocaleString()}</strong>
          </p>

          <p>
            Start Date: <strong>{toFormalNepaliDate(contract.startDate)}</strong>
          </p>

          <p>
            Completion Date:{" "}
            <strong>{toFormalNepaliDate(contract.workOrder?.workCompletionDate)}</strong>
          </p>

        </div>

        {/* SIGNATURES */}

        <div className="absolute bottom-[200px] left-[120px]">
          Office Signatory
        </div>

        <div className="absolute bottom-[200px] right-[120px]">
          Contractor Signatory
        </div>

      </div>
    </div>
  );
}