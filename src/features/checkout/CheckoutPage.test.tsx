import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { setupStore } from "../../app/store";
import { routes } from "../../router";

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return {
    ...actual,
    submitApplication: (request: Parameters<typeof actual.submitApplication>[0]) =>
      actual.submitApplication(request, { delay: 0 }),
  };
});

function renderApp() {
  const store = setupStore();
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return store;
}

async function fillDetails(user: ReturnType<typeof userEvent.setup>, income = "15000") {
  await user.type(screen.getByLabelText("Full name"), "Mohsen Hussein");
  await user.type(screen.getByLabelText("National ID / Iqama"), "1234567890");
  await user.type(screen.getByLabelText("Mobile number"), "0551234567");
  await user.type(screen.getByLabelText("Email"), "mohsen@example.com");
  await user.selectOptions(screen.getByLabelText("Employment"), "private");
  await user.type(screen.getByLabelText("Monthly income (SAR)"), income);
  await user.click(screen.getByRole("checkbox", { name: /installment terms/i }));
}

describe("<CheckoutPage />", () => {
  it("disables plans the order value doesn't qualify for", () => {
    renderApp();
    expect(screen.getByRole("radio", { name: /pay in 4/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /6 monthly/i })).toBeChecked();
  });

  it("updates the schedule when another plan is chosen", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("radio", { name: /12 monthly/i }));
    const table = screen.getByRole("table", { name: "Repayment schedule" });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 12 + 2); // header + rows + profit/total
  });

  it("validates the details form", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("You must accept the terms to continue")).toBeInTheDocument();
  });

  it("completes checkout and records the order", async () => {
    const user = userEvent.setup();
    const store = renderApp();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.type(await screen.findByLabelText("Verification code"), "0000");
    await user.click(screen.getByRole("button", { name: /pay sar/i }));
    expect(await screen.findByText("The verification code is incorrect.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Verification code"));
    await user.type(screen.getByLabelText("Verification code"), "1234");
    await user.click(screen.getByRole("button", { name: /pay sar/i }));

    expect(await screen.findByRole("heading", { name: "You're approved!" })).toBeInTheDocument();
    expect(store.getState().orders.items[0]).toMatchObject({
      customerName: "Mohsen Hussein",
      status: "approved",
    });
  });

  it("explains a decline when the plan isn't affordable", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await fillDetails(user, "2500");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(await screen.findByLabelText("Verification code"), "1234");
    await user.click(screen.getByRole("button", { name: /pay sar/i }));

    expect(await screen.findByRole("heading", { name: /couldn't approve/i })).toBeInTheDocument();
  });
});
