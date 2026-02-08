// Views
export interface View {
  id: string
  name: string
  type: string
}

export function getView(id: string): View | undefined {
  return undefined
}

export function compileAllViews(views: View[]): any {
  return {}
}

export function evaluateViews(context: any, views: View[]): View[] {
  return views
}

export function buildViewContext(data: any): any {
  return data
}
