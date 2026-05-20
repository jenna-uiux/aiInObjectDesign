import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { folders, ECHOES, STARS } from '../data/folders';

gsap.registerPlugin(useGSAP);

const CANVAS_W   = 5000;
const CANVAS_H   = 4000;
const THUMB_W    = 150;       // px within the canvas
const INITIAL_ZOOM = 0.28;
const MIN_ZOOM   = 0.14;
const MAX_ZOOM   = 3.0;
const DRAG_THRESHOLD = 6;     // px — below this = click, above = drag

export default function SpaceCanvas({ onSelectFolder, isVisible }) {
  const outerRef   = useRef(null);
  const canvasRef  = useRef(null);
  const thumbRefs  = useRef([]);
  const hintRef    = useRef(null);

  // Pan/zoom state lives in refs — no React re-renders on interaction
  const pan    = useRef({ x: 0, y: 0 });
  const zoom   = useRef(INITIAL_ZOOM);
  const drag   = useRef({ active: false, moved: false, startX: 0, startY: 0,
                          startPanX: 0, startPanY: 0 });
  const pinch  = useRef({ active: false, dist: 0, midX: 0, midY: 0 });
  const floatTweens = useRef([]);

  // ── Apply transform to inner canvas ──────────────────────────────────────
  // Always go through gsap.set / gsap.to so GSAP's internal state stays in sync.
  const applyTransform = useCallback((smooth = false) => {
    if (!canvasRef.current) return;
    if (smooth) {
      gsap.to(canvasRef.current, {
        x: pan.current.x, y: pan.current.y,
        scale: zoom.current,
        duration: 0.5, ease: 'power2.out',
        overwrite: true,
      });
    } else {
      gsap.set(canvasRef.current, {
        x: pan.current.x, y: pan.current.y,
        scale: zoom.current,
      });
    }
  }, []);

  // ── Compute initial pan to center the canvas in the viewport ──────────────
  const initTransform = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    pan.current.x = (vw - CANVAS_W * INITIAL_ZOOM) / 2;
    pan.current.y = (vh - CANVAS_H * INITIAL_ZOOM) / 2;
    zoom.current  = INITIAL_ZOOM;
    applyTransform();
  }, [applyTransform]);

  // ── Entrance animation when view becomes visible ──────────────────────────
  useGSAP(() => {
    if (!outerRef.current) return;
    // Pin canvas transform-origin to top-left for zoom-toward-cursor math
    gsap.set(canvasRef.current, { transformOrigin: '0 0' });
    if (isVisible) {
      gsap.set(outerRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      initTransform();
      // Pull-back reveal: scale from 1.14 → 1
      gsap.fromTo(outerRef.current,
        { scale: 1.14, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out',
          transformOrigin: 'center center' }
      );
      // Hint fade-out after 4s
      gsap.set(hintRef.current, { autoAlpha: 1 });
      gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.8, delay: 4 });
    } else {
      gsap.to(outerRef.current, {
        autoAlpha: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => gsap.set(outerRef.current, { pointerEvents: 'none' }),
      });
    }
  }, { dependencies: [isVisible] });

  // ── Floating idle animations on thumbnails ────────────────────────────────
  useGSAP(() => {
    thumbRefs.current.forEach((el, i) => {
      if (!el) return;
      const dur      = 5 + Math.random() * 6;
      const yAmp     = 10 + Math.random() * 12;
      const rotAmp   = 1.0 + Math.random() * 1.6;
      const scaleAmp = 0.014 + Math.random() * 0.02;
      const delay    = Math.random() * -dur;

      const tween = gsap.to(el, {
        y: `+=${yAmp}`,
        rotation: `+=${rotAmp}`,
        scale: 1 + scaleAmp,
        duration: dur,
        ease: 'sine.inOut',
        repeat: -1, yoyo: true, delay,
      });
      floatTweens.current[i] = tween;
    });
    return () => floatTweens.current.forEach((t) => t?.kill());
  }, { scope: canvasRef });

  // ── GSAP star twinkle ─────────────────────────────────────────────────────
  useGSAP(() => {
    if (!canvasRef.current) return;
    const twinklers = canvasRef.current.querySelectorAll('.star--twinkle');
    twinklers.forEach((el) => {
      gsap.to(el, {
        autoAlpha: `*=${0.2 + Math.random() * 0.6}`,
        duration: 1.5 + Math.random() * 2.5,
        ease: 'sine.inOut',
        repeat: -1, yoyo: true,
        delay: Math.random() * 3,
      });
    });
  }, { scope: canvasRef });

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (e.target.closest('.space-thumb')) return;
    drag.current = {
      active: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      startPanX: pan.current.x, startPanY: pan.current.y,
    };
    outerRef.current.setPointerCapture(e.pointerId);
    outerRef.current.style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.moved &&
        (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.current.moved = true;
    }
    if (drag.current.moved) {
      pan.current.x = drag.current.startPanX + dx;
      pan.current.y = drag.current.startPanY + dy;
      applyTransform();
    }
  }, [applyTransform]);

  const onPointerUp = useCallback(() => {
    drag.current.active = false;
    if (outerRef.current) outerRef.current.style.cursor = 'grab';
  }, []);

  // ── Scroll zoom (toward cursor) ────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta  = e.deltaY * -0.001;
    const factor = Math.exp(delta);
    const newZ   = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.current * factor));
    const rect   = outerRef.current.getBoundingClientRect();
    const cx     = e.clientX - rect.left;
    const cy     = e.clientY - rect.top;
    const zf     = newZ / zoom.current;
    pan.current.x = cx - zf * (cx - pan.current.x);
    pan.current.y = cy - zf * (cy - pan.current.y);
    zoom.current  = newZ;
    applyTransform();
  }, [applyTransform]);

  // ── Pinch zoom ─────────────────────────────────────────────────────────────
  const getPinchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      pinch.current = {
        active: true,
        dist:   getPinchDist(e.touches),
        midX:  (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY:  (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length !== 2 || !pinch.current.active) return;
    e.preventDefault();
    const newDist = getPinchDist(e.touches);
    const newMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const newMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const scaleFactor = newDist / pinch.current.dist;
    const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.current * scaleFactor));
    const zf   = newZ / zoom.current;
    pan.current.x = newMidX - zf * (newMidX - pan.current.x) + (newMidX - pinch.current.midX);
    pan.current.y = newMidY - zf * (newMidY - pan.current.y) + (newMidY - pinch.current.midY);
    zoom.current  = newZ;
    pinch.current.dist = newDist;
    pinch.current.midX = newMidX;
    pinch.current.midY = newMidY;
    applyTransform();
  }, [applyTransform]);

  const onTouchEnd = useCallback(() => {
    pinch.current.active = false;
  }, []);

  // ── Attach wheel listener with passive:false ───────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart',  onTouchStart,  { passive: true  });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: true  });
    return () => {
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onWheel, onTouchStart, onTouchMove, onTouchEnd]);

  // ── Thumbnail click (skip if it was a drag) ───────────────────────────────
  const handleThumbClick = useCallback((folder, index) => {
    if (drag.current.moved) return;
    thumbRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === index) {
        gsap.to(el, { scale: 1.12, autoAlpha: 0, duration: 0.55, ease: 'power2.inOut' });
      } else {
        gsap.to(el, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', delay: i * 0.02 });
      }
    });
    gsap.delayedCall(0.5, () => onSelectFolder(folder));
  }, [onSelectFolder]);

  // ── Hover glow ────────────────────────────────────────────────────────────
  const onThumbEnter = useCallback((i) => {
    const el = thumbRefs.current[i];
    if (!el) return;
    gsap.to(el.querySelector('.thumb-glow'), { opacity: 1, duration: 0.4 });
    gsap.to(el.querySelector('.space-thumb-img'), { filter: 'brightness(1) contrast(1.08)', duration: 0.4 });
  }, []);

  const onThumbLeave = useCallback((i) => {
    const el = thumbRefs.current[i];
    if (!el) return;
    gsap.to(el.querySelector('.thumb-glow'), { opacity: 0, duration: 0.5 });
    gsap.to(el.querySelector('.space-thumb-img'), { filter: 'brightness(0.85) contrast(1.05)', duration: 0.5 });
  }, []);

  // ── Restore thumbs on return from viewer ──────────────────────────────────
  useEffect(() => {
    if (isVisible) {
      thumbRefs.current.forEach((el) => {
        if (el) gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' });
      });
    }
  }, [isVisible]);

  return (
    <div
      className="space-outer"
      ref={outerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="space-inner"
        ref={canvasRef}
      >
        {/* ── Star field ────────────────────────────────────── */}
        {STARS.map((s) => (
          <div
            key={s.id}
            className={`star${s.twinkle ? ' star--twinkle' : ''}`}
            style={{
              left:    s.cx,
              top:     s.cy,
              width:   s.size,
              height:  s.size,
              opacity: s.opacity,
            }}
          />
        ))}

        {/* ── Decorative echo images ─────────────────────────── */}
        {ECHOES.map((e, i) => (
          <img
            key={i}
            className="echo-img"
            src={folders[e.folderIdx].thumbnail}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              left:    e.cx - e.size / 2,
              top:     e.cy - e.size / 2,
              width:   e.size,
              height:  e.size,
              opacity: e.opacity,
              filter:  `blur(${e.blur}px) brightness(0.7)`,
              transform: `rotate(${e.rotation}deg)`,
            }}
          />
        ))}

        {/* ── Real thumbnails ───────────────────────────────── */}
        {folders.map((folder, i) => (
          <div
            key={folder.id}
            ref={(el) => (thumbRefs.current[i] = el)}
            className="space-thumb"
            style={{
              left:      folder.canvasX,
              top:       folder.canvasY,
              width:     THUMB_W,
              transform: `rotate(${folder.canvasRotation}deg)`,
            }}
            onClick={() => handleThumbClick(folder, i)}
            onMouseEnter={() => onThumbEnter(i)}
            onMouseLeave={() => onThumbLeave(i)}
          >
            <div className="thumb-glow" style={{ opacity: 0 }} />
            <img
              src={folder.thumbnail}
              alt={`Object ${folder.label}`}
              className="space-thumb-img"
              draggable={false}
              style={{ filter: 'brightness(0.85) contrast(1.05)' }}
            />
            <span className="space-thumb-label">{folder.label}</span>
          </div>
        ))}
      </div>

      {/* ── HUD ───────────────────────────────────────────── */}
      <div className="space-hud-tl">
        <span className="hud-title">Jenna&rsquo;s AI in Object Design</span>
      </div>
      <div className="space-hud-br" ref={hintRef}>
        <span className="hud-hint">drag to explore &middot; scroll to zoom</span>
      </div>
    </div>
  );
}
