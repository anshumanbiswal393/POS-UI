import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Monitor,
  PhoneCall,
  Printer,
  Puzzle,
  Settings2,
  Share2,
  Users,
  Utensils,
} from "lucide-react";
import type { OutletSetupStepId } from "./outletConfigStore";

export type OutletSetupStep = {
  id: OutletSetupStepId;
  n: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  to: string;
};

export const OUTLET_CONFIGURATION_STEPS: OutletSetupStep[] = [
  {
    id: "details",
    n: 1,
    title: "Outlet Details",
    desc: "Configure outlet name, address, logo and other basic details.",
    icon: Building2,
    to: "/pos/management/configuration/outlet/details",
  },
  {
    id: "contact",
    n: 2,
    title: "Contact Details",
    desc: "Add contact details and staff members for the outlet.",
    icon: PhoneCall,
    to: "/pos/management/configuration/outlet/contact",
  },
  {
    id: "timings",
    n: 3,
    title: "Outlet Timings",
    desc: "Set opening hours, lunch & dinner timings, and display settings.",
    icon: Clock,
    to: "/pos/management/configuration/outlet/timings",
  },
  {
    id: "payment",
    n: 4,
    title: "Payment",
    desc: "Configure currency, payment types and payment settings.",
    icon: CreditCard,
    to: "/pos/management/configuration/outlet/payment",
  },
  {
    id: "invoice-sequence",
    n: 5,
    title: "Invoice Sequence",
    desc: "Configure multiple invoice sequence.",
    icon: FileSpreadsheet,
    to: "/pos/management/configuration/outlet/invoice-sequence",
  },
  {
    id: "service-mode",
    n: 6,
    title: "Service Mode",
    desc: "Configure service modes (Dine-in, Takeaway, Room Service etc.).",
    icon: Utensils,
    to: "/pos/management/configuration/outlet/service-mode",
  },
  {
    id: "integrations",
    n: 7,
    title: "Integrations",
    desc: "Connect with external systems and third-party integrations.",
    icon: Puzzle,
    to: "/pos/management/configuration/outlet/integrations",
  },
];

export const BILLING_SETUP_STEPS: OutletSetupStep[] = [
  {
    id: "billing-preferences",
    n: 1,
    title: "Billing Preferences",
    desc: "Configure currency, payment types and payment options available.",
    icon: Settings2,
    to: "/pos/management/configuration/outlet/billing-preferences",
  },
  {
    id: "display",
    n: 2,
    title: "Billing Screen & Hardware Settings",
    desc: "Configure display settings, POS hardware and devices.",
    icon: Monitor,
    to: "/pos/management/configuration/outlet/display",
  },
  {
    id: "calculations",
    n: 3,
    title: "Calculations",
    desc: "Configure tax rates and calculation rules.",
    icon: Calculator,
    to: "/pos/management/configuration/outlet/calculations",
  },
  {
    id: "print-logo",
    n: 4,
    title: "Set Your Print Logo",
    desc: "Upload logo for print receipts and bills.",
    icon: Printer,
    to: "/pos/management/configuration/outlet/print-logo",
  },
  {
    id: "connected-services",
    n: 5,
    title: "Connected Services",
    desc: "Configure integrations with external systems.",
    icon: Share2,
    to: "/pos/management/configuration/outlet/connected-services",
  },
  {
    id: "customer",
    n: 6,
    title: "Customer",
    desc: "Configure customer details and loyalty settings.",
    icon: Users,
    to: "/pos/management/configuration/outlet/customer",
  },
];
