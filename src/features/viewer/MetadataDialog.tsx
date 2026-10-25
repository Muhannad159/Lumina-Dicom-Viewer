import Modal from '../../components/Modal';
export default function MetadataDialog({
  metadata,
  onClose,
}: {
  metadata: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <Modal title="Image metadata" onClose={onClose} wide>
      <div className="max-h-[64dvh] overflow-auto">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {Object.entries(metadata).map(([key, value]) => (
              <tr key={key} className="border-b border-line">
                <th className="w-[42%] p-3 text-left align-top font-normal break-words text-muted">
                  {key}
                </th>
                <td className="p-3 align-top break-words">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
