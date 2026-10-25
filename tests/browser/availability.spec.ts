import { test, expect } from '@playwright/test';
import { dicomFixture, sampleFiles } from '../fixtures.mjs';

test('home keeps useful guidance without sparkle or repeated marketing copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Your studies/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Workspace features' })).toBeVisible();
  await expect(page.getByText('A CLEARER VIEW, RIGHT HERE')).toHaveCount(0);
  await expect(page.getByText('Built for focus')).toHaveCount(0);
  await expect(page.getByText('YOUR LOCAL WORKSPACE')).toHaveCount(0);
  await expect(page.getByText('Multiple studies?')).toHaveCount(0);
});

test('single-image tools and CT presets follow the active image', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles({
    name: 'single-mr.dcm',
    mimeType: 'application/dicom',
    buffer: dicomFixture({ modality: 'MR' }),
  });
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scroll (S)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Scroll (S)' })).toHaveAttribute(
    'aria-description',
    'Requires more than one image or frame',
  );
  await expect(page.getByRole('button', { name: 'Play cine' })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Cine speed' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sync views' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sync views' })).toHaveAttribute(
    'aria-description',
    'Requires two loaded viewports',
  );
  await expect(page.getByRole('button', { name: 'Reset view (R)' })).toBeEnabled();
  await page.getByRole('button', { name: 'More tools' }).click();
  await expect(page.getByRole('option', { name: 'CT · Soft tissue' })).toHaveAttribute(
    'disabled',
    '',
  );
  await expect(page.getByRole('button', { name: 'Delete selected measurement' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Clear series measurements' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Length (L)' }).click();
  const box = (await page.getByTestId('dicom-canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'More tools' }).click();
  await expect(page.getByRole('button', { name: 'Clear series measurements' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Delete selected measurement' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'More tools' }).click();
  await page.getByRole('button', { name: 'Measurements', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Measurements' });
  await panel
    .getByTestId('measurement-row')
    .first()
    .getByRole('button', { name: /Length/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Close measurements' }).click();
  await page.getByRole('button', { name: 'More tools' }).click();
  await expect(page.getByRole('button', { name: 'Delete selected measurement' })).toBeEnabled();
});

test('sync settings require two images and compatible geometry', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles([
    {
      name: 'a.dcm',
      mimeType: 'application/dicom',
      buffer: dicomFixture({ series: 1, frameOfReference: '1.2.3.10' }),
    },
    {
      name: 'b.dcm',
      mimeType: 'application/dicom',
      buffer: dicomFixture({ series: 2, frameOfReference: '1.2.3.20' }),
    },
  ]);
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await page.getByLabel('Viewport layout').selectOption('1x2');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  const sync = page.getByRole('button', { name: 'Sync views' });
  await expect(sync).toBeEnabled();
  await sync.click();
  await expect(page.getByLabel('Link window / level')).toBeEnabled();
  await expect(page.getByLabel('Link zoom / pan')).toBeEnabled();
  await expect(page.getByLabel('Link spatial slices')).toBeDisabled();
  await expect(page.getByLabel('Reference lines')).toBeDisabled();
  await page.getByLabel('Link zoom / pan').check();
  await page.keyboard.press('Escape');
  await page.getByLabel('Viewport layout').selectOption('1x1');
  await expect(sync).toBeDisabled();
  await page.getByLabel('Viewport layout').selectOption('1x2');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(sync).toBeEnabled();
  await sync.click();
  await expect(page.getByLabel('Link zoom / pan')).toBeChecked();
});

test('existing multi-frame imports keep cine and slice controls available', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scroll (S)' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Play cine' })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'Cine speed' })).toBeEnabled();
  await page.getByRole('button', { name: /RLE compressed image/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scroll (S)' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Pan (P)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByTestId('dicom-canvas').click();
  await page.keyboard.press('s');
  await expect(page.getByRole('button', { name: 'Pan (P)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play cine' })).toBeDisabled();
});
