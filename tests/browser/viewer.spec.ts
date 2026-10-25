import { test, expect } from '@playwright/test';
import { sampleFiles, dicomFixture } from '../fixtures.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

test('local import, tools, layouts, compressed/multiframe viewing and session cleanup', async ({
  page,
}) => {
  const errors: string[] = [];
  const unexpectedRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (
      !request.url().startsWith('http://127.0.0.1:4173') &&
      !request.url().startsWith('blob:') &&
      !request.url().startsWith('data:')
    )
      unexpectedRequests.push(request.url());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your studies. A new perspective.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/home-dark.png', fullPage: true });
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByTestId('viewport').locator('canvas').first()).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('viewport-error')).toHaveCount(0);
  await expect(page.getByTestId('study-group')).toHaveCount(2);
  await expect(page.getByTestId('series-card')).toHaveCount(5);
  await expect(page.getByTestId('thumbnail').locator('img')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Length (L)', exact: true })).toBeEnabled();
  await page.getByLabel('Viewport layout').selectOption('2x2');
  await expect(page.getByTestId('viewport')).toHaveCount(4);
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('empty-viewport')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/viewer-desktop.png', fullPage: true });
  // A real pixel buffer must exist, not just a mounted canvas.
  const pixels = await page
    .getByTestId('viewport')
    .locator('canvas')
    .first()
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      return context
        ? context
            .getImageData(0, 0, canvas.width, canvas.height)
            .data.some((v, i) => i % 4 !== 3 && v > 30)
        : false;
    });
  expect(pixels).toBe(true);
  const first = page.getByTestId('viewport').nth(0);
  await first.getByLabel('Image slice').fill('3');
  await expect(first.getByTestId('slice-counter')).toContainText('4');
  await expect(page.getByTestId('viewport').nth(1).getByTestId('slice-counter')).toContainText('1');
  await page.getByRole('button', { name: 'Length (L)', exact: true }).click();
  const area = await first.boundingBox();
  await page.mouse.move(area!.x + area!.width * 0.4, area!.y + area!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(area!.x + area!.width * 0.6, area!.y + area!.height * 0.6, { steps: 10 });
  await page.mouse.up();
  await expect(first.locator('svg line')).not.toHaveCount(0);
  await expect(page.getByTestId('viewport').nth(1).locator('svg line')).toHaveCount(0);
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByRole('button', { name: 'Rotate 90°', exact: true }).click();
  await page.getByRole('button', { name: 'Flip horizontal', exact: true }).click();
  await page.getByRole('button', { name: 'Invert', exact: true }).click();
  await page.getByLabel('Window preset').selectOption('brain');
  await expect(first.getByTestId('window-overlay')).toContainText('W 80 / L 40');
  await page.getByRole('button', { name: 'Image metadata', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('SOP Instance UID');
  await page.getByLabel('Close dialog').click();
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByLabel('Screenshot and crop').click();
  await expect(page.getByAltText('Viewport capture')).toBeVisible();
  await page.getByRole('button', { name: 'Crop', exact: true }).click();
  const capture = await page.getByAltText('Viewport capture').boundingBox();
  await page.mouse.move(capture!.x + 10, capture!.y + 10);
  await page.mouse.down();
  await page.mouse.move(capture!.x + capture!.width * 0.7, capture!.y + capture!.height * 0.7, {
    steps: 5,
  });
  await page.mouse.up();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.png$/);
  await page.getByLabel('Close dialog').click();
  await page.getByLabel('Viewport layout').selectOption('1x1');
  await page.getByRole('button', { name: /Multiframe sequence/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByLabel('Image slice')).toHaveAttribute('max', '7');
  await page.getByLabel('Image slice').fill('7');
  await expect(page.getByTestId('slice-counter')).toContainText('8');
  await page.getByLabel('Play cine', { exact: true }).click();
  await expect(page.getByTestId('slice-counter')).not.toHaveText('8 / 8');
  await page.getByLabel('Pause cine', { exact: true }).click();
  await page.getByRole('button', { name: /RLE compressed image/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('viewport-error')).toHaveCount(0);
  await page
    .getByLabel('Open DICOM files')
    .setInputFiles([
      sampleFiles()[0],
      { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') },
    ]);
  await expect(page.getByRole('dialog')).toContainText('Import details');
  await expect(page.getByRole('dialog')).toContainText('SOP Instance UID already imported');
  await page.getByLabel('Close dialog').click();
  await page.getByLabel('Clear session', { exact: true }).click();
  await expect(page.getByTestId('home-page')).toBeVisible();
  await page
    .getByLabel('Open DICOM files')
    .setInputFiles([{ name: 'again', mimeType: 'application/dicom', buffer: dicomFixture() }]);
  await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('viewport-error')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
});

test('four themes and responsive portrait/mobile study browser', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['light', 'blue', 'green', 'dark']) {
    await page.getByRole('button', { name: 'Choose theme', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Choose theme options' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.screenshot({ path: `test-results/home-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('series-card')).toHaveCount(5);
  await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();
  const browserBox = await page.getByTestId('study-browser').boundingBox();
  const viewportBox = await page.getByTestId('viewport-grid').boundingBox();
  expect(browserBox!.y).toBeGreaterThan(viewportBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/viewer-mobile.png', fullPage: true });
  await page.getByLabel('Image slice').fill('2');
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(page.getByTestId('slice-counter')).toContainText('3');
  await page.screenshot({ path: 'test-results/viewer-portrait.png', fullPage: true });
  await page.getByLabel('Collapse studies', { exact: true }).click();
  await expect(page.getByTestId('study-groups')).toHaveCount(0);
  await page.getByLabel('Expand studies', { exact: true }).click();
  await expect(page.getByTestId('study-groups')).toBeVisible();
});

test('recursive folder picker, adding imports and file drop preserve the current study', async ({
  page,
}, testInfo) => {
  const folder = testInfo.outputPath('synthetic-folder');
  await mkdir(path.join(folder, 'nested', 'deeper'), { recursive: true });
  await writeFile(path.join(folder, 'image.dcm'), dicomFixture());
  await writeFile(path.join(folder, 'nested', 'extensionless'), dicomFixture({ instance: 2 }));
  await writeFile(path.join(folder, 'nested', 'deeper', 'other-study'), dicomFixture({ study: 2 }));
  await writeFile(path.join(folder, 'readme.txt'), 'Not a DICOM file');
  await page.goto('/');
  await page.getByLabel('Open DICOM folder').setInputFiles(folder);
  await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByTestId('study-group')).toHaveCount(2);
  await page.getByLabel('Image slice').fill('1');
  const data = Array.from(dicomFixture({ study: 3 }));
  await page.evaluate((bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array(bytes)], 'dropped-image', { type: 'application/dicom' }),
    );
    document
      .querySelector('[data-testid="app-shell"]')!
      .dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
  }, data);
  await expect(page.getByTestId('study-group')).toHaveCount(3);
  await expect(page.getByTestId('slice-counter')).toHaveText('2 / 2');
  await expect(page.getByTestId('viewport-error')).toHaveCount(0);
});

test('cross-study assignment, rapid series changes, presentation tools and measurement clearing', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await page.getByLabel('Viewport layout').selectOption('1x2');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  const first = page.getByTestId('viewport').nth(0);
  const second = page.getByTestId('viewport').nth(1);
  await page.getByRole('button', { name: /RLE compressed image/ }).dragTo(second);
  await expect(second.getByTestId('patient-overlay').locator('strong')).toHaveText(
    'DEMO PATIENT TWO',
  );
  await expect(first.getByTestId('patient-overlay').locator('strong')).toHaveText(
    'DEMO PATIENT ONE',
  );
  for (const name of [
    'Axial series 1',
    'Axial series 2',
    'Axial series 3',
    'Multiframe sequence',
    'Axial series 1',
  ]) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
  }
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(second.getByTestId('series-overlay')).toContainText('Axial series 1');
  await expect(page.getByLabel('Zoom (Z)', { exact: true })).toBeEnabled();
  const box = await second.boundingBox();
  async function dragTool(label: string, start = [0.4, 0.4], end = [0.6, 0.6]) {
    await page.getByLabel(label, { exact: true }).click();
    await page.mouse.move(box!.x + box!.width * start[0], box!.y + box!.height * start[1]);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * end[0], box!.y + box!.height * end[1], {
      steps: 8,
    });
    await page.mouse.up();
  }
  await dragTool('Zoom (Z)');
  await dragTool('Pan (P)');
  await dragTool('Rectangle ROI');
  await expect(second.locator('svg rect')).not.toHaveCount(0);
  await dragTool('Elliptical ROI', [0.25, 0.7], [0.35, 0.8]);
  await expect(second.locator('svg ellipse')).not.toHaveCount(0);
  await dragTool('Angle', [0.65, 0.25], [0.7, 0.35]);
  await page.mouse.click(box!.x + box!.width * 0.8, box!.y + box!.height * 0.2);
  await expect(second.locator('svg line')).not.toHaveCount(0);
  await page.getByLabel('Reset view (R)', { exact: true }).click();
  await expect(second.locator('svg rect')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByRole('button', { name: 'Clear series measurements', exact: true }).click();
  await expect(second.locator('svg rect')).toHaveCount(0);
  await expect(second.locator('svg ellipse')).toHaveCount(0);
  await page.getByRole('button', { name: 'Flip vertical', exact: true }).click();
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByLabel('Viewport layout').selectOption('2x1');
  await expect(page.getByTestId('viewport')).toHaveCount(2);
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe('touch input', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('one-finger tools work and all themes fit the mobile viewer', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
    await expect(page.getByTestId('viewport').locator('canvas')).toBeVisible();
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    const bounds = await page.getByTestId('dicom-canvas').boundingBox();
    const session = await page.context().newCDPSession(page);
    const touch = async (type: string, x: number, y: number) =>
      session.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, radiusX: 4, radiusY: 4 }],
      });
    const x = bounds!.x + bounds!.width / 2;
    const y = bounds!.y + bounds!.height * 0.45;
    await touch('touchStart', x, y);
    for (let step = 1; step <= 6; step++) await touch('touchMove', x, y + step * 12);
    await touch('touchEnd', x, y + 72);
    await expect(page.getByTestId('slice-counter')).not.toHaveText('1 / 5');
    await page.getByLabel('Zoom (Z)', { exact: true }).tap();
    await expect(page.getByLabel('Zoom (Z)', { exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const before = await page
      .getByTestId('viewport')
      .locator('canvas')
      .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    await touch('touchStart', x, y);
    for (let step = 1; step <= 6; step++) await touch('touchMove', x, y + step * 10);
    await touch('touchEnd', x, y + 60);
    await expect
      .poll(() =>
        page
          .getByTestId('viewport')
          .locator('canvas')
          .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
      )
      .not.toBe(before);
    for (const theme of ['light', 'blue', 'green', 'dark']) {
      await page.getByRole('button', { name: 'Choose theme', exact: true }).tap();
      await page
        .getByRole('dialog', { name: 'Choose theme options' })
        .getByRole('button', { name: theme, exact: true })
        .tap();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({ path: `test-results/viewer-mobile-${theme}.png`, fullPage: true });
    }
    await session.detach();
  });
});
