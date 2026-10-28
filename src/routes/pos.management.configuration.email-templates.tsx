import { createFileRoute } from "@tanstack/react-router";
import { EmailTemplateSettingsView } from "@/components/shared/pos/management/views/EmailTemplateSettingsView";

export const Route = createFileRoute("/pos/management/configuration/email-templates")({
  
  component: EmailTemplateSettingsView,
});
