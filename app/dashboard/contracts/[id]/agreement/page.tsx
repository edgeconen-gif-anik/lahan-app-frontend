"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useContract } from "@/hooks/contract/useContracts";
import { toFormalNepaliDate } from "@/lib/date-utils";

export default function AgreementPage() {
  const params = useParams();
  const { data: contract } = useContract(params.id as string);

  if (!contract) return <div>Loading...</div>;

  const contractor =
    contract.company?.name || contract.userCommittee?.name;

  return (
    <div className="flex justify-center p-10 bg-gray-100 min-h-screen">

      <div className="relative w-[794px] h-[1123px] bg-white shadow-lg">

        {/* Background letter */}
        <Image
          src="/letter.png"
          alt="Letter"
          fill
          className="object-contain pointer-events-none"
        />

        {/* AGREEMENT TEXT */}

        <div className="absolute top-[220px] left-[120px] text-[15px] w-[560px] leading-7">

          <p>
            Agreement No: <strong>{contract.contractNumber}</strong>
          </p>

          <p>
            This agreement is made between the Municipality and{" "}
            <strong>{contractor}</strong>.
          </p>

          <p>
            Project: <strong>{contract.project?.name ?? "N/A"}</strong>
          </p>

          <p>
            Agreement Amount:{" "}
            <strong>रु {Number(contract.agreement?.amount).toLocaleString()}</strong>
          </p>

          <p>
            Agreement Date:{" "}
            <strong>{toFormalNepaliDate(contract.agreement?.agreementDate)}</strong>
          </p>

          <p>
            Description: {contract.agreement?.content}
          </p>

        </div>

      </div>
    </div>
  );
}
