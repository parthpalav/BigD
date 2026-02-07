import { useEffect, useState } from "react";
import Globe from "../three/Globe";

export default function Intro() {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="flex items-center text-white font-bold tracking-widest text-8xl">

        {/* O */}
        <span
          className={`transition-all duration-1000 ease-out ${
            showText ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          O
        </span>

        {/* R */}
        <span
          className={`transition-all duration-1000 ease-out delay-100 ${
            showText ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          R
        </span>

        {/* I */}
        <span
          className={`transition-all duration-1000 ease-out delay-200 ${
            showText ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          I
        </span>

        {/* Globe O */}
        <div>
          <Globe />
        </div>

        {/* N */}
        <span
          className={`transition-all duration-1000 ease-out delay-300 ${
            showText ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          N
        </span>

      </div>
    </div>
  );
}
