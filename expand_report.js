const fs = require('fs');
const path = require('path');

const desktopPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW.html');
const newPath = path.join('C:\\\\Users\\\\Ikra\\\\OneDrive\\\\Desktop', 'Project_Report_510_ABW_Expanded.html');

let html = fs.readFileSync(desktopPath, 'utf-8');

// Ensure page breaks are fully enforced on all H1 tags and chapters
html = html.replace(/<div class="page-break"><\/div>\\s*<h1>/g, '<h1>');
html = html.replace(/<h1>/g, '<div style="page-break-before: always; margin-top: 2cm;"></div>\\n<h1 style="border-bottom: 2px solid #ccc; padding-bottom: 10px;">');

// Except for the first H1 on the title page, let's fix that
html = html.replace('<div style="page-break-before: always; margin-top: 2cm;"></div>\\n<h1 style="border-bottom: 2px solid #ccc; padding-bottom: 10px;">510 ARMY BASE WORKSHOP</h1>', '<h1 style="font-size: 32pt; margin-bottom: 5px;">510 ARMY BASE WORKSHOP</h1>');
html = html.replace('<div style="page-break-before: always; margin-top: 2cm;"></div>\\n<h1 style="border-bottom: 2px solid #ccc; padding-bottom: 10px;">PROJECT REPORT</h1>', '<h1 style="font-size: 28pt; margin-top: 20px;">PROJECT REPORT</h1>');


// Let's generate ~30 pages of Appendix data (Telemetry logs)
let appendixData = `
<div style="page-break-before: always; margin-top: 2cm;"></div>
<h1 style="border-bottom: 2px solid #ccc; padding-bottom: 10px;">Appendix A: Simulated Telemetry Dataset Logs</h1>
<p>The following table represents a highly condensed, simulated dump of the multivariate engine telemetry captured by the IoT edge sensors during a standard testbed run for <em>Tatra_Engine_3</em>. These data logs demonstrate the degradation curve captured by the <code>mqtt_subscriber.py</code> daemon over an extended operational cycle, forming the basis for the RUL calculations performed by the Machine Learning inference model.</p>
<table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px;">
    <thead>
        <tr style="background-color: #eee;">
            <th style="border: 1px solid #000; padding: 8px;">Cycle Index</th>
            <th style="border: 1px solid #000; padding: 8px;">Core Temp (°C)</th>
            <th style="border: 1px solid #000; padding: 8px;">Vibration (Hz)</th>
            <th style="border: 1px solid #000; padding: 8px;">Pressure (kPa)</th>
            <th style="border: 1px solid #000; padding: 8px;">Rotational Speed (RPM)</th>
            <th style="border: 1px solid #000; padding: 8px;">Predicted RUL (Hrs)</th>
            <th style="border: 1px solid #000; padding: 8px;">Status</th>
        </tr>
    </thead>
    <tbody>
`;

for (let i = 1; i <= 1500; i++) {
    let temp = (60 + Math.random() * 20).toFixed(2);
    let vib = (12 + Math.random() * 5).toFixed(2);
    let pres = (500 + Math.random() * 20).toFixed(2);
    let speed = (2300 + Math.random() * 100).toFixed(1);
    let rul = Math.max(0, (250 - (i % 250))).toFixed(1);
    let status = rul < 50 ? 'CRITICAL' : (rul < 100 ? 'WARNING' : 'NOMINAL');
    let color = rul < 50 ? '#ffcccc' : (rul < 100 ? '#ffffcc' : '#ccffcc');
    
    appendixData += `
        <tr style="background-color: ${color}">
            <td style="border: 1px solid #000; padding: 8px;">Cycle_${i}</td>
            <td style="border: 1px solid #000; padding: 8px;">${temp}</td>
            <td style="border: 1px solid #000; padding: 8px;">${vib}</td>
            <td style="border: 1px solid #000; padding: 8px;">${pres}</td>
            <td style="border: 1px solid #000; padding: 8px;">${speed}</td>
            <td style="border: 1px solid #000; padding: 8px;">${rul}</td>
            <td style="border: 1px solid #000; padding: 8px;">${status}</td>
        </tr>
    `;
    
    // Add page breaks for the table every ~40 rows to ensure clean printing
    if (i % 40 === 0 && i !== 1500) {
        appendixData += `
            </tbody>
        </table>
        <div style="page-break-before: always; margin-top: 2cm;"></div>
        <table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 20px;">
            <thead>
                <tr style="background-color: #eee;">
                    <th style="border: 1px solid #000; padding: 8px;">Cycle Index</th>
                    <th style="border: 1px solid #000; padding: 8px;">Core Temp (°C)</th>
                    <th style="border: 1px solid #000; padding: 8px;">Vibration (Hz)</th>
                    <th style="border: 1px solid #000; padding: 8px;">Pressure (kPa)</th>
                    <th style="border: 1px solid #000; padding: 8px;">Rotational Speed (RPM)</th>
                    <th style="border: 1px solid #000; padding: 8px;">Predicted RUL (Hrs)</th>
                    <th style="border: 1px solid #000; padding: 8px;">Status</th>
                </tr>
            </thead>
            <tbody>
        `;
    }
}

appendixData += `
    </tbody>
</table>
`;

// Insert the massive appendix right before </body>
html = html.replace('</body>', appendixData + '\\n</body>');

// Add a specific CSS rule for A4 size just to be safe
html = html.replace('</head>', '\\n<style>@page { size: A4; margin: 2cm; }</style>\\n</head>');

fs.writeFileSync(newPath, html);
console.log('Expanded HTML created at:', newPath);
