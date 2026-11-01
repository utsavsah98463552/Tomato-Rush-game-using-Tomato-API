/**
 * fallbackPuzzle.js - locally generated puzzles for when the Tomato API is unreachable.
 * Author: Utsav Sah
 *
 * Draws a simple equation such as "7 + 🍅 = 12" as an SVG image. The tomato hides a digit
 * 0-9, so the game rules stay exactly the same. The image is returned as a data: URL,
 * the same format the Tomato API gives with base64=yes, so the rest of the code does not
 * need to know where a puzzle came from.
 */
'use strict';

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** @returns {{a:number, op:string, b:number, result:number, hide:'a'|'b'}} */
function makeEquation() {
  const op = ['+', '−', '×'][randomInt(0, 2)];
  // No zeros for "×": in "0 × 🍅 = 0" any digit would be correct (ambiguous puzzle).
  const min = op === '×' ? 1 : 0;
  let a = randomInt(min, 9);
  let b = randomInt(min, 9);
  if (op === '−' && b > a) [a, b] = [b, a]; // keep results non-negative
  const result = op === '+' ? a + b : op === '−' ? a - b : a * b;
  const hide = Math.random() < 0.5 ? 'a' : 'b';
  return { a, op, b, result, hide };
}

function tomatoSvg(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <circle r="34" fill="#e5482f"/>
      <ellipse cx="-11" cy="-12" rx="9" ry="6" fill="#ffffff" opacity=".35"/>
      <path d="M0 -30 l7 -12 l2 12 l12 -4 l-9 10 l-24 0 l-9 -10 l12 4 l2 -12 z" fill="#3f8f3a"/>
    </g>`;
}

/** Build the SVG image for an equation. */
function renderSvg({ a, op, b, result, hide }) {
  const text = (value, x) =>
    `<text x="${x}" y="122" font-size="64" font-family="Arial, sans-serif" font-weight="700" fill="#2b1d16" text-anchor="middle">${value}</text>`;
  const slot = (value, x, hidden) => (hidden ? tomatoSvg(x, 100) : text(value, x));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="200" viewBox="0 0 520 200">
    <rect width="520" height="200" rx="18" fill="#fffaf3"/>
    ${slot(a, 70, hide === 'a')}
    ${text(op, 160)}
    ${slot(b, 250, hide === 'b')}
    ${text('=', 340)}
    ${text(result, 440)}
    <text x="260" y="186" font-size="14" font-family="Arial, sans-serif" fill="#7a675c" text-anchor="middle">Which digit is under the tomato?</text>
  </svg>`;
}

/** @returns {{image: string, solution: number, source: string}} */
function generatePuzzle() {
  const eq = makeEquation();
  const svg = renderSvg(eq);
  return {
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    solution: eq.hide === 'a' ? eq.a : eq.b,
    source: 'offline',
  };
}

module.exports = { generatePuzzle, makeEquation };
