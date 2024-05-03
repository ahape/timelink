export class Lookup<T> {
  private data: Record<string, T[]> = {}

  get(k: string): T[] {
    return this.data[k] ?? []
  }

  addOrUpdate(k: string, v: T) {
    const values = (this.data[k] ??= [])
    values.push(v)
  }

  pairs(): Array<[string, T[]]> {
    return Object.entries(this.data)
  }

  clear() {
    this.data = {}
  }
}
