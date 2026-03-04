import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export async function generateStaticParams() {
    const dataPath = path.join(process.cwd(), 'src/data/trips.json');
    const trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return trips.map((trip) => ({ id: trip.id }));
}

export default function TripPage({ params }) {
    const dataPath = path.join(process.cwd(), 'src/data/trips.json');
    const trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const trip = trips.find(t => t.id === params.id);

    if (!trip) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Trip Not Found</div>;
    }

    const mapLocations = trip.images
        .filter(img => img.location)
        .map(img => ({ lat: img.location.lat, lng: img.location.lng, title: img.filename }));

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
            {/* Hero */}
            <section style={{ height: '60vh', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '4rem 5%' }}>
                <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
                    <Image src={trip.coverImage} alt={trip.title} fill style={{ objectFit: 'cover' }} priority />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.8) 100%)' }}></div>
                </div>

                <div style={{ zIndex: 1, position: 'relative', width: '100%' }} className="animate-fade-in-up">
                    <a href="/" style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-block', marginBottom: '1rem' }}>&larr; Back to Destinations</a>
                    <h1 className="display" style={{ color: '#fff', fontSize: '4rem', marginBottom: '0.5rem' }}>
                        {trip.title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {trip.images.length} photos captured during this journey.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 5%' }}>
                {mapLocations.length > 0 && (
                    <div style={{ marginBottom: '4rem' }} className="animate-fade-in-up delay-1">
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1.5rem', color: '#fff' }}>Journey Map</h2>
                        <Map locations={mapLocations} />
                    </div>
                )}

                <div className="animate-fade-in-up delay-2">
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1.5rem', color: '#fff' }}>Gallery</h2>
                    <div className="trip-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {trip.images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden' }}>
                                <Image src={img.path} alt={img.filename} fill style={{ objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
