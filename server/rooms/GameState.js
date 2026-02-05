import { GAME, ENTITY_TYPES } from '../../shared/constants.js'

export class GameState {
  constructor() {
    this.entities = new Map()
    this.nextEntityId = 1
    this.activeRules = []
    this.appliedFeatureIds = []

    // Initialize default world
    this.initializeWorld()
  }

  initializeWorld() {
    // Add ground plane
    this.spawnEntity({
      type: ENTITY_TYPES.GROUND,
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 20, y: 0.1, z: 20 },
      color: 0x7ec850,
    })
  }

  get entityCount() {
    return this.entities.size
  }

  canSpawnEntity() {
    return this.entityCount < GAME.MAX_ENTITIES
  }

  spawnEntity(config) {
    if (!this.canSpawnEntity()) {
      console.log('[gamestate] Entity limit reached')
      return null
    }

    const entity = {
      id: `entity_${this.nextEntityId++}`,
      type: config.type || ENTITY_TYPES.DECORATION,
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      scale: config.scale || { x: 1, y: 1, z: 1 },
      color: config.color || 0xffffff,
      mesh: config.mesh || 'box',
      animation: config.animation || null,
      metadata: config.metadata || {},
    }

    this.entities.set(entity.id, entity)
    return entity
  }

  removeEntity(entityId) {
    return this.entities.delete(entityId)
  }

  getEntity(entityId) {
    return this.entities.get(entityId)
  }

  updateEntity(entityId, updates) {
    const entity = this.entities.get(entityId)
    if (!entity) return null

    Object.assign(entity, updates)
    return entity
  }

  addRule(rule) {
    this.activeRules.push(rule)
  }

  removeRule(ruleId) {
    this.activeRules = this.activeRules.filter(r => r.id !== ruleId)
  }

  processAudioSignal(playerId, signal) {
    const updates = []

    // Check rules that respond to audio
    for (const rule of this.activeRules) {
      if (rule.trigger === 'audio') {
        const result = this.evaluateAudioRule(rule, playerId, signal)
        if (result) {
          updates.push(result)
        }
      }
    }

    return updates.length > 0 ? updates : null
  }

  evaluateAudioRule(rule, playerId, signal) {
    // signal: { volume, peak, rhythm }
    if (rule.condition === 'clap' && signal.peak > 0.8) {
      return this.executeRuleEffect(rule)
    }
    if (rule.condition === 'loud' && signal.volume > 0.6) {
      return this.executeRuleEffect(rule)
    }
    return null
  }

  executeRuleEffect(rule) {
    switch (rule.effect.type) {
      case 'change_color':
        const entity = this.entities.get(rule.effect.targetId)
        if (entity) {
          entity.color = rule.effect.color
          return { type: 'color_change', entityId: entity.id, color: entity.color }
        }
        break
      case 'spawn':
        const spawned = this.spawnEntity(rule.effect.config)
        if (spawned) {
          return { type: 'spawn', entity: spawned }
        }
        break
    }
    return null
  }

  applyFeature(feature) {
    this.appliedFeatureIds.push(feature.id)

    const results = []

    // Process spawns
    if (feature.spawn) {
      for (const spawnConfig of feature.spawn) {
        const entity = this.spawnEntity(spawnConfig)
        if (entity) {
          results.push({ action: 'spawn', entity })
        }
      }
    }

    // Process rules
    if (feature.rules) {
      for (const rule of feature.rules) {
        this.addRule({
          ...rule,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })
        results.push({ action: 'add_rule', rule })
      }
    }

    return results
  }

  serialize() {
    return {
      entities: Array.from(this.entities.values()),
      rules: this.activeRules,
      appliedFeatureIds: this.appliedFeatureIds,
      entityCount: this.entityCount,
    }
  }

  // Reconstruct state from seed and feature IDs (for session recovery)
  static reconstruct(seed, featureIds, featureRegistry) {
    const state = new GameState()
    // TODO: Apply seed for randomization
    for (const featureId of featureIds) {
      const feature = featureRegistry.getFeature(featureId)
      if (feature) {
        state.applyFeature(feature)
      }
    }
    return state
  }
}
