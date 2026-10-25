import type { ViewportHandle } from './types';
export async function capture(handle: ViewportHandle): Promise<HTMLCanvasElement> {
  const source = handle.viewport.getCanvas();
  handle.viewport.render();
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(source, 0, 0);
  const svg = handle.element.querySelector('svg');
  if (svg) {
    const copy = svg.cloneNode(true) as SVGElement;
    const bounds = handle.element.getBoundingClientRect();
    copy.setAttribute('width', String(bounds.width));
    copy.setAttribute('height', String(bounds.height));
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }),
    );
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  context.font = `${Math.max(12, Math.round(canvas.width / 70))}px sans-serif`;
  context.fillStyle = '#ffffff';
  context.shadowColor = '#000000';
  context.shadowBlur = 4;
  context.fillText(handle.study.patientName, 16, 24);
  context.fillText(`${handle.study.description} · ${handle.series.description}`, 16, 46);
  return canvas;
}
