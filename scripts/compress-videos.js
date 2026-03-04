const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TRIPS_DIR = path.join(process.cwd(), 'public/trips');
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
// Provide the absolute path to ffmpeg that winget installed
const FFMPEG_PATH = `"C:\\Users\\kenaa\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe"`;

// Function to safely execute a command and capture output
function execCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        return null;
    }
}

// Function to calculate target bitrate
function calculateTargetBitrate(durationSeconds, targetSizeBytes) {
    // Total bits needed
    const targetBits = targetSizeBytes * 8;
    // We'll allocate 128k for audio, the rest for video
    const audioBitrate = 128000;

    let videoBitrate = Math.floor((targetBits / durationSeconds) - audioBitrate);

    // Safety check - if it wants less than 100k bitrate, it's virtually impossible to compress that small and still look like a video.
    // but we will apply the calculated bitrate anyway.
    if (videoBitrate < 100000) {
        videoBitrate = 100000;
    }

    return {
        videoBitrate,
        audioBitrate
    };
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.match(/\.(mp4|mov|avi)$/i)) {
            if (stat.size > MAX_SIZE_BYTES) {
                console.log(`\nFound large video: ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

                // Get duration
                // ffprobe is in the same directory as ffmpeg
                const FFPROBE_PATH = FFMPEG_PATH.replace('ffmpeg.exe', 'ffprobe.exe');
                const probeCmd = `${FFPROBE_PATH} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${fullPath}"`;
                const durationStr = execCommand(probeCmd);

                if (!durationStr || isNaN(parseFloat(durationStr))) {
                    console.error("Could not determine duration for " + file);
                    continue;
                }

                const duration = parseFloat(durationStr);
                // Target a safe size of 14MB to ensure we fall just under the 15MB limit
                const { videoBitrate, audioBitrate } = calculateTargetBitrate(duration, 14 * 1024 * 1024);

                const tempPath = fullPath + '.compressed.mp4';

                console.log(`Duration: ${duration.toFixed(2)}s | Target Video Bitrate: ${(videoBitrate / 1000).toFixed(0)}k`);
                console.log(`Compressing... this may take a moment.`);

                const compressCmd = `${FFMPEG_PATH} -y -i "${fullPath}" -c:v libx264 -b:v ${videoBitrate} -pass 1 -an -f mp4 NUL && ` +
                    `${FFMPEG_PATH} -y -i "${fullPath}" -c:v libx264 -b:v ${videoBitrate} -pass 2 -c:a aac -b:a ${audioBitrate} "${tempPath}"`;

                // For Windows, redirecting to NUL on pass 1
                try {
                    // Running single pass instead of two-pass for simplicity and speed
                    const singlePassCmd = `${FFMPEG_PATH} -y -i "${fullPath}" -c:v libx264 -b:v ${videoBitrate} -bufsize ${videoBitrate * 2} -c:a aac -b:a ${audioBitrate} "${tempPath}"`;
                    execSync(singlePassCmd, { encoding: 'utf8', stdio: 'inherit' });

                    // Verify new size
                    const newStat = fs.statSync(tempPath);
                    console.log(`Compression complete. New size: ${(newStat.size / 1024 / 1024).toFixed(2)} MB`);

                    // Replace the original with the compressed
                    fs.unlinkSync(fullPath);
                    fs.renameSync(tempPath, fullPath);
                    console.log(`Replaced original file.`);

                } catch (err) {
                    console.error("Compression failed for " + file);
                    console.error(err.message);
                }
            } else {
                console.log(`Skipping ${file} - already under ${MAX_SIZE_MB}MB (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
            }
        }
    }
}

if (!fs.existsSync(TRIPS_DIR)) {
    console.error(`Trips directory not found: ${TRIPS_DIR}`);
    process.exit(1);
}

console.log(`Scanning ${TRIPS_DIR} for videos > ${MAX_SIZE_MB}MB...`);
processDirectory(TRIPS_DIR);
console.log('Video scanning complete.');
