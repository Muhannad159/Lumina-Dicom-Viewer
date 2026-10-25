import { test, expect } from '@playwright/test';
import { dicomFixture, sampleFiles } from '../fixtures.mjs';

test('MPR is dimmed for a single image and explains the requirement', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles({
    name: 'single.dcm',
    mimeType: 'application/dicom',
    buffer: dicomFixture(),
  });
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open MPR' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open MPR' })).toHaveAttribute(
    'aria-description',
    'Requires at least two spatial slices',
  );
});

test('MPR reconstructs local axial, sagittal and coronal views and returns to the stack', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open MPR' }).click();
  await expect(page.getByTestId('mpr-workspace')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Axial MPR view' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sagittal MPR view' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Coronal MPR view' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 60000 });
  await expect(page.getByTestId('mpr-canvas')).toHaveCount(3);
  for (const canvas of await page.getByTestId('mpr-canvas').all()) {
    await expect(canvas.locator('canvas')).toBeVisible();
    await expect
      .poll(() =>
        canvas.locator('canvas').evaluate((element: HTMLCanvasElement) => {
          const context = element.getContext('2d');
          return (
            context
              ?.getImageData(0, 0, element.width, element.height)
              .data.some((value, index) => index % 4 !== 3 && value > 30) ?? false
          );
        }),
      )
      .toBe(true);
  }
  const axial = page.getByRole('region', { name: 'Axial MPR view' });
  const sagittal = page.getByRole('region', { name: 'Sagittal MPR view' });
  const coronal = page.getByRole('region', { name: 'Coronal MPR view' });
  const beforeSagittal = await sagittal.getByLabel('Image slice').inputValue();
  const beforeCoronal = await coronal.getByLabel('Image slice').inputValue();
  const crosshair = axial.getByTestId('mpr-crosshair');
  const center = crosshair.locator('circle');
  await expect(center).toBeVisible();
  await crosshair.click({
    position: {
      x: Number(await center.getAttribute('cx')) + 25,
      y: Number(await center.getAttribute('cy')) + 20,
    },
  });
  await expect(sagittal.getByLabel('Image slice')).not.toHaveValue(beforeSagittal);
  await expect(coronal.getByLabel('Image slice')).not.toHaveValue(beforeCoronal);
  const afterClick = await sagittal.getByLabel('Image slice').inputValue();
  await crosshair.press('Shift+ArrowRight');
  await expect(sagittal.getByLabel('Image slice')).not.toHaveValue(afterClick);
  await page.getByRole('button', { name: 'Expand Axial view' }).click();
  await expect(sagittal).not.toBeVisible();
  await page.getByRole('button', { name: 'Reset MPR views' }).click();
  await page.getByRole('button', { name: 'Restore Axial view' }).click();
  await expect(sagittal).toBeVisible();
  await axial.getByLabel('Image slice').fill('2');
  await expect(axial.getByLabel('Image slice')).toHaveValue('2');
  await page.screenshot({ path: 'test-results/mpr-views.png' });
  await page.getByRole('button', { name: 'Zoom', exact: true }).click();
  await page.getByRole('button', { name: 'Reset MPR views' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('mpr-viewport')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Exit MPR' }).click();
  await expect(page.getByTestId('mpr-workspace')).toHaveCount(0);
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open MPR' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('larger MPR stacks can be cancelled, reopened and cleared without stale loads', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const files = Array.from({ length: 64 }, (_, index) => ({
    name: `${index}.dcm`,
    mimeType: 'application/dicom',
    buffer: dicomFixture({ instance: index + 1, size: 256 }),
  }));
  await page.getByLabel('Open DICOM files').setInputFiles(files);
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open MPR' }).click();
  await page.getByRole('button', { name: 'Exit MPR' }).click();
  await expect(page.getByRole('button', { name: 'Open MPR' })).toBeEnabled();
  await page.getByRole('button', { name: 'Open MPR' }).click();
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 60000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('mpr-crosshair')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear session', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Open MPR' })).toHaveCount(0);
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByRole('button', { name: 'Open MPR' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('MPR reports a damaged pixel payload instead of presenting a completed volume', async ({
  page,
}) => {
  await page.goto('/');
  const files = Array.from({ length: 8 }, (_, index) => {
    const buffer = dicomFixture({
      instance: index + 1,
      compressed: true,
      corruptPixels: index === 2,
      syntax: index === 2 ? '1.2.840.10008.1.2.4.91' : undefined,
    });
    return {
      name: `${index}.dcm`,
      mimeType: 'application/dicom',
      buffer,
    };
  });
  await page.getByLabel('Open DICOM files').setInputFiles(files);
  await expect(page.getByRole('button', { name: 'Open MPR' })).toBeEnabled();
  await page.getByRole('button', { name: 'Open MPR' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be decoded');
  await page.getByRole('button', { name: 'Return to viewer' }).click();
  await expect(page.getByTestId('mpr-workspace')).toHaveCount(0);
});

test.describe('MPR touch navigation', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('touch crosshair dragging moves linked planes', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
    await expect(page.getByRole('button', { name: 'Open MPR' })).toBeEnabled();
    await page.getByRole('button', { name: 'Open MPR' }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    const axial = page.getByRole('region', { name: 'Axial MPR view' });
    const sagittal = page.getByRole('region', { name: 'Sagittal MPR view' });
    const before = await sagittal.getByLabel('Image slice').inputValue();
    const overlay = axial.getByTestId('mpr-crosshair');
    const box = (await overlay.boundingBox())!;
    const circle = overlay.locator('circle');
    const x = box.x + Number(await circle.getAttribute('cx'));
    const y = box.y + Number(await circle.getAttribute('cy'));
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 25, y: y + 10 }],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(sagittal.getByLabel('Image slice')).not.toHaveValue(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
