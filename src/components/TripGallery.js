"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function TripGallery({ images }) {
    const basePath = '/KenAndLeeTravel';
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedPhotoIndex === null) return;

            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowRight') {
                nextPhoto(e);
            } else if (e.key === 'ArrowLeft') {
                prevPhoto(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhotoIndex]);

    const openModal = (idx) => {
        setSelectedPhotoIndex(idx);
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    };

    const closeModal = () => {
        setSelectedPhotoIndex(null);
        document.body.style.overflow = 'auto';
    };

    const nextPhoto = (e) => {
        if (e) e.stopPropagation();
        if (selectedPhotoIndex !== null && selectedPhotoIndex < images.length - 1) {
            setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
    };

    const prevPhoto = (e) => {
        if (e) e.stopPropagation();
        if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
            setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
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
                            <Image src={`${basePath}${img.thumbnail || img.path}`} alt={img.filename} fill style={{ objectFit: 'cover', backgroundColor: '#1e293b' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedPhotoIndex !== null && (
                <div
                    onClick={closeModal}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '25px',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            zIndex: 1001
                        }}
                        aria-label="Close"
                    >
                        &times;
                    </button>

                    {/* Previous Button */}
                    {selectedPhotoIndex > 0 && (
                        <button
                            onClick={prevPhoto}
                            style={{
                                position: 'absolute',
                                left: '20px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '2rem',
                                padding: '10px 20px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                zIndex: 1001,
                                backdropFilter: 'blur(4px)'
                            }}
                            aria-label="Previous"
                        >
                            &#10094;
                        </button>
                    )}

                    <div
                        style={{ position: 'relative', width: '90vw', height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={(e) => e.stopPropagation()} // Prevent clicks on the image from closing the modal
                    >
                        {images[selectedPhotoIndex].filename.match(/\.(mp4|mov|webm|avi)$/i) ? (
                            <video
                                src={`${basePath}${images[selectedPhotoIndex].path}`}
                                controls
                                autoPlay
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <img
                                src={`${basePath}${images[selectedPhotoIndex].path}`}
                                alt={images[selectedPhotoIndex].filename}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        )}
                    </div>

                    {/* Next Button */}
                    {selectedPhotoIndex < images.length - 1 && (
                        <button
                            onClick={nextPhoto}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '2rem',
                                padding: '10px 20px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                zIndex: 1001,
                                backdropFilter: 'blur(4px)'
                            }}
                            aria-label="Next"
                        >
                            &#10095;
                        </button>
                    )}

                    {/* Counter */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        color: 'white',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '5px 15px',
                        borderRadius: '20px',
                        fontSize: '0.9rem'
                    }}>
                        {selectedPhotoIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
