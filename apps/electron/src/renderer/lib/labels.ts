// Labels
export interface Label {
  id: string
  name: string
  color?: string
  children?: Label[]
  parentId?: string
}

export interface LabelTree extends Label {
  children: LabelTree[]
}

export function getLabel(id: string): Label | undefined {
  return undefined
}

export function flattenLabels(labels: Label[]): Label[] {
  const result: Label[] = []
  function flatten(label: Label) {
    result.push(label)
    if (label.children) {
      label.children.forEach(flatten)
    }
  }
  labels.forEach(flatten)
  return result
}

export function parseLabelEntry(entry: string): { id: string; value?: string } | null {
  return null
}

export function formatLabelEntry(id: string, value?: string): string {
  return value ? `${id}:${value}` : id
}

export function buildLabelTree(labels: Label[]): LabelTree[] {
  return []
}

export function getDescendantIds(labelId: string, labels: Label[]): string[] {
  return []
}

export function getLabelDisplayName(labelId: string, labels: Label[]): string {
  return labelId
}

export function extractLabelIds(text: string): string[] {
  return []
}

export function extractLabelId(text: string): string | null {
  return null
}

export function findLabelById(id: string, labels: Label[]): Label | undefined {
  return labels.find(l => l.id === id)
}

export function formatDisplayValue(value: string): string {
  return value
}
