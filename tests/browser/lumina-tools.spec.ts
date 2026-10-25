import { test, expect, type Page } from '@playwright/test';
import { sampleFiles } from '../fixtures.mjs';

async function more(page: Page, name: string) {
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function draw(page: Page, offset = 0) {
  const box = (await page.getByTestId('dicom-canvas').first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * (0.4 + offset));
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * (0.6 + offset), {
    steps: 12,
  });
  await page.mouse.up();
}

test('Lumina branding and additional tools, labels, series isolation and cleanup', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('Lumina — DICOM workspace');
  await expect(page.getByRole('link', { name: 'Lumina home' })).toBeVisible();
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect((await page.request.get(icon!)).ok()).toBe(true);
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);

  await more(page, 'Pixel probe (I)');
  const host = page.getByTestId('dicom-canvas');
  await host.click();
  await expect(host.locator('svg circle')).not.toHaveCount(0);
  await more(page, 'Measurements');
  const panel = page.getByRole('complementary', { name: 'Measurements', exact: true });
  await expect(panel.getByTestId('measurement-row')).toHaveCount(1);
  await expect(panel).toContainText('Value:');
  await panel.getByRole('button', { name: 'Rename Pixel probe', exact: true }).click();
  await page.getByRole('textbox', { name: 'Label', exact: true }).fill('Reference point');
  await page.getByRole('button', { name: 'Save label', exact: true }).click();
  await panel.getByRole('button', { name: 'Hide Reference point', exact: true }).click();
  await expect(panel).toContainText('Hidden');
  await panel.getByRole('button', { name: 'Show Reference point', exact: true }).click();
  await page.getByRole('button', { name: 'Close measurements', exact: true }).click();

  await more(page, 'Bidirectional measurement (B)');
  await draw(page);
  await more(page, 'Arrow annotation (A)');
  await draw(page, -0.15);
  await expect(page.getByRole('dialog', { name: 'Annotation label' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Label', exact: true }).fill('Example finding');
  await page.getByRole('button', { name: 'Save label', exact: true }).click();
  await more(page, 'Measurements');
  await expect(panel.getByTestId('measurement-row')).toHaveCount(3);
  await expect(panel).toContainText('Width:');
  await expect(panel).toContainText('Example finding');
  await page.getByLabel('Image slice').fill('4');
  await panel.getByRole('button', { name: /Example finding Arrow annotation/ }).click();
  await expect(page.getByLabel('Image slice')).toHaveValue('0');
  await page.getByRole('button', { name: /Axial series 2 preview/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(panel.getByTestId('measurement-row')).toHaveCount(0);
  await page.getByRole('button', { name: /Axial series 1 preview/ }).click();
  await expect(panel.getByTestId('measurement-row')).toHaveCount(3);
  await panel.getByRole('button', { name: 'Delete Example finding', exact: true }).click();
  await expect(panel.getByTestId('measurement-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Close measurements', exact: true }).click();

  await more(page, 'Magnifier (M)');
  const box = (await host.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await expect(host.locator('canvas')).toHaveCount(2);
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55, { steps: 5 });
  await page.mouse.up();
  await expect(host.locator('canvas')).toHaveCount(1);
  await more(page, 'Arrow annotation (A)');
  await draw(page, -0.15);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await more(page, 'Measurements');
  await expect(panel.getByTestId('measurement-row')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/lumina-measurements.png' });
  await page.getByLabel('Clear session', { exact: true }).click();
  await expect(page.getByTestId('home-page')).toBeVisible();
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await more(page, 'Measurements');
  await expect(panel.getByTestId('measurement-row')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe('mobile tools', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('probe and measurement panel remain accessible on touch screens', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
    await expect(page.getByLabel('Viewport layout')).toBeVisible();
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    await page.getByRole('button', { name: 'More tools', exact: true }).tap();
    await page.getByRole('button', { name: 'Pixel probe (I)', exact: true }).tap();
    await page.getByTestId('dicom-canvas').tap();
    await page.getByRole('button', { name: 'More tools', exact: true }).tap();
    await page.getByRole('button', { name: 'Measurements', exact: true }).tap();
    await expect(page.getByTestId('measurement-row')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'test-results/lumina-mobile.png' });
  });
});
