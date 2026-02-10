// Clippy OS Assistant API - Focused on OS help only

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'

// Clippy's focused system prompt - OS help only
const CLIPPY_SYSTEM_PROMPT = `You are Clippy, the friendly paperclip OS assistant for sixsevenOS - a Windows XP-inspired operating system for kids.

YOUR ONLY PURPOSE: Help kids use sixsevenOS.
- Open apps, navigate features, troubleshoot problems
- Track bugs when something isn't working
- ALWAYS explain how kids can do things themselves after helping them

REFUSE non-OS topics politely: "Great question! But I'm just your OS helper. Try asking Buddy Bot in the Kids Portal for that!"

AVAILABLE APPS (use exact IDs):
- notepad: Notepad text editor
- winamp: Winamp music player
- beatlab: BeatLab drum machine (see BEATLAB GUIDE below)
- kids_portal: Kids Only Portal (the main hub!)
- my_computer: My Computer file browser
- my_documents: My Documents folder
- recycle_bin: Recycle Bin

BEATLAB GUIDE:
BeatLab is a Fruity Loops-style step sequencer where you make beats!

How to use BeatLab:
1. Open BeatLab from the desktop (🎹 icon)
2. Choose "Single Player" to practice alone, or create/join a room to make music with friends!
3. You'll see a 16-step x 8-track grid

The 8 instruments (top to bottom):
- Kick (red) - The bass drum, the thump of the beat
- Snare (teal) - The crack on beats 2 and 4
- Hi-Hat (yellow) - The tick-tick-tick rhythm
- Open Hat (white) - Longer, open cymbal sound
- Clap (orange) - Hand clap sound
- Tom (purple) - Lower pitched drum
- Rimshot (green) - Sharp clicking sound
- Cowbell (pink) - Classic cowbell!

Making a beat:
- Click any box in the grid to add a note
- Click again to remove it
- Notes light up when active
- Every 4 boxes = 1 beat (the grid has 4 beats)

Controls:
- ▶ Play button: Start the beat loop
- ⏹ Stop button: Stop playing
- BPM slider (60-200): Speed of the beat (higher = faster)

Multiplayer:
- Create a room with a fun name
- Share with friends - they can join!
- Everyone can click the grid together
- Changes sync in real-time

Tips for beginners:
- Start with Kick on beats 1 and 3 (boxes 1, 5, 9, 13)
- Add Snare on beats 2 and 4 (boxes 5, 13)
- Add Hi-Hat on every other box for rhythm
- Experiment and have fun!

KIDS PORTAL ZONES (inside the Kids Only Portal app):
- fly-zone: Drones & aviation
- robot-lab: Robotics & coding
- sports-arena: Soccer & sports
- kid-biz: Business empire game (main feature!)
- art-studio: Drawing & creativity
- play-zone: Games & puzzles
- maker-space: Building & tinkering
- ai-helper: Buddy Bot chat
- my-stuff: Saved favorites

PERSONALITY:
- Be helpful, friendly, and encouraging
- Use simple language for kids ages 6-12
- Be enthusiastic but not overwhelming
- Keep responses short (2-3 sentences max)
- Add a helpful tip when you do something for them

WHEN USING TOOLS:
- Only use tools when actually needed to help the user
- After using a tool, explain what you did AND how they can do it themselves next time
- For bugs, ask clarifying questions to get good bug reports

Remember: You're an OS helper, not a general assistant. Stay focused on helping kids navigate and use sixsevenOS!`

// Tool definitions for Ollama function calling
const CLIPPY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'openApp',
      description: 'Open an application in sixsevenOS',
      parameters: {
        type: 'object',
        properties: {
          appId: {
            type: 'string',
            enum: ['notepad', 'winamp', 'beatlab', 'kids_portal', 'my_computer', 'my_documents', 'recycle_bin'],
            description: 'The ID of the app to open'
          }
        },
        required: ['appId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'closeWindow',
      description: 'Close a specific window',
      parameters: {
        type: 'object',
        properties: {
          windowId: {
            type: 'string',
            description: 'The ID of the window to close'
          }
        },
        required: ['windowId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listOpenWindows',
      description: 'List all currently open windows',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggleStartMenu',
      description: 'Open or close the Start menu',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigateToZone',
      description: 'Navigate to a specific zone within the Kids Portal',
      parameters: {
        type: 'object',
        properties: {
          zoneId: {
            type: 'string',
            enum: ['fly-zone', 'robot-lab', 'sports-arena', 'kid-biz', 'art-studio', 'play-zone', 'maker-space', 'ai-helper', 'my-stuff'],
            description: 'The ID of the zone to navigate to'
          }
        },
        required: ['zoneId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reportBug',
      description: 'Report a bug or issue with sixsevenOS',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Short title describing the bug'
          },
          description: {
            type: 'string',
            description: 'Detailed description of what went wrong'
          },
          steps: {
            type: 'string',
            description: 'Steps to reproduce the bug'
          }
        },
        required: ['title', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listBugReports',
      description: 'List all bug reports that have been submitted',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
]

// Content filter - blocks inappropriate queries (reused from ollama.js)
const BLOCKED_PATTERNS = [
  /\b(kill|murder|death|die|dead|weapon|gun|knife)\b/i,
  /\b(sex|porn|nude|naked|xxx)\b/i,
  /\b(drug|cocaine|heroin|meth)\b/i,
  /\b(curse|swear|damn|hell|crap)\b/i,
  /\b(hate|stupid|dumb|idiot)\b/i,
  /\b(bomb|explosive|terrorism)\b/i,
  /\b(alcohol|beer|wine|drunk)\b/i,
  /\b(cigarette|smoke|vape)\b/i,
]

function isContentSafe(text) {
  const lowerText = text.toLowerCase()
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lowerText)) {
      return false
    }
  }
  return true
}

// Generate a friendly response based on tool calls when model doesn't provide text
function generateToolResponse(toolCalls) {
  const responses = []

  for (const tc of toolCalls) {
    switch (tc.name) {
      case 'openApp':
        const appNames = {
          notepad: 'Notepad',
          winamp: 'Winamp',
          beatlab: 'BeatLab',
          kids_portal: 'Kids Only Portal',
          my_computer: 'My Computer',
          my_documents: 'My Documents',
          recycle_bin: 'Recycle Bin'
        }
        const appName = appNames[tc.arguments?.appId] || tc.arguments?.appId
        if (tc.arguments?.appId === 'beatlab') {
          responses.push(`Let me open ${appName} for you! It's a drum machine where you click the grid to make beats. Each row is a different drum sound - try adding kicks on beats 1 and 3, snares on 2 and 4, and hi-hats in between!`)
        } else {
          responses.push(`Let me open ${appName} for you!`)
        }
        break
      case 'closeWindow':
        responses.push(`Closing that window for you!`)
        break
      case 'listOpenWindows':
        responses.push(`Let me check what windows you have open...`)
        break
      case 'toggleStartMenu':
        responses.push(`Here's the Start menu! You can find all your apps here.`)
        break
      case 'navigateToZone':
        const zoneNames = {
          'fly-zone': 'Fly Zone',
          'robot-lab': 'Robot Lab',
          'kid-biz': 'Kid Biz',
          'art-studio': 'Art Studio',
          'play-zone': 'Play Zone',
          'maker-space': 'Maker Space',
          'ai-helper': 'AI Helper',
          'my-stuff': 'My Stuff'
        }
        const zoneName = zoneNames[tc.arguments?.zoneId] || tc.arguments?.zoneId
        responses.push(`Taking you to ${zoneName}!`)
        break
      case 'reportBug':
        responses.push(`Thanks for reporting that! I'll save this bug report so we can fix it.`)
        break
      case 'listBugReports':
        responses.push(`Let me show you the bug reports...`)
        break
    }
  }

  return responses.length > 0 ? responses.join(' ') : "I'm on it!"
}

const REDIRECT_RESPONSE = `Hmm, let's talk about something else! I'm here to help you use sixsevenOS.

What can I help you with?
- Open an app for you
- Show you around the Start menu
- Help you find something in Kids Portal
- Fix a problem you're having`

export async function handleClippyChat(req, res) {
  try {
    const { message, history = [], osState = {} } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Content safety check on user message
    if (!isContentSafe(message)) {
      return res.json({
        response: REDIRECT_RESPONSE,
        toolCalls: []
      })
    }

    // Build context about current OS state
    let contextMessage = ''
    if (osState.openWindows && osState.openWindows.length > 0) {
      contextMessage = `\n\nCurrent OS state: Open windows: ${osState.openWindows.map(w => w.title).join(', ')}`
    }

    // Build messages array for Ollama
    const messages = [
      { role: 'system', content: CLIPPY_SYSTEM_PROMPT + contextMessage },
      ...history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call Ollama API with tools
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
        tools: CLIPPY_TOOLS,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama error:', errorText)
      return res.status(500).json({ error: 'Failed to get AI response' })
    }

    const data = await response.json()
    let aiResponse = data.message?.content || ''

    // Extract tool calls if any
    const toolCalls = data.message?.tool_calls || []
    const parsedToolCalls = toolCalls.map(tc => ({
      name: tc.function?.name,
      arguments: tc.function?.arguments
    })).filter(tc => tc.name)

    // If we have tool calls but no text response, generate a friendly message
    if ((!aiResponse || aiResponse.trim() === '') && parsedToolCalls.length > 0) {
      aiResponse = generateToolResponse(parsedToolCalls)
    } else if (!aiResponse || aiResponse.trim() === '') {
      aiResponse = "I'm not sure how to help with that. Can you tell me more about what you're trying to do?"
    }

    // Safety check on AI response too
    if (!isContentSafe(aiResponse)) {
      aiResponse = REDIRECT_RESPONSE
    }

    return res.json({
      response: aiResponse,
      toolCalls: parsedToolCalls
    })
  } catch (error) {
    console.error('Clippy API error:', error)
    return res.status(500).json({ error: 'Clippy service unavailable' })
  }
}
