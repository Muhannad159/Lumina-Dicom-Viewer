import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { dicomFixture } from '../fixtures.mjs';

test('production assets, workers and codecs work under a static hosting subdirectory', async ({
  page,
}) => {
  const root = path.resolve('dist');
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (!pathname.startsWith('/lumina/')) {
        response.writeHead(404).end();
        return;
      }
      const relativePath = pathname.slice('/lumina/'.length);
      const file = path.resolve(
        root,
        relativePath === 'viewer' ? 'index.html' : relativePath || 'index.html',
      );
      if (!file.startsWith(root + path.sep)) {
        response.writeHead(404).end();
        return;
      }
      const bytes = await readFile(file);
      response
        .writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
        .end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  const failed: string[] = [];
  const uploads: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  page.on('request', (request) => {
    if (request.method() !== 'GET') uploads.push(request.url());
  });
  try {
    await page.goto(`${origin}/lumina/viewer`);
    await expect(
      page.getByRole('heading', { name: 'Your studies. A new perspective.' }),
    ).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/lumina/');
    expect(new URL(page.url()).hash).toBe('');
    await page.getByLabel('Open DICOM files').setInputFiles({
      name: 'compressed.dcm',
      mimeType: 'application/dicom',
      buffer: dicomFixture({ compressed: true }),
    });
    await expect(page.getByTestId('viewport')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/lumina/viewer');
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.getByTestId('viewport-loading')).toHaveCount(0);
    await expect(page.getByTestId('viewport-error')).toHaveCount(0);
    expect(failed).toEqual([]);
    expect(uploads).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
