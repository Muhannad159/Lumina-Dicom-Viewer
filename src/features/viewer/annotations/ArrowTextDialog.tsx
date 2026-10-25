import { useSyncExternalStore } from 'react';
import AnnotationLabelDialog from './AnnotationLabelDialog';
import { finishTextRequest, getTextRequest, subscribeTextRequest } from './textRequest';

export default function ArrowTextDialog() {
  const request = useSyncExternalStore(subscribeTextRequest, getTextRequest);
  return request ? (
    <AnnotationLabelDialog
      initialValue={request.initialValue}
      onSave={finishTextRequest}
      onCancel={() => finishTextRequest()}
    />
  ) : null;
}
