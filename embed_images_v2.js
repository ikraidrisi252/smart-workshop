const fs = require('fs');
const path = require('path');
const https = require('https');

const htmlPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

function downloadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        https.get(url, options, (res) => {
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
    // Use regex to replace whatever is currently in the img src for the logo (could be the text/plain base64)
    htmlContent = htmlContent.replace(/<img src="data:text\/plain;base64,[^"]+" width="150" style="margin: 20px 0;" \/>/g, `<img src="${logoB64}" width="150" style="margin: 20px 0;" />`);
    // Fallback if it's the raw url
    htmlContent = htmlContent.replace(logoUrl, logoB64);

    // 2. Tatra
    const tatraUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tatra_815.jpg/800px-Tatra_815.jpg';
    const tatraB64 = await downloadImageAsBase64(tatraUrl);
    htmlContent = htmlContent.replace(/<img src="data:text\/plain;base64,[^"]+" width="400" \/>/g, (match, offset, str) => {
        // Since there are two 400px images, we only want to replace the FIRST one with tatra, SECOND with dozer.
        // Actually, it's easier to just do it sequentially or re-run the convert_to_html first.
        return match; 
    });
    
}
embedImages();
