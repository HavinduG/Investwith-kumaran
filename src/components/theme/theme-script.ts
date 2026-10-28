export type Theme = "dark" | "light"

export const THEME_STORAGE_KEY = "theme"
export const DEFAULT_THEME: Theme = "dark"

/** Runs before first paint: applies the saved theme and flags that JS is on. */
export const themeScript = `(function(){try{var d=document.documentElement;d.classList.add("js");var t=localStorage.getItem("${THEME_STORAGE_KEY}")==="light"?"light":"dark";d.classList.toggle("dark",t==="dark");d.classList.toggle("light",t==="light");d.style.colorScheme=t}catch(e){}})()`
