import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocalStudy } from '../dicom/types';
import { navigate } from '../../lib/navigation';

function reconcile(previous: LocalStudy[], next: LocalStudy[]) {
  return next.map((study) => {
    const old = previous.find((s) => s.id === study.id);
    if (!old) return study;
    const series = study.series.map(
      (series) =>
        old.series.find(
          (s) => s.id === series.id && s.instances.length === series.instances.length,
        ) ?? series,
    );
    return series.length === old.series.length && series.every((s, i) => s === old.series[i])
      ? old
      : { ...study, series };
  });
}
export function useLocalSession(notify: (message: string) => void) {
  const [studies, setStudies] = useState<LocalStudy[]>([]);
  const [clearing, setClearing] = useState(false);
  const cleanup = useRef<Promise<void> | null>(null);
  const knownIds = useMemo(
    () =>
      new Set(
        studies.flatMap((study) =>
          study.series.flatMap((series) => series.instances.map((i) => i.id)),
        ),
      ),
    [studies],
  );
  const commit = useCallback((catalog: LocalStudy[]) => {
    setStudies((previous) => reconcile(previous, catalog));
    navigate('/viewer');
  }, []);
  const clear = useCallback(() => {
    setStudies([]);
    setClearing(true);
    navigate('/');
  }, []);
  // The effect runs after viewports unmount, so their rendering resources are no longer in use.
  useEffect(() => {
    if (!clearing) return;
    cleanup.current ??= import('../viewer/runtime').then((runtime) =>
      runtime.clearSessionResources(),
    );
    void cleanup.current
      .then(() => notify('Session cleared. Local files have been released.'))
      .catch(() =>
        notify(
          'Session cleanup could not finish. Refresh this tab to release remaining resources.',
        ),
      )
      .finally(() => {
        cleanup.current = null;
        setClearing(false);
      });
  }, [clearing, notify]);
  return { studies, knownIds, clearing, commit, clear };
}
