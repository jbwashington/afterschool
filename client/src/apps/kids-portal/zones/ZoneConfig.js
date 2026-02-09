export const ZONES = [
  {
    id: 'fly-zone',
    name: 'Fly Zone',
    icon: '🚁',
    color: '#0066ff',
    description: 'Learn about drones, flying machines, and aeronautics!',
    categories: [
      { id: 'how-drones-work', label: 'How Drones Work', icon: '⚙️' },
      { id: 'drone-building', label: 'Build Your Own', icon: '🔧' },
      { id: 'flight-simulators', label: 'Flight Simulators', icon: '🎮' },
      { id: 'famous-pilots', label: 'Famous Pilots', icon: '✈️' },
    ]
  },
  {
    id: 'robot-lab',
    name: 'Robot Lab',
    icon: '🤖',
    color: '#9933ff',
    description: 'Explore robots, coding, and artificial intelligence!',
    categories: [
      { id: 'robot-basics', label: 'Robot Basics', icon: '🔋' },
      { id: 'coding-robots', label: 'Code a Robot', icon: '💻' },
      { id: 'famous-robots', label: 'Famous Robots', icon: '🌟' },
      { id: 'ai-for-kids', label: 'AI For Kids', icon: '🧠' },
    ]
  },
  {
    id: 'sports-arena',
    name: 'Sports Arena',
    icon: '⚽',
    color: '#00cc44',
    description: 'Soccer, sports stars, and athletic adventures!',
    categories: [
      { id: 'soccer-skills', label: 'Soccer Skills', icon: '🎯' },
      { id: 'famous-players', label: 'Famous Players', icon: '⭐' },
      { id: 'world-cup', label: 'World Cup History', icon: '🏆' },
      { id: 'sports-games', label: 'Sports Games', icon: '🎮' },
    ]
  },
  {
    id: 'kid-biz',
    name: 'Kid Biz',
    icon: '💰',
    color: '#ff9900',
    description: 'Build your business empire with AI agents!',
    categories: [],
    isKidBizEmpire: true
  },
  {
    id: 'art-studio',
    name: 'Art Studio',
    icon: '🎨',
    color: '#ff66b2',
    description: 'Draw, paint, and create amazing artwork!',
    categories: [
      { id: 'drawing-lessons', label: 'Drawing Lessons', icon: '✏️' },
      { id: 'digital-art', label: 'Digital Art', icon: '🖥️' },
      { id: 'famous-artists', label: 'Famous Artists', icon: '🖼️' },
      { id: 'art-projects', label: 'Art Projects', icon: '📐' },
    ]
  },
  {
    id: 'play-zone',
    name: 'Play Zone',
    icon: '🎮',
    color: '#00cccc',
    description: 'Fun games, puzzles, and activities!',
    categories: [
      { id: 'puzzle-games', label: 'Puzzle Games', icon: '🧩' },
      { id: 'adventure-games', label: 'Adventure Games', icon: '🗺️' },
      { id: 'brain-teasers', label: 'Brain Teasers', icon: '🧠' },
      { id: 'multiplayer', label: 'Play With Friends', icon: '👥' },
    ]
  },
  {
    id: 'maker-space',
    name: 'Maker Space',
    icon: '🔧',
    color: '#4d4dff',
    description: 'Build, tinker, and make cool stuff!',
    categories: [
      { id: 'electronics', label: 'Electronics', icon: '⚡' },
      { id: 'woodworking', label: 'Woodworking', icon: '🪵' },
      { id: '3d-printing', label: '3D Printing', icon: '🖨️' },
      { id: 'inventions', label: 'Famous Inventions', icon: '💡' },
    ]
  },
  {
    id: 'ai-helper',
    name: 'AI Helper',
    icon: '✨',
    color: '#ff3333',
    description: 'Your friendly AI buddy to help with questions!',
    categories: [],
    isAIHelper: true
  },
  {
    id: 'my-stuff',
    name: 'My Stuff',
    icon: '⭐',
    color: '#666666',
    description: 'Your saved favorites and bookmarks!',
    categories: [
      { id: 'favorites', label: 'Favorites', icon: '❤️' },
      { id: 'recent', label: 'Recently Visited', icon: '🕐' },
      { id: 'achievements', label: 'Achievements', icon: '🏅' },
    ]
  },
]

export function getZoneById(id) {
  return ZONES.find(zone => zone.id === id)
}

export function getZoneColor(id) {
  const zone = getZoneById(id)
  return zone ? zone.color : '#0033cc'
}
