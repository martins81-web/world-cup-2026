import { ConfiguredApiSportsWidget } from "@/components/widgets/api-sports-widget-config";

export function ApiSportsTeamWidget({ team, title = "API-Sports Team widget" }: { team?: string | number | null; title?: string }) {
  if (!team) {
    return <ConfiguredApiSportsWidget type="team" team={null} title={title} fallback="API-Sports team widget is unavailable for this local team." />;
  }

  return (
    <ConfiguredApiSportsWidget
      type="team"
      team={team}
      title={title}
      attributes={{ showErrors: false, showLogos: true }}
    />
  );
}
