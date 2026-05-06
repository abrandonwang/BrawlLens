"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AssistantPopup from "./AssistantPopup";
import { authHeaders, clearAuthSession, clearServerSession } from "@/lib/clientAuth";
import type { PremiumUser } from "@/lib/premium";
import { useEmailCheck } from "@/lib/useEmailCheck";

type NavPanelItem = {
  label: string;
  href?: string;
  description: string;
  action?: "assistant";
  disabled?: boolean;
  badge?: string;
  wide?: boolean;
};

const browseItems: NavPanelItem[] = [
  { label: "Brawlers", href: "/brawlers", description: "Stats and abilities" },
  { label: "Maps", href: "/meta", description: "Modes and matchups" },
  { label: "Player Leaderboard", href: "/leaderboards/players", description: "Top player trophies" },
  { label: "Club Leaderboard", href: "/leaderboards/clubs", description: "Top club trophies" },
  { label: "Brawler Leaderboard", href: "/leaderboards/brawlers", description: "Brawler trophy ranks" },
  { label: "Ask AI", description: "Ask data questions", action: "assistant" },
  { label: "Guide", description: "Coming soon", disabled: true, badge: "Coming soon", wide: true },
];

const aboutItems: NavPanelItem[] = [
  { label: "Overview", href: "/about", description: "Project and data philosophy" },
  { label: "What It Tracks", href: "/about#what-it-tracks", description: "Surfaces and tools" },
  { label: "Data Sources", href: "/about#data-sources", description: "Where numbers come from" },
  { label: "Calculations", href: "/calculations", description: "Formulas and sample rules" },
  { label: "Metric Notes", href: "/about#metric-notes", description: "How to read metrics" },
  { label: "Search Help", href: "/about#search-help", description: "Commands and keyboard flow" },
  { label: "Data Status", href: "/about#data-status", description: "Refresh and empty states" },
  { label: "Contact", href: "/contact", description: "Bugs and requests" },
  { label: "Privacy", href: "/privacy", description: "Account data notes" },
];

const rootMenuLinks = [
  { label: "Lensboard", href: "/", description: "Custom data workspace" },
];

type MenuPanel = "root" | "browse" | "about";
type DesktopPanel = "browse" | "about";
type LoginState = "idle" | "sending" | "sent" | "error";

function passwordRules(password: string) {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Contains a number", passed: /\d/.test(password) },
  ];
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function isDesktopItemActive(pathname: string, activeHash: string, href: string) {
  const [path, rawHash] = href.split("#");
  if (path === "/about" && pathname === "/about") {
    if (rawHash) return activeHash === `#${rawHash}`;
    return activeHash === "" || activeHash === "#introduction";
  }
  if (rawHash) return false;
  return isRouteActive(pathname, href);
}

function LogoMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const outer = size === "lg" ? "size-[38px] rounded-[12px]" : "size-[18px] rounded-[5px]";
  const inner = size === "lg" ? "after:inset-[8px] after:rounded-[5px]" : "after:inset-[4px] after:rounded-[2.5px]";
  return (
    <span className={`relative inline-block ${outer} bg-[conic-gradient(from_var(--logo-angle),#f97316,#ec4899,#8b5cf6,#3b82f6,#14b8d6,#f97316)] animate-[logo-spin_8s_linear_infinite] after:absolute ${inner} after:bg-[#fcfbf8] after:content-['']`} />
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pendingAssistantQuery, setPendingAssistantQuery] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuPanel, setMenuPanel] = useState<MenuPanel>("root");
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel | null>(null);
  const [hoverDesktopPanel, setHoverDesktopPanel] = useState<DesktopPanel | null>(null);
  const [suppressedDesktopPanel, setSuppressedDesktopPanel] = useState<DesktopPanel | null>(null);
  const [lastDesktopPanel, setLastDesktopPanel] = useState<DesktopPanel>("browse");
  const [activeHash, setActiveHash] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginResending, setLoginResending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const previousPathnameRef = useRef(pathname);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const desktopHoverTimerRef = useRef<number | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => {
    if (!isMenuOpen) return;
    setMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setMenuClosing(false);
      setMenuPanel("root");
    }, 260);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen || menuClosing || isLoginOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, menuClosing, isLoginOpen]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      closeMenu();
      setDesktopPanel(null);
      setHoverDesktopPanel(null);
      setSuppressedDesktopPanel(null);
    }
  }, [pathname, closeMenu]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        setDesktopPanel(null);
        setHoverDesktopPanel(null);
        setSuppressedDesktopPanel(null);
        setIsLoginOpen(false);
        setIsAccountMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  useEffect(() => {
    return () => {
      if (desktopHoverTimerRef.current !== null) {
        window.clearTimeout(desktopHoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoginOpen) return;
    setLoginState("idle");
    setLoginResending(false);
    setLoginError(null);
    setLoginPassword("");
  }, [isLoginOpen]);

  useEffect(() => {
    if (!isLoginOpen) return;
    window.setTimeout(() => loginInputRef.current?.focus(), 80);
  }, [isLoginOpen]);

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/about") return;

    const ids = ["introduction", ...aboutItems.flatMap(item => {
      const hash = item.href?.split("#")[1];
      return hash ? [hash] : [];
    })];
    const elements = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const target = visible[0]?.target;
        if (!target) return;
        setActiveHash(target.id === "introduction" ? "" : `#${target.id}`);
      },
      { rootMargin: "-88px 0px -64% 0px", threshold: 0 },
    );

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!desktopPanel) return;

    function onPointerDown(event: PointerEvent) {
      if (!desktopNavRef.current?.contains(event.target as Node)) {
        setDesktopPanel(null);
        setHoverDesktopPanel(null);
        setSuppressedDesktopPanel(null);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [desktopPanel]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isAccountMenuOpen]);

  useEffect(() => {
    function onOpenAssistant(e: Event) {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      setIsAssistantOpen(true);
      if (detail?.query) setPendingAssistantQuery(detail.query);
    }
    window.addEventListener("brawllens:open-assistant", onOpenAssistant);
    return () => window.removeEventListener("brawllens:open-assistant", onOpenAssistant);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccountState() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: authHeaders(),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null) as { user?: PremiumUser | null } | null;
        if (active) {
          setIsSignedIn(response.ok);
          const user = payload?.user;
          const localSetup = localAccountSetup();
          setAccountName(
            user?.accountSetup?.playerName
              ?? user?.displayName
              ?? localSetup?.playerName
              ?? (user?.accountSetup?.playerTag ? `#${user.accountSetup.playerTag}` : null)
              ?? (localSetup?.playerTag ? `#${localSetup.playerTag}` : null),
          );
        }
      } catch {
        if (active) {
          setIsSignedIn(false);
          setAccountName(null);
        }
      }
    }

    loadAccountState();
    return () => {
      active = false;
    };
  }, [pathname]);

  function localAccountSetup() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("brawllens_setup") ?? "null") as { playerName?: unknown; playerTag?: unknown } | null;
      if (!parsed || typeof parsed !== "object") return null;
      return {
        playerName: typeof parsed.playerName === "string" && parsed.playerName.trim() ? parsed.playerName.trim() : null,
        playerTag: typeof parsed.playerTag === "string" && parsed.playerTag.trim() ? parsed.playerTag.trim() : null,
      };
    } catch {
      return null;
    }
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
      return;
    }
    setMenuPanel("root");
    setIsAccountMenuOpen(false);
    setIsMenuOpen(true);
  }

  function openLogin() {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
    setIsAccountMenuOpen(false);
    setIsLoginOpen(true);
  }

  function clearDesktopHoverTimer() {
    if (desktopHoverTimerRef.current !== null) {
      window.clearTimeout(desktopHoverTimerRef.current);
      desktopHoverTimerRef.current = null;
    }
  }

  function openHoverDesktopPanel(panel: DesktopPanel) {
    if (suppressedDesktopPanel === panel) return;
    clearDesktopHoverTimer();
    setHoverDesktopPanel(panel);
  }

  function scheduleHoverDesktopClose(panel: DesktopPanel) {
    clearDesktopHoverTimer();
    desktopHoverTimerRef.current = window.setTimeout(() => {
      setHoverDesktopPanel(current => current === panel ? null : current);
      desktopHoverTimerRef.current = null;
    }, 560);
  }

  function toggleDesktopPanel(panel: DesktopPanel) {
    clearDesktopHoverTimer();

    if (desktopPanel === panel) {
      setDesktopPanel(null);
      setHoverDesktopPanel(null);
      setSuppressedDesktopPanel(panel);
      return;
    }

    setDesktopPanel(panel);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
  }

  function clearSuppressedDesktopPanel(panel: DesktopPanel) {
    setSuppressedDesktopPanel(current => current === panel ? null : current);
  }

  function isValidAccountPassword(password: string) {
    return passwordRules(password).every(rule => rule.passed);
  }

  async function sendSetupEmail(options?: { resend?: boolean }) {
    if (!loginEmailCheck.isValid) {
      setLoginState("error");
      setLoginError(loginEmailCheck.message);
      return;
    }
    if (!isValidAccountPassword(loginPassword)) {
      setLoginState("error");
      setLoginError("Password needs at least 8 characters and one number.");
      return;
    }

    if (options?.resend) {
      setLoginResending(true);
    } else {
      setLoginState("sending");
    }
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        setLoginState("error");
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setLoginError(payload?.error === "weak_password"
          ? "Password needs at least 8 characters and one number."
          : payload?.error === "disposable_domain"
            ? "Use a permanent email address."
          : payload?.error === "invalid_email"
            ? "Enter a valid email address."
          : payload?.error === "email_unreachable"
            ? "Use a real email address with an active mail server."
          : payload?.error === "custom_email_not_configured"
            ? "BrawlLens email is not configured yet."
          : payload?.error === "setup_link_generation_failed"
            ? "Supabase could not generate the setup link."
          : payload?.error === "magic_link_email_failed"
            ? "Resend could not send from that email address."
          : "Account setup is not available right now.");
        return;
      }

      setLoginState("sent");
    } catch {
      setLoginState("error");
      setLoginError("Account setup is not available right now.");
    } finally {
      setLoginResending(false);
    }
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendSetupEmail();
  }

  function openAssistantFromNav() {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
    setIsAssistantOpen(true);
  }

  function signOut() {
    setIsAccountMenuOpen(false);
    setIsSignedIn(false);
    setAccountName(null);
    clearAuthSession();
    clearServerSession().finally(() => router.replace("/login"));
  }

  const accountLabel = isSignedIn ? accountName ?? "Account" : "Get started";
  const browseActive = browseItems.some(item => item.href && isDesktopItemActive(pathname, activeHash, item.href));
  const aboutActive = aboutItems.some(item => item.href && isDesktopItemActive(pathname, activeHash, item.href));
  const loginEmailCheck = useEmailCheck(loginEmail, isLoginOpen);
  const loginPasswordRules = passwordRules(loginPassword);
  const loginPasswordValid = loginPasswordRules.every(rule => rule.passed);
  const canSubmitLogin = loginEmailCheck.isValid && loginPasswordValid && loginState !== "sending";
  const menuVisible = isMenuOpen || menuClosing;
  const visibleDesktopPanel = desktopPanel ?? hoverDesktopPanel;
  const renderedDesktopPanel = visibleDesktopPanel ?? lastDesktopPanel;
  const desktopPanelIndex = renderedDesktopPanel === "about" ? 1 : 0;
  const mobileItemStyle = (index: number) => ({
    animationDelay: menuClosing ? "0ms" : `${30 + index * 42}ms`,
  });
  const navTextClass = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-lg border-0 bg-transparent px-3 text-[14px] leading-none text-[var(--ink)] no-underline transition-opacity duration-200 ${active ? "opacity-100 hover:opacity-90" : "opacity-100 hover:opacity-[0.88]"}`;

  useEffect(() => {
    if (visibleDesktopPanel) setLastDesktopPanel(visibleDesktopPanel);
  }, [visibleDesktopPanel]);

  return (
    <>
      <nav className="fixed top-0 left-0 z-[100] grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-[18px] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-[max(16px,calc((100vw-1200px)/2))] backdrop-blur-[18px] backdrop-saturate-[145%] max-lg:pr-1.5 max-lg:pl-4 max-[430px]:gap-2 max-[430px]:pl-3">
        <Link href="/" className="inline-flex items-center gap-1.5 whitespace-nowrap text-[18px] font-semibold leading-none text-[var(--ink)] no-underline" aria-label="BrawlLens home">
          <LogoMark />
          <span className="nav-wordmark max-[380px]:sr-only">BrawlLens</span>
        </Link>

        <div ref={desktopNavRef} className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
          <Link href="/" className={navTextClass(isRouteActive(pathname, "/"))}>
            Lensboard
          </Link>
          <div
            className="nav-popover relative"
            data-open={visibleDesktopPanel === "browse" ? "true" : undefined}
            data-suppressed={suppressedDesktopPanel === "browse" ? "true" : undefined}
            onMouseEnter={() => openHoverDesktopPanel("browse")}
            onMouseLeave={() => {
              clearSuppressedDesktopPanel("browse");
              scheduleHoverDesktopClose("browse");
            }}
          >
            <button
              type="button"
              onClick={() => toggleDesktopPanel("browse")}
              className={`${navTextClass(browseActive)} cursor-pointer gap-1.5`}
              aria-haspopup="true"
              aria-expanded={desktopPanel === "browse"}
            >
              Browse
              <ChevronRight size={14} strokeWidth={1.9} className="nav-trigger-arrow transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          </div>
          <div
            className="nav-popover relative"
            data-open={visibleDesktopPanel === "about" ? "true" : undefined}
            data-suppressed={suppressedDesktopPanel === "about" ? "true" : undefined}
            onMouseEnter={() => openHoverDesktopPanel("about")}
            onMouseLeave={() => {
              clearSuppressedDesktopPanel("about");
              scheduleHoverDesktopClose("about");
            }}
          >
            <button
              type="button"
              onClick={() => toggleDesktopPanel("about")}
              className={`${navTextClass(aboutActive)} cursor-pointer gap-1.5`}
              aria-haspopup="true"
              aria-expanded={desktopPanel === "about"}
            >
              About
              <ChevronRight size={14} strokeWidth={1.9} className="nav-trigger-arrow transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          </div>
          <div
            className="nav-browse-panel fixed top-[58px] left-1/2 w-[460px]"
            data-open={visibleDesktopPanel ? "true" : undefined}
            onMouseEnter={clearDesktopHoverTimer}
            onMouseLeave={() => {
              if (visibleDesktopPanel) scheduleHoverDesktopClose(visibleDesktopPanel);
            }}
          >
            <div className="h-[430px] overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--bg)] p-2 shadow-[0_24px_60px_-34px_rgba(28,28,28,0.45),rgba(255,255,255,0.45)_0_0.5px_0_0_inset]">
              <div
                className="nav-panel-track flex h-full w-[200%]"
                style={{ transform: `translateX(-${desktopPanelIndex * 50}%)` }}
              >
                <div className="h-full w-1/2 shrink-0 p-0">
                  <div className="px-3 pt-2.5 pb-2">
                    <p className="m-0 text-[12px] font-semibold text-[var(--ink)]">Browse</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    {browseItems.map(item => {
                      const active = visibleDesktopPanel === "browse" && item.href ? isRouteActive(pathname, item.href) : false;

                      if (item.action === "assistant") {
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={openAssistantFromNav}
                            className="flex min-h-[66px] cursor-pointer items-start justify-between gap-3 rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left font-[inherit] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--hover-bg)]"
                          >
                            <span className="min-w-0">
                              <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold leading-tight text-[var(--ink)]">
                                <span className="truncate">{item.label}</span>
                                <Image
                                  src="/ai-sparkle-512.png"
                                  alt=""
                                  width={14}
                                  height={14}
                                  className="size-3.5 shrink-0 object-contain"
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="mt-1 block text-[12px] leading-snug text-[var(--ink-3)]">{item.description}</span>
                            </span>
                          </button>
                        );
                      }

                      if (!item.href || item.disabled) {
                        return (
                          <div
                            key={item.label}
                            aria-disabled="true"
                            className={`flex min-h-[66px] items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[var(--ink-4)] opacity-75 ${item.wide ? "col-span-2" : ""}`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[14px] font-semibold leading-tight text-[var(--ink-3)]">{item.label}</span>
                              <span className="mt-1 block text-[12px] leading-snug text-[var(--ink-4)]">{item.description}</span>
                            </span>
                            {item.badge && (
                              <span className="mt-0.5 shrink-0 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-medium leading-4 text-[var(--ink-4)]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setDesktopPanel(null);
                            setHoverDesktopPanel(null);
                            setSuppressedDesktopPanel(null);
                          }}
                          className={`flex min-h-[66px] items-start gap-3 rounded-[10px] px-3 py-2.5 text-inherit no-underline transition-colors duration-200 ${active ? "bg-[var(--ink)] text-[#fcfbf8]" : "text-[var(--ink)] hover:bg-[var(--hover-bg)]"}`}
                        >
                          <span className="min-w-0">
                            <span className={`block truncate text-[14px] font-semibold leading-tight ${active ? "text-[#fcfbf8]" : "text-[var(--ink)]"}`}>{item.label}</span>
                            <span className={`mt-1 block text-[12px] leading-snug ${active ? "text-[#fcfbf8]/70" : "text-[var(--ink-3)]"}`}>{item.description}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="h-full w-1/2 shrink-0 p-0">
                  <div className="px-3 pt-2.5 pb-2">
                    <p className="m-0 text-[12px] font-semibold text-[var(--ink)]">About</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    {aboutItems.map(item => {
                      if (!item.href) return null;
                      const active = visibleDesktopPanel === "about" && isDesktopItemActive(pathname, activeHash, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setDesktopPanel(null);
                            setHoverDesktopPanel(null);
                            setSuppressedDesktopPanel(null);
                          }}
                          className={`flex min-h-[66px] min-w-0 items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-inherit no-underline transition-colors duration-200 ${active ? "bg-[var(--ink)] text-[#fcfbf8]" : "text-[var(--ink)] hover:bg-[var(--hover-bg)]"}`}
                        >
                          <span className="min-w-0">
                            <span className={`block truncate text-[14px] font-semibold leading-tight ${active ? "text-[#fcfbf8]" : "text-[var(--ink)]"}`}>{item.label}</span>
                            <span className={`mt-1 block text-[12px] leading-snug ${active ? "text-[#fcfbf8]/70" : "text-[var(--ink-3)]"}`}>{item.description}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAssistantOpen(o => !o)}
            className={`hidden size-[34px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 transition-[opacity,transform] duration-150 hover:opacity-80 active:scale-95 lg:grid ${isAssistantOpen ? "opacity-100" : "opacity-90"}`}
            aria-label="Ask AI assistant"
            aria-expanded={isAssistantOpen}
            title="Brawl AI"
          >
            <Image
              src="/ai-sparkle-512.png"
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
              aria-hidden="true"
            />
          </button>
          {isSignedIn ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(open => !open)}
                className="inline-flex h-[34px] max-w-[150px] cursor-pointer items-center whitespace-nowrap rounded-md border-0 bg-[var(--ink)] px-3 text-[13px] leading-none text-[#fcfbf8] shadow-[var(--shadow-lift)] transition-opacity duration-150 hover:opacity-85 max-[420px]:max-w-[128px] max-[420px]:px-2.5"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
              >
                <span className="min-w-0 truncate">{accountLabel}</span>
              </button>
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+9px)] z-[140] w-[230px] rounded-[14px] border border-[var(--line)] bg-[var(--bg)] p-2 text-[var(--ink)] shadow-[0_24px_60px_-34px_rgba(28,28,28,0.45)]"
                >
                  <div className="px-2.5 py-2">
                    <p className="m-0 truncate text-[13px] font-semibold text-[var(--ink)]">{accountLabel}</p>
                    <p className="mt-0.5 mb-0 text-[11px] text-[var(--ink-4)]">BrawlLens account</p>
                  </div>
                  <div className="my-1 h-px bg-[var(--line)]" />
                  {[
                    ["Profile", "/account?tab=profile"],
                    ["Settings", "/account?tab=settings"],
                    ["Appearance", "/account?tab=appearance"],
                  ].map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-[var(--ink-2)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-[var(--line)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="block w-full cursor-pointer rounded-[9px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex h-[34px] cursor-pointer items-center whitespace-nowrap rounded-md border-0 bg-[var(--ink)] px-3.5 text-[13px] leading-none text-[#fcfbf8] shadow-[var(--shadow-lift)] transition-opacity duration-150 hover:opacity-85 max-[420px]:px-3"
            >
              <span>{accountLabel}</span>
            </button>
          )}
          <button
            type="button"
            className="grid h-9 w-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[var(--ink-3)] hover:text-[var(--ink)] lg:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={19} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </nav>
      <div style={{ height: 64 }} />

      {menuVisible && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-[90] flex flex-col bg-[var(--bg)] px-4 pt-0 pb-5 text-[var(--ink)] lg:hidden"
          style={{
            animation: menuClosing
              ? "mobileMenuOut 0.34s cubic-bezier(0.4,0,1,1) forwards"
              : "mobileMenuIn 0.42s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          {menuPanel === "root" ? (
            <div className="mobile-menu-list flex flex-1 flex-col">
              <button
                type="button"
                onClick={() => setMenuPanel("browse")}
                className={`mobile-menu-item flex min-h-[48px] w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 text-left text-[18px] text-[var(--ink)] ${browseActive ? "font-semibold" : ""}`}
                style={mobileItemStyle(0)}
              >
                <span>Browse</span>
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
              {rootMenuLinks.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className={`mobile-menu-item flex min-h-[48px] items-center justify-between text-[18px] text-[var(--ink)] no-underline ${item.href && isRouteActive(pathname, item.href) ? "font-semibold" : ""}`}
                  style={mobileItemStyle(index + 1)}
                >
                  <span>{item.label}</span>
                  {item.href && isRouteActive(pathname, item.href) && <span className="text-[13px] font-normal text-[var(--ink-4)]">Current</span>}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setMenuPanel("about")}
                className={`mobile-menu-item flex min-h-[48px] w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 text-left text-[18px] text-[var(--ink)] ${aboutActive ? "font-semibold" : ""}`}
                style={mobileItemStyle(rootMenuLinks.length + 1)}
              >
                <span>About</span>
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <div className="mobile-menu-list flex flex-1 flex-col overflow-y-auto">
              <button
                type="button"
                onClick={() => setMenuPanel("root")}
                className="mobile-menu-item mb-5 inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-none border border-[var(--line-2)] bg-transparent px-3 text-[16px] text-[var(--ink)]"
                style={mobileItemStyle(0)}
              >
                <ChevronLeft size={18} strokeWidth={1.8} />
                Back
              </button>

              <p className="mobile-menu-item m-0 mb-4 text-[14px] text-[var(--ink-3)]" style={mobileItemStyle(1)}>{menuPanel === "browse" ? "Browse" : "About"}</p>
              {(menuPanel === "browse" ? browseItems : aboutItems).map((item, index) => {
                if (item.action === "assistant") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={openAssistantFromNav}
                      className="mobile-menu-item mb-6 block cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-[var(--ink)]"
                      style={mobileItemStyle(index + 2)}
                    >
                      <span className="inline-flex items-center gap-2 text-[18px] font-semibold leading-tight text-[var(--ink)]">
                        <span>{item.label}</span>
                        <Image
                          src="/ai-sparkle-512.png"
                          alt=""
                          width={15}
                          height={15}
                          className="size-[15px] shrink-0 object-contain"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1 block text-[14px] leading-snug text-[var(--ink-3)]">{item.description}</span>
                    </button>
                  );
                }

                if (!item.href || item.disabled) {
                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="mobile-menu-item mb-6 block text-[var(--ink-4)] opacity-75"
                      style={mobileItemStyle(index + 2)}
                    >
                      <span className="flex items-center justify-between gap-3 text-[18px] font-semibold leading-tight text-[var(--ink-3)]">
                        <span>{item.label}</span>
                        {item.badge && <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] font-medium leading-4 text-[var(--ink-4)]">{item.badge}</span>}
                      </span>
                      <span className="mt-1 block text-[14px] leading-snug text-[var(--ink-4)]">{item.description}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="mobile-menu-item mb-6 block text-[var(--ink)] no-underline"
                    style={mobileItemStyle(index + 2)}
                  >
                    <span className="block text-[18px] font-semibold leading-tight text-[var(--ink)]">{item.label}</span>
                    <span className="mt-1 block text-[14px] leading-snug text-[var(--ink-3)]">{item.description}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isLoginOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-4 py-6 animate-[modalOverlayIn_0.18s_ease-out_both]"
          onClick={() => setIsLoginOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="w-full max-w-[420px] rounded-[16px] border border-[var(--line)] bg-[#fcfbf8] px-6 py-6 text-[var(--ink)] shadow-[0_28px_76px_-44px_rgba(28,28,28,0.58)] animate-[modalSheetIn_0.24s_cubic-bezier(0.16,1,0.3,1)_both] max-[460px]:px-5 max-[460px]:py-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <LogoMark size="lg" />
                <h2 id="login-modal-title" className="mt-5 mb-0 text-[26px] leading-[1.04] font-semibold text-[var(--ink)] max-[460px]:text-[24px]">
                  <span className="block text-[var(--ink)]">Create free account</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
                aria-label="Close login"
              >
                <X size={23} strokeWidth={1.8} />
              </button>
            </div>

            {loginState === "sent" ? (
              <div className="mt-6">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] px-4 py-4">
                  <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Check your inbox</p>
                  <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">
                    We sent a setup link to <strong className="font-semibold text-[var(--ink)]">{loginEmail}</strong>. It opens BrawlLens setup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void sendSetupEmail({ resend: true })}
                  disabled={loginResending}
                  className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[9px] border border-[var(--line-2)] bg-transparent px-4 text-[14px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-wait disabled:opacity-60"
                >
                  {loginResending ? "Sending again..." : "Didn't receive an email? Resend"}
                </button>
              </div>
            ) : (
              <form onSubmit={submitLogin} className="mt-6">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-[var(--ink)]">Email</span>
                  <input
                    ref={loginInputRef}
                    type="email"
                    required
                    value={loginEmail}
                    onChange={event => {
                      setLoginEmail(event.target.value);
                      if (loginState !== "sending") {
                        setLoginState("idle");
                        setLoginError(null);
                      }
                    }}
                    className="h-11 w-full rounded-[9px] border border-[var(--line-2)] bg-transparent px-3.5 text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--ink)]"
                    placeholder="you@example.com"
                  />
                  <div className={`mt-2 flex items-center gap-2 text-[11px] leading-none ${loginEmailCheck.status === "valid" ? "text-[var(--ink)]" : loginEmailCheck.status === "idle" || loginEmailCheck.status === "checking" ? "text-[var(--ink-4)]" : "text-[var(--ink-2)]"}`}>
                    <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${loginEmailCheck.status === "valid" ? "border-[var(--ink)] bg-[var(--ink)] text-[#fcfbf8]" : loginEmailCheck.status === "checking" ? "animate-pulse border-[var(--line-2)] bg-[var(--line)] text-transparent" : loginEmailCheck.status === "idle" ? "border-[var(--line-2)] text-transparent" : "border-[var(--ink-2)] text-[var(--ink-2)]"}`}>
                      {loginEmailCheck.status === "valid" ? "✓" : loginEmailCheck.status === "invalid" || loginEmailCheck.status === "format" ? "!" : ""}
                    </span>
                    {loginEmailCheck.message}
                  </div>
                </label>
                <label className="mt-3 block">
                  <span className="mb-2 block text-[13px] font-semibold text-[var(--ink)]">Password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    pattern="(?=.*[0-9]).{8,}"
                    value={loginPassword}
                    onChange={event => {
                      setLoginPassword(event.target.value);
                      if (loginState !== "sending") {
                        setLoginState("idle");
                        setLoginError(null);
                      }
                    }}
                    className="h-11 w-full rounded-[9px] border border-[var(--line-2)] bg-transparent px-3.5 text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--ink)]"
                    placeholder="8+ characters, include a number"
                  />
                  <div className="mt-2 grid gap-1">
                    {loginPasswordRules.map(rule => (
                      <div key={rule.label} className={`flex items-center gap-2 text-[11px] leading-none ${rule.passed ? "text-[var(--ink)]" : "text-[var(--ink-4)]"}`}>
                        <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${rule.passed ? "border-[var(--ink)] bg-[var(--ink)] text-[#fcfbf8]" : "border-[var(--line-2)] text-transparent"}`}>✓</span>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmitLogin}
                  className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[9px] border-0 bg-[var(--ink)] px-4 text-[14px] font-semibold text-[#fcfbf8] shadow-[var(--shadow-lift)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginState === "sending" ? "Sending..." : "Create account"}
                </button>
              </form>
            )}

            {loginState === "error" && (
              <p className="mt-4 mb-0 rounded-[10px] border border-[var(--line)] bg-[var(--panel-2)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--ink-2)]">
                {loginError}
              </p>
            )}

            <p className="mt-5 mb-0 text-[12px] leading-relaxed text-[var(--ink-3)]">
              By continuing, you agree to the <Link href="/privacy" onClick={() => setIsLoginOpen(false)} className="text-[var(--ink)] underline underline-offset-4">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      )}

      <AssistantPopup
        open={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        pendingQuery={pendingAssistantQuery}
        onPendingConsumed={() => setPendingAssistantQuery(null)}
      />
    </>
  );
}
