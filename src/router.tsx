import { createBrowserRouter, type RouteObject } from "react-router";

import { Layout } from "./components/Layout";
import { CheckoutPage } from "./features/checkout/CheckoutPage";

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <CheckoutPage /> },
      {
        path: "merchant",
        // The portal (and Chart.js) is loaded only when a merchant opens it.
        lazy: async () => ({
          Component: (await import("./features/merchant/MerchantPage")).MerchantPage,
        }),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
