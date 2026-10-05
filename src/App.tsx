import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  getApprovedWishes,
  isSupabaseConfigured,
  submitWish,
  type WishRecord,
} from './lib/supabase'

const navItems = [
  { label: 'Story', href: '#story' },
  { label: 'Details', href: '#details' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Wishes', href: '#wishes' },
]

const galleryImages = [
  '/assets/wedding/WhatsApp Image 2026-10-04 at 22.39.14.jpeg',
  '/assets/wedding/WhatsApp Image 2026-10-04 at 22.39.16.jpeg',
  '/assets/wedding/WhatsApp Image 2026-10-04 at 22.39.16 (1).jpeg',
  '/assets/wedding/WhatsApp Image 2026-10-04 at 22.39.16 (2).jpeg',
  '/assets/wedding/WhatsApp Image 2026-10-04 at 22.39.12 (2).jpeg',
]

const showcaseImages = [...galleryImages, ...galleryImages]

const weddingDate = new Date('2026-10-19T19:00:00+02:00')

const defaultGuestbookMessages: WishRecord[] = [
  {
    id: 'seed-your-childrens-paternal-uncle',
    name: 'Your children\'s paternal uncle : DAVID ADLY',
    message: 'I wish you a happy life, my lifelong friend. ❤️',
    created_at: '2026-10-03T19:19:21+00:00',
    approved: true,
  },
  {
    id: 'seed-mina-moussa',
    name: 'Mina Moussa',
    message: 'May you always find peace and happiness in each other\'s arms.',
    created_at: '2026-10-03T19:16:05+00:00',
    approved: true,
  },
]

function getTimeLeft(target: Date) {
  const difference = Math.max(target.getTime() - Date.now(), 0)

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

type WishFormState = {
  name: string
  message: string
}

function App() {
  const [opened, setOpened] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [countdown, setCountdown] = useState(() => getTimeLeft(weddingDate))
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [loadingWishes, setLoadingWishes] = useState(true)
  const [wishes, setWishes] = useState<WishRecord[]>([])
  const [wishError, setWishError] = useState<string | null>(null)
  const [wishSuccess, setWishSuccess] = useState<string | null>(null)
  const [isSubmittingWish, setIsSubmittingWish] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [wishForm, setWishForm] = useState<WishFormState>({ name: '', message: '' })

  const visibleWishes = [...defaultGuestbookMessages, ...wishes].filter(
    (wish) =>
      !(
        (wish.name === 'Verification Temp' && wish.message === 'Copilot browser verify') ||
        (wish.name === 'QA Verification' && wish.message === 'This is a real browser verification message.') ||
        (wish.name === 'sa' && wish.message === 'saa') ||
        (wish.name === 'Oct 5, 2026' && wish.message === 'Copilot browser verify')
      ),
  )

  useEffect(() => {
    const tick = window.setInterval(() => {
      setCountdown(getTimeLeft(weddingDate))
    }, 1000)

    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    const loadWishes = async () => {
      try {
        setLoadingWishes(true)
        const records = await getApprovedWishes()
        setWishes(records)
        setWishError(null)
      } catch (error) {
        setWishError(
          error instanceof Error ? error.message : 'Unable to load messages right now.',
        )
      } finally {
        setLoadingWishes(false)
      }
    }

    void loadWishes()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (galleryIndex === null) {
        return
      }

      if (event.key === 'Escape') {
        setGalleryIndex(null)
      }

      if (event.key === 'ArrowRight') {
        setGalleryIndex((current) =>
          current === null ? null : (current + 1) % galleryImages.length,
        )
      }

      if (event.key === 'ArrowLeft') {
        setGalleryIndex((current) =>
          current === null ? null : (current - 1 + galleryImages.length) % galleryImages.length,
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [galleryIndex])

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(weddingDate)
  }, [])

  const handleOpenInvitation = async () => {
    setOpened(true)

    const audio = audioRef.current
    if (!audio) return

    try {
      await audio.play()
      setMusicPlaying(true)
    } catch {
      setMusicPlaying(false)
    }
  }

  const handleToggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      try {
        await audio.play()
        setMusicPlaying(true)
      } catch {
        setMusicPlaying(false)
      }
      return
    }

    audio.pause()
    setMusicPlaying(false)
  }

  const handleWishSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setWishError(null)
    setWishSuccess(null)

    if (!wishForm.name.trim() || !wishForm.message.trim()) {
      setWishError('Please enter both your name and a short message.')
      return
    }

    setIsSubmittingWish(true)

    try {
      await submitWish({
        name: wishForm.name.trim(),
        message: wishForm.message.trim(),
      })

      setWishSuccess('Your message has been sent successfully.')
      setWishForm({ name: '', message: '' })
      const refreshed = await getApprovedWishes()
      setWishes(refreshed)
    } catch (error) {
      setWishError(
        error instanceof Error ? error.message : 'Something went wrong while sending your message.',
      )
    } finally {
      setIsSubmittingWish(false)
    }
  }

  const isBackendReady = isSupabaseConfigured
  const backendNotice = isBackendReady
    ? 'Live wishes are active.'
    : 'Live submissions will activate after the production Supabase credentials are connected.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4ede9_35%,#efe4d8_100%)] text-[#2a2725]">
      <audio ref={audioRef} src="/assets/beautiful-in-white.mp3" loop preload="auto" />

      <AnimatePresence>
        {!opened && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f]/85 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, transition: { duration: 0.7 } }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="invitation-card soft-border reference-intro w-full max-w-[760px] overflow-hidden rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,231,223,0.85))] p-5 sm:p-7"
            >
              <div className="reference-intro-inner relative space-y-5 text-center">
                <div className="floral-corner floral-corner-left" />
                <div className="floral-corner floral-corner-right" />
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 1, -1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#bb9a74] bg-[#5c3825] text-3xl text-[#f4ede8] shadow-[0_12px_30px_rgba(51,35,27,0.25)]"
                >
                  ♥
                </motion.div>

                <div className="intro-floral-crest" aria-hidden="true" />

                <h1 className="font-serif text-4xl tracking-[0.14em] text-[#2a231f] sm:text-5xl">
                  Michael
                </h1>
                <div className="text-2xl tracking-[0.08em] text-[#3f2f29]">&</div>
                <h2 className="font-serif text-4xl tracking-[0.14em] text-[#2a231f] sm:text-5xl">
                  Merrie
                </h2>
                <div className="mx-auto h-px w-32 bg-[#7b685c] opacity-60" />
                <div className="text-2xl tracking-[0.04em] text-[#3b2f2a] sm:text-[2rem]">
                  October 19, 2026
                </div>
                <p className="mx-auto max-w-md text-base text-[#544d49] sm:text-xl">
                  Cordially Invites
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void handleOpenInvitation()
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-[#5c3825] bg-[#5c3825] px-10 py-3 text-base font-medium uppercase tracking-[0.18em] text-[#f7f1ea] shadow-[0_16px_32px_rgba(92,56,37,0.3)] transition hover:-translate-y-0.5 hover:bg-[#4c2f22]"
                >
                  Open
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-[#e4d6c8] bg-[#f9f4f1]/80 backdrop-blur-md">
        <div className="section-shell flex items-center justify-between py-4">
          <a href="#top" className="font-serif text-xl tracking-[0.18em] text-[#362f2a]">Forever</a>
          <nav className="hidden items-center gap-7 text-sm uppercase tracking-[0.18em] text-[#584b44] md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-[#b8925d]">
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setNavOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c7b7] bg-white/60 text-[#382d29] md:hidden"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>

        {navOpen && (
          <div className="section-shell pb-4 md:hidden">
            <div className="soft-border rounded-2xl bg-[#fffdfb]/90 p-4 shadow-md">
              <div className="flex flex-col gap-3 text-sm uppercase tracking-[0.18em] text-[#584b44]">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className="rounded-xl px-2 py-2 transition hover:bg-[#f2e9e1]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="top" className="relative overflow-hidden">
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_55%)]" />
          <div className="church-backdrop" aria-hidden="true" />
          <div className="section-shell relative grid min-h-[720px] items-center py-12 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="reference-hero-copy relative z-10 order-2 mx-auto w-full max-w-[680px] text-center lg:order-1 lg:mx-0 lg:text-center"
            >
              <div className="mb-6 inline-flex rounded-full border border-[#d9c7b7] bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.45em] text-[#6c5851]">
                Save the Date
              </div>

              <div className="mb-8 text-xs uppercase tracking-[0.55em] text-[#6b544d]">
                We joyfully announce
                <div className="mt-3 text-[11px] tracking-[0.5em] text-[#6b544d]">
                  the wedding of our children
                </div>
              </div>

              <h1 className="font-serif text-5xl leading-[0.9] tracking-[0.14em] text-[#2b2927] sm:text-6xl lg:text-[5.5rem]">
                Michael
              </h1>
              <div className="my-4 text-3xl text-[#2b2927]">&</div>
              <h2 className="font-serif text-5xl leading-[0.9] tracking-[0.14em] text-[#2b2927] sm:text-6xl lg:text-[5.5rem]">
                Merrie
              </h2>

              <div className="mt-7 text-center text-[11px] uppercase tracking-[0.45em] text-[#6c564e]">
                Groom
              </div>
              <div className="mt-4 text-center text-[11px] uppercase tracking-[0.45em] text-[#6c564e]">
                Bride
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-center">
                <div className="rounded-2xl border border-[#ebdfd5] bg-[#fffdfb]/80 px-5 py-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#726761]">Date</div>
                  <div className="mt-2 font-serif text-xl text-[#322c29]">{dateLabel}</div>
                </div>
                <div className="rounded-2xl border border-[#ebdfd5] bg-[#fffdfb]/80 px-5 py-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#726761]">Time</div>
                  <div className="mt-2 font-serif text-xl text-[#322c29]">7:00 PM</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative order-1 mx-auto w-full max-w-xl lg:order-2"
            >
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle,_rgba(184,146,93,0.18),transparent_62%)]" />
              <div className="overflow-hidden rounded-[2.5rem] border border-white/50 bg-[#f5eee7] p-3 shadow-[0_30px_80px_rgba(77,61,49,0.18)]">
                <img
                  src={galleryImages[0]}
                  alt="Couple smiling together outdoors"
                  className="h-[620px] w-full rounded-[2rem] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="story" className="py-16 sm:py-20">
          <div className="section-shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="soft-border invitation-card rounded-[2rem] p-4 sm:p-6">
                <img
                  src={galleryImages[3]}
                  alt="The couple embracing outdoors at sunset"
                  className="h-[560px] w-full rounded-[1.5rem] object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="gold-line pb-5">
                <div className="text-xs uppercase tracking-[0.4em] text-[#8c6f4e]">Our Story</div>
                <h2 className="mt-4 font-serif text-4xl tracking-[0.08em] text-[#261f1d] sm:text-5xl">
                  A love that feels like home
                </h2>
              </div>
              <p className="text-lg leading-8 text-[#4d443f]">
                From quiet conversations to unforgettable laughter, our story has grown through every shared moment and every dream made together. We are grateful to celebrate this new chapter with the people who mean the most to us.
              </p>
              <p className="text-lg leading-8 text-[#4d443f]">
                Your presence will make the day even more special and fill our celebration with warmth, joy, and lasting memories.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="soft-border rounded-2xl bg-white/55 p-5">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#8c6f4e]">Ceremony</div>
                  <div className="mt-3 font-serif text-2xl text-[#2d2724]">Sunset Vows</div>
                </div>
                <div className="soft-border rounded-2xl bg-white/55 p-5">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#8c6f4e]">Reception</div>
                  <div className="mt-3 font-serif text-2xl text-[#2d2724]">Dinner & Dance</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="details" className="bg-[#f2e9e3]/70 py-16 sm:py-20">
          <div className="section-shell">
            <div className="mb-12 text-center">
              <div className="text-xs uppercase tracking-[0.42em] text-[#8a705b]">Wedding Day</div>
              <h2 className="mt-5 font-serif text-4xl tracking-[0.08em] text-[#241d1a] sm:text-5xl">Details</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: 'Wedding Date', value: dateLabel, note: 'A day we will remember forever' },
                { label: 'Ceremony', value: '7:00 PM', note: 'Garden ceremony with heartfelt vows' },
                { label: 'Venue', value: 'Wedding Garden', note: 'Open-air celebration and dinner' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="soft-border invitation-card rounded-[2rem] p-7 text-center"
                >
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[#8c6f4e]">{item.label}</div>
                  <div className="mt-4 font-serif text-3xl text-[#2e2826]">{item.value}</div>
                  <p className="mt-3 text-sm leading-7 text-[#584d49]">{item.note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="section-shell">
            <div className="soft-border invitation-card rounded-[2.5rem] p-6 sm:p-8 lg:p-12">
              <div className="mb-10 text-center">
                <div className="text-xs uppercase tracking-[0.42em] text-[#8a705b]">Countdown</div>
                <h2 className="mt-4 font-serif text-4xl tracking-[0.08em] text-[#241d1a] sm:text-5xl">We are counting down</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Days', value: countdown.days },
                  { label: 'Hours', value: countdown.hours },
                  { label: 'Minutes', value: countdown.minutes },
                  { label: 'Seconds', value: countdown.seconds },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.6rem] border border-[#e7d7c7] bg-[#fffdfb] p-5 text-center shadow-sm">
                    <div className="font-serif text-4xl text-[#2d2725] sm:text-5xl">{String(item.value).padStart(2, '0')}</div>
                    <div className="mt-3 text-[10px] uppercase tracking-[0.28em] text-[#766a64]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-[#f7f0eb] py-16 sm:py-20">
          <div className="section-shell">
            <div className="mb-10 text-center">
              <div className="text-xs uppercase tracking-[0.42em] text-[#8a705b]">Photo Gallery</div>
              <h2 className="mt-4 font-serif text-4xl tracking-[0.08em] text-[#241d1a] sm:text-5xl">Moments we treasure</h2>
            </div>

            <div className="photo-showcase soft-border rounded-[2rem] bg-[#fffdfb]/70 p-4 shadow-sm">
              <div className="photo-showcase-track">
                {showcaseImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setGalleryIndex(index % galleryImages.length)}
                    className="showcase-item group overflow-hidden rounded-[1.6rem] border border-[#eadfd4] bg-white p-2 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    aria-label={`Open gallery image ${(index % galleryImages.length) + 1}`}
                  >
                    <div className="overflow-hidden rounded-[1.15rem]">
                      <img
                        src={image}
                        alt={`Wedding gallery photo ${(index % galleryImages.length) + 1}`}
                        className="gallery-image h-64 w-full object-cover sm:h-72 md:h-80"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="section-shell grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="soft-border invitation-card rounded-[2.3rem] p-6">
              <img
                src={galleryImages[4]}
                alt="The couple together outdoors by the river"
                className="h-[460px] w-full rounded-[1.6rem] object-cover"
              />
            </div>

            <div className="space-y-6">
              <div className="soft-border rounded-[2rem] bg-white/60 p-6">
                <div className="font-serif text-3xl text-[#2f2925]">Wedding Reception Venue</div>
                <p className="mt-3 text-base leading-7 text-[#544d49]">At cathedral archangel Michael in aswan</p>
                <p className="mt-3 text-base leading-7 text-[#544d49]">Then at portosono hall</p>
              </div>
            </div>
          </div>
        </section>

        <section id="wishes" className="py-16 sm:py-20">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-xs uppercase tracking-[0.42em] text-[#8a705b]">Wishes</div>
              <h2 className="font-serif text-4xl tracking-[0.08em] text-[#241d1a] sm:text-5xl">Leave a message</h2>
              <p className="max-w-md text-lg leading-8 text-[#514943]">
                Your words will become part of our story. Share your love, prayers, and warm wishes for a beautiful new beginning.
              </p>

              <div className="soft-border rounded-[2rem] bg-white/60 p-4 text-sm text-[#4e433d]">
                {backendNotice}
              </div>

              <form onSubmit={handleWishSubmit} className="soft-border rounded-[2rem] bg-white/60 p-5">
                <div className="grid gap-4">
                  <input
                    value={wishForm.name}
                    onChange={(event) => setWishForm((current) => ({ ...current, name: event.target.value }))}
                    className="rounded-2xl border border-[#e3d6c8] bg-[#fffdfb] px-4 py-3 text-base text-[#2c2724] outline-none transition focus:border-[#b8925d]"
                    placeholder="Your name"
                  />
                  <textarea
                    value={wishForm.message}
                    onChange={(event) => setWishForm((current) => ({ ...current, message: event.target.value }))}
                    className="min-h-28 rounded-2xl border border-[#e3d6c8] bg-[#fffdfb] px-4 py-3 text-base text-[#2c2724] outline-none transition focus:border-[#b8925d]"
                    placeholder="Write your wish for the couple"
                  />

                  {wishError && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{wishError}</div>}
                  {wishSuccess && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{wishSuccess}</div>}

                  <button
                    type="submit"
                    disabled={isSubmittingWish || !isBackendReady}
                    className="inline-flex items-center justify-center rounded-full border border-[#b8925d] bg-[#b8925d] px-6 py-3 text-xs uppercase tracking-[0.24em] text-white transition hover:bg-[#a7804b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingWish ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="soft-border rounded-[2rem] bg-[#fffdfb]/85 p-6 sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="font-serif text-3xl text-[#2f2925]">Messages</h3>
                <span className="rounded-full border border-[#eadfd5] bg-[#f5eee9] px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[#6f605a]">
                  {visibleWishes.length} approved
                </span>
              </div>

              {loadingWishes ? (
                <div className="rounded-2xl border border-[#e7d7c7] bg-[#faf7f4] px-4 py-5 text-sm text-[#645953]">
                  Loading messages...
                </div>
              ) : visibleWishes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8cbbd] bg-[#faf8f6] px-4 py-8 text-center text-[#655d5b]">
                  No messages yet. Be the first to send a heartfelt wish.
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleWishes.map((wish) => (
                    <article key={wish.id} className="rounded-[1.6rem] border border-[#eadfd5] bg-[#fdfaf7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-serif text-xl text-[#2f2925]">{wish.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#84746c]">
                          {new Date(wish.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <p className="mt-3 leading-7 text-[#4c433e]">“{wish.message}”</p>
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5d7ca] bg-[#f6f1ee] py-8">
        <div className="section-shell flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <div className="font-serif text-2xl tracking-[0.14em] text-[#27211f]">Forever</div>
            <div className="mt-2 text-xs uppercase tracking-[0.28em] text-[#70615c]">With love and gratitude</div>
          </div>
          <div className="text-sm text-[#5a4f49]">We are so grateful to celebrate this milestone with you.</div>
        </div>
      </footer>

      <div className="section-shell pb-8 text-center text-base font-medium text-[#4a413d]">
        Your presence would be the greatest gift we could receive!
      </div>

      <button
        type="button"
        onClick={handleToggleMusic}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#d3bba1] bg-[#fffaf5] text-xl shadow-lg shadow-black/10 transition hover:scale-105"
        aria-label={musicPlaying ? 'Pause music' : 'Play music'}
      >
        {musicPlaying ? '❚❚' : '♫'}
      </button>

      <AnimatePresence>
        {galleryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0d]/90 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl"
            >
              <button
                type="button"
                onClick={() => setGalleryIndex(null)}
                className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#2b2726]"
                aria-label="Close gallery"
              >
                ×
              </button>

              <img
                src={galleryImages[galleryIndex]}
                alt="Wedding gallery enlarged"
                className="max-h-[82vh] w-full rounded-[1.5rem] object-contain"
              />

              <div className="mt-4 flex items-center justify-between gap-4 text-white">
                <button
                  type="button"
                  onClick={() =>
                    setGalleryIndex((current) =>
                      current === null ? null : (current - 1 + galleryImages.length) % galleryImages.length,
                    )
                  }
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.24em] backdrop-blur-sm"
                >
                  Prev
                </button>
                <div className="text-xs uppercase tracking-[0.28em] text-white/80">
                  {galleryIndex + 1} / {galleryImages.length}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryIndex((current) =>
                      current === null ? null : (current + 1) % galleryImages.length,
                    )
                  }
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.24em] backdrop-blur-sm"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
