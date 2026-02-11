// Math problem generator with difficulty scaling for 2nd grade
// Levels 1-3: addition/subtraction missing number (up to 10)
// Levels 4-6: larger numbers (up to 20) + intro fractions
// Levels 7-9: visual fractions, fraction comparison
// Levels 10+: all types mixed

export class MathProblems {
  constructor() {
    this.usedProblems = new Set()
  }

  generate(level) {
    const generators = this._getGeneratorsForLevel(level)
    const gen = generators[Math.floor(Math.random() * generators.length)]
    let problem

    // Try to avoid repeats
    for (let i = 0; i < 10; i++) {
      problem = gen()
      const key = problem.display + problem.correct
      if (!this.usedProblems.has(key)) {
        this.usedProblems.add(key)
        break
      }
    }

    // Generate wrong answers
    problem.choices = this._generateChoices(problem.correct, problem.choiceType || 'int', level)
    return problem
  }

  _getGeneratorsForLevel(level) {
    if (level <= 3) {
      return [
        () => this._additionMissing(10),
        () => this._subtractionMissing(10),
      ]
    }
    if (level <= 6) {
      return [
        () => this._additionMissing(20),
        () => this._subtractionMissing(20),
        () => this._fractionOf(),
      ]
    }
    if (level <= 9) {
      return [
        () => this._additionMissing(20),
        () => this._subtractionMissing(20),
        () => this._fractionOf(),
        () => this._visualFraction(),
      ]
    }
    // 10+: everything, harder
    return [
      () => this._additionMissing(30),
      () => this._subtractionMissing(30),
      () => this._fractionOf(),
      () => this._visualFraction(),
    ]
  }

  _additionMissing(max) {
    const total = this._rand(2, max)
    const a = this._rand(0, total)
    const b = total - a

    const type = Math.random() < 0.5 ? 'left' : 'right'
    if (type === 'left') {
      return { display: `___ + ${b} = ${total}`, correct: a }
    }
    return { display: `${a} + ___ = ${total}`, correct: b }
  }

  _subtractionMissing(max) {
    const total = this._rand(2, max)
    const a = this._rand(0, total)
    const b = total - a

    // total - ___ = b  OR  ___ - a = b
    const type = Math.random() < 0.5 ? 'blank_sub' : 'sub_blank'
    if (type === 'blank_sub') {
      return { display: `${total} - ___ = ${b}`, correct: a }
    }
    return { display: `___ - ${a} = ${b}`, correct: total }
  }

  _fractionOf() {
    const fractions = [
      { frac: '1/2', divisor: 2 },
      { frac: '1/3', divisor: 3 },
      { frac: '1/4', divisor: 4 },
    ]
    const f = fractions[Math.floor(Math.random() * fractions.length)]
    const multiplier = this._rand(1, 4)
    const whole = f.divisor * multiplier
    const answer = whole / f.divisor

    return {
      display: `${f.frac} of ${whole} = ?`,
      correct: answer,
    }
  }

  _visualFraction() {
    const denominator = this._rand(2, 6)
    const numerator = this._rand(1, denominator)

    const filled = '\u2b1b' // black square
    const empty = '\u2b1c'  // white square
    const visual = filled.repeat(numerator) + empty.repeat(denominator - numerator)

    return {
      display: `${visual} = ?/${denominator}`,
      correct: numerator,
    }
  }

  _generateChoices(correct, type, level) {
    const choices = [correct]
    const seen = new Set([correct])

    while (choices.length < 4) {
      let wrong
      if (type === 'int') {
        // Generate plausible wrong answers near the correct one
        const offset = this._rand(1, Math.max(3, Math.min(level + 1, 6)))
        wrong = correct + (Math.random() < 0.5 ? offset : -offset)
        if (wrong < 0) wrong = correct + offset
      } else {
        wrong = this._rand(0, 20)
      }

      if (!seen.has(wrong)) {
        seen.add(wrong)
        choices.push(wrong)
      }
    }

    // Shuffle
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[choices[i], choices[j]] = [choices[j], choices[i]]
    }
    return choices
  }

  reset() {
    this.usedProblems.clear()
  }

  _rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}
