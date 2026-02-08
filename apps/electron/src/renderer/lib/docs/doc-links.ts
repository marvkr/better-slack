// Documentation links
export type DocFeature = 'gettingStarted' | 'api' | 'guides' | 'reference'

export const docLinks: Record<DocFeature, string> = {
  gettingStarted: 'https://docs.example.com/getting-started',
  api: 'https://docs.example.com/api',
  guides: 'https://docs.example.com/guides',
  reference: 'https://docs.example.com/reference',
}

export function getDocUrl(feature: DocFeature): string {
  return docLinks[feature] || docLinks.gettingStarted
}
