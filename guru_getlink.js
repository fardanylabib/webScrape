const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const URL = "https://www.guru.com/d/freelancers/l/indonesia/pg/";
var startPage = process.argv[2];
const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

const scrape = async (selectedStartPage) => {
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	// var context = await browser.createIncognitoBrowserContext();
	var page = await browser.newPage();
	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	const resultDirectory = ".\\Result\\guru_links\\";

	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory guru_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

  	// Actual Scraping goes Here...
  	console.log("going to "+URL);
	let failCounter = 0;
  	var links= [];
  	while(failCounter<10 && selectedStartPage< 600 ){  
  		console.log("getting links from page " +selectedStartPage);	
  		await page.goto(URL+selectedStartPage, { timeout: 0 , waitUntil : 'domcontentloaded'});
  		links = await getAllEmployeeLinks(page);
  		console.log("getting links process was done");
  		console.log(links);

  		if(links[0]){		
  			let fileExist = -1;
  			let index = 0;
  			let fileName = "";
  			while(fileExist != 0){

  				if(index === 0){
  					fileName = resultDirectory+"\\page"+selectedStartPage+".txt";
  				}else{
  					fileName = resultDirectory+"\\page"+selectedStartPage+"("+ index +").txt";
  				}
	  			if(fs.existsSync(fileName)){
	  				index++;
	  			}else{
	  				fileExist = 0;
	  			}
				console.log(fileName);
  			}
  			
  			var stream = fs.createWriteStream(fileName);
  			console.log("writing links into file...");
			for(const link of links){
				if(link == new String("LAST").valueOf()){
					console.log("LAST PAGE REACHED");
					failCounter = 100;
					break;
				}
				stream.write(link + '\n');
			}
			stream.end();
			console.log("page "+selectedStartPage+" was recorded!");
			selectedStartPage++;
			failCounter = 0;
  		}else{
  			failCounter++
  			await page.waitFor(300);
  			console.log("reset browser...");
  			browser.close();
  			if(failCounter%2 === 1){
  				browser = await puppeteer.launch(usingChromium);
  			}else{
  				browser = await puppeteer.launch(usingChrome);
  			}
			
			page = await browser.newPage();
			agent = userAgent.getRandom(function (ua) {
				return ua.osName === 'Linux';
			});
			console.log(agent);
			page.setExtraHTTPHeaders({ "user-agent": agent});
  		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(page){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll(".identityName a");
		for(var i=0;i<elements.length;i=i+2){
			data1.push(elements[i].href);
		}
		return data1;
	});
	
	return result;
}

scrape(startPage);