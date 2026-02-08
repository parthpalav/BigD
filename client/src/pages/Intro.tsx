import { useEffect, useState } from "react";
import Globe from "../three/Globe";
import HamburgerMenu from "../components/HamburgerMenu";

type IntroProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export default function Intro({ theme, onToggleTheme }: IntroProps) {
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
    <div
      className="h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Hamburger Menu */}
      <HamburgerMenu />

      {showNav && (
        <nav
          className="fixed top-0 left-1/2 z-50 -translate-x-1/2 px-12 py-8 backdrop-blur-md"
          style={{
            backgroundColor: "var(--nav)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <ul className="flex items-center gap-12 text-3xl font-bold">
            <li>
              <a className="bg-transparent transition-transform duration-250 hover:scale-180" href="">
                Home
              </a>
            </li>
            <li>
              <a className="bg-transparent transition-transform duration-250 hover:scale-180" href="">
                Maps
              </a>
            </li>
            <li>
              <a className="bg-transparent transition-transform duration-250 hover:scale-180" href="">
                About us
              </a>
            </li>
          </ul>
        </nav>
      )}

      <div className="fixed top-0 right-0 z-50 flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="h-8 w-8 rounded-full border transition-transform duration-200 hover:scale-110"
          style={{
            backgroundColor: theme === "dark" ? "#ffffff" : "#000000",
            borderColor: "var(--border)",
          }}
        />
        <button
          className="px-6 py-3 text-lg font-bold transition-transform duration-200 hover:scale-110"
          style={{
            color: "var(--text)",
            backgroundColor: "var(--button)",
          }}
        >
          Login
        </button>
      </div>

      <div className="flex items-center font-bold tracking-widest text-8xl">
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
