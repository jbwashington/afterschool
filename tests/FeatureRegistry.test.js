import { describe, it, expect, beforeEach } from 'vitest'
import { FeatureRegistry } from '../server/features/FeatureRegistry.js'
import { GameState } from '../server/rooms/GameState.js'
import { CARD_CATEGORIES } from '../shared/constants.js'

describe('FeatureRegistry', () => {
  let registry
  let gameState

  beforeEach(() => {
    registry = new FeatureRegistry()
    gameState = new GameState()
  })

  describe('initialization', () => {
    it('should load feature templates', () => {
      expect(registry.features.size).toBeGreaterThan(0)
    })

    it('should have features from all categories', () => {
      const categories = new Set()
      for (const feature of registry.features.values()) {
        categories.add(feature.category)
      }
      expect(categories.has(CARD_CATEGORIES.BUILD)).toBe(true)
      expect(categories.has(CARD_CATEGORIES.RULES)).toBe(true)
      expect(categories.has(CARD_CATEGORIES.DECOR)).toBe(true)
      expect(categories.has(CARD_CATEGORIES.EVENTS)).toBe(true)
    })
  })

  describe('card generation', () => {
    it('should generate 2-4 cards', () => {
      const cards = registry.generateCards(gameState, 1)
      expect(cards.length).toBeGreaterThanOrEqual(2)
      expect(cards.length).toBeLessThanOrEqual(4)
    })

    it('should not include already applied features', () => {
      // Apply a feature
      const cards1 = registry.generateCards(gameState, 1)
      const firstCard = cards1[0]
      registry.applyCard(firstCard, gameState)

      // Generate new cards - should not include the applied one
      const cards2 = registry.generateCards(gameState, 2)
      const cardIds = cards2.map(c => c.id)
      expect(cardIds).not.toContain(firstCard.id)
    })

    it('should return cards with required fields', () => {
      const cards = registry.generateCards(gameState, 1)
      for (const card of cards) {
        expect(card).toHaveProperty('id')
        expect(card).toHaveProperty('name')
        expect(card).toHaveProperty('description')
        expect(card).toHaveProperty('category')
      }
    })
  })

  describe('card application', () => {
    it('should apply a valid card', () => {
      const cards = registry.generateCards(gameState, 1)
      const buildCard = cards.find(c => c.category === CARD_CATEGORIES.BUILD)

      if (buildCard) {
        const feature = registry.applyCard(buildCard, gameState)
        expect(feature).not.toBeNull()
        expect(feature.name).toBe(buildCard.name)
      }
    })

    it('should reject unknown cards', () => {
      const fakeCard = { id: 'fake_card_123' }
      const feature = registry.applyCard(fakeCard, gameState)
      expect(feature).toBeNull()
    })

    it('should respect maxCount constraints', () => {
      const cards = registry.generateCards(gameState, 1)
      const card = cards[0]

      // Get the feature to check its constraints
      const originalFeature = registry.getFeature(card.id)
      if (originalFeature?.constraints?.maxCount === 1) {
        // Apply once - should succeed
        const result1 = registry.applyCard(card, gameState)
        expect(result1).not.toBeNull()

        // Apply again - should fail
        const result2 = registry.applyCard(card, gameState)
        expect(result2).toBeNull()
      }
    })
  })

  describe('validation', () => {
    it('should validate entity count limits', () => {
      // Fill up entities near the limit
      for (let i = 0; i < 48; i++) {
        gameState.spawnEntity({ type: 'decoration' })
      }

      // Try to apply a feature that spawns multiple entities
      const featureWithManySpawns = registry.features.values().next().value
      if (featureWithManySpawns?.spawn?.length > 2) {
        const isValid = registry.validateFeature(featureWithManySpawns, gameState)
        expect(isValid).toBe(false)
      }
    })
  })
})
