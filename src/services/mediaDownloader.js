/* ====================================================================
   Zanji Media Downloader Service (Zero-Dependency)
   
   Downloads WhatsApp voice notes (and other media) from Meta's Graph
   API into tenant-isolated local storage directories.
   
   Uses Node.js built-in https module — no axios required.
   
   Flow:
   ┌─────────────────────────────────────────────────────────────────┐
   │  1. Webhook receives mediaId from incoming voice message        │
   │  2. GET graph.facebook.com/v21.0/{mediaId} → retrieve URL       │
   │  3. GET {download_url} → stream raw .ogg binary                 │
   │  4. Save to /storage/tenant_{organizationId}/{mediaId}.ogg      │
   └─────────────────────────────────────────────────────────────────┘
   
   Security:
   - Each tenant's files are stored in an isolated subdirectory
   - Access token is read from environment variable only
   - Never logs tokens or download URLs to console
   ==================================================================== */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Meta Graph API version — update when Meta deprecates
const META_API_VERSION = 'v21.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Makes an HTTPS GET request and returns parsed JSON.
 * @param {string} url - Full URL to request
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Parsed JSON response
 */
function httpsGetJSON(url, headers) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        const opts = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: headers,
            timeout: 15000
        };

        const req = client.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 400) {
                        const err = new Error(`HTTP ${res.statusCode}`);
                        err.response = { status: res.statusCode, data: JSON.parse(data) };
                        return reject(err);
                    }
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        req.end();
    });
}

/**
 * Streams a URL's response body into a writable file stream.
 * @param {string} url - Full URL to download from
 * @param {Object} headers - Request headers
 * @param {string} destPath - Local file path to write to
 * @returns {Promise<string>} The saved file path
 */
function httpsStreamToFile(url, headers, destPath) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        const opts = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: headers,
            timeout: 30000
        };

        const req = client.request(opts, (res) => {
            // Follow redirects (Meta sometimes 302s)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpsStreamToFile(res.headers.location, headers, destPath)
                    .then(resolve).catch(reject);
            }

            if (res.statusCode >= 400) {
                return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
            }

            const writer = fs.createWriteStream(destPath);
            res.pipe(writer);

            writer.on('finish', () => {
                console.log(`[MediaDownloader] ✅ Saved: ${destPath}`);
                resolve(destPath);
            });
            writer.on('error', (err) => {
                try { fs.unlinkSync(destPath); } catch (_) {}
                console.error(`[MediaDownloader] ❌ Write error: ${err.message}`);
                reject(err);
            });
        });

        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Download timed out')); });
        req.end();
    });
}

function downloadSampleFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadSampleFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download sample file: HTTP ${res.statusCode}`));
            }
            const writer = fs.createWriteStream(destPath);
            res.pipe(writer);
            writer.on('finish', () => resolve(destPath));
            writer.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Downloads a WhatsApp voice note file using Meta Media APIs.
 * @param {string} mediaId - The unique media ID sent by the Meta Webhook.
 * @param {string} organizationId - Used to isolate the saved file per tenant.
 * @returns {Promise<string>} The local file path to the downloaded .ogg audio.
 */
async function downloadWhatsAppAudio(mediaId, organizationId) {
    const META_ACCESS_TOKEN = process.env.META_PERMANENT_ACCESS_TOKEN;

    // Check if we are running in simulation/mock mode
    if (!META_ACCESS_TOKEN || mediaId.startsWith('media_id_') || mediaId === 'mock_voice') {
        console.log(`[MediaDownloader] 🧪 Mock mode active or mock mediaId received: ${mediaId}`);
        const storageDir = path.join(__dirname, `../../storage/tenant_${organizationId}`);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        
        const localFilePath = path.join(storageDir, `${mediaId}.ogg`);
        const projectMockPath = path.join(__dirname, `../../mock_voice.ogg`);
        
        // Ensure project mock file exists
        if (!fs.existsSync(projectMockPath)) {
            console.log(`[MediaDownloader] Mock audio file missing. Downloading sample audio...`);
            await downloadSampleFile('https://www.w3schools.com/html/horse.ogg', projectMockPath);
        }
        
        // Copy to tenant-isolated storage
        fs.copyFileSync(projectMockPath, localFilePath);
        console.log(`[MediaDownloader] ✅ Copied mock file to tenant storage: ${localFilePath}`);
        return localFilePath;
    }

    if (!mediaId || !organizationId) {
        throw new Error(
            '[MediaDownloader] Both mediaId and organizationId are required.'
        );
    }

    try {
        // ── Step A: Retrieve the direct download URL ──────────────────
        // Meta's media endpoint returns { url, mime_type, sha256, file_size, id }
        console.log(`[MediaDownloader] Fetching media URL for ID: ${mediaId} (tenant: ${organizationId})`);

        const mediaInfo = await httpsGetJSON(
            `${META_GRAPH_BASE}/${mediaId}`,
            { 'Authorization': `Bearer ${META_ACCESS_TOKEN}` }
        );

        const downloadUrl = mediaInfo.url;
        const mimeType = mediaInfo.mime_type || 'audio/ogg';
        const fileSize = mediaInfo.file_size || 'unknown';

        console.log(`[MediaDownloader] Media resolved — MIME: ${mimeType}, Size: ${fileSize} bytes`);

        // ── Step B: Create tenant-isolated storage directory ──────────
        const storageDir = path.join(__dirname, `../../storage/tenant_${organizationId}`);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
            console.log(`[MediaDownloader] Created tenant storage: ${storageDir}`);
        }

        // Determine file extension from MIME type
        const ext = getExtensionFromMime(mimeType);
        const localFilePath = path.join(storageDir, `${mediaId}${ext}`);

        // Skip download if file already exists (idempotency)
        if (fs.existsSync(localFilePath)) {
            console.log(`[MediaDownloader] File already cached: ${localFilePath}`);
            return localFilePath;
        }

        // ── Step C: Stream raw audio binary into tenant storage ───────
        return await httpsStreamToFile(
            downloadUrl,
            { 'Authorization': `Bearer ${META_ACCESS_TOKEN}` },
            localFilePath
        );

    } catch (error) {
        // Differentiate Meta API errors from network errors
        if (error.response) {
            console.error(`[MediaDownloader] Meta API Error [${error.response.status}] for tenant [${organizationId}]:`, 
                error.response.data?.error?.message || error.message);
        } else {
            console.error(`[MediaDownloader] Network/System Error for tenant [${organizationId}]:`, error.message);
        }
        throw new Error('Failed to retrieve audio stream payload from Meta infrastructure.');
    }
}

/**
 * Maps MIME types returned by Meta to file extensions.
 * WhatsApp voice notes are typically audio/ogg; opus codec.
 */
function getExtensionFromMime(mime) {
    const map = {
        'audio/ogg': '.ogg',
        'audio/ogg; codecs=opus': '.ogg',
        'audio/mpeg': '.mp3',
        'audio/aac': '.aac',
        'audio/amr': '.amr',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'application/pdf': '.pdf',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    // Normalize mime (strip parameters like codecs)
    const baseMime = mime.split(';')[0].trim().toLowerCase();
    return map[baseMime] || '.bin';
}

module.exports = { downloadWhatsAppAudio };
