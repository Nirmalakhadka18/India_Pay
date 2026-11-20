"use client";

import { GenericAdminOpsTemplate } from "../generic-admin-ops-template";

export default function BulkPhotoUploadPage() {
  return (
    <GenericAdminOpsTemplate
      title="Bulk Photo Upload"
      description="Match and import multiple profile photographs matched by Employee Number or PAN"
      actionText="Upload ZIP Archive"
    />
  );
}
