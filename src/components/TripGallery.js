"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

export default function TripGallery({ days }) {
    const basePath = '/KenAndLeeTravel';
    // Track which day's gallery is open, and which photo within that day
    const [activeLightbox, setActiveLightbox] = useState({ dayIndex: null, photoIndex: null });

    const openModal = (dIdx, pIdx) => {
        setActiveLightbox({ dayIndex: dIdx, photoIndex: pIdx });
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setActiveLightbox({ dayIndex: null, photoIndex: null });
        document.body.style.overflow = 'auto';
    };

    const isModalOpen = activeLightbox.dayIndex !== null;
    const activeDay = isModalOpen ? days[activeLightbox.dayIndex] : null;

    return (
        <div>
            {days.map((day, dIdx) => (
                <div key={dIdx} style={{ marginBottom: '5rem' }}>
                    {/* Narrative Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--accent)', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            {day.dayTitle} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>• {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                        </h3>

                        {day.location && (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                {day.location}
                            </p>
                        )}

                        {day.description && (
                            <p style={{ color: 'var(--text)', fontSize: '1.15rem', lineHeight: '1.8', maxWidth: '800px', marginBottom: '2rem' }}>
                                {day.description}
                            </p>
                        )}

                        {!day.description && (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '1rem', marginBottom: '2rem' }}>
                                Awaiting narrative...
                            </p>
                        )}
                    </div>

                    {/* Gallery Grid for this Day */}
                    <div className="trip-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {day.images.map((img, pIdx) => (
                            <div
                                key={pIdx}
                                onClick={() => openModal(dIdx, pIdx)}
                                style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {img.filename.match(/\.(mp4|mov|webm|avi)$/i) ? (
                                    <video src={`${basePath}${img.path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop playsInline />
                                ) : (
                                    <Image
                                        src={`${basePath}${img.thumbnail || img.path}`}
                                        alt={img.filename}
                                        fill
                                        unoptimized={true}
                                        priority={dIdx === 0 && pIdx < 12} // Load initial day immediately
                                        style={{ objectFit: 'cover', backgroundColor: '#1e293b' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Swiper Lightbox Modal (Scoped to Active Day) */}
            {isModalOpen && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Top Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
                        <div style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {activeDay?.dayTitle}
                        </div>
                        <button
                            onClick={closeModal}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '2rem',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>

                    <Swiper
                        modules={[Navigation, Keyboard, Zoom]}
                        spaceBetween={50}
                        slidesPerView={1}
                        navigation
                        keyboard={{ enabled: true }}
                        zoom={{ maxRatio: 3 }}
                        initialSlide={activeLightbox.photoIndex}
                        style={{ width: '100%', height: '100vh' }}
                    >
                        {activeDay?.images.map((img, idx) => (
                            <SwiperSlide key={idx} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                                <div className="swiper-zoom-container" style={{ width: '100%', height: '100%', padding: '20px', boxSizing: 'border-box', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
                                    {img.filename.match(/\.(mp4|mov|webm|avi)$/i) ? (
                                        <video
                                            src={`${basePath}${img.path}`}
                                            controls
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <img
                                            src={`${basePath}${img.path}`}
                                            alt={img.filename}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                backgroundImage: `url('${basePath}${img.thumbnail || img.path}')`,
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>,
                document.body
            )}
        </div>
    );
}
