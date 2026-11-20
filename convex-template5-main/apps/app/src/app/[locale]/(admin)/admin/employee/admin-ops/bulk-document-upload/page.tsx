"use client";

import { GenericAdminOpsTemplate } from "../generic-admin-ops-template";

export default function BulkDocumentUploadPage() {
  return (
    <GenericAdminOpsTemplate
      title="Bulk Document Upload"
      description="Upload compliance dossiers, identity cards, and appointment letters in batches"
      actionText="Upload Documents"
    />
  );
}
