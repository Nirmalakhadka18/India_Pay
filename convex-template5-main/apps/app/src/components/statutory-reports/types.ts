export interface EsiEmployeeRecordType {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  insuranceNo: string;
  joiningDate: string;
  leavingDate: string;
  daysWorked: number;
  esiGross: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  reasonCode: string;
  lastWorkingDay: string;
}

export interface PfEmployeeRecordType {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  uan: string;
  pfNo: string;
  grossWages: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  eePf: number;
  eeVpf: number;
  erPf: number;
  erEps: number;
  erTotal: number;
  ncpDays: number;
  refundOfAdvances: number;
  formattedEcrLine?: string;
}

export interface PtEmployeeRecordType {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  joinDate: string;
  grossSalary: number;
  ptAmount: number;
  isExempt?: boolean;
}

export interface PtSlabRecordType {
  slabLabel: string;
  rate: number;
  employeeCount: number;
  amount: number;
}

export type GenericStatutoryRecord = Partial<
  EsiEmployeeRecordType & PfEmployeeRecordType & PtEmployeeRecordType
> & {
  slNo: number;
  name: string;
  employeeId?: string;
  employeeNo?: string;
  grossSalary?: number;
  ptAmount?: number;
  esiGross?: number;
  employeeContribution?: number;
  employerContribution?: number;
  totalContribution?: number;
  insuranceNo?: string;
  daysWorked?: number;
  reasonCode?: string;
  lastWorkingDay?: string;
  uan?: string;
  epfWages?: number;
  eePf?: number;
  erPf?: number;
  erEps?: number;
  erTotal?: number;
};

export interface ReconciliationStatusType {
  reconciled: boolean;
  reportTotal: number;
  payrollItemsTotal: number;
  discrepancy: number;
  status: "reconciled" | "discrepancy" | "no_run";
}

export interface EsiReportDataResponse {
  hasRun: boolean;
  payrollRunId?: string;
  runStatus: string;
  isFinalized: boolean;
  isDraft: boolean;
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  totalEmployeesCovered: number;
  totalWages: number;
  totalEmployeeContribution: number;
  totalEmployerContribution: number;
  totalContribution: number;
  portalEmployerContribution: number;
  portalTotalContribution: number;
  amountInWords: string;
  records: EsiEmployeeRecordType[];
  reconciliation: ReconciliationStatusType;
}

export interface PfReportDataResponse {
  hasRun: boolean;
  payrollRunId?: string;
  runStatus: string;
  isFinalized: boolean;
  isDraft: boolean;
  workspaceName: string;
  companyAddress: string;
  establishmentCode: string;
  periodMonth: string;
  totalMembers: number;
  totalGrossWages: number;
  totalEpfWages: number;
  totalEpsWages: number;
  totalEdliWages: number;
  totalEeShare: number;
  totalEpsShare: number;
  totalErShare: number;
  totalNcpDays: number;
  totalRefundOfAdvances: number;
  accountBreakdown: {
    ac1_ee: number;
    ac1_er: number;
    ac1_total: number;
    ac2_admin: number;
    ac10_eps: number;
    ac21_edli: number;
    ac22_admin: number;
    totalRemittance: number;
    amountInWords: string;
  };
  records: PfEmployeeRecordType[];
  txtContent: string;
  reconciliation: ReconciliationStatusType;
}

export interface PtReportDataResponse {
  hasRun: boolean;
  payrollRunId?: string;
  runStatus: string;
  isFinalized: boolean;
  isDraft: boolean;
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  state: string;
  totalEmployees: number;
  totalTaxDeducted: number;
  amountInWords: string;
  records: PtEmployeeRecordType[];
  slabsSummary: PtSlabRecordType[];
  karnatakaForm5A: {
    ptoCircleNo: string;
    registrationCertificateNo: string;
    simpleInterest: number;
    grandTotal: number;
  };
  reconciliation: ReconciliationStatusType;
}
