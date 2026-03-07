const fs = require('fs');
const path = require('path');
const ExifParser = require('exif-parser');
const sharp = require('sharp');

const tripsDir = path.join(__dirname, '../public/trips');
const outputDataFile = path.join(__dirname, '../src/data/trips.json');

// create directories if they don't exist
if (!fs.existsSync(tripsDir)) fs.mkdirSync(tripsDir, { recursive: true });
const dataDir = path.dirname(outputDataFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Helper function for reverse geocoding
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });
const cacheFile = path.join(__dirname, '../src/data/geocode-cache.json');
let geoCache = {};
if (fs.existsSync(cacheFile)) geoCache = JSON.parse(fs.readFileSync(cacheFile));

async function getLocationString(lat, lng) {
    if (!lat || !lng) return null;
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    if (geoCache[key]) return geoCache[key];

    try {
        await new Promise(r => setTimeout(r, 1050)); // Nominatim 1req/s limit
        const res = await geocoder.reverse({ lat, lon: lng });
        if (res && res.length > 0) {
            const r = res[0];
            const loc = r.city || r.town || r.village || r.hamlet || r.neighbourhood || r.county || r.country || "";
            geoCache[key] = loc;
            fs.writeFileSync(cacheFile, JSON.stringify(geoCache, null, 2));
            return loc;
        }
    } catch (e) {
        console.error("Geocode error", e.message);
    }
    geoCache[key] = "";
    fs.writeFileSync(cacheFile, JSON.stringify(geoCache, null, 2));
    return "";
}

async function ingestAlbums() {
    const trips = [];
    const items = fs.readdirSync(tripsDir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            const originalFolderName = item.name;
            const tripId = originalFolderName.toLowerCase().replace(/\s+/g, '-');
            const tripPath = path.join(tripsDir, originalFolderName);
            const files = fs.readdirSync(tripPath).filter(f => f.match(/\.(jpg|jpeg|png|mp4|mov)$/i) && !f.endsWith('.thumb.jpg'));

            const tripImages = [];
            let minDate = null;
            let maxDate = null;

            for (const file of files) {
                const filePath = path.join(tripPath, file);
                const isImage = file.match(/\.(jpg|jpeg|png)$/i);

                let meta = {
                    filename: file,
                    path: `/trips/${tripId}/${file}`,
                    thumbnail: `/trips/${tripId}/${file}`, // Fallback to original
                    date: null,
                    location: null
                };

                let metaDateStr = null;
                const match = file.match(/(?:PXL_)?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i);
                if (match) {
                    const [_, year, month, day, hour, min, sec] = match;
                    metaDateStr = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
                }

                if (isImage) {
                    const thumbFilename = file + '.thumb.jpg';
                    const thumbPath = path.join(tripPath, thumbFilename);
                    meta.thumbnail = `/trips/${tripId}/${thumbFilename}`;

                    if (!fs.existsSync(thumbPath)) {
                        console.log(`Generating thumbnail for ${file}...`);
                        try {
                            await sharp(filePath)
                                .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
                                .jpeg({ quality: 80 })
                                .toFile(thumbPath);
                        } catch (e) {
                            console.error(`Failed to generate thumbnail for ${file}:`, e.message);
                            meta.thumbnail = meta.path; // Fallback to original if failure
                        }
                    }

                    const buffer = fs.readFileSync(filePath);
                    try {
                        const parser = ExifParser.create(buffer);
                        const result = parser.parse();

                        // Prefer the clean filename timestamp for exact alignment with videos
                        if (metaDateStr) {
                            meta.date = metaDateStr;
                            const d = new Date(metaDateStr).getTime();
                            if (!minDate || d < minDate) minDate = d;
                            if (!maxDate || d > maxDate) maxDate = d;
                        } else if (result.tags.DateTimeOriginal) {
                            const imgDate = new Date(result.tags.DateTimeOriginal * 1000);
                            meta.date = imgDate.toISOString();
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
                } else {
                    // Video files
                    if (metaDateStr) {
                        meta.date = metaDateStr;
                        const d = new Date(metaDateStr).getTime();
                        if (!minDate || d < minDate) minDate = d;
                        if (!maxDate || d > maxDate) maxDate = d;
                    } else {
                        try {
                            const stats = fs.statSync(filePath);
                            if (stats.birthtime) {
                                meta.date = stats.birthtime.toISOString();
                                const d = stats.birthtime.getTime();
                                if (!minDate || d < minDate) minDate = d;
                                if (!maxDate || d > maxDate) maxDate = d;
                            }
                        } catch (e) {
                            console.log(`Could not get stats for ${file}`);
                        }
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

            // Group deduplicated images by Date AND Relative Location
            const sections = [];
            let currentSection = null;
            let tripDayIndex = 0;
            let activityIndex = 1;

            for (let i = 0; i < deduplicatedImages.length; i++) {
                const img = deduplicatedImages[i];
                if (!img.date) continue;
                const dateString = img.date.split('T')[0];
                let locString = "";

                // If no location (e.g. video), interpolate from the closest neighbor on the same day
                if (!img.location) {
                    let closestLoc = null;
                    let minTimeDiff = Infinity;
                    const imgTime = new Date(img.date).getTime();

                    // Scan surrounding images
                    for (let j = 0; j < deduplicatedImages.length; j++) {
                        const neighbor = deduplicatedImages[j];
                        if (neighbor.date && neighbor.date.split('T')[0] === dateString && neighbor.location) {
                            const neighborTime = new Date(neighbor.date).getTime();
                            const diff = Math.abs(neighborTime - imgTime);
                            if (diff < minTimeDiff) {
                                minTimeDiff = diff;
                                closestLoc = neighbor.location;
                            }
                        }
                    }
                    if (closestLoc) {
                        img.location = closestLoc;
                    }
                }

                if (img.location) {
                    locString = await getLocationString(img.location.lat, img.location.lng);
                }

                // If locString is STILL empty after interpolation, inherit from previous section directly
                if (!locString && currentSection && currentSection.date === dateString) {
                    locString = currentSection.location;
                }

                // Start a new section if the date changes, or the location strongly changes
                if (!currentSection || currentSection.date !== dateString || (locString && currentSection.location !== locString)) {
                    // Update trip day index if the date actually changed
                    if (!currentSection || currentSection.date !== dateString) {
                        tripDayIndex++;
                        activityIndex = 1;
                    } else {
                        activityIndex++;
                    }

                    const dayTitleStr = activityIndex === 1 ? `Day ${tripDayIndex}` : `Day ${tripDayIndex} - Part ${activityIndex}`;

                    currentSection = {
                        dayTitle: dayTitleStr,
                        date: dateString,
                        location: locString || "",
                        images: []
                    };
                    sections.push(currentSection);
                }

                currentSection.images.push(img);
            }

            // Generate or merge story.json scaffolding
            const storyPath = path.join(tripPath, 'story.json');
            let existingStory = { days: [] };

            if (fs.existsSync(storyPath)) {
                try {
                    existingStory = JSON.parse(fs.readFileSync(storyPath));
                } catch (e) {
                    console.error(`Error reading existing story.json in ${tripId}`);
                }
            }

            // Map sections to final output
            // We use a consumed index to ensure we don't duplicate existing stories
            const consumedStoryIndexes = new Set();

            const finalDays = sections.map((sec, index) => {
                const sectionId = sec.images.length > 0 ? sec.images[0].filename : sec.date;
                let existingDayDataIndex = -1;

                // 1. Try to find an existing story entry by strict ID match
                existingDayDataIndex = existingStory.days.findIndex((d, i) => d.id === sectionId && !consumedStoryIndexes.has(i));

                // 2. If no ID, try to find an existing story entry that matches date & location (for backward compatibility)
                if (existingDayDataIndex === -1) {
                    existingDayDataIndex = existingStory.days.findIndex((d, i) => d.date === sec.date && d.location === sec.location && !consumedStoryIndexes.has(i));
                }

                // 2b. If still no match, try to match by date and sequential occurrence (this allows locations to be manually overridden without dropping the entry)
                if (existingDayDataIndex === -1) {
                    // Find which sequential occurrence of this date the current section is
                    let currentSectionDateIndex = 0;
                    for (let j = 0; j < index; j++) {
                        if (sections[j].date === sec.date) currentSectionDateIndex++;
                    }

                    // Find the corresponding sequential occurrence in the existing story
                    let existingDateIndexCount = 0;
                    for (let j = 0; j < existingStory.days.length; j++) {
                        if (existingStory.days[j].date === sec.date) {
                            if (existingDateIndexCount === currentSectionDateIndex && !consumedStoryIndexes.has(j)) {
                                existingDayDataIndex = j;
                                break;
                            }
                            existingDateIndexCount++;
                        }
                    }
                }

                // 3. If still no match, fallback to the next available sequentially matching date
                if (existingDayDataIndex === -1) {
                    existingDayDataIndex = existingStory.days.findIndex((d, i) => d.date === sec.date && !consumedStoryIndexes.has(i));
                }

                let finalDescription = "";
                let finalLocation = sec.location;
                let finalAiStory = null;

                if (existingDayDataIndex !== -1) {
                    consumedStoryIndexes.add(existingDayDataIndex);
                    // Inherit the user's manual string if they edited it
                    finalDescription = existingStory.days[existingDayDataIndex].description || "";
                    if (existingStory.days[existingDayDataIndex].location !== undefined && existingStory.days[existingDayDataIndex].location !== "") {
                        finalLocation = existingStory.days[existingDayDataIndex].location;
                    }
                    if (existingStory.days[existingDayDataIndex].aiStory) {
                        finalAiStory = existingStory.days[existingDayDataIndex].aiStory;
                    }
                }

                return {
                    id: sectionId,
                    dayTitle: sec.dayTitle,
                    date: sec.date,
                    location: finalLocation,
                    description: finalDescription,
                    aiStory: finalAiStory,
                    images: sec.images
                };
            });

            // Write the narrative scaffold back to the trip directory so user can edit it
            const scaffoldStory = {
                title: title,
                days: finalDays.map(d => ({
                    id: d.id,
                    dayTitle: d.dayTitle,
                    date: d.date,
                    location: d.location,
                    description: d.description,
                    aiStory: d.aiStory
                }))
            };
            fs.writeFileSync(storyPath, JSON.stringify(scaffoldStory, null, 2));

            trips.push({
                id: tripId,
                title: title,
                coverImage: deduplicatedImages.length > 0 ? deduplicatedImages[0].thumbnail : null,
                startDate: minDate ? new Date(minDate).toISOString() : null,
                endDate: maxDate ? new Date(maxDate).toISOString() : null,
                days: finalDays
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

ingestAlbums().catch(console.error);
