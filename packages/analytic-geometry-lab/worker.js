const CHALLENGES = [
  {
    id: 'slope-2',
    prompt: 'Drag A and B to create a line with slope m = 2',
    hint: 'Rise should be twice the run (for example, right 2 and up 4).',
    check: ({ ax, ay, bx, by }) => bx !== ax && Math.abs((by - ay) / (bx - ax) - 2) < 0.01,
  },
  {
    id: 'midpoint-origin',
    prompt: 'Place A and B so their midpoint M is at the origin (0, 0)',
    hint: 'Put A and B on opposite sides of (0, 0), like (-3, 2) and (3, -2).',
    check: ({ ax, ay, bx, by }) =>
      Math.hypot(bx - ax, by - ay) >= 2 &&
      Math.abs((ax + bx) / 2) < 0.01 &&
      Math.abs((ay + by) / 2) < 0.01,
  },
  {
    id: 'distance-5',
    prompt: 'Make segment AB have exact length d = 5',
    hint: 'Use a 3-4-5 right triangle (run = 3, rise = 4) or a horizontal/vertical length of 5.',
    check: ({ ax, ay, bx, by }) => Math.abs(Math.hypot(bx - ax, by - ay) - 5) < 0.02,
  },
  {
    id: 'slope-neg-half',
    prompt: 'Create a downward line with slope m = -0.5',
    hint: 'Move right 4 and down 2 (or right 2 and down 1).',
    check: ({ ax, ay, bx, by }) => bx !== ax && Math.abs((by - ay) / (bx - ax) - -0.5) < 0.01,
  },
  {
    id: 'horizontal-3',
    prompt: 'Make a horizontal line at y = 3 (slope m = 0)',
    hint: 'Set both points to y = 3 with different x coordinates.',
    check: ({ ax, ay, bx, by }) =>
      Math.abs(bx - ax) >= 1 && Math.abs(ay - 3) < 0.01 && Math.abs(by - 3) < 0.01,
  },
]

let challengeIndex = 0
let solvedIds = new Set()

function serializeChallenge() {
  const c = CHALLENGES[challengeIndex % CHALLENGES.length]
  return {
    id: c.id,
    index: challengeIndex % CHALLENGES.length,
    total: CHALLENGES.length,
    prompt: c.prompt,
    hint: c.hint,
    solvedCount: solvedIds.size,
  }
}

export function onActivate(ctx) {
  ctx.log.info('Analytic Geometry Lab worker activated')
}

export function getChallenge() {
  return serializeChallenge()
}

export function nextChallenge() {
  challengeIndex = (challengeIndex + 1) % CHALLENGES.length
  return serializeChallenge()
}

export function evaluateGeometry(payload) {
  const { ax, ay, bx, by } = payload
  const dx = bx - ax
  const dy = by - ay
  const distance = Math.hypot(dx, dy)
  const midX = (ax + bx) / 2
  const midY = (ay + by) / 2
  const isVertical = Math.abs(dx) < 1e-6
  const slope = isVertical ? null : dy / dx
  const intercept = isVertical ? null : ay - slope * ax

  const current = CHALLENGES[challengeIndex % CHALLENGES.length]
  const passed = Boolean(current.check({ ax, ay, bx, by }))
  if (passed) solvedIds.add(current.id)

  return {
    dx,
    dy,
    distance,
    midX,
    midY,
    isVertical,
    slope,
    intercept,
    passed,
    challenge: serializeChallenge(),
  }
}

export async function newChallenge(ctx) {
  challengeIndex = (challengeIndex + 1) % CHALLENGES.length
  const c = serializeChallenge()
  await ctx.ui.notify(`New challenge: ${c.prompt}`)
  return c
}
