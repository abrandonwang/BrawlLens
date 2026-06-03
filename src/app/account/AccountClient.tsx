"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, LogOut, Pencil } from "lucide-react"
import { authHeaders, clearAuthSession, clearServerSession, storeAuthSession } from "@/lib/clientAuth"
import type { PremiumUser } from "@/lib/premium"
import { sanitizePlayerTag } from "@/lib/validation"

type LoadState = "loading" | "ready" | "signed-out" | "error"
type SaveState = "idle" | "saving" | "saved" | "error"

type AuthMePayload = {
  user?: PremiumUser | null
  session?: { accessToken?: string; refreshToken?: string; expiresAt?: number } | null
}

function LoadingState() {
  return <main className="bl-acct-shell" aria-busy="true" />
}

function SignedOutState() {
  return (
    <main className="bl-acct-shell">
      <section className="bl-acct-card">
        <h1>Sign in required</h1>
        <p>Log in to view your profile.</p>
        <Link href="/?auth=login&next=/account" className="bl-acct-primary">Log in</Link>
      </section>
    </main>
  )
}

export default function AccountClient() {
  const router = useRouter()
  const [state, setState] = useState<LoadState>("loading")
  const [user, setUser] = useState<PremiumUser | null>(null)
  const [editingTag, setEditingTag] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [tagSaveState, setTagSaveState] = useState<SaveState>("idle")
  const [tagError, setTagError] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: authHeaders(),
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        })
        if (response.status === 401) {
          clearAuthSession()
          setState("signed-out")
          return
        }
        if (!response.ok) {
          setState("error")
          return
        }
        const payload = (await response.json()) as AuthMePayload
        if (payload.session?.accessToken) {
          storeAuthSession({
            accessToken: payload.session.accessToken,
            refreshToken: payload.session.refreshToken,
            expiresAt: payload.session.expiresAt,
          })
        }
        setUser(payload.user ?? null)
        setState(payload.user ? "ready" : "signed-out")
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Account load failed:", error)
        setState("error")
      }
    })()

    // Fallback: if nothing resolves within 8s, surface error so the page
    // never sits on an empty loading screen.
    const timer = window.setTimeout(() => {
      setState(current => (current === "loading" ? "error" : current))
    }, 8000)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const tag = user?.accountSetup?.playerTag
    setTagInput(tag ? `#${tag}` : "")
  }, [user?.accountSetup?.playerTag])

  const cleanTag = useMemo(() => sanitizePlayerTag(tagInput), [tagInput])
  const savedTag = user?.accountSetup?.playerTag ?? ""
  const tagDirty = Boolean(cleanTag && cleanTag !== savedTag)

  async function saveTag() {
    if (!user) return
    if (!cleanTag) {
      setTagSaveState("error")
      setTagError("Use a valid tag like #YP90U0YL.")
      return
    }
    if (!tagDirty) {
      setEditingTag(false)
      return
    }
    setTagSaveState("saving")
    setTagError("")

    const response = await fetch("/api/account/setup", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        playerTag: cleanTag,
        playerName: user.accountSetup?.playerName ?? user.displayName ?? null,
        region: user.accountSetup?.region ?? "Global",
        goals: user.accountSetup?.goals ?? [],
      }),
    }).catch(() => null)

    if (!response) {
      setTagSaveState("error")
      setTagError("Could not save right now.")
      return
    }
    if (response.status === 401) {
      clearAuthSession()
      setState("signed-out")
      return
    }
    const payload = (await response.json().catch(() => null)) as {
      setup?: PremiumUser["accountSetup"]
      displayName?: string | null
      error?: string
    } | null
    if (!response.ok) {
      setTagSaveState("error")
      setTagError(payload?.error === "invalid_player_tag" ? "Use a valid tag like #YP90U0YL." : "Could not save right now.")
      return
    }

    const nextTag = payload?.setup?.playerTag ?? cleanTag
    setUser(current => {
      if (!current) return current
      return {
        ...current,
        displayName: payload?.displayName ?? current.displayName,
        accountSetup: payload?.setup ?? {
          ...(current.accountSetup ?? {}),
          playerTag: nextTag,
          region: current.accountSetup?.region ?? "Global",
          goals: current.accountSetup?.goals ?? [],
        },
      }
    })
    setTagInput(`#${nextTag}`)
    setTagSaveState("saved")
    setEditingTag(false)
  }

  function cancelEdit() {
    setTagInput(savedTag ? `#${savedTag}` : "")
    setEditingTag(false)
    setTagSaveState("idle")
    setTagError("")
  }

  function signOut() {
    clearAuthSession()
    clearServerSession().finally(() => router.replace("/?auth=login"))
  }

  if (state === "loading") return <LoadingState />
  if (state === "signed-out") return <SignedOutState />

  if (state === "error" || !user) {
    return (
      <main className="bl-acct-shell">
        <section className="bl-acct-card">
          <h1>Account did not load</h1>
          <p>Try signing in again.</p>
        </section>
      </main>
    )
  }

  const playerName = user.accountSetup?.playerName ?? user.displayName ?? "—"
  const displayTag = savedTag ? `#${savedTag}` : "—"

  return (
    <main className="bl-acct-shell">
      <section className="bl-acct-card">
        <header className="bl-acct-head">
          <h1>Settings</h1>
          <button type="button" onClick={signOut} className="bl-acct-signout" aria-label="Sign out">
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </header>

        <dl className="bl-acct-list">
          <div className="bl-acct-row">
            <dt>Player name</dt>
            <dd>{playerName}</dd>
          </div>

          <div className="bl-acct-row">
            <dt>Player tag</dt>
            <dd>
              {editingTag ? (
                <div className="bl-acct-tag-edit">
                  <input
                    autoFocus
                    value={tagInput}
                    onChange={event => {
                      setTagInput(event.target.value.toUpperCase())
                      setTagSaveState("idle")
                      setTagError("")
                    }}
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void saveTag()
                      } else if (event.key === "Escape") {
                        event.preventDefault()
                        cancelEdit()
                      }
                    }}
                    placeholder="#YP90U0YL"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="bl-acct-input"
                  />
                  <button
                    type="button"
                    onClick={() => void saveTag()}
                    disabled={tagSaveState === "saving"}
                    className="bl-acct-tag-save"
                  >
                    <Check size={13} strokeWidth={2.4} aria-hidden="true" />
                    {tagSaveState === "saving" ? "Saving" : "Save"}
                  </button>
                  <button type="button" onClick={cancelEdit} className="bl-acct-tag-cancel">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="bl-acct-tag-view">
                  <span>{displayTag}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTag(true)
                      setTagSaveState("idle")
                    }}
                    className="bl-acct-edit-btn"
                    aria-label="Edit player tag"
                  >
                    <Pencil size={12} strokeWidth={2.4} aria-hidden="true" />
                    Edit
                  </button>
                </div>
              )}
              {editingTag && tagError && <p className="bl-acct-error">{tagError}</p>}
            </dd>
          </div>

          <div className="bl-acct-row">
            <dt>Email</dt>
            <dd>{user.email ?? "—"}</dd>
          </div>

        </dl>
      </section>
    </main>
  )
}
