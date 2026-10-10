import { expect, test } from "@playwright/test";

test("anonymous visitor can discover the public application", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CivicSync/i);
  await expect(page.getByRole("link", { name: /map/i }).first()).toBeVisible();
});

test("map page exposes a persisted-data failure honestly when Supabase is not configured", async ({ page }) => {
  const response = await page.goto("/map");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /see the work around you/i })).toBeVisible();
  await expect(page.getByText(/loading public map data|unavailable|no records/i).first()).toBeVisible({ timeout: 15_000 });
});

test("anonymous visitor cannot access the protected Admin workspace", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fadmin/);
});
