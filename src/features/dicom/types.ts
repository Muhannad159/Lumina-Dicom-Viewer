export interface LocalInstance {
  id: string;
  studyUID: string;
  seriesUID: string;
  fileName: string;
  relativePath: string;
  instanceNumber?: number;
  position?: number[];
  orientation?: number[];
  pixelSpacing?: number[];
  frameOfReferenceUID?: string;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  windowCenter?: number;
  windowWidth?: number;
  samplesPerPixel?: number;
  photometricInterpretation?: string;
  frames: number;
  rows: number;
  columns: number;
  transferSyntax: string;
  patientName: string;
  patientId: string;
  patientSex: string;
  patientAge: string;
  studyDescription: string;
  studyDate: string;
  seriesDescription: string;
  seriesNumber?: number;
  modality: string;
  tags: Record<string, string>;
}
export interface LocalSeries {
  id: string;
  studyUID: string;
  description: string;
  number?: number;
  modality: string;
  instances: LocalInstance[];
  frameCount: number;
}
export interface LocalStudy {
  id: string;
  patientName: string;
  patientId: string;
  description: string;
  date: string;
  series: LocalSeries[];
}
export interface ImportIssue {
  fileName: string;
  reason: string;
  kind: 'duplicate' | 'unsupported' | 'failed';
}
export interface ImportResult {
  imported: number;
  duplicates: number;
  unsupported: number;
  failed: number;
  issues: ImportIssue[];
}
export interface ImportProgress {
  phase: 'Discovering' | 'Reading' | 'Preparing';
  completed: number;
  total: number;
}
export interface ImportFile {
  file: File;
  relativePath: string;
}
export interface ParsedFile {
  instance: LocalInstance;
  file: File;
}
export type ParseResult =
  { instance: LocalInstance } | { kind: 'unsupported' | 'failed'; reason: string };
export type Layout = '1x1' | '1x2' | '2x1' | '2x2';
export interface ViewportAssignment {
  viewportId: string;
  seriesId: string | null;
}
export interface ImageFrame {
  imageId: string;
  instance: LocalInstance;
  frame: number;
}
export type Theme = 'dark' | 'light' | 'blue' | 'green';
