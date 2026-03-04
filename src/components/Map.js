'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Create a component that only imports react-leaflet on the client
const MapComponent = dynamic(
    () => import('./MapClient'),
    { ssr: false }
);

export default function Map({ locations }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return <MapComponent locations={locations} />;
}
