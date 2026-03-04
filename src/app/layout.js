import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Ken & Lee Travel Journal',
  description: 'Documenting our adventures, photos, and memories around the world.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '2rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', left: 0, right: 0, zIndex: 100, boxSizing: 'border-box' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>
            K&L Travel
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1rem', fontWeight: 600 }}>
            <Link href="/">Destinations</Link>
            <Link href="/about">About Us</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
