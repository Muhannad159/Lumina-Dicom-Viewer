import { useEffect, useState } from 'react';
export function useHashRoute(hasStudies: boolean) {
  const [route, setRoute] = useState(location.hash);
  useEffect(() => {
    const changed = () => setRoute(location.hash);
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (!hasStudies && route === '#/viewer') location.replace('#/');
  }, [hasStudies, route]);
  return route === '#/viewer' && hasStudies;
}
