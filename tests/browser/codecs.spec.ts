import { test, expect } from '@playwright/test';
import path from 'node:path';

for (const fixture of ['MR_small_jpeg_ls_lossless.dcm', 'JPEG2000.dcm']) {
  test(`locally decodes public codec fixture ${fixture}`, async ({ page }) => {
    const errors: string[] = [];
    const external: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (
        !request.url().startsWith('http://127.0.0.1:4173') &&
        !request.url().startsWith('blob:') &&
        !request.url().startsWith('data:')
      )
        external.push(request.url());
    });
    await page.goto('/');
    await page
      .getByLabel('Open DICOM files')
      .setInputFiles(path.resolve('tests/fixtures/pydicom', fixture));
    const viewport = page.getByTestId('viewport');
    await expect(viewport).toBeVisible();
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    await expect(page.getByTestId('viewport-error')).toHaveCount(0);
    await expect
      .poll(() =>
        viewport
          .locator('canvas')
          .first()
          .evaluate((canvas: HTMLCanvasElement) => {
            const context = canvas.getContext('2d');
            return (
              context
                ?.getImageData(0, 0, canvas.width, canvas.height)
                .data.some((value, index) => index % 4 !== 3 && value > 30) ?? false
            );
          }),
      )
      .toBe(true);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
