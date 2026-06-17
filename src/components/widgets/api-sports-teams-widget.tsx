import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsTeamsWidget({ title = "API-Sports Teams widget" }: { title?: string }) {
  return (
    <ConfiguredApiSportsWidget
      type="teams"
      title={title}
      attributes={{ showErrors: false, showLogos: true }}
    />
  );
}
