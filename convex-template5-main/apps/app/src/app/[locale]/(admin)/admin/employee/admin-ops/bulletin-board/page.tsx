"use client";

import { GenericAdminOpsTemplate } from "../generic-admin-ops-template";

export default function BulletinBoardPage() {
  return (
    <GenericAdminOpsTemplate
      title="Bulletin Board"
      description="Publish organizational notices, policy announcements, and executive memos"
      actionText="Create Notice"
    />
  );
}
