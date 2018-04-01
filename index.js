const puppeteer = require('puppeteer');

const scrape = async () => {
  // Actual Scraping goes Here...
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({ 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' });
  await page.goto('https://www.upwork.com/o/profiles/browse/?loc=indonesia', { timeout: 0 });
  const result = await page.evaluate(()=>{
  	let data = [];
    let elements = document.querySelectorAll('a.freelancer-tile-name')
    
  	for(var element of elements){
  		data.push(element.href);
    }    
    
  	return data;
  });

  console.log(result);
  page.goto(result[0]);

  browser.close(); 
  // Return a value
   return result;
};

scrape().then(async (links) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({ 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' });

  await page.goto(links[0], { timeout: 0 });
});