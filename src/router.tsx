import { createHashHistory, createRouter } from "@tanstack/react-router";

import { AppLoading } from "@/components/app-loading";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: AppLoading,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
