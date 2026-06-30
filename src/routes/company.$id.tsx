import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/company/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/company/$id"!</div>;
}
