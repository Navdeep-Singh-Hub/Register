import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  IconBrain,
  IconFlask,
  IconMicrobe,
  IconMoon,
  IconStethoscope,
  IconUtensils,
} from "./Icons";

const outerNodes = [
  { Icon: IconUtensils, angle: 0 },
  { Icon: IconMoon, angle: 90 },
  { Icon: IconMicrobe, angle: 180 },
  { Icon: IconFlask, angle: 270 },
];

const innerNodes = [
  { Icon: IconStethoscope, angle: 30 },
  { Icon: IconBrain, angle: 210 },
];

export function HeroOrbitScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 70, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 70, damping: 18 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 22);
    rotateX.set(py * -22);
  }

  function handlePointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      className="orbit-scene"
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden
    >
      <div className="orbit-particle p1" />
      <div className="orbit-particle p2" />
      <div className="orbit-particle p3" />
      <motion.div
        className="orbit-stage"
        style={{ rotateX: springX, rotateY: springY }}
      >
        <div className="orbit-glow" />
        <div className="orbit-core">
          <span>Your
            <br />
            Child
          </span>
        </div>

        <div className="orbit-ring ring-outer">
          <div className="ring-spin">
            {outerNodes.map(({ Icon, angle }) => (
              <div
                className="orbit-node"
                key={angle}
                style={{ transform: `rotate(${angle}deg) translateX(9.5rem)` }}
              >
                <div className="badge">
                  <Icon />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orbit-ring ring-inner">
          <div className="ring-spin">
            {innerNodes.map(({ Icon, angle }) => (
              <div
                className="orbit-node"
                key={angle}
                style={{ transform: `rotate(${angle}deg) translateX(5.75rem)` }}
              >
                <div className="badge">
                  <Icon />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
