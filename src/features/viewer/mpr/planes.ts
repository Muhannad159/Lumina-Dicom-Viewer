import { Enums } from '@cornerstonejs/core';

export const planes = [
  { name: 'Axial', orientation: Enums.OrientationAxis.AXIAL, color: '#fb7185' },
  { name: 'Sagittal', orientation: Enums.OrientationAxis.SAGITTAL, color: '#fbbf24' },
  { name: 'Coronal', orientation: Enums.OrientationAxis.CORONAL, color: '#38bdf8' },
] as const;
