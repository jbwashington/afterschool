// Prank Lab — prank idea generator, fake errors, and whoopee cushion timer

const PRANK_IDEAS = [
  {
    title: 'The Invisible Ink Note',
    difficulty: 'Easy',
    steps: [
      'Write a message with white crayon on white paper',
      'Give the note to your friend and say it\'s super important',
      'Watch them try to read it',
      'Tell them to color over it with a marker to reveal the message'
    ]
  },
  {
    title: 'Googly Eye Everything',
    difficulty: 'Easy',
    steps: [
      'Get a pack of stick-on googly eyes',
      'Put them on everything in the fridge',
      'Milk carton, eggs, cheese, EVERYTHING',
      'Wait for someone to open the fridge'
    ]
  },
  {
    title: 'The Frozen Cereal',
    difficulty: 'Medium',
    steps: [
      'Pour a bowl of cereal with milk the night before',
      'Put a spoon in it and freeze it overnight',
      'In the morning, set it out like a normal bowl of cereal',
      'Watch someone try to eat the frozen cereal'
    ]
  },
  {
    title: 'Office Supply in Jello',
    difficulty: 'Medium',
    steps: [
      'Make a batch of clear Jello in a container',
      'When it\'s half-set, push a small toy into the middle',
      'Let it finish setting in the fridge',
      'Present the "trapped" toy to your friend'
    ]
  },
  {
    title: 'The Upside Down Room',
    difficulty: 'Pro',
    steps: [
      'Take photos of a room from different angles',
      'Tape the photos upside down on the walls',
      'Flip all lightweight objects you can upside down',
      'Tell your family the gravity machine broke'
    ]
  },
  {
    title: 'Confetti Fan Surprise',
    difficulty: 'Medium',
    steps: [
      'Cut tiny pieces of colorful paper (confetti)',
      'Place them on top of a ceiling fan blade',
      'When someone turns on the fan... CONFETTI PARTY!',
      'Help clean up afterward (that\'s the deal)'
    ]
  },
  {
    title: 'The Broken Screen',
    difficulty: 'Easy',
    steps: [
      'Find a "cracked screen" wallpaper image online',
      'Set it as someone\'s phone or tablet wallpaper',
      'Hand it back and say "oops, I dropped it"',
      'Reveal it\'s just a wallpaper!'
    ]
  },
  {
    title: 'Balloon Room Wake-Up',
    difficulty: 'Pro',
    steps: [
      'Blow up LOTS of balloons the night before',
      'Quietly fill someone\'s room with balloons while they sleep',
      'When they wake up, they\'re in a balloon wonderland',
      'Extra points: tape a "Happy Random Day!" sign on the door'
    ]
  },
  {
    title: 'The Voice-Activated Toaster',
    difficulty: 'Easy',
    steps: [
      'Put a sign on the toaster that says "NOW VOICE ACTIVATED!"',
      'Write "Say your bread type clearly" on it',
      'Watch people try to talk to the toaster',
      'Try not to laugh (impossible)'
    ]
  },
  {
    title: 'Rubber Band Sink Sprayer',
    difficulty: 'Medium',
    steps: [
      'Put a rubber band around the kitchen sink sprayer handle',
      'Make sure it points forward toward where someone would stand',
      'When they turn on the faucet, they get sprayed!',
      'Have a towel ready to be a good sport about it'
    ]
  },
]

const FAKE_ERRORS = [
  { code: '404', message: 'Your homework has been eaten by a digital dog.' },
  { code: '418', message: 'I\'m a teapot. I cannot compute math. Only tea.' },
  { code: '503', message: 'Brain.exe has stopped working. Have you tried turning it off and back on?' },
  { code: '007', message: 'SECRET AGENT MODE ACTIVATED. Please speak in a British accent.' },
  { code: '42', message: 'The meaning of life has been found. It was behind the couch.' },
  { code: '999', message: 'SYSTEM OVERLOAD: Too much fun detected in this zone.' },
  { code: '123', message: 'WARNING: Your socks don\'t match. This is a critical error.' },
  { code: '000', message: 'BOREDOM DETECTED. Deploying emergency confetti...' },
  { code: '666', message: 'GHOST IN THE MACHINE. Just kidding, it\'s just a rubber duck.' },
  { code: '800', message: 'FREE PIZZA DETECTED... Just kidding. There is no pizza. Sorry.' },
]

export class PrankLab {
  constructor(container, synth) {
    this.container = container
    this.synth = synth
    this.el = null
    this.whoopeeTimer = null
    this.whoopeeInterval = null
    this.fakeErrorEl = null
  }

  init() {
    this.el = document.createElement('div')
    this.el.className = 'mz-prank-lab'
    this.el.innerHTML = `
      <div class="mz-prank-sections">
        <div class="mz-prank-section">
          <h3 class="mz-section-title">Prank Idea Generator</h3>
          <div class="mz-prank-result"></div>
          <button class="mz-prank-generate-btn">GENERATE PRANK</button>
        </div>

        <div class="mz-prank-section">
          <h3 class="mz-section-title">Fake Error Generator</h3>
          <p class="mz-section-desc">Creates a fake system error. Harmless fun!</p>
          <button class="mz-fake-error-btn">TRIGGER ERROR</button>
        </div>

        <div class="mz-prank-section">
          <h3 class="mz-section-title">Whoopee Cushion Timer</h3>
          <p class="mz-section-desc">Set a delay, hit arm, and wait for the magic...</p>
          <div class="mz-whoopee-controls">
            <select class="mz-whoopee-delay">
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30" selected>30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
            <button class="mz-whoopee-arm-btn">ARM</button>
          </div>
          <div class="mz-whoopee-countdown"></div>
        </div>
      </div>
    `

    this.container.appendChild(this.el)

    // Prank generator
    this.el.querySelector('.mz-prank-generate-btn').addEventListener('click', () => {
      this.generatePrank()
    })

    // Fake error
    this.el.querySelector('.mz-fake-error-btn').addEventListener('click', () => {
      this.showFakeError()
    })

    // Whoopee cushion
    this.el.querySelector('.mz-whoopee-arm-btn').addEventListener('click', () => {
      this.armWhoopeeCushion()
    })
  }

  generatePrank() {
    const prank = PRANK_IDEAS[Math.floor(Math.random() * PRANK_IDEAS.length)]
    const result = this.el.querySelector('.mz-prank-result')

    const difficultyClass = prank.difficulty.toLowerCase()

    result.innerHTML = `
      <div class="mz-prank-card">
        <div class="mz-prank-card-header">
          <span class="mz-prank-title">${prank.title}</span>
          <span class="mz-prank-difficulty mz-diff-${difficultyClass}">${prank.difficulty}</span>
        </div>
        <ol class="mz-prank-steps">
          ${prank.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>
    `

    // Play a fun sound
    this.synth.playSound('boing')
  }

  showFakeError() {
    const error = FAKE_ERRORS[Math.floor(Math.random() * FAKE_ERRORS.length)]

    // Create overlay on the mischief zone's container (goes up to the portal main area)
    const portal = this.container.closest('.kids-portal-main') || this.container
    this.fakeErrorEl = document.createElement('div')
    this.fakeErrorEl.className = 'mz-fake-error-overlay'
    this.fakeErrorEl.innerHTML = `
      <div class="mz-fake-error-box">
        <div class="mz-fake-error-header">
          <span class="mz-fake-error-icon">&#9888;</span>
          SYSTEM ERROR ${error.code}
        </div>
        <div class="mz-fake-error-message">${error.message}</div>
        <button class="mz-fake-error-dismiss">Just Kidding! &#128514;</button>
      </div>
    `

    portal.appendChild(this.fakeErrorEl)

    // Play buzzer
    this.synth.playSound('buzzer')

    this.fakeErrorEl.querySelector('.mz-fake-error-dismiss').addEventListener('click', () => {
      this.dismissFakeError()
    })
  }

  dismissFakeError() {
    if (this.fakeErrorEl) {
      this.fakeErrorEl.remove()
      this.fakeErrorEl = null
    }
  }

  armWhoopeeCushion() {
    const delaySelect = this.el.querySelector('.mz-whoopee-delay')
    const armBtn = this.el.querySelector('.mz-whoopee-arm-btn')
    const countdown = this.el.querySelector('.mz-whoopee-countdown')

    let remaining = parseInt(delaySelect.value, 10)

    // Disable controls
    armBtn.disabled = true
    armBtn.textContent = 'ARMED!'
    armBtn.classList.add('armed')
    delaySelect.disabled = true

    // Show countdown
    countdown.textContent = remaining + 's'
    countdown.classList.add('active')

    this.whoopeeInterval = setInterval(() => {
      remaining--
      countdown.textContent = remaining + 's'

      if (remaining <= 3) {
        countdown.classList.add('imminent')
      }
    }, 1000)

    this.whoopeeTimer = setTimeout(() => {
      clearInterval(this.whoopeeInterval)
      this.whoopeeInterval = null
      this.whoopeeTimer = null

      // PLAY THE SOUND!
      this.synth.playSound('whoopeeCushion')

      // Reset UI
      countdown.textContent = 'PFFFTTT!'
      countdown.classList.remove('imminent')

      setTimeout(() => {
        armBtn.disabled = false
        armBtn.textContent = 'ARM'
        armBtn.classList.remove('armed')
        delaySelect.disabled = false
        countdown.textContent = ''
        countdown.classList.remove('active')
      }, 2000)
    }, remaining * 1000)
  }

  destroy() {
    this.dismissFakeError()
    if (this.whoopeeTimer) {
      clearTimeout(this.whoopeeTimer)
      this.whoopeeTimer = null
    }
    if (this.whoopeeInterval) {
      clearInterval(this.whoopeeInterval)
      this.whoopeeInterval = null
    }
    if (this.el) {
      this.el.remove()
      this.el = null
    }
  }
}
