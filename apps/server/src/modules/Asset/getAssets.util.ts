const CDN_BASE = 'https://cdn.edulaunch.shop'

export const getAssetUrl = (
  tenantId: string,
  _path: string,
  imageId: string,
  variant: string,
) => `${CDN_BASE}/${tenantId}/${imageId}/${variant}.webp`
