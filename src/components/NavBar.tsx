"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import SearchOverlay from "./SearchOverlay";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import { authHeaders, clearAuthSession, clearServerSession, storeAuthSession } from "@/lib/clientAuth";
import type { PremiumUser } from "@/lib/premium";
import { isEmailFormatValid, useEmailCheck } from "@/lib/useEmailCheck";

type NavPanelItem = {
  label: string;
  href?: string;
  description: string;
  disabled?: boolean;
  badge?: string;
};

const browseItems: NavPanelItem[] = [
  { label: "Brawlers", href: "/brawlers", description: "Stats and abilities" },
  { label: "Maps", href: "/meta", description: "Modes and matchups" },
  { label: "Guides", href: "/guides", description: "Strategies and progression" },
];

const leaderboardItems: NavPanelItem[] = [
  { label: "Player rankings", href: "/leaderboards/players", description: "Top player trophies" },
  { label: "Club rankings", href: "/leaderboards/clubs", description: "Top club trophies" },
  { label: "Brawler rankings", href: "/leaderboards/brawlers", description: "Brawler trophy ranks" },
];

const accountMenuItems = [
  { label: "Profile", href: "/account?tab=profile" },
  { label: "Settings", href: "/account?tab=settings" },
  { label: "Appearance", href: "/account?tab=appearance" },
] as const;

const mobileMenuLinks = [
  { label: "Home", href: "/" },
  { label: "Brawlers", href: "/brawlers" },
  { label: "Maps", href: "/meta" },
  { label: "Players", href: "/leaderboards/players" },
  { label: "Clubs", href: "/leaderboards/clubs" },
  { label: "Brawler ranks", href: "/leaderboards/brawlers" },
  { label: "Guides", href: "/guides" },
] as const;

const loginButtonClass =
  "bl-nav-login-button inline-flex h-[36px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-[14px] font-semibold leading-none outline-none"

type DesktopPanel = "browse" | "leaderboards";
type LoginState = "idle" | "sending" | "sent" | "error";
type AuthMode = "signup" | "login";
type AuthMePayload = {
  user?: PremiumUser | null;
  session?: { accessToken?: string; refreshToken?: string; expiresAt?: number } | null;
};

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

function isDesktopItemActive(pathname: string, href: string) {
  const [, rawHash] = href.split("#");
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

function internalRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://brawllens.local");
    if (url.origin !== "https://brawllens.local") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel | null>(null);
  const [hoverDesktopPanel, setHoverDesktopPanel] = useState<DesktopPanel | null>(null);
  const [suppressedDesktopPanel, setSuppressedDesktopPanel] = useState<DesktopPanel | null>(null);
  const [lastDesktopPanel, setLastDesktopPanel] = useState<DesktopPanel>("browse");
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
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | null>(null);
  const previousPathnameRef = useRef(pathname);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const browseTriggerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<number | null>(null);
  const desktopHoverTimerRef = useRef<number | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const [desktopPanelLeft, setDesktopPanelLeft] = useState(190);
  const [isScrolled, setIsScrolled] = useState(false);
  const bodyScrollLocked = isMenuOpen || menuClosing || isLoginOpen;

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      menuCloseTimerRef.current = null;
    }, 260);
  }, [isMenuOpen, menuClosing]);

  const showLogin = useCallback((mode: AuthMode = "signup", redirectTo: string | null = null) => {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
    setIsAccountMenuOpen(false);
    setLoginRedirectTo(redirectTo);
    setAuthMode(mode);
    setIsLoginOpen(true);
  }, [closeMenu]);

  const openSearchOverlay = useCallback((query = "") => {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
    window.dispatchEvent(new CustomEvent("brawllens:open-search", { detail: { query } }));
  }, [closeMenu]);

  useEffect(() => {
    if (!bodyScrollLocked) return;
    return lockBodyScroll();
  }, [bodyScrollLocked]);

  useEffect(() => {
    document.documentElement.classList.toggle("bl-auth-open", isLoginOpen);
    return () => document.documentElement.classList.remove("bl-auth-open");
  }, [isLoginOpen]);

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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearchOverlay();
        return;
      }
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
  }, [closeMenu, openSearchOverlay]);

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
    const searchParams = new URLSearchParams(window.location.search);
    const auth = searchParams.get("auth");
    if (auth !== "login" && auth !== "signup") return;

    showLogin(auth, internalRedirectPath(searchParams.get("next")));

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("auth");
    nextParams.delete("next");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, showLogin]);

  useEffect(() => {
    if (!isLoginOpen) return;
    window.setTimeout(() => loginInputRef.current?.focus(), 80);
  }, [isLoginOpen]);

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
    function onOpenLogin(e: Event) {
      const detail = (e as CustomEvent<{ mode?: AuthMode; next?: string }>).detail;
      showLogin(detail?.mode === "login" ? "login" : "signup", internalRedirectPath(detail?.next ?? null));
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
        const payload = await response.json().catch(() => null) as AuthMePayload | null;
        if (active) {
          if (response.ok && payload?.session?.accessToken) {
            storeAuthSession({
              accessToken: payload.session.accessToken,
              refreshToken: payload.session.refreshToken,
              expiresAt: payload.session.expiresAt,
            });
          }
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
    setIsAccountMenuOpen(false);
    setIsMenuOpen(true);
  }

  function openLogin() {
    showLogin("login");
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
      const payload = await response.json().catch(() => null) as AuthMePayload | null;
      if (response.ok && payload?.session?.accessToken) {
        storeAuthSession({
          accessToken: payload.session.accessToken,
          refreshToken: payload.session.refreshToken,
          expiresAt: payload.session.expiresAt,
        });
      }
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
        const redirectTo = loginRedirectTo;
        setLoginRedirectTo(null);
        setLoginPassword("");
        if (redirectTo) {
          router.replace(redirectTo);
        } else {
          router.refresh();
        }
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

  function signOut() {
    setIsAccountMenuOpen(false);
    setIsSignedIn(false);
    setAccountName(null);
    setAccountEmail(null);
    clearAuthSession();
    clearServerSession().finally(() => {
      router.replace("/");
      showLogin("login");
    });
  }

  const accountLabel = isSignedIn ? accountName ?? "Account" : "Log in";
  const isLeaderboardsRoute = pathname.startsWith("/leaderboards");
  const isPlayerRoute = pathname.startsWith("/player/");
  const isTierlistRoute = pathname === "/brawlers" || pathname.startsWith("/brawlers/") || pathname === "/meta" || pathname.startsWith("/meta/") || pathname === "/guides" || pathname.startsWith("/guides/");
  const isGuidesRoute = pathname === "/guides" || pathname.startsWith("/guides/");
  const isNavFlowRoute = isLeaderboardsRoute || isPlayerRoute || isTierlistRoute || isGuidesRoute;
  const browseActive = browseItems.some(item => item.href && isDesktopItemActive(pathname, item.href));
  const leaderboardsActive = isPlayerRoute || leaderboardItems.some(item => item.href && isDesktopItemActive(pathname, item.href));
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
  const desktopPanelContent = renderedDesktopPanel === "leaderboards"
    ? { items: leaderboardItems, viewAllHref: "/leaderboards/players" }
    : { items: browseItems, viewAllHref: "/brawlers" };
  const navPositionClass = "relative z-[100]";
  const navTextClass = (active: boolean) =>
    `relative inline-flex h-[36px] items-center rounded-full border-0 px-3 text-[13px] font-semibold leading-none tracking-[-0.005em] no-underline outline-none transition-colors duration-150 text-[rgba(245,244,241,0.78)] hover:text-[#f5f4f1] hover:bg-[rgba(245,244,241,0.06)] focus-visible:text-[#f5f4f1] ${active ? "text-[#f5f4f1] bg-[rgba(124,92,255,0.14)]" : ""}`;

  useEffect(() => {
    document.documentElement.classList.toggle("leaderboards-nav-flow", isLeaderboardsRoute);
    document.documentElement.classList.toggle("profile-nav-flow", isPlayerRoute);
    document.documentElement.classList.toggle("tierlist-nav-flow", isTierlistRoute);
    return () => {
      document.documentElement.classList.remove("leaderboards-nav-flow");
      document.documentElement.classList.remove("profile-nav-flow");
      document.documentElement.classList.remove("tierlist-nav-flow");
    };
  }, [isLeaderboardsRoute, isPlayerRoute, isTierlistRoute]);

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
      <nav
        className="bl-nav-pill fixed left-1/2 top-4 z-[100] -translate-x-1/2 w-[70vw] max-w-[1200px] overflow-hidden rounded-[20px] border border-solid border-[rgba(245,244,241,0.10)] bg-[rgba(13,13,17,0.92)] text-[#f5f4f1] shadow-[0_18px_44px_-22px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 max-lg:w-[calc(100%-20px)]"
        onMouseLeave={() => {
          setHoverDesktopPanel(null);
          setDesktopPanel(null);
          setSuppressedDesktopPanel(null);
        }}
      >
        <div className="flex h-[60px] items-center px-5 max-lg:px-4">
        <Link href="/" className="relative z-10 inline-flex h-full shrink-0 items-center whitespace-nowrap text-[#f5f4f1] no-underline" aria-label="BrawlLens home">
          <BrandMark size="sm" showWordmark={true} />
        </Link>

        <div ref={desktopNavRef} className="relative z-10 ml-10 hidden h-full min-w-0 items-center gap-1 lg:flex">
          <div
            className="nav-popover relative"
            data-open={visibleDesktopPanel === "browse" ? "true" : undefined}
            onPointerEnter={() => openHoverDesktopPanel("browse")}
            onMouseEnter={() => openHoverDesktopPanel("browse")}
          >
            <Link
              href="/brawlers"
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className={`${navTextClass(browseActive)} cursor-pointer gap-1.5`}
            >
              Tierlist &amp; Brawlers
              <ChevronDown size={13} strokeWidth={2.25} className="nav-trigger-arrow ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
          </div>
          <div
            className="nav-popover relative"
            data-open={visibleDesktopPanel === "leaderboards" ? "true" : undefined}
            onPointerEnter={() => openHoverDesktopPanel("leaderboards")}
            onMouseEnter={() => openHoverDesktopPanel("leaderboards")}
          >
            <Link
              href="/leaderboards/players"
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className={`${navTextClass(leaderboardsActive)} cursor-pointer gap-1.5`}
            >
              Leaderboards
              <ChevronDown size={13} strokeWidth={2.25} className="nav-trigger-arrow ml-0.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 ml-auto hidden min-w-0 shrink-0 items-center justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={() => openSearchOverlay()}
            className="inline-flex h-[36px] items-center gap-2 rounded-[10px] border-0 bg-[rgba(245,244,241,0.06)] px-3.5 text-[rgba(245,244,241,0.78)] outline-none transition-colors hover:bg-[rgba(245,244,241,0.10)] hover:text-[#f5f4f1]"
            aria-label="Open search"
            title="Search (⌘K)"
          >
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <span className="text-[14px] font-medium leading-none tracking-[-0.01em]">⌘K</span>
          </button>
          <span aria-hidden="true" className="h-5 w-px bg-[rgba(245,244,241,0.12)]" />
          {isSignedIn ? (
            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(open => !open)}
                className={`relative z-[142] inline-flex h-[34px] min-w-[76px] max-w-[220px] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap border px-3.5 text-[14px] font-bold leading-none outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-[rgba(245,244,241,0.15)] max-[540px]:max-w-[180px] max-[430px]:max-w-[132px] max-[420px]:px-3 ${isAccountMenuOpen ? "rounded-t-[17px] rounded-b-none border-[#26262d] border-b-[#0d0d11] bg-[#0d0d11] text-[#f5f4f1] shadow-[rgba(0,0,0,0.04)_0_0.5px_0_0_inset]" : "rounded-full border-[#26262d] bg-[#15151b] text-[#f5f4f1] shadow-[rgba(0,0,0,0.04)_0_0.5px_0_0_inset] hover:border-[rgba(245,244,241,0.15)] hover:bg-[#15151b] hover:text-[#f5f4f1]"}`}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                title={accountLabel}
              >
                <span className="block min-w-0 truncate leading-[1.35]">{accountLabel}</span>
                <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-[#5f5f5d] max-[430px]:hidden" />
              </button>
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%-1px)] z-[140] w-[278px] origin-top-right rounded-[12px] rounded-tr-none border border-[#26262d] bg-[#0d0d11] p-1.5 pt-2 text-[#f5f4f1] shadow-[0_24px_64px_-36px_rgba(0,0,0,0.12),rgba(0,0,0,0.04)_0_0.5px_0_0_inset] animate-[accountMenuIn_0.16s_cubic-bezier(0.16,1,0.3,1)_both]"
                >
                  <div className="px-2.5 py-2.5">
                    <p className="m-0 truncate text-[14px] font-semibold leading-tight text-[#f5f4f1]">{accountLabel}</p>
                    {accountEmail && <p className="mt-1 mb-0 truncate text-[12px] leading-tight text-[#5f5f5d]">{accountEmail}</p>}
                  </div>
                  <div className="my-1 h-px bg-[rgba(245,244,241,0.04)]" />
                  {accountMenuItems.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex min-h-9 items-center rounded-[8px] px-2.5 py-2 text-[13px] font-medium text-[rgba(245,244,241,0.62)] no-underline transition-colors duration-150 hover:bg-[rgba(245,244,241,0.04)] hover:text-[#f5f4f1]"
                    >
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-[rgba(245,244,241,0.04)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="flex min-h-9 w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[rgba(245,244,241,0.62)] transition-colors duration-150 hover:bg-[rgba(245,244,241,0.04)] hover:text-[#f5f4f1]"
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
              className={loginButtonClass}
            >
              <span>{accountLabel}</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="bl-nav-menu-button relative ml-auto grid size-[34px] cursor-pointer place-items-center rounded-full border-0 bg-[rgba(245,244,241,0.06)] p-0 text-[#f5f4f1] outline-none transition-colors duration-150 hover:bg-[rgba(245,244,241,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]/35 lg:hidden"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          <span className="bl-nav-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        </div>
        <div
          className={`hidden overflow-hidden transition-[max-height,opacity,transform] duration-[640ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:block ${visibleDesktopPanel ? "max-h-[320px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"}`}
        >
          <div className="px-5 pb-5 pt-1">
            <div className="grid grid-cols-3 gap-4 px-0">
              {desktopPanelContent.items.map(item => {
                if (!item.href || item.disabled) {
                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="rounded-[12px] px-3 py-2 opacity-60"
                    >
                      <p className="m-0 text-[14px] font-semibold leading-tight text-[rgba(245,244,241,0.4)]">{item.label}</p>
                      <p className="mt-1 mb-0 text-[12px] leading-snug text-[rgba(245,244,241,0.32)]">{item.description}</p>
                    </div>
                  );
                }
                const active = item.href ? isRouteActive(pathname, item.href) : false;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setDesktopPanel(null);
                      setHoverDesktopPanel(null);
                    }}
                    className={`group block rounded-[12px] px-3 py-2 text-inherit no-underline transition-colors duration-150 ${active ? "bg-[rgba(124,92,255,0.10)]" : "hover:bg-[rgba(245,244,241,0.04)]"}`}
                  >
                    <p className={`m-0 text-[14px] font-semibold leading-tight ${active ? "text-[#a78bff]" : "text-[#f5f4f1]"}`}>{item.label}</p>
                    <p className="mt-1 mb-0 text-[12px] leading-snug text-[rgba(245,244,241,0.5)]">{item.description}</p>
                  </Link>
                );
              })}
            </div>
            <Link
              href={desktopPanelContent.viewAllHref}
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className="mt-3 inline-flex items-center gap-1 px-3 text-[12.5px] font-semibold text-[rgba(245,244,241,0.6)] no-underline transition-colors hover:text-[#f5f4f1]"
            >
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {menuVisible && (
        <div
          className="bl-mobile-menu fixed inset-x-0 top-[72px] bottom-0 z-[90] overflow-y-auto bg-[#0d0d11] text-[#f5f4f1] lg:hidden"
          style={{
            animation: menuClosing
              ? "mobileMenuOut 0.34s cubic-bezier(0.4,0,1,1) forwards"
              : "mobileMenuIn 0.42s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          <nav className="mx-auto flex min-h-full w-full max-w-[520px] flex-col px-6 py-8" aria-label="Mobile navigation">
            <div className="flex flex-col">
              {mobileMenuLinks.map((item, index) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className={`bl-mobile-menu-link bl-mobile-menu-item ${active ? "is-active" : ""}`}
                    style={{ animationDelay: menuClosing ? "0ms" : `${50 + index * 28}ms` }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {isLoginOpen && (
        <div className="bl-auth-layer">
          <button className="bl-auth-backdrop backdrop-blur-[64px]" type="button" aria-label="Close login" onClick={() => setIsLoginOpen(false)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="bl-auth-panel"
          >
            <div className="bl-auth-head">
              <div className="bl-auth-title-row">
                <div key={authMode} className="bl-auth-title-copy">
                  <h2 id="login-modal-title">{authMode === "signup" ? "Create account" : "Log in"}</h2>
                  <p>{authMode === "signup" ? "Save your setup and BrawlLens profile." : "Welcome back to BrawlLens."}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                className="bl-auth-close"
                aria-label="Close login"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className={`bl-auth-tabs ${authMode === "login" ? "is-login" : "is-create"}`}>
              {[
                { id: "signup" as const, label: "Create" },
                { id: "login" as const, label: "Log in" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAuthMode(item.id)}
                  className={authMode === item.id ? "is-active" : ""}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={`bl-auth-mode-body ${authMode === "login" ? "is-login" : "is-create"}`}>
              {loginState === "sent" && authMode === "signup" ? (
                <div className="bl-auth-sent">
                  <div className="bl-auth-sent-card">
                    <p>Check your inbox</p>
                    <small>
                      We sent a setup link to <strong className="font-semibold text-[#f5f4f1]">{loginEmail}</strong>. It opens BrawlLens setup.
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => void sendAuthRequest({ resend: true })}
                    disabled={loginResending}
                    className="bl-auth-secondary"
                  >
                    {loginResending ? "Sending again..." : "Didn't receive an email? Resend"}
                  </button>
                </div>
              ) : (
                <form onSubmit={submitLogin} className="bl-auth-form">
                  <label className="bl-auth-field">
                    <span>Email</span>
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
                      className="bl-auth-control"
                      placeholder="you@example.com"
                    />
                    <div className={`bl-auth-helper bl-auth-helper-${loginEmailStatus} ${authMode === "login" ? "is-hidden" : ""}`} aria-live={authMode === "signup" ? "polite" : "off"}>
                      <span className="bl-auth-rule-dot" aria-hidden="true">
                        {loginEmailStatus === "valid" ? "✓" : loginEmailStatus === "invalid" || loginEmailStatus === "format" ? "!" : ""}
                      </span>
                      <span>{loginEmailMessage}</span>
                    </div>
                  </label>
                  <label className="bl-auth-field">
                    <span>Password</span>
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
                      className="bl-auth-control"
                      placeholder="8+ characters, include a number"
                    />
                    <div className={`bl-auth-rules ${authMode === "login" ? "is-hidden" : ""}`}>
                      {loginPasswordRules.map(rule => (
                        <div key={rule.label} className={rule.passed ? "is-passed" : ""}>
                          <span className="bl-auth-rule-dot" aria-hidden="true">{rule.passed ? "✓" : ""}</span>
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={!canSubmitLogin}
                    className="bl-auth-submit"
                  >
                    {loginState === "sending" ? (authMode === "login" ? "Logging in..." : "Sending...") : authMode === "login" ? "Log in" : "Create account"}
                  </button>
                </form>
              )}
            </div>

            {loginError && (loginState === "error" || loginState === "sent") && (
              <p className="bl-auth-error" role="alert">
                {loginError}
              </p>
            )}

            <p className="bl-auth-legal">
              By continuing, you agree to the <Link href="/privacy" onClick={() => setIsLoginOpen(false)}>Privacy Policy</Link>.
            </p>
          </section>
        </div>
      )}

      <SearchOverlay />
    </>
  );
}
