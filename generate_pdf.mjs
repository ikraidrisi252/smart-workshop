import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const htmlPath = 'file:///C:/Users/Ikra/OneDrive/Desktop/Workshop/Report/project_report.html';
    const pdfPath = 'C:\\Users\\Ikra\\OneDrive\\Desktop\\Workshop\\Report\\Smart_Workshop_Project_Report.pdf';
    
    await page.goto(htmlPath, { waitUntil: 'load' });
    
    await page.pdf({ 
      path: pdfPath, 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    console.log(`PDF successfully generated at: ${pdfPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
})();
