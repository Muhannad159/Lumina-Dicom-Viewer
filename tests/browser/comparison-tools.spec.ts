import { test, expect, type Page } from '@playwright/test';
import { sampleFiles, dicomFixture } from '../fixtures.mjs';

async function action(page: Page, name: string) {
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
async function open(page: Page) {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
}

test('spatial and presentation links are opt-in, follow the active viewport and exclude other studies', async ({
  page,
}) => {
  await open(page);
  await page.getByLabel('Viewport layout').selectOption('1x2');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  const first = page.getByTestId('viewport').nth(0),
    second = page.getByTestId('viewport').nth(1);
  await first.getByLabel('Image slice').fill('3');
  await expect(second.getByLabel('Image slice')).toHaveValue('0');
  await page.getByRole('button', { name: 'Sync views', exact: true }).click();
  await page.getByLabel('Link spatial slices', { exact: true }).check();
  await page.getByLabel('Link window / level', { exact: true }).check();
  await page.getByLabel('Link zoom / pan', { exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(second.getByLabel('Image slice')).toHaveValue('3');
  await first.getByLabel('Image slice').fill('4');
  await expect(second.getByLabel('Image slice')).toHaveValue('4');
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByLabel('Window preset').selectOption('brain');
  await page.keyboard.press('Escape');
  await expect(first.getByTestId('window-overlay')).toContainText('W 80 / L 40');
  await expect(second.getByTestId('window-overlay')).toContainText('W 80 / L 40');
  await second.getByLabel('Image slice').fill('1');
  await expect(first.getByLabel('Image slice')).toHaveValue('1');
  await page.getByRole('button', { name: /Multiframe sequence/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await second.getByLabel('Image slice').fill('6');
  await expect(first.getByLabel('Image slice')).toHaveValue('1');
  await page.getByRole('button', { name: 'Sync views', exact: true }).click();
  await expect(page.getByLabel('Link spatial slices', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Link spatial slices', { exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
});

test('reference lines show compatible orthogonal planes and update when scrolling', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles([
    ...sampleFiles().slice(0, 5),
    {
      name: 'coronal',
      mimeType: 'application/dicom',
      buffer: dicomFixture({ series: 8, position: '0\\64\\0', orientation: '1\\0\\0\\0\\0\\1' }),
    },
  ]);
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await page.getByLabel('Viewport layout').selectOption('1x2');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sync views', exact: true }).click();
  await page.getByLabel('Reference lines', { exact: true }).check();
  await page.keyboard.press('Escape');
  const line = page.getByTestId('reference-line');
  await expect(line).toHaveCount(1);
  const before = await line.getAttribute('y1');
  await page.getByTestId('viewport').first().getByLabel('Image slice').fill('4');
  await expect(line).not.toHaveAttribute('y1', before!);
});

test('bookmarks reopen the exact series and frame across navigation and clear with the session', async ({
  page,
}) => {
  await open(page);
  await page.getByLabel('Image slice').fill('3');
  await action(page, 'Bookmark current image');
  await action(page, 'Bookmark current image');
  await page.getByRole('button', { name: /Multiframe sequence/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await page.getByLabel('Image slice').fill('6');
  await action(page, 'Bookmark current image');
  await page.getByRole('link', { name: 'Lumina home', exact: true }).click();
  await page.getByRole('link', { name: /Continue your session/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await action(page, 'Key-image bookmarks');
  const panel = page.getByRole('complementary', { name: 'Key-image bookmarks', exact: true });
  await expect(panel.getByRole('listitem')).toHaveCount(2);
  await panel.getByRole('button', { name: /Multiframe sequence.*Image 7/ }).click();
  await expect(page.getByLabel('Image slice')).toHaveValue('6');
  await expect(page.getByTestId('patient-overlay')).toContainText('DEMO PATIENT TWO');
  await action(page, 'Key-image bookmarks');
  await panel.getByRole('button', { name: /Axial series 1.*Image 4/ }).click();
  await expect(page.getByLabel('Image slice')).toHaveValue('3');
  await page.getByLabel('Clear session', { exact: true }).click();
  await expect(page.getByTestId('home-page')).toBeVisible();
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await action(page, 'Key-image bookmarks');
  await expect(panel.getByRole('listitem')).toHaveCount(0);
});

test('Cobb, freehand, spline and regional window tools draw and export measurements', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const host = page.getByTestId('dicom-canvas');
  const box = (await host.boundingBox())!;
  const point = (x: number, y: number) => ({ x: box.x + box.width * x, y: box.y + box.height * y });
  const move = async (x: number, y: number) => {
    const p = point(x, y);
    await page.mouse.move(p.x, p.y, { steps: 8 });
  };
  const drag = async (x: number, y: number, x2: number, y2: number) => {
    await move(x, y);
    await page.mouse.down();
    await move(x2, y2);
    await page.mouse.up();
  };
  await action(page, 'Cobb angle');
  await drag(0.35, 0.3, 0.55, 0.35);
  await drag(0.35, 0.55, 0.55, 0.5);
  await expect(host.locator('svg')).toContainText('°');
  await action(page, 'Freehand ROI');
  await move(0.6, 0.65);
  await page.mouse.down();
  await move(0.66, 0.65);
  await move(0.66, 0.75);
  await move(0.6, 0.75);
  await move(0.6, 0.65);
  await page.mouse.up();
  await expect(host.locator('svg')).toContainText('mm');
  await action(page, 'Spline ROI');
  for (const [x, y] of [
    [0.4, 0.65],
    [0.5, 0.65],
    [0.5, 0.75],
    [0.4, 0.75],
    [0.4, 0.65],
  ]) {
    await move(x, y);
    const p = point(x, y);
    await page.mouse.click(p.x, p.y);
  }
  await expect(host.locator('svg text').filter({ hasText: 'Area:' })).toHaveCount(2);
  await action(page, 'Measurements');
  const panel = page.getByRole('complementary', { name: 'Measurements', exact: true });
  await expect(panel.getByTestId('measurement-row')).toHaveCount(3);
  await expect(panel).toContainText('Cobb angle');
  await expect(panel).toContainText('Freehand ROI');
  await expect(panel).toContainText('Spline ROI');
  for (const format of ['JSON', 'CSV']) {
    const download = page.waitForEvent('download');
    await panel.getByRole('button', { name: `Export ${format}`, exact: true }).click();
    expect((await download).suggestedFilename()).toBe(
      `lumina-measurements.${format.toLowerCase()}`,
    );
  }
  await page.getByRole('button', { name: 'Close measurements' }).click();
  const before = await page.getByTestId('window-overlay').textContent();
  await action(page, 'Regional window / level');
  await drag(0.45, 0.4, 0.55, 0.55);
  await expect(page.getByTestId('window-overlay')).not.toHaveText(before!);
  expect(errors).toEqual([]);
});
