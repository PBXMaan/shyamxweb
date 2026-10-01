import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/servers")({
  component: ServersLayout,
});

function ServersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Child routes render here; keeps /dashboard/servers and its detail pages together.
  return (
    <div key={pathname}>
      <Outlet />
    </div>
  );
}
