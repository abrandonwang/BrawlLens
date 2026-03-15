export default function About() {
    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
            <aside className="sticky top-20 hidden lg:block border-r border-white/6">
                <nav className="flex flex-col gap-4 text-sm text-white/50">
                    <a href="#privacy-policy" className="hover:text-white/80 transition-colors">Privacy Policy</a>
                    <a href="#contact" className="hover:text-white/80 transition-colors">Contact</a>
                </nav>
            </aside>

            <main className="flex flex-col gap-3">
                <section id="privacy-policy">
                    <h1 className="text-3xl font-bold text-white mb-4">BrawlLens Privacy Policy</h1>

                    <div className="rounded-xl bg-[#1c1c1f] overflow-hidden flex mb-6">
                        <div className="w-1 bg-blue-500 shrink-0" />
                        <p className="px-10 py-10 text-base text-white/50">
                            This privacy policy has been compiled to better serve those who are concerned with how their Personally Identifiable Information is being used online. Please read our privacy policy carefully to get a clear understanding of how we collect, use, protect or otherwise handle your Personally Identifiable Information in accordance with our website.
                        </p>
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-3">Information We Collect</h2>
                    <ul className="list-disc list-inside text-white/50 mb-4">
                        <li>Player tags and profile icons when you save your profile.</li>
                        <li>Usage data to improve our services.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-white mb-3">How We Use Your Information</h2>
                    <ul className="list-disc list-inside text-white/50 mb-4">
                        <li>To fetch and display your Brawl Stars stats.</li>
                        <li>To personalize your experience on our site.</li>
                        <li>To communicate updates and important information.</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-white mb-3">Data Security</h2>
                    <p className="text-white/50 mb-4">We implement security measures to protect your information, but please be aware that no method of transmission over the internet is 100% secure.</p>

                    <h2 className="text-2xl font-semibold text-white mb-3">Third-Party Services</h2>
                    <p className="text-white/50 mb-4">We do not share your information with third parties, except as necessary to provide our services or comply with legal obligations.</p>

                    <h2 className="text-2xl font-semibold text-white mb-3">Changes to This Policy</h2>
                    <p className="text-white/50 mb-4">We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
                </section>

                <section id="contact">
                    <h2 className="text-2xl font-semibold text-white mb-3">Contact Us</h2>
                    <p className="text-white/50">If you have any questions about this privacy policy, please contact us at <a href="mailto:privacy@brawllens.com" className="text-blue-400 hover:text-blue-300 transition-colors">privacy@brawllens.com</a>.</p>
                </section>
            </main>
        </div>
    )
}
