import { useEffect, useState } from 'react';
import { cache, Enums, eventTarget, metaData, volumeLoader, type Types } from '@cornerstonejs/core';
import type { LocalSeries } from '../../dicom/types';
import { framesFor, trackTask } from '../runtime';
import { indexedMetadata } from './indexedMetadata';
import { reserveVolumeCache } from './volumeCache';
import { validVolumeImage } from './validVolumeImage';

export function useMprVolume(series: LocalSeries) {
  const [progress, setProgress] = useState(0);
  const [volumeId, setVolumeId] = useState<string>();
  const [error, setError] = useState('');
  const total = series.frameCount;

  useEffect(() => {
    let alive = true;
    let progressFrame = 0;
    let completed = 0;
    let invalid = false;
    const id = `cornerstoneStreamingImageVolume:lumina-${crypto.randomUUID()}`;
    const images = new Map(framesFor(series).map((frame) => [frame.imageId, frame.instance]));
    const provider = (type: string, imageId: unknown) => {
      const image = typeof imageId === 'string' ? images.get(imageId) : undefined;
      return image ? indexedMetadata(type, image) : undefined;
    };
    metaData.addProvider(provider, -1000);
    const release = reserveVolumeCache(id, series);
    const modified = (event: Event) => {
      const detail = (event as CustomEvent<{ volumeId: string; framesProcessed: number }>).detail;
      if (alive && detail.volumeId === id) {
        completed = detail.framesProcessed;
        if (!progressFrame)
          progressFrame = requestAnimationFrame(() => {
            progressFrame = 0;
            if (alive) setProgress(completed);
          });
      }
    };
    const rejectImage = (imageId: string) => {
      if (alive && images.has(imageId)) {
        invalid = true;
        cache.getVolume(id)?.cancelLoading();
        setError('A slice could not be decoded. Return to the viewer to inspect this series.');
      }
    };
    const failed = (event: Event) =>
      rejectImage((event as CustomEvent<{ imageId: string }>).detail.imageId);
    const validate = (image: Types.IImage) => {
      const instance = images.get(image.imageId);
      if (instance && !validVolumeImage(image, instance)) rejectImage(image.imageId);
    };
    const loaded = (event: Event) =>
      validate((event as CustomEvent<{ image: Types.IImage }>).detail.image);
    eventTarget.addEventListener(Enums.Events.IMAGE_VOLUME_MODIFIED, modified);
    eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_ERROR, failed);
    eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_FAILED, failed);
    eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, loaded);
    const load = async () => {
      const volume = await trackTask(
        volumeLoader.createAndCacheVolume(id, { imageIds: [...images.keys()] }),
      );
      if (!alive) {
        cache.removeVolumeLoadObject(id);
        return;
      }
      setVolumeId(id);
      images.forEach((_, imageId) => {
        const image = cache.getImage(imageId);
        if (image) validate(image);
      });
      if (!invalid) volume.load();
    };
    void load().catch(() => {
      if (alive) setError('This stack could not be reconstructed. Try another series.');
    });
    return () => {
      alive = false;
      cancelAnimationFrame(progressFrame);
      eventTarget.removeEventListener(Enums.Events.IMAGE_VOLUME_MODIFIED, modified);
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOAD_ERROR, failed);
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOAD_FAILED, failed);
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOADED, loaded);
      metaData.removeProvider(provider);
      cache.getVolume(id)?.cancelLoading();
      queueMicrotask(() => {
        if (cache.getVolume(id)) cache.removeVolumeLoadObject(id);
        release();
      });
    };
  }, [series]);
  return { volumeId, progress, total, error };
}
