import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function FolderViewer({ folder, onBack, isVisible }) {
  const containerRef = useRef(null);
  const imageARef = useRef(null);
  const imageBRef = useRef(null);
  const captionRef = useRef(null);
  const navRef = useRef(null);
  const headerRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Double-buffer: A is the active image, B is the outgoing
  const [buffers, setBuffers] = useState({ active: 'a', src: folder?.images[0] || '' });
  const isTransitioning = useRef(false);

  // Reset index and buffer when folder changes. Both image layers are kept
  // fully opaque — the transition between them is a horizontal slide, not a
  // cross-fade, so they can sit on top of each other showing the same source
  // until the user navigates.
  useEffect(() => {
    if (folder) {
      setCurrentIndex(0);
      setBuffers({ active: 'a', src: folder.images[0] });
      gsap.set(imageARef.current, { autoAlpha: 1, xPercent: 0 });
      gsap.set(imageBRef.current, { autoAlpha: 1, xPercent: 0 });
    }
  }, [folder]);

  // Entrance / exit of whole panel
  useGSAP(() => {
    if (!containerRef.current) return;

    if (isVisible && folder) {
      gsap.set(containerRef.current, { autoAlpha: 1, pointerEvents: 'all' });
      gsap.fromTo(
        [headerRef.current, containerRef.current.querySelector('.viewer-frame')],
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 }
      );
      gsap.fromTo(
        [navRef.current, captionRef.current],
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.4 }
      );
    } else {
      gsap.to(containerRef.current, {
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(containerRef.current, { pointerEvents: 'none' });
        },
      });
    }
  }, { scope: containerRef, dependencies: [isVisible, folder] });

  const transitionTo = (newIndex) => {
    if (isTransitioning.current || !folder) return;
    if (newIndex < 0 || newIndex >= folder.images.length) return;
    if (newIndex === currentIndex) return;
    isTransitioning.current = true;

    // direction: +1 → moving forward (slide left), -1 → moving back (slide right)
    const direction = newIndex > currentIndex ? 1 : -1;
    const activeEl = buffers.active === 'a' ? imageARef.current : imageBRef.current;
    const nextEl = buffers.active === 'a' ? imageBRef.current : imageARef.current;
    const nextActive = buffers.active === 'a' ? 'b' : 'a';
    const nextSrc = folder.images[newIndex];

    // Preload then slide
    const img = new Image();
    img.src = nextSrc;
    img.onload = () => {
      nextEl.src = nextSrc;
      // Position the incoming layer just off the frame on the appropriate side
      gsap.set(nextEl, { autoAlpha: 1, xPercent: direction * 100 });
      gsap.set(activeEl, { autoAlpha: 1, xPercent: 0 });

      setBuffers({ active: nextActive, src: nextSrc });

      const tl = gsap.timeline({
        onComplete: () => {
          isTransitioning.current = false;
          setCurrentIndex(newIndex);
        },
      });

      tl.to(activeEl, {
        xPercent: -direction * 100,
        duration: 0.65,
        ease: 'power3.inOut',
      }, 0);
      tl.to(nextEl, {
        xPercent: 0,
        duration: 0.65,
        ease: 'power3.inOut',
      }, 0);
    };
    img.onerror = () => {
      isTransitioning.current = false;
    };
  };

  const handleNext = () => transitionTo(currentIndex + 1);
  const handlePrev = () => transitionTo(currentIndex - 1);

  const handleBack = () => {
    gsap.to(containerRef.current, {
      autoAlpha: 0,
      scale: 0.97,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: onBack,
    });
  };

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (!isVisible) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!folder) return null;

  const total = folder.images.length;
  const padded = String(currentIndex + 1).padStart(2, '0');
  const paddedTotal = String(total).padStart(2, '0');

  return (
    <div className="folder-viewer" ref={containerRef}>
      <div className="viewer-header" ref={headerRef}>
        <button className="back-btn" onClick={handleBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
        <span className="viewer-folder-label">Object {folder.label}</span>
        <span className="viewer-counter">{padded} / {paddedTotal}</span>
      </div>

      {/* Stage row: arrow · image · arrow — arrows sit just outside the
          image, not at the viewport edge, and never overlap the photo */}
      <div className="viewer-stage">
        <button
          className="nav-arrow nav-arrow--prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path d="M20 8L12 16l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="viewer-frame">
          <div className="viewer-glow" />

          {/* Double-buffer images that slide horizontally on navigate */}
          <img
            ref={imageARef}
            src={buffers.active === 'a' ? buffers.src : folder.images[currentIndex]}
            alt={`Object ${folder.label} image`}
            className="viewer-image layer-a"
            draggable={false}
          />
          <img
            ref={imageBRef}
            src={buffers.active === 'b' ? buffers.src : folder.images[currentIndex]}
            alt={`Object ${folder.label} image`}
            className="viewer-image layer-b"
            draggable={false}
          />
        </div>

        <button
          className="nav-arrow nav-arrow--next"
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          aria-label="Next"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <path d="M12 8l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="viewer-bottom" ref={navRef}>
        <div className="dot-nav" ref={captionRef}>
          {folder.images.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === currentIndex ? 'dot--active' : ''}`}
              onClick={() => transitionTo(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
        <div className="viewer-hint">← → arrow keys to navigate · Esc to go back</div>
      </div>
    </div>
  );
}
