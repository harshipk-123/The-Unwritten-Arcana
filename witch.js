// WITCH
function narrationBusy() {
  return Boolean(started && voiceOn && soundOn && speech.voiced && !speech.voiceDone && millis() - (speech.t0 || 0) < 30000);
}

function speak(text, pieces) {
  text = withName(text);
  if (pieces) pieces = pieces.map(withName);

  if (narrationBusy()) {
    speech.pending = { text, pieces };
    return;
  }
  beginSpeech(text, pieces);
}

function beginSpeech(text, pieces) {
  speech.pending = null;
  speech.full = text;
  speech.shown = 0;
  speech.alpha = 0;
  speech.t0 = millis();
  narrate(text, pieces);
}

function witchSparkle(n) {
  for (let i = 0; i < n; i++) {
    motes.push(new Mote(true, CONFIG.witchX + random(-40, 40), CONFIG.witchBaseY - 300));
  }
}

function wrapLines(str, maxWidth) {
  const lines = [];

  str.split("\n").forEach((para) => {
    if (para === "") {
      lines.push("");
      return;
    }

    let line = "";
    para.split(" ").forEach((word) => {
      const test = line ? line + " " + word : word;
      if (textWidth(test) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    lines.push(line);
  });

  return lines;
}

function drawSpeechBubble(dt) {
  if (!started || !speech.full) return;

  if (speech.pending && !narrationBusy()) beginSpeech(speech.pending.text, speech.pending.pieces);

  speech.alpha = min(1, speech.alpha + 0.06 * dt);
  const total = speech.full.length;
  const wasTyping = speech.shown < total;
  typewriterStep(total);

  if (wasTyping && frameCount % 7 === 0) witchSparkle(1);

  const bx = 34;
  const bw = 300;
  const bottom = 250;

  textFont("Cormorant Garamond");
  textSize(18);
  textStyle(NORMAL);
  const lines = wrapLines(speech.full, bw - 32);
  const lh = 21;
  const bh = lines.length * lh + 30;
  const by = bottom - bh;
  const a = speech.alpha;

  push();
  translate(0, (1 - a) * 8);

  drawingContext.save();
  drawingContext.shadowBlur = 24;
  drawingContext.shadowColor = "rgba(0,0,0,.5)";
  noStroke();
  fill(232, 220, 191, 238 * a);
  rect(bx, by, bw, bh, 4);
  drawingContext.restore();

  noFill();
  stroke(183, 154, 97, 200 * a);
  strokeWeight(1);
  rect(bx + 4, by + 4, bw - 8, bh - 8, 2);

  noStroke();
  fill(232, 220, 191, 238 * a);
  triangle(CONFIG.witchX - 28, bottom - 1, CONFIG.witchX + 6, bottom - 1, CONFIG.witchX - 8, bottom + 28);

  fill(48, 36, 30, 255 * a);
  textAlign(LEFT, BASELINE);

  let remaining = floor(speech.shown);
  let lastX = bx + 16;
  let lastY = by + 25;

  for (let i = 0; i < lines.length; i++) {
    const shown = lines[i].slice(0, max(0, remaining));
    const y = by + 25 + i * lh;
    text(shown, bx + 16, y);

    if (remaining >= 0) {
      lastX = bx + 16 + textWidth(shown);
      lastY = y;
    }

    remaining -= lines[i].length + 1;
    if (remaining < 0) break;
  }

  if (wasTyping || floor(elapsed * 2.2) % 2 === 0) {
    fill(99, 49, 48, 200 * a);
    rect(lastX + 2, lastY - 13, 1.5, 15);
  }

  pop();
}

function drawWitch() {
  const cx = CONFIG.witchX;
  const base = CONFIG.witchBaseY;
  const bob = sin(elapsed * 1.1) * 4;
  const speaking = started && speech.shown < speech.full.length;
  const lit = constrain(sun + flash * 1.2, 0, 1);

  const pulse = 0.55 + sin(elapsed * 1.7) * 0.12 + (speaking ? 0.2 : 0);
  const auraColor = storm > 0.3 ? [120, 150, 230] : sun > 0.3 ? [255, 214, 130] : [120, 190, 150];
  const g = drawingContext.createRadialGradient(cx, base - 190 + bob, 20, cx, base - 190 + bob, 230);
  g.addColorStop(0, rgbStr(auraColor, 0.28 * pulse));
  g.addColorStop(0.5, rgbStr(auraColor, 0.1 * pulse));
  g.addColorStop(1, rgbStr(auraColor, 0));
  drawingContext.fillStyle = g;
  drawingContext.fillRect(cx - 260, base - 450, 520, 520);

  noStroke();
  fill(0, 0, 0, 110);
  ellipse(cx, base + 2, 190 - bob * 2, 22);

  push();
  translate(cx, base + bob);

  if (flinch > 0.01) {
    translate(random(-1, 1) * flinch * 4, 0);
    rotate(-flinch * 0.07);
    scale(1, 1 - flinch * 0.03);
  }

  drawProceduralWitch(lit, speaking);

  if (staffFlare > 0.02) {
    push();
    blendMode(ADD);
    noStroke();
    const o = CONFIG.staffOrb;
    for (let i = 5; i > 0; i--) {
      fill(170, 255, 200, 34 * staffFlare);
      circle(o.x, o.y, 18 + i * 18 * staffFlare);
    }
    pop();
  }

  pop();
}

function witchGlow(x, y, r, c, a) {
  const g = drawingContext.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgbStr(c, a));
  g.addColorStop(1, rgbStr(c, 0));
  drawingContext.save();
  drawingContext.globalCompositeOperation = "lighter";
  drawingContext.fillStyle = g;
  drawingContext.fillRect(x - r, y - r, r * 2, r * 2);
  drawingContext.restore();
}

function witchRim() {
  if (storm > 0.3) return [130, 160, 255];
  if (sun > 0.3) return [255, 214, 150];
  return [140, 255, 185];
}

function drawWitchStaff(speaking, rim, pulse) {
  const woodX = (y) => 84 + y / 75 + sin(y * 0.05) * 1.8;

  noFill();
  stroke(22, 16, 14);
  strokeWeight(6);
  beginShape();
  repeatN(31, (i) => vertex(woodX(-i * 10), -i * 10));
  endShape();

  stroke(...rim, 60);
  strokeWeight(1);
  beginShape();
  repeatN(31, (i) => vertex(woodX(-i * 10) + 3, -i * 10));
  endShape();

  stroke(22, 16, 14);
  strokeWeight(4.5);
  bezier(80, -296, 68, -302, 61, -322, 70, -340);
  bezier(80, -296, 92, -302, 99, -322, 90, -340);
  strokeWeight(1.8);
  line(70, -340, 74, -352);
  line(90, -340, 86, -352);

  witchGlow(80, -312, 56, [150, 255, 190], 0.5 + (speaking ? 0.25 : 0) + pulse * 0.12);
  noStroke();
  fill(176, 255, 210, 235);
  circle(80, -312, speaking ? 19 : 15);
  fill(245, 255, 250, 150);
  circle(80 + sin(elapsed * 1.7) * 3, -312 + cos(elapsed * 2.1) * 3, 7);
}

function traceWitchCloak(ctx, hem) {
  ctx.beginPath();
  ctx.moveTo(-12, -246);
  ctx.bezierCurveTo(-26, -240, -36, -222, -42, -196);
  ctx.bezierCurveTo(-58, -140, -70, -70, -74, -2);
  hem.forEach((h) => ctx.lineTo(h.x, h.y));
  ctx.bezierCurveTo(70, -70, 58, -140, 42, -196);
  ctx.bezierCurveTo(36, -222, 26, -240, 12, -246);
  ctx.closePath();
}

function drawWitchCloak(lit, rim) {
  const ctx = drawingContext;
  const flow = (i) => sin(elapsed * 1.4 + i * 0.8) * 2.5 + storm * sin(elapsed * 3.2 + i) * 3.5;
  const hem = Array.from({ length: 9 }, (_, i) => ({
    x: -74 + i * 18.5,
    y: i % 2 ? -(10 + abs(sin(i * 5.1)) * 18) + flow(i) : -2 + flow(i) * 0.4,
  }));

  ctx.save();

  const body = ctx.createLinearGradient(0, -246, 0, 0);
  body.addColorStop(0, rgbStr([30 + lit * 30, 25 + lit * 26, 42 + lit * 30]));
  body.addColorStop(0.55, rgbStr([14 + lit * 18, 11 + lit * 14, 22 + lit * 18]));
  body.addColorStop(1, rgbStr([5, 4, 9]));
  traceWitchCloak(ctx, hem);
  ctx.fillStyle = body;
  ctx.fill();

  const side = ctx.createLinearGradient(0, 0, 74, 0);
  side.addColorStop(0, rgbStr(rim, 0));
  side.addColorStop(1, rgbStr(rim, 0.16 + flash * 0.3));
  traceWitchCloak(ctx, hem);
  ctx.fillStyle = side;
  ctx.fill();

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 3;
  [-40, -14, 16, 44].forEach((x, i) => {
    ctx.beginPath();
    ctx.moveTo(x * 0.35, -210);
    ctx.bezierCurveTo(x * 0.6, -150, x * 0.9, -80, x * 1.2 + flow(i) * 0.4, -20);
    ctx.stroke();
  });

  traceWitchCloak(ctx, hem);
  ctx.strokeStyle = rgbStr(rim, 0.18 + flash * 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawWitchFace(skin, speaking, pulse) {
  const ctx = drawingContext;
  const rim = witchRim();
  const blink = frameCount % 230 < 7;
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(-16, -296);
    ctx.bezierCurveTo(-17, -282, -16.5, -272, -14, -262);
    ctx.bezierCurveTo(-12, -254, -7, -249, 0, -245);
    ctx.bezierCurveTo(7, -249, 12, -254, 14, -262);
    ctx.bezierCurveTo(16.5, -272, 17, -282, 16, -296);
    ctx.closePath();
  };

  noStroke();
  fill(46, 52, 50);
  rect(-5, -252, 10, 18);
  fill(0, 0, 0, 90);
  rect(-5, -252, 10, 6);

  ctx.save();
  const tone = ctx.createLinearGradient(-16, 0, 16, 0);
  tone.addColorStop(0, rgbStr([70, 76, 76]));
  tone.addColorStop(0.5, rgbStr(skin));
  tone.addColorStop(1, rgbStr([168, 184, 166]));
  trace();
  ctx.fillStyle = tone;
  ctx.fill();

  const shade = ctx.createLinearGradient(0, -282, 0, -254);
  shade.addColorStop(0, "rgba(2,2,6,0.95)");
  shade.addColorStop(1, "rgba(2,2,6,0)");
  trace();
  ctx.fillStyle = shade;
  ctx.fill();

  const edge = ctx.createLinearGradient(-16, 0, 16, 0);
  edge.addColorStop(0, rgbStr(rim, 0));
  edge.addColorStop(1, rgbStr(rim, 0.55));
  trace();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  noFill();
  strokeCap(ROUND);
  stroke(8, 10, 12, 90);
  strokeWeight(5);
  bezier(-13, -268, -12, -262, -9, -256, -6, -252);
  stroke(8, 10, 12, 50);
  bezier(13, -268, 12, -262, 9, -256, 6, -252);
  stroke(10, 12, 14, 90);
  strokeWeight(1);
  bezier(-5, -259, -9, -256, -9.5, -252, -7.5, -248);
  stroke(10, 12, 14, 60);
  bezier(5, -259, 9, -256, 9.5, -252, 7.5, -248);

  noStroke();
  fill(26, 30, 30, 130);
  triangle(-1, -274, -3.5, -259, 0.5, -261);
  fill(178, 194, 174, 200);
  triangle(0.5, -274, 5, -260, 0.5, -262);
  fill(150, 166, 150);
  ellipse(2.4, -259.5, 7, 4.5);
  fill(16, 18, 18, 210);
  ellipse(0.4, -258.2, 2.4, 1.4);
  ellipse(4.6, -258.2, 2.4, 1.4);
  fill(10, 10, 14, 110);
  ellipse(2.4, -256.5, 9, 3);
  fill(190, 205, 185, 70);
  ellipse(0.5, -247.5, 6, 3);

  if (speaking) {
    const open = 2 + abs(sin(elapsed * 14)) * 5;
    fill(24, 8, 14);
    ellipse(0.5, -251.5, 9, open);
    fill(206, 204, 180, 200);
    triangle(-2.5, -251.5 - open / 2, -1, -251.5 - open / 2, -1.8, -250.5 - open / 2 + 2);
    triangle(2, -251.5 - open / 2, 3.5, -251.5 - open / 2, 2.8, -250.5 - open / 2 + 2);
  } else {
    noFill();
    stroke(26, 12, 16);
    strokeWeight(1.3);
    bezier(-5, -251, -2, -252.5, 2, -252.5, 6, -250.5);
  }

  const eye = (s) => {
    const x = s * 6.5;
    witchGlow(x, -274, 13, [170, 255, 170], 0.4 + (speaking ? 0.2 : 0) + pulse * 0.08);
    noStroke();
    fill(222, 255, 190);
    beginShape();
    vertex(s * 12, -277);
    bezierVertex(s * 9, -279.4, s * 5, -277.4, s * 2.5, -272.6);
    bezierVertex(s * 6, -273.6, s * 9.5, -274.6, s * 12, -277);
    endShape(CLOSE);
  };

  if (blink) {
    stroke(20, 24, 20);
    strokeWeight(1.2);
    line(-12, -276, -2.5, -272.6);
    line(12, -276, 2.5, -272.6);
  } else {
    eye(-1);
    eye(1);
  }
}

function drawWitchHat(rim) {
  const ctx = drawingContext;
  const sway = sin(elapsed * 1.3) * 5 + storm * sin(elapsed * 4) * 4;
  const brim = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * TWO_PI;
    const r = 1 + sin(i * 3.1) * 0.025;
    return { x: cos(a) * 56 * r, y: -292 + sin(a) * 11 * r + max(0, -cos(a)) * 4, a };
  });

  push();
  translate(0, -292);
  rotate(-0.03);
  translate(0, 292);

  ctx.save();
  const bg = ctx.createLinearGradient(0, -304, 0, -280);
  bg.addColorStop(0, rgbStr([30, 26, 40]));
  bg.addColorStop(1, rgbStr([6, 5, 10]));
  ctx.beginPath();
  brim.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  const cg = ctx.createLinearGradient(-26, 0, 30, 0);
  cg.addColorStop(0, rgbStr([30, 26, 42]));
  cg.addColorStop(0.5, rgbStr([10, 8, 15]));
  cg.addColorStop(1, rgbStr([5, 4, 8]));
  ctx.beginPath();
  ctx.moveTo(-26, -296);
  ctx.bezierCurveTo(-22, -330, -10, -356, 6 + sway * 0.3, -378);
  ctx.bezierCurveTo(14 + sway * 0.2, -352, 24, -326, 26, -296);
  ctx.closePath();
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.strokeStyle = rgbStr(rim, 0.16);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-23, -300);
  ctx.bezierCurveTo(-19, -330, -9, -354, 4, -372);
  ctx.stroke();
  ctx.restore();

  noStroke();
  fill(4, 3, 7);
  beginShape();
  vertex(-26, -304);
  bezierVertex(-9, -299, 9, -299, 26, -304);
  vertex(26, -294);
  bezierVertex(9, -289, -9, -289, -26, -294);
  endShape(CLOSE);

  noFill();
  stroke(...rim, 55);
  strokeWeight(1);
  beginShape();
  brim.filter((p) => p.a > 0.15 && p.a < PI - 0.15).forEach((p) => vertex(p.x, p.y));
  endShape();

  pop();
}

function drawWitchSleeves(rim) {
  const ctx = drawingContext;
  const flow = (i) => sin(elapsed * 1.6 + i * 1.3) * 1.5 + storm * sin(elapsed * 4 + i) * 2;

  const sleeve = (s, order) => {
    ctx.save();
    const g = ctx.createLinearGradient(s * 40, -220, s * -10, -130);
    g.addColorStop(0, rgbStr([34, 28, 46]));
    g.addColorStop(1, rgbStr([8, 6, 12]));
    ctx.beginPath();
    ctx.moveTo(s * 20, -228);
    ctx.bezierCurveTo(s * 34, -218, s * 38, -178, s * 26, -144);
    ctx.lineTo(s * 22 + flow(order), -130);
    ctx.lineTo(s * 18, -140 + flow(order + 2));
    ctx.lineTo(s * 8, -124 + flow(order + 4));
    ctx.lineTo(s * -4, -142);
    ctx.bezierCurveTo(s * 6, -170, s * 10, -200, s * 12, -222);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = rgbStr(rim, s > 0 ? 0.3 : 0.14);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s * 20, -228);
    ctx.bezierCurveTo(s * 34, -218, s * 38, -178, s * 26, -144);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s * 26, -206);
    ctx.quadraticCurveTo(s * 34, -170, s * 22, -140);
    ctx.stroke();
    ctx.restore();
  };

  sleeve(-1, 0);
  sleeve(1, 1);

  noStroke();
  fill(0, 0, 0, 120);
  ellipse(0, -138, 30, 7);
}

function drawWitchCollar(pulse) {
  [-1, 1].forEach((s) => {
    noStroke();
    fill(16, 12, 22);
    quad(s * 6, -238, s * 10, -276, s * 26, -266, s * 32, -230);
    fill(60, 14, 28);
    quad(s * 6, -238, s * 10, -276, s * 16, -274, s * 14, -240);
    stroke(150, 150, 166, 70);
    strokeWeight(0.8);
    line(s * 10, -276, s * 26, -266);
    line(s * 26, -266, s * 32, -230);
  });

  stroke(22, 16, 16);
  strokeWeight(1);
  line(-6, -238, 0, -214);
  line(6, -238, 0, -214);
  noStroke();
  fill(150, 150, 160);
  circle(0, -212, 6);
  fill(10, 6, 8);
  circle(0, -212, 3.8);
  witchGlow(0, -212, 14, [255, 60, 50], 0.4 + pulse * 0.35);
  fill(255, 90, 70, 230);
  circle(0, -212, 2.2);
}

function drawWitchHair() {
  const drift = sin(elapsed * 1.2) * 2 + storm * (3 + sin(elapsed * 3) * 2);
  noFill();
  [-1, 1].forEach((s) => {
    repeatN(4, (i) => {
      stroke(i === 0 ? 40 : 118, i === 0 ? 40 : 120, i === 0 ? 50 : 132, i === 0 ? 200 : 150);
      strokeWeight(i === 0 ? 3 : 1.2);
      bezier(s * (14 + i), -288, s * (20 + i * 1.5), -262, s * (19 + i * 2) + drift * 0.4, -234, s * (22 + i * 2.5) + drift, -204 - i * 6);
    });
  });
}

function drawProceduralWitch(lit, speaking) {
  const rim = witchRim();
  const skin = [128 + lit * 20, 140 + lit * 20, 128 + lit * 14];
  const pulse = 0.5 + sin(elapsed * 2.2) * 0.5;

  drawWitchStaff(speaking, rim, pulse);
  drawWitchCloak(lit, rim);
  drawWitchSleeves(rim);
  drawWitchCollar(pulse);
  drawWitchFace(skin, speaking, pulse);
  drawWitchHair();
  drawWitchHat(rim);
}

const CAT = { x: 392, y: 652 };

function drawCat() {
  const t = elapsed;
  const warm = sunAmount();
  const rim = mixArr([120, 100, 200], [255, 200, 120], warm);
  const swish = sin(t * 1.6) * 8 + flinch * 14;
  const body = [10, 8, 16];

  const target = constrain((candle.x - CAT.x) / 420, -1, 1);
  const lookY = constrain((candle.y - (CAT.y - 70)) / 400, -1, 1);
  const blink = (frameCount + 41) % 290 < 6;
  const open = blink ? 0.1 : 1 - warm * 0.45;
  const flick = (frameCount + 90) % 340 < 8 ? 4 : 0;

  push();
  translate(CAT.x, CAT.y);
  scale(1 + flinch * 0.08, 1 + sin(t * 1.8) * 0.012 + flinch * 0.1);

  noStroke();
  fill(0, 0, 0, 120);
  ellipse(0, 2, 70, 9);

  noFill();
  stroke(...body);
  strokeWeight(8);
  strokeCap(ROUND);
  bezier(20, -6, 46 + swish * 0.4, -2, 52 + swish, -30, 40 + swish * 1.5, -50 - flinch * 20);
  stroke(...rim, 70);
  strokeWeight(1.2);
  bezier(23, -9, 49 + swish * 0.4, -5, 55 + swish, -32, 44 + swish * 1.5, -52 - flinch * 20);

  fill(...body);
  stroke(...rim, 80);
  strokeWeight(1.4);
  beginShape();
  vertex(-24, 0);
  bezierVertex(-30, -26, -16, -52, 0, -56);
  bezierVertex(14, -52, 26, -24, 24, 0);
  endShape(CLOSE);

  noStroke();
  fill(...body);
  ellipse(-8, -2, 15, 7);
  ellipse(9, -2, 15, 7);

  stroke(...rim, 80);
  strokeWeight(1.4);
  fill(...body);
  ellipse(4, -72, 31, 27);
  triangle(-8, -80, -6 - flick * 0.3, -99, 5, -85);
  triangle(10, -85, 17 + flick, -99, 20, -78);
  noStroke();
  fill(90, 40, 80, 190);
  triangle(-6, -83, -5, -94, 2, -85);
  triangle(12, -85, 16 + flick * 0.5, -94, 18, -81);

  stroke(190, 30, 50);
  strokeWeight(3);
  line(-8, -62, 17, -62);
  noStroke();
  fill(240, 200, 100);
  circle(4, -58, 6);
  fill(120, 80, 30);
  rect(3, -57, 2, 3);

  const eyeW = 8;
  const eyeH = 9 * open;
  [-3, 11].forEach((x) => {
    witchGlow(x, -74, 13, [220, 255, 90], 0.45 * open);
    noStroke();
    fill(225, 255, 100);
    ellipse(x, -74, eyeW, max(eyeH, 1));
    fill(8, 8, 10);
    ellipse(x + target * 1.6, -74 + lookY * 1.2, 1.8, max(eyeH - 1, 0.8));
  });

  stroke(214, 200, 230, 110);
  strokeWeight(0.7);
  line(-4, -68, -18, -70);
  line(-4, -66, -18, -64);
  line(12, -68, 26, -70);
  line(12, -66, 26, -64);
  noStroke();
  fill(120, 50, 70);
  triangle(2, -69, 6, -69, 4, -66);

  pop();
}

// WITCH VOICE
let voiceOn = true;
let witchVoice = null;
let speakToken = 0;
let currentClip = null;

class ServerClip {
  constructor(url) {
    this.audio = new Audio(url);
    this.audio.preload = "auto";
  }

  isLoaded() {
    return true;
  }

  isPlaying() {
    return !this.audio.paused && !this.audio.ended;
  }

  play() {
    this.audio.currentTime = 0;
    const p = this.audio.play();
    if (p && p.catch) p.catch(() => this.finish());
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  onended(fn) {
    this.endCallback = fn;
    this.audio.onended = fn;
    this.audio.onerror = fn;
  }

  finish() {
    if (this.endCallback) this.endCallback();
  }

  currentTime() {
    return this.audio.currentTime;
  }

  duration() {
    return this.audio.duration || 1;
  }
}

const clipCache = {};

function fetchClip(text) {
  text = withName(text);

  if (!voiceOn || !soundOn) return Promise.resolve(null);

  if (!clipCache[text]) {
    clipCache[text] = fetch(CONFIG.voiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Voice server returned " + r.status);
        return r.blob();
      })
      .then((blob) => new ServerClip(URL.createObjectURL(blob)))
      .catch((err) => {
        console.warn("Voice server unavailable, using browser voice:", err.message);
        delete clipCache[text];
        return null;
      });
  }

  return clipCache[text];
}

function prefetchSpreadVoice() {
  spread.forEach((card, i) => {
    fetchClip(POSITIONS[i]);
    fetchClip(card.name + ": " + card.meaning + ".");
  });

  fetchClip(verdict === "storm" ? WITCH_LINES.storm : WITCH_LINES.sun);
  if (verdict === "storm") fetchClip(WITCH_LINES.cackle);
}

function initVoice() {
  if (!("speechSynthesis" in window)) return;
  pickWitchVoice();
  window.speechSynthesis.onvoiceschanged = pickWitchVoice;
}

function pickWitchVoice() {
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return;

  const prefs = [
    "Google UK English Female",
    "Microsoft Hazel",
    "Moira",
    "Fiona",
    "Karen",
    "Samantha",
    "Serena",
    "Tessa",
    "Microsoft Zira",
    "Victoria",
    "Female",
  ];

  for (const p of prefs) {
    const v = all.find((x) => x.name.includes(p) && x.lang.startsWith("en"));
    if (v) {
      witchVoice = v;
      return;
    }
  }

  witchVoice = all.find((x) => x.lang.startsWith("en")) || all[0];
}

function voiceTalking() {
  const clipPlaying = currentClip && currentClip.clip.isPlaying();
  return Boolean(clipPlaying || ("speechSynthesis" in window && window.speechSynthesis.speaking));
}

function stopVoice() {
  speakToken++;
  speech.voiceDone = true;
  speech.loading = false;
  if (currentClip) currentClip.clip.stop();
  currentClip = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function narrate(text, pieces) {
  stopVoice();

  speech.voiced = false;
  speech.voiceDone = false;
  speech.loading = false;
  speech.sync = 0;
  speech.limit = 0;
  speech.idleSince = 0;

  if (!voiceOn || !soundOn || !started) return;

  const token = speakToken;
  const parts = [];
  let cursor = 0;

  (pieces || text.split("\n\n")).forEach((s) => {
    const at = text.indexOf(s, cursor);
    if (!s.trim() || at < 0) return;
    parts.push({ s, at, end: at + s.length });
    cursor = at + s.length;
  });
  if (!parts.length) return;
  speech.voiced = true;

  const run = async (i) => {
    if (token !== speakToken) return;
    if (i >= parts.length) {
      speech.voiceDone = true;
      return;
    }

    const part = parts[i];
    speech.limit = part.at + 1;
    speech.sync = max(speech.sync, part.at);
    speech.loading = true;

    if (parts[i + 1]) fetchClip(parts[i + 1].s);

    const clip = await fetchClip(part.s);
    if (token !== speakToken) return;

    speech.loading = false;
    speech.limit = part.end;

    if (clip) {
      currentClip = { clip, part };
      clip.onended(() => {
        if (token === speakToken) run(i + 1);
      });
      clip.play();
    } else {
      speakPart(part, token, () => run(i + 1));
    }
  };

  setTimeout(() => run(0), 70);
}

function speakPart(part, token, done) {
  if (!("speechSynthesis" in window)) {
    done();
    return;
  }

  const chunks = Array.from(part.s.matchAll(/[^.!?]+(?:[.!?]+|$)/g)).filter((m) => m[0].trim().length);
  if (!chunks.length) {
    done();
    return;
  }

  chunks.forEach((m, i) => {
    const c = m[0].trim();
    const at = part.at + m.index;
    const end = at + m[0].length;
    const u = new SpeechSynthesisUtterance(c);
    if (witchVoice) u.voice = witchVoice;
    u.lang = (witchVoice && witchVoice.lang) || "en-GB";

    const trailing = c.includes("...") || c.endsWith("…");
    u.pitch = constrain(0.42 + random(-0.08, 0.14) + (c.endsWith("?") ? 0.15 : 0), 0.2, 1.2);
    u.rate = trailing ? 0.85 : random(0.97, 1.1);
    u.volume = 1;

    u.onstart = () => {
      if (token !== speakToken) return;
      speech.sync = max(speech.sync, at);
      speech.limit = end;
    };

    u.onboundary = (e) => {
      if (token === speakToken) speech.sync = max(speech.sync, at + e.charIndex + (e.charLength || 4));
    };

    u.onend = u.onerror = () => {
      if (token !== speakToken) return;
      speech.sync = max(speech.sync, end);
      if (i === chunks.length - 1) done();
    };

    window.speechSynthesis.speak(u);
  });
}

function cackle(done) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (done) done();
  };

  if (!voiceOn || !soundOn || !started) {
    finish();
    return;
  }

  const tk = speakToken;
  const wait = () => {
    if (tk !== speakToken) return;
    if (!speechFinished()) {
      setTimeout(wait, 200);
      return;
    }

    fetchClip(WITCH_LINES.cackle).then((clip) => {
      if (tk !== speakToken) return;

      if (clip) {
        clip.onended(finish);
        clip.play();
        setTimeout(finish, 10000); 
      } else if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(WITCH_LINES.cackle);
        if (witchVoice) u.voice = witchVoice;
        u.pitch = 1.55;
        u.rate = 1.12;
        u.volume = 0.95;
        u.onend = u.onerror = finish;
        window.speechSynthesis.speak(u);
      } else {
        finish();
      }
    });
  };

  setTimeout(wait, 300);
}

function toggleVoice() {
  voiceOn = !voiceOn;
  if (!voiceOn) stopVoice();
  speech.voiced = false;
  speech.voiceDone = true;
}

// CRYSTAL BALL
const BALL = { x: 300, y: 588, r: 46 };
let ball = { cloud: 0.7, cloudGoal: 0.7, key: null, alpha: 0, pulse: 0 };

function ballReveal(key) {
  ball.key = key;
  ball.pulse = 1;
  ball.cloudGoal = 1;

  later(() => {
    ball.cloudGoal = 0.04;
    ring(NOTE(76), 0.04);
  }, 700);

  later(() => (ball.cloudGoal = 0.5), 4800);
}

function updateBall(dt) {
  ball.cloud += (ball.cloudGoal - ball.cloud) * 0.045 * dt;
  ball.alpha = constrain(1 - ball.cloud * 1.15, 0, 1);
  ball.pulse *= pow(0.97, dt);
}

function repeatN(n, fn) {
  Array.from({ length: n }, (_, i) => i).forEach(fn);
}

function drawSigil(key, s) {
  const ring = (n, fn) => repeatN(n, (i) => fn((i * TWO_PI) / n));
  noFill();

  if (key === "change") {
    beginShape();
    repeatN(68, (i) => vertex((cos(i * 0.15) * i * 0.15 * s) / 10.05, (sin(i * 0.15) * i * 0.15 * s) / 10.05));
    endShape();
  } else if (key === "fear") {
    arc(0, s * 0.35, s * 2, s * 1.4, PI * 1.12, PI * 1.88);
    arc(0, -s * 0.35, s * 2, s * 1.4, PI * 0.12, PI * 0.88);
    circle(0, 0, s * 0.7);
    circle(0, 0, s * 0.2);
  } else if (key === "attachment") {
    circle(-s * 0.3, 0, s * 1.1);
    circle(s * 0.3, 0, s * 1.1);
  } else if (key === "love") {
    beginShape();
    vertex(0, s * 0.8);
    bezierVertex(-s * 1.3, -s * 0.1, -s * 0.6, -s * 0.95, 0, -s * 0.3);
    bezierVertex(s * 0.6, -s * 0.95, s * 1.3, -s * 0.1, 0, s * 0.8);
    endShape();
  } else if (key === "growth") {
    line(0, s * 0.8, 0, -s * 0.2);
    line(-s * 0.5, s * 0.8, s * 0.5, s * 0.8);
    bezier(0, -s * 0.1, -s * 0.2, -s * 0.8, -s * 0.8, -s * 0.8, -s * 0.9, -s * 0.5);
    bezier(0, -s * 0.1, s * 0.2, -s * 0.8, s * 0.8, -s * 0.8, s * 0.9, -s * 0.5);
  } else if (key === "stability") {
    triangle(-s * 0.9, s * 0.6, 0, -s * 0.8, s * 0.9, s * 0.6);
    line(-s, s * 0.6, s, s * 0.6);
  } else if (key === "mind") {
    triangle(0, -s, -s * 0.87, s * 0.5, s * 0.87, s * 0.5);
    triangle(0, s, -s * 0.87, -s * 0.5, s * 0.87, -s * 0.5);
  } else if (key === "intuition") {
    drawCrescent(-s * 0.15, 0, s * 0.85);
    drawRosette(s * 0.6, -s * 0.4, s * 0.25, 4);
  } else if (key === "patience") {
    line(-s * 0.6, -s * 0.85, s * 0.6, -s * 0.85);
    line(-s * 0.6, s * 0.85, s * 0.6, s * 0.85);
    line(-s * 0.5, -s * 0.85, s * 0.5, s * 0.85);
    line(s * 0.5, -s * 0.85, -s * 0.5, s * 0.85);
  } else if (key === "beginning") {
    arc(0, s * 0.35, s * 0.9, s * 0.9, PI, TWO_PI);
    line(-s, s * 0.35, s, s * 0.35);
    repeatN(7, (i) => {
      const a = PI + (i * PI) / 6;
      line(cos(a) * s * 0.6, s * 0.35 + sin(a) * s * 0.6, cos(a) * s, s * 0.35 + sin(a) * s);
    });
  } else if (key === "belonging") {
    ring(6, (a) => circle(cos(a) * s * 0.7, sin(a) * s * 0.7, s * 0.4));
    circle(0, 0, s * 0.3);
  } else if (key === "truth") {
    beginShape();
    vertex(0, -s);
    bezierVertex(s * 0.9, -s * 0.1, s * 0.7, s * 0.8, 0, s * 0.85);
    bezierVertex(-s * 0.7, s * 0.8, -s * 0.9, -s * 0.1, 0, -s);
    endShape();
  } else if (key === "ending") {
    arc(0, -s * 0.1, s * 1.2, s * 1.4, PI, TWO_PI);
    line(-s * 0.6, -s * 0.1, -s * 0.6, s * 0.85);
    line(s * 0.6, -s * 0.1, s * 0.6, s * 0.85);
    line(-s * 0.9, s * 0.85, s * 0.9, s * 0.85);
  } else if (key === "attention") {
    [1.8, 1.1, 0.3].forEach((d) => circle(0, 0, s * d));
  } else if (key === "verdict_storm") {
    beginShape();
    [
      [0.3, -1],
      [-0.4, 0.1],
      [0.05, 0.1],
      [-0.3, 1],
      [0.5, -0.2],
      [0, -0.2],
    ].forEach((v) => vertex(v[0] * s, v[1] * s));
    endShape(CLOSE);
  } else if (key === "verdict_sun") {
    circle(0, 0, s * 0.9);
    ring(12, (a) => line(cos(a) * s * 0.6, sin(a) * s * 0.6, cos(a) * s, sin(a) * s));
  } else {
    circle(0, 0, s);
  }
}

function drawCrystalBall() {
  const { x, y, r } = BALL;
  const ctx = drawingContext;
  const lit = constrain(sun + flash, 0, 1);
  const mist = storm > 0.4 ? [110, 140, 235] : sun > 0.4 ? [255, 215, 140] : [170, 130, 225];

  noStroke();
  fill(0, 0, 0, 90);
  ellipse(x, y + r + 4, r * 2.2, 14);
  fill(48, 34, 30);
  stroke(183, 154, 97, 150);
  strokeWeight(1);
  beginShape();
  vertex(x - r * 0.8, y + r + 6);
  vertex(x - r * 0.45, y + r * 0.65);
  vertex(x + r * 0.45, y + r * 0.65);
  vertex(x + r * 0.8, y + r + 6);
  endShape(CLOSE);

  const pulse = 0.5 + sin(elapsed * 1.6) * 0.15 + ball.pulse * 0.6 + ball.alpha * 0.25;
  noStroke();
  for (let i = 5; i > 0; i--) {
    fill(mist[0], mist[1], mist[2], 8 * pulse * i);
    circle(x, y, r * 2 + i * 14);
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.clip();

  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
  g.addColorStop(0, rgbStr(mixArr([60, 44, 96], mist, 0.25 + lit * 0.4), 1));
  g.addColorStop(1, "rgba(10,6,20,1)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  noStroke();
  for (let i = 0; i < 16; i++) {
    const a = noise(i * 7.3, elapsed * 0.35) * TWO_PI * 2;
    const d = noise(i * 3.1 + 40, elapsed * 0.3) * r * 1.1;
    const sz = r * (0.5 + noise(i * 1.7, elapsed * 0.25) * 0.7);
    fill(mist[0], mist[1], mist[2], (14 + 40 * ball.cloud) * (0.5 + 0.5 * ball.cloud));
    circle(x + cos(a) * d * 0.8, y + sin(a) * d * 0.8, sz);
  }

  if (ball.key && ball.alpha > 0.02) {
    push();
    translate(x, y);
    const breathe = 1 + sin(elapsed * 2.2) * 0.04 + ball.pulse * 0.1;
    scale(breathe);
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(255,220,150,0.9)";
    stroke(255, 232, 170, 255 * ball.alpha);
    strokeWeight(2);
    drawSigil(ball.key, r * 0.52);
    pop();
  }
  drawCracks();
  ctx.restore();

  noFill();
  stroke(200, 190, 230, 110);
  strokeWeight(1.2);
  circle(x, y, r * 2);
  stroke(255, 255, 255, 120);
  strokeWeight(2);
  arc(x, y, r * 1.55, r * 1.55, PI * 1.1, PI * 1.55);
  noStroke();
  fill(255, 255, 255, 90);
  ellipse(x - r * 0.4, y - r * 0.5, r * 0.28, r * 0.16);
}

function drawCandleLight() {
  if (candle.glow < 0.02 || !started) return;

  const flicker = 0.85 + noise(frameCount * 0.08) * 0.3;
  const k = candle.glow * flicker * (1 - sun * 0.85) * (1 - storm * 0.25);
  const ctx = drawingContext;

  push();
  blendMode(ADD);
  const g = ctx.createRadialGradient(candle.x, candle.y, 2, candle.x, candle.y, 170);
  g.addColorStop(0, "rgba(255,190,100," + 0.34 * k + ")");
  g.addColorStop(0.35, "rgba(255,140,60," + 0.13 * k + ")");
  g.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(candle.x - 180, candle.y - 180, 360, 360);

  noStroke();
  fill(255, 210, 120, 230 * candle.glow);
  ellipse(candle.x, candle.y - 2, 4, 9 + sin(elapsed * 14) * 1.5);
  pop();
}

function candleLightAt(x, y) {
  if (!started) return 0;
  const d = dist(candle.x, candle.y, x, y);
  return constrain(1 - d / 190, 0, 1) * candle.glow * (1 - sun * 0.6);
}

function fogClear(x, y) {
  const d = dist(candle.x, candle.y, x, y);
  return constrain(map(d, 20, 190, 0.08, 1), 0.08, 1) * candle.glow + (1 - candle.glow);
}
