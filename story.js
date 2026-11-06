// INTERFACE
function initNameField() {
  const button = document.getElementById("enter-button");
  const field = document.createElement("input");

  field.id = "name-input";
  field.type = "text";
  field.maxLength = 16;
  field.placeholder = "Your name, wanderer";
  field.autocomplete = "off";
  field.spellcheck = false;
  field.setAttribute("aria-label", "Your name");

  Object.assign(field.style, {
    display: "block",
    margin: "0 auto 26px",
    width: "min(300px, 80%)",
    padding: "8px 4px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(122,10,16,0.6)",
    outline: "none",
    color: "#7a0a10",
    font: "italic 24px 'Cormorant Garamond', Georgia, serif",
    letterSpacing: "0.08em",
    textAlign: "center",
    transition: "border-color 0.3s",
  });

  field.addEventListener(
    "focus",
    () => (field.style.borderBottomColor = "rgba(150,12,20,1)")
  );
  field.addEventListener(
    "blur",
    () => (field.style.borderBottomColor = "rgba(122,10,16,0.6)")
  );
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !started) beginReading();
  });

  const style = document.createElement("style");
  style.textContent =
    "#name-input::placeholder { color: rgba(122, 10, 16, 0.55); }";
  document.head.appendChild(style);

  button.parentNode.insertBefore(field, button);
}

function bindInterface() {
  initNameField();

  document
    .getElementById("enter-button")
    .addEventListener("click", beginReading);

  document
    .getElementById("sound-button")
    .addEventListener("click", toggleSound);

  document
    .getElementById("reset-button")
    .addEventListener("click", resetReading);

  document.getElementById("print-button").addEventListener("click", () => {
    window.print();
  });

  document
    .getElementById("close-detail")
    .addEventListener("click", closeDetail);

  document.getElementById("card-detail").addEventListener("click", (event) => {
    if (event.target.id === "card-detail") closeDetail();
  });
}

function beginReading() {
  if (started) return;

  const field = document.getElementById("name-input");
  playerName = cleanName(field ? field.value : "");

  userStartAudio();
  started = true;
  soundOn = true;
  setMaster(1, 1.5);
  startMusic();

  fetchClip(WITCH_LINES.intro);
  fetchClip(questions[0].text);

  document.getElementById("intro-overlay").classList.add("hidden");
  document.getElementById("question-panel").classList.add("hidden");

  introStart = millis();
  later(() => strike(0.9), 300);
  later(() => strike(0.6), 1900);
  later(
    () => document.getElementById("question-panel").classList.remove("hidden"),
    INTRO_MS - 600
  );

  audio.nextChord = 0;
  audio.nextBell = millis() + 1800;

  updateSoundUI();
  ring(NOTE(62), 0.07);
  later(() => ring(NOTE(69), 0.05), 260);

  later(() => {
    speak(WITCH_LINES.intro + "\n\n" + questions[0].text);
    witchSparkle(16);
  }, INTRO_MS - 1200);
}

function showQuestion() {
  const item = questions[questionIndex];

  document.getElementById("question").textContent = withName(item.text);
  document.getElementById("question-number").textContent =
    "QUESTION " + roman(questionIndex + 1) + " / V";

  document.getElementById("progress-fill").style.width =
    (questionIndex / questions.length) * 100 + "%";

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.textContent = option[0];

    button.addEventListener("mouseenter", () => {
      if (started && REACTIONS[option[1]]) fetchClip(REACTIONS[option[1]]);
    });

    button.addEventListener("click", () => {
      answerQuestion(option[1], index);
    });

    choices.appendChild(button);
  });
}

function answerQuestion(answer, optionIndex) {
  if (!started || readingComplete) return;

  mood += (optionIndex - 1) * 0.65 + 0.4;
  questionIndex++;

  playNote([220, 277.18, 329.63][optionIndex] * 2);
  ballReveal(answer);

  for (let i = 0; i < 14; i++) motes.push(new Mote(true));
  witchSparkle(10);

  const reaction = REACTIONS[answer] || WITCH_LINES.fallback;

  if (questionIndex >= questions.length) {
    speak(reaction + "\n\n" + WITCH_LINES.turn);
    revealSpread();
  } else {
    showQuestion();
    speak(reaction + "\n\n" + questions[questionIndex].text);
  }
}

// READING
function drawSpreadFor(target) {
  let found = null;

  repeatN(400, () => {
    if (found) return;

    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = floor(random(i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const offset = abs(floor(mood * 7)) % 15;
    const trio = shuffled.slice(offset, offset + 3);
    const total = trio.reduce((sum, card) => sum + card.fortune, 0);

    if ((total >= CONFIG.goodThreshold ? "sun" : "storm") === target)
      found = trio;
  });

  return found || [...deck].sort(() => random() - 0.5).slice(0, 3);
}

function revealSpread() {
  readingComplete = true;
  revealDone = false;

  const target = lastVerdict
    ? lastVerdict === "sun"
      ? "storm"
      : "sun"
    : random() < 0.5
    ? "sun"
    : "storm";
  spread = drawSpreadFor(target);

  spread.forEach((card, i) => {
    card.position = ["PAST", "PRESENT", "FUTURE"][i];
  });

  fortune = spread.reduce((sum, card) => sum + card.fortune, 0);
  verdict = fortune >= CONFIG.goodThreshold ? "sun" : "storm";
  lastVerdict = verdict;
  stormPower = constrain(0.45 + abs(fortune) / 8, 0.45, 1);

  flips = [0, 0, 0];
  flipStarted = [false, false, false];
  flipBegin = [-1, -1, -1];
  flipLanded = [false, false, false];
  revealStart = millis();

  prefetchSpreadVoice();

  document.getElementById("question-panel").classList.add("hidden");
}

function speechFinished() {
  const typed = speech.shown >= speech.full.length;
  return (
    (typed && !voiceTalking() && !speech.pending) ||
    millis() - (speech.t0 || 0) > 30000
  );
}

function updateReveal() {
  if (!readingComplete) return;

  for (let i = 0; i < 3; i++) {
    if (flipLanded[i]) continue;

    if (flipBegin[i] < 0) {
      const ready =
        i === 0
          ? millis() - revealStart > 1800 && speechFinished()
          : flipLanded[i - 1] && millis() - landedAt > 900 && speechFinished();
      if (!ready) break;
      flipBegin[i] = millis();
    }

    const p = constrain((millis() - flipBegin[i]) / 1100, 0, 1);
    flips[i] = p;

    if (p > 0 && !flipStarted[i]) {
      flipStarted[i] = true;
      onFlipStart(i);
    }

    if (p >= 1) {
      flipLanded[i] = true;
      landedAt = millis();
      onFlipLand(i);
    }
    break;
  }
}

function onFlipStart(i) {
  const pose = cardPose(i);
  ring(NOTE([50, 53, 57][i] + 12), 0.06);

  for (let k = 0; k < 18; k++) {
    motes.push(new Mote(true, pose.x, pose.y));
  }
}

function onFlipLand(i) {
  const card = spread[i];
  const pose = cardPose(i);

  ring(NOTE([62, 65, 69][i]), 0.07);
  for (let k = 0; k < 24; k++) motes.push(new Mote(true, pose.x, pose.y));

  const rest = card.name + ": " + card.meaning + ".";
  speak(POSITIONS[i] + " " + rest, [POSITIONS[i], rest]);

  if (i === 2) {
    revealDone = true;
    runVerdictSequence();
  }
}

function afterSpeech(fn, beat = 600) {
  const poll = () => {
    if (!speechFinished()) {
      later(poll, 150);
      return;
    }
    later(fn, beat);
  };
  later(poll, 150);
}

const VERDICT_GAP_MS = 2000; // pause between the weather changing and the witch reacting
const STORM_GAP_MS = 4200; // longer for a storm

function runVerdictSequence() {
  const line = verdict === "storm" ? WITCH_LINES.storm : WITCH_LINES.sun;

  afterSpeech(() => {
    setWeather(verdict, true);

    later(
      () => {
        speak(line);

        const showReading = () => afterSpeech(renderFinalReading, 1200);
        if (verdict === "storm") cackle(showReading);
        else showReading();
      },
      verdict === "storm" ? STORM_GAP_MS : VERDICT_GAP_MS
    );
  }, 700);
}

function renderFinalReading() {
  const title = createReadingTitle();
  const summary = createReadingSummary();

  document.getElementById("reading-title").textContent = title;
  document.getElementById("reading-summary").textContent = summary;

  document.getElementById(
    "journal-question"
  ).textContent = chooseJournalQuestion();

  document.getElementById("final-panel").classList.remove("hidden");
}

function createReadingTitle() {
  return verdict === "storm"
    ? playerName === "wanderer"
      ? "A storm gathers over your story"
      : "A storm gathers over " + playerName + "'s story"
    : playerName === "wanderer"
    ? "The clouds part for you"
    : "The clouds part for you, " + playerName;
}

function createReadingSummary() {
  const past = spread[0];
  const present = spread[1];
  const future = spread[2];

  const pastPhrase = firstPhrase(past.meaning);
  const presentPhrase = firstPhrase(present.meaning);
  const futurePhrase = firstPhrase(future.meaning);

  let closing =
    "Read these cards as a conversation between what shaped you, " +
    "what you are meeting now, and what you might choose to cultivate next.";

  closing +=
    verdict === "storm"
      ? " The storm is not a punishment; it clears what can no longer stand."
      : " Light is on your side. Let yourself be warmed by it.";

  return (
    "The past carries " +
    pastPhrase +
    ". In the present, " +
    presentPhrase +
    " asks for your attention. The future opens towards " +
    futurePhrase +
    ". " +
    closing
  );
}

function firstPhrase(text) {
  return text.replace(/[.;].*$/, "").trim();
}

function chooseJournalQuestion() {
  const all = spread.map((card) => card.reflection);
  return all[floor(random(all.length))];
}

function roman(n) {
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n - 1] ||
    String(n)
  );
}

// CARDS
function updateHover(dt) {
  hoverIndex = -1;

  if (revealDone && started) {
    const v = toVirtual(mouseX, mouseY);

    for (let i = 0; i < 3; i++) {
      const p = cardPose(i);
      if (
        v.x > p.x - 67 &&
        v.x < p.x + 67 &&
        v.y > p.y - 101 &&
        v.y < p.y + 101
      ) {
        hoverIndex = i;
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    hoverLift[i] += ((hoverIndex === i ? 12 : 0) - hoverLift[i]) * 0.16 * dt;
  }

  cursor(hoverIndex >= 0 ? HAND : ARROW);
}

function drawSpread() {
  for (let i = 0; i < 3; i++) {
    const pose = cardPose(i);
    const p = readingComplete ? flips[i] : 0;
    const e = easeInOutCubic(p);
    const faceUp = e > 0.5 && spread[i];
    const squash = max(0.001, abs(cos(e * PI)));

    const y =
      pose.y +
      25 * (1 - e) -
      sin(e * PI) * 40 -
      hoverLift[i] +
      sin(elapsed + i) * (3 - 1.2 * e);

    push();
    translate(pose.x, y);
    rotate(pose.rot * (1 - e * 0.4));
    scale(squash, 1);

    const lightAmt = candleLightAt(pose.x, y);

    if (faceUp) {
      const glow = max(
        hoverLift[i] / 12,
        flipLanded[i] ? 0.12 : 0.5 * sin(e * PI),
        lightAmt * 0.9
      );
      drawTarotCard(spread[i], glow);
    } else {
      drawCardBack(readingComplete ? 1 : questionIndex / questions.length);
    }

    if (lightAmt > 0.02 || flash > 0.05) {
      push();
      blendMode(ADD);
      noStroke();
      rectMode(CENTER);
      fill(255, 185, 100, 60 * lightAmt);
      rect(0, 0, 128, 198, 2);
      fill(190, 210, 255, 90 * flash);
      rect(0, 0, 128, 198, 2);
      pop();
    }
    pop();

    if (faceUp && p >= 0.98) {
      noStroke();
      fill(234, 216, 173);
      textAlign(CENTER);
      textFont("Space Mono");
      textSize(9);
      text(spread[i].position, pose.x, 445);
      textFont("Cormorant Garamond");
    }
  }

  noStroke();
  textAlign(CENTER);

  if (!readingComplete) {
    fill(234, 216, 173, 145);
    textSize(11);
    text("FIVE ANSWERS · THREE CARDS", CONFIG.spreadX[1], 500);
  } else if (revealDone) {
    fill(234, 216, 173, 120 + sin(elapsed * 2) * 40);
    textFont("Space Mono");
    textSize(8);
    text("CLICK A CARD TO READ ITS MEANING", CONFIG.spreadX[1], 478);
    textFont("Cormorant Garamond");
  }
}

function drawCardBack(charge = 0) {
  rectMode(CENTER);
  drawingContext.save();
  drawingContext.shadowBlur = 22 + charge * 18;
  drawingContext.shadowColor =
    charge > 0.05
      ? "rgba(214,170,96," + (0.15 + charge * 0.45) + ")"
      : "rgba(0,0,0,.5)";

  fill(225, 211, 184);
  stroke(183, 154, 97);
  strokeWeight(1);
  rect(0, 0, 128, 198, 2);

  drawingContext.restore();

  noFill();
  stroke(61, 42, 35);
  rect(0, 0, 118, 188, 1);
  rect(0, 0, 108, 178, 1);

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
  textFont("Space Mono");
  textSize(7);
  text("ARCANA", 0, 84);
  textFont("Cormorant Garamond");
}

function drawTarotCard(card, glow = 0) {
  const w = 128;
  const h = 198;
  const paper = [232, 220, 191];
  const ink =
    card.suit === "Cups"
      ? [104, 48, 55]
      : card.suit === "Swords"
      ? [48, 65, 75]
      : card.suit === "Wands"
      ? [65, 82, 57]
      : card.suit === "Pentacles"
      ? [139, 105, 49]
      : [55, 43, 38];

  rectMode(CENTER);

  drawingContext.save();
  drawingContext.shadowBlur = 22 + glow * 30;
  drawingContext.shadowColor =
    glow > 0.02
      ? "rgba(240,200,120," + (0.35 + 0.5 * min(1, glow)) + ")"
      : "rgba(0,0,0,.42)";

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
      rotate((sx * sy * PI) / 4);
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

  stroke(...ink, 125);
  line(-36, 51, 36, 51);
  noFill();
  circle(0, -48, 10);
  for (let i = 0; i < 8; i++) {
    const a = (i * TWO_PI) / 8;
    line(cos(a) * 8, -48 + sin(a) * 8, cos(a) * 12, -48 + sin(a) * 12);
  }
}

function drawMinorIllustration(card, ink) {
  const count = Math.min(10, card.rank + 1);

  if (card.rank < 10) {
    const cols = count > 4 ? 2 : 1;
    const rows = ceil(count / cols);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = floor(i / cols);
      const x = cols === 1 ? 0 : col === 0 ? -22 : 22;
      const y = -32 + row * (64 / max(1, rows - 1));

      push();
      translate(x, y);
      drawSuitSymbol(card.suit, 10);
      pop();
    }

    stroke(...ink, 110);
    beginShape();
    for (let y = -38; y <= 40; y += 8) {
      vertex(sin(y * 0.08) * 4, y);
    }
    endShape();
  } else {
    const rank = card.rank;

    line(-23, 37, 23, 37);
    line(-18, 37, -14, -4);
    line(18, 37, 14, -4);

    beginShape();
    vertex(-14, -4);
    vertex(-24, 31);
    vertex(24, 31);
    vertex(14, -4);
    endShape(CLOSE);

    circle(0, -20, 19);
    line(-8, -31, -12, -39);
    line(-12, -39, 0, -34);
    line(0, -34, 12, -39);
    line(12, -39, 8, -31);

    line(-5, -9, -5, -4);
    line(5, -9, 5, -4);

    push();
    translate(rank === 11 ? 26 : -26, -5);
    drawSuitSymbol(card.suit, 9);
    pop();

    for (let i = 0; i < 3; i++) {
      line(-12 + i * 8, 9, -9 + i * 8, 23);
    }
  }
}

function drawMajorIllustration(card, ink) {
  const idx = card.rank;
  const r = 25 + (idx % 4) * 3;

  if (idx === 0) {
    circle(0, -15, 17);
    line(-3, -6, -12, 26);
    line(3, -6, 15, 26);
    line(-12, 26, 0, 33);
    line(15, 26, 22, 33);
    line(-3, -6, 15, 7);
    circle(24, 11, 7);
    drawRosette(-26, 30, 8, 6);
  } else if (idx === 1) {
    drawRosette(0, -20, 15, 8);
    line(-20, 25, -20, -3);
    line(20, 25, 20, -3);
    line(-20, -3, 20, -3);
    line(-12, 25, 12, 25);
    line(0, -3, 0, 35);
    line(-22, 35, 22, 35);
  } else if (idx === 2) {
    line(-27, 35, -27, -25);
    line(27, 35, 27, -25);
    arc(0, -4, 28, 36, PI, TWO_PI);
    line(-25, 35, 25, 35);
    drawCrescent(0, -5, 16);
    drawRosette(0, -35, 6, 8);
  } else if (idx === 3) {
    drawRosette(0, -15, 24, 8);
    for (let i = 0; i < 5; i++) {
      const x = -24 + i * 12;
      line(x, 14, x + sin(i) * 5, 42);
      circle(x + sin(i) * 5, 42, 5);
    }
    arc(0, 16, 54, 35, PI, TWO_PI);
  } else if (idx === 4) {
    line(-25, 35, -25, -20);
    line(25, 35, 25, -20);
    line(-25, -20, 25, -20);
    circle(0, -5, 22);
    line(-18, 10, -27, 35);
    line(18, 10, 27, 35);
    line(-27, 35, 27, 35);
    drawRosette(0, -37, 8, 4);
  } else if (idx === 5) {
    triangle(0, -42, -25, 2, 25, 2);
    circle(0, 12, 20);
    line(-18, 24, -24, 43);
    line(18, 24, 24, 43);
    line(-24, 43, 24, 43);
  } else if (idx === 6) {
    drawRosette(-20, -22, 10, 6);
    drawRosette(20, -22, 10, 6);
    beginShape();
    vertex(0, 35);
    bezierVertex(-42, 5, -30, -15, 0, 3);
    bezierVertex(30, -15, 42, 5, 0, 35);
    endShape();
  } else if (idx === 7) {
    rectMode(CENTER);
    rect(0, 5, 32, 35);
    circle(-21, 28, 18);
    circle(21, 28, 18);
    line(-18, -13, -18, -32);
    line(18, -13, 18, -32);
    line(-25, -32, 25, -32);
    drawRosette(0, -20, 7, 8);
  } else if (idx === 8) {
    drawRosette(0, -30, 10, 8);
    arc(0, 8, 45, 34, PI, TWO_PI);
    arc(0, 8, 45, 34, 0, PI);
    line(-23, 8, -17, 34);
    line(23, 8, 17, 34);
    line(-17, 34, 17, 34);
  } else if (idx === 9) {
    line(0, -25, 0, 34);
    circle(0, -27, 15);
    drawRosette(0, -27, 5, 6);
    line(-15, 34, 15, 34);
    line(-8, 34, 0, 43);
    line(8, 34, 0, 43);
  } else if (idx === 10) {
    circle(0, 0, 56);
    circle(0, 0, 43);
    circle(0, 0, 18);
    for (let i = 0; i < 8; i++) {
      const a = (i * TWO_PI) / 8;
      line(cos(a) * 9, sin(a) * 9, cos(a) * 27, sin(a) * 27);
    }
  } else if (idx === 11) {
    line(0, -24, 0, 36);
    line(-24, -18, 24, -18);
    line(-24, -18, -24, 2);
    line(24, -18, 24, 2);
    arc(-24, 4, 22, 12, 0, PI);
    arc(24, 4, 22, 12, 0, PI);
    line(-18, 36, 18, 36);
    drawRosette(0, -31, 6, 8);
  } else if (idx === 12) {
    line(-25, -24, 25, -24);
    line(-18, -24, -18, 34);
    line(-18, -24, 8, -7);
    circle(12, -1, 16);
    line(12, 7, -3, 30);
    line(-3, 30, 13, 37);
    drawRosette(12, -1, 7, 8);
  } else if (idx === 13) {
    line(-27, -30, 27, 30);
    line(-27, 30, 27, -30);
    circle(0, 0, 29);
    drawRosette(0, 0, 9, 8);
    for (let i = 0; i < 4; i++) {
      circle(-24 + i * 16, 39, 4);
    }
  } else if (idx === 14) {
    circle(0, -20, 18);
    line(-10, -8, -22, 17);
    line(10, -8, 22, 17);
    arc(-13, 20, 22, 18, 0, PI);
    arc(13, 20, 22, 18, 0, PI);
    line(-13, 29, 13, 29);
    line(0, 0, 0, 36);
  } else if (idx === 15) {
    triangle(0, -35, -29, 22, 29, 22);
    circle(0, -5, 20);
    line(-25, 34, 25, 34);
    line(-17, 34, -17, 22);
    line(17, 34, 17, 22);
    drawRosette(0, -5, 5, 5);
  } else if (idx === 16) {
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
  } else if (idx === 17) {
    drawRosette(0, -3, 12, 8);
    for (let i = 0; i < 7; i++) {
      const a = (i * TWO_PI) / 7;
      drawRosette(cos(a) * 33, sin(a) * 33, 4, 5);
    }
  } else if (idx === 18) {
    drawCrescent(0, -3, 35);
    drawRosette(-25, 25, 4, 5);
    drawRosette(25, 25, 4, 5);
    arc(0, 33, 52, 30, PI, TWO_PI);
  } else if (idx === 19) {
    circle(0, 0, 39);
    for (let i = 0; i < 16; i++) {
      const a = (i * TWO_PI) / 16;
      line(cos(a) * 25, sin(a) * 25, cos(a) * 37, sin(a) * 37);
    }
    circle(0, 0, 15);
  } else if (idx === 20) {
    drawRosette(0, -30, 12, 8);
    line(-27, 20, -27, 37);
    line(0, 10, 0, 37);
    line(27, 20, 27, 37);
    arc(0, 39, 60, 22, PI, TWO_PI);
  } else if (idx === 21) {
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
    const a = (i * PI) / points;
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
