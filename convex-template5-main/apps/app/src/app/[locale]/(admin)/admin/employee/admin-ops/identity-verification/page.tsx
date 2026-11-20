"use client";

import { GenericAdminOpsTemplate } from "../generic-admin-ops-template";

export default function IdentityVerificationPage() {
  return (
    <GenericAdminOpsTemplate
      title="Identity Verification"
      description="Queue for government PAN validation, Aadhaar linking, and bank account name matches"
      actionText="Review Queue"
    />
  );
}
