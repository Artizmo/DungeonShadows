import { RouterProvider, createRouter } from "@tanstack/react-router";

// 1. Import the routing map generated automatically by the TanStack Vite compiler
import { routeTree } from "./routeTree.gen";

// 2. Initialize the global application router instance
const router = createRouter({
  routeTree,
});

// 3. Register the router instance for strict, absolute type safety across your codebase
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// 4. Main Application export that delivers the active route matrix to index.html
export function App() {
  return <RouterProvider router={router} />;
}
