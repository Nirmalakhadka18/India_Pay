"use client";

import { GenericWorkflowTemplate } from "../generic-workflow-template";

export default function RestrictedHolidayWorkflowPage() {
  return (
    <GenericWorkflowTemplate
      moduleName="Restricted Holiday Leave"
      moduleId="rh-leave"
      description="Restricted holiday request and allocation review"
    />
  );
}
