import { useRef, type PointerEvent } from "react";

const SLIDES = [
  {
    eyebrow: "Welcome to Unggun",
    title: "A room for right now",
    body: "Light a private room for your people, add a spark, and let everyone pile in while it glows.",
    visual: "room",
  },
  {
    eyebrow: "Keep or fade",
    title: "Your circle decides",
    body: "Near the end, everyone votes. A majority keeps the room glowing for another 24 hours.",
    visual: "vote",
  },
  {
    eyebrow: "Bara",
    title: "Only the embers remain",
    body: "When chat fades, its warmest highlights become a private keepsake. Then the next room starts fresh.",
    visual: "bara",
  },
] as const;

function SlideVisual({ type }: { type: (typeof SLIDES)[number]["visual"] }) {
  if (type === "room") {
    return (
      <div className="intro-scene room-scene" aria-hidden="true">
        <span className="intro-person person-one">🌸</span>
        <span className="intro-person person-two">🎧</span>
        <span className="intro-person person-three">🐱</span>
        <div className="intro-fire"><span>🔥</span><i /></div>
        <div className="intro-spark">who’s still awake?</div>
      </div>
    );
  }

  if (type === "vote") {
    return (
      <div className="intro-scene vote-scene" aria-hidden="true">
        <div className="intro-timer">01:07 <small>left</small></div>
        <div className="intro-vote-row">
          <span>🌸</span><span>🎧</span><span>🐱</span><span className="waiting">?</span>
        </div>
        <div className="intro-vote-track"><i /></div>
        <div className="intro-vote-choice"><b>🔥 Keep</b><span>🌙 Fade</span></div>
      </div>
    );
  }

  return (
    <div className="intro-scene bara-scene" aria-hidden="true">
      <div className="intro-ember">🟠</div>
      <div className="intro-highlight highlight-one"><b>🌸 Dinda</b><span>that laugh at 2am</span></div>
      <div className="intro-highlight highlight-two"><b>🎧 Raka</b><span>one last warm message</span></div>
      <div className="intro-ash">· · ·</div>
    </div>
  );
}

export function OnboardingIntro({
  index,
  onIndexChange,
  onComplete,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  onComplete: () => void;
}) {
  const pointerStart = useRef<number | null>(null);

  const goTo = (next: number) => onIndexChange(Math.max(0, Math.min(SLIDES.length - 1, next)));
  const next = () => {
    if (index === SLIDES.length - 1) onComplete();
    else goTo(index + 1);
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (distance <= -48) next();
    else if (distance >= 48) goTo(index - 1);
  };

  return (
    <div
      className="intro"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") next();
        if (event.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <button className="intro-skip" type="button" onClick={onComplete}>Skip intro</button>

      <div
        className="intro-viewport"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={finishSwipe}
        onPointerCancel={(event) => {
          pointerStart.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        <div className="intro-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map((slide, slideIndex) => (
            <section
              className="intro-slide"
              key={slide.title}
              aria-hidden={slideIndex !== index}
            >
              <SlideVisual type={slide.visual} />
              <div className="intro-copy" aria-live={slideIndex === index ? "polite" : undefined}>
                <span className="eyebrow">{slide.eyebrow}</span>
                <h1 id={slideIndex === index ? "profile-title" : undefined}>{slide.title}</h1>
                <p>{slide.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="intro-footer">
        <div className="intro-dots" aria-label="Introduction pages">
          {SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              className={slideIndex === index ? "active" : ""}
              aria-label={`Go to page ${slideIndex + 1}`}
              aria-current={slideIndex === index ? "step" : undefined}
              onClick={() => goTo(slideIndex)}
            />
          ))}
        </div>
        <div className={"intro-actions" + (index === 0 ? " first" : "")}>
          <button
            type="button"
            className="intro-back"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Back
          </button>
          <button type="button" className="btn-primary" onClick={next}>
            {index === SLIDES.length - 1 ? "Set up profile" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}