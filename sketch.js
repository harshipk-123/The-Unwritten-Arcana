
let started = false;
let soundOn = true;
let readingComplete = false;
let questionIndex = 0;
let answers = [];
let deck = [];
let spread = [];
let stars = [];
let motes = [];
let mood = 0;
let elapsed = 0;
let drone, noteOsc, shimmer, reverb;

const questions = [
  {
    text: "What are you ready to release?",
    options: [
      ["An old version of myself", "change"],
      ["A fear I keep returning to", "fear"],
      ["Something I am not ready to lose", "attachment"]
    ]
  },
  {
    text: "Where does your energy feel most needed?",
    options: [
      ["In my relationships", "love"],
      ["In my own growth", "growth"],
      ["In finding stability", "stability"]
    ]
  },
  {
    text: "What do you tend to trust first?",
    options: [
      ["What I can reason through", "mind"],
      ["What I feel intuitively", "intuition"],
      ["What life shows me over time", "patience"]
    ]
  },
  {
    text: "What are you moving towards?",
    options: [
      ["A new beginning", "beginning"],
      ["A sense of belonging", "belonging"],
      ["A truth I have avoided", "truth"]
    ]
  },
  {
    text: "What would you most like to understand?",
    options: [
      ["What is ending", "ending"],
      ["What is growing", "growth"],
      ["What deserves my attention", "attention"]
    ]
  }
];

// The 22 Major Arcana.
const majorData = [
  ["The Fool","0","new beginnings, openness and the courage to begin","What might happen if you trusted yourself enough to take the first step?"],
  ["The Magician","I","agency, resourcefulness and turning intention into action","Which of your existing abilities are you underestimating?"],
  ["The High Priestess","II","intuition, mystery and knowledge that has not yet become words","What do you already sense but have not acknowledged?"],
  ["The Empress","III","nurturing, abundance, sensuality and creative growth","What in your life needs care rather than pressure?"],
  ["The Emperor","IV","structure, boundaries, responsibility and stability","Where would a healthy boundary create more freedom?"],
  ["The Hierophant","V","tradition, shared wisdom, learning and belief systems","Which beliefs are truly yours, and which were inherited?"],
  ["The Lovers","VI","connection, alignment, values and meaningful choices","What choice would bring your actions closer to your values?"],
  ["The Chariot","VII","determination, direction and the integration of competing forces","Where could focused effort help you move forward?"],
  ["Strength","VIII","quiet courage, compassion, patience and inner steadiness","What would strength look like without self-punishment?"],
  ["The Hermit","IX","solitude, introspection and the search for an inner light","What might you hear if you made room for silence?"],
  ["Wheel of Fortune","X","cycles, turning points, uncertainty and changing circumstances","What cycle are you experiencing, and how might you meet it?"],
  ["Justice","XI","fairness, accountability, discernment and consequences","What truth would help you see this situation more clearly?"],
  ["The Hanged Man","XII","surrender, suspension and the value of a changed perspective","What changes when you stop forcing an immediate answer?"],
  ["Death","XIII","endings, transition, release and transformation","What are you ready to let change form?"],
  ["Temperance","XIV","balance, integration, moderation and patient adjustment","Where could a gentler pace bring things back into balance?"],
  ["The Devil","XV","attachment, temptation, limiting patterns and reclaimed agency","Which pattern has more power over you than it deserves?"],
  ["The Tower","XVI","disruption, revelation and structures that can no longer hold","What truth becomes visible when an old structure falls away?"],
  ["The Star","XVII","renewal, hope, openness and quiet faith in possibility","What small thing helps you feel hopeful again?"],
  ["The Moon","XVIII","dreams, ambiguity, instinct and the unknown","Can you remain curious without needing every uncertainty resolved?"],
  ["The Sun","XIX","vitality, clarity, joy and permission to be seen","Where could you allow yourself more uncomplicated joy?"],
  ["Judgement","XX","reckoning, awakening, reflection and answering a deeper call","What part of yourself is asking to be heard again?"],
  ["The World","XXI","completion, integration, wholeness and a chapter coming together","What have you completed that deserves to be acknowledged?"]
];

const suitData = {
  Wands: {
    symbol: "✦",
    theme: "energy, ambition, creativity and action",
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
      "leadership, warmth and the ability to inspire others"
    ]
  },
  Cups: {
    symbol: "♡",
    theme: "emotion, connection, imagination and inner life",
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
      "empathy, steadiness and a deep capacity to hold emotion"
    ]
  },
  Swords: {
    symbol: "⚔",
    theme: "thought, truth, decisions and mental patterns",
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
      "intellect, authority and the responsibility to use truth wisely"
    ]
  },
  Pentacles: {
    symbol: "✧",
    theme: "material life, work, stability and tangible growth",
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
      "responsibility, security and material wisdom"
    ]
  }
};

const ranks = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven",
  "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"
];

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
      id: "major-" + i
    });
  });

  Object.keys(suitData).forEach(suit => {
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
        id: suit.toLowerCase() + "-" + i
      });
    });
  });

  return result;
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-holder");

  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  textFont("Cormorant Garamond");
  noiseDetail(3, 0.5);

  deck = buildDeck();

  for (let i = 0; i < 180; i++) {
    stars.push({
      x: random(),
      y: random(),
      r: random(0.5, 2),
      phase: random(TWO_PI),
      speed: random(0.004, 0.023)
    });
  }

  for (let i = 0; i < 85; i++) {
    motes.push(new Mote(false));
  }

  initAudio();
  bindInterface();
  showQuestion();
}

function initAudio() {
  drone = new p5.Oscillator("sine");
  drone.freq(55);
  drone.amp(0);
  drone.start();

  noteOsc = new p5.Oscillator("triangle");
  noteOsc.freq(220);
  noteOsc.amp(0);
  noteOsc.start();

  shimmer = new p5.Oscillator("sine");
  shimmer.freq(440);
  shimmer.amp(0);
  shimmer.start();

  reverb = new p5.Reverb();
  reverb.process(shimmer, 3.5, 2);
}

function bindInterface() {
  document.getElementById("enter-button").addEventListener("click", beginReading);

  document.getElementById("sound-button").addEventListener("click", toggleSound);

  document.getElementById("reset-button").addEventListener("click", resetReading);

  document.getElementById("print-button").addEventListener("click", () => {
    window.print();
  });

  document.getElementById("close-detail").addEventListener("click", closeDetail);

  document.getElementById("card-detail").addEventListener("click", event => {
    if (event.target.id === "card-detail") closeDetail();
  });
}

function beginReading() {
  userStartAudio();
  started = true;
  soundOn = true;

  document.getElementById("intro-overlay").classList.add("hidden");
  drone.amp(0.026, 1.8);

  updateSoundUI();
  playNote(261.63, 0.8);
}

function updateSoundUI() {
  document.getElementById("sound-status").textContent =
    soundOn ? "SOUND · ON" : "SOUND · OFF";

  document.getElementById("sound-button").textContent =
    soundOn ? "SOUND ON" : "SOUND OFF";
}

function toggleSound() {
  soundOn = !soundOn;

  if (soundOn) {
    userStartAudio();
    drone.amp(0.026, 0.5);
  } else {
    drone.amp(0, 0.5);
    shimmer.amp(0, 0.2);
    noteOsc.amp(0, 0.2);
  }

  updateSoundUI();
}

function playNote(frequency, duration = 0.7) {
  if (!soundOn || !started) return;

  noteOsc.freq(frequency);
  noteOsc.amp(0.055, 0.04);
  noteOsc.amp(0, duration);

  shimmer.freq(frequency * 2.01);
  shimmer.amp(0.018, 0.05);
  shimmer.amp(0, duration * 1.6);
}

function showQuestion() {
  const item = questions[questionIndex];

  document.getElementById("question").textContent = item.text;
  document.getElementById("question-number").textContent =
    "QUESTION " + roman(questionIndex + 1) + " / V";

  document.getElementById("progress-fill").style.width =
    (questionIndex / questions.length * 100) + "%";

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.textContent = option[0];

    button.addEventListener("click", () => {
      answerQuestion(option[1], index);
    });

    choices.appendChild(button);
  });
}

function answerQuestion(answer, optionIndex) {
  if (!started || readingComplete) return;

  answers.push(answer);
  mood += (optionIndex - 1) * 0.65 + 0.4;
  questionIndex++;

  playNote([220, 277.18, 329.63][optionIndex], 0.65);

  for (let i = 0; i < 14; i++) {
    motes.push(new Mote(true));
  }

  if (questionIndex >= questions.length) {
    revealSpread();
  } else {
    showQuestion();
  }
}

function revealSpread() {
  readingComplete = true;

  // Shuffle all 78 cards; each card can appear only once in the spread.
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // The five answers influence the draw without dictating a fixed result.
  const offset = abs(floor(mood * 7)) % 15;
  spread = shuffled.slice(offset, offset + 3);

  // Use the normal spread positions: Past, Present, Future.
  spread.forEach((card, i) => {
    card.position = ["PAST", "PRESENT", "FUTURE"][i];
  });

  // The question panel disappears for the rest of this reading.
  document.getElementById("question-panel").classList.add("hidden");

  renderFinalReading();

  // A gentle sequence of tones accompanies the reveal.
  setTimeout(() => playNote(261.63, 1.0), 200);
  setTimeout(() => playNote(329.63, 1.0), 650);
  setTimeout(() => playNote(392.00, 1.4), 1100);
}

function renderFinalReading() {
  const title = createReadingTitle();
  const summary = createReadingSummary();

  document.getElementById("reading-title").textContent = title;
  document.getElementById("reading-summary").textContent = summary;

  document.getElementById("journal-question").textContent =
    chooseJournalQuestion();

  document.getElementById("final-panel").classList.remove("hidden");
}

function createReadingTitle() {
  const majorCount = spread.filter(card => card.major).length;

  if (majorCount >= 2) return "A turning point in the story";
  if (spread.some(card => card.suit === "Cups")) return "The heart of the matter";
  if (spread.some(card => card.suit === "Swords")) return "The truth beneath the noise";
  if (spread.some(card => card.suit === "Wands")) return "The fire that moves you";
  if (spread.some(card => card.suit === "Pentacles")) return "What is taking root";

  return "The story beneath the surface";
}

function createReadingSummary() {
  const past = spread[0];
  const present = spread[1];
  const future = spread[2];

  const pastPhrase = firstPhrase(past.meaning);
  const presentPhrase = firstPhrase(present.meaning);
  const futurePhrase = firstPhrase(future.meaning);

  return "The past carries " + pastPhrase + ". In the present, " +
    presentPhrase + " asks for your attention. The future opens towards " +
    futurePhrase + ". Read these cards as a conversation between what shaped you, " +
    "what you are meeting now, and what you might choose to cultivate next.";
}

function firstPhrase(text) {
  return text.replace(/[.;].*$/, "").trim();
}

function chooseJournalQuestion() {
  const all = spread.map(card => card.reflection);
  return all[floor(random(all.length))];
}

function roman(n) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n - 1] || String(n);
}

function draw() {
  background(17, 12, 14);

  const scaleFactor = min(width / 1000, height / 700);
  const ox = (width - 1000 * scaleFactor) / 2;
  const oy = (height - 700 * scaleFactor) / 2;

  push();
  translate(ox, oy);
  scale(scaleFactor);

  drawAtmosphere();
  drawLandscape();
  drawFrame();

  if (!readingComplete) {
    drawFaceDownSpread();
  } else {
    drawFinalSpread();
  }

  drawMotes();
  pop();

  elapsed += 0.01;
}

function drawAtmosphere() {
  noStroke();

  for (let i = 0; i < 8; i++) {
    fill(90, 38, 42, 5 + i);
    ellipse(500, 340, 250 + i * 100, 180 + i * 65);
  }

  for (const star of stars) {
    const twinkle = (sin(frameCount * star.speed + star.phase) + 1) / 2;
    fill(234, 216, 173, 70 + twinkle * 140);
    circle(star.x * 1000, star.y * 700, star.r + twinkle);
  }

  // Fine celestial lines appear and fade slowly.
  stroke(183, 154, 97, 22);
  strokeWeight(0.7);

  for (let i = 0; i < stars.length - 1; i += 17) {
    const a = stars[i];
    const b = stars[(i + 11) % stars.length];

    if (dist(a.x * 1000, a.y * 700, b.x * 1000, b.y * 700) < 150) {
      line(a.x * 1000, a.y * 700, b.x * 1000, b.y * 700);
    }
  }
}

function drawLandscape() {
  noStroke();

  for (let layer = 0; layer < 4; layer++) {
    const base = 500 + layer * 35;

    fill(
      31 + layer * 8,
      24 + layer * 3,
      26 + layer * 3,
      100 + layer * 25
    );

    beginShape();
    vertex(0, 700);

    for (let x = 0; x <= 1000; x += 10) {
      const n = noise(x * 0.003, layer * 0.3, frameCount * 0.001);
      vertex(x, base + n * (24 + layer * 8) + sin(x * 0.01 + elapsed) * 3);
    }

    vertex(1000, 700);
    endShape(CLOSE);
  }

  // Decorative horizon line.
  stroke(183, 154, 97, 45);
  strokeWeight(0.7);
  line(0, 505, 1000, 505);
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
  textFont("Cormorant Garamond");
}

function drawFaceDownSpread() {
  const positions = [
    { x: 330, y: 350 },
    { x: 500, y: 330 },
    { x: 670, y: 350 }
  ];

  positions.forEach((p, i) => {
    push();
    translate(p.x, p.y + sin(elapsed + i) * 3);
    rotate((i - 1) * 0.035);
    drawCardBack();
    pop();
  });

  noStroke();
  fill(234, 216, 173, 145);
  textAlign(CENTER);
  textSize(11);
  text("FIVE ANSWERS · THREE CARDS", 500, 500);
}

function drawCardBack() {
  rectMode(CENTER);
  drawingContext.save();
  drawingContext.shadowBlur = 22;
  drawingContext.shadowColor = "rgba(0,0,0,.5)";

  fill(225, 211, 184);
  stroke(183, 154, 97);
  strokeWeight(1);
  rect(0, 0, 128, 198, 2);

  drawingContext.restore();

  noFill();
  stroke(61, 42, 35);
  rect(0, 0, 118, 188, 1);
  rect(0, 0, 108, 178, 1);

  // Repeating engraved diamonds.
  stroke(99, 49, 48, 170);
  for (let i = -4; i <= 4; i++) {
    line(-43, i * 19, 43, i * 19);
    line(i * 10, -82, i * 10, 82);
  }

  noFill();
  stroke(183, 154, 97);
  circle(0, 0, 62);
  circle(0, 0, 50);
  drawRosette(0, 0, 24, 12);

  noStroke();
  fill(65, 43, 35);
  textAlign(CENTER);
  textSize(7);
  text("ARCANA", 0, 84);
}

function drawFinalSpread() {
  const positions = [
    { x: 300, y: 325 },
    { x: 500, y: 305 },
    { x: 700, y: 325 }
  ];

  spread.forEach((card, i) => {
    const p = positions[i];

    push();
    translate(p.x, p.y + sin(elapsed + i) * 2);
    rotate((i - 1) * 0.018);
    drawTarotCard(card);
    pop();

    noStroke();
    fill(234, 216, 173);
    textAlign(CENTER);
    textFont("Space Mono");
    textSize(9);
    text(card.position, p.x, 445);
    textFont("Cormorant Garamond");
  });
}

function drawTarotCard(card) {
  const w = 128;
  const h = 198;
  const paper = [232, 220, 191];
  const ink = card.suit === "Cups" ? [104, 48, 55]
    : card.suit === "Swords" ? [48, 65, 75]
    : card.suit === "Wands" ? [65, 82, 57]
    : card.suit === "Pentacles" ? [139, 105, 49]
    : [55, 43, 38];

  rectMode(CENTER);

  drawingContext.save();
  drawingContext.shadowBlur = 22;
  drawingContext.shadowColor = "rgba(0,0,0,.42)";

  noStroke();
  fill(...paper);
  rect(0, 0, w, h, 2);

  drawingContext.restore();

  stroke(54, 40, 32);
  strokeWeight(1);
  noFill();
  rect(0, 0, w - 7, h - 7, 1);

  stroke(183, 154, 97);
  rect(0, 0, w - 13, h - 13, 1);

  // Card header and footer.
  noStroke();
  fill(...ink);
  textAlign(CENTER);
  textFont("IM Fell English");
  textSize(card.name.length > 18 ? 9 : 11);
  text(card.name.toUpperCase(), 0, -79);

  stroke(...ink);
  strokeWeight(0.7);
  line(-48, -68, 48, -68);
  line(-48, 69, 48, 69);

  // Decorative central cartouche.
  noFill();
  stroke(...ink);
  strokeWeight(0.8);
  rect(0, 0, 96, 128, 1);

  push();
  translate(0, -1);
  drawCardIllustration(card, ink);
  pop();

  noStroke();
  fill(...ink);
  textFont("IM Fell English");
  textSize(8);
  text(card.major ? card.number : card.symbol, 0, 84);

  // Small corner ornaments.
  drawCornerOrnaments(w, h, ink);

  textFont("Cormorant Garamond");
}

function drawCornerOrnaments(w, h, ink) {
  stroke(...ink);
  strokeWeight(0.8);
  noFill();

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      push();
      translate(sx * (w / 2 - 14), sy * (h / 2 - 14));
      rotate(sx * sy * PI / 4);
      line(-4, 0, 4, 0);
      line(0, -4, 0, 4);
      circle(0, 0, 5);
      pop();
    }
  }
}

function drawCardIllustration(card, ink) {
  stroke(...ink);
  strokeWeight(1.15);
  noFill();

  if (!card.major) {
    drawMinorIllustration(card, ink);
  } else {
    drawMajorIllustration(card, ink);
  }

  // Engraved ground and decorative sun.
  stroke(...ink, 125);
  line(-36, 51, 36, 51);
  noFill();
  circle(0, -48, 10);
  for (let i = 0; i < 8; i++) {
    const a = i * TWO_PI / 8;
    line(cos(a) * 8, -48 + sin(a) * 8,
         cos(a) * 12, -48 + sin(a) * 12);
  }
}

function drawMinorIllustration(card, ink) {
  const count = Math.min(10, card.rank + 1);
  const symbol = card.symbol;

  // Number cards display suit emblems in a balanced, engraved arrangement.
  if (card.rank < 10) {
    const cols = count > 4 ? 2 : 1;
    const rows = ceil(count / cols);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = floor(i / cols);
      const x = cols === 1 ? 0 : (col === 0 ? -22 : 22);
      const y = -32 + row * (64 / max(1, rows - 1));

      push();
      translate(x, y);
      drawSuitSymbol(card.suit, 10);
      pop();
    }

    // A fine floral stem ties the pips together visually.
    stroke(...ink, 110);
    beginShape();
    for (let y = -38; y <= 40; y += 8) {
      vertex(sin(y * 0.08) * 4, y);
    }
    endShape();
  } else {
    // Court cards use a distinct figure silhouette and suit emblem.
    const rank = card.rank;

    line(-23, 37, 23, 37);
    line(-18, 37, -14, -4);
    line(18, 37, 14, -4);

    // Robe / torso.
    beginShape();
    vertex(-14, -4);
    vertex(-24, 31);
    vertex(24, 31);
    vertex(14, -4);
    endShape(CLOSE);

    // Head, crown and neck.
    circle(0, -20, 19);
    line(-8, -31, -12, -39);
    line(-12, -39, 0, -34);
    line(0, -34, 12, -39);
    line(12, -39, 8, -31);

    line(-5, -9, -5, -4);
    line(5, -9, 5, -4);

    // A held suit symbol identifies the court role.
    push();
    translate(rank === 11 ? 26 : -26, -5);
    drawSuitSymbol(card.suit, 9);
    pop();

    // Ornamental robe patterns.
    for (let i = 0; i < 3; i++) {
      line(-12 + i * 8, 9, -9 + i * 8, 23);
    }
  }
}

function drawMajorIllustration(card, ink) {
  const idx = card.rank;
  const r = 25 + (idx % 4) * 3;

  // Every Major Arcana has a different central symbolic motif.
  if (idx === 0) { // Fool
    circle(0, -15, 17);
    line(-3, -6, -12, 26);
    line(3, -6, 15, 26);
    line(-12, 26, 0, 33);
    line(15, 26, 22, 33);
    line(-3, -6, 15, 7);
    circle(24, 11, 7);
    drawRosette(-26, 30, 8, 6);
  } else if (idx === 1) { // Magician
    drawRosette(0, -20, 15, 8);
    line(-20, 25, -20, -3);
    line(20, 25, 20, -3);
    line(-20, -3, 20, -3);
    line(-12, 25, 12, 25);
    line(0, -3, 0, 35);
    line(-22, 35, 22, 35);
  } else if (idx === 2) { // High Priestess
    line(-27, 35, -27, -25);
    line(27, 35, 27, -25);
    arc(0, -4, 28, 36, PI, TWO_PI);
    line(-25, 35, 25, 35);
    drawCrescent(0, -5, 16);
    drawRosette(0, -35, 6, 8);
  } else if (idx === 3) { // Empress
    drawRosette(0, -15, 24, 8);
    for (let i = 0; i < 5; i++) {
      const x = -24 + i * 12;
      line(x, 14, x + sin(i) * 5, 42);
      circle(x + sin(i) * 5, 42, 5);
    }
    arc(0, 16, 54, 35, PI, TWO_PI);
  } else if (idx === 4) { // Emperor
    line(-25, 35, -25, -20);
    line(25, 35, 25, -20);
    line(-25, -20, 25, -20);
    circle(0, -5, 22);
    line(-18, 10, -27, 35);
    line(18, 10, 27, 35);
    line(-27, 35, 27, 35);
    drawRosette(0, -37, 8, 4);
  } else if (idx === 5) { // Hierophant
    triangle(0, -42, -25, 2, 25, 2);
    circle(0, 12, 20);
    line(-18, 24, -24, 43);
    line(18, 24, 24, 43);
    line(-24, 43, 24, 43);
  } else if (idx === 6) { // Lovers
    drawRosette(-20, -22, 10, 6);
    drawRosette(20, -22, 10, 6);
    beginShape();
    vertex(0, 35);
    bezierVertex(-42, 5, -30, -15, 0, 3);
    bezierVertex(30, -15, 42, 5, 0, 35);
    endShape();
  } else if (idx === 7) { // Chariot
    rectMode(CENTER);
    rect(0, 5, 32, 35);
    circle(-21, 28, 18);
    circle(21, 28, 18);
    line(-18, -13, -18, -32);
    line(18, -13, 18, -32);
    line(-25, -32, 25, -32);
    drawRosette(0, -20, 7, 8);
  } else if (idx === 8) { // Strength
    drawRosette(0, -30, 10, 8);
    arc(0, 8, 45, 34, PI, TWO_PI);
    arc(0, 8, 45, 34, 0, PI);
    line(-23, 8, -17, 34);
    line(23, 8, 17, 34);
    line(-17, 34, 17, 34);
  } else if (idx === 9) { // Hermit
    line(0, -25, 0, 34);
    circle(0, -27, 15);
    drawRosette(0, -27, 5, 6);
    line(-15, 34, 15, 34);
    line(-8, 34, 0, 43);
    line(8, 34, 0, 43);
  } else if (idx === 10) { // Wheel
    circle(0, 0, 56);
    circle(0, 0, 43);
    circle(0, 0, 18);
    for (let i = 0; i < 8; i++) {
      const a = i * TWO_PI / 8;
      line(cos(a) * 9, sin(a) * 9, cos(a) * 27, sin(a) * 27);
    }
  } else if (idx === 11) { // Justice
    line(0, -24, 0, 36);
    line(-24, -18, 24, -18);
    line(-24, -18, -24, 2);
    line(24, -18, 24, 2);
    arc(-24, 4, 22, 12, 0, PI);
    arc(24, 4, 22, 12, 0, PI);
    line(-18, 36, 18, 36);
    drawRosette(0, -31, 6, 8);
  } else if (idx === 12) { // Hanged Man
    line(-25, -24, 25, -24);
    line(-18, -24, -18, 34);
    line(-18, -24, 8, -7);
    circle(12, -1, 16);
    line(12, 7, -3, 30);
    line(-3, 30, 13, 37);
    drawRosette(12, -1, 7, 8);
  } else if (idx === 13) { // Death
    line(-27, -30, 27, 30);
    line(-27, 30, 27, -30);
    circle(0, 0, 29);
    drawRosette(0, 0, 9, 8);
    for (let i = 0; i < 4; i++) {
      circle(-24 + i * 16, 39, 4);
    }
  } else if (idx === 14) { // Temperance
    circle(0, -20, 18);
    line(-10, -8, -22, 17);
    line(10, -8, 22, 17);
    arc(-13, 20, 22, 18, 0, PI);
    arc(13, 20, 22, 18, 0, PI);
    line(-13, 29, 13, 29);
    line(0, 0, 0, 36);
  } else if (idx === 15) { // Devil
    triangle(0, -35, -29, 22, 29, 22);
    circle(0, -5, 20);
    line(-25, 34, 25, 34);
    line(-17, 34, -17, 22);
    line(17, 34, 17, 22);
    drawRosette(0, -5, 5, 5);
  } else if (idx === 16) { // Tower
    line(-17, 36, -17, -18);
    line(17, 36, 17, -18);
    line(-17, -18, 17, -18);
    line(-25, 36, 25, 36);
    line(-25, -28, -8, -18);
    line(25, -34, 8, -18);
    line(-4, -43, 4, -29);
    for (let i = 0; i < 4; i++) {
      line(-12 + i * 8, -5, -12 + i * 8, 25);
    }
  } else if (idx === 17) { // Star
    drawRosette(0, -3, 12, 8);
    for (let i = 0; i < 7; i++) {
      const a = i * TWO_PI / 7;
      drawRosette(cos(a) * 33, sin(a) * 33, 4, 5);
    }
  } else if (idx === 18) { // Moon
    drawCrescent(0, -3, 35);
    drawRosette(-25, 25, 4, 5);
    drawRosette(25, 25, 4, 5);
    arc(0, 33, 52, 30, PI, TWO_PI);
  } else if (idx === 19) { // Sun
    circle(0, 0, 39);
    for (let i = 0; i < 16; i++) {
      const a = i * TWO_PI / 16;
      line(cos(a) * 25, sin(a) * 25, cos(a) * 37, sin(a) * 37);
    }
    circle(0, 0, 15);
  } else if (idx === 20) { // Judgement
    drawRosette(0, -30, 12, 8);
    line(-27, 20, -27, 37);
    line(0, 10, 0, 37);
    line(27, 20, 27, 37);
    arc(0, 39, 60, 22, PI, TWO_PI);
  } else if (idx === 21) { // World
    ellipse(0, 0, 51, 67);
    drawRosette(0, 0, 12, 8);
    circle(-30, -32, 9);
    circle(30, -32, 9);
    circle(-30, 32, 9);
    circle(30, 32, 9);
  } else {
    circle(0, 0, r);
  }
}

function drawSuitSymbol(suit, size) {
  const s = size;

  if (suit === "Cups") {
    arc(0, -2, s * 1.6, s * 1.5, 0, PI);
    line(-s * 0.8, -2, s * 0.8, -2);
    line(0, 2, 0, s);
    line(-s * 0.5, s, s * 0.5, s);
  } else if (suit === "Swords") {
    line(0, -s, 0, s);
    line(-s * 0.4, -s * 0.25, s * 0.4, -s * 0.25);
    line(-s * 0.5, s * 0.5, s * 0.5, s * 0.5);
    line(-s * 0.7, s * 0.3, s * 0.7, s * 0.3);
  } else if (suit === "Wands") {
    line(-s * 0.35, s, s * 0.35, -s);
    line(-s * 0.6, -s * 0.4, s * 0.5, -s * 0.6);
    line(-s * 0.45, 0, s * 0.6, -s * 0.2);
    line(-s * 0.5, s * 0.5, s * 0.4, s * 0.3);
  } else {
    drawRosette(0, 0, s * 0.7, 8);
    circle(0, 0, s * 1.8);
  }
}

function drawRosette(x, y, radius, points) {
  push();
  translate(x, y);
  beginShape();

  for (let i = 0; i < points * 2; i++) {
    const a = i * PI / points;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    vertex(cos(a) * r, sin(a) * r);
  }

  endShape(CLOSE);
  pop();
}

function drawCrescent(x, y, radius) {
  push();
  translate(x, y);
  arc(0, 0, radius * 2, radius * 2, -HALF_PI, HALF_PI);
  arc(radius * 0.45, 0, radius * 1.55, radius * 1.9, HALF_PI, PI + HALF_PI);
  pop();
}

class Mote {
  constructor(burst) {
    this.x = burst ? random(280, 720) : random(1000);
    this.y = burst ? random(200, 510) : random(700);
    this.vx = random(-0.2, 0.2);
    this.vy = burst ? random(-1.2, -0.2) : random(-0.12, 0.12);
    this.life = burst ? random(60, 140) : random(100, 500);
    this.maxLife = this.life;
    this.r = burst ? random(1, 2.8) : random(0.5, 1.5);
  }

  update() {
    this.x += this.vx + sin(elapsed + this.y * 0.01) * 0.08;
    this.y += this.vy;
    this.life--;
  }

  show() {
    const alpha = map(this.life, 0, this.maxLife, 0, 120);
    noStroke();
    fill(218, 187, 126, alpha);
    circle(this.x, this.y, this.r);
  }
}

function drawMotes() {
  for (let i = motes.length - 1; i >= 0; i--) {
    motes[i].update();
    motes[i].show();

    if (motes[i].life <= 0) motes.splice(i, 1);
  }
}

function mousePressed() {
  if (!readingComplete) return;

  const s = min(width / 1000, height / 700);
  const ox = (width - 1000 * s) / 2;
  const oy = (height - 700 * s) / 2;
  const x = (mouseX - ox) / s;
  const y = (mouseY - oy) / s;

  const positions = [
    { x: 300, y: 325 },
    { x: 500, y: 305 },
    { x: 700, y: 325 }
  ];

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];

    if (
      x > p.x - 67 && x < p.x + 67 &&
      y > p.y - 101 && y < p.y + 101
    ) {
      openDetail(spread[i]);
      playNote([261.63, 329.63, 392][i], 0.8);
      break;
    }
  }
}

function openDetail(card) {
  document.getElementById("detail-number").textContent =
    card.major ? "MAJOR ARCANA · " + card.number : card.suit.toUpperCase();

  document.getElementById("detail-name").textContent = card.name;
  document.getElementById("detail-position").textContent =
    "YOUR " + card.position + " CARD";

  document.getElementById("detail-meaning").textContent =
    "Upright meaning: " + card.meaning + ".";

  document.getElementById("detail-reflection").textContent =
    card.reflection;

  document.getElementById("card-detail").classList.remove("hidden");
}

function closeDetail() {
  document.getElementById("card-detail").classList.add("hidden");
}

function resetReading() {
  started = true;
  readingComplete = false;
  questionIndex = 0;
  answers = [];
  spread = [];
  mood = 0;

  document.getElementById("final-panel").classList.add("hidden");
  document.getElementById("question-panel").classList.remove("hidden");
  document.getElementById("card-detail").classList.add("hidden");

  showQuestion();
  playNote(196, 0.9);
}

function keyPressed() {
  if (key === " " || keyCode === 32) {
    if (readingComplete) resetReading();
    return false;
  }

  if (key === "m" || key === "M") toggleSound();
  if (keyCode === ESCAPE) closeDetail();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
