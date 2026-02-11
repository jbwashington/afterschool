/**
 * MathProblems.js - 6 problem type generators for 2nd grade math
 *
 * Each generator returns:
 * {
 *   type: string,
 *   question: string,       // text displayed to player
 *   answer: number|string,  // correct answer
 *   choices: (number|string)[],  // 4 choices (includes answer)
 *   visual: { type, ...data }    // data for rendering the diagram
 * }
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeChoices(answer, min, max) {
  const choices = new Set([answer])
  let attempts = 0
  while (choices.size < 4 && attempts < 50) {
    let wrong = randInt(min, max)
    if (wrong !== answer) choices.add(wrong)
    attempts++
  }
  // Fallback if not enough unique values
  let offset = 1
  while (choices.size < 4) {
    if (answer + offset <= max && !choices.has(answer + offset)) choices.add(answer + offset)
    if (answer - offset >= min && !choices.has(answer - offset)) choices.add(answer - offset)
    offset++
  }
  return shuffle([...choices])
}

// --- Type 1: Number Bond (find missing part) ---
function numberBondFindPart(maxNum) {
  const whole = randInt(5, maxNum)
  const part1 = randInt(1, whole - 1)
  const part2 = whole - part1
  // Hide part2
  return {
    type: 'bond-part',
    question: `${whole} = ${part1} + ???`,
    answer: part2,
    choices: makeChoices(part2, 1, maxNum),
    visual: {
      type: 'bond',
      whole,
      partA: part1,
      partB: null, // unknown
    },
  }
}

// --- Type 2: Number Bond (find whole) ---
function numberBondFindWhole(maxNum) {
  const part1 = randInt(1, Math.floor(maxNum / 2))
  const part2 = randInt(1, Math.floor(maxNum / 2))
  const whole = part1 + part2
  return {
    type: 'bond-whole',
    question: `??? = ${part1} + ${part2}`,
    answer: whole,
    choices: makeChoices(whole, 2, maxNum + 5),
    visual: {
      type: 'bond',
      whole: null, // unknown
      partA: part1,
      partB: part2,
    },
  }
}

// --- Type 3: Fraction Identify ---
function fractionIdentify(maxTotal) {
  const total = randInt(4, Math.min(maxTotal, 12))
  const highlighted = randInt(1, total - 1)
  return {
    type: 'fraction-identify',
    question: `How many balls are gold?`,
    answer: highlighted,
    choices: makeChoices(highlighted, 1, total),
    visual: {
      type: 'fraction-grid',
      total,
      highlighted,
    },
  }
}

// --- Type 4: Fraction of Group ---
function fractionOfGroup() {
  const fractions = [
    { name: 'Half', divisor: 2 },
    { name: 'A third', divisor: 3 },
    { name: 'A quarter', divisor: 4 },
  ]
  const frac = fractions[randInt(0, fractions.length - 1)]
  const multiplier = randInt(2, 5)
  const total = frac.divisor * multiplier
  const answer = multiplier
  return {
    type: 'fraction-group',
    question: `${frac.name} of ${total} players = ???`,
    answer,
    choices: makeChoices(answer, 1, total),
    visual: {
      type: 'equation',
      text: `${frac.name} of ${total} = ?`,
    },
  }
}

// --- Type 5: Missing Addend ---
function missingAddend(maxNum) {
  const sum = randInt(5, maxNum)
  const a = randInt(1, sum - 1)
  const b = sum - a
  return {
    type: 'missing-addend',
    question: `${a} + ??? = ${sum}`,
    answer: b,
    choices: makeChoices(b, 1, maxNum),
    visual: {
      type: 'equation',
      text: `${a} + ▢ = ${sum}`,
    },
  }
}

// --- Type 6: Decompose Number ---
function decomposeNumber(maxNum) {
  const target = randInt(6, maxNum)
  const a = randInt(1, target - 1)
  const b = target - a
  const pairStr = `${a} + ${b}`

  // Generate 3 wrong pairs
  const wrongPairs = new Set()
  let attempts = 0
  while (wrongPairs.size < 3 && attempts < 50) {
    const wa = randInt(1, maxNum - 1)
    const wb = randInt(1, maxNum - 1)
    const ws = `${wa} + ${wb}`
    if (wa + wb !== target && ws !== pairStr) {
      wrongPairs.add(ws)
    }
    attempts++
  }

  return {
    type: 'decompose',
    question: `Which two numbers make ${target}?`,
    answer: pairStr,
    choices: shuffle([pairStr, ...wrongPairs]),
    visual: {
      type: 'decompose',
      target,
    },
  }
}

// --- Problem selection by level ---
export function generateProblem(level) {
  let maxNum
  let generators

  if (level <= 3) {
    // Easy: numbers up to 10, bonds + missing addends
    maxNum = 10
    generators = [
      () => numberBondFindPart(maxNum),
      () => numberBondFindWhole(maxNum),
      () => missingAddend(maxNum),
    ]
  } else if (level <= 6) {
    // Medium: numbers up to 20, add fractions
    maxNum = 20
    generators = [
      () => numberBondFindPart(maxNum),
      () => numberBondFindWhole(maxNum),
      () => missingAddend(maxNum),
      () => fractionIdentify(10),
      () => fractionOfGroup(),
    ]
  } else {
    // Hard: all 6 types, numbers up to 30
    maxNum = 30
    generators = [
      () => numberBondFindPart(maxNum),
      () => numberBondFindWhole(maxNum),
      () => missingAddend(maxNum),
      () => fractionIdentify(12),
      () => fractionOfGroup(),
      () => decomposeNumber(maxNum),
    ]
  }

  const gen = generators[randInt(0, generators.length - 1)]
  return gen()
}
