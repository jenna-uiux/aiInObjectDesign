import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { folders } from '../data/folders';

// ── Particle config ────────────────────────────────────────────────────────
const COUNT    = 40;
const SIZES    = [44, 75, 115, 155];
const OPACITIES = [0.22, 0.42, 0.65, 0.85];
const SPEED_STEPS = [0.25, 0.5, 1, 2, 3];

function buildParticles() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Array.from({ length: COUNT }, (_, i) => {
    const tier = i < 16 ? 0 : i < 28 ? 1 : i < 36 ? 2 : 3;
    const angle = Math.random() * Math.PI * 2;
    const spd   = 14 + Math.random() * 22;
    return {
      id:       i,
      folderIdx: i % folders.length,
      tier,
      size:    SIZES[tier],
      opacity: OPACITIES[tier],
      x: Math.random() * vw,
      y: Math.random() * vh,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      rotation: (Math.random() - 0.5) * 30,
      spin:     (Math.random() - 0.5) * 0.35,
      el: null,
    };
  });
}

export default function ParticleField({
  onSelectFolder,
  isVisible,
  externalPaused,
  externalZoom,
}) {
  const containerRef  = useRef(null);
  const particlesRef  = useRef(buildParticles());
  const speedRef      = useRef(1);
  const isPausedRef   = useRef(false);
  const dragRef       = useRef({ moved: false, startX: 0, startY: 0 });

  const [speed, setSpeed]     = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ── Sync external gesture signals ───────────────────────────────────────
  useEffect(() => {
    if (externalPaused === undefined) return;
    isPausedRef.current = externalPaused;
    setIsPaused(externalPaused);
  }, [externalPaused]);

  useEffect(() => {
    if (externalZoom === undefined) return;
    setZoomLevel(Math.max(0.5, Math.min(4, externalZoom)));
  }, [externalZoom]);

  // ── Visibility / entrance ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (isVisible) {
      gsap.set(containerRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      particlesRef.current.forEach((p, i) => {
        if (!p.el) return;
        gsap.fromTo(p.el,
          { autoAlpha: 0 },
          { autoAlpha: p.opacity, duration: 1.4,
            delay: i * 0.015 + Math.random() * 0.3,
            ease: 'power2.out' }
        );
      });
    } else {
      gsap.to(containerRef.current, {
        autoAlpha: 0, duration: 0.4,
        onComplete: () => gsap.set(containerRef.current, { pointerEvents: 'none' }),
      });
    }
  }, [isVisible]);

  // ── Restore particles when returning from viewer ─────────────────────────
  useEffect(() => {
    if (!isVisible) return;
    particlesRef.current.forEach((p) => {
      if (p.el) gsap.to(p.el, { autoAlpha: p.opacity, scale: 1, duration: 0.6, ease: 'power2.out' });
    });
  }, [isVisible]);

  // ── GSAP ticker — main animation loop ────────────────────────────────────
  useEffect(() => {
    const ticker = (_time, deltaTime) => {
      if (isPausedRef.current) return;
      const dt = Math.min(deltaTime / 1000, 0.08);
      const sp = speedRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      particlesRef.current.forEach((p) => {
        if (!p.el) return;
        p.x += p.vx * sp * dt;
        p.y += p.vy * sp * dt;
        p.rotation += p.spin * sp * dt;

        const margin = p.size + 20;
        if (p.x >  vw + margin) p.x = -margin;
        else if (p.x < -margin) p.x =  vw + margin;
        if (p.y >  vh + margin) p.y = -margin;
        else if (p.y < -margin) p.y =  vh + margin;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
      });
    };
    gsap.ticker.add(ticker);
    return () => gsap.ticker.remove(ticker);
  }, []);

  // ── Speed cycle ───────────────────────────────────────────────────────────
  const cycleSpeed = useCallback(() => {
    const idx  = SPEED_STEPS.findIndex((s) => s >= speedRef.current);
    const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
    speedRef.current = next;
    setSpeed(next);
  }, []);

  // ── Pause toggle ──────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
  }, []);

  // ── Click vs drag ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    dragRef.current = { moved: false, startX: e.clientX, startY: e.clientY };
  }, []);

  const onPointerMove = useCallback((e) => {
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) dragRef.current.moved = true;
  }, []);

  const handleParticleClick = useCallback((folder, particleEl) => {
    if (dragRef.current.moved) return;
    particlesRef.current.forEach((p) => {
      if (!p.el) return;
      if (p.el === particleEl) {
        gsap.to(p.el, { scale: 1.15, autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' });
      } else {
        gsap.to(p.el, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', delay: Math.random() * 0.15 });
      }
    });
    gsap.delayedCall(0.45, () => onSelectFolder(folder));
  }, [onSelectFolder]);

  return (
    <div
      className="particle-field"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* Zoom wrapper controlled by pinch gesture */}
      <div
        className="particle-zoom"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {particlesRef.current.map((p) => {
          const folder = folders[p.folderIdx];
          return (
            <div
              key={p.id}
              ref={(el) => {
                p.el = el;
                if (el) {
                  el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
                }
              }}
              className="particle"
              style={{ width: p.size }}
              onClick={() => handleParticleClick(folder, p.el)}
            >
              <div className="particle-glow" />
              <img
                src={folder.thumbnail}
                alt={`Object ${folder.label}`}
                className="particle-img"
                draggable={false}
              />
              <span className="particle-label">{folder.label}</span>
            </div>
          );
        })}
      </div>

      {/* HUD — top left */}
      <div className="pf-hud-tl">
        <span className="pf-title">Jenna&rsquo;s AI in Object Design</span>
      </div>

      {/* Controls — bottom right */}
      <div className="pf-controls">
        <button className="pf-ctrl-btn" onClick={togglePause} title={isPaused ? 'Play' : 'Pause'}>
          {isPaused ? '▶' : '⏸'}
        </button>
        <button className="pf-ctrl-btn" onClick={cycleSpeed}>
          Speed: {speed}x
        </button>
      </div>
    </div>
  );
}
