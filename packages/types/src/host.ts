export function hostProfileHref(host: {
  id: string;
  username?: string | null;
}): `/hosts/${string}` {
  const username = host.username?.trim();
  if (username && username !== host.id) {
    return `/hosts/${encodeURIComponent(username)}`;
  }
  return `/hosts/${encodeURIComponent(host.id)}`;
}
