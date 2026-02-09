// sixsevenOS constants shared between client and server

export const OS = {
  MAX_PLAYERS: 10,
  CURSOR_UPDATE_HZ: 20,
  MAX_WINDOWS: 20,
}

export const MESSAGE_TYPES = {
  // Connection
  JOIN_ROOM: 'join_room',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',

  // Cursor sync
  CURSOR_MOVE: 'cursor_move',
  CURSOR_DOWN: 'cursor_down',
  CURSOR_UP: 'cursor_up',

  // Window events
  WINDOW_OPEN: 'window_open',
  WINDOW_CLOSE: 'window_close',
  WINDOW_MOVE: 'window_move',
  WINDOW_RESIZE: 'window_resize',
  WINDOW_FOCUS: 'window_focus',
  WINDOW_MINIMIZE: 'window_minimize',
  WINDOW_MAXIMIZE: 'window_maximize',

  // File system
  FILE_CREATE: 'file_create',
  FILE_UPDATE: 'file_update',
  FILE_DELETE: 'file_delete',
  FILE_MOVE: 'file_move',

  // Errors
  ERROR: 'error',
}

export const WINDOW_STATE = {
  NORMAL: 'normal',
  MINIMIZED: 'minimized',
  MAXIMIZED: 'maximized',
}

export const DEFAULT_APPS = {
  NOTEPAD: 'notepad',
  MY_COMPUTER: 'my_computer',
  RECYCLE_BIN: 'recycle_bin',
}
