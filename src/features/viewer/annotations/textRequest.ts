import type { Types } from '@cornerstonejs/tools';

interface TextRequest {
  element: HTMLDivElement;
  initialValue: string;
  finish: (value: string) => void;
}
let current: TextRequest | null = null;
const listeners = new Set<() => void>();
export const getTextRequest = () => current;
export function subscribeTextRequest(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function finishTextRequest(value?: string) {
  const request = current;
  current = null;
  listeners.forEach((listener) => listener());
  if (request?.element.isConnected) request.finish(value ?? request.initialValue);
}
export function cancelTextRequest(element: HTMLDivElement) {
  if (current?.element === element) finishTextRequest();
}
export function arrowTextConfiguration(element: HTMLDivElement) {
  const request = (initialValue: string, finish: (value: string) => void) => {
    if (current) finishTextRequest();
    current = { element, initialValue, finish };
    listeners.forEach((listener) => listener());
  };
  return {
    getTextCallback: (finish: (value: string) => void) => request('', finish),
    changeTextCallback: (
      item: Types.Annotation,
      _event: unknown,
      finish: (value: string) => void,
    ) => request(item.data.label ?? '', finish),
  };
}
