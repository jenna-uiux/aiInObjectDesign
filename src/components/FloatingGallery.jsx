import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { folders, thumbnailLayout } from '../data/folders';

gsap.registerPlugin(useGSAP);

export default function FloatingGallery({ onSelectFolder, isVisible }) {
  const containerRef = useRef(null);
  const thumbRefs = useRef([]);
  const floatTweens = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Entrance / exit animations triggered by isVisible prop
  useGSAP(() => {
    if (!containerRef.current) return;

    if (isVisible) {
      gsap.set(containerRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      gsap.fromTo(
        thumbRefs.current,
        { autoAlpha: 0, scale: 0.85, y: 30 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          stagger: { amount: 0.7, from: 'random' },
        }
      );
    } else {
      gsap.to(thumbRefs.current, {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.5,
        ease: 'power2.in',
        stagger: { amount: 0.3, from: 'random' },
        onComplete: () => {
          gsap.set(containerRef.current, { pointerEvents: 'none' });
        },
      });
    }
  }, { scope: containerRef, dependencies: [isVisible] });

  // Floating idle animations — start once, run forever
  useGSAP(() => {
    if (!containerRef.current) return;

    thumbRefs.current.forEach((el, i) => {
      if (!el) return;
      const layout = thumbnailLayout[i];
      const dur = 5 + Math.random() * 5;
      const yAmp = 12 + Math.random() * 14;
      const rotAmp = 1.2 + Math.random() * 1.8;
      const scaleAmp = 0.015 + Math.random() * 0.02;
      const delay = Math.random() * -dur;

      const tween = gsap.to(el, {
        y: `+=${yAmp}`,
        rotation: `+=${rotAmp}`,
        scale: 1 + scaleAmp,
        duration: dur,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay,
      });
      floatTweens.current[i] = tween;
    });

    return () => {
      floatTweens.current.forEach((t) => t && t.kill());
    };
  }, { scope: containerRef });

  // Mouse parallax — use requestAnimationFrame for smooth update
  const onMouseMove = useCallback((e) => {
    mouseRef.current = {
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tick = () => {
      thumbRefs.current.forEach((el, i) => {
        if (!el) return;
        const depth = thumbnailLayout[i].depth;
        gsap.to(el, {
          x: mouseRef.current.x * depth * 80,
          y: mouseRef.current.y * depth * 60,
          duration: 1.2,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    container.addEventListener('mousemove', onMouseMove);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseMove]);

  const handleClick = useCallback((folder, index) => {
    if (!isVisible) return;

    // Highlight the clicked thumb, fade out others
    thumbRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === index) {
        gsap.to(el, { scale: 1.08, autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' });
      } else {
        gsap.to(el, { autoAlpha: 0, duration: 0.4, ease: 'power2.in', delay: i * 0.02 });
      }
    });

    gsap.delayedCall(0.55, () => onSelectFolder(folder));
  }, [isVisible, onSelectFolder]);

  const handleHoverIn = useCallback((index) => {
    const el = thumbRefs.current[index];
    if (!el || !isVisible) return;
    gsap.to(el, { scale: 1.06, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  }, [isVisible]);

  const handleHoverOut = useCallback((index) => {
    const el = thumbRefs.current[index];
    if (!el || !isVisible) return;
    gsap.to(el, { scale: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  }, [isVisible]);

  return (
    <div className="floating-gallery" ref={containerRef}>
      <header className="gallery-header">
        <span className="gallery-title">AI in Object Design</span>
        <span className="gallery-subtitle">Select an object to explore</span>
      </header>

      <div className="gallery-field">
        {folders.map((folder, i) => {
          const layout = thumbnailLayout[i];
          return (
            <div
              key={folder.id}
              ref={(el) => (thumbRefs.current[i] = el)}
              className="thumb-wrapper"
              style={{
                left: `${layout.x}%`,
                top: `${layout.y}%`,
                '--init-rotation': `${layout.rotation}deg`,
              }}
              onClick={() => handleClick(folder, i)}
              onMouseEnter={() => handleHoverIn(i)}
              onMouseLeave={() => handleHoverOut(i)}
            >
              <div className="thumb-glow" />
              <img
                src={folder.thumbnail}
                alt={`Object ${folder.label}`}
                className="thumb-image"
                draggable={false}
              />
              <span className="thumb-label">{folder.label}</span>
            </div>
          );
        })}
      </div>

      <footer className="gallery-footer">
        <span className="gallery-count">10 objects</span>
      </footer>
    </div>
  );
}
