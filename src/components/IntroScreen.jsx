import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function IntroScreen({ onExplore, isVisible }) {
  const containerRef = useRef(null);
  const contentRef   = useRef(null);
  const isExploring  = useRef(false);

  useGSAP(() => {
    if (!containerRef.current) return;
    if (isVisible) {
      gsap.set(containerRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      gsap.fromTo(contentRef.current,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 1.6, ease: 'power3.out' }
      );
    } else {
      gsap.set(containerRef.current, { autoAlpha: 0, pointerEvents: 'none' });
    }
  }, { dependencies: [isVisible] });

  const handleExplore = useCallback(() => {
    if (isExploring.current) return;
    isExploring.current = true;

    gsap.to(contentRef.current, {
      autoAlpha: 0, y: -16,
      duration: 0.7, ease: 'power2.in',
    });
    gsap.to(containerRef.current, {
      autoAlpha: 0,
      duration: 0.9, ease: 'power2.inOut', delay: 0.3,
      onComplete: () => {
        isExploring.current = false;
        onExplore();
      },
    });
  }, [onExplore]);

  return (
    <div className="intro-screen" ref={containerRef}>
      <div className="intro-content" ref={contentRef}>
        <h1 className="intro-title">
          AI in Object Design
        </h1>
        <p className="intro-subtitle">Jihyeon Jang &middot; Spring 2026</p>
        <button className="intro-explore-btn" onClick={handleExplore}>
          <span className="btn-label">Explore</span>
          <span className="btn-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
