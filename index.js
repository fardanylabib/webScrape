const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');

const scrape = async () => {
  // Actual Scraping goes Here...
  const browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage();
  const agent = userAgent.getRandom();
  console.log(agent);
  page.setExtraHTTPHeaders({ 'user-agent': agent});
  await page.goto('https://www.upwork.com/o/profiles/browse/?loc=indonesia', { timeout: 0 , waitUntil : 'domcontentloaded'});
  console.log('sini1');
  const result = await page.evaluate(()=>{
  	let data = [];
    let elements = document.querySelectorAll('a.freelancer-tile-name')
    console.log('sini2');
  	for(var element of elements){
  		data.push(element.href);
    }    
    
  	return data;
  });

  for (const link of result) {
  	  await page.goto(link,{ timeout: 0 , waitUntil : 'domcontentloaded'});
  	  const res = await page.evaluate(() => {
  	  	return document.title
  	  })

  	  console.log(res)
  }

  browser.close(); 
  // Return a value
   return result;
};

scrape().then(async (links) => {
	console.log('sini4');
  // const browser = await puppeteer.launch({ headless: false });
  // const page = await browser.newPage();
  // page.setExtraHTTPHeaders({ 'user-agent': userAgent.getRandom()});

  // await page.goto(links[0], { timeout: 0 });
});