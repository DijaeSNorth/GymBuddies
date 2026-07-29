import { ASSET_MANIFEST } from './manifest';

export function joinAssetUrl(
  baseUrl: string,
  manifestBasePath: string,
  relativePath: string,
) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedManifestPath = manifestBasePath.replace(/^\/+|\/+$/g, '');
  const normalizedRelativePath = relativePath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedManifestPath}/${normalizedRelativePath}`;
}

export function resolveAssetUrl(relativePath: string) {
  return joinAssetUrl(
    import.meta.env.BASE_URL,
    ASSET_MANIFEST.basePath,
    relativePath,
  );
}

export function resolveAssetKeyUrl(key: string) {
  const asset = ASSET_MANIFEST.assets.find((entry) => entry.key === key);
  if (!asset) throw new Error(`Unknown asset key "${key}".`);
  return resolveAssetUrl(asset.path);
}
