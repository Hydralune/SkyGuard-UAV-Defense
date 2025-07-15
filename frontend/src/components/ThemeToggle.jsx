import { useTheme } from "./theme-provider";

export default function ThemeToggle({ variant }) {
  const { theme, setTheme } = useTheme();

  // 切换主题
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 侧边栏样式
  if (variant === "sidebar") {
    return (
      <button
        onClick={toggleTheme}
        className="w-full py-2 px-4 rounded border border-primary/60 dark:border-primary bg-background text-foreground hover:bg-muted transition-colors"
        aria-label="切换主题"
      >
        {theme === "dark" ? "切换为浅色 ☀" : "切换为深色 🌙"}
      </button>
    );
  }

  // 默认样式（如有其他地方用到）
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="切换主题"
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}
