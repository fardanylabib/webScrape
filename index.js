const puppeteer = require('puppeteer');

let scrape = async () => {
  // Actual Scraping goes Here...
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://www.upwork.com/o/profiles/browse/?loc=indonesia');
  
  const result = await page.evaluate(()=>{
  	let data = [];
  	let elements = document.querySelectorAll('a.freelancer-tile-name')
  	
  	for(var element of elements){
  		data.push(element);
  	}
  	return data;
  });

  browser.close(); 
  // Return a value
   return result;
};

scrape().then((value) => {
    console.log(value); // Success!
});