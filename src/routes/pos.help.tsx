import { createFileRoute } from "@tanstack/react-router";
import { PosHelpGuideBook } from "@/components/shared/pos/help/PosHelpGuideBook";

export const Route = createFileRoute("/pos/help")({
  head: () => ({
    meta: [
      { title: "Help Guide | Retrod POS" },
      {
        name: "description",
        content: "Staff operating handbook and keyboard shortcuts manual for Retrod POS.",
      },
    ],
  }),
  component: PosHelpRoute,
});

function PosHelpRoute() {
  return <PosHelpGuideBook />;
}
