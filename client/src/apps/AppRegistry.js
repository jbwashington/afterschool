export class AppRegistry {
  constructor() {
    this.apps = new Map()
  }

  register(appId, appDefinition) {
    this.apps.set(appId, appDefinition)
  }

  get(appId) {
    return this.apps.get(appId)
  }

  has(appId) {
    return this.apps.has(appId)
  }

  getAll() {
    return Array.from(this.apps.entries())
  }

  unregister(appId) {
    this.apps.delete(appId)
  }
}
