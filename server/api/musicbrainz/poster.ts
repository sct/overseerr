import type { mbRelease, mbReleaseGroup } from './interfaces';
function getPosterFromMB(
  element: mbRelease | mbReleaseGroup
): string | undefined {
  return `https://coverartarchive.org/${element.media_type}/${element.id}/front-250.jpg`;
}

export default getPosterFromMB;
