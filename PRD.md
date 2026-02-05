PRD: Town Builders Council

Turn-Based Collaborative Game-Within-a-Game for Kids (Pi-Hosted)

Overview

Town Builders Council is a two-player, turn-based, cooperative civilization-style management game where players collaboratively add features to the game world from within the game itself. Players are second-grade children playing from separate homes via a browser. No logins, no persistence, no chat, no database.

Players select feature “cards” each turn. Selected cards resolve into visible changes in a shared 3D world. An agentic system proposes bounded feature options and converts choices into modular game behaviors.

The game acts as both:
	•	A playable 3D toy world
	•	A collaborative feature development surface

Goals
	•	Enable collaborative problem-solving and creativity
	•	Teach systems thinking through play
	•	Allow children to “build the game while playing it”
	•	Maintain strict safety, performance, and scope constraints suitable for a Raspberry Pi 3B

Non-Goals
	•	No free-form code editing by users
	•	No accounts, profiles, or saved progress
	•	No competitive scoring
	•	No text chat or voice chat between players
	•	No heavy frameworks or cloud dependencies on the Pi

⸻

Target Users
	•	Primary: Children ages 6–8
	•	Secondary: Educators facilitating sessions

⸻

Platform & Constraints
	•	Client: Web browser (desktop or tablet)
	•	Server: Raspberry Pi 3B
	•	Network: Low-latency WebSocket
	•	Sessions are ephemeral and memory-only
	•	Stateless by design; optional session reconstruction via URL seed

⸻

Core Gameplay Loop (Turn-Based)

Turn Phases
	1.	Plan Phase
	•	System presents 2–4 feature cards
	•	Each player selects one card
	2.	Resolve Phase
	•	Selected cards are applied to the world
	•	3D changes animate visibly
	3.	Reflect Phase
	•	System prompts a short reflection
	•	Agent proposes next set of feature cards

Players alternate roles each turn:
	•	Player A: Designer
	•	Player B: Tester
Roles swap every turn.

⸻

Feature Cards

Cards represent bounded, pre-approved actions.

Card Categories
	•	Build
	•	Add structures or terrain
	•	Rules
	•	Event-driven behaviors
	•	Decor
	•	Visual or audio effects
	•	Events
	•	Timed or cooperative triggers

Example Cards
	•	“Add a playground”
	•	“When both players jump → fireworks”
	•	“Clap to change sky color”
	•	“Add a wandering robot cat”

Cards must map to predefined module actions.

⸻

Feature Module System

Feature Module Definition

Each feature is defined as structured data plus bounded logic.

Required Fields
	•	id
	•	category
	•	spawn (objects/entities)
	•	rules (event → effect mappings)
	•	visuals (color, animation, mesh refs)
	•	audio (optional, bounded)
	•	constraints (limits on count, scale, frequency)

Allowed Actions
	•	spawn_object
	•	remove_object
	•	animate_property
	•	change_color
	•	apply_physics_modifier (bounded)
	•	play_sound
	•	register_event_listener

Disallowed Actions
	•	Arbitrary code execution
	•	Network access
	•	File system writes
	•	Infinite loops
	•	Unbounded spawning

⸻

Agent Responsibilities (Bounded)

The agent:
	•	Proposes feature cards based on current world state
	•	Converts selected cards into feature modules
	•	Validates modules against constraints
	•	Produces diff-style previews
	•	Never modifies core engine code
	•	Never generates free-form logic outside approved templates

Agent output must always be machine-parseable.

⸻

Multiplayer Model
	•	Two-player rooms only
	•	Room ID derived from URL hash
	•	WebSocket-based synchronization
	•	Authoritative server turn resolution
	•	Client-side prediction optional but not required

⸻

Audio Interaction
	•	Microphone input processed client-side
	•	Extracted features only (volume, peak, rhythm)
	•	Only numeric signals transmitted
	•	No raw audio streaming

⸻

Statelessness Model
	•	World state lives in memory only
	•	Optional reconstruction using:
	•	Seed
	•	Ordered list of applied feature module IDs
	•	No persistent storage

⸻

Technical Stack

Client
	•	Three.js
	•	Web Audio API
	•	Vite
	•	Vanilla JS or TypeScript

Server
	•	Node.js LTS
	•	WebSocket (ws or uWebSockets.js)
	•	In-memory room manager
	•	Feature registry (static JSON)

Deployment
	•	HTTPS via Caddy
	•	Static assets served locally
	•	Single Node process

⸻

Performance Constraints
	•	≤ 2 concurrent players per room
	•	≤ 50 active entities
	•	≤ 20Hz network updates
	•	No dynamic shadows
	•	Low-poly meshes only

⸻

Acceptance Criteria

Functional
	•	Two players can join via shared link
	•	Turns proceed deterministically
	•	Feature cards apply visible changes
	•	Roles alternate correctly
	•	Audio interactions affect world

Safety
	•	No crashes from malformed modules
	•	Hard limits enforced on entity count
	•	Agent output validated before execution

Performance
	•	Stable at 60 FPS on client hardware
	•	Pi CPU usage remains below 70%
	•	No memory leaks during session

⸻

Testing Requirements

Unit Tests
	•	Feature module validation
	•	Turn resolution logic
	•	Role switching

Integration Tests
	•	Two-player synchronization
	•	Card selection and application
	•	Audio signal handling

End-to-End Tests
	•	Join → play → resolve → repeat
	•	Agent-generated module application
	•	Graceful disconnect handling

⸻

Completion Criteria
	•	All acceptance tests implemented
	•	All tests pass in CI
	•	Game playable end-to-end
	•	Agent loop terminates successfully

⸻

Completion Phrase:
ALL_TESTS_PASS
