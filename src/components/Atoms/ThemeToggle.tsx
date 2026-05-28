import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      localStorage.setItem("mesa_theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("mesa_theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex items-center gap-3 px-3 py-2.5 rounded w-full text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-medium transition-all"
    >
      {dark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
      <span className="text-sm">{dark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}
