import { CARD_CATEGORIES, ENTITY_TYPES } from '../../shared/constants.js'

// Feature templates - bounded, pre-approved actions
export const featureTemplates = [
  // STARTER cards - basic world building blocks
  {
    id: 'grass_ground',
    name: 'Create Grass Field',
    description: 'A big grassy field to build on!',
    category: CARD_CATEGORIES.BUILD,
    icon: '🌿',
    starter: true,
    spawn: [
      {
        type: ENTITY_TYPES.GROUND,
        mesh: 'ground',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 0.1, z: 20 },
        color: 0x7ec850,
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'sand_ground',
    name: 'Create Sandy Beach',
    description: 'A warm sandy area for the town!',
    category: CARD_CATEGORIES.BUILD,
    icon: '🏖️',
    starter: true,
    spawn: [
      {
        type: ENTITY_TYPES.GROUND,
        mesh: 'ground',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 0.1, z: 20 },
        color: 0xf4d03f,
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'snow_ground',
    name: 'Create Snowy Land',
    description: 'A magical snowy wonderland!',
    category: CARD_CATEGORIES.BUILD,
    icon: '❄️',
    starter: true,
    spawn: [
      {
        type: ENTITY_TYPES.GROUND,
        mesh: 'ground',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 0.1, z: 20 },
        color: 0xf0f8ff,
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'stone_ground',
    name: 'Create Stone Plaza',
    description: 'A solid stone foundation!',
    category: CARD_CATEGORIES.BUILD,
    icon: '🪨',
    starter: true,
    spawn: [
      {
        type: ENTITY_TYPES.GROUND,
        mesh: 'ground',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 0.1, z: 20 },
        color: 0x808080,
      },
    ],
    constraints: { maxCount: 1 },
  },

  // BUILD category
  {
    id: 'playground',
    name: 'Add a Playground',
    description: 'A colorful playground appears in town!',
    category: CARD_CATEGORIES.BUILD,
    icon: '🎠',
    spawn: [
      {
        type: ENTITY_TYPES.PLAYGROUND,
        mesh: 'playground',
        position: { x: 3, y: 0, z: 3 },
        scale: { x: 2, y: 2, z: 2 },
        color: 0xff6b6b,
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'house_small',
    name: 'Build a Small House',
    description: 'A cozy little house for the townsfolk',
    category: CARD_CATEGORIES.BUILD,
    icon: '🏠',
    spawn: [
      {
        type: ENTITY_TYPES.BUILDING,
        mesh: 'house',
        position: { x: -4, y: 0, z: 2 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
        color: 0xffd93d,
      },
    ],
    constraints: { maxCount: 5 },
  },
  {
    id: 'tree_group',
    name: 'Plant Some Trees',
    description: 'Three friendly trees grow in the town',
    category: CARD_CATEGORIES.BUILD,
    icon: '🌳',
    spawn: [
      {
        type: ENTITY_TYPES.TREE,
        mesh: 'tree',
        position: { x: 5, y: 0, z: -3 },
        scale: { x: 1, y: 1.5, z: 1 },
        color: 0x2d5a27,
      },
      {
        type: ENTITY_TYPES.TREE,
        mesh: 'tree',
        position: { x: 6, y: 0, z: -2 },
        scale: { x: 0.8, y: 1.2, z: 0.8 },
        color: 0x3d7a37,
      },
      {
        type: ENTITY_TYPES.TREE,
        mesh: 'tree',
        position: { x: 4.5, y: 0, z: -4 },
        scale: { x: 1.2, y: 1.8, z: 1.2 },
        color: 0x2d6a27,
      },
    ],
    constraints: { maxCount: 3 },
  },
  {
    id: 'tower',
    name: 'Build a Tower',
    description: 'A tall tower to see the whole town!',
    category: CARD_CATEGORIES.BUILD,
    icon: '🗼',
    spawn: [
      {
        type: ENTITY_TYPES.BUILDING,
        mesh: 'tower',
        position: { x: 0, y: 0, z: -5 },
        scale: { x: 1, y: 3, z: 1 },
        color: 0x9b59b6,
      },
    ],
    constraints: { maxCount: 1 },
  },

  // RULES category
  {
    id: 'clap_sky',
    name: 'Clap to Change Sky',
    description: 'Clap your hands to change the sky color!',
    category: CARD_CATEGORIES.RULES,
    icon: '👏',
    rules: [
      {
        trigger: 'audio',
        condition: 'clap',
        effect: {
          type: 'change_sky_color',
          colors: [0x87ceeb, 0xffb347, 0x9b59b6, 0x3498db],
        },
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'jump_fireworks',
    name: 'Jump for Fireworks',
    description: 'When both players jump, fireworks appear!',
    category: CARD_CATEGORIES.RULES,
    icon: '🎆',
    rules: [
      {
        trigger: 'both_players_action',
        condition: 'jump',
        effect: {
          type: 'spawn_effect',
          effectType: 'fireworks',
          duration: 3000,
        },
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'loud_grow',
    name: 'Shout to Grow',
    description: 'Make a loud sound to make things grow bigger!',
    category: CARD_CATEGORIES.RULES,
    icon: '📢',
    rules: [
      {
        trigger: 'audio',
        condition: 'loud',
        effect: {
          type: 'scale_entities',
          targetType: ENTITY_TYPES.TREE,
          scaleMultiplier: 1.1,
          maxScale: 3,
        },
      },
    ],
    constraints: { maxCount: 1 },
  },

  // DECOR category
  {
    id: 'flowers',
    name: 'Add Flowers',
    description: 'Beautiful flowers bloom around the town',
    category: CARD_CATEGORIES.DECOR,
    icon: '🌸',
    spawn: [
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'flowers',
        position: { x: 2, y: 0, z: 4 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        color: 0xff69b4,
      },
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'flowers',
        position: { x: -2, y: 0, z: 5 },
        scale: { x: 0.4, y: 0.4, z: 0.4 },
        color: 0xffb6c1,
      },
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'flowers',
        position: { x: 0, y: 0, z: 6 },
        scale: { x: 0.6, y: 0.6, z: 0.6 },
        color: 0xffc0cb,
      },
    ],
    constraints: { maxCount: 2 },
  },
  {
    id: 'pond',
    name: 'Create a Pond',
    description: 'A peaceful pond with sparkly water',
    category: CARD_CATEGORIES.DECOR,
    icon: '💧',
    spawn: [
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'pond',
        position: { x: -3, y: -0.05, z: -3 },
        scale: { x: 2, y: 0.1, z: 2 },
        color: 0x4fc3f7,
        animation: { type: 'shimmer' },
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'streetlamps',
    name: 'Add Street Lamps',
    description: 'Glowing lamps light up the paths',
    category: CARD_CATEGORIES.DECOR,
    icon: '💡',
    spawn: [
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'lamp',
        position: { x: 2, y: 0, z: 0 },
        scale: { x: 0.3, y: 1, z: 0.3 },
        color: 0xfff8dc,
        metadata: { emissive: true },
      },
      {
        type: ENTITY_TYPES.DECORATION,
        mesh: 'lamp',
        position: { x: -2, y: 0, z: 0 },
        scale: { x: 0.3, y: 1, z: 0.3 },
        color: 0xfff8dc,
        metadata: { emissive: true },
      },
    ],
    constraints: { maxCount: 2 },
  },

  // EVENTS category
  {
    id: 'robot_cat',
    name: 'Add Robot Cat',
    description: 'A friendly robot cat wanders around!',
    category: CARD_CATEGORIES.EVENTS,
    icon: '🐱',
    spawn: [
      {
        type: ENTITY_TYPES.NPC,
        mesh: 'robot_cat',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        color: 0xc0c0c0,
        animation: { type: 'wander', speed: 0.5, radius: 5 },
      },
    ],
    constraints: { maxCount: 1 },
  },
  {
    id: 'butterflies',
    name: 'Release Butterflies',
    description: 'Colorful butterflies flutter through the air',
    category: CARD_CATEGORIES.EVENTS,
    icon: '🦋',
    spawn: [
      {
        type: ENTITY_TYPES.NPC,
        mesh: 'butterfly',
        position: { x: 1, y: 1.5, z: 1 },
        scale: { x: 0.2, y: 0.2, z: 0.2 },
        color: 0xff6b6b,
        animation: { type: 'flutter', height: 2 },
      },
      {
        type: ENTITY_TYPES.NPC,
        mesh: 'butterfly',
        position: { x: -1, y: 1.8, z: 2 },
        scale: { x: 0.15, y: 0.15, z: 0.15 },
        color: 0x4ecdc4,
        animation: { type: 'flutter', height: 2.5 },
      },
      {
        type: ENTITY_TYPES.NPC,
        mesh: 'butterfly',
        position: { x: 0, y: 2, z: -1 },
        scale: { x: 0.18, y: 0.18, z: 0.18 },
        color: 0xffe66d,
        animation: { type: 'flutter', height: 2.2 },
      },
    ],
    constraints: { maxCount: 2 },
  },
  {
    id: 'rainbow',
    name: 'Make a Rainbow',
    description: 'A beautiful rainbow arcs across the sky',
    category: CARD_CATEGORIES.EVENTS,
    icon: '🌈',
    spawn: [
      {
        type: ENTITY_TYPES.EFFECT,
        mesh: 'rainbow',
        position: { x: 0, y: 5, z: -8 },
        scale: { x: 10, y: 5, z: 1 },
        color: 0xffffff,
        animation: { type: 'fade_in', duration: 2000 },
      },
    ],
    constraints: { maxCount: 1 },
  },
]
