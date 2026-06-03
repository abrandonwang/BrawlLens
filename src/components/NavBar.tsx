"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, LogOut, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import SearchOverlay from "./SearchOverlay";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import { authHeaders, clearAuthSession, clearServerSession, storeAuthSession } from "@/lib/clientAuth";
import type { PremiumUser } from "@/lib/premium";
import { isEmailFormatValid, useEmailCheck, type EmailCheckStatus } from "@/lib/useEmailCheck";

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
  { label: "Pro teams", href: "/leaderboards/pro", description: "Competitive rosters" },
];

const accountNavItems: NavPanelItem[] = [
  { label: "Settings", href: "/account", description: "Player tag, email, plan, status" },
];

type MobileMenuGroupKey = "tierlists" | "leaderboards" | "guides";

const mobileMenuGroups: Array<{
  key: MobileMenuGroupKey;
  label: string;
  items: Array<{ label: string; href: string }>;
}> = [
  {
    key: "tierlists",
    label: "Tierlists",
    items: [
      { label: "Brawlers", href: "/brawlers" },
      { label: "Maps", href: "/meta" },
    ],
  },
  {
    key: "leaderboards",
    label: "Leaderboards",
    items: [
      { label: "Players", href: "/leaderboards/players" },
      { label: "Clubs", href: "/leaderboards/clubs" },
      { label: "Brawler ranks", href: "/leaderboards/brawlers" },
      { label: "Pro teams", href: "/leaderboards/pro" },
    ],
  },
  {
    key: "guides",
    label: "Guides",
    items: [
      { label: "Guide hub", href: "/guides" },
      { label: "Progression", href: "/guides/progression" },
      { label: "Brawler wiki", href: "/guides/brawlers" },
      { label: "Map wiki", href: "/guides/maps" },
    ],
  },
] as const;

const loginButtonClass =
  "inline-flex h-[36px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent bg-[#7c5cff] px-3.5 text-[14px] font-semibold leading-none text-white no-underline shadow-none outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-150 [filter:none] [transform:none] hover:border-transparent hover:bg-[#7c5cff] hover:text-white hover:shadow-none hover:outline-none hover:[filter:none] hover:[transform:none] active:bg-[#7c5cff] active:shadow-none active:[transform:none] focus-visible:border-transparent focus-visible:bg-[#7c5cff] focus-visible:text-white focus-visible:shadow-none focus-visible:outline-none focus-visible:[filter:none] focus-visible:[transform:none]";

const authLayerClass =
  "fixed inset-0 z-[320] flex animate-[modalOverlayIn_180ms_ease_both] items-center justify-center px-[18px] py-6 max-[560px]:px-2.5 max-[560px]:py-5";

const authBackdropClass =
  "bl-auth-backdrop absolute inset-0 cursor-default overflow-hidden border-0 bg-[rgba(8,8,12,0.26)] backdrop-blur-[64px] [transform:translateZ(0)]";

const authPanelClass =
  "bl-auth-panel relative z-[1] w-[min(420px,calc(100vw-36px))] animate-[authPanelIn_220ms_cubic-bezier(0.16,1,0.3,1)_both] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.10)] p-[22px] text-[#f5f4f1] shadow-[rgba(255,255,255,0.06)_0_0.5px_0_0_inset,0_24px_64px_-20px_rgba(0,0,0,0.58)] [background:linear-gradient(180deg,rgba(34,34,42,0.96),rgba(20,20,27,0.96)),rgba(22,22,29,0.96)] max-[560px]:w-[calc(100vw-20px)] max-[560px]:rounded-[12px] max-[560px]:p-[18px]";

const authCloseClass =
  "grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent text-[rgba(245,244,241,0.72)] outline-none transition-colors duration-150 hover:bg-[rgba(245,244,241,0.06)] hover:text-[#f5f4f1] focus-visible:bg-[rgba(245,244,241,0.06)] focus-visible:text-[#f5f4f1]";

const authTabButtonClass = (active: boolean) =>
  `relative z-[1] h-[34px] cursor-pointer rounded-[7px] border-0 bg-transparent text-[12.5px] font-[680] outline-none transition-colors duration-[260ms] ${active ? "text-[#0d0d11] shadow-none hover:text-[#0d0d11] focus-visible:text-[#0d0d11]" : "text-[rgba(245,244,241,0.74)] hover:text-[rgba(245,244,241,0.9)] focus-visible:text-[rgba(245,244,241,0.9)]"}`;

const authFieldLabelClass = "text-[12px] font-[660] leading-none text-[rgba(245,244,241,0.74)]";
const authControlClass =
  "h-11 w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,12,0.50)] px-[13px] text-[13.5px] font-[560] leading-none text-[#f5f4f1] outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-[rgba(245,244,241,0.72)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(8,8,12,0.58)] focus:border-[rgba(167,139,255,0.46)] focus:bg-[rgba(8,8,12,0.66)] focus:shadow-[0_0_0_3px_rgba(124,92,255,0.12)] [font-family:var(--font-ui)]";

const authHintBaseClass = "flex min-h-[15px] items-center gap-[7px] text-[11px] font-[560] leading-[1.2]";
const authHintTransitionClass =
  "[transition:max-height_520ms_cubic-bezier(0.22,1,0.36,1),opacity_260ms_ease,transform_520ms_cubic-bezier(0.22,1,0.36,1)]";

function authHintToneClass(status: EmailCheckStatus) {
  if (status === "valid") return "text-[rgba(245,244,241,0.82)]";
  if (status === "format" || status === "invalid") return "text-[rgba(255,180,180,0.78)]";
  return "text-[rgba(245,244,241,0.74)]";
}

function authRuleDotClass(status: EmailCheckStatus | "passed") {
  const base = "grid size-3.5 shrink-0 place-items-center rounded-full border border-[rgba(245,244,241,0.16)] text-[9px] font-black leading-none text-transparent";
  if (status === "passed" || status === "valid") return `${base} border-[#f5f4f1] bg-[#f5f4f1] text-[#0d0d11]`;
  if (status === "format" || status === "invalid") return `${base} border-[rgba(255,180,180,0.55)] text-[rgba(255,180,180,0.9)]`;
  if (status === "checking") return `${base} animate-[authDotPulse_900ms_ease-in-out_infinite]`;
  return base;
}

const authActionBaseClass =
  "inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[10px] text-[13px] font-[720] outline-none transition-[background-color,border-color,color,opacity] duration-150";

type DesktopPanel = "browse" | "leaderboards" | "account";
type LoginState = "idle" | "sending" | "sent" | "error";
type AuthMode = "signup" | "login";
type AccountNavTab = "profile" | "appearance";
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
  const routePath = href.split(/[?#]/)[0] || "/";
  if (routePath === "/") return pathname === "/";
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

function isDesktopItemActive(pathname: string, href: string) {
  const [, rawHash] = href.split("#");
  if (rawHash) return false;
  return isRouteActive(pathname, href);
}

function activeMobileMenuGroup(pathname: string): MobileMenuGroupKey | null {
  return mobileMenuGroups.find(group => group.items.some(item => isRouteActive(pathname, item.href)))?.key ?? null;
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
  const [mobileOpenGroup, setMobileOpenGroup] = useState<MobileMenuGroupKey | null>(null);
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel | null>(null);
  const [hoverDesktopPanel, setHoverDesktopPanel] = useState<DesktopPanel | null>(null);
  const [suppressedDesktopPanel, setSuppressedDesktopPanel] = useState<DesktopPanel | null>(null);
  const [lastDesktopPanel, setLastDesktopPanel] = useState<DesktopPanel>("browse");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginResending, setLoginResending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | null>(null);
  const [accountTab, setAccountTab] = useState<AccountNavTab>("profile");
  const [isNavHidden, setIsNavHidden] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<number | null>(null);
  const desktopHoverTimerRef = useRef<number | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const bodyScrollLocked = isMenuOpen || menuClosing || isLoginOpen;

  const applyAccountUser = useCallback((user: PremiumUser | null) => {
    setIsSignedIn(Boolean(user));
    setAccountEmail(user?.email ?? null);
    const resolvedName = user?.accountSetup?.playerName
      ?? user?.displayName
      ?? (user?.accountSetup?.playerTag ? `#${user.accountSetup.playerTag}` : null);
    setAccountName(resolvedName);

    const tag = user?.accountSetup?.playerTag;
    if (user && tag && !user.accountSetup?.playerName) {
      fetch(`/api/player?tag=${encodeURIComponent(tag)}`)
        .then(res => res.ok ? res.json() : null)
        .then((player: { name?: string } | null) => {
          if (player?.name) setAccountName(player.name);
        })
        .catch(() => {});
    }
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
      setMobileOpenGroup(null);
      menuCloseTimerRef.current = null;
    }, 260);
  }, [isMenuOpen, menuClosing]);

  const showLogin = useCallback((mode: AuthMode = "signup", redirectTo: string | null = null) => {
    closeMenu();
    setDesktopPanel(null);
    setHoverDesktopPanel(null);
    setSuppressedDesktopPanel(null);
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

  // Hide-on-scroll: tuck the nav out of the way when scrolling down past a
  // small threshold; reveal again on scroll-up or near the top.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isMenuOpen || menuClosing || isLoginOpen) return;

    let lastY = window.scrollY;
    let frame = 0;
    const REVEAL_AT_TOP = 80;
    const HIDE_DELTA = 8;
    const SHOW_DELTA = 4;

    const update = () => {
      frame = 0;
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY <= REVEAL_AT_TOP) {
        setIsNavHidden(false);
      } else if (delta > HIDE_DELTA) {
        setIsNavHidden(true);
      } else if (delta < -SHOW_DELTA) {
        setIsNavHidden(false);
      }

      lastY = currentY;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isMenuOpen, menuClosing, isLoginOpen]);

  // Always reveal when any modal/menu opens so users can dismiss it.
  useEffect(() => {
    if (isMenuOpen || menuClosing || isLoginOpen) setIsNavHidden(false);
  }, [isMenuOpen, menuClosing, isLoginOpen]);

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
    function syncAccountTab() {
      const params = new URLSearchParams(window.location.search);
      setAccountTab(params.get("tab") === "appearance" ? "appearance" : "profile");
    }

    syncAccountTab();
    window.addEventListener("popstate", syncAccountTab);
    window.addEventListener("brawllens:account-tab-change", syncAccountTab);
    return () => {
      window.removeEventListener("popstate", syncAccountTab);
      window.removeEventListener("brawllens:account-tab-change", syncAccountTab);
    };
  }, [pathname]);

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
    setMobileOpenGroup(activeMobileMenuGroup(pathname) ?? "tierlists");
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

  function openHoverDesktopPanel(panel: DesktopPanel) {
    if (suppressedDesktopPanel === panel) return;
    clearDesktopHoverTimer();
    setHoverDesktopPanel(panel);
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
  const isTierlistRoute = pathname === "/brawlers" || pathname.startsWith("/brawlers/") || pathname === "/meta" || pathname.startsWith("/meta/");
  const browseActive = browseItems.some(item => item.href && isDesktopItemActive(pathname, item.href));
  const leaderboardsActive = isPlayerRoute || leaderboardItems.some(item => item.href && isDesktopItemActive(pathname, item.href));
  const accountActive = pathname.startsWith("/account");
  const accountDesktopItems = accountNavItems.map(item =>
    item.href === "/account?tab=profile" && accountEmail
      ? { ...item, description: accountEmail }
      : item
  );
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
  const visibleDesktopPanel = hoverDesktopPanel ?? desktopPanel;
  const renderedDesktopPanel = visibleDesktopPanel ?? lastDesktopPanel;
  const desktopPanelContent = renderedDesktopPanel === "leaderboards"
    ? { items: leaderboardItems }
    : renderedDesktopPanel === "account"
      ? { items: accountDesktopItems }
      : { items: browseItems };
  const navTextClass = (active: boolean) =>
    `relative inline-flex h-[36px] items-center rounded-full border-0 px-3 text-[13px] font-semibold leading-none tracking-normal no-underline outline-none transition-colors duration-150 text-[rgba(250,250,248,0.90)] hover:text-[#ffffff] hover:bg-[rgba(245,244,241,0.07)] focus-visible:text-[#ffffff] ${active ? "text-[#ffffff] bg-[rgba(124,92,255,0.16)]" : ""}`;

  function isAccountNavItemActive(href: string) {
    if (!href.startsWith("/account")) return isRouteActive(pathname, href);
    const [, rawQuery] = href.split("?");
    const tab = new URLSearchParams(rawQuery ?? "").get("tab") === "appearance" ? "appearance" : "profile";
    return accountActive && tab === accountTab;
  }

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

  return (
    <>
      <nav
        data-nav-hidden={isNavHidden ? "true" : undefined}
        className="bl-nav-scroll-hide fixed left-1/2 top-4 z-[500] w-[70vw] max-w-[1200px] -translate-x-1/2 overflow-visible rounded-[20px] border border-[rgba(255,255,255,0.36)] bg-[rgba(13,13,17,0.92)] text-[#f5f4f1] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.18),0_0_32px_rgba(255,255,255,0.34),0_0_72px_-12px_rgba(255,255,255,0.22),0_20px_52px_-22px_rgba(0,0,0,0.88)] backdrop-blur-xl backdrop-saturate-150 [font-family:var(--font-ui)] max-lg:w-[calc(100%-20px)]"
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
            className="group/nav-popover nav-popover relative"
            data-open={visibleDesktopPanel === "browse" ? "true" : undefined}
            onPointerEnter={() => openHoverDesktopPanel("browse")}
            onMouseEnter={() => openHoverDesktopPanel("browse")}
          >
            <Link
              href="/brawlers"
              onFocus={() => openHoverDesktopPanel("browse")}
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className={`${navTextClass(browseActive)} cursor-pointer gap-1.5`}
            >
              Tierlist &amp; Brawlers
              <ChevronDown size={13} strokeWidth={2.25} className={`ml-0.5 text-[rgba(250,250,248,0.86)] transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${visibleDesktopPanel === "browse" ? "rotate-180" : "rotate-0"}`} />
            </Link>
          </div>
          <div
            className="group/nav-popover nav-popover relative"
            data-open={visibleDesktopPanel === "leaderboards" ? "true" : undefined}
            onPointerEnter={() => openHoverDesktopPanel("leaderboards")}
            onMouseEnter={() => openHoverDesktopPanel("leaderboards")}
          >
            <Link
              href="/leaderboards/players"
              onFocus={() => openHoverDesktopPanel("leaderboards")}
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className={`${navTextClass(leaderboardsActive)} cursor-pointer gap-1.5`}
            >
              Leaderboards
              <ChevronDown size={13} strokeWidth={2.25} className={`ml-0.5 text-[rgba(250,250,248,0.86)] transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${visibleDesktopPanel === "leaderboards" ? "rotate-180" : "rotate-0"}`} />
            </Link>
          </div>
          <Link
            href="/ask"
            onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
            className={`${navTextClass(pathname.startsWith("/ask"))} cursor-pointer`}
          >
            Ask AI
          </Link>
        </div>

        <div className="relative z-10 ml-auto hidden min-w-0 shrink-0 items-center justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={() => openSearchOverlay()}
            className="inline-flex h-[36px] items-center gap-2 rounded-[10px] border-0 bg-[rgba(245,244,241,0.07)] px-3.5 text-[rgba(250,250,248,0.90)] outline-none transition-colors hover:bg-[rgba(245,244,241,0.11)] hover:text-[#ffffff]"
            aria-label="Open search"
            title="Search (⌘K)"
          >
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <span className="text-[14px] font-medium leading-none tracking-[-0.01em]">⌘K</span>
          </button>
          <span aria-hidden="true" className="h-5 w-px bg-[rgba(245,244,241,0.12)]" />
          {isSignedIn ? (
            <Link
              href="/account"
              onClick={() => { setDesktopPanel(null); setHoverDesktopPanel(null); }}
              className={`${navTextClass(accountActive)} max-w-[220px] cursor-pointer`}
              title={accountLabel}
            >
              <span className="min-w-0 truncate">{accountLabel}</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className={loginButtonClass}
              >
                <span>{accountLabel}</span>
              </button>
            </>
          )}
        </div>
          <button
            type="button"
            className="relative ml-auto grid size-[34px] cursor-pointer place-items-center overflow-hidden rounded-[8px] border-0 bg-[var(--bt-shell)] p-0 text-[var(--bt-text-2)] shadow-none outline-none transition-colors duration-150 hover:bg-[var(--bt-panel)] hover:text-[var(--bt-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]/35 lg:hidden"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          <span className="relative block h-[14px] w-[18px]" aria-hidden="true">
            <span className={`absolute left-0 block h-0.5 w-[18px] origin-center rounded-full bg-current transition-[top,opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? "top-[6px] rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-[6px] block h-0.5 w-[18px] origin-center rounded-full bg-current transition-[top,opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? "scale-x-[0.35] opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 block h-0.5 w-[18px] origin-center rounded-full bg-current transition-[top,opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? "top-[6px] -rotate-45" : "top-[12px]"}`} />
          </span>
        </button>
        </div>
        <div
          className={`hidden overflow-hidden transition-[max-height,opacity,transform] duration-[640ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:block ${visibleDesktopPanel ? "max-h-[220px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"}`}
        >
          <div className="px-5 pb-4 pt-1">
            <div
              className="grid gap-4 px-0"
              style={{ gridTemplateColumns: renderedDesktopPanel === "account" ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))" }}
            >
              {desktopPanelContent.items.map(item => {
                if (!item.href || item.disabled) {
                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="rounded-[12px] px-3 py-2 opacity-60"
                    >
                      <p className="m-0 text-[14px] font-semibold leading-tight text-[rgba(245,244,241,0.72)]">{item.label}</p>
                      <p className="mt-1 mb-0 text-[12px] leading-snug text-[rgba(245,244,241,0.68)]">{item.description}</p>
                    </div>
                  );
                }
                const active = item.href
                  ? renderedDesktopPanel === "account"
                    ? isAccountNavItemActive(item.href)
                    : isRouteActive(pathname, item.href)
                  : false;
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
                    <p className="mt-1 mb-0 text-[12px] leading-snug text-[rgba(245,244,241,0.74)]">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {menuVisible && (
        <div
          className="fixed inset-0 top-0 z-[90] min-h-dvh overflow-y-auto bg-[rgba(13,13,17,0.92)] text-[var(--bt-text)] shadow-none backdrop-blur-[18px] backdrop-saturate-[110%] lg:hidden"
          style={{
            animation: menuClosing
              ? "mobileMenuOut 0.34s cubic-bezier(0.4,0,1,1) forwards"
              : "mobileMenuIn 0.42s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          <nav className="mx-auto flex min-h-full w-full max-w-[520px] flex-col px-6 pb-8 pt-[104px]" aria-label="Mobile navigation">
            <div className="flex flex-col">
              {mobileMenuGroups.map((group, index) => {
                const expanded = mobileOpenGroup === group.key;
                const groupActive = group.items.some(item => isRouteActive(pathname, item.href));
                return (
                  <div
                    key={group.key}
                    className="animate-[mobileMenuItemIn_0.34s_cubic-bezier(0.16,1,0.3,1)_both] border-b border-[rgba(245,244,241,0.07)]"
                    style={{ animationDelay: menuClosing ? "0ms" : `${50 + index * 34}ms` }}
                  >
                    <button
                      type="button"
                      className={`flex min-h-[58px] w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left text-[22px] font-[680] leading-none outline-none transition-colors duration-150 hover:text-[#a78bff] focus-visible:text-[#a78bff] focus-visible:outline-none ${expanded || groupActive ? "text-[#a78bff]" : "text-[var(--bt-text-2)]"}`}
                      aria-expanded={expanded}
                      onClick={() => setMobileOpenGroup(current => current === group.key ? null : group.key)}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        size={20}
                        strokeWidth={2.2}
                        className={`text-current transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded && (
                      <div className="grid gap-0 pb-3">
                        {group.items.map(item => {
                          const active = isRouteActive(pathname, item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMenu}
                              className={`flex min-h-[42px] items-center justify-start text-[17px] font-[620] leading-none no-underline outline-none transition-colors duration-150 hover:text-[#a78bff] focus-visible:text-[#a78bff] focus-visible:outline-none ${active ? "text-[#a78bff]" : "text-[rgba(245,244,241,0.86)]"}`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div
                className="animate-[mobileMenuItemIn_0.34s_cubic-bezier(0.16,1,0.3,1)_both] border-b border-[rgba(245,244,241,0.07)]"
                style={{ animationDelay: menuClosing ? "0ms" : `${50 + mobileMenuGroups.length * 34}ms` }}
              >
                <Link
                  href="/ask"
                  onClick={closeMenu}
                  className={`flex min-h-[58px] items-center justify-start text-[22px] font-[680] leading-none no-underline outline-none transition-colors duration-150 hover:text-[#ffffff] focus-visible:text-[#ffffff] focus-visible:outline-none ${pathname.startsWith("/ask") ? "text-[#ffffff]" : "text-[rgba(250,250,248,0.92)]"}`}
                >
                  Ask AI
                </Link>
              </div>
              <div
                className="animate-[mobileMenuItemIn_0.34s_cubic-bezier(0.16,1,0.3,1)_both] border-b border-[rgba(245,244,241,0.07)] py-4"
                style={{ animationDelay: menuClosing ? "0ms" : `${50 + (mobileMenuGroups.length + 1) * 34}ms` }}
              >
                {isSignedIn ? (
                  <div className="grid gap-3">
                    <p className="m-0 truncate text-[22px] font-[680] leading-none text-[#a78bff]">{accountLabel}</p>
                    <div className="grid gap-0">
                      {accountNavItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href ?? "/account"}
                          onClick={closeMenu}
                          className={`flex min-h-[42px] items-center justify-start text-[17px] font-[620] leading-none no-underline outline-none transition-colors duration-150 hover:text-[#a78bff] focus-visible:text-[#a78bff] focus-visible:outline-none ${item.href && isAccountNavItemActive(item.href) ? "text-[#a78bff]" : "text-[rgba(245,244,241,0.86)]"}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={signOut}
                        className="mt-2 inline-flex min-h-[42px] w-fit cursor-pointer items-center gap-2 rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(245,244,241,0.04)] px-3 text-[15px] font-[680] leading-none text-[rgba(245,244,241,0.78)] outline-none transition-colors duration-150 hover:border-[rgba(245,244,241,0.14)] hover:bg-[rgba(245,244,241,0.07)] hover:text-[#f5f4f1] focus-visible:border-[rgba(245,244,241,0.14)] focus-visible:bg-[rgba(245,244,241,0.07)] focus-visible:text-[#f5f4f1]"
                      >
                        <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openLogin}
                    className="inline-flex h-11 w-fit cursor-pointer items-center rounded-[10px] border-0 bg-[#f5f4f1] px-4 text-[14px] font-[760] leading-none text-[#0d0d11] outline-none transition-colors duration-150 hover:bg-[rgba(245,244,241,0.88)] focus-visible:bg-[rgba(245,244,241,0.88)]"
                  >
                    Log in
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}

      {isLoginOpen && (
        <div className={authLayerClass}>
          <button className={authBackdropClass} type="button" aria-label="Close login" onClick={() => setIsLoginOpen(false)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className={authPanelClass}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div key={authMode} className="min-w-0 animate-[authTitleIn_340ms_cubic-bezier(0.22,1,0.36,1)_both]">
                  <h2 id="login-modal-title" className="m-0 text-[20px] font-[760] leading-none text-[#f5f4f1] max-[560px]:text-[19px]">
                    {authMode === "signup" ? "Create account" : "Log in"}
                  </h2>
                  <p className="mb-0 mt-1.5 text-[12.5px] font-medium leading-[1.35] text-[rgba(245,244,241,0.74)] max-[560px]:max-w-[260px]">
                    {authMode === "signup" ? "Save your setup and BrawlLens profile." : "Welcome back to BrawlLens."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                className={authCloseClass}
                aria-label="Close login"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className={`bl-auth-tabs relative isolate mt-5 grid grid-cols-2 gap-[3px] overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,12,0.45)] p-[3px] ${authMode === "login" ? "is-login" : ""}`}>
              {[
                { id: "signup" as const, label: "Create" },
                { id: "login" as const, label: "Log in" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAuthMode(item.id)}
                  className={authTabButtonClass(authMode === item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="animate-[authModeBodyIn_360ms_cubic-bezier(0.22,1,0.36,1)_both]">
              {loginState === "sent" && authMode === "signup" ? (
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,12,0.42)] p-[15px]">
                    <p className="m-0 text-[14px] font-[760] leading-[1.1] text-[#f5f4f1]">Check your inbox</p>
                    <small className="mt-[7px] block text-[12.5px] font-medium leading-[1.45] text-[rgba(245,244,241,0.74)]">
                      We sent a setup link to <strong className="font-semibold text-[#f5f4f1]">{loginEmail}</strong>. It opens BrawlLens setup.
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => void sendAuthRequest({ resend: true })}
                    disabled={loginResending}
                    className={`${authActionBaseClass} border border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,12,0.38)] text-[rgba(245,244,241,0.82)] hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(245,244,241,0.055)] hover:text-[#f5f4f1] focus-visible:border-[rgba(255,255,255,0.14)] focus-visible:bg-[rgba(245,244,241,0.055)] focus-visible:text-[#f5f4f1] disabled:cursor-wait disabled:opacity-[0.58]`}
                  >
                    {loginResending ? "Sending again..." : "Didn't receive an email? Resend"}
                  </button>
                </div>
              ) : (
                <form onSubmit={submitLogin} className="mt-5 grid gap-3.5">
                  <label className="grid gap-2">
                    <span className={authFieldLabelClass}>Email</span>
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
                      className={authControlClass}
                      placeholder="you@example.com"
                    />
                    <div
                      className={`${authHintBaseClass} ${authHintTransitionClass} overflow-hidden ${authHintToneClass(loginEmailStatus)} ${authMode === "login" ? "pointer-events-none max-h-0 -translate-y-1 opacity-0" : "max-h-[18px] translate-y-0 opacity-100"}`}
                      aria-live={authMode === "signup" ? "polite" : "off"}
                    >
                      <span className={authRuleDotClass(loginEmailStatus)} aria-hidden="true">
                        {loginEmailStatus === "valid" ? "✓" : loginEmailStatus === "invalid" || loginEmailStatus === "format" ? "!" : ""}
                      </span>
                      <span>{loginEmailMessage}</span>
                    </div>
                  </label>
                  <label className="grid gap-2">
                    <span className={authFieldLabelClass}>Password</span>
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
                      className={authControlClass}
                      placeholder="8+ characters, include a number"
                    />
                    <div
                      className={`grid gap-[5px] overflow-hidden ${authHintTransitionClass} ${authMode === "login" ? "pointer-events-none max-h-0 -translate-y-1 opacity-0" : "max-h-10 translate-y-0 opacity-100"}`}
                    >
                      {loginPasswordRules.map(rule => (
                        <div key={rule.label} className={`${authHintBaseClass} ${rule.passed ? "text-[rgba(245,244,241,0.82)]" : "text-[rgba(245,244,241,0.74)]"}`}>
                          <span className={authRuleDotClass(rule.passed ? "passed" : "idle")} aria-hidden="true">{rule.passed ? "✓" : ""}</span>
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={!canSubmitLogin}
                    className={`${authActionBaseClass} mt-0.5 border-0 bg-[#f5f4f1] text-[#0d0d11] hover:bg-[rgba(245,244,241,0.88)] focus-visible:bg-[rgba(245,244,241,0.88)] disabled:cursor-not-allowed disabled:opacity-[0.34]`}
                  >
                    {loginState === "sending" ? (authMode === "login" ? "Logging in..." : "Sending...") : authMode === "login" ? "Log in" : "Create account"}
                  </button>
                </form>
              )}
            </div>

            {loginError && (loginState === "error" || loginState === "sent") && (
              <p className="mb-0 mt-3.5 rounded-[10px] border border-[rgba(255,180,180,0.16)] bg-[rgba(255,102,102,0.055)] px-3 py-2.5 text-[12px] font-[560] leading-[1.45] text-[rgba(255,210,210,0.78)]" role="alert">
                {loginError}
              </p>
            )}

            <p className="mb-0 mt-[18px] text-center text-[11px] font-medium leading-normal text-[rgba(245,244,241,0.66)]">
              By continuing, you agree to the{" "}
              <Link
                href="/privacy"
                onClick={() => setIsLoginOpen(false)}
                className="text-[rgba(245,244,241,0.78)] underline underline-offset-[3px] hover:text-[#f5f4f1]"
              >
                Privacy Policy
              </Link>.
            </p>
          </section>
        </div>
      )}

      <SearchOverlay />
    </>
  );
}
