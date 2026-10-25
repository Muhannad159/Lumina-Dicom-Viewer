import type { Types } from '@cornerstonejs/core';
import type { LocalSeries, LocalStudy } from '../dicom/types';
export interface ViewportHandle {
  viewport: Types.IStackViewport;
  element: HTMLDivElement;
  series: LocalSeries;
  study: LocalStudy;
}
export type ViewerAction =
  | 'rotate'
  | 'flipH'
  | 'flipV'
  | 'invert'
  | 'reset'
  | 'delete'
  | 'clear'
  | 'screenshot'
  | 'fullscreen'
  | 'measurements'
  | 'bookmark'
  | 'bookmarks'
  | 'metadata';
