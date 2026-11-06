
// THE UNWRITTEN ARCANA · VOL. I

// CONFIG
const CONFIG = {
  witchX: 135,
  witchBaseY: 655,
  spreadX: [440, 625, 810],
  spreadY: [325, 305, 325],
  music: "music.mp3",
  musicCredit: "WITCH BY VILLATIC_MUSIC · PIXABAY",
  voiceUrl: "http://127.0.0.1:3000/tts",
  goodThreshold: 1,
  staffOrb: { x: 80, y: -312 },
};

// STATE
let started = false;
let soundOn = true;
let readingComplete = false;
let revealDone = false;
let questionIndex = 0;
let deck = [];
let spread = [];
let stars = [];
let motes = [];
let mood = 0;
let elapsed = 0;
let readingId = 0;

let revealStart = 0;
let flips = [0, 0, 0];
let flipStarted = [false, false, false];
let flipBegin = [-1, -1, -1];
let landedAt = 0;
let flipLanded = [false, false, false];
let hoverLift = [0, 0, 0];
let hoverIndex = -1;
let fortune = 0;
let verdict = "sun";
let lastVerdict = null;

let storm = 0;
let sun = 0;
let stormGoal = 0;
let sunGoal = 0;
let stormPower = 0.7;
let flash = 0;
let shake = 0;
let nextStrike = 0;
let bolts = [];
let rain = [];
let clouds = [];

let speech = { full: "", shown: 0, alpha: 0 };

// CONTENT
const questions = [
  {
    text: "What are you ready to release?",
    options: [
      ["An old version of myself", "change"],
      ["A fear I keep returning to", "fear"],
      ["Something I am not ready to lose", "attachment"],
    ],
  },
  {
    text: "Where does your energy feel most needed my dearest?",
    options: [
      ["In my relationships", "love"],
      ["In my own growth", "growth"],
      ["In finding stability", "stability"],
    ],
  },
  {
    text: "What do you tend to trust first my child?",
    options: [
      ["What I can reason through", "mind"],
      ["What I feel intuitively", "intuition"],
      ["What life shows me over time", "patience"],
    ],
  },
  {
    text: "What are you moving towards, {name}?",
    options: [
      ["A new beginning", "beginning"],
      ["A sense of belonging", "belonging"],
      ["A truth I have avoided", "truth"],
    ],
  },
  {
    text: "What would you most like to understand?",
    options: [
      ["What is ending", "ending"],
      ["What is growing", "growth"],
      ["What deserves my attention", "attention"],
    ],
  },
];

const WITCH_LINES = {
  intro:
    "MWAHAHAH HEEEEHEAHAHAH... a wanderer, drawn to my candlelight. Sit, {name}. Five questions, three cards, and the sky will tell us the rest. The cards never lie my child, HEEHAHA..",
  again: "Again HEEHAHAHAHA? Good, {name}. The cards never say the same thing twice... are you ready my child.",
  turn: "Now... let the cards turn, {name}... hehehehee.",
  storm: "HUSH, {name}... hear that? MWAHAHHAA The sky has opinions. A hard road, perhaps, but storms wash everything clean.",
  sun: "Look... The clouds part for you, {name}. The cards smile on this one... heeeehehe",
  cackle: "Heh... heh heh heh... hee hee hee heeeh!",
  fallback: "Mm. Interesting.",
};

const POSITIONS = ["The past holds", "The present holds", "The future holds"];

let playerName = "wanderer";

function withName(text) {
  return text ? text.replaceAll("{name}", playerName) : text;
}

function cleanName(raw) {
  const v = (raw || "")
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return v ? v[0].toUpperCase() + v.slice(1) : "wanderer";
}

const REACTIONS = {
  change: "An old skin, shed at last. The old self always clings the longest.",
  fear: "Ah. Fear is a loyal hound. It follows even when sent away.",
  attachment: "Mm. To hold on so tightly is its own kind of grief.",
  love: "The heart, always the heart. It is the most restless of tenants.",
  growth: "Roots first, then branches. Good. Slow things last.",
  stability: "Solid ground. Even witches build a hearth before a storm.",
  mind: "The lantern of reason. A fine light, though it casts long shadows.",
  intuition: "Yes... the quiet voice. It was never wrong, only ignored.",
  patience: "Time is the oldest teacher. She is rarely gentle, but she is fair.",
  beginning: "A blank page. How frightening, and how delicious.",
  belonging: "A hearth with your name on it. Many search a lifetime.",
  truth: "Brave. The truth you avoid is the one that follows you home.",
  ending: "Endings are only doors that forgot to announce themselves.",
  attention: "Attention is the only real spell. Where it falls, things grow.",
};

const majorData = [
  ["The Fool", "0", "new beginnings, openness and the courage to begin", "What might happen if you trusted yourself enough to take the first step?"],
  ["The Magician", "I", "agency, resourcefulness and turning intention into action", "Which of your existing abilities are you underestimating?"],
  [
    "The High Priestess",
    "II",
    "intuition, mystery and knowledge that has not yet become words",
    "What do you already sense but have not acknowledged?",
  ],
  ["The Empress", "III", "nurturing, abundance, sensuality and creative growth", "What in your life needs care rather than pressure?"],
  ["The Emperor", "IV", "structure, boundaries, responsibility and stability", "Where would a healthy boundary create more freedom?"],
  ["The Hierophant", "V", "tradition, shared wisdom, learning and belief systems", "Which beliefs are truly yours, and which were inherited?"],
  ["The Lovers", "VI", "connection, alignment, values and meaningful choices", "What choice would bring your actions closer to your values?"],
  ["The Chariot", "VII", "determination, direction and the integration of competing forces", "Where could focused effort help you move forward?"],
  ["Strength", "VIII", "quiet courage, compassion, patience and inner steadiness", "What would strength look like without self-punishment?"],
  ["The Hermit", "IX", "solitude, introspection and the search for an inner light", "What might you hear if you made room for silence?"],
  [
    "Wheel of Fortune",
    "X",
    "cycles, turning points, uncertainty and changing circumstances",
    "What cycle are you experiencing, and how might you meet it?",
  ],
  ["Justice", "XI", "fairness, accountability, discernment and consequences", "What truth would help you see this situation more clearly?"],
  [
    "The Hanged Man",
    "XII",
    "surrender, suspension and the value of a changed perspective",
    "What changes when you stop forcing an immediate answer?",
  ],
  ["Death", "XIII", "endings, transition, release and transformation", "What are you ready to let change form?"],
  ["Temperance", "XIV", "balance, integration, moderation and patient adjustment", "Where could a gentler pace bring things back into balance?"],
  ["The Devil", "XV", "attachment, temptation, limiting patterns and reclaimed agency", "Which pattern has more power over you than it deserves?"],
  [
    "The Tower",
    "XVI",
    "disruption, revelation and structures that can no longer hold",
    "What truth becomes visible when an old structure falls away?",
  ],
  ["The Star", "XVII", "renewal, hope, openness and quiet faith in possibility", "What small thing helps you feel hopeful again?"],
  ["The Moon", "XVIII", "dreams, ambiguity, instinct and the unknown", "Can you remain curious without needing every uncertainty resolved?"],
  ["The Sun", "XIX", "vitality, clarity, joy and permission to be seen", "Where could you allow yourself more uncomplicated joy?"],
  ["Judgement", "XX", "reckoning, awakening, reflection and answering a deeper call", "What part of yourself is asking to be heard again?"],
  [
    "The World",
    "XXI",
    "completion, integration, wholeness and a chapter coming together",
    "What have you completed that deserves to be acknowledged?",
  ],
];

const majorFortune = [2, 2, 1, 2, 1, 0, 2, 2, 2, 0, 1, 1, 0, -2, 2, -2, -3, 3, -1, 3, 1, 3];

const suitData = {
  Wands: {
    symbol: "✦",
    fortune: [2, 1, 2, 2, -1, 2, 0, 1, 1, -2, 1, 1, 1, 2],
    meanings: [
      "a spark of inspiration and a beginning full of potential",
      "planning, discovery and looking towards possibility",
      "expansion, foresight and preparing for what comes next",
      "celebration, belonging and a stable foundation",
      "friction, competition and learning to hold your ground",
      "recognition, progress and shared achievement",
      "defending your position and staying true to your convictions",
      "momentum, rapid developments and decisive movement",
      "resilience, boundaries and the final stretch of a challenge",
      "responsibility, exhaustion and the weight of carrying too much",
      "curiosity, creative messages and a willingness to experiment",
      "adventure, enthusiasm and the courage to follow an idea",
      "independence, confidence and creative self-possession",
      "leadership, warmth and the ability to inspire others",
    ],
  },
  Cups: {
    symbol: "♡",
    fortune: [2, 2, 2, -1, -2, 1, -1, -1, 2, 3, 1, 1, 2, 1],
    meanings: [
      "emotional openness and the beginning of a heartfelt connection",
      "mutual understanding, partnership and emotional reciprocity",
      "friendship, celebration and the nourishment of community",
      "withdrawal, dissatisfaction and the need to reconsider what is offered",
      "grief, disappointment and the parts of a story that still hurt",
      "memory, tenderness and the influence of the past",
      "many possibilities, fantasy and the need to distinguish desire from reality",
      "walking away from what no longer feels emotionally true",
      "contentment, pleasure and recognising what is already enough",
      "belonging, harmony and emotional fulfilment",
      "sensitivity, imagination and an emerging emotional insight",
      "romance, idealism and following the heart thoughtfully",
      "emotional maturity, compassion and generous understanding",
      "empathy, steadiness and a deep capacity to hold emotion",
    ],
  },
  Swords: {
    symbol: "⚔",
    fortune: [1, -1, -3, 1, -2, 1, 0, -2, -2, -3, 0, 0, 1, 1],
    meanings: [
      "a breakthrough, clarity and the beginning of a difficult truth",
      "indecision, opposing options and a truth not yet faced",
      "heartbreak, separation and painful but necessary honesty",
      "rest, recovery and a pause from mental strain",
      "conflict, hollow victory and the cost of needing to win",
      "transition, gradual healing and moving towards calmer waters",
      "strategy, secrecy and considering the ethics of your approach",
      "feeling restricted by fear, assumptions or a limited perspective",
      "anxiety, rumination and thoughts that grow louder in isolation",
      "an ending, exhaustion and the need to stop carrying what is over",
      "curiosity, alertness and questioning what you have been told",
      "swift ideas, directness and a desire to move immediately",
      "discernment, independence and clear-minded boundaries",
      "intellect, authority and the responsibility to use truth wisely",
    ],
  },
  Pentacles: {
    symbol: "✧",
    fortune: [2, 1, 2, 0, -2, 2, 1, 1, 2, 3, 1, 1, 2, 2],
    meanings: [
      "a practical opportunity and the seed of lasting potential",
      "adaptability, juggling responsibilities and finding your rhythm",
      "collaboration, craftsmanship and learning through shared work",
      "security, control and the tension between holding and sharing",
      "hardship, exclusion and the importance of accepting support",
      "generosity, reciprocity and the balance of giving and receiving",
      "patience, practice and trusting a process that takes time",
      "discipline, skill-building and pride in gradual improvement",
      "independence, comfort and enjoying what you have cultivated",
      "legacy, long-term stability and the foundations built over time",
      "study, grounded curiosity and a promising practical beginning",
      "reliability, patience and steady movement towards a goal",
      "self-respect, resourcefulness and a life built on your own terms",
      "responsibility, security and material wisdom",
    ],
  },
};

const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

function buildDeck() {
  const result = [];

  majorData.forEach((m, i) => {
    result.push({
      name: m[0],
      number: m[1],
      meaning: m[2],
      reflection: m[3],
      suit: "Major Arcana",
      symbol: "✶",
      rank: i,
      major: true,
      fortune: majorFortune[i],
      id: "major-" + i,
    });
  });

  Object.keys(suitData).forEach((suit) => {
    const data = suitData[suit];

    ranks.forEach((rank, i) => {
      const name = rank + " of " + suit;

      result.push({
        name,
        number: i === 0 ? "A" : i < 10 ? String(i + 1) : "",
        meaning: data.meanings[i],
        reflection: "How does " + data.meanings[i] + " relate to what is happening in your life?",
        suit,
        symbol: data.symbol,
        rank: i,
        major: false,
        fortune: data.fortune[i],
        id: suit.toLowerCase() + "-" + i,
      });
    });
  });

  return result;
}

// HELPERS
const NOTE = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function mixArr(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgbStr(c, a = 1) {
  return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a + ")";
}

function later(fn, ms) {
  const id = readingId;
  setTimeout(() => {
    if (id === readingId) fn();
  }, ms);
}

function toVirtual(mx, my) {
  const s = min(width / 1000, height / 700);
  const ox = (width - 1000 * s) / 2;
  const oy = (height - 700 * s) / 2;
  return { x: (mx - ox) / s, y: (my - oy) / s };
}

function cardPose(i) {
  return {
    x: CONFIG.spreadX[i],
    y: CONFIG.spreadY[i],
    rot: (i - 1) * 0.03,
  };
}

// SETUP
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-holder");

  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  textFont("Cormorant Garamond");
  noiseDetail(3, 0.5);

  deck = buildDeck();
  loadMusic();

  for (let i = 0; i < 180; i++) {
    stars.push({
      x: random(),
      y: random(0.0, 0.75),
      r: random(0.5, 2),
      phase: random(TWO_PI),
      speed: random(0.004, 0.023),
    });
  }

  for (let i = 0; i < 85; i++) motes.push(new Mote(false));

  for (let i = 0; i < 420; i++) {
    rain.push({
      x: random(-100, 1100),
      y: random(-50, 700),
      len: random(10, 24),
      speed: random(14, 24),
    });
  }

  for (let i = 0; i < 8; i++) {
    const puffs = [];
    for (let j = 0; j < 7; j++) {
      puffs.push({
        dx: (j - 3) * random(26, 36),
        dy: random(-14, 14) - abs(j - 3) * 4,
        r: random(40, 78),
      });
    }
    clouds.push({
      x: (i / 8) * 1200 + random(-60, 60),
      y: random(30, 150),
      s: random(0.9, 1.5),
      speed: random(0.4, 1.0),
      puffs,
    });
  }

  initAudio();
  initVoice();
  initFX();
  bindInterface();
  showQuestion();
}

// DRAW LOOP
function draw() {
  const dt = min(deltaTime, 50) / 16.67;

  updateWeather(dt);
  updateFX(dt);
  updateTheatrics(dt);
  updateBall(dt);
  updateRain(dt);
  updateReveal();
  updateMusic();
  updateHover(dt);

  drawSky();

  const scaleFactor = min(width / 1000, height / 700);
  const ox = (width - 1000 * scaleFactor) / 2;
  const oy = (height - 700 * scaleFactor) / 2;

  push();
  rectMode(CORNER);
  translate(ox, oy);

  if (shake > 0.2) translate(random(-shake, shake), random(-shake, shake));
  scale(scaleFactor);

  drawAtmosphere();
  drawMoon();
  drawSun();
  drawClouds();
  drawRainbow();
  drawTower();
  drawBirds();
  drawBolts(dt);
  drawLandscape();
  drawFog();
  drawLanterns();
  drawWitch();
  drawCrystalBall();
  drawCat();
  drawFrame();

  drawSpread();
  drawPetals();
  drawCandleLight();
  drawSpeechBubble(dt);

  drawRain();
  drawMotes();
  pop();

  drawVignette();

  if (flash > 0) {
    noStroke();
    fill(215, 228, 255, flash * 150);
    rect(0, 0, width, height);
  }

  if (goldFlash > 0.01) {
    noStroke();
    fill(255, 226, 160, goldFlash * 150);
    rect(0, 0, width, height);
  }

  if (sun > 0.01) {
    noStroke();
    fill(255, 176, 80, 24 * sun);
    rect(0, 0, width, height);
  }

  if (blackout > 0) {
    noStroke();
    fill(0, 0, 0, 205 * blackout);
    rect(0, 0, width, height);
  }

  drawIntro();
  drawPostFX();

  elapsed += 0.01 * dt;
}

function drawSky() {
  const night = {
    top: mixArr([46, 28, 66], [12, 9, 22], nightT),
    bot: mixArr([150, 70, 62], [40, 22, 30], nightT),
  };
  const dark = { top: [9, 12, 20], bot: [32, 38, 54] };
  const day = { top: [78, 108, 158], bot: [255, 206, 142] };

  const top = mixArr(mixArr(night.top, dark.top, storm), day.top, sun);
  const bot = mixArr(mixArr(night.bot, dark.bot, storm), day.bot, sun);

  const g = drawingContext.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, rgbStr(top));
  g.addColorStop(1, rgbStr(bot));
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
}

function drawVignette() {
  const flicker = noise(frameCount * 0.03) * 0.12;
  const alpha = constrain(0.55 - sun * 0.32 + flicker, 0, 0.8);
  const r = max(width, height);

  const g = drawingContext.createRadialGradient(width / 2, height / 2, min(width, height) * 0.28, width / 2, height / 2, r * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0," + alpha + ")");
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
}

function drawAtmosphere() {
  noStroke();

  const glowFade = 1 - sun * 0.8;
  for (let i = 0; i < 8; i++) {
    fill(90, 38, 42, (5 + i) * glowFade);
    ellipse(500, 340, 250 + i * 100, 180 + i * 65);
  }

  drawAurora();

  const starFade = (1 - max(storm * 0.85, sun)) * constrain((nightT - 0.15) / 0.6, 0, 1);

  if (starFade > 0.02) {
    for (const star of stars) {
      const twinkle = (sin(frameCount * star.speed + star.phase) + 1) / 2;
      fill(234, 216, 173, (70 + twinkle * 140) * starFade);
      circle(star.x * 1000, star.y * 700, star.r + twinkle);
    }

    stroke(183, 154, 97, 22 * starFade);
    strokeWeight(0.7);

    for (let i = 0; i < stars.length - 1; i += 17) {
      const a = stars[i];
      const b = stars[(i + 11) % stars.length];

      if (dist(a.x * 1000, a.y * 700, b.x * 1000, b.y * 700) < 150) {
        line(a.x * 1000, a.y * 700, b.x * 1000, b.y * 700);
      }
    }
  }
}

function drawMoon() {
  const vis = (1 - sun) * (1 - storm * 0.55) * constrain((nightT - 0.1) / 0.5, 0, 1);
  if (vis < 0.02) return;

  const x = 880;
  const y = 105 + sin(elapsed * 0.4) * 2;

  noStroke();
  for (let i = 5; i > 0; i--) {
    fill(230, 224, 200, 9 * vis * i);
    circle(x, y, 40 + i * 24);
  }

  fill(238, 230, 205, 235 * vis);
  circle(x, y, 40);

  fill(205, 196, 170, 120 * vis);
  circle(x - 7, y - 5, 9);
  circle(x + 8, y + 6, 6);
  circle(x + 2, y - 10, 4);
}

function drawSun() {
  if (sun < 0.01) return;

  const e = easeOutCubic(sun);
  const sx = 790;
  const sy = lerp(560, 140, e);

  push();
  blendMode(ADD);
  noStroke();

  for (let k = 0; k < 9; k++) {
    const base = PI * 0.55 + k * 0.1 + sin(elapsed * 0.5 + k) * 0.03;
    const spreadA = 0.035 + noise(k * 3.1, elapsed * 0.4) * 0.03;
    fill(255, 214, 140, 11 * e);
    beginShape();
    vertex(sx, sy);
    vertex(sx + cos(base - spreadA) * 1500, sy + sin(base - spreadA) * 1500);
    vertex(sx + cos(base + spreadA) * 1500, sy + sin(base + spreadA) * 1500);
    endShape(CLOSE);
  }

  for (let i = 8; i > 0; i--) {
    fill(255, 200, 120, 7 * e * i);
    circle(sx, sy, 70 + i * 44);
  }

  stroke(255, 226, 160, 120 * e);
  strokeWeight(1.4);
  for (let i = 0; i < 24; i++) {
    const a = (i * TWO_PI) / 24 + elapsed * 0.25;
    const inner = 46;
    const outer = 70 + sin(elapsed * 2 + i) * 12 + (i % 2) * 20;
    line(sx + cos(a) * inner, sy + sin(a) * inner, sx + cos(a) * outer, sy + sin(a) * outer);
  }

  noStroke();
  [
    [0.4, 26, 22],
    [0.7, 14, 28],
    [1.1, 40, 14],
    [1.5, 20, 20],
  ].forEach(([t, r, a]) => {
    fill(255, 220 - t * 40, 150 + t * 30, a * e);
    circle(lerp(sx, 500, t), lerp(sy, 350, t), r * 2);
  });
  stroke(255, 236, 190, 22 * e);
  strokeWeight(2);
  line(sx - 420, sy, sx + 420, sy);
  noFill();
  stroke(255, 232, 170, 150 * goldFlash);
  strokeWeight(3);
  circle(sx, sy, (1 - goldFlash) * 1400);
  pop();

  noStroke();
  fill(255, 240, 200, 255 * e);
  circle(sx, sy, 80);
  fill(255, 252, 235, 255 * e);
  circle(sx, sy, 56);
}

function drawClouds() {
  const cover = constrain(storm + (1 - storm - sun) * 0.1, 0, 1) * (1 - sun);
  if (cover < 0.02) return;

  noStroke();

  for (const c of clouds) {
    const split = (c.x < 500 ? -1 : 1) * sun * 450;
    const cx = ((c.x + elapsed * c.speed * 40) % 1300) - 150 + split;
    const base = lerp(58, 26, storm);
    const lit = flash * 150;

    for (let pass = 0; pass < 2; pass++) {
      const shade = pass === 0 ? base * 0.62 : base;
      fill(min(255, shade + lit), min(255, shade + lit + 4), min(255, shade + 12 + lit * 1.1), (pass === 0 ? 220 : 190) * cover);

      for (const p of c.puffs) {
        circle(cx + p.dx * c.s, c.y + p.dy * c.s + (pass === 0 ? 14 : 0) + storm * 24, p.r * c.s * (pass === 0 ? 1.06 : 0.92));
      }
    }
  }
}

function drawBolts(dt) {
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    const age = millis() - b.born;
    const w = b.width || 1;

    push();
    noFill();
    strokeCap(ROUND);

    if (age < b.leader) {
      // the faint leader crawling down from the cloud before the strike lands
      const reveal = lerp(-20, b.gy + 210, age / b.leader);
      stroke(170, 190, 255, 150);
      strokeWeight(1.2 * w);
      for (const s of b.segs) if (s[1] <= reveal) line(s[0], s[1], s[2], s[3]);
      pop();
      continue;
    }

    if (b.life > 0) {
      const a = b.life * (0.65 + random(0.35));

      if (b.big) {
        blendMode(ADD);
        stroke(110, 140, 255, 34 * a);
        strokeWeight(28);
        for (const s of b.segs) line(s[0], s[1], s[2], s[3]);
        blendMode(BLEND);
      }

      stroke(150, 175, 255, 50 * a);
      strokeWeight(11 * w);
      for (const s of b.segs) line(s[0], s[1], s[2], s[3]);

      stroke(200, 218, 255, 130 * a);
      strokeWeight(4 * w);
      for (const s of b.segs) line(s[0], s[1], s[2], s[3]);

      stroke(255, 255, 255, 255 * a);
      strokeWeight(1.6 * w);
      for (const s of b.segs) line(s[0], s[1], s[2], s[3]);

      noStroke();
      fill(190, 205, 255, 80 * a);
      ellipse(b.gx, b.gy, (120 * a + 20) * w, (26 * a + 6) * w);
      noFill();
      stroke(190, 205, 255, 110 * b.life);
      strokeWeight(2);
      ellipse(b.gx, b.gy, (1 - b.life) * 320 * w, (1 - b.life) * 60 * w);

      b.life -= 0.045 * dt;
    } else if (b.ghost > 0) {
      // the bolt burns on in the eye for a moment after it has gone
      stroke(170, 190, 255, 55 * b.ghost);
      strokeWeight(2.4);
      for (const s of b.segs) line(s[0], s[1], s[2], s[3]);
      b.ghost -= 0.012 * dt;
    }

    pop();

    if (b.life <= 0 && !(b.ghost > 0)) bolts.splice(i, 1);
  }
}

function drawLandscape() {
  noStroke();

  for (let layer = 0; layer < 4; layer++) {
    const base = 500 + layer * 35;

    const r = lerp(31 + layer * 8, 96 + layer * 12, sun) * (1 - storm * 0.12);
    const g = lerp(24 + layer * 3, 74 + layer * 8, sun) * (1 - storm * 0.05);
    const b = lerp(26 + layer * 3, 52 + layer * 6, sun) + storm * 8;

    fill(r + flash * 60, g + flash * 60, b + flash * 70, 100 + layer * 25 + sun * 40);

    beginShape();
    vertex(0, 700);

    for (let x = 0; x <= 1000; x += 10) {
      const n = noise(x * 0.003, layer * 0.3, frameCount * 0.001);
      vertex(x, base + n * (24 + layer * 8) + sin(x * 0.01 + elapsed) * 3);
    }

    vertex(1000, 700);
    endShape(CLOSE);
  }

  stroke(183, 154, 97, 45);
  strokeWeight(0.7);
  line(0, 505, 1000, 505);
}

function drawFog() {
  noStroke();
  const a = (9 + storm * 7) * (1 - sun * 0.85);
  if (a < 0.5) return;

  for (let i = 0; i < 6; i++) {
    for (let x = -80; x <= 1080; x += 70) {
      const n = noise(x * 0.004 + elapsed * 0.2, i * 5.3);
      const fx = x + n * 40;
      const fy = 440 + i * 36 + n * 16;
      fill(196, 186, 206, a * fogClear(fx, fy));
      ellipse(fx, fy, 200, 34 + n * 18);
    }
  }
}

function drawRain() {
  const count = floor(storm * rain.length * (0.45 + 0.55 * stormPower));
  if (count < 1) return;

  stroke(175, 195, 235, 95);
  strokeWeight(1);

  for (let i = 0; i < count; i++) {
    const d = rain[i];
    line(d.x, d.y, d.x + d.len * windSlope(), d.y - d.len);
  }

  noFill();
  stroke(175, 195, 235, 60);
  for (let i = 0; i < floor(storm * 30); i++) ellipse(random(1000), random(515, 690), random(6, 14), 2.5);
}

function drawFrame() {
  noFill();
  stroke(183, 154, 97, 60);
  strokeWeight(1);
  rect(15, 15, 970, 670);

  stroke(183, 154, 97, 28);
  rect(21, 21, 958, 658);

  noStroke();
  fill(183, 154, 97, 90);
  textFont("Space Mono");
  textSize(7);
  textAlign(LEFT);
  text("THE UNWRITTEN ARCANA · VOL. I", 30, 674);
  textAlign(RIGHT);
  text("A SYMBOLIC SELF-PORTRAIT", 970, 674);
  textAlign(CENTER);
  fill(183, 154, 97, 70);
  text("M · SOUND     V · VOICE     SPACE · NEW READING", 500, 674);
  if (musicLoaded) text("MUSIC · " + CONFIG.musicCredit, 500, 652);
  textFont("Cormorant Garamond");
}

// INPUT
function mousePressed(event) {
  if (!readingComplete || !revealDone) return;
  if (event && event.target && event.target.tagName !== "CANVAS") return;
  if (!document.getElementById("card-detail").classList.contains("hidden")) return;

  if (hoverIndex >= 0) {
    openDetail(spread[hoverIndex]);
    playNote([523.25, 659.25, 784][hoverIndex]);
  }
}

function openDetail(card) {
  document.getElementById("detail-number").textContent = card.major ? "MAJOR ARCANA · " + card.number : card.suit.toUpperCase();

  document.getElementById("detail-name").textContent = card.name;
  document.getElementById("detail-position").textContent = "YOUR " + card.position + " CARD";

  document.getElementById("detail-meaning").textContent = "Upright meaning: " + card.meaning + ".";

  document.getElementById("detail-reflection").textContent = card.reflection;

  document.getElementById("card-detail").classList.remove("hidden");
}

function closeDetail() {
  document.getElementById("card-detail").classList.add("hidden");
}

function resetReading() {
  readingId++;

  started = true;
  readingComplete = false;
  revealDone = false;
  questionIndex = 0;
  spread = [];
  mood = 0;
  fortune = 0;
  verdict = "sun";
  flips = [0, 0, 0];
  flipStarted = [false, false, false];
  flipBegin = [-1, -1, -1];
  flipLanded = [false, false, false];
  hoverLift = [0, 0, 0];
  stormGoal = 0;
  sunGoal = 0;
  bolts = [];
  resetFX();
  stopVoice();

  document.getElementById("final-panel").classList.add("hidden");
  document.getElementById("question-panel").classList.remove("hidden");
  document.getElementById("card-detail").classList.add("hidden");

  showQuestion();
  ring(NOTE(55), 0.07);

  speak(WITCH_LINES.again + "\n\n" + questions[0].text);
}

function keyPressed() {
  if (key === " " || keyCode === 32) {
    if (readingComplete) resetReading();
    return false;
  }

  if (key === "m" || key === "M") toggleSound();
  if (key === "v" || key === "V") toggleVoice();
  if (keyCode === ESCAPE) closeDetail();

  if (revealDone) {
    if (key === "1") setWeather("storm", true);
    if (key === "2") setWeather("sun");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setMaster(v, ramp = 0) {
  try {
    if (typeof p5 !== "undefined" && p5.prototype && typeof p5.prototype.masterVolume === "function") {
      p5.prototype.masterVolume.call(p5.instance || {}, v, ramp);
      return;
    }
  } catch {}

  try {
    const out = p5.soundOut;
    const gain = out.output.gain;
    const t = out.audiocontext.currentTime;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(v, t + ramp + 0.001);
  } catch {}
}
