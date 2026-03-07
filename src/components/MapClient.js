'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function MapClient({ locations }) {
    // Fix for default Leaflet icon not loading in Next.js
    if (typeof window !== 'undefined') {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
    }

    if (!locations || locations.length === 0) return null;
    const center = [locations[0].lat, locations[0].lng];

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[loc.lat, loc.lng]}
                        eventHandlers={{
                            click: () => {
                                const el = document.getElementById(`photo-${loc.dIdx}-${loc.pIdx}`);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }
                        }}
                    >
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
