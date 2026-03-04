import Image from 'next/image'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

export default function Home() {
  const dataPath = path.join(process.cwd(), 'src/data/trips.json');
  let trips = [];
  try {
    trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    console.log("No trips data found");
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ height: '90vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
          <Image
            src="/hero.png"
            alt="Travel background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,1) 100%)' }}></div>
        </div>

        <div style={{ textAlign: 'center', zIndex: 1, padding: '0 2rem' }} className="animate-fade-in-up">
          <h1 className="display" style={{ marginBottom: '1rem', color: '#fff' }}>
            Ken & Lee<br />Adventures
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            Documenting our travels through photography. Exploring the world one coordinate at a time.
          </p>
          <button className="btn-primary delay-2">Explore Journals</button>
        </div>
      </section>

      {/* Recent Trips Section */}
      <section style={{ padding: '5rem 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#fff' }}>Recent Journeys</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Automated from Google Photos</p>
          </div>
        </div>

        <div className="trip-grid">
          {trips.map((trip) => (
            <Link href={`/trips/${trip.id}`} key={trip.id}>
              <div className="trip-card">
                <Image
                  src={trip.coverImage || '/hero.png'}
                  alt={trip.title}
                  fill
                  className="trip-card-image"
                />
                <div className="trip-card-content">
                  <h3 className="trip-card-title">{trip.title}</h3>
                  <div className="trip-card-meta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {trip.images.length} Photos
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 5%', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
        <p>&copy; {new Date().getFullYear()} Ken & Lee Travel. Built with Next.js.</p>
      </footer>
    </main>
  )
}
