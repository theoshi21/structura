import type { Metadata } from 'next'
import { Yeseva_One, Open_Sans } from 'next/font/google'
import './globals.css'

/**
 * Loads the Yeseva One font for headings.
 * Exposed as a CSS variable for use in Tailwind's font-heading utility.
 */
const yesevaOne = Yeseva_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-yeseva',
  display: 'swap',
})

/**
 * Loads Open Sans for body text.
 * Exposed as a CSS variable for use in Tailwind's font-body utility.
 */
const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

/** Application metadata used by Next.js for SEO and browser tab info */
export const metadata: Metadata = {
  title: 'Structura',
  description: 'Event and project management platform for student organizations',
}

/**
 * Root layout — wraps every page with font variables and global styles.
 * Font CSS variables are injected on the <html> element so Tailwind
 * font-heading / font-body utilities resolve correctly everywhere.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${yesevaOne.variable} ${openSans.variable}`}>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  )
}
