"use client";

import { EpfoEcrDialog } from "@/components/epfo-ecr-dialog";
import { Form138TdsDialog } from "@/components/form-138-tds-dialog";
import { RoleGuard } from "@/components/role-guard";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CompliancePage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ComplianceContent />
    </RoleGuard>
  );
}

function ComplianceContent() {
  const { current: workspaceId } = useWorkspace();

  const compliance = useQuery(
    api.compliance.getWorkspaceCompliance,
    workspaceId ? { workspaceId } : "skip",
  );
  const updateCompliance = useMutation(
    api.compliance.updateWorkspaceCompliance,
  );

  const [epfEnabled, setEpfEnabled] = useState(false);
  const [epfWageCeiling, setEpfWageCeiling] = useState(15000);
  const [epfRestrictToCeiling, setEpfRestrictToCeiling] = useState(true);
  const [epfEstablishmentCode, setEpfEstablishmentCode] = useState("");
  const [epsEnabled, setEpsEnabled] = useState(true);
  const [edliEnabled, setEdliEnabled] = useState(true);
  const [adminChargesEnabled, setAdminChargesEnabled] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [esiWageCeiling, setEsiWageCeiling] = useState(21000);
  const [ptEnabled, setPtEnabled] = useState(false);
  const [ptState, setPtState] = useState("Karnataka");
  const [lwfEnabled, setLwfEnabled] = useState(false);
  const [lwfState, setLwfState] = useState("Karnataka");
  const [tan, setTan] = useState("");
  const [employerPan, setEmployerPan] = useState("");
  const [deductorType, setDeductorType] = useState<
    "company" | "individual" | "firm" | "government" | "other"
  >("company");
  const [responsiblePersonName, setResponsiblePersonName] = useState("");
  const [responsiblePersonPan, setResponsiblePersonPan] = useState("");
  const [responsiblePersonDesignation, setResponsiblePersonDesignation] =
    useState("");
  const [responsiblePersonEmail, setResponsiblePersonEmail] = useState("");
  const [responsiblePersonMobile, setResponsiblePersonMobile] = useState("");
  const [responsiblePersonAddress, setResponsiblePersonAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEcrOpen, setIsEcrOpen] = useState(false);
  const [isTdsOpen, setIsTdsOpen] = useState(false);

  useEffect(() => {
    if (compliance) {
      setEpfEnabled(compliance.epfEnabled);
      setEpfWageCeiling(compliance.epfWageCeiling ?? 15000);
      setEpfRestrictToCeiling(compliance.epfRestrictToCeiling ?? true);
      setEpfEstablishmentCode(compliance.epfEstablishmentCode ?? "");
      setEpsEnabled(compliance.epsEnabled ?? true);
      setEdliEnabled(compliance.edliEnabled ?? true);
      setAdminChargesEnabled(compliance.adminChargesEnabled ?? true);
      setEsiEnabled(compliance.esiEnabled);
      setEsiWageCeiling(compliance.esiWageCeiling ?? 21000);
      setPtEnabled(compliance.ptEnabled);
      setPtState(compliance.ptState || "Karnataka");
      setLwfEnabled(compliance.lwfEnabled ?? false);
      setLwfState(compliance.lwfState || compliance.ptState || "Karnataka");
      setTan(compliance.tan ?? "");
      setEmployerPan(compliance.employerPan ?? "");
      setDeductorType(
        (compliance.deductorType as
          | "company"
          | "individual"
          | "firm"
          | "government"
          | "other") ?? "company",
      );
      setResponsiblePersonName(compliance.responsiblePersonName ?? "");
      setResponsiblePersonPan(compliance.responsiblePersonPan ?? "");
      setResponsiblePersonDesignation(
        compliance.responsiblePersonDesignation ?? "",
      );
      setResponsiblePersonEmail(compliance.responsiblePersonEmail ?? "");
      setResponsiblePersonMobile(compliance.responsiblePersonMobile ?? "");
      setResponsiblePersonAddress(compliance.responsiblePersonAddress ?? "");
    }
  }, [compliance]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!workspaceId) return;
      await updateCompliance({
        workspaceId,
        epfEnabled,
        epfWageCeiling: Number(epfWageCeiling) || 15000,
        epfRestrictToCeiling,
        epfEstablishmentCode: epfEstablishmentCode.trim() || undefined,
        epsEnabled,
        edliEnabled,
        adminChargesEnabled,
        esiEnabled,
        esiWageCeiling: Number(esiWageCeiling) || 21000,
        ptEnabled,
        ptState,
        lwfEnabled,
        lwfState,
        tan: tan.trim().toUpperCase() || undefined,
        employerPan: employerPan.trim().toUpperCase() || undefined,
        deductorType,
        responsiblePersonName: responsiblePersonName.trim() || undefined,
        responsiblePersonPan:
          responsiblePersonPan.trim().toUpperCase() || undefined,
        responsiblePersonDesignation:
          responsiblePersonDesignation.trim() || undefined,
        responsiblePersonEmail: responsiblePersonEmail.trim() || undefined,
        responsiblePersonMobile: responsiblePersonMobile.trim() || undefined,
        responsiblePersonAddress: responsiblePersonAddress.trim() || undefined,
      });
      toast.success("Compliance settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!compliance) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Loading compliance settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full bg-secondary/20 overflow-auto dark:bg-black">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Statutory Compliance
          </h1>
          <p className="text-sm text-primary/60">
            Configure EPF, ESI, Professional Tax, and TDS parameters
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
        {/* EPF Section */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                Employees' Provident Fund (EPF & EPS)
              </h3>
              <p className="text-sm text-zinc-500">
                Statutory deductions under Employees' Provident Funds and
                Miscellaneous Provisions Act, 1952.
              </p>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={epfEnabled}
                onChange={(e) => setEpfEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-sm">
                Enable EPF for workspace
              </span>
            </label>
          </div>

          {epfEnabled && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    Statutory Wage Ceiling (₹ / month)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={epfWageCeiling}
                    onChange={(e) => setEpfWageCeiling(Number(e.target.value))}
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Official EPFO statutory ceiling is ₹15,000/month.
                  </p>
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Wage Ceiling Restriction
                  </label>
                  <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={epfRestrictToCeiling}
                      onChange={(e) =>
                        setEpfRestrictToCeiling(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>
                      Cap eligible wage at ceiling (uncheck for voluntary PF on
                      full basic)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="font-medium block mb-2">
                  Employer Contribution Component Breakdown:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={epsEnabled}
                      onChange={(e) => setEpsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>EPS Pension (8.33%, capped at ₹1,250/mo)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={edliEnabled}
                      onChange={(e) => setEdliEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>EDLI Insurance (0.5%, max ₹75/mo)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adminChargesEnabled}
                      onChange={(e) => setAdminChargesEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>EPFO Admin Charges (0.5%)</span>
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  * Employee pays 12% of eligible wage. Employer pays 3.67% to
                  EPF + 8.33% to EPS + EDLI & Admin fees.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="max-w-md">
                  <label className="block font-medium mb-1">
                    EPFO Establishment Code / ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MHBAN0012345000"
                    value={epfEstablishmentCode}
                    onChange={(e) =>
                      setEpfEstablishmentCode(e.target.value.toUpperCase())
                    }
                    className="w-full p-2 font-mono text-sm border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 uppercase"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Official 15 or 22 character alphanumeric code issued by
                    EPFO. Used in ECR text file naming and monthly challan
                    identification.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-md border border-blue-200 dark:border-blue-900">
                  <div>
                    <h4 className="font-semibold text-sm text-blue-950 dark:text-blue-200">
                      EPFO Electronic Challan Cum Return (ECR) Export
                    </h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1">
                      Generate official #~# delimited EPFO ECR text file
                      (Version 2.0) with automated UAN validation, wage ceiling
                      capping, and 5-Account Challan reconciliation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEcrOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-sm transition-colors shrink-0"
                  >
                    Open EPFO ECR Export &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* ESI Section */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                Employees' State Insurance (ESI)
              </h3>
              <p className="text-sm text-zinc-500">
                Statutory health insurance under the Employees' State Insurance
                Act, 1948.
              </p>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={esiEnabled}
                onChange={(e) => setEsiEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-sm">
                Enable ESI for workspace
              </span>
            </label>
          </div>

          {esiEnabled && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm">
              <div className="max-w-xs">
                <label className="block font-medium mb-1">
                  ESI Wage Ceiling (₹ / month)
                </label>
                <input
                  type="number"
                  min="0"
                  value={esiWageCeiling}
                  onChange={(e) => setEsiWageCeiling(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Statutory ceiling: ₹21,000/month gross. Employee pays 0.75%,
                Employer pays 3.25%.
              </p>
            </div>
          )}
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* PT Section */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Professional Tax (PT)</h3>
              <p className="text-sm text-zinc-500">
                State-level professional tax deduction schedule.
              </p>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ptEnabled}
                onChange={(e) => setPtEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-sm">
                Enable Professional Tax
              </span>
            </label>
          </div>

          {ptEnabled && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm">
              <label className="block font-medium mb-1">Applicable State</label>
              <select
                value={ptState}
                onChange={(e) => setPtState(e.target.value)}
                className="w-full max-w-xs p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
              >
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Telangana">Telangana / Andhra Pradesh</option>
                <option value="Delhi">Delhi (Nil-PT)</option>
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                {ptState === "Karnataka"
                  ? "Karnataka slabs: ₹0 up to ₹24,999. ₹200 for ₹25,000+ (₹300 in February)."
                  : ptState === "Maharashtra"
                    ? "Maharashtra slabs: Male gross > ₹10,000: ₹200 (₹300 Feb). Females up to ₹25,000 are exempt."
                    : ptState === "Telangana"
                      ? "Telangana slabs: Gross > ₹20,000 is ₹200/month."
                      : "State-specific PT schedule applied automatically."}
              </p>
            </div>
          )}
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* LWF Section */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Labour Welfare Fund (LWF)</h3>
              <p className="text-sm text-zinc-500">
                State-level statutory Labour Welfare Fund contributions.
              </p>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={lwfEnabled}
                onChange={(e) => setLwfEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-sm">
                Enable Labour Welfare Fund
              </span>
            </label>
          </div>

          {lwfEnabled && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm">
              <label className="block font-medium mb-1">Applicable State</label>
              <select
                value={lwfState}
                onChange={(e) => setLwfState(e.target.value)}
                className="w-full max-w-xs p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
              >
                <option value="Karnataka">
                  Karnataka (Annual in Dec: Emp ₹20, Employer ₹40)
                </option>
                <option value="Maharashtra">
                  Maharashtra (Bi-annual in Jun & Dec: Emp ₹12, Employer ₹36)
                </option>
                <option value="Gujarat">
                  Gujarat (Bi-annual in Jun & Dec)
                </option>
                <option value="Telangana">
                  Telangana / AP (Annual in Dec)
                </option>
                <option value="Delhi">Delhi (Exempt / Nil)</option>
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                {lwfState === "Karnataka"
                  ? "Karnataka: Annual deduction in December. Employee pays ₹20, Employer pays ₹40 (Total ₹60). Remittance due by 15th January."
                  : lwfState === "Maharashtra"
                    ? "Maharashtra: Bi-annual deduction in June and December. Gross > ₹3,000: Employee pays ₹12, Employer pays ₹36 (1:3 ratio). Remittance due by 15th July & 15th January."
                    : lwfState === "Gujarat"
                      ? "Gujarat: Bi-annual deduction in June and December."
                      : lwfState === "Delhi"
                        ? "Delhi: No statutory Labour Welfare Fund contribution levied."
                        : "State-specific schedule applied automatically."}
              </p>
            </div>
          )}
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* TDS Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">
                Tax Deducted at Source (TDS) & Quarterly Filings
              </h3>
              <p className="text-sm text-zinc-500">
                Form 138 (Income-tax Act, 2025 for FY 2026–27+) / Form 24Q
                (Income-tax Act, 1961 for FY 2025–26 & earlier).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTdsOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-2 self-start sm:self-auto"
            >
              Quarterly TDS Module (Form 138 / 24Q)
            </button>
          </div>

          <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700 space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">
                  Tax Deduction Account Number (TAN) *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. BLRR01234D"
                  value={tan}
                  onChange={(e) => setTan(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  10-character alphanumeric TAN issued by Income Tax Dept.
                </p>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Employer / Deductor PAN *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={employerPan}
                  onChange={(e) => setEmployerPan(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Permanent Account Number of the employing entity.
                </p>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Deductor Category
                </label>
                <select
                  value={deductorType}
                  onChange={(e) =>
                    setDeductorType(
                      e.target.value as
                        | "company"
                        | "individual"
                        | "firm"
                        | "government"
                        | "other",
                    )
                  }
                  className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <option value="company">Company (Private / Public)</option>
                  <option value="firm">Partnership / LLP / Firm</option>
                  <option value="individual">
                    Individual / Proprietorship
                  </option>
                  <option value="government">
                    Government / Statutory Body
                  </option>
                  <option value="other">Other Deductor</option>
                </select>
                <p className="text-xs text-zinc-500 mt-1">
                  Entity classification for quarterly batch header record.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <span className="font-semibold block mb-2 text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Person Responsible for Deduction (Authorized Signatory)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Signatory Name"
                    value={responsiblePersonName}
                    onChange={(e) => setResponsiblePersonName(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">PAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={responsiblePersonPan}
                    onChange={(e) =>
                      setResponsiblePersonPan(e.target.value.toUpperCase())
                    }
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Director / Finance Head"
                    value={responsiblePersonDesignation}
                    onChange={(e) =>
                      setResponsiblePersonDesignation(e.target.value)
                    }
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="signatory@company.com"
                    value={responsiblePersonEmail}
                    onChange={(e) => setResponsiblePersonEmail(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Mobile</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={responsiblePersonMobile}
                    onChange={(e) => setResponsiblePersonMobile(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Official Address
                  </label>
                  <input
                    type="text"
                    placeholder="Registered Office address"
                    value={responsiblePersonAddress}
                    onChange={(e) =>
                      setResponsiblePersonAddress(e.target.value)
                    }
                    className="w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EpfoEcrDialog open={isEcrOpen} onOpenChange={setIsEcrOpen} />
      <Form138TdsDialog open={isTdsOpen} onOpenChange={setIsTdsOpen} />
    </div>
  );
}
