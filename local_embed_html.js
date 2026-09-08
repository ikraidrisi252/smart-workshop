const fs = require('fs');
const path = require('path');

const mdPath = path.join('C:\\\\Users\\\\Ikra\\\\.gemini\\\\antigravity-ide\\\\brain\\\\eabc84f7-c80b-412b-9c1a-13511a1cd56e', 'project_report.md');
const htmlPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW.html');
const artifactsDir = 'C:\\\\Users\\\\Ikra\\\\.gemini\\\\antigravity-ide\\\\brain\\\\eabc84f7-c80b-412b-9c1a-13511a1cd56e';

let mdContent = fs.readFileSync(mdPath, 'utf-8');

// The 4 local images we generated
const images = {
    'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg/200px-Corps_of_Electronics_and_Mechanical_Engineers_emblem.jpg': path.join(artifactsDir, 'eme_logo_1784613878209.png'),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tatra_815.jpg/800px-Tatra_815.jpg': path.join(artifactsDir, 'tatra_truck_1784613902550.png'),
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/IDF-D9-Z05.jpg/800px-IDF-D9-Z05.jpg': path.join(artifactsDir, 'armored_dozer_1784613926323.png'),
    'file:///C:/Users/Ikra/.gemini/antigravity-ide/brain/eabc84f7-c80b-412b-9c1a-13511a1cd56e/presentation_mode_demo_1784541688495.webp': path.join(artifactsDir, 'presentation_mode_demo_1784541688495.webp')
};

// Swap URLs in markdown for local base64 strings BEFORE HTML conversion
for (const [url, localPath] of Object.entries(images)) {
    if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).substring(1);
        const b64 = `data:image/${ext};base64,${buffer.toString('base64')}`;
        mdContent = mdContent.split(url).join(b64);
        console.log(`Successfully converted and embedded: ${path.basename(localPath)}`);
    } else {
        console.error(`ERROR: Could not find ${localPath}`);
    }
}

let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Project Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1, h2, h3 { color: #2c3e50; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #e9ecef; }
        code { font-family: Consolas, monospace; }
        blockquote { border-left: 4px solid #0056b3; margin-left: 0; padding-left: 15px; color: #555; }
        img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
        .page-break { page-break-after: always; }
        @media print {
            body { max-width: 100%; padding: 0; }
            .page-break { page-break-after: always; }
        }
    </style>
</head>
<body>
`;

// Replace custom div tags with HTML equivalents
mdContent = mdContent.replace(/<div align="center">/g, '<div style="text-align: center;">');
mdContent = mdContent.replace(/<div align="right">/g, '<div style="text-align: right;">');
mdContent = mdContent.replace(/<div style="page-break-after: always;"><\/div>/g, '<div class="page-break"></div>');

// Convert headings
mdContent = mdContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
mdContent = mdContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
mdContent = mdContent.replace(/^# (.*$)/gim, '<h1>$1</h1>');

// Convert blockquotes
mdContent = mdContent.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

// Convert code blocks
mdContent = mdContent.replace(/```python([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

// Convert bold
mdContent = mdContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
mdContent = mdContent.replace(/\*(.*?)\*/g, '<em>$1</em>');

// Convert list items
mdContent = mdContent.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');
mdContent = mdContent.replace(/<\/ul>\n<ul>/g, '\n'); 

mdContent = mdContent.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');
mdContent = mdContent.replace(/<\/ol>\n<ol>/g, '\n');

// Wrap remaining text in paragraphs
const paragraphs = mdContent.split('\n\n');
for (let p of paragraphs) {
    if (!p.trim().startsWith('<') && p.trim().length > 0) {
        html += '<p>' + p.replace(/\n/g, '<br>') + '</p>\n';
    } else {
        html += p + '\n';
    }
}

html += `
</body>
</html>`;

fs.writeFileSync(htmlPath, html);
console.log('HTML file with embedded local images created at:', htmlPath);
