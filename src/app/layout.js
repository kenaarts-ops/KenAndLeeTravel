import './globals.css'

export const metadata = {
  title: 'Ken & Lee Travel Journal',
  description: 'Documenting our adventures, photos, and memories around the world.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '2rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', width: '100%', zIndex: 100 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>
            K&L Travel
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1rem', fontWeight: 600 }}>
            <a href="/">Destinations</a>
            <a href="/about">About Us</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
