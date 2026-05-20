import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { folders } from '../data/folders';

gsap.registerPlugin(useGSAP);

// ── Orbit configuration ────────────────────────────────────────────────────
const RADIUS_X      = 540;
const RADIUS_Z      = 540;
const Y_AMPLITUDE   = 50;    // gentle undulation
const TILT_X        = -6;
const ROTATION_SPD  = 0.00008;
const THUMB_W       = 180;
const THUMB_H       = Math.round(THUMB_W * 0.75);

export default function Gallery3D({ onSelectFolder, isVisible }) {
  const viewportRef = useRef(null);
  const sceneRef    = useRef(null);
  const itemRefs    = useRef([]);
  const labelRefs   = useRef([]);
  const imgRefs     = useRef([]);
  const hintRef     = useRef(null);

  const angleRef    = useRef(0);              // global orbit angle
  const pauseFactorRef = useRef(1);            // 1 = full speed, 0 = stopped (lerped)
  const hoverIdxRef = useRef(-1);              // which item is hovered
  const lastTimeRef = useRef(performance.now());
  const dragRef     = useRef({ moved: false, startX: 0, startY: 0 });
  const rafRef      = useRef(null);

  const baseAngles  = useRef(
    folders.map((_, i) => (i / folders.length) * Math.PI * 2)
  );

  // Per-item smoothed state: how much it's "lifted" toward camera (0..1)
  const itemLift = useRef(folders.map(() => 0));

  // ── Main animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const tick = (now) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Smoothly lerp the global rotation speed factor toward target
      const isHovering = hoverIdxRef.current !== -1;
      const targetPause = isHovering ? 0 : 1;
      pauseFactorRef.current += (targetPause - pauseFactorRef.current) * 0.08;

      angleRef.current += ROTATION_SPD * dt * pauseFactorRef.current;

      const items    = itemRefs.current;
      const images   = imgRefs.current;
      const labels   = labelRefs.current;
      const hoverIdx = hoverIdxRef.current;

      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el) continue;

        // Lerp per-item lift toward target
        const targetLift = (i === hoverIdx) ? 1 : 0;
        itemLift.current[i] += (targetLift - itemLift.current[i]) * 0.12;
        const lift = itemLift.current[i];

        const a = baseAngles.current[i] + angleRef.current;
        const x = Math.cos(a) * RADIUS_X;
        const z = Math.sin(a) * RADIUS_Z;
        // Undulating vertical position — uses 2× the angle so items rise/fall twice per loop
        const y = Math.sin(a * 2 + i * 0.7) * Y_AMPLITUDE;
        const depthNorm = (z + RADIUS_Z) / (RADIUS_Z * 2); // 0 (far) .. 1 (near)

        // Hover lifts the item forward and slightly up (subtle)
        const liftZ     = lift * 50;
        const liftY     = lift * -10;
        const liftScale = 1 + lift * 0.05;

        // Cards always face camera (billboard style) — no rotateY
        el.style.transform =
          `translate3d(${x}px, ${y + liftY}px, ${z + liftZ}px) ` +
          `scale(${liftScale})`;

        // Dark background: depth via brightness (fade to black) + hover dim
        const img = images[i];
        if (img) {
          const dim  = (isHovering && i !== hoverIdx) ? 0.5 : 1;
          const base = 0.50 + depthNorm * 0.50;
          const brightness = base * dim + lift * (1 - base) * 1.1;
          const contrast   = 1 + depthNorm * 0.06 + lift * 0.05;
          img.style.opacity = '1';
          img.style.filter = `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
        }

        // Label opacity
        const label = labels[i];
        if (label) {
          const baseOp = 0.15 + depthNorm * 0.75;
          const target = (i === hoverIdx) ? 1
                        : (isHovering ? baseOp * 0.45 : baseOp);
          label.style.opacity = target.toFixed(2);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Entrance / exit ───────────────────────────────────────────────────────
  // A single source of truth for visibility animations. Previously a second
  // useEffect also animated item.autoAlpha which fought this tween and caused
  // the photos to flicker on first enter.
  useGSAP(() => {
    if (!viewportRef.current) return;
    if (isVisible) {
      gsap.set(viewportRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      gsap.fromTo(
        itemRefs.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 1.4,
          stagger: 0.07,
          ease: 'power2.out',
          overwrite: 'auto',
        }
      );
      if (hintRef.current) {
        gsap.set(hintRef.current, { autoAlpha: 1 });
        gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.8, delay: 4 });
      }
    } else {
      gsap.to(viewportRef.current, {
        autoAlpha: 0, duration: 0.4,
        onComplete: () => gsap.set(viewportRef.current, { pointerEvents: 'none' }),
      });
    }
  }, { dependencies: [isVisible] });

  // ── Hover handling ───────────────────────────────────────────────────────
  const onEnter = useCallback((i) => {
    hoverIdxRef.current = i;
  }, []);

  const onLeave = useCallback(() => {
    hoverIdxRef.current = -1;
  }, []);

  // ── Click ────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    dragRef.current = { moved: false, startX: e.clientX, startY: e.clientY };
  }, []);

  const onPointerMove = useCallback((e) => {
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
  }, []);

  const handleClick = useCallback((folder, i) => {
    if (dragRef.current.moved) return;
    hoverIdxRef.current = -1; // release hover lock
    // The clicked item fades to white-out feel; others dim away
    itemRefs.current.forEach((el, j) => {
      if (!el) return;
      if (j === i) {
        gsap.to(el, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' });
      } else {
        gsap.to(el, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', delay: j * 0.02 });
      }
    });
    gsap.delayedCall(0.5, () => onSelectFolder(folder));
  }, [onSelectFolder]);

  return (
    <div
      className="g3d-viewport"
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <div
        className="g3d-scene"
        ref={sceneRef}
        style={{ transform: `rotateX(${TILT_X}deg)` }}
      >
        {folders.map((folder, i) => (
          <div
            key={folder.id}
            ref={(el) => (itemRefs.current[i] = el)}
            className="g3d-item"
            style={{
              width:      THUMB_W,
              marginLeft: -THUMB_W / 2,
              marginTop:  -THUMB_H / 2,
            }}
            onClick={() => handleClick(folder, i)}
            onMouseEnter={() => onEnter(i)}
            onMouseLeave={onLeave}
          >
            <img
              ref={(el) => (imgRefs.current[i] = el)}
              src={folder.thumbnail}
              alt={`Object ${folder.label}`}
              className="gi-img"
              draggable={false}
            />
            <span
              ref={(el) => (labelRefs.current[i] = el)}
              className="gi-label"
            >
              {folder.label}
            </span>
          </div>
        ))}
      </div>

      <div className="g3d-hud-tl">
        <span className="g3d-title">AI in Object Design</span>
      </div>
      <div className="g3d-hud-br" ref={hintRef}>
        <span className="g3d-hint">Hover to pause &middot; Click to enter</span>
      </div>
    </div>
  );
}
