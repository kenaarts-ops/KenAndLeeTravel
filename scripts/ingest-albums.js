const fs = require('fs');
const path = require('path');
const ExifParser = require('exif-parser');

const tripsDir = path.join(__dirname, '../public/trips');
const outputDataFile = path.join(__dirname, '../src/data/trips.json');

// create directories if they don't exist
if (!fs.existsSync(tripsDir)) fs.mkdirSync(tripsDir, { recursive: true });
const dataDir = path.dirname(outputDataFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function ingestAlbums() {
    const trips = [];
    const items = fs.readdirSync(tripsDir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            const originalFolderName = item.name;
            const tripId = originalFolderName.toLowerCase().replace(/\s+/g, '-');
            const tripPath = path.join(tripsDir, originalFolderName);
            const files = fs.readdirSync(tripPath).filter(f => f.match(/\.(jpg|jpeg|png|mp4|mov)$/i));

            const tripImages = [];
            let minDate = null;
            let maxDate = null;

            for (const file of files) {
                const filePath = path.join(tripPath, file);
                const buffer = fs.readFileSync(filePath);

                let meta = {
                    filename: file,
                    path: `/trips/${tripId}/${file}`,
                    date: null,
                    location: null
                };

                if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                    try {
                        const parser = ExifParser.create(buffer);
                        const result = parser.parse();

                        if (result.tags.DateTimeOriginal) {
                            const imgDate = new Date(result.tags.DateTimeOriginal * 1000);
                            meta.date = imgDate.toISOString();

                            // Track min max date
                            const d = imgDate.getTime();
                            if (!minDate || d < minDate) minDate = d;
                            if (!maxDate || d > maxDate) maxDate = d;
                        }

                        if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
                            meta.location = {
                                lat: result.tags.GPSLatitude,
                                lng: result.tags.GPSLongitude
                            };
                        }
                    } catch (err) {
                        console.log(`Could not parse EXIF for ${file}, may not have standard EXIF data.`);
                    }
                }
                tripImages.push(meta);
            }

            // Sort images by date
            tripImages.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            });

            // Group rapid sequences (within 5 seconds) and pick the best image
            const deduplicatedImages = [];
            const TIME_WINDOW_MS = 5000;
            let currentGroup = [];

            for (const img of tripImages) {
                if (!img.date) {
                    deduplicatedImages.push(img);
                    continue;
                }

                if (currentGroup.length === 0) {
                    currentGroup.push(img);
                } else {
                    const groupStartTime = new Date(currentGroup[0].date).getTime();
                    const imgTime = new Date(img.date).getTime();

                    if (imgTime - groupStartTime <= TIME_WINDOW_MS) {
                        currentGroup.push(img);
                    } else {
                        // Pick the best of the current group and start a new one
                        deduplicatedImages.push(selectBestImageFromBurst(currentGroup));
                        currentGroup = [img];
                    }
                }
            }

            // Push the last group
            if (currentGroup.length > 0) {
                deduplicatedImages.push(selectBestImageFromBurst(currentGroup));
            }

            // Helper function to rank and select the best image in a sequence
            function selectBestImageFromBurst(group) {
                if (group.length === 1) return group[0];

                return group.reduce((best, current) => {
                    const getScore = (img) => {
                        const name = img.filename.toUpperCase();
                        let score = 0;
                        if (name.includes('-EDIT') || name.includes('-EFFECTS')) score += 100; // Highest priority
                        else if (!name.includes('~') && !name.includes('.ORIGINAL') && !name.includes('PORTRAIT')) score += 50; // Optimized original
                        else if (name.includes('PORTRAIT')) score += 20; // Portrait mode
                        return score;
                    };

                    return getScore(current) > getScore(best) ? current : best;
                });
            }

            // Format title (e.g., "barbados-2026" -> "Barbados 2026")
            const title = originalFolderName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

            trips.push({
                id: tripId,
                title: title,
                coverImage: deduplicatedImages.length > 0 ? deduplicatedImages[0].path : null,
                startDate: minDate ? new Date(minDate).toISOString() : null,
                endDate: maxDate ? new Date(maxDate).toISOString() : null,
                images: deduplicatedImages
            });
        }
    }

    // Sort trips by newest first
    trips.sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateB - dateA;
    });

    fs.writeFileSync(outputDataFile, JSON.stringify(trips, null, 2));
    console.log(`Ingested ${trips.length} trips! Data saved to ${outputDataFile}`);
}

ingestAlbums();
