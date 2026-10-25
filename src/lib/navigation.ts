export type AppRoute = '/' | '/viewer';

function basePath() {
  if (import.meta.env.BASE_URL !== './') return import.meta.env.BASE_URL;
  if (location.pathname.endsWith('/viewer')) {
    return location.pathname.slice(0, -'viewer'.length);
  }
  return location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;
}

const base = basePath();

export function appPath(route: AppRoute) {
  return route === '/' ? base : `${base}viewer`;
}

export function navigate(route: AppRoute, replace = false) {
  const path = appPath(route);
  if (location.pathname === path && !location.hash) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
