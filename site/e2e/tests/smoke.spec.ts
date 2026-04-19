import { expect, test } from "@playwright/test";

const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://127.0.0.1:5173";
const internalBaseUrl = process.env.INTERNAL_BASE_URL ?? "http://127.0.0.1:5174";
const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8080";

async function registerMarketplaceUser(request: import("@playwright/test").APIRequestContext) {
  const suffix = `${Date.now()}`.slice(-6) + `${Math.floor(Math.random() * 90) + 10}`;
  const username = `smk${suffix}`;
  const email = `${username}@example.com`;
  const password = "Password123!";

  const response = await request.post(`${backendBaseUrl}/auth/register`, {
    data: {
      username,
      email,
      password,
      mobile_number: "9000000000",
    },
  });

  expect(response.ok()).toBeTruthy();
  const user = await response.json();
  return { username, password, user };
}

async function seedMarketplaceSession(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext
) {
  const created = await registerMarketplaceUser(request);
  await page.goto(`${publicBaseUrl}/login`);
  await page.getByLabel("Username").fill(created.username);
  await page.getByLabel("Password").fill(created.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(`${publicBaseUrl}/`);
  return created;
}

async function loginInternal(page: import("@playwright/test").Page, identifier: string) {
  await page.goto(`${internalBaseUrl}/login`);
  await page.getByLabel("Email or username").fill(identifier);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Login" }).click();
}

test("public marketplace smoke: login, deals tab and support chat", async ({ page, request }) => {
  await seedMarketplaceSession(page, request);

  await expect(page.getByRole("navigation").getByRole("link", { name: "Profile", exact: true })).toBeVisible();

  await page.goto(`${publicBaseUrl}/profile?tab=deals`);
  await expect(page.getByRole("heading", { name: "Deal Requests", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open support chat" }).click();
  await expect(page.getByText("Ask a realtor anything about a property")).toBeVisible();
  await expect(page.getByPlaceholder("Write your question for the realtor...")).toBeVisible();
});

test("public discovery smoke: assistant, city hub, new-build hub and viewing flow", async ({ page, request }) => {
  await seedMarketplaceSession(page, request);

  await expect(page.getByRole("link", { name: "New builds", exact: true })).toBeVisible();
  await page.getByPlaceholder("Example: new build apartment near metro in Mumbai under 15000000").first().fill(
    "new build apartment near metro in Mumbai under 15000000"
  );
  await page.getByRole("button", { name: "Build search" }).first().click();
  await expect(page).toHaveURL(/\/list\?/);
  await expect(page).toHaveURL(/city=Mumbai/);
  await expect(page).toHaveURL(/newBuild=true/);

  await page.goto(`${publicBaseUrl}/city/mumbai`);
  await expect(page.getByRole("heading", { name: "Explore Mumbai", exact: true })).toBeVisible();

  await page.goto(`${publicBaseUrl}/new-builds`);
  await expect(page.getByRole("heading", { name: "Developer launches and promoted inventory", exact: true })).toBeVisible();

  await page.goto(`${publicBaseUrl}/1`);
  const fullscreenButton = page.getByRole("button", { name: "Open fullscreen" });
  if (await fullscreenButton.count()) {
    await fullscreenButton.click();
    await expect(page.getByRole("dialog", { name: "Photo gallery" })).toBeVisible();
    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(page.getByRole("dialog", { name: "Photo gallery" })).toHaveCount(0);
  } else {
    await expect(page.getByRole("heading", { name: "Gallery coming soon", exact: true })).toBeVisible();
  }

  await page.getByLabel("Preferred date").fill("2026-04-01");
  await page.getByLabel("Preferred time").fill("12:00");
  await page.locator(".viewingForm").getByRole("button", { name: "Schedule viewing" }).click();
  await expect(page.getByText("Viewing request saved. You can track it from your profile deals tab.")).toBeVisible();
});

test("internal admin smoke: analytics and management nav", async ({ page }) => {
  await loginInternal(page, "admin@example.com");

  await expect(page).toHaveURL(/\/deals/);
  await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Users", exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Organizations", exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Register", exact: true })).toBeVisible();

  await page.goto(`${internalBaseUrl}/analytics`);
  await expect(page.getByRole("heading", { name: "Organization Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
});

test("internal realtor smoke: clients workflow sections", async ({ page }) => {
  await loginInternal(page, "realtor@example.com");

  await expect(page).toHaveURL(/\/deals/);
  await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();

  await page.goto(`${internalBaseUrl}/clients`);
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Marketplace Deal Requests" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Support Inbox" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
});

test("internal bank smoke: credits and payments", async ({ page }) => {
  await loginInternal(page, "bank@example.com");

  await expect(page).toHaveURL(/\/credits/);
  await expect(page.getByRole("heading", { name: "Credits", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Credit Queue" })).toBeVisible();

  await page.goto(`${internalBaseUrl}/payments`);
  await expect(page.getByRole("heading", { name: "Payments", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payments Journal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Deals" })).toHaveCount(0);
});
