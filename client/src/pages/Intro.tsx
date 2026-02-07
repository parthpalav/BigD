import { useEffect, useState } from "react";
import Globe from "../three/Globe";

export default function Intro() {
  const [showText, setShowText] = useState(false);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY === 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="h-screen bg-black flex items-center justify-center overflow-hidden">
      {showNav && (
        <nav
          className="fixed top-0 left-1/2 z-50 -translate-x-1/2 bg-gray-700/30 px-8 py-4 backdrop-blur-md"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
        >
          <ul className="flex items-center gap-12 text-2xl font-bold text-white">
            <li>
              <a className="bg-transparent" href="">
                Home
              </a>
            </li>
            <li>
              <a className="bg-transparent" href="">
                Maps
              </a>
            </li>
            <li>
              <a className="bg-transparent" href="">
                About us
              </a>
            </li>
          </ul>
        </nav>
      )}

      <button
        className="fixed top-0 right-0 z-50 px-6 py-3 text-white bg-black/10 text-lg font-bold transition-transform duration-200 hover:scale-110 hover:bg-black/20 hover:backdrop-blur-md"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" }}
      >
        Login
      </button>

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
