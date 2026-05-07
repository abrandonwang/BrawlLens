"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AssistantPopup from "./AssistantPopup";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import { authHeaders, clearAuthSession, clearServerSession, storeAuthSession } from "@/lib/clientAuth";
import type { PremiumUser } from "@/lib/premium";
import { isEmailFormatValid, useEmailCheck } from "@/lib/useEmailCheck";

type NavPanelItem = {
  label: string;
  href?: string;
  description: string;
  action?: "assistant";
  disabled?: boolean;
  badge?: string;
};

const browseItems: NavPanelItem[] = [
  { label: "Brawlers", href: "/brawlers", description: "Stats and abilities" },
  { label: "Maps", href: "/meta", description: "Modes and matchups" },
  { label: "Ask AI", description: "Ask data questions", action: "assistant" },
  { label: "Guide", description: "Coming soon", disabled: true },
];

const leaderboardItems: NavPanelItem[] = [
  { label: "Players", href: "/leaderboards/players", description: "Top player trophies" },
  { label: "Clubs", href: "/leaderboards/clubs", description: "Top club trophies" },
  { label: "Brawlers", href: "/leaderboards/brawlers", description: "Brawler trophy ranks" },
  { label: "Community", description: "Coming soon", disabled: true },
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

const accountMenuItems = [
  { label: "Profile", href: "/account?tab=profile" },
  { label: "Settings", href: "/account?tab=settings" },
  { label: "Appearance", href: "/account?tab=appearance" },
] as const;

const rootMenuLinks = [
  { label: "Lensboard", href: "/", description: "Custom data workspace" },
  { label: "Leaderboards", href: "/leaderboards/players", description: "Rankings" },
];

type MenuPanel = "root" | "browse" | "about";
type DesktopPanel = "browse" | "leaderboards";
type LoginState = "idle" | "sending" | "sent" | "error";
type AuthMode = "signup" | "login";

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

function authErrorMessage(error: string | undefined, mode: AuthMode) {
  switch (error) {
    case "weak_password":
      return "Password needs at least 8 characters and one number.";
    case "disposable_domain":
      return "Use a permanent email address.";
    case "invalid_email":
      return "Enter a valid email address.";
    case "email_unreachable":
      return "Use a real email address with an active mail server.";
    case "custom_email_not_configured":
      return "BrawlLens email is not configured yet.";
    case "setup_link_generation_failed":
      return "Supabase could not generate the setup link.";
    case "magic_link_email_failed":
      return "Resend could not send from that email address.";
    case "invalid_credentials":
      return "Email or password did not match.";
    case "auth_not_configured":
      return "BrawlLens auth is not configured yet.";
    default:
      return mode === "login" ? "Login is not available right now." : "Account setup is not available right now.";
  }
}

function LogoMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const outer = size === "lg" ? "size-[38px] rounded-[12px]" : "size-[21px] rounded-[6px]";
  const inner = size === "lg" ? "after:inset-[8px] after:rounded-[5px]" : "after:inset-[4px] after:rounded-[2.5px]";
  return (
    <span className={`relative inline-block ${outer} bg-[conic-gradient(from_var(--logo-angle),#f97316,#ec4899,#8b5cf6,#3b82f6,#14b8d6,#f97316)] animate-[logo-spin_8s_linear_infinite] after:absolute ${inner} after:bg-black after:content-['']`} />
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
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginResending, setLoginResending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const previousPathnameRef = useRef(pathname);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const browseTriggerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<number | null>(null);
  const desktopHoverTimerRef = useRef<number | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const [desktopPanelLeft, setDesktopPanelLeft] = useState(190);
  const bodyScrollLocked = isMenuOpen || menuClosing || isLoginOpen;

  const applyAccountUser = useCallback((user: PremiumUser | null) => {
    setIsSignedIn(Boolean(user));
    setAccountEmail(user?.email ?? null);
    setAccountName(
      user?.accountSetup?.playerName
        ?? user?.displayName
        ?? (user?.accountSetup?.playerTag ? `#${user.accountSetup.playerTag}` : null)
    );
  }, []);

  const closeMenu = useCallback(() => {
    if (!isMenuOpen || menuClosing) return;
    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current);
    }
    setMenuClosing(true);
    menuCloseTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      setMenuClosing(false);
      setMenuPanel("root");
      menuCloseTimerRef.current = null;
    }, 260);
  }, [isMenuOpen, menuClosing]);

  const showLogin = useCallback((mode: AuthMode = "signup") => {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
    setIsAccountMenuOpen(false);
    setAuthMode(mode);
    setIsLoginOpen(true);
  }, [closeMenu]);

  useEffect(() => {
    if (!bodyScrollLocked) return;
    return lockBodyScroll();
  }, [bodyScrollLocked]);

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
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current !== null) {
        window.clearTimeout(menuCloseTimerRef.current);
      }
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
    setLoginState("idle");
    setLoginResending(false);
    setLoginError(null);
  }, [authMode, isLoginOpen]);

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
    function onOpenLogin(e: Event) {
      const detail = (e as CustomEvent<{ mode?: AuthMode }>).detail;
      showLogin(detail?.mode === "login" ? "login" : "signup");
    }

    window.addEventListener("brawllens:open-login", onOpenLogin);
    return () => window.removeEventListener("brawllens:open-login", onOpenLogin);
  }, [showLogin]);

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
          applyAccountUser(response.ok ? payload?.user ?? null : null);
        }
      } catch {
        if (active) {
          applyAccountUser(null);
        }
      }
    }

    loadAccountState();
    return () => {
      active = false;
    };
  }, [applyAccountUser, pathname]);

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
    showLogin("signup");
  }

  function clearDesktopHoverTimer() {
    if (desktopHoverTimerRef.current !== null) {
      window.clearTimeout(desktopHoverTimerRef.current);
      desktopHoverTimerRef.current = null;
    }
  }

  function updateDesktopPanelLeft() {
    const trigger = browseTriggerRef.current;
    if (!trigger) return;
    const panelWidth = window.innerWidth < 1280 ? 500 : 540;
    const triggerRect = trigger.getBoundingClientRect();
    const nextLeft = Math.max(16, Math.min(triggerRect.left - 18, window.innerWidth - panelWidth - 16));
    setDesktopPanelLeft(Math.round(nextLeft));
  }

  function openHoverDesktopPanel(panel: DesktopPanel) {
    if (suppressedDesktopPanel === panel) return;
    clearDesktopHoverTimer();
    updateDesktopPanelLeft();
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

    updateDesktopPanelLeft();
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

  async function refreshSignedInAccount() {
    try {
      const response = await fetch("/api/auth/me", {
        headers: authHeaders(),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { user?: PremiumUser | null } | null;
      applyAccountUser(response.ok ? payload?.user ?? null : null);
    } catch {
      applyAccountUser(null);
    }
  }

  async function sendAuthRequest(options?: { resend?: boolean }) {
    const isResend = options?.resend === true;
    const emailReady = authMode === "signup" ? loginEmailCheck.isValid : isEmailFormatValid(loginEmail);

    if (!emailReady) {
      setLoginState(isResend && authMode === "signup" ? "sent" : "error");
      setLoginError(authMode === "signup" ? loginEmailCheck.message : "Enter a valid email address.");
      return;
    }
    if (!isValidAccountPassword(loginPassword)) {
      setLoginState(isResend && authMode === "signup" ? "sent" : "error");
      setLoginError("Password needs at least 8 characters and one number.");
      return;
    }

    if (isResend) {
      setLoginResending(true);
    } else {
      setLoginState("sending");
    }
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, mode: authMode }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setLoginState(isResend && authMode === "signup" ? "sent" : "error");
        setLoginError(authErrorMessage(payload?.error, authMode));
        return;
      }

      const payload = await response.json().catch(() => null) as {
        session?: { accessToken?: string; refreshToken?: string; expiresAt?: number }
      } | null;

      if (authMode === "login") {
        if (!payload?.session?.accessToken) {
          setLoginState("error");
          setLoginError("BrawlLens could not start your session.");
          return;
        }
        storeAuthSession({
          accessToken: payload.session.accessToken,
          refreshToken: payload.session.refreshToken,
          expiresAt: payload.session.expiresAt,
        });
        await refreshSignedInAccount();
        setIsLoginOpen(false);
        setLoginPassword("");
        router.refresh();
        return;
      }

      setLoginState("sent");
    } catch {
      setLoginState(isResend && authMode === "signup" ? "sent" : "error");
      setLoginError(authMode === "login" ? "Login is not available right now." : "Account setup is not available right now.");
    } finally {
      setLoginResending(false);
    }
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendAuthRequest();
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
    setAccountEmail(null);
    clearAuthSession();
    clearServerSession().finally(() => router.replace("/login"));
  }

  const accountLabel = isSignedIn ? accountName ?? "Account" : "Get started";
  const browseActive = browseItems.some(item => item.href && isDesktopItemActive(pathname, activeHash, item.href));
  const leaderboardsActive = leaderboardItems.some(item => item.href && isDesktopItemActive(pathname, activeHash, item.href));
  const isLeaderboardsRoute = pathname.startsWith("/leaderboards");
  const aboutActive = aboutItems.some(item => item.href && isDesktopItemActive(pathname, activeHash, item.href));
  const loginEmailCheck = useEmailCheck(loginEmail, isLoginOpen && authMode === "signup");
  const loginEmailFormatValid = isEmailFormatValid(loginEmail);
  const loginEmailReady = authMode === "signup" ? loginEmailCheck.isValid : loginEmailFormatValid;
  const loginEmailStatus = authMode === "signup"
    ? loginEmailCheck.status
    : loginEmail.trim().length === 0
      ? "idle"
      : loginEmailFormatValid
        ? "valid"
        : "format";
  const loginEmailMessage = authMode === "signup"
    ? loginEmailCheck.message
    : loginEmail.trim().length === 0
      ? "Enter your account email."
      : loginEmailFormatValid
        ? "Ready to log in."
        : "Enter a valid email format.";
  const loginPasswordRules = passwordRules(loginPassword);
  const loginPasswordValid = loginPasswordRules.every(rule => rule.passed);
  const canSubmitLogin = loginEmailReady && loginPasswordValid && loginState !== "sending";
  const menuVisible = isMenuOpen || menuClosing;
  const visibleDesktopPanel = desktopPanel ?? hoverDesktopPanel;
  const renderedDesktopPanel = visibleDesktopPanel ?? lastDesktopPanel;
  const desktopPanelIndex = renderedDesktopPanel === "leaderboards" ? 1 : 0;
  const navPositionClass = isLeaderboardsRoute
    ? "relative z-[100]"
    : "fixed top-0 left-0 z-[100]";
  const mobileItemStyle = (index: number) => ({
    animationDelay: menuClosing ? "0ms" : `${30 + index * 42}ms`,
  });
  const navTextClass = (active: boolean) =>
    `relative inline-flex h-[60px] items-center rounded-none border-0 bg-transparent px-0 text-[14px] font-semibold leading-none tracking-[-0.005em] no-underline outline-none transition-colors duration-150 focus-visible:text-white ${active ? "text-white hover:text-white" : "text-[#cfd2d8] hover:text-white"} ${isLeaderboardsRoute && active ? "after:absolute after:right-0 after:bottom-[10px] after:left-0 after:h-[3px] after:rounded-full after:bg-[#ead672] after:content-['']" : ""}`;

  useEffect(() => {
    document.documentElement.classList.toggle("leaderboards-nav-flow", isLeaderboardsRoute);
    return () => document.documentElement.classList.remove("leaderboards-nav-flow");
  }, [isLeaderboardsRoute]);

  useEffect(() => {
    if (visibleDesktopPanel) setLastDesktopPanel(visibleDesktopPanel);
  }, [visibleDesktopPanel]);

  useEffect(() => {
    if (!visibleDesktopPanel) return;
    updateDesktopPanelLeft();

    function onResize() {
      updateDesktopPanelLeft();
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visibleDesktopPanel]);

  return (
    <>
      <nav className={`${navPositionClass} flex h-[60px] w-full items-center border-b border-black bg-black px-6 text-[#f4f5f7] max-lg:px-4 max-[430px]:px-3`}>
        <Link href="/" className="relative z-10 inline-flex h-[60px] shrink-0 items-center gap-[7px] whitespace-nowrap text-[19px] font-extrabold leading-none tracking-[-0.045em] text-white no-underline max-[380px]:text-[18px]" aria-label="BrawlLens home">
          <LogoMark />
          <span className={isLeaderboardsRoute ? "sr-only" : "nav-wordmark max-[380px]:sr-only"}>BrawlLens</span>
        </Link>

        <div ref={desktopNavRef} className="relative z-10 ml-[40px] hidden h-[60px] min-w-0 items-center gap-[26px] lg:flex">
          <div
            ref={browseTriggerRef}
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
              aria-expanded={visibleDesktopPanel === "browse"}
            >
              Tierlist &amp; Brawlers
              <ChevronDown size={13} strokeWidth={2.25} className="nav-trigger-arrow ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          </div>
          <div
            className="nav-popover relative"
            data-open={visibleDesktopPanel === "leaderboards" ? "true" : undefined}
            data-suppressed={suppressedDesktopPanel === "leaderboards" ? "true" : undefined}
            onMouseEnter={() => openHoverDesktopPanel("leaderboards")}
            onMouseLeave={() => {
              clearSuppressedDesktopPanel("leaderboards");
              scheduleHoverDesktopClose("leaderboards");
            }}
          >
            <button
              type="button"
              onClick={() => toggleDesktopPanel("leaderboards")}
              className={`${navTextClass(leaderboardsActive)} cursor-pointer gap-1.5`}
              aria-haspopup="true"
              aria-expanded={visibleDesktopPanel === "leaderboards"}
            >
              Leaderboards
              <ChevronDown size={13} strokeWidth={2.25} className="nav-trigger-arrow ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          </div>
          <div
            className="nav-browse-panel fixed top-[58px] w-[540px] max-xl:w-[500px]"
            data-open={visibleDesktopPanel ? "true" : undefined}
            style={{ left: desktopPanelLeft }}
            onMouseEnter={clearDesktopHoverTimer}
            onMouseLeave={() => {
              if (visibleDesktopPanel) scheduleHoverDesktopClose(visibleDesktopPanel);
            }}
          >
            <div className="h-[206px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#0b0f12] p-2 text-[#f4f5f7] shadow-[0_28px_70px_-38px_rgba(0,0,0,0.95),rgba(255,255,255,0.08)_0_0.5px_0_0_inset]">
              <div
                className="nav-panel-track flex h-full w-[200%]"
                style={{ transform: `translateX(-${desktopPanelIndex * 50}%)` }}
              >
                <div className="h-full w-1/2 shrink-0 p-0">
                  <div className="px-3 pt-2.5 pb-2">
                    <p className="m-0 text-[12px] font-semibold text-[#f4f5f7]">Browse</p>
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
                            className="flex min-h-[58px] cursor-pointer items-start justify-between gap-3 rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left font-[inherit] text-[#f4f5f7] transition-colors duration-200 hover:bg-white/[0.06]"
                          >
                            <span className="min-w-0">
                              <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold leading-tight text-[#f4f5f7]">
                                <span className="truncate">{item.label}</span>
                                <Image
                                  src="/ai-sparkle-512.png"
                                  alt=""
                                  width={14}
                                  height={14}
                                  className="size-3.5 shrink-0 object-contain brightness-0 invert opacity-85"
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="mt-1 block text-[12px] leading-snug text-[#8f96a1]">{item.description}</span>
                            </span>
                          </button>
                        );
                      }

                      if (!item.href || item.disabled) {
                        return (
                          <div
                            key={item.label}
                            aria-disabled="true"
                            className="flex min-h-[58px] items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[#68707b] opacity-75"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[14px] font-semibold leading-tight text-[#8f96a1]">{item.label}</span>
                              <span className="mt-1 block text-[12px] leading-snug text-[#68707b]">{item.description}</span>
                            </span>
                            {item.badge && (
                              <span className="mt-0.5 shrink-0 rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] font-medium leading-4 text-[#8f96a1]">
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
                          className={`flex min-h-[58px] items-start gap-3 rounded-[10px] px-3 py-2.5 text-inherit no-underline transition-colors duration-200 ${active ? "bg-[#f4f5f7] text-[#080a0c]" : "text-[#f4f5f7] hover:bg-white/[0.06]"}`}
                        >
                          <span className="min-w-0">
                            <span className={`block truncate text-[14px] font-semibold leading-tight ${active ? "text-[#080a0c]" : "text-[#f4f5f7]"}`}>{item.label}</span>
                            <span className={`mt-1 block text-[12px] leading-snug ${active ? "text-[#080a0c]/65" : "text-[#8f96a1]"}`}>{item.description}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="h-full w-1/2 shrink-0 p-0">
                  <div className="px-3 pt-2.5 pb-2">
                    <p className="m-0 text-[12px] font-semibold text-[#f4f5f7]">Leaderboards</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                    {leaderboardItems.map(item => {
                      if (!item.href || item.disabled) {
                        return (
                          <div
                            key={item.label}
                            aria-disabled="true"
                            className="flex min-h-[58px] min-w-0 items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[#68707b] opacity-75"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[14px] font-semibold leading-tight text-[#8f96a1]">{item.label}</span>
                              <span className="mt-1 block text-[12px] leading-snug text-[#68707b]">{item.description}</span>
                            </span>
                          </div>
                        );
                      }
                      const active = visibleDesktopPanel === "leaderboards" && isDesktopItemActive(pathname, activeHash, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setDesktopPanel(null);
                            setHoverDesktopPanel(null);
                            setSuppressedDesktopPanel(null);
                          }}
                          className={`flex min-h-[58px] min-w-0 items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-inherit no-underline transition-colors duration-200 ${active ? "bg-[#f4f5f7] text-[#080a0c]" : "text-[#f4f5f7] hover:bg-white/[0.06]"}`}
                        >
                          <span className="min-w-0">
                            <span className={`block truncate text-[14px] font-semibold leading-tight ${active ? "text-[#080a0c]" : "text-[#f4f5f7]"}`}>{item.label}</span>
                            <span className={`mt-1 block text-[12px] leading-snug ${active ? "text-[#080a0c]/65" : "text-[#8f96a1]"}`}>{item.description}</span>
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

        <div className="relative z-10 ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2 max-[430px]:gap-1.5">
          <button
            type="button"
            onClick={() => setIsAssistantOpen(o => !o)}
            className={`hidden h-[34px] cursor-pointer items-center gap-1.5 rounded-[7px] px-2.5 text-left text-[10px] font-extrabold uppercase leading-[1.05] tracking-[0.01em] text-[#1a1408] shadow-[rgba(255,255,255,0.45)_0_0.5px_0_0_inset,rgba(0,0,0,0.25)_0_1px_2px] transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] md:inline-flex ${isLeaderboardsRoute ? "bg-[#e8c86c]" : "bg-gradient-to-b from-[#f5d573] to-[#e6b94a]"}`}
            aria-label="Get BrawlLens Pro"
            aria-expanded={isAssistantOpen}
            title="BrawlLens Pro Beta"
          >
            <Image
              src="/ai-sparkle-512.png"
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 object-contain"
              aria-hidden="true"
            />
            <span className="hidden whitespace-nowrap sm:block">Get BrawlLens<br />Pro Beta</span>
          </button>
          {isLeaderboardsRoute ? (
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex h-[34px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.14] bg-[#171a20] px-3.5 text-[14px] font-bold leading-none text-[#d9dbe1] outline-none shadow-[rgba(255,255,255,0.07)_0_0.5px_0_0_inset] transition-colors duration-150 hover:border-white/[0.22] hover:bg-[#1f232b] hover:text-white focus-visible:ring-1 focus-visible:ring-white/[0.18] max-[420px]:px-3"
            >
              <span>Get started</span>
              <ChevronDown size={14} strokeWidth={2} className="text-[#9ca1aa] max-[430px]:hidden" />
            </button>
          ) : isSignedIn ? (
            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(open => !open)}
                className="inline-flex h-[34px] min-w-[76px] max-w-[220px] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/[0.14] bg-[#171a20] px-3.5 text-[14px] font-bold leading-none text-[#d9dbe1] outline-none shadow-[rgba(255,255,255,0.07)_0_0.5px_0_0_inset] transition-colors duration-150 hover:border-white/[0.22] hover:bg-[#1f232b] hover:text-white focus-visible:ring-1 focus-visible:ring-white/[0.18] max-[540px]:max-w-[180px] max-[430px]:max-w-[132px] max-[420px]:px-3"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                title={accountLabel}
              >
                <span className="block min-w-0 truncate leading-[1.35]">{accountLabel}</span>
                <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-[#9ca1aa] max-[430px]:hidden" />
              </button>
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+9px)] z-[140] w-[278px] origin-top-right rounded-[12px] border border-white/[0.08] bg-[#0b0f12] p-1.5 text-[#f4f5f7] shadow-[0_24px_64px_-36px_rgba(0,0,0,0.95),rgba(255,255,255,0.08)_0_0.5px_0_0_inset] animate-[accountMenuIn_0.16s_cubic-bezier(0.16,1,0.3,1)_both]"
                >
                  <div className="px-2.5 py-2.5">
                    <p className="m-0 truncate text-[14px] font-semibold leading-tight text-[#f4f5f7]">{accountLabel}</p>
                    {accountEmail && <p className="mt-1 mb-0 truncate text-[12px] leading-tight text-[#8f96a1]">{accountEmail}</p>}
                  </div>
                  <div className="my-1 h-px bg-white/[0.08]" />
                  {accountMenuItems.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex min-h-9 items-center rounded-[8px] px-2.5 py-2 text-[13px] font-medium text-[#c9cdd3] no-underline transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#f4f5f7]"
                    >
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-white/[0.08]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex min-h-9 w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#c9cdd3] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#f4f5f7]"
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
              className="inline-flex h-[34px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.14] bg-[#171a20] px-3.5 text-[14px] font-bold leading-none text-[#d9dbe1] outline-none shadow-[rgba(255,255,255,0.07)_0_0.5px_0_0_inset] transition-colors duration-150 hover:border-white/[0.22] hover:bg-[#1f232b] hover:text-white focus-visible:ring-1 focus-visible:ring-white/[0.18] max-[420px]:px-3"
            >
              <span>{accountLabel}</span>
              <ChevronDown size={14} strokeWidth={2} className="text-[#9ca1aa] max-[430px]:hidden" />
            </button>
          )}
          <button
            type="button"
            className="relative grid size-9 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-[#9ca1aa] outline-none hover:text-white focus-visible:outline-none lg:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
          >
            <Menu
              size={20}
              strokeWidth={1.8}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-150 ${isMenuOpen ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
              aria-hidden="true"
            />
            <X
              size={20}
              strokeWidth={1.8}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-150 ${isMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      {menuVisible && (
        <div
          className="fixed inset-x-0 top-[60px] bottom-0 z-[90] flex flex-col bg-[#07090a] px-4 pt-0 pb-5 text-[#f4f5f7] lg:hidden"
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
                className={`mobile-menu-item flex min-h-[48px] w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 text-left text-[18px] text-[#f4f5f7] ${browseActive ? "font-semibold" : ""}`}
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
                  className={`mobile-menu-item flex min-h-[48px] items-center justify-between text-[18px] text-[#f4f5f7] no-underline ${item.href && isRouteActive(pathname, item.href) ? "font-semibold" : ""}`}
                  style={mobileItemStyle(index + 1)}
                >
                  <span>{item.label}</span>
                  {item.href && isRouteActive(pathname, item.href) && <span className="text-[13px] font-normal text-[#68707b]">Current</span>}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setMenuPanel("about")}
                className={`mobile-menu-item flex min-h-[48px] w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 text-left text-[18px] text-[#f4f5f7] ${aboutActive ? "font-semibold" : ""}`}
                style={mobileItemStyle(rootMenuLinks.length + 1)}
              >
                <span>About</span>
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <div className="mobile-menu-list flex flex-1 flex-col overflow-y-auto pt-5">
              <button
                type="button"
                onClick={() => setMenuPanel("root")}
                className="mobile-menu-item mb-7 inline-flex h-8 w-fit cursor-pointer appearance-none items-center gap-2 rounded-none border-0 bg-transparent p-0 text-[14px] font-medium text-[#8f96a1] shadow-none outline-none transition-colors hover:text-[#f4f5f7] focus:text-[#f4f5f7] focus:outline-none focus-visible:outline-none"
                style={mobileItemStyle(0)}
              >
                <ChevronLeft size={17} strokeWidth={1.9} />
                Back
              </button>

              <p className="mobile-menu-item m-0 mb-5 text-[14px] text-[#8f96a1]" style={mobileItemStyle(1)}>{menuPanel === "browse" ? "Browse" : "About"}</p>
              {(menuPanel === "browse" ? browseItems : aboutItems).map((item, index) => {
                if (item.action === "assistant") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={openAssistantFromNav}
                      className="mobile-menu-item mb-6 block cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-[#f4f5f7]"
                      style={mobileItemStyle(index + 2)}
                    >
                      <span className="inline-flex items-center gap-2 text-[18px] font-semibold leading-tight text-[#f4f5f7]">
                        <span>{item.label}</span>
                        <Image
                          src="/ai-sparkle-512.png"
                          alt=""
                          width={15}
                          height={15}
                          className="size-[15px] shrink-0 object-contain brightness-0 invert opacity-85"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1 block text-[14px] leading-snug text-[#8f96a1]">{item.description}</span>
                    </button>
                  );
                }

                if (!item.href || item.disabled) {
                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="mobile-menu-item mb-6 block text-[#68707b] opacity-75"
                      style={mobileItemStyle(index + 2)}
                    >
                      <span className="flex items-center justify-between gap-3 text-[18px] font-semibold leading-tight text-[#8f96a1]">
                        <span>{item.label}</span>
                        {item.badge && <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[11px] font-medium leading-4 text-[#8f96a1]">{item.badge}</span>}
                      </span>
                      <span className="mt-1 block text-[14px] leading-snug text-[#68707b]">{item.description}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="mobile-menu-item mb-6 block text-[#f4f5f7] no-underline"
                    style={mobileItemStyle(index + 2)}
                  >
                    <span className="block text-[18px] font-semibold leading-tight text-[#f4f5f7]">{item.label}</span>
                    <span className="mt-1 block text-[14px] leading-snug text-[#8f96a1]">{item.description}</span>
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
            className="w-full max-w-[420px] rounded-[16px] border border-white/[0.10] bg-[#101419] px-6 py-6 text-[var(--ink)] shadow-[0_34px_92px_-44px_rgba(0,0,0,0.95),rgba(255,255,255,0.08)_0_0.5px_0_0_inset] animate-[modalSheetIn_0.24s_cubic-bezier(0.16,1,0.3,1)_both] max-[460px]:px-5 max-[460px]:py-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <LogoMark size="lg" />
                <h2 id="login-modal-title" className="sr-only">{authMode === "signup" ? "Create free account" : "Log in"}</h2>
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

            <div className="mt-5 grid grid-cols-2 rounded-[9px] border border-[var(--line)] bg-[var(--panel-2)] p-1">
              {[
                { id: "signup" as const, label: "Create" },
                { id: "login" as const, label: "Log in" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAuthMode(item.id)}
                  className={`h-9 cursor-pointer rounded-md border-0 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[rgba(133,141,255,0.22)] ${authMode === item.id ? "bg-[var(--ink)] text-[var(--ink-on)]" : "bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loginState === "sent" && authMode === "signup" ? (
              <div className="mt-6">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] px-4 py-4">
                  <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Check your inbox</p>
                  <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">
                    We sent a setup link to <strong className="font-semibold text-[var(--ink)]">{loginEmail}</strong>. It opens BrawlLens setup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void sendAuthRequest({ resend: true })}
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
                  {authMode === "signup" && (
                    <div className={`mt-2 flex items-center gap-2 text-[11px] leading-none ${loginEmailStatus === "valid" ? "text-[var(--ink)]" : loginEmailStatus === "idle" || loginEmailStatus === "checking" ? "text-[var(--ink-4)]" : "text-[var(--ink-2)]"}`}>
                      <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${loginEmailStatus === "valid" ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)]" : loginEmailStatus === "checking" ? "animate-pulse border-[var(--line-2)] bg-[var(--line)] text-transparent" : loginEmailStatus === "idle" ? "border-[var(--line-2)] text-transparent" : "border-[var(--ink-2)] text-[var(--ink-2)]"}`}>
                        {loginEmailStatus === "valid" ? "✓" : loginEmailStatus === "invalid" || loginEmailStatus === "format" ? "!" : ""}
                      </span>
                      {loginEmailMessage}
                    </div>
                  )}
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
                  {authMode === "signup" && (
                    <div className="mt-2 grid gap-1">
                      {loginPasswordRules.map(rule => (
                        <div key={rule.label} className={`flex items-center gap-2 text-[11px] leading-none ${rule.passed ? "text-[var(--ink)]" : "text-[var(--ink-4)]"}`}>
                          <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${rule.passed ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)]" : "border-[var(--line-2)] text-transparent"}`}>✓</span>
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={!canSubmitLogin}
                  className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[9px] border-0 bg-[var(--ink)] px-4 text-[14px] font-semibold text-[var(--ink-on)] shadow-[var(--shadow-lift)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginState === "sending" ? (authMode === "login" ? "Logging in..." : "Sending...") : authMode === "login" ? "Log in" : "Create account"}
                </button>
              </form>
            )}

            {loginError && (loginState === "error" || loginState === "sent") && (
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
