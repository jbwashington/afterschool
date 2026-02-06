import { CARD_CATEGORIES, ENTITY_TYPES } from '../../shared/constants.js'
import { featureTemplates } from './templates.js'

export class FeatureRegistry {
  constructor() {
    this.features = new Map()
    this.loadFeatures()
  }

  loadFeatures() {
    for (const feature of featureTemplates) {
      this.features.set(feature.id, feature)
    }
    console.log(`[features] Loaded ${this.features.size} feature templates`)
  }

  getFeature(featureId) {
    return this.features.get(featureId)
  }

  generateCards(gameState, turn) {
    // Generate 2-4 cards appropriate for current game state
    const cards = []
    const availableFeatures = Array.from(this.features.values())

    // Filter out already applied features
    const unusedFeatures = availableFeatures.filter(
      f => !gameState.appliedFeatureIds.includes(f.id)
    )

    // If world is empty, prioritize starter cards (ground types)
    const worldIsEmpty = gameState.entityCount === 0
    if (worldIsEmpty) {
      const starterCards = unusedFeatures.filter(f => f.starter === true)
      if (starterCards.length > 0) {
        // Return all available starter cards so kids can choose their ground
        return starterCards.slice(0, 4).map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          category: f.category,
          icon: f.icon,
        }))
      }
    }

    // Select cards based on turn progression
    const cardCount = Math.min(4, Math.max(2, unusedFeatures.length))

    // Prioritize different categories for variety
    const categories = Object.values(CARD_CATEGORIES)
    const selectedIds = new Set()

    for (let i = 0; i < cardCount; i++) {
      const preferredCategory = categories[i % categories.length]
      // Exclude starter cards from normal rotation (they're for empty worlds)
      const candidates = unusedFeatures.filter(
        f => f.category === preferredCategory && !selectedIds.has(f.id) && !f.starter
      )

      let selected
      if (candidates.length > 0) {
        selected = candidates[Math.floor(Math.random() * candidates.length)]
      } else {
        // Fallback to any unused non-starter feature
        const fallback = unusedFeatures.filter(f => !selectedIds.has(f.id) && !f.starter)
        if (fallback.length > 0) {
          selected = fallback[Math.floor(Math.random() * fallback.length)]
        }
      }

      if (selected) {
        selectedIds.add(selected.id)
        cards.push({
          id: selected.id,
          name: selected.name,
          description: selected.description,
          category: selected.category,
          icon: selected.icon,
        })
      }
    }

    return cards
  }

  applyCard(card, gameState) {
    const feature = this.features.get(card.id)
    if (!feature) {
      console.log(`[features] Unknown feature: ${card.id}`)
      return null
    }

    // Validate feature constraints
    if (!this.validateFeature(feature, gameState)) {
      console.log(`[features] Feature validation failed: ${card.id}`)
      return null
    }

    // Apply the feature to game state
    const results = gameState.applyFeature(feature)

    return {
      id: feature.id,
      name: feature.name,
      results,
    }
  }

  validateFeature(feature, gameState) {
    // Check entity count limits
    if (feature.spawn) {
      const spawnCount = feature.spawn.length
      if (gameState.entityCount + spawnCount > 50) {
        return false
      }
    }

    // Check constraints
    if (feature.constraints) {
      if (feature.constraints.maxCount) {
        const existing = gameState.appliedFeatureIds.filter(
          id => id === feature.id
        ).length
        if (existing >= feature.constraints.maxCount) {
          return false
        }
      }
    }

    return true
  }
}
