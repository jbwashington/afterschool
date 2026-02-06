// Game constants shared between client and server

export const GAME = {
  MAX_PLAYERS: 2,
  MAX_ENTITIES: 50,
  NETWORK_UPDATE_HZ: 20,
  TURN_PHASES: ['plan', 'resolve', 'reflect'],
  ROLES: ['designer', 'tester'],
}

export const CARD_CATEGORIES = {
  BUILD: 'build',
  RULES: 'rules',
  DECOR: 'decor',
  EVENTS: 'events',
}

export const ALLOWED_ACTIONS = [
  'spawn_object',
  'remove_object',
  'animate_property',
  'change_color',
  'apply_physics_modifier',
  'play_sound',
  'register_event_listener',
]

export const MESSAGE_TYPES = {
  // Connection
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',

  // Game state
  GAME_STATE: 'game_state',
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',

  // Player actions
  SELECT_CARD: 'select_card',
  CARD_SELECTED: 'card_selected',

  // Audio signals
  AUDIO_SIGNAL: 'audio_signal',

  // World updates
  WORLD_UPDATE: 'world_update',
  ENTITY_SPAWN: 'entity_spawn',
  ENTITY_REMOVE: 'entity_remove',

  // Sandbox mode
  SPAWN_ENTITY: 'spawn_entity',
  ENTITY_SPAWN: 'entity_spawn',
  CHANGE_SKY: 'change_sky',
  SKY_CHANGE: 'sky_change',
  CLEAR_ALL: 'clear_all',

  // Errors
  ERROR: 'error',
}

export const ENTITY_TYPES = {
  GROUND: 'ground',
  BUILDING: 'building',
  TREE: 'tree',
  PLAYGROUND: 'playground',
  NPC: 'npc',
  DECORATION: 'decoration',
  EFFECT: 'effect',
}
