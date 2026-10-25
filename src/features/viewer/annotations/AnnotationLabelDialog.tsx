import { useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';

export default function AnnotationLabelDialog({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <Modal title="Annotation label" onClose={onCancel}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSave(value.trim());
        }}
      >
        <label className="grid gap-2 text-sm">
          Label
          <input
            autoFocus
            value={value}
            maxLength={200}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Describe this finding"
            className="min-h-11 rounded-lg border border-line bg-background px-3 text-foreground"
          />
        </label>
        <p className="mt-2 text-xs text-muted">Saved in this session only.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!value.trim()}>
            Save label
          </Button>
        </div>
      </form>
    </Modal>
  );
}
