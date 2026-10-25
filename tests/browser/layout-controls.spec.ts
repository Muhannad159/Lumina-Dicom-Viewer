import { test, expect } from '@playwright/test';
import { sampleFiles } from '../fixtures.mjs';

test('toolbar centers when it fits and remains a single reachable row when it overflows', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByLabel('Viewport layout')).toBeVisible();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  const toolbar = page.getByTestId('viewer-toolbar');
  const controls = page.getByTestId('toolbar-controls');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
    await toolbar.evaluate((element) => {
      element.scrollLeft = 0;
    });
    const outer = (await toolbar.boundingBox())!;
    const inner = (await controls.boundingBox())!;
    if (inner.width <= outer.width - 16)
      expect(Math.abs(inner.x + inner.width / 2 - (outer.x + outer.width / 2))).toBeLessThan(2);
    else expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(await controls.evaluate((element) => getComputedStyle(element).flexWrap)).toBe('nowrap');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'More tools', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'More tools options' });
    await expect(menu).toBeVisible();
    const menuBox = (await menu.boundingBox())!;
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(1000);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'More tools', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'More tools', exact: true }).click();
    await page
      .getByTestId('dicom-canvas')
      .first()
      .click({ position: { x: 15, y: 15 } });
    await expect(menu).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await expect(
    page.getByTestId('viewer').getByRole('dialog', { name: 'More tools options' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
});

test('vertical slice slider supports endpoints, keyboard, wheel, cine and independent layouts', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Image slice' })).toBeVisible();
  for (const layout of ['1x1', '1x2', '2x1', '2x2']) {
    await page.getByLabel('Viewport layout').selectOption(layout);
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    const first = page.getByTestId('viewport').first();
    const slider = first.getByRole('slider', { name: 'Image slice' });
    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    const box = (await slider.boundingBox())!;
    expect(box.height).toBeGreaterThan(box.width);
    await slider.click({ position: { x: box.width / 2, y: box.height - 3 } });
    await expect(first.getByTestId('slice-counter')).toHaveText('5 / 5');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Image 5 of 5');
    await slider.click({ position: { x: box.width / 2, y: 3 } });
    await expect(first.getByTestId('slice-counter')).toHaveText('1 / 5');
    await slider.press('ArrowDown');
    await expect(slider).toHaveValue('1');
    await slider.press('End');
    await expect(slider).toHaveValue('4');
    await slider.press('Home');
    await expect(slider).toHaveValue('0');
    await slider.press('PageDown');
    await expect(slider).toHaveValue('4');
    await slider.press('ArrowUp');
    await expect(slider).toHaveValue('3');
    if (layout !== '1x1')
      await expect(page.getByTestId('viewport').nth(1).getByTestId('slice-counter')).toHaveText(
        '1 / 5',
      );
  }
  await page.getByLabel('Viewport layout').selectOption('1x1');
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  const slider = page.getByRole('slider', { name: 'Image slice' });
  await page.getByTestId('dicom-canvas').hover();
  await page.mouse.wheel(0, 150);
  await expect(slider).not.toHaveValue('0');
  await slider.press('Home');
  await page.getByLabel('Play cine', { exact: true }).click();
  await expect(slider).not.toHaveValue('0');
  await page.getByLabel('Pause cine', { exact: true }).click();
  await slider.press('End');
  for (const theme of ['light', 'blue', 'green', 'dark']) {
    await page.getByRole('button', { name: 'Choose theme', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Choose theme options' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await expect(slider).toHaveValue('4');
    await page.screenshot({ path: `test-results/vertical-viewer-${theme}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(slider).toHaveValue('4');
  const mobile = (await slider.boundingBox())!;
  expect(mobile.height).toBeGreaterThan(mobile.width);
  await page.getByRole('button', { name: /RLE compressed image/ }).click();
  await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Image slice' })).toHaveCount(0);
});

test.describe('touch slider', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('vertical dragging changes slices without drawing a measurement', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open DICOM files').setInputFiles(sampleFiles());
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    const slider = page.getByRole('slider', { name: 'Image slice' });
    await expect(slider).toBeVisible();
    await page.getByLabel('Length (L)', { exact: true }).tap();
    const box = (await slider.boundingBox())!;
    const session = await page.context().newCDPSession(page);
    const x = box.x + box.width / 2;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: box.y + 8 }],
    });
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: box.y + 8 + ((box.height - 16) * step) / 8 }],
      });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(slider).toHaveValue('4');
    await expect(page.getByTestId('viewport').locator('svg line')).toHaveCount(0);
    await session.detach();
    await page.screenshot({ path: 'test-results/vertical-slider-mobile.png' });
  });
});
