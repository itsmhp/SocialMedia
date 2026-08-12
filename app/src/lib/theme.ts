export type ThemePreference = "system" | "light" | "dark";

let activePreference: ThemePreference = "system";
let systemTheme: MediaQueryList | null = null;

function syncTheme() {
  const theme = activePreference === "system"
    ? systemTheme?.matches ? "dark" : "light"
    : activePreference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "dark" ? "#101410" : "#f4f6f2";
}

export function applyThemePreference(preference: ThemePreference): void {
  activePreference = preference;
  if (!systemTheme) {
    systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    systemTheme.addEventListener("change", syncTheme);
  }
  syncTheme();
}