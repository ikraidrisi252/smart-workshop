const fs = require('fs');
const path = require('path');
const https = require('https');

const htmlPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

function downloadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        };
        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // handle redirect
                return downloadImageAsBase64(res.headers.location).then(resolve).catch(reject);
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                const base64 = buffer.toString('base64');
                const type = res.headers['content-type'] || 'image/jpeg';
                resolve(`data:${type};base64,${base64}`);
            });
        }).on('error', reject);
    });
}

async function embedImages() {
    console.log('Fetching true images with User-Agent...');
    
    // 1. Logo
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg/200px-Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg';
    const logoB64 = await downloadImageAsBase64(logoUrl);
    htmlContent = htmlContent.split(logoUrl).join(logoB64);
    console.log('Logo embedded.');

    // 2. Tatra
    const tatraUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tatra_815.jpg/800px-Tatra_815.jpg';
    const tatraB64 = await downloadImageAsBase64(tatraUrl);
    htmlContent = htmlContent.split(tatraUrl).join(tatraB64);
    console.log('Tatra embedded.');

    // 3. Dozer
    const dozerUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/IDF-D9-Z05.jpg/800px-IDF-D9-Z05.jpg';
    const dozerB64 = await downloadImageAsBase64(dozerUrl);
    htmlContent = htmlContent.split(dozerUrl).join(dozerB64);
    console.log('Dozer embedded.');

    // 4. Local Dashboard Screenshot
    const localImgPath = 'C:\\\\Users\\\\Ikra\\\\.gemini\\\\antigravity-ide\\\\brain\\\\eabc84f7-c80b-412b-9c1a-13511a1cd56e\\\\presentation_mode_demo_1784541688495.webp';
    if(fs.existsSync(localImgPath)) {
        const localBuffer = fs.readFileSync(localImgPath);
        const localB64 = `data:image/webp;base64,${localBuffer.toString('base64')}`;
        const localUrlInHtml = 'file:///' + localImgPath.replace(/\\/g, '/');
        htmlContent = htmlContent.split(localUrlInHtml).join(localB64);
        console.log('Dashboard embedded.');
    } else {
        console.log('Warning: Dashboard image not found at ' + localImgPath);
    }

    fs.writeFileSync(htmlPath, htmlContent);
    console.log('All images converted to Base64 and embedded!');
}

embedImages().catch(console.error);
