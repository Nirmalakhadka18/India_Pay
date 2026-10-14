"use client";

import { RoleGuard } from "@/components/role-guard";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CompliancePage() {
  return (
    <RoleGuard allowedRoles={["owner", "admin"]}>
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
  const [epsEnabled, setEpsEnabled] = useState(true);
  const [edliEnabled, setEdliEnabled] = useState(true);
  const [adminChargesEnabled, setAdminChargesEnabled] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [esiWageCeiling, setEsiWageCeiling] = useState(21000);
  const [ptEnabled, setPtEnabled] = useState(false);
  const [ptState, setPtState] = useState("Karnataka");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (compliance) {
      setEpfEnabled(compliance.epfEnabled);
      setEpfWageCeiling(compliance.epfWageCeiling ?? 15000);
      setEpfRestrictToCeiling(compliance.epfRestrictToCeiling ?? true);
      setEpsEnabled(compliance.epsEnabled ?? true);
      setEdliEnabled(compliance.edliEnabled ?? true);
      setAdminChargesEnabled(compliance.adminChargesEnabled ?? true);
      setEsiEnabled(compliance.esiEnabled);
      setEsiWageCeiling(compliance.esiWageCeiling ?? 21000);
      setPtEnabled(compliance.ptEnabled);
      setPtState(compliance.ptState || "Karnataka");
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
        epsEnabled,
        edliEnabled,
        adminChargesEnabled,
        esiEnabled,
        esiWageCeiling: Number(esiWageCeiling) || 21000,
        ptEnabled,
        ptState,
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
                <option value="Maharashtra" disabled>
                  Maharashtra (Coming Soon)
                </option>
                <option value="Telangana" disabled>
                  Telangana (Coming Soon)
                </option>
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                Karnataka slabs: ₹0 up to ₹24,999. ₹200 for ₹25,000+ (₹300 in
                February).
              </p>
            </div>
          )}
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        {/* TDS Section */}
        <div>
          <h3 className="text-lg font-medium">Tax Deducted at Source (TDS)</h3>
          <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold block mb-1">
              Manual Monthly Override Mode Only:
            </span>
            <p className="mb-2">
              IndiaPay does not have an automated income tax regime engine
              (Section 115BAC / Chapter VI-A slabs). TDS deductions must be
              entered as a manual monthly amount per employee or via payroll
              line adjustments.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Note: Employee tax regime selection ("Old" vs "New") is stored as
              an informational tag and does not automatically calculate
              progressive tax brackets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
