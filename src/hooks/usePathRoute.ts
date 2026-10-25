import { useEffect, useState } from 'react';
import { appPath, navigate } from '../lib/navigation';

export function usePathRoute(hasStudies: boolean) {
  const [route, setRoute] = useState(location.pathname);

  useEffect(() => {
    const changed = () => setRoute(location.pathname);
    window.addEventListener('popstate', changed);
    return () => window.removeEventListener('popstate', changed);
  }, []);

  useEffect(() => {
    if (location.hash === '#/' || location.hash === '#/viewer') navigate('/', true);
  }, []);

  useEffect(() => {
    if (!hasStudies && route === appPath('/viewer')) navigate('/', true);
  }, [hasStudies, route]);

  return route === appPath('/viewer') && hasStudies;
}
