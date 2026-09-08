const fs = require('fs');
const path = require('path');
const https = require('https');

const htmlPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

function downloadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                const base64 = buffer.toString('base64');
                const type = res.headers['content-type'];
                resolve(`data:${type};base64,${base64}`);
            });
        }).on('error', reject);
    });
}

async function embedImages() {
    console.log('Embedding EME Logo...');
    const logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg/200px-Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg';
    const logoB64 = await downloadImageAsBase64(logoUrl);
    htmlContent = htmlContent.replace(logoUrl, logoB64);

    console.log('Embedding Tatra Truck...');
    const tatraUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tatra_815.jpg/800px-Tatra_815.jpg';
    const tatraB64 = await downloadImageAsBase64(tatraUrl);
    htmlContent = htmlContent.replace(tatraUrl, tatraB64);

    console.log('Embedding Dozer...');
    const dozerUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/IDF-D9-Z05.jpg/800px-IDF-D9-Z05.jpg';
    const dozerB64 = await downloadImageAsBase64(dozerUrl);
    htmlContent = htmlContent.replace(dozerUrl, dozerB64);

    console.log('Embedding Local Dashboard Screenshot...');
    const localImgPath = 'C:\\\\Users\\\\Ikra\\\\.gemini\\\\antigravity-ide\\\\brain\\\\eabc84f7-c80b-412b-9c1a-13511a1cd56e\\\\presentation_mode_demo_1784541688495.webp';
    if(fs.existsSync(localImgPath)) {
        const localBuffer = fs.readFileSync(localImgPath);
        const localB64 = `data:image/webp;base64,${localBuffer.toString('base64')}`;
        htmlContent = htmlContent.replace('file:///' + localImgPath.replace(/\\/g, '/'), localB64);
    }

    fs.writeFileSync(htmlPath, htmlContent);
    console.log('All images converted to Base64 and embedded!');
}

embedImages().catch(console.error);
