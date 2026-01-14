import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

type Img = { src: string; alt?: string };

export function InfiniteCarouselCSS({
  images,
  speed = 60, // px/sec
  gap = 16,
  height = 160,
  direction = "left",
  pauseOnHover = true,
  radius = 12,
}: {
  images: Img[];
  speed?: number;
  gap?: number;
  height?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  radius?: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(20);

  const items = useMemo(() => [...images, ...images], [images]);

  // Measure the full track width AFTER images load, then set duration = distance / speed
  useLayoutEffect(() => {
    let cancelled = false;

    const calc = async () => {
      if (!trackRef.current) return;

      const imgs = Array.from(trackRef.current.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((res) => {
              if ((img as HTMLImageElement).complete) return res();
              img.addEventListener("load", () => res(), { once: true });
              img.addEventListener("error", () => res(), { once: true });
            })
        )
      );

      if (cancelled || !trackRef.current) return;

      // track is 2x content; half distance is exactly 50% of scrollWidth
      const full = trackRef.current.scrollWidth;
      const half = full / 2;

      // duration seconds = distance(px) / speed(px/sec)
      setDuration(Math.max(1, half / speed));
    };

    calc();

    const ro = new ResizeObserver(() => calc());
    if (trackRef.current) ro.observe(trackRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [items, speed]);

  const dirSign = direction === "left" ? 1 : -1;

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap,
          alignItems: "center",
          width: "max-content",
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: dirSign === 1 ? "normal" : "reverse",
        }}
        className={pauseOnHover ? "marquee-hover-pause" : undefined}
      >
        {items.map((img, i) => (
          <img
            key={`${img.src}-${i}`}
            src={img.src}
            alt={img.alt ?? ""}
            draggable={false}
            style={{
              height,
              width: "auto",
              borderRadius: radius,
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
              boxShadow:
                "inset 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 0 8px 2px rgba(255, 255, 255, 0.6)",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
        .marquee-hover-pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
