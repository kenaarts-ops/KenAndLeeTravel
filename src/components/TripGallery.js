"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

export default function TripGallery({ images }) {
    const basePath = '/KenAndLeeTravel';
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    const openModal = (idx) => {
        setSelectedPhotoIndex(idx);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedPhotoIndex(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div>
            {/* Gallery Grid */}
            <div className="trip-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => openModal(idx)}
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
                                priority={idx < 12} // Load initial ones immediately, but we might want unoptimized on all
                                style={{ objectFit: 'cover', backgroundColor: '#1e293b' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Swiper Lightbox Modal */}
            {selectedPhotoIndex !== null && typeof document !== 'undefined' && createPortal(
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px', position: 'absolute', top: 0, right: 0, width: '100%', zIndex: 10000 }}>
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
                        initialSlide={selectedPhotoIndex}
                        style={{ width: '100%', height: '100vh' }}
                    >
                        {images.map((img, idx) => (
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
