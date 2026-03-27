// app/dashboard/contracts/committee/new/page.tsx
"use client";

import React, { useState } from "react";
import { useCreateContract } from "@/hooks/contract/useContracts"; 
import { useProjects } from "@/hooks/project/useProjects"; 
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { ChevronLeft, Calculator } from "lucide-react";
import Link from "next/link";

export default function CommitteeContractPage() {
  const createContract = useCreateContract(); 

  const [formData, setFormData] = useState({
    projectId: "",
    userCommitteeId: "", 
    contractNumber: "",
    totalEstimatedCost: 0,
    officeGrant: 0,
    communityContribution: 0, // जनसहभागिता
    beneficiaryHouseholds: 0,
    beneficiaryPopulation: 0,
    startDate: "",
    endDate: "",
  });

  const { data: projectsData } = useProjects({ limit: 50 });
  const { data: committeesData } = useUserCommittees({ limit: 50 }); 
  
  const projectsList = Array.isArray(projectsData) ? projectsData : projectsData?.data || [];
  const committeesList = Array.isArray(committeesData) ? committeesData : committeesData?.data || [];

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateContribution = () => {
    const total = Number(formData.totalEstimatedCost);
    if(total > 0) {
      const communityShare = total * 0.10; // Mandatory 10%
      setFormData({
        ...formData,
        communityContribution: communityShare,
        officeGrant: total - communityShare
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const {
      endDate,
      totalEstimatedCost,
      communityContribution,
      beneficiaryHouseholds,
      beneficiaryPopulation,
      ...contractData
    } = formData;

    createContract.mutate({
      ...contractData,
      companyId: undefined, // Ensure company is omitted for committee contracts
      contractAmount: Number(formData.officeGrant), // The actual contract payout
      intendedCompletionDate: endDate,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/contracts" className="p-2 border rounded-md hover:bg-muted">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Committee Agreement (योजना सम्झौता फाराम)</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
        
        {/* Relations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/10 rounded-lg border">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Project</label>
            <select name="projectId" required className="w-full p-2 border rounded-md bg-background" onChange={handleChange}>
              <option value="">-- Choose Project --</option>
              {projectsList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Select User Committee</label>
            <select name="userCommitteeId" required className="w-full p-2 border rounded-md bg-background" onChange={handleChange}>
              <option value="">-- Choose Committee --</option>
              {committeesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Financials (अनुसूची २ Section 2) */}
        <h3 className="text-lg font-bold border-b pb-2">Cost Details (लागत सम्वन्धि विवरण)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-4 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Estimate (रू)</label>
            <input name="totalEstimatedCost" type="number" required className="w-full p-2 border rounded-md" onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Office Grant (रू)</label>
            <input name="officeGrant" type="number" value={formData.officeGrant} readOnly className="w-full p-2 border rounded-md bg-muted" />
          </div>
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-green-700">Community Contribution (min 10%)</label>
            <div className="flex gap-2">
              <input name="communityContribution" type="number" value={formData.communityContribution} readOnly className="w-full p-2 border border-green-300 rounded-md bg-green-50" />
              <button type="button" onClick={calculateContribution} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700" title="Auto Calculate 10%">
                <Calculator size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Beneficiaries & Dates (अनुसूची २ Sections 1 & 2) */}
        <h3 className="text-lg font-bold border-b pb-2">Project Logistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Beneficiary HHs</label>
            <input name="beneficiaryHouseholds" type="number" className="w-full p-2 border rounded-md" onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Beneficiary Population</label>
            <input name="beneficiaryPopulation" type="number" className="w-full p-2 border rounded-md" onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <input name="startDate" type="date" required className="w-full p-2 border rounded-md" onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <input name="endDate" type="date" required className="w-full p-2 border rounded-md" onChange={handleChange} />
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end gap-3">
          <Link href="/dashboard/contracts" className="px-4 py-2 border rounded-md hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createContract.isPending} className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
            Create Agreement
          </button>
        </div>
      </form>
    </div>
  );
}
