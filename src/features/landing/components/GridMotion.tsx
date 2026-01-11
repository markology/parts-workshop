import { useEffect, useRef, FC, ReactNode } from "react";
import { gsap } from "gsap";
import Image from "next/image";

interface GridMotionProps {
  items?: (string | ReactNode)[];
  gradientColor?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "black",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollYRef = useRef<number>(0);

  const totalItems = 28;
  const defaultItems = Array.from(
    { length: totalItems },
    (_, index) => `Item ${index + 1}`
  );
  const combinedItems =
    items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    const handleScroll = (): void => {
      scrollYRef.current = window.scrollY;
    };

    const updateMotion = (): void => {
      const maxMoveAmount = 300;
      const baseDuration = 0.8;
      const inertiaFactors = [0.6, 0.4, 0.3, 0.2];
      // Calculate scroll progress (0 to 1) based on viewport height
      // Adjust the divisor to control sensitivity (larger = less sensitive)
      const scrollProgress = Math.min(
        scrollYRef.current / (window.innerHeight * 2),
        1
      );

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          // Map scroll progress (0-1) to movement amount (-maxMoveAmount/2 to maxMoveAmount/2)
          const moveAmount =
            (scrollProgress * maxMoveAmount - maxMoveAmount / 2) * direction;

          gsap.to(row, {
            x: moveAmount,
            duration:
              baseDuration + inertiaFactors[index % inertiaFactors.length],
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    };

    const removeAnimationLoop = gsap.ticker.add(updateMotion);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial call to set initial position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      removeAnimationLoop();
    };
  }, []);

  return (
    <div ref={gridRef} className="h-full w-full overflow-hidden">
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-[4] bg-[length:250px]"></div>
        <div className="gap-4 flex-none relative w-[2000px] h-[1140px] grid grid-rows-4 grid-cols-1 rotate-[-15deg] origin-center z-[2]">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 grid-cols-7"
              style={{ willChange: "transform, filter" }}
              ref={(el) => {
                if (el) rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                const isImageUrl =
                  typeof content === "string" && content.startsWith("http");
                const isLocalImage =
                  typeof content === "string" &&
                  (content.startsWith("/parts/") ||
                    content.startsWith("parts/") ||
                    content.includes(".png") ||
                    content.includes(".jpg") ||
                    content.includes(".jpeg"));
                const imagePath = isLocalImage
                  ? content.startsWith("/")
                    ? content
                    : `/${content}`
                  : null;

                return (
                  <div key={itemIndex} className="relative aspect-square">
                    <div className="relative w-full h-full overflow-hidden rounded-[10px] bg-[#111] flex items-center justify-center text-white text-[1.5rem]">
                      {isImageUrl ? (
                        <div
                          className="w-full h-full bg-cover bg-center absolute top-0 left-0"
                          style={{ backgroundImage: `url(${content})` }}
                        ></div>
                      ) : isLocalImage && imagePath ? (
                        <Image
                          src={imagePath}
                          alt="Part"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="p-4 text-center z-[1]">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="relative w-full h-full top-0 left-0 pointer-events-none"></div>
      </section>
    </div>
  );
};

export default GridMotion;
