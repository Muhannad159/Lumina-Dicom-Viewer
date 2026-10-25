import { useCallback, useEffect, useState } from 'react';
export function useNotification() {
  const [notice, setNotice] = useState('');
  const notify = useCallback((message: string) => setNotice(message), []);
  const dismiss = useCallback(() => setNotice(''), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, 6500);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);
  return { notice, notify, dismiss };
}
