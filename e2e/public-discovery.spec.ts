import { expect, test } from "@playwright/test";

test("anonymous visitor can discover the public application", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CivicSync/i);
  await expect(page.getByRole("link", { name: /map/i }).first()).toBeVisible();
});

test("map page exposes a persisted-data failure honestly when Supabase is not configured", async ({ page }) => {
  const mapResponse = await page.request.get("/api/map");
  expect([200, 503]).toContain(mapResponse.status());
  const response = await page.goto("/map");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /see the work around you/i })).toBeVisible();
  await expect(page.getByText(/OSM supplies the basemap/i)).toBeVisible();
});

test("anonymous direct mutation calls are rejected by the API boundary", async ({ request }) => {
  const response = await request.post("/api/neighbourhood/issues", { data: { title: "Forged report", description: "This request has no authenticated session.", category: "pothole", location: "Unknown", latitude: 13, longitude: 80, observedAt: new Date().toISOString() } });
  expect([401, 403]).toContain(response.status());
  expect((await response.json()).ok).toBe(false);
});

test("anonymous visitor cannot access the protected Admin workspace", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fadmin/);
});
