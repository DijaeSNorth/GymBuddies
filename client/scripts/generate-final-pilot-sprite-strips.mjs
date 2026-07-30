import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const FRAME = 24;
const POSES = 12;
const FRAMES_PER_POSE = 2;
const outputRoot = resolve(
  import.meta.dirname,
  '..',
  'public',
  'assets',
  'gym-buddies',
  'buddies',
  'handcrafted',
);

const COLOR = {
  outline: '#061519',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
};

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0;
    rgba.copy(
      scanlines,
      rowOffset + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function rgba(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function createSurface(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  return {
    width,
    height,
    pixels,
    pixel(x, y, color) {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || py < 0 || px >= width || py >= height) return;
      const offset = (py * width + px) * 4;
      const value = rgba(color);
      pixels[offset] = value[0];
      pixels[offset + 1] = value[1];
      pixels[offset + 2] = value[2];
      pixels[offset + 3] = value[3];
    },
    rect(x, y, rectWidth, rectHeight, color) {
      for (let py = y; py < y + rectHeight; py += 1) {
        for (let px = x; px < x + rectWidth; px += 1) {
          this.pixel(px, py, color);
        }
      }
    },
    line(x0, y0, x1, y1, color) {
      let x = Math.round(x0);
      let y = Math.round(y0);
      const targetX = Math.round(x1);
      const targetY = Math.round(y1);
      const dx = Math.abs(targetX - x);
      const sx = x < targetX ? 1 : -1;
      const dy = -Math.abs(targetY - y);
      const sy = y < targetY ? 1 : -1;
      let error = dx + dy;
      while (true) {
        this.pixel(x, y, color);
        if (x === targetX && y === targetY) break;
        const doubled = 2 * error;
        if (doubled >= dy) {
          error += dy;
          x += sx;
        }
        if (doubled <= dx) {
          error += dx;
          y += sy;
        }
      }
    },
    polygon(points, color) {
      const minX = Math.floor(Math.min(...points.map(([x]) => x)));
      const maxX = Math.ceil(Math.max(...points.map(([x]) => x)));
      const minY = Math.floor(Math.min(...points.map(([, y]) => y)));
      const maxY = Math.ceil(Math.max(...points.map(([, y]) => y)));
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          let inside = false;
          for (
            let current = 0, previous = points.length - 1;
            current < points.length;
            previous = current, current += 1
          ) {
            const [currentX, currentY] = points[current];
            const [previousX, previousY] = points[previous];
            const crosses =
              currentY > y !== previousY > y &&
              x <
                ((previousX - currentX) * (y - currentY)) /
                    (previousY - currentY || 1) +
                  currentX;
            if (crosses) inside = !inside;
          }
          if (inside) this.pixel(x, y, color);
        }
      }
    },
  };
}

function shifted(points, dx, dy) {
  return points.map(([x, y]) => [x + dx, y + dy]);
}

function poseState(pose, frame) {
  const stridePose = pose === 1 || pose === 2;
  const entrance = pose === 10 || pose === 11;
  return {
    breath: pose === 0 || pose === 4 ? frame : 0,
    stride: stridePose ? (frame === 0 ? -1 : 1) : 0,
    lift: entrance && frame === 1 ? -1 : 0,
    crouch: pose === 4 ? 1 : pose === 5 ? (frame === 0 ? 1 : 0) : 0,
    flex: pose === 6 || pose === 7 || pose === 8,
    training: pose === 3,
    sidePose: pose === 9,
  };
}

function drawBearHead(frame, direction, xOffset, yOffset, back) {
  const side = direction === 'left' || direction === 'right';
  const facing = direction === 'right' ? 1 : -1;
  if (side) {
    frame.polygon(
      shifted(
        [
          [8, 3],
          [13, 2],
          [17, 5],
          [16, 9],
          [9, 9],
          [7, 6],
        ],
        xOffset,
        yOffset,
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [9, 4],
          [13, 3],
          [15, 5],
          [15, 8],
          [10, 8],
          [8, 6],
        ],
        xOffset,
        yOffset,
      ),
      COLOR.primary,
    );
    frame.rect(10 + xOffset, 2 + yOffset, 3, 3, COLOR.outline);
    frame.rect(11 + xOffset, 3 + yOffset, 2, 2, COLOR.primary);
    const muzzleX = facing < 0 ? 6 : 14;
    frame.rect(muzzleX + xOffset, 6 + yOffset, 4, 2, COLOR.detail);
    frame.pixel(
      (facing < 0 ? 6 : 17) + xOffset,
      6 + yOffset,
      COLOR.outline,
    );
    frame.pixel(
      (facing < 0 ? 10 : 14) + xOffset,
      5 + yOffset,
      COLOR.detail,
    );
    return;
  }
  frame.rect(6 + xOffset, 2 + yOffset, 4, 4, COLOR.outline);
  frame.rect(14 + xOffset, 2 + yOffset, 4, 4, COLOR.outline);
  frame.rect(7 + xOffset, 3 + yOffset, 2, 2, COLOR.primary);
  frame.rect(15 + xOffset, 3 + yOffset, 2, 2, COLOR.primary);
  frame.polygon(
    shifted(
      [
        [7, 4],
        [10, 2],
        [14, 2],
        [17, 4],
        [17, 8],
        [14, 10],
        [10, 10],
        [7, 8],
      ],
      xOffset,
      yOffset,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [8, 5],
        [10, 3],
        [14, 3],
        [16, 5],
        [16, 8],
        [14, 9],
        [10, 9],
        [8, 8],
      ],
      xOffset,
      yOffset,
    ),
    COLOR.primary,
  );
  if (back) {
    frame.rect(9 + xOffset, 5 + yOffset, 6, 2, COLOR.secondary);
    frame.pixel(9 + xOffset, 4 + yOffset, COLOR.detail);
    frame.pixel(14 + xOffset, 4 + yOffset, COLOR.detail);
  } else {
    frame.rect(9 + xOffset, 6 + yOffset, 6, 3, COLOR.detail);
    frame.rect(11 + xOffset, 6 + yOffset, 2, 2, COLOR.outline);
    frame.pixel(9 + xOffset, 5 + yOffset, COLOR.detail);
    frame.pixel(14 + xOffset, 5 + yOffset, COLOR.detail);
  }
}

function drawBearArm(frame, side, pose, xOffset, yOffset) {
  const left = side === 'left';
  const mirrorX = (x) => (left ? x : 24 - x);
  const flex = pose === 6 || pose === 7 || pose === 8;
  const entrance = pose === 10 || pose === 11;
  if (flex || entrance) {
    const shoulderX = left ? 4 : 20;
    const elbowX = left ? 2 : 22;
    frame.polygon(
      [
        [shoulderX, 10 + yOffset],
        [elbowX, 8 + yOffset],
        [left ? 3 : 21, 5 + yOffset],
        [left ? 6 : 18, 5 + yOffset],
        [left ? 8 : 16, 11 + yOffset],
      ],
      COLOR.outline,
    );
    frame.rect(left ? 3 : 18, 6 + yOffset, 3, 3, COLOR.primary);
    frame.rect(left ? 2 : 19, 4 + yOffset, 4, 3, COLOR.outline);
    frame.rect(left ? 3 : 20, 5 + yOffset, 2, 2, COLOR.primary);
    frame.rect(left ? 3 : 19, 8 + yOffset, 4, 2, COLOR.secondary);
    return;
  }
  const points = left
    ? [
        [5, 9],
        [8, 10],
        [7, 17],
        [5, 19],
        [2, 17],
        [3, 11],
      ]
    : [
        [19, 9],
        [16, 10],
        [17, 17],
        [19, 19],
        [22, 17],
        [21, 11],
      ];
  frame.polygon(shifted(points, xOffset, yOffset), COLOR.outline);
  const inner = left
    ? [
        [5, 10],
        [7, 11],
        [6, 16],
        [5, 17],
        [3, 16],
        [4, 11],
      ]
    : [
        [19, 10],
        [17, 11],
        [18, 16],
        [19, 17],
        [21, 16],
        [20, 11],
      ];
  frame.polygon(shifted(inner, xOffset, yOffset), COLOR.primary);
  frame.rect(
    mirrorX(left ? 3 : 21) + xOffset - (left ? 0 : 2),
    15 + yOffset,
    3,
    3,
    COLOR.secondary,
  );
  frame.line(
    (left ? 4 : 20) + xOffset,
    13 + yOffset,
    (left ? 6 : 18) + xOffset,
    13 + yOffset,
    COLOR.detail,
  );
}

function drawBearV2(frame, direction, pose, animationFrame) {
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const horizontalLean =
    side && pose === 2 ? (direction === 'left' ? -1 : 1) : 0;
  const bodyY = state.lift + state.crouch;

  if (side) {
    frame.polygon(
      shifted(
        [
          [7, 8],
          [13, 7],
          [18, 10],
          [17, 17],
          [10, 18],
          [7, 15],
        ],
        horizontalLean,
        bodyY,
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [8, 9],
          [13, 8],
          [16, 10],
          [16, 16],
          [10, 17],
          [8, 14],
        ],
        horizontalLean,
        bodyY,
      ),
      COLOR.primary,
    );
    frame.polygon(
      shifted(
        [
          [8, 9],
          [13, 8],
          [15, 10],
          [13, 12],
          [9, 12],
        ],
        horizontalLean,
        bodyY,
      ),
      COLOR.secondary,
    );
    drawBearHead(frame, direction, horizontalLean, bodyY, false);
    const armX = direction === 'left' ? -1 : 1;
    frame.polygon(
      shifted(
        [
          [8, 10],
          [11, 10],
          [10, 17],
          [7, 19],
          [5, 17],
          [6, 12],
        ],
        horizontalLean + armX * state.stride,
        bodyY - (state.flex ? 2 : 0),
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [8, 11],
          [10, 11],
          [9, 16],
          [7, 17],
          [6, 16],
          [7, 12],
        ],
        horizontalLean + armX * state.stride,
        bodyY - (state.flex ? 2 : 0),
      ),
      COLOR.primary,
    );
  } else {
    frame.polygon(
      shifted(
        [
          [4, 9],
          [7, 7],
          [17, 7],
          [20, 9],
          [17, 16],
          [15, 18],
          [9, 18],
          [7, 16],
        ],
        0,
        bodyY,
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [6, 9],
          [8, 8],
          [16, 8],
          [18, 9],
          [16, 15],
          [14, 17],
          [10, 17],
          [8, 15],
        ],
        0,
        bodyY,
      ),
      COLOR.primary,
    );
    if (back) {
      frame.polygon(
        shifted(
          [
            [7, 9],
            [12, 8],
            [17, 9],
            [15, 13],
            [12, 16],
            [9, 13],
          ],
          0,
          bodyY,
        ),
        COLOR.secondary,
      );
      frame.line(12, 9 + bodyY, 12, 15 + bodyY, COLOR.detail);
    } else {
      frame.polygon(
        shifted(
          [
            [7, 9],
            [12, 8],
            [17, 9],
            [15, 12],
            [12, 13],
            [9, 12],
          ],
          0,
          bodyY,
        ),
        COLOR.secondary,
      );
      frame.line(9, 10 + bodyY, 15, 10 + bodyY, COLOR.detail);
      frame.line(12, 12 + bodyY, 12, 16 + bodyY, COLOR.detail);
    }
    drawBearHead(frame, direction, 0, bodyY, back);
    drawBearArm(frame, 'left', pose, 0, bodyY);
    drawBearArm(frame, 'right', pose, 0, bodyY);
  }

  const legSpread = state.flex || state.sidePose ? 1 : 0;
  const leftStride = state.stride;
  frame.polygon(
    shifted(
      [
        [7 - legSpread, 16],
        [12, 16],
        [11 + leftStride, 21],
        [6 + leftStride - legSpread, 21],
      ],
      0,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [8 - legSpread, 17],
        [11, 17],
        [10 + leftStride, 20],
        [7 + leftStride - legSpread, 20],
      ],
      0,
      bodyY,
    ),
    COLOR.primary,
  );
  frame.polygon(
    shifted(
      [
        [12, 16],
        [17 + legSpread, 16],
        [18 - leftStride + legSpread, 21],
        [13 - leftStride, 21],
      ],
      0,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [13, 17],
        [16 + legSpread, 17],
        [17 - leftStride + legSpread, 20],
        [14 - leftStride, 20],
      ],
      0,
      bodyY,
    ),
    COLOR.primary,
  );
  frame.rect(5 + leftStride - legSpread, 20, 7, 2, COLOR.outline);
  frame.rect(12 - leftStride, 20, 7 + legSpread, 2, COLOR.outline);

  if (state.training) {
    frame.rect(5, 5 + bodyY, 14, 2, COLOR.outline);
    frame.rect(6, 5 + bodyY, 12, 1, COLOR.accent);
  }
  if (pose === 4) {
    frame.pixel(18, 4 + bodyY, COLOR.detail);
    frame.pixel(20, 3 + bodyY, COLOR.detail);
  }
  if (pose === 10 || pose === 11) {
    frame.pixel(3, 4, COLOR.accent);
    frame.pixel(20, 5, COLOR.detail);
  }
}

function drawWolfV2(frame, direction, pose, animationFrame) {
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const facing = direction === 'right' ? 1 : -1;
  const lean = side && pose === 2 ? facing : 0;
  const bodyY = state.lift + state.crouch;

  if (side) {
    frame.polygon(
      shifted(
        [
          [8, 8],
          [14, 7],
          [18, 10],
          [16, 16],
          [11, 17],
          [8, 14],
        ],
        lean,
        bodyY,
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [9, 9],
          [14, 8],
          [16, 10],
          [15, 15],
          [11, 16],
          [9, 14],
        ],
        lean,
        bodyY,
      ),
      COLOR.primary,
    );
    frame.polygon(
      shifted(
        [
          [9, 9],
          [14, 8],
          [16, 10],
          [13, 12],
          [10, 12],
        ],
        lean,
        bodyY,
      ),
      COLOR.secondary,
    );
  } else {
    frame.polygon(
      shifted(
        [
          [5, 9],
          [8, 7],
          [16, 7],
          [19, 9],
          [16, 13],
          [15, 17],
          [9, 17],
          [8, 13],
        ],
        0,
        bodyY,
      ),
      COLOR.outline,
    );
    frame.polygon(
      shifted(
        [
          [7, 9],
          [9, 8],
          [15, 8],
          [17, 9],
          [15, 12],
          [14, 16],
          [10, 16],
          [9, 12],
        ],
        0,
        bodyY,
      ),
      COLOR.primary,
    );
    if (back) {
      frame.polygon(
        shifted(
          [
            [8, 9],
            [12, 8],
            [16, 9],
            [14, 12],
            [12, 15],
            [10, 12],
          ],
          0,
          bodyY,
        ),
        COLOR.secondary,
      );
      frame.line(9, 10 + bodyY, 12, 12 + bodyY, COLOR.detail);
      frame.line(15, 10 + bodyY, 12, 12 + bodyY, COLOR.detail);
    } else {
      frame.polygon(
        shifted(
          [
            [8, 9],
            [12, 8],
            [16, 9],
            [14, 12],
            [12, 14],
            [10, 12],
          ],
          0,
          bodyY,
        ),
        COLOR.detail,
      );
      frame.line(12, 10 + bodyY, 12, 15 + bodyY, COLOR.secondary);
    }
  }

  const headX = side ? lean : 0;
  frame.polygon(
    shifted(
      side
        ? [
            [8, 4],
            [12, 2],
            [16, 4],
            [17, 7],
            [14, 9],
            [9, 8],
          ]
        : [
            [8, 4],
            [10, 2],
            [14, 2],
            [16, 4],
            [16, 8],
            [13, 10],
            [10, 10],
            [8, 8],
          ],
      headX,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      side
        ? [
            [9, 5],
            [12, 3],
            [15, 5],
            [15, 7],
            [13, 8],
            [10, 7],
          ]
        : [
            [9, 5],
            [11, 3],
            [13, 3],
            [15, 5],
            [15, 7],
            [13, 9],
            [10, 9],
            [9, 7],
          ],
      headX,
      bodyY,
    ),
    COLOR.primary,
  );
  frame.polygon(
    shifted(
      [
        [9, 4],
        [9, 1],
        [11, 3],
      ],
      headX,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [13, 3],
        [15, 1],
        [15, 5],
      ],
      headX,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.pixel(10 + headX, 3 + bodyY, COLOR.accent);
  frame.pixel(14 + headX, 3 + bodyY, COLOR.accent);
  if (!back) {
    const muzzleX = side ? (facing < 0 ? 6 : 14) : 9;
    frame.rect(muzzleX + headX, 7 + bodyY, side ? 5 : 6, 2, COLOR.detail);
    frame.pixel(
      (side ? (facing < 0 ? 6 : 18) : 11) + headX,
      7 + bodyY,
      COLOR.outline,
    );
  }

  const flex = state.flex || pose === 10 || pose === 11;
  const armY = flex ? 7 : 10;
  if (side) {
    const armX = direction === 'left' ? 5 : 15;
    frame.polygon(
      shifted(
        direction === 'left'
          ? [
              [8, armY],
              [11, armY + 1],
              [9, 18],
              [6, 18],
              [5, 15],
            ]
          : [
              [16, armY],
              [13, armY + 1],
              [15, 18],
              [18, 18],
              [19, 15],
            ],
        lean,
        bodyY,
      ),
      COLOR.outline,
    );
    frame.rect(armX + lean, 14 + bodyY, 4, 3, COLOR.secondary);
  } else {
    const leftArm = flex
      ? [
          [7, 9],
          [4, 7],
          [4, 4],
          [7, 4],
          [9, 10],
        ]
      : [
          [7, 9],
          [4, 10],
          [4, 17],
          [7, 18],
          [9, 11],
        ];
    const rightArm = leftArm.map(([x, y]) => [24 - x, y]);
    frame.polygon(shifted(leftArm, 0, bodyY), COLOR.outline);
    frame.polygon(shifted(rightArm, 0, bodyY), COLOR.outline);
    frame.rect(4, (flex ? 5 : 14) + bodyY, 3, 3, COLOR.secondary);
    frame.rect(17, (flex ? 5 : 14) + bodyY, 3, 3, COLOR.secondary);
  }

  const stride = state.stride;
  frame.polygon(
    shifted(
      [
        [8, 15],
        [12, 15],
        [11 + stride, 21],
        [7 + stride, 21],
      ],
      lean,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [12, 15],
        [16, 15],
        [17 - stride, 21],
        [13 - stride, 21],
      ],
      lean,
      bodyY,
    ),
    COLOR.outline,
  );
  frame.rect(8 + stride + lean, 17 + bodyY, 3, 3, COLOR.primary);
  frame.rect(13 - stride + lean, 17 + bodyY, 3, 3, COLOR.primary);
  frame.rect(6 + stride + lean, 20, 6, 2, COLOR.outline);
  frame.rect(12 - stride + lean, 20, 6, 2, COLOR.outline);
  frame.pixel(9 + stride + lean, 18 + bodyY, COLOR.detail);
  frame.pixel(14 - stride + lean, 18 + bodyY, COLOR.detail);

  const tailStartX = direction === 'right' ? 7 : 17;
  const tailEndX =
    direction === 'right' ? 2 : pose === 2 ? 22 : 21;
  frame.line(
    tailStartX + lean,
    12 + bodyY,
    tailEndX,
    15 - stride + bodyY,
    COLOR.outline,
  );
  frame.line(
    tailStartX + lean,
    13 + bodyY,
    tailEndX,
    16 - stride + bodyY,
    COLOR.secondary,
  );
  frame.pixel(tailEndX, 15 - stride + bodyY, COLOR.accent);

  if (state.training) {
    frame.rect(3, 7 + bodyY, 3, 3, COLOR.accent);
    frame.rect(18, 7 + bodyY, 3, 3, COLOR.accent);
  }
  if (pose === 4) {
    frame.pixel(18, 5 + bodyY, COLOR.detail);
  }
}

function drawPrismV2(frame, direction, pose, animationFrame) {
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const right = direction === 'right';
  const back = direction === 'back';
  const centerX = side ? (right ? 13 : 11) : 12;
  const y = state.lift + Math.floor(state.crouch / 2);
  const flare = state.flex || pose === 10 || pose === 11 ? 2 : 0;

  frame.polygon(
    shifted(
      [
        [centerX, 2],
        [centerX + 5, 6],
        [centerX + 6, 12],
        [centerX + 3, 17],
        [centerX, 19],
        [centerX - 3, 17],
        [centerX - 6, 12],
        [centerX - 5, 6],
      ],
      0,
      y,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [centerX, 4],
        [centerX + 4, 7],
        [centerX + 4, 12],
        [centerX + 2, 16],
        [centerX, 17],
        [centerX - 2, 16],
        [centerX - 4, 12],
        [centerX - 4, 7],
      ],
      0,
      y,
    ),
    COLOR.primary,
  );
  const darkFacet = back
    ? [
        [centerX - 3, 7],
        [centerX, 5],
        [centerX + 2, 11],
        [centerX, 16],
        [centerX - 3, 13],
      ]
    : [
        [centerX, 4],
        [centerX + 4, 8],
        [centerX + 2, 13],
        [centerX, 16],
      ];
  frame.polygon(shifted(darkFacet, 0, y), COLOR.secondary);
  frame.line(centerX - 3, 8 + y, centerX, 15 + y, COLOR.detail);
  frame.line(centerX, 4 + y, centerX + 3, 10 + y, COLOR.detail);
  frame.rect(centerX - 1, 9 + y, 3, 3, COLOR.accent);

  const leftRoot = centerX - 4;
  const rightRoot = centerX + 4;
  const leftTipX = centerX - 8 - flare;
  const rightTipX = centerX + 7 + flare;
  const leftTipY = state.sidePose ? 13 : 6 - flare;
  const rightTipY = state.sidePose ? 5 : 8 - flare;
  frame.polygon(
    shifted(
      [
        [leftRoot, 7],
        [leftTipX, leftTipY],
        [leftTipX + 1, leftTipY + 5],
        [leftRoot - 1, 12],
      ],
      0,
      y,
    ),
    COLOR.outline,
  );
  frame.line(leftRoot - 1, 8 + y, leftTipX + 1, leftTipY + 1 + y, COLOR.detail);
  frame.polygon(
    shifted(
      [
        [rightRoot, 6],
        [rightTipX, rightTipY],
        [rightTipX - 1, rightTipY + 5],
        [rightRoot + 1, 12],
      ],
      0,
      y,
    ),
    COLOR.outline,
  );
  frame.line(rightRoot + 1, 8 + y, rightTipX - 1, rightTipY + 1 + y, COLOR.secondary);
  frame.pixel(leftTipX + 1, leftTipY + y, COLOR.accent);
  frame.pixel(rightTipX - 1, rightTipY + y, COLOR.accent);

  if (side) {
    const sideTip = right ? centerX + 8 : centerX - 8;
    frame.line(centerX, 6 + y, sideTip, 4 + y, COLOR.detail);
    frame.line(centerX, 14 + y, sideTip, 16 + y, COLOR.secondary);
    frame.pixel(sideTip, 4 + y, COLOR.accent);
  }

  const stride = state.stride;
  frame.polygon(
    shifted(
      [
        [centerX - 2, 17],
        [centerX - 5 + stride, 21],
        [centerX - 8 + stride, 21],
        [centerX - 5, 16],
      ],
      0,
      y,
    ),
    COLOR.outline,
  );
  frame.polygon(
    shifted(
      [
        [centerX + 2, 17],
        [centerX + 5 - stride, 21],
        [centerX + 8 - stride, 21],
        [centerX + 5, 16],
      ],
      0,
      y,
    ),
    COLOR.outline,
  );
  frame.pixel(centerX - 5 + stride, 19 + y, COLOR.detail);
  frame.pixel(centerX + 5 - stride, 19 + y, COLOR.detail);

  if (state.training) {
    frame.line(centerX - 7, 14 + y, centerX + 7, 14 + y, COLOR.accent);
    frame.pixel(centerX - 8, 14 + y, COLOR.detail);
    frame.pixel(centerX + 8, 14 + y, COLOR.detail);
  }
  if (pose === 4) {
    frame.pixel(centerX + 7, 4 + y, COLOR.detail);
  }
  if (pose === 10 || pose === 11) {
    frame.pixel(2, 5, COLOR.accent);
    frame.pixel(21, 4, COLOR.detail);
    if (animationFrame === 1) frame.pixel(3, 3, COLOR.detail);
  }
}

function copyFrame(strip, frame, targetFrame) {
  for (let y = 0; y < FRAME; y += 1) {
    const sourceStart = y * FRAME * 4;
    const targetStart =
      (y * strip.width + targetFrame * FRAME) * 4;
    frame.pixels.copy(
      strip.pixels,
      targetStart,
      sourceStart,
      sourceStart + FRAME * 4,
    );
  }
}

function writeDirectionStrip(speciesId, direction, drawFrame) {
  const strip = createSurface(FRAME * POSES * FRAMES_PER_POSE, FRAME);
  for (let pose = 0; pose < POSES; pose += 1) {
    for (
      let animationFrame = 0;
      animationFrame < FRAMES_PER_POSE;
      animationFrame += 1
    ) {
      const frame = createSurface(FRAME, FRAME);
      drawFrame(frame, direction, pose, animationFrame);
      copyFrame(
        strip,
        frame,
        pose * FRAMES_PER_POSE + animationFrame,
      );
    }
  }
  const path = join(
    outputRoot,
    speciesId,
    'versions',
    'v2',
    `base-${direction}.png`,
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(strip.width, strip.height, strip.pixels));
  return path;
}

function writeBossOverlay() {
  const strip = createSurface(FRAME * 5, FRAME);
  for (let tier = 0; tier < 5; tier += 1) {
    const frame = createSurface(FRAME, FRAME);
    const defeated = tier === 4;
    const energized = tier >= 1 && tier <= 3;

    if (!defeated) {
      frame.line(7, 8, 10, 12, COLOR.outline);
      frame.line(17, 8, 14, 12, COLOR.outline);
      frame.line(7, 9, 10, 13, COLOR.accent);
      frame.line(17, 9, 14, 13, COLOR.accent);
      frame.rect(10, 12, 4, 3, COLOR.outline);
      frame.rect(11, 12, 2, 2, COLOR.accent);
      frame.rect(4, 13, 4, 4, COLOR.secondary);
      frame.rect(16, 13, 4, 4, COLOR.secondary);
    }
    if (tier >= 1 && tier <= 3) {
      frame.line(4, 12, 2, 9, COLOR.detail);
      frame.line(20, 12, 22, 9, COLOR.detail);
      frame.pixel(3, 7, COLOR.accent);
      frame.pixel(20, 6, COLOR.accent);
    }
    if (tier === 1) {
      frame.rect(3, 15, 5, 2, COLOR.accent);
      frame.rect(16, 15, 5, 2, COLOR.accent);
      frame.line(8, 7, 12, 4, COLOR.detail);
      frame.line(16, 7, 12, 4, COLOR.detail);
    }
    if (tier === 2) {
      frame.line(2, 6, 2, 13, COLOR.accent);
      frame.line(21, 6, 21, 13, COLOR.accent);
      frame.line(5, 4, 8, 2, COLOR.detail);
      frame.line(19, 4, 16, 2, COLOR.detail);
      frame.rect(10, 2, 4, 2, COLOR.accent);
      frame.pixel(12, 1, COLOR.detail);
    }
    if (tier === 3) {
      frame.line(5, 6, 8, 3, COLOR.accent);
      frame.line(19, 6, 16, 3, COLOR.accent);
      frame.line(8, 3, 12, 1, COLOR.outline);
      frame.line(16, 3, 12, 1, COLOR.outline);
      frame.rect(11, 1, 3, 2, COLOR.accent);
      frame.pixel(2, 17, COLOR.detail);
      frame.pixel(21, 17, COLOR.detail);
    }
    if (defeated) {
      frame.line(7, 9, 10, 13, COLOR.outline);
      frame.line(17, 9, 14, 13, COLOR.outline);
      frame.line(8, 10, 11, 14, COLOR.secondary);
      frame.line(16, 10, 13, 14, COLOR.secondary);
      frame.rect(9, 15, 6, 2, COLOR.outline);
      frame.rect(10, 15, 4, 1, COLOR.detail);
      frame.line(7, 18, 4, 20, COLOR.detail);
      frame.line(17, 18, 20, 20, COLOR.detail);
      frame.rect(8, 4, 8, 1, COLOR.secondary);
      frame.pixel(18, 6, COLOR.detail);
    }
    if (energized) {
      frame.pixel(6, 5, COLOR.detail);
      frame.pixel(18, 5, COLOR.detail);
    }
    copyFrame(strip, frame, tier);
  }
  const path = join(
    outputRoot,
    'bosses',
    'versions',
    'v2',
    'home-watchman-tiers.png',
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(strip.width, strip.height, strip.pixels));
  return path;
}

const outputs = [
  writeDirectionStrip('brawny-bear', 'front', drawBearV2),
  writeDirectionStrip('brawny-bear', 'back', drawBearV2),
  writeDirectionStrip('brawny-bear', 'left', drawBearV2),
  writeDirectionStrip('iron-wolf', 'front', drawWolfV2),
  writeDirectionStrip('iron-wolf', 'back', drawWolfV2),
  writeDirectionStrip('iron-wolf', 'left', drawWolfV2),
  writeDirectionStrip('prismantle', 'front', drawPrismV2),
  writeDirectionStrip('prismantle', 'back', drawPrismV2),
  writeDirectionStrip('prismantle', 'left', drawPrismV2),
  writeDirectionStrip('prismantle', 'right', drawPrismV2),
  writeBossOverlay(),
];

outputs.forEach((output) => console.log(output));
