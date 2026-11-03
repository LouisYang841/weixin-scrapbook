// Canvas relief is baked once into each page, then follows the original
// mono-flipbook paper deformation without extra meshes or animation loops.
function tapeOutline(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.moveTo(-108, -26);
  c.bezierCurveTo(-42, -32, 48, -32, 109, -24);
  for (let y = -18; y <= 24; y += 7) c.lineTo(106 + (y % 2 ? 3 : -2), y);
  c.bezierCurveTo(42, 32, -43, 28, -108, 27);
  for (let y = 20; y >= -22; y -= 7) c.lineTo(-108 + (y % 2 ? 3 : -2), y);
  c.closePath();
}

export function drawTape(
  c: CanvasRenderingContext2D, x: number, y: number, color: string, angle: number,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);

  // A narrow contact shadow anchors the middle; softer shadows lift the ends.
  c.shadowColor = '#433b3540';
  c.shadowBlur = 8;
  c.shadowOffsetX = 2;
  c.shadowOffsetY = 5;
  tapeOutline(c);
  c.fillStyle = color + 'bd';
  c.fill();
  c.shadowColor = 'transparent';

  c.save();
  tapeOutline(c);
  c.clip();
  const sheen = c.createLinearGradient(0, -30, 0, 32);
  sheen.addColorStop(0, '#ffffff90');
  sheen.addColorStop(.12, '#ffffff28');
  sheen.addColorStop(.45, '#ffffff08');
  sheen.addColorStop(.8, '#4b52401a');
  sheen.addColorStop(1, '#ffffff60');
  c.fillStyle = sheen;
  c.fillRect(-115, -34, 230, 70);

  // Visible paper fibres and a small wrinkle keep the tape translucent.
  c.lineWidth = .8;
  c.strokeStyle = '#ffffff32';
  for (let z = -120; z < 120; z += 10) {
    c.beginPath(); c.moveTo(z, -32); c.lineTo(z + 19, 33); c.stroke();
  }
  const endLight = c.createLinearGradient(-110, 0, 110, 0);
  endLight.addColorStop(0, '#ffffff88');
  endLight.addColorStop(.06, '#ffffff15');
  endLight.addColorStop(.8, '#ffffff00');
  endLight.addColorStop(.94, '#3e493e28');
  endLight.addColorStop(1, '#ffffff90');
  c.fillStyle = endLight;
  c.fillRect(-115, -34, 230, 70);
  c.restore();

  c.strokeStyle = '#fffefaa0'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-100, -25);
  c.bezierCurveTo(-42, -30, 48, -30, 99, -24); c.stroke();
  c.strokeStyle = '#575b4938';
  c.beginPath(); c.moveTo(-101, 27);
  c.bezierCurveTo(-43, 28, 43, 31, 101, 25); c.stroke();
  c.restore();
}

export function drawMountedPhoto(
  c: CanvasRenderingContext2D, im: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  angle: number, caption: string, color: string,
) {
  const width = w + 30, height = h + 82;
  const left = -w / 2 - 15, top = -h / 2 - 15;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(angle);

  // The shadow widens towards the unglued bottom edge and its lifted corners.
  c.save();
  c.translate(left, top);
  c.shadowColor = '#3b352e48'; c.shadowBlur = 24;
  c.shadowOffsetX = 5; c.shadowOffsetY = 15;
  c.fillStyle = '#51433324';
  c.beginPath(); c.moveTo(5, 8); c.lineTo(width - 5, 8);
  c.lineTo(width + 3, height - 7);
  c.quadraticCurveTo(width / 2, height - 25, -3, height - 4);
  c.closePath(); c.fill();
  c.restore();

  // Thin stacked edges read as photographic paper, rather than a printed box.
  for (let layer = 3; layer >= 1; layer--) {
    c.fillStyle = ['#e9e3d6', '#d5cebf', '#c4bcac'][layer - 1];
    c.fillRect(left + layer * .5, top + layer * 1.5, width, height);
  }

  const sheet = document.createElement('canvas');
  sheet.width = width; sheet.height = height;
  const p = sheet.getContext('2d')!;
  p.fillStyle = '#fffefa'; p.fillRect(0, 0, width, height);
  p.fillStyle = '#fff'; p.fillRect(15, 15, w, h);
  const scale = Math.min(w / im.width, h / im.height);
  const iw = im.width * scale, ih = im.height * scale;
  p.drawImage(im, 15 + (w - iw) / 2, 15 + (h - ih) / 2, iw, ih);
  p.fillStyle = '#74796e'; p.font = '17px monospace';
  p.fillText(caption, 25, h + 55);

  // A broad, soft reflection suggests a gently bowed surface.
  const light = p.createLinearGradient(0, 0, width, 0);
  light.addColorStop(0, '#5e514a0d');
  light.addColorStop(.22, '#ffffff00');
  light.addColorStop(.48, '#ffffff19');
  light.addColorStop(.72, '#ffffff00');
  light.addColorStop(1, '#51473716');
  p.fillStyle = light; p.fillRect(0, 0, width, height);
  p.strokeStyle = '#ffffffd9'; p.lineWidth = 2;
  p.strokeRect(1, 1, width - 2, height - 2);

  // Warp the complete mount in strips so photo, border and caption stay aligned.
  // Assemble before rotating: this avoids antialiasing seams between strips.
  const bend = Math.min(8, width * .012);
  const bowed = document.createElement('canvas');
  bowed.width = width; bowed.height = height + Math.ceil(bend);
  const b = bowed.getContext('2d')!;
  for (let sx = 0; sx < width; sx += 3) {
    const sw = Math.min(3, width - sx);
    const lift = Math.sin((sx / width) * Math.PI) * bend;
    b.drawImage(sheet, sx, 0, sw, height, sx, bend - lift, sw, height);
  }
  c.drawImage(bowed, left, top - bend);

  // Turn up a tiny corner in the empty lower border, clear of the illustration.
  const right = left + width, bottom = top + height;
  c.save();
  c.shadowColor = '#41372c48'; c.shadowBlur = 7;
  c.shadowOffsetX = -3; c.shadowOffsetY = 4;
  c.beginPath(); c.moveTo(right - 29, bottom - 2);
  c.quadraticCurveTo(right - 10, bottom - 12, right - 2, bottom - 28);
  c.lineTo(right - 2, bottom - 2); c.closePath();
  const curl = c.createLinearGradient(right - 28, bottom - 26, right, bottom);
  curl.addColorStop(0, '#fffef8'); curl.addColorStop(.6, '#eee8d9');
  curl.addColorStop(1, '#c8bfac'); c.fillStyle = curl; c.fill();
  c.restore();
  drawTape(c, 0, top - bend + 3, color, -angle * .4);
  c.restore();
}
