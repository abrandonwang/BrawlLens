"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API)

export async function sendContactEmail(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const message = formData.get("message") as string

    if (!name || !email || !message) {
        return { error: "All fields are required." }
    }

    try {
        await resend.emails.send({
            from: "BrawlLens Contact <onboarding@resend.dev>",
            to: "abrandonwang@gmail.com",
            subject: `BrawlLens: Message from ${name}`,
            text: `From: ${name} <${email}>\n\n${message}`,
        })
        return { success: true }
    } catch {
        return { error: "Failed to send. Please try again." }
    }
}
