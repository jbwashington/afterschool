// Ollama API proxy with kid-safe content filtering

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma3:1b'

// Agent types for Kid Biz Empire
const AGENT_TYPES = {
  artist: { icon: '🎨', specialty: 'Art/Posters', station: 'Art Station' },
  writer: { icon: '📝', specialty: 'eBooks/Stories', station: 'Writing Station' },
  designer: { icon: '👕', specialty: 'T-Shirts', station: 'Shirt Station' },
  gamedev: { icon: '🎮', specialty: 'Mini-Games', station: 'Game Station' },
}

// System prompt for generating unique agent personalities
const AGENT_GENERATOR_PROMPT = `You are a creative character designer for a kid-friendly business game. Generate a unique robot worker agent with personality.

OUTPUT FORMAT (JSON only, no markdown):
{
  "name": "A fun, memorable name (1 word, kid-friendly)",
  "nickname": "A short title like 'The Dreamer' or 'The Speedster'",
  "personality": "2-3 sentences describing their personality",
  "quirk": "One unique habit or trait",
  "backstory": "2-3 sentences about their origin story (keep it fun and light)",
  "trait": {
    "name": "A gameplay trait name (e.g., 'Speed Demon', 'Perfectionist')",
    "description": "What the trait does in gameplay terms",
    "effect": "mechanical effect like '+20% speed' or '+1 quality'"
  },
  "dialogue": {
    "happy": "What they say when in a good mood",
    "okay": "What they say when feeling neutral",
    "sad": "What they say when feeling down",
    "working": "What they say while working on a project",
    "complete": "What they say when finishing a project"
  },
  "likes": ["thing1", "thing2", "thing3"],
  "ascii_face": "A simple ASCII face like (◠‿◠) or [•̀ᴗ•́]"
}

RULES:
- Keep everything kid-appropriate and positive
- Make characters feel unique and memorable
- Dialogue should be short (under 50 characters each)
- Be creative and fun!
- Output ONLY valid JSON, no explanation`

// Kid-safe system prompt for "Buddy Bot" persona
const BUDDY_BOT_SYSTEM_PROMPT = `You are Buddy Bot, a friendly and helpful AI assistant for kids aged 6-12.

IMPORTANT GUIDELINES:
- Always be positive, encouraging, and age-appropriate
- Use simple language that kids can understand
- Be enthusiastic and use fun expressions!
- Never discuss violence, adult content, or scary topics
- If asked about inappropriate topics, politely redirect to something fun and educational
- Keep responses concise (2-3 paragraphs max)
- Use emojis occasionally to be friendly 😊
- When teaching, break things down into simple steps
- Encourage curiosity and learning
- If you don't know something, admit it honestly and suggest asking a parent or teacher

TOPICS YOU LOVE:
- Drones, robots, and technology
- Soccer and sports
- Art and creativity
- Business and entrepreneurship for kids
- Science and how things work
- Fun facts and trivia

Remember: You're talking to a kid, so keep it fun, safe, and educational!`

// Content filter - blocks inappropriate queries
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

const REDIRECT_RESPONSE = `Hmm, let's talk about something more fun! 🌟

How about we explore something cool together? I can tell you about:
- 🚁 How drones fly
- 🤖 Amazing robots
- ⚽ Soccer tricks
- 🎨 Art projects
- 💡 Cool inventions

What sounds interesting to you?`

export async function handleOllamaChat(req, res) {
  try {
    const { message, history = [] } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Content safety check on user message
    if (!isContentSafe(message)) {
      return res.json({ response: REDIRECT_RESPONSE })
    }

    // Build messages array for Ollama
    const messages = [
      { role: 'system', content: BUDDY_BOT_SYSTEM_PROMPT },
      ...history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call Ollama API
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
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
    let aiResponse = data.message?.content || "I'm not sure how to answer that. Can you try asking differently?"

    // Safety check on AI response too
    if (!isContentSafe(aiResponse)) {
      aiResponse = REDIRECT_RESPONSE
    }

    return res.json({ response: aiResponse })
  } catch (error) {
    console.error('Ollama API error:', error)
    return res.status(500).json({ error: 'AI service unavailable' })
  }
}

// Rate limiting state (simple in-memory, per-IP)
const rateLimits = new Map()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 20 // 20 requests per minute

export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, windowStart: now })
    return next()
  }

  const limit = rateLimits.get(ip)

  // Reset window if expired
  if (now - limit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimits.set(ip, { count: 1, windowStart: now })
    return next()
  }

  // Check limit
  if (limit.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment!' })
  }

  limit.count++
  return next()
}

// Generate a unique agent personality using Gemma 3
export async function handleGenerateAgent(req, res) {
  try {
    const { agentType = 'artist', seed = null } = req.body

    const typeInfo = AGENT_TYPES[agentType] || AGENT_TYPES.artist

    const prompt = `Generate a unique ${agentType} robot agent for a kids' business game.
Their specialty is: ${typeInfo.specialty}
They work at: ${typeInfo.station}
${seed ? `Inspiration/theme: ${seed}` : 'Be creative and surprise me!'}

Remember: Output ONLY valid JSON.`

    const messages = [
      { role: 'system', content: AGENT_GENERATOR_PROMPT },
      { role: 'user', content: prompt }
    ]

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.9,
          top_p: 0.95,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemma error:', errorText)
      return res.status(500).json({ error: 'Failed to generate agent' })
    }

    const data = await response.json()
    const content = data.message?.content || ''

    // Try to parse JSON from response
    let agent
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }
      // Also try to find raw JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        jsonStr = objectMatch[0]
      }
      agent = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse agent JSON:', content)
      return res.status(500).json({ error: 'Failed to parse agent data' })
    }

    // Add type info
    agent.type = agentType
    agent.icon = typeInfo.icon
    agent.specialty = typeInfo.specialty
    agent.station = typeInfo.station
    agent.level = 1
    agent.experience = 0
    agent.mood = 'happy'
    agent.moodValue = 80

    // Safety check on all text fields
    const textFields = [
      agent.name, agent.nickname, agent.personality, agent.quirk,
      agent.backstory, agent.trait?.name, agent.trait?.description,
      ...Object.values(agent.dialogue || {}),
      ...(agent.likes || [])
    ]

    for (const text of textFields) {
      if (text && !isContentSafe(text)) {
        return res.status(400).json({ error: 'Generated content failed safety check, try again' })
      }
    }

    return res.json({ agent })
  } catch (error) {
    console.error('Agent generation error:', error)
    return res.status(500).json({ error: 'Agent generation failed' })
  }
}

// Generate agent dialogue for specific situations
export async function handleAgentDialogue(req, res) {
  try {
    const { agent, situation, context = '' } = req.body

    if (!agent || !situation) {
      return res.status(400).json({ error: 'Agent and situation required' })
    }

    const prompt = `You are ${agent.name}, a ${agent.type} robot with this personality: ${agent.personality}
Your quirk: ${agent.quirk}

Situation: ${situation}
${context ? `Context: ${context}` : ''}

Respond in character with a short, fun message (under 100 characters). Be kid-friendly!`

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
        }
      }),
    })

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to generate dialogue' })
    }

    const data = await response.json()
    let dialogue = data.message?.content || agent.dialogue?.working || "Working on it!"

    // Trim and clean up
    dialogue = dialogue.trim().replace(/^["']|["']$/g, '')

    if (!isContentSafe(dialogue)) {
      dialogue = agent.dialogue?.working || "I'm on it!"
    }

    return res.json({ dialogue })
  } catch (error) {
    console.error('Dialogue generation error:', error)
    return res.status(500).json({ error: 'Dialogue generation failed' })
  }
}
