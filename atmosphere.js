// AUDIO
const MODES = {
  calm: {
    chords: [
      [50, 53, 57],
      [46, 50, 53],
      [43, 46, 50],
      [45, 49, 52],
    ],
    scale: [62, 64, 65, 67, 69, 70, 73, 74, 76, 77],
    chordMs: 8200,
    bellMs: [1100, 3000],
    pad: 0.011,
  },
  storm: {
    chords: [
      [50, 53, 56],
      [51, 54, 58],
      [48, 51, 54],
      [49, 52, 55],
    ],
    scale: [62, 63, 65, 68, 69, 71, 74, 75],
    chordMs: 5200,
    bellMs: [500, 1500],
    pad: 0.016,
  },
  sun: {
    chords: [
      [50, 54, 57],
      [43, 47, 50],
      [45, 49, 52],
      [47, 50, 54],
    ],
    scale: [74, 76, 78, 79, 81, 83, 85, 86],
    chordMs: 6500,
    bellMs: [350, 1000],
    pad: 0.012,
  },
};

const audio = {
  pads: [],
  bass: null,
  bells: [],
  bellEnv: [],
  bellIdx: 0,
  thump: null,
  thumpEnv: null,
  thunderNoise: null,
  thunderEnv: null,
  thunderFilter: null,
  crackNoise: null,
  crackEnv: null,
  crackFilter: null,
  rainNoise: null,
  rainFilter: null,
  reverb: null,
  mode: "calm",
  chord: MODES.calm.chords[0],
  chordIdx: 0,
  nextChord: 0,
  nextBell: 0,
  nextThump: 0,
};

function initAudio() {
  setMaster(0);
  audio.reverb = new p5.Reverb();

  ["sine", "triangle", "sine"].forEach((type, i) => {
    const osc = new p5.Oscillator(type);
    osc.freq(NOTE(MODES.calm.chords[0][i]));
    osc.amp(0);
    osc.start();
    audio.reverb.process(osc, 5, 2.4);
    audio.pads.push(osc);
  });

  audio.bass = new p5.Oscillator("sine");
  audio.bass.freq(NOTE(38));
  audio.bass.amp(0);
  audio.bass.start();

  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const osc = new p5.Oscillator(i % 2 ? "triangle" : "sine");
    const env = new p5.Envelope();
    env.setADSR(0.004, 1.5, 0, 0.9);
    env.setRange(0.05, 0);
    osc.freq(440);
    osc.amp(env);
    osc.start();
    audio.reverb.process(osc, 4, 2.2);
    audio.bells.push(osc);
    audio.bellEnv.push(env);
  });

  audio.thump = new p5.Oscillator("sine");
  audio.thumpEnv = new p5.Envelope();
  audio.thumpEnv.setADSR(0.004, 0.22, 0, 0.2);
  audio.thumpEnv.setRange(0.16, 0);
  audio.thump.freq(46);
  audio.thump.amp(audio.thumpEnv);
  audio.thump.start();

  audio.thunderNoise = new p5.Noise("brown");
  audio.thunderFilter = new p5.LowPass();
  audio.thunderNoise.disconnect();
  audio.thunderFilter.process(audio.thunderNoise, 200, 3);
  audio.thunderEnv = new p5.Envelope();
  audio.thunderEnv.setADSR(0.05, 0.9, 0.3, 3.2);
  audio.thunderEnv.setRange(0.7, 0);
  audio.thunderNoise.amp(audio.thunderEnv);
  audio.thunderNoise.start();

  audio.crackNoise = new p5.Noise("white");
  audio.crackFilter = new p5.HighPass();
  audio.crackNoise.disconnect();
  audio.crackFilter.process(audio.crackNoise, 1800, 1);
  audio.crackEnv = new p5.Envelope();
  audio.crackEnv.setADSR(0.001, 0.14, 0, 0.08);
  audio.crackEnv.setRange(0.28, 0);
  audio.crackNoise.amp(audio.crackEnv);
  audio.crackNoise.start();

  audio.rainNoise = new p5.Noise("pink");
  audio.rainFilter = new p5.HighPass();
  audio.rainNoise.disconnect();
  audio.rainFilter.process(audio.rainNoise, 1500, 1);
  audio.rainNoise.amp(0);
  audio.rainNoise.start();

  audio.tinnitus = new p5.Oscillator("sine");
  audio.tinnitusEnv = new p5.Envelope();
  audio.tinnitusEnv.setADSR(0.01, 0.9, 0.12, 2.2);
  audio.tinnitusEnv.setRange(0.035, 0);
  audio.tinnitus.freq(3400);
  audio.tinnitus.amp(audio.tinnitusEnv);
  audio.tinnitus.start();
}

function ring(freq, vel = 0.05) {
  if (!started) return;
  const i = audio.bellIdx++ % audio.bells.length;
  if (voiceTalking()) vel *= 0.55;
  audio.bells[i].freq(freq);
  audio.bellEnv[i].setRange(vel, 0);
  audio.bellEnv[i].play();
}

function playNote(frequency) {
  ring(frequency, 0.07);
}

function advanceChord(now) {
  const m = MODES[audio.mode];
  audio.chord = m.chords[audio.chordIdx++ % m.chords.length];

  audio.pads.forEach((osc, i) => {
    osc.freq(NOTE(audio.chord[i]), 1.8);
    osc.amp(m.pad, 2.5);
  });

  audio.bass.freq(NOTE(audio.chord[0] - 12), 1.2);
  audio.bass.amp(0.032, 2);
  audio.nextChord = now + m.chordMs;
}

function updateMusic() {
  if (!started || !soundOn) return;
  const now = millis();

  const want = storm > 0.5 ? "storm" : sun > 0.5 ? "sun" : "calm";
  if (want !== audio.mode) {
    audio.mode = want;
    audio.chordIdx = 0;
    audio.nextChord = 0;
    audio.nextBell = now + 500;
  }

  const m = MODES[audio.mode];

  if (!musicLoaded && now >= audio.nextChord) advanceChord(now);

  if (!musicLoaded && now >= audio.nextBell) {
    if (random() < 0.8) {
      const useChord = random() < 0.4;
      const midi = useChord
        ? audio.chord[floor(random(3))] + 24
        : random(m.scale);
      ring(NOTE(midi), random(0.03, 0.06));

      if (random() < 0.3) {
        const echo = NOTE(midi + (audio.mode === "storm" ? 6 : 7));
        later(() => ring(echo, 0.02), 320);
      }
    }
    audio.nextBell = now + random(m.bellMs[0], m.bellMs[1]);
  }

  if (storm > 0.4 && now >= audio.nextThump) {
    audio.thumpEnv.play();
    later(() => audio.thumpEnv.play(), 230);
    audio.nextThump = now + 1700 - storm * 500;
  }

  if (musicLoaded && frameCount % 12 === 0)
    musicTrack.setVolume((voiceTalking() ? 0.2 : 0.5) * (1 - duck), 0.4);

  if (frameCount % 15 === 0) {
    audio.rainNoise.amp(storm * 0.03 * (0.5 + stormPower * 0.5), 0.5);
  }
}

function thunder(power, close = false) {
  witchReact(close ? 1 : 0.5);
  audio.thunderFilter.freq(close ? random(340, 460) : random(110, 260));
  audio.thunderEnv.setRange((close ? 0.9 : 0.5) + 0.4 * power, 0);
  audio.thunderEnv.setADSR(
    close ? 0.02 : 0.05,
    0.6 + power,
    0.25,
    2.4 + power * 2 + (close ? 2 : 0)
  );
  audio.thunderEnv.play(null, 0, 0.8 + power * 0.9);

  if (close) {
    audio.thumpEnv.setRange(0.42, 0);
    audio.thumpEnv.play();
    later(() => audio.thumpEnv.setRange(0.16, 0), 500);
    [
      [450, 240],
      [1300, 150],
      [2500, 90],
    ].forEach(([ms, hz]) => later(() => audio.thunderFilter.freq(hz), ms));
    later(earRing, 250);
  }
}

function crack(power = 1) {
  audio.crackEnv.setRange(constrain(0.1 + 0.18 * power, 0.1, 0.6), 0);
  audio.crackEnv.play();
}

function earRing() {
  audio.tinnitusEnv.play();
}

function rumble() {
  audio.thunderFilter.freq(120);
  audio.thunderEnv.setRange(0.35, 0);
  audio.thunderEnv.setADSR(1.2, 0.3, 0.3, 1.0);
  audio.thunderEnv.play(null, 0, 0.6);
}

function toggleSound() {
  soundOn = !soundOn;

  if (soundOn) {
    userStartAudio();
    setMaster(1, 0.4);
  } else {
    setMaster(0, 0.3);
    stopVoice();
    speech.voiced = false;
    speech.voiceDone = true;
  }

  updateSoundUI();
}

function updateSoundUI() {
  document.getElementById("sound-status").textContent = soundOn
    ? "SOUND · ON"
    : "SOUND · OFF";

  document.getElementById("sound-button").textContent = soundOn
    ? "SOUND ON"
    : "SOUND OFF";
}

// BACKGROUND MUSIC
let musicTrack = null;
let musicLoaded = false;

function loadMusic() {
  if (!CONFIG.music) return;

  loadSound(
    CONFIG.music,
    (track) => {
      musicTrack = track;
      musicLoaded = true;
      if (started) startMusic();
    },
    () => {}
  );
}

function startMusic() {
  if (!musicLoaded || musicTrack.isPlaying()) return;
  musicTrack.setVolume(0);
  musicTrack.loop();
  musicTrack.setVolume(0.5, 3);
}

function drawRainbow() {
  const amt = constrain((sun - 0.7) / 0.3, 0, 1);
  if (amt < 0.01) return;

  const bands = [
    [255, 60, 60],
    [255, 150, 50],
    [255, 225, 70],
    [90, 205, 100],
    [70, 150, 240],
    [110, 90, 220],
    [170, 80, 200],
  ];
  const shimmer = 0.85 + 0.15 * sin(elapsed * 1.4);

  push();
  noFill();
  blendMode(ADD);
  bands.forEach((c, i) => {
    stroke(c[0], c[1], c[2], 42 * amt * shimmer);
    strokeWeight(11);
    arc(620, 565, (440 - i * 10) * 2, (440 - i * 10) * 2, PI, TWO_PI);
  });
  pop();
}

// WEATHER
function setWeather(mode, dramatic = false) {
  stormGoal = mode === "storm" ? 1 : 0;
  sunGoal = mode === "sun" ? 1 : 0;
  ballReveal("verdict_" + mode);

  if (mode === "storm") {
    nextStrike = millis() + 5200;
    if (dramatic) stormEntrance();
    else strike(stormPower);
  }

  if (mode === "sun") {
    [74, 78, 81, 86, 90, 93].forEach((n, i) =>
      later(() => ring(NOTE(n), 0.06), 180 * i)
    );
    sunEntrance();
  }
}

function updateWeather(dt) {
  storm += (stormGoal - storm) * 0.02 * dt;
  sun += (sunGoal - sun) * 0.014 * dt;

  if (abs(stormGoal - storm) < 0.001) storm = stormGoal;
  if (abs(sunGoal - sun) < 0.001) sun = sunGoal;

  flash *= pow(0.88, dt);
  if (flash < 0.01) flash = 0;
  shake *= pow(0.9, dt);

  if (storm > 0.55 && millis() > nextStrike) {
    strike(stormPower);
    nextStrike = millis() + random(2800, 6800) / (0.6 + stormPower * 0.6);
  }
}

function buildBolt(x0, y0, x1, y1, disp, detail, out, branchP = 0.14) {
  if (disp < detail) {
    out.push([x0, y0, x1, y1]);
    return;
  }

  const mx = (x0 + x1) / 2 + random(-disp, disp) * 0.9;
  const my = (y0 + y1) / 2 + random(-disp, disp) * 0.3;

  buildBolt(x0, y0, mx, my, disp / 2, detail, out, branchP);
  buildBolt(mx, my, x1, y1, disp / 2, detail, out, branchP);

  if (random() < branchP && disp > 12) {
    buildBolt(
      mx,
      my,
      mx + random(-120, 120),
      my + random(80, 190),
      disp / 2.2,
      detail,
      out,
      branchP
    );
  }
}


function strike(power = 1, opts = {}) {
  const big = Boolean(opts.big);
  const hitsTower = Boolean(opts.tower) || (stormGoal === 1 && random() < 0.5);
  const x = hitsTower
    ? TOWER.x + (big ? -random(200, 300) : random(-90, 90))
    : random(380, 960);
  const endX = hitsTower ? TOWER.x : x + random(-70, 70);
  const endY = hitsTower ? TOWER.top : 505;
  const segs = [];
  buildBolt(x, -20, endX, endY, big ? 150 : 110, 7, segs, big ? 0.32 : 0.14);

  const leader = big ? 220 : 70;
  const bolt = {
    segs,
    life: 1,
    gx: endX,
    gy: endY,
    born: millis(),
    leader,
    width: big ? 1.9 : 1,
    ghost: big ? 1 : 0,
    big,
  };
  bolts.push(bolt);

  later(() => {
    blackout = 0;
    blackoutGoal = 0;
    if (hitsTower) towerHit = 1;
    if (stormGoal === 1) addCrack();
    repeatN(big ? 60 : 24, () => motes.push(new Mote(true, endX, endY)));
    flash = min(1, 0.7 + 0.3 * power);
    shake = (big ? 14 : 11) * power;

    if (big) {
      dread = 1;
      duck = 0.94;
      if (musicLoaded) musicTrack.setVolume(0.03, 0.05);
      later(() => crack(power * 0.8), 70);
    }

    crack(power);
    witchReact(1);
    later(() => thunder(power, big), big ? 40 : random(300, 1100));
  }, leader);

  const flickers = big
    ? [
        [110, 0.5],
        [240, 0.38],
      ]
    : [
        [90, 0.55],
        [200, 0.35],
      ];

  flickers.forEach(([ms, f]) =>
    later(() => {
      flash = max(flash, f);
      if (big) bolt.life = 1;
    }, leader + ms)
  );
}

function updateRain(dt) {
  const count = floor(storm * rain.length * (0.45 + 0.55 * stormPower));

  for (let i = 0; i < count; i++) {
    const d = rain[i];
    d.y += d.speed * dt;
    d.x -= d.speed * windSlope() * dt;

    if (d.y > 700 || d.x < -100) {
      d.y = random(-80, -5);
      d.x = random(0, 1150);
    }
  }
}

// STORM AND SUN
let blackout = 0;
let blackoutGoal = 0;
let duck = 0;
let dread = 0;
let goldFlash = 0;
let birds = [];
let flinch = 0;
let staffFlare = 0;

function witchReact(amount) {
  flinch = max(flinch, amount);
  staffFlare = max(staffFlare, amount);
}

const windSlope = () => 0.28 + 0.2 * sin(elapsed * 0.9) * storm;

function stormEntrance() {
  blackoutGoal = 0.5;
  witchReact(0.4);
  rumble();

  later(() => {
    flash = max(flash, 0.22);
    witchReact(0.3);
  }, 350);

  later(() => audio.thumpEnv.play(), 800);
  later(() => audio.thumpEnv.play(), 1050);
  later(() => strike(1.5, { big: true, tower: true }), 1300);
  later(() => strike(1), 2900);
}

function sunEntrance() {
  goldFlash = 1;
  cracks = [];
  witchSparkle(30);
  later(() => {
    birds = Array.from({ length: 9 }, (_, i) => ({
      x: 1080 + i * 45,
      y: random(90, 270),
      v: random(1, 1.8),
      ph: random(TWO_PI),
    }));
  }, 2500);
}

function updateTheatrics(dt) {
  updatePetals(dt);
  flinch *= pow(0.9, dt);
  staffFlare *= pow(0.95, dt);
  goldFlash *= pow(0.97, dt);

  blackout += (blackoutGoal - blackout) * 0.08 * dt;
  if (abs(blackoutGoal - blackout) < 0.002) blackout = blackoutGoal;
  duck *= pow(0.985, dt);
  if (duck < 0.01) duck = 0;
  dread *= pow(0.975, dt);
  if (dread < 0.01) dread = 0;

  if (storm > 0.5 && flash === 0 && random() < 0.006 * dt) {
    flash = random(0.18, 0.35);
    later(() => thunder(0.3), random(400, 900));
  }

  if (sun > 0.5 && frameCount % 5 === 0) {
    const i = floor(random(3));
    motes.push(
      new Mote(
        true,
        CONFIG.spreadX[i] + random(-55, 55),
        CONFIG.spreadY[i] + random(-90, 90)
      )
    );
  }

  birds.forEach((b) => {
    b.x -= b.v * dt;
    b.y += sin(elapsed * 2 + b.ph) * 0.15 * dt;
    if (b.x < -40) b.x = 1080;
  });
}

function drawBirds() {
  if (sun < 0.3) return;
  noFill();
  stroke(40, 28, 36, 220 * sun);
  strokeWeight(1.6);
  birds.forEach((b) => {
    const f = sin(elapsed * 14 + b.ph) * 5;
    beginShape();
    vertex(b.x - 8, b.y - f);
    quadraticVertex(b.x - 3, b.y - 3, b.x, b.y);
    quadraticVertex(b.x + 3, b.y - 3, b.x + 8, b.y - f);
    endShape();
  });
}

// AURORA
function drawAurora() {
  const amt = constrain((nightT - 0.75) / 0.25, 0, 1) * (1 - storm) * (1 - sun);
  if (amt < 0.02 || !started) return;

  const ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  [
    [90, 255, 170],
    [150, 100, 245],
    [70, 235, 200],
  ].forEach((c, b) => {
    const top = [];
    const bot = [];
    repeatN(80, (i) => {
      const t = 50 + b * 38 + noise(i * 0.12 + b * 9, elapsed * 0.3 + b) * 110;
      top.push([i * 20 - 300, t]);
      bot.push([
        i * 20 - 300,
        t + 70 + noise(i * 0.1 + 30 + b, elapsed * 0.25) * 130,
      ]);
    });

    const y0 = Math.min(...top.map((q) => q[1]));
    const y1 = Math.max(...bot.map((q) => q[1]));
    const shimmer = 0.8 + 0.2 * sin(elapsed * 2 + b);
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "rgba(" + c + ",0)");
    g.addColorStop(0.3, "rgba(" + c + "," + 0.22 * amt * shimmer + ")");
    g.addColorStop(1, "rgba(" + c + ",0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(" + c + "," + 0.12 * amt + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    top.forEach(([x, y], i) => {
      if (i % 2) return;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 90 + noise(i, elapsed * 0.5 + b) * 110);
    });
    ctx.stroke();
  });

  ctx.restore();
}

// PETALS AND LANTERNS
let petals = [];
let lanterns = [];

function initPetals() {
  const colors = [
    [255, 170, 190],
    [255, 200, 210],
    [255, 215, 160],
    [250, 150, 170],
  ];

  petals = Array.from({ length: 70 }, () => ({
    x: random(-50, 1050),
    y: random(-20, 700),
    s: random(4, 8),
    vy: random(0.5, 1.4),
    ph: random(TWO_PI),
    rot: random(TWO_PI),
    vr: random(-0.05, 0.05),
    c: random(colors),
  }));

  lanterns = Array.from({ length: 7 }, (_, i) => ({
    x: 90 + i * 120 + random(-30, 30),
    y: random(560, 780),
    v: random(0.25, 0.5),
    ph: random(TWO_PI),
    s: random(0.8, 1.25),
  }));
}

function sunAmount() {
  return constrain((sun - 0.5) * 2, 0, 1);
}

function updatePetals(dt) {
  if (sunAmount() < 0.01) return;

  petals.forEach((p) => {
    p.y += p.vy * dt;
    p.x += (sin(p.ph + elapsed * 1.4) * 0.6 - 0.35) * dt;
    p.rot += p.vr * dt;
    if (p.y > 710 || p.x < -60) {
      p.y = -10;
      p.x = random(0, 1060);
    }
  });

  lanterns.forEach((l) => {
    l.y -= l.v * dt;
    l.x += sin(l.ph + elapsed * 0.7) * 0.25 * dt;
    if (l.y < -60) {
      l.y = 720 + random(60);
      l.x = random(60, 940);
    }
  });
}

function drawPetals() {
  const amt = sunAmount();
  if (amt < 0.01) return;

  noStroke();
  petals.slice(0, floor(amt * petals.length)).forEach((p) => {
    push();
    translate(p.x, p.y);
    rotate(p.rot);
    scale(1, 0.5 + 0.5 * abs(sin(p.rot * 1.6)));
    fill(p.c[0], p.c[1], p.c[2], 230 * amt);
    ellipse(0, 0, p.s * 2, p.s);
    pop();
  });
}

function drawLanterns() {
  const amt = sunAmount();
  if (amt < 0.01) return;

  lanterns.forEach((l, i) => {
    const glow = 0.8 + noise(i * 5, elapsed * 3) * 0.4;
    const s = l.s;

    push();
    blendMode(ADD);
    noStroke();
    for (let k = 4; k > 0; k--) {
      fill(255, 170, 70, 5 * amt * glow * k);
      circle(l.x, l.y, s * (26 + k * 14));
    }
    pop();

    noStroke();
    fill(255, 196, 100, 235 * amt);
    rect(l.x - 9 * s, l.y - 12 * s, 18 * s, 24 * s, 4 * s);
    fill(255, 238, 175, 220 * amt * glow);
    ellipse(l.x, l.y, 9 * s, 15 * s);
    fill(120, 70, 30, 220 * amt);
    rect(l.x - 9 * s, l.y - 13 * s, 18 * s, 3 * s);
    rect(l.x - 9 * s, l.y + 10 * s, 18 * s, 3 * s);
    stroke(120, 70, 30, 180 * amt);
    strokeWeight(1);
    line(l.x, l.y + 13 * s, l.x, l.y + 20 * s);
  });
}

// STORM TOWER AND CRACKED GLASS
const TOWER = { x: 925, base: 540, top: 310 };
let towerHit = 0;
let cracks = [];

function drawTower() {
  towerHit *= pow(0.992, 1);
  const vis = storm * constrain(0.1 + flash * 1.6, 0, 1);
  if (vis < 0.02 && towerHit < 0.02) return;

  const { x, base, top } = TOWER;
  push();
  translate(x, 0);
  noStroke();
  fill(7, 6, 14, 255 * min(1, vis + towerHit * 0.6));
  quad(-21, base, 21, base, 15, top + 30, -15, top + 30);
  rect(-28, top, 56, 30);
  repeatN(4, (i) => rect(-28 + i * 20, top - 10, 12, 12));

  if (towerHit > 0.02) {
    blendMode(ADD);
    [top + 14, top + 78, top + 130].forEach((wy, i) => {
      const f = 0.7 + noise(i * 4, elapsed * 6) * 0.5;
      fill(255, 150, 60, 255 * towerHit * f);
      rect(-3, wy, 6, 12);
      fill(255, 120, 40, 40 * towerHit * f);
      circle(0, wy + 6, 44);
    });
    for (let k = 0; k < 3; k++) {
      const fy = top - 16 - noise(k * 3, elapsed * 5) * 26;
      fill(255, 130 + k * 30, 40, 120 * towerHit);
      ellipse(-12 + k * 12, fy, 10, 24 * towerHit + 6);
    }
  }
  pop();
}

function addCrack() {
  if (cracks.length >= 8) return;

  const a = random(TWO_PI);
  let px = cos(a) * BALL.r;
  let py = sin(a) * BALL.r;
  const pts = [[px, py]];
  const dir = a + PI + random(-0.5, 0.5);

  repeatN(6, () => {
    const d = dir + random(-0.7, 0.7);
    const len = BALL.r * random(0.18, 0.3);
    px += cos(d) * len;
    py += sin(d) * len;
    pts.push([px, py]);
  });

  cracks.push({ pts, born: millis() });
  ball.pulse = 1;
}

function drawCracks() {
  if (!cracks.length) return;

  push();
  translate(BALL.x, BALL.y);
  noFill();
  cracks.forEach((c) => {
    const grow =
      constrain((millis() - c.born) / 300, 0, 1) * (c.pts.length - 1);
    [
      [5, 40],
      [1.3, 235],
    ].forEach(([w, a]) => {
      stroke(235, 240, 255, a);
      strokeWeight(w);
      beginShape();
      c.pts.forEach((q, i) => {
        if (i <= grow) vertex(q[0], q[1]);
        else if (i - 1 < grow) {
          const t = grow - (i - 1);
          const prev = c.pts[i - 1];
          vertex(lerp(prev[0], q[0], t), lerp(prev[1], q[1], t));
        }
      });
      endShape();
    });
  });
  pop();
}

// SKY AND INTRO
let nightT = 0;
let introStart = -1;
const INTRO_MS = 5200;
let candle = { x: 500, y: 350, glow: 0, seen: false };

function initFX() {
  initPostFX();
  initPetals();
}

function updateFX(dt) {
  const goalNight = !started
    ? 0.04
    : readingComplete
    ? 1
    : 0.1 + 0.9 * (questionIndex / questions.length);

  nightT += (goalNight - nightT) * 0.012 * dt;

  if (!started && random() < 0.003) flash = max(flash, random(0.15, 0.3));

  if (mouseX !== 0 || mouseY !== 0) candle.seen = true;
  const v = toVirtual(mouseX, mouseY);
  const inside =
    candle.seen &&
    mouseX >= 0 &&
    mouseY >= 0 &&
    mouseX <= width &&
    mouseY <= height;
  candle.x += (v.x - candle.x) * 0.25 * dt;
  candle.y += (v.y - candle.y) * 0.25 * dt;
  candle.glow += ((inside ? 1 : 0) - candle.glow) * 0.08 * dt;
}

function resetFX() {
  blackout = 0;
  blackoutGoal = 0;
  duck = 0;
  dread = 0;
  goldFlash = 0;
  birds = [];
  cracks = [];
  towerHit = 0;
  ball.cloudGoal = 0.7;
  ball.key = null;
}

function drawIntro() {
  if (introStart < 0) return;

  const t = millis() - introStart;
  if (t > INTRO_MS) {
    introStart = -1;
    return;
  }

  const holdEnd = 1900;
  const cover = t < holdEnd ? 1 : 1 - (t - holdEnd) / (INTRO_MS - holdEnd);
  const a = constrain(cover, 0, 1) * (1 - constrain(flash, 0, 1) * 0.92);

  noStroke();
  fill(4, 3, 8, 255 * a);
  rect(0, 0, width, height);

  const fadeIn = constrain((t - 150) / 900, 0, 1);
  const fadeOut = constrain(1 - (t - 3100) / 1400, 0, 1);
  const ta = fadeIn * fadeOut;
  if (ta < 0.01) return;

  const cx = width / 2;
  const cy = height / 2;
  const size = min(width * 0.05, height * 0.11);

  drawingContext.save();
  drawingContext.letterSpacing = size * 0.12 + "px";
  textAlign(CENTER, CENTER);
  textFont("Cormorant Garamond");
  textSize(size);
  fill(234, 216, 173, 255 * ta);
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = "rgba(214,170,96," + 0.7 * ta + ")";
  text("THE UNWRITTEN ARCANA", cx, cy - size * 0.2);
  drawingContext.restore();

  stroke(183, 154, 97, 190 * ta);
  strokeWeight(1);
  const half = min(width * 0.22, 260) * easeOutCubic(fadeIn);
  line(cx - half, cy + size * 0.55, cx + half, cy + size * 0.55);

  noStroke();
  fill(183, 154, 97, 220 * ta);
  textFont("Space Mono");
  textSize(max(9, size * 0.17));
  text("VOL. I  ·  A READING BY CANDLELIGHT", cx, cy + size * 0.95);
}

// MOTES
class Mote {
  constructor(burst, ox, oy) {
    const at = ox !== undefined;

    this.x = at
      ? ox + random(-30, 30)
      : burst
      ? random(280, 720)
      : random(1000);
    this.y = at ? oy + random(-40, 40) : burst ? random(200, 510) : random(700);
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
    const col = mixArr(
      mixArr([218, 187, 126], [150, 175, 235], storm),
      [255, 235, 170],
      sun
    );

    noStroke();
    fill(col[0], col[1], col[2], alpha);
    circle(this.x, this.y, this.r);
  }
}

function drawMotes() {
  if (motes.length > 320) motes.splice(0, motes.length - 320);

  for (let i = motes.length - 1; i >= 0; i--) {
    motes[i].update();
    motes[i].show();

    if (motes[i].life <= 0) motes.splice(i, 1);
  }
}

// POST PROCESSING
let bloomBuf = null;
let aberrationBuf = null;

function initPostFX() {
  bloomBuf = document.createElement("canvas");
  aberrationBuf = document.createElement("canvas");
}

function sizeBuffer(buf, w, h) {
  if (buf.width !== w || buf.height !== h) {
    buf.width = w;
    buf.height = h;
  }
}

function drawPostFX() {
  const ctx = drawingContext;
  const cv = ctx.canvas;
  const cw = cv.width;
  const ch = cv.height;
  if (!cw || !ch) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (dread > 0.02) {
    const g = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      min(cw, ch) * 0.25,
      cw / 2,
      ch / 2,
      max(cw, ch) * 0.75
    );
    g.addColorStop(0, "rgba(90,0,10,0)");
    g.addColorStop(1, "rgba(90,0,10," + 0.45 * dread + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }

  const amount = constrain(flash * 1.1 + shake * 0.06, 0, 1);
  if (amount > 0.06) {
    sizeBuffer(aberrationBuf, cw, ch);
    const a = aberrationBuf.getContext("2d");
    const off = amount * 7 * (cw / max(1, width));

    [
      ["rgb(255,0,0)", -off],
      ["rgb(0,255,255)", off],
    ].forEach(([tint, dx]) => {
      a.globalCompositeOperation = "copy";
      a.drawImage(cv, 0, 0);
      a.globalCompositeOperation = "multiply";
      a.fillStyle = tint;
      a.fillRect(0, 0, cw, ch);

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.5 * amount;
      ctx.drawImage(aberrationBuf, dx, 0);
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  const bw = ceil(cw / 8);
  const bh = ceil(ch / 8);
  sizeBuffer(bloomBuf, bw, bh);
  const b = bloomBuf.getContext("2d");
  b.globalCompositeOperation = "copy";
  b.filter = "blur(2px) brightness(0.8) contrast(1.9)";
  b.drawImage(cv, 0, 0, bw, bh);
  b.filter = "none";
  b.globalCompositeOperation = "multiply";
  b.fillStyle = "rgb(255,216,150)";
  b.fillRect(0, 0, bw, bh);

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.3 + flash * 0.2;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bloomBuf, 0, 0, cw, ch);

  ctx.restore();
}

function typewriterStep(total) {
  const clipPlaying = currentClip && currentClip.clip.isPlaying();

  if (clipPlaying) {
    const f = constrain(
      currentClip.clip.currentTime() / max(0.1, currentClip.clip.duration()),
      0,
      1
    );
    speech.sync = max(
      speech.sync,
      currentClip.part.at + f * (currentClip.part.end - currentClip.part.at)
    );
  }

  if (speech.voiced && !speech.voiceDone) {
    const waited = millis() - (speech.t0 || 0);

    if (!speech.limit && waited > 2200) speech.voiced = false;

    const idle =
      !speech.loading &&
      !voiceTalking() &&
      !(window.speechSynthesis && window.speechSynthesis.pending);
    if (idle && waited > 2800 && speech.limit) {
      speech.idleSince = speech.idleSince || millis();
      if (millis() - speech.idleSince > 800) speech.voiceDone = true;
    } else {
      speech.idleSince = 0;
    }
  }

  if (speech.voiced && !speech.voiceDone) {
    const next = speech.shown + deltaTime * 0.015;
    speech.shown = clipPlaying
      ? min(total, max(speech.shown, speech.sync))
      : min(speech.limit || 0, max(next, speech.sync || 0), total);
  } else if (speech.voiced && speech.voiceDone) {
    speech.shown = total;
  } else {
    speech.shown = min(total, speech.shown + deltaTime * 0.045);
  }
}
