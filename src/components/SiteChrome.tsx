"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navigation = [
  { href: "/", icon: "⛩", label: "神社" },
  { href: "/map", icon: "地図", label: "地図" },
  { href: "/fortune", icon: "みくじ", label: "おみくじ" },
  { href: "/collection", icon: "朱印", label: "御朱印帳" },
  { href: "/visits", icon: "参", label: "参拝者" },
];

function isDaytime(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18;
}

function resolveThemeForHour(daytime: boolean): boolean {
  if (daytime) return false;
  const stored = window.localStorage.getItem("jinja-goen:theme");
  return stored ? stored === "dark" : true;
}

function LanternToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.theme === "dark";
  });
  const [daytime, setDaytime] = useState(() => {
    if (typeof Date === "undefined") return false;
    return isDaytime();
  });

  useEffect(() => {
    const apply = () => {
      const nowDaytime = isDaytime();
      setDaytime(nowDaytime);
      const dark = resolveThemeForHour(nowDaytime);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      setIsDark(dark);
    };

    apply();
    const interval = window.setInterval(apply, 60 * 1000);
    window.addEventListener("focus", apply);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", apply);
    };
  }, []);

  function toggleTheme() {
    if (daytime) return;
    const next = !isDark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("jinja-goen:theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      className={`lantern-toggle${daytime ? " lantern-toggle--daytime" : ""}`}
      type="button"
      aria-label={daytime ? "昼間はライトモードです" : isDark ? "灯籠を消してライトモードにする" : "灯籠をともしてダークモードにする"}
      aria-pressed={isDark}
      aria-disabled={daytime}
      onClick={toggleTheme}
      title={daytime ? "6:00〜17:59はライトモード固定です" : undefined}
    >
      <span aria-hidden="true">{daytime ? "☀" : isDark ? "☀" : "灯"}</span>
      <small>{daytime ? "昼間はライト" : isDark ? "月明かり" : "灯籠"}</small>
    </button>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin") || pathname === "/offline";

  return (
    <>
      {children}
      {!hidden && (
        <>
          <LanternToggle />
          <nav className="bottom-nav" aria-label="主なページ">
            {navigation.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                  <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
