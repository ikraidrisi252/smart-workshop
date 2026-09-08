import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });
    
    const htmlPath = 'file:///C:/Users/Ikra/OneDrive/Desktop/Workshop/org_chart.html';
    const imagePath = 'C:\\Users\\Ikra\\OneDrive\\Desktop\\Workshop\\Report\\org_chart.png';
    
    await page.goto(htmlPath, { waitUntil: 'load' });
    
    // Wait for mermaid to process the diagram
    await page.waitForSelector('.mermaid[data-processed="true"]', { timeout: 10000 });
    
    const element = await page.$('.mermaid');
    await element.screenshot({ path: imagePath, omitBackground: true });
    
    await browser.close();
    console.log(`Chart successfully generated at: ${imagePath}`);
  } catch (error) {
    console.error('Error generating chart:', error);
    process.exit(1);
  }
})();
