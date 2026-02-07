import { useEffect, useState } from "react";
import Intro from "./pages/Intro";

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Intro
      theme={theme}
      onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
    />
  );
}

export default App;
