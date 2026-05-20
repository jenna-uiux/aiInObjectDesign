// Explicit mapping of each folder's actual filenames (extensions vary per folder)
// canvasX/canvasY = top-left corner on the 5000×4000 virtual canvas (px)
export const folders = [
  {
    id: 1, label: '01',
    thumbnail: '/img/1/thumbnail.png',
    images: [
      '/img/1/1.png',
      '/img/1/2.png',
      '/img/1/3.png',
      '/img/1/4.png',
      '/img/1/5.png',
      '/img/1/6.png',
    ],
    canvasX: 280,  canvasY: 380,  canvasRotation: -2.0,
  },
  {
    id: 2, label: '02',
    thumbnail: '/img/2/thumbnail.png',
    images: ['/img/2/1.png', '/img/2/2.png', '/img/2/3.png'],
    canvasX: 1620, canvasY: 160,  canvasRotation: 1.5,
  },
  {
    id: 3, label: '03',
    thumbnail: '/img/3/thumbnail.png',
    images: ['/img/3/1.png', '/img/3/2.png', '/img/3/3.png', '/img/3/4.png', '/img/3/5.png'],
    canvasX: 3100, canvasY: 520,  canvasRotation: 2.8,
  },
  {
    id: 4, label: '04',
    thumbnail: '/img/4/thumbnail.png.png',
    images: ['/img/4/1.png', '/img/4/2.png', '/img/4/3.png'],
    canvasX: 680,  canvasY: 1350, canvasRotation: -1.5,
  },
  {
    id: 5, label: '05',
    thumbnail: '/img/5/thumbnail.png.jpg',
    images: ['/img/5/1.jpg', '/img/5/2.png', '/img/5/3.png'],
    canvasX: 2200, canvasY: 1000, canvasRotation: 3.2,
  },
  {
    id: 6, label: '06',
    thumbnail: '/img/6/thumbnail.png',
    images: ['/img/6/1.jpg', '/img/6/2.png', '/img/6/3.png', '/img/6/4.png.png'],
    canvasX: 4050, canvasY: 820,  canvasRotation: -2.5,
  },
  {
    id: 7, label: '07',
    thumbnail: '/img/7/thumbnail.png',
    images: ['/img/7/1.png', '/img/7/2.png'],
    canvasX: 1100, canvasY: 2280, canvasRotation: 1.8,
  },
  {
    id: 8, label: '08',
    thumbnail: '/img/8/thumbnail.PNG',
    images: ['/img/8/1.PNG', '/img/8/2.PNG', '/img/8/3.PNG'],
    canvasX: 3480, canvasY: 1920, canvasRotation: -1.2,
  },
  {
    id: 9, label: '09',
    thumbnail: '/img/9/thumbnail.png',
    images: ['/img/9/1.jpg', '/img/9/2.png', '/img/9/3.png', '/img/9/4.png'],
    canvasX: 2700, canvasY: 2900, canvasRotation: 2.5,
  },
  {
    id: 10, label: '10',
    thumbnail: '/img/10/thumbnail.png',
    images: ['/img/10/1.png', '/img/10/2.png', '/img/10/3.png', '/img/10/4.png'],
    canvasX: 4450, canvasY: 3300, canvasRotation: -3.0,
  },
];

// Decorative echo images: blurred semi-transparent copies scattered in the void
// cx/cy = center point on 5000×4000 canvas
export const ECHOES = [
  { folderIdx: 0, cx: 580,  cy: 880,  size: 62,  opacity: 0.18, blur: 2.5, rotation: 22  },
  { folderIdx: 2, cx: 1250, cy: 420,  size: 55,  opacity: 0.14, blur: 3.0, rotation: -15 },
  { folderIdx: 4, cx: 2850, cy: 440,  size: 70,  opacity: 0.20, blur: 2.0, rotation: 8   },
  { folderIdx: 1, cx: 3820, cy: 310,  size: 50,  opacity: 0.12, blur: 4.0, rotation: 30  },
  { folderIdx: 6, cx: 460,  cy: 1820, size: 65,  opacity: 0.16, blur: 2.5, rotation: -20 },
  { folderIdx: 3, cx: 1640, cy: 1640, size: 58,  opacity: 0.13, blur: 3.0, rotation: 12  },
  { folderIdx: 7, cx: 2620, cy: 1520, size: 72,  opacity: 0.19, blur: 2.0, rotation: -8  },
  { folderIdx: 5, cx: 4520, cy: 1420, size: 55,  opacity: 0.15, blur: 3.5, rotation: 25  },
  { folderIdx: 9, cx: 610,  cy: 2820, size: 62,  opacity: 0.17, blur: 2.5, rotation: -18 },
  { folderIdx: 8, cx: 1840, cy: 3220, size: 48,  opacity: 0.12, blur: 4.0, rotation: 35  },
  { folderIdx: 2, cx: 3220, cy: 3420, size: 68,  opacity: 0.20, blur: 2.0, rotation: -5  },
  { folderIdx: 0, cx: 4220, cy: 2620, size: 55,  opacity: 0.15, blur: 3.0, rotation: 18  },
  { folderIdx: 4, cx: 4820, cy: 520,  size: 60,  opacity: 0.16, blur: 2.5, rotation: -28 },
  { folderIdx: 7, cx: 360,  cy: 3620, size: 52,  opacity: 0.14, blur: 3.5, rotation: 40  },
  { folderIdx: 1, cx: 2220, cy: 3720, size: 65,  opacity: 0.18, blur: 2.0, rotation: -12 },
  { folderIdx: 6, cx: 4720, cy: 3820, size: 58,  opacity: 0.15, blur: 3.0, rotation: 20  },
  { folderIdx: 3, cx: 1020, cy: 620,  size: 45,  opacity: 0.11, blur: 4.0, rotation: -35 },
  { folderIdx: 9, cx: 3620, cy: 760,  size: 70,  opacity: 0.20, blur: 2.0, rotation: 15  },
  { folderIdx: 5, cx: 720,  cy: 2220, size: 55,  opacity: 0.16, blur: 3.0, rotation: -22 },
  { folderIdx: 8, cx: 4120, cy: 1820, size: 62,  opacity: 0.17, blur: 2.5, rotation: 8   },
  { folderIdx: 2, cx: 2420, cy: 2620, size: 50,  opacity: 0.13, blur: 3.5, rotation: -42 },
  { folderIdx: 0, cx: 3920, cy: 3120, size: 68,  opacity: 0.19, blur: 2.0, rotation: 28  },
  { folderIdx: 4, cx: 1420, cy: 3620, size: 55,  opacity: 0.15, blur: 3.0, rotation: -16 },
  { folderIdx: 6, cx: 2920, cy: 820,  size: 58,  opacity: 0.16, blur: 2.5, rotation: 32  },
  { folderIdx: 1, cx: 4620, cy: 2220, size: 48,  opacity: 0.12, blur: 4.0, rotation: -25 },
];

// Deterministic star field for the space background (250 stars on 5000×4000 canvas)
function lcgRand(seed) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export const STARS = (() => {
  const rand = lcgRand(42);
  return Array.from({ length: 250 }, (_, i) => {
    const tier = i % 3;
    return {
      id: i,
      cx:      Math.floor(rand() * 4980) + 10,
      cy:      Math.floor(rand() * 3980) + 10,
      size:    [1, 1.5, 2.5][tier],
      opacity: [0.12, 0.26, 0.48][tier],
      twinkle: i < 45,
    };
  });
})();
