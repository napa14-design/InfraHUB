import { test, expect } from '@playwright/test';

test('abre app e renderiza conte?do inicial', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1200);

  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);

  const rootText = await page.locator('#root').innerText();
  expect(rootText.trim().length).toBeGreaterThan(0);

  const hasKnownKeyword = /hydrosys|hub|login|entrar|painel/i.test(rootText);
  expect(hasKnownKeyword).toBeTruthy();
});
