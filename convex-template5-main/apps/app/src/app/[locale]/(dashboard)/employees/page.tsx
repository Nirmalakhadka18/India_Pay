"use client";

import { RoleGuard } from "@/components/role-guard";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Doc, Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@v1/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { Input } from "@v1/ui/input";
import { useMutation, useQuery } from "convex/react";
import {
  Ban,
  Building2,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  IndianRupee,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function EmployeesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <EmployeesContent />
    </RoleGuard>
  );
}

function EmployeesContent() {
  const router = useRouter();
  const { current } = useWorkspace();
  const workspaceId = current;
  const employees = useQuery(
    api.employees.list,
    workspaceId ? { workspaceId } : "skip",
  );

  const addEmployee = useMutation(api.employees.add);
  const updateEmployee = useMutation(api.employees.update);
  const removeEmployee = useMutation(api.employees.remove);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"employees"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Doc<"employees"> | null>(null);
  const [search, setSearch] = useState("");

  // Form State: General
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  // Form State: Banking
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // Form State: Statutory
  const [pan, setPan] = useState("");
  const [uan, setUan] = useState("");
  const [esicIpNumber, setEsicIpNumber] = useState("");
  const [pfMemberId, setPfMemberId] = useState("");
  const [isPfMember, setIsPfMember] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mask reveal toggles per employee row
  const [revealedSensitives, setRevealedSensitives] = useState<
    Record<string, boolean>
  >({});
  const toggleReveal = (empId: string) => {
    setRevealedSensitives((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setDesignation("");
    setBankAccountHolderName("");
    setBankName("");
    setBankAccountNumber("");
    setIfscCode("");
    setPan("");
    setUan("");
    setEsicIpNumber("");
    setPfMemberId("");
    setIsPfMember(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setIsSubmitting(true);
    try {
      const newEmpId = await addEmployee({
        workspaceId,
        firstName,
        lastName,
        email,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        bankAccountHolderName: bankAccountHolderName.trim() || undefined,
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        pan: pan.trim() || undefined,
        uan: isPfMember ? (uan.trim() || undefined) : undefined,
        esicIpNumber: esicIpNumber.trim() || undefined,
        pfMemberId: isPfMember ? (pfMemberId.trim() || undefined) : undefined,
        isPfMember,
      });
      toast.success("Employee added successfully. Opening Salary Setup...");
      setIsOpen(false);
      resetForm();
      router.push(`/salaries?employeeId=${newEmpId}`);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!workspaceId || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeEmployee({ workspaceId, employeeId: deleteTarget._id });
      toast.success(`Removed ${deleteTarget.firstName} ${deleteTarget.lastName}`);
      setDeleteTarget(null);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to remove employee");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditOpen = (emp: Doc<"employees">) => {
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone || "");
    setDepartment(emp.department || "");
    setDesignation(emp.designation || "");
    setBankAccountHolderName(emp.bankAccountHolderName || "");
    setBankName(emp.bankName || "");
    setBankAccountNumber(emp.bankAccountNumber || "");
    setIfscCode(emp.ifscCode || "");
    setPan(emp.pan || "");
    setUan(emp.uan || "");
    setEsicIpNumber(emp.esicIpNumber || "");
    setPfMemberId(emp.pfMemberId || "");
    setIsPfMember(emp.isPfMember !== false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !editingEmployee) return;

    setIsSubmitting(true);
    try {
      await updateEmployee({
        workspaceId,
        employeeId: editingEmployee._id,
        firstName,
        lastName,
        email,
        phone: phone.trim(),
        department: department.trim(),
        designation: designation.trim(),
        bankAccountHolderName: bankAccountHolderName.trim(),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim(),
        pan: pan.trim(),
        uan: isPfMember ? (uan.trim() || undefined) : undefined,
        esicIpNumber: esicIpNumber.trim(),
        pfMemberId: isPfMember ? (pfMemberId.trim() || undefined) : undefined,
        isPfMember,
      });
      toast.success("Employee master records updated successfully");
      setIsEditOpen(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingEmployee(null);
      resetForm();
    }
  };

  const filtered = employees?.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.pan || ""} ${e.bankName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">
              Employee Directory & Master Records
            </h1>
            <p className="text-sm text-primary/60">
              Manage employee profiles, Indian banking details, and statutory
              identifications (PAN, UAN, ESIC, PF).
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleAddDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-6">
                {/* Section 1: General Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Basic Identity
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        First Name *
                      </label>
                      <Input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Arun"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Last Name *</label>
                      <Input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Kumar"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Email *</label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arun.kumar@company.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Phone</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Department</label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Designation</label>
                      <Input
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Indian Banking Details */}
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Indian Banking
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Account Holder Name
                      </label>
                      <Input
                        value={bankAccountHolderName}
                        onChange={(e) =>
                          setBankAccountHolderName(e.target.value)
                        }
                        placeholder="As on bank passbook"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Name</label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank, ICICI Bank"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Account Number
                      </label>
                      <Input
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="9 to 18 digits"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">IFSC Code</label>
                      <Input
                        value={ifscCode}
                        onChange={(e) =>
                          setIfscCode(e.target.value.toUpperCase())
                        }
                        placeholder="11 characters (e.g. HDFC0001234)"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Statutory Identification */}
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Statutory
                    Identifications
                  </h3>

                  {/* PF Member Yes / No Selection */}
                  <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold">
                        PF Member (Provident Fund) *
                      </label>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {isPfMember ? "Enrolled in EPF (12%)" : "Excluded from EPF (PT only)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="radio"
                          name="addPfMember"
                          checked={isPfMember === true}
                          onChange={() => setIsPfMember(true)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>Yes (Include in EPF)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="radio"
                          name="addPfMember"
                          checked={isPfMember === false}
                          onChange={() => setIsPfMember(false)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>No (Exclude from EPF)</span>
                      </label>
                    </div>
                    {!isPfMember && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Employee will be excluded from Provident Fund deductions. Professional Tax (PT) will continue to apply per state rules.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Permanent Account Number (PAN)
                      </label>
                      <Input
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="10 alphanumeric (e.g. ABCDE1234F)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Universal Account Number (UAN)
                      </label>
                      <Input
                        value={uan}
                        onChange={(e) => setUan(e.target.value)}
                        placeholder="12 numeric digits"
                        disabled={!isPfMember}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        ESIC IP Number
                      </label>
                      <Input
                        value={esicIpNumber}
                        onChange={(e) => setEsicIpNumber(e.target.value)}
                        placeholder="10 or 17 numeric digits"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        PF Member ID
                      </label>
                      <Input
                        value={pfMemberId}
                        onChange={(e) =>
                          setPfMemberId(e.target.value.toUpperCase())
                        }
                        placeholder="e.g. KNBLR00123450000001234"
                        disabled={!isPfMember}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Employee"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee Master Records</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Basic Identity
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        First Name *
                      </label>
                      <Input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Last Name *</label>
                      <Input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Email *</label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Phone</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Department</label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Designation</label>
                      <Input
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Indian Banking
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Account Holder Name
                      </label>
                      <Input
                        value={bankAccountHolderName}
                        onChange={(e) =>
                          setBankAccountHolderName(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bank Name</label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        Account Number
                      </label>
                      <Input
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">IFSC Code</label>
                      <Input
                        value={ifscCode}
                        onChange={(e) =>
                          setIfscCode(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Statutory
                    Identifications
                  </h3>

                  {/* PF Member Yes / No Selection */}
                  <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold">
                        PF Member (Provident Fund) *
                      </label>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {isPfMember ? "Enrolled in EPF (12%)" : "Excluded from EPF (PT only)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="radio"
                          name="editPfMember"
                          checked={isPfMember === true}
                          onChange={() => setIsPfMember(true)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>Yes (Include in EPF)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="radio"
                          name="editPfMember"
                          checked={isPfMember === false}
                          onChange={() => setIsPfMember(false)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>No (Exclude from EPF)</span>
                      </label>
                    </div>
                    {!isPfMember && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Employee will be excluded from Provident Fund deductions. Professional Tax (PT) will continue to apply per state rules.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">PAN</label>
                      <Input
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">UAN</label>
                      <Input
                        value={uan}
                        onChange={(e) => setUan(e.target.value)}
                        disabled={!isPfMember}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        ESIC IP Number
                      </label>
                      <Input
                        value={esicIpNumber}
                        onChange={(e) => setEsicIpNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">
                        PF Member ID
                      </label>
                      <Input
                        value={pfMemberId}
                        onChange={(e) =>
                          setPfMemberId(e.target.value.toUpperCase())
                        }
                        disabled={!isPfMember}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update Employee"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, PAN, bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name & Role</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Bank Details</th>
                <th className="px-4 py-3 font-medium">Statutory IDs</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered === undefined ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isRevealed = Boolean(revealedSensitives[emp._id]);
                  return (
                    <tr
                      key={emp._id}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-primary">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {emp.designation || "Employee"}
                          {emp.department ? ` • ${emp.department}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-primary/80">
                          {emp.email}
                        </div>
                        {emp.phone && (
                          <div className="text-xs text-muted-foreground">
                            {emp.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {emp.bankAccountNumber ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-mono text-primary flex items-center gap-1.5">
                              <span>
                                {isRevealed
                                  ? emp.bankAccountNumber
                                  : emp.maskedBankAccountNumber ||
                                    emp.bankAccountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleReveal(emp._id)}
                                title={isRevealed ? "Mask" : "Reveal full"}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                {isRevealed ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {emp.bankName || "Bank"}{" "}
                              {emp.ifscCode ? `(${emp.ifscCode})` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not added
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {emp.pan || emp.uan ? (
                          <div className="space-y-0.5 text-xs">
                            {emp.pan && (
                              <div className="font-mono text-primary flex items-center gap-1.5">
                                <span className="text-muted-foreground font-sans">
                                  PAN:
                                </span>
                                <span>
                                  {isRevealed
                                    ? emp.pan
                                    : emp.maskedPan || emp.pan}
                                </span>
                              </div>
                            )}
                            {emp.uan && (
                              <div className="font-mono text-muted-foreground">
                                UAN:{" "}
                                {isRevealed
                                  ? emp.uan
                                  : emp.maskedUan || emp.uan}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not added
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            emp.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/salaries?employeeId=${emp._id}`)}
                            >
                              <IndianRupee className="mr-2 h-4 w-4" />
                              Configure Salary
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditOpen(emp)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Master Records
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(emp)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Employee
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Remove Employee Confirmation Dialog */}
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Remove Employee
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-primary">
                  {deleteTarget?.firstName} {deleteTarget?.lastName}
                </span>
                {deleteTarget?.designation ? ` (${deleteTarget.designation})` : ""}?
                <br /><br />
                This will remove the employee from the active directory. All historical payroll records, payslips, salary history, and audit logs will be safely preserved for compliance.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Employee"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
