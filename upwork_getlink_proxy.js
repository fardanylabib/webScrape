const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");
const cluster 	= require('cluster');
const numCPUs = require("os").cpus().length;

const folderNameOffset = 43;
const TIME_DELAY_2 = 2000;

const proxyServer = "https://www.freeproxyserver.co/";
const URLs = [	"https://www.upwork.com/o/profiles/browse/c/web-mobile-software-dev/?loc=indonesia&page=",  //0
				"https://www.upwork.com/o/profiles/browse/c/it-networking/?loc=indonesia&page=",			//1
				"https://www.upwork.com/o/profiles/browse/c/data-science-analytics/?loc=indonesia&page=",	//2
				"https://www.upwork.com/o/profiles/browse/c/engineering-architecture/?loc=indonesia&page=",	//3
				"https://www.upwork.com/o/profiles/browse/c/design-creative/?loc=indonesia&page=",			//4
				"https://www.upwork.com/o/profiles/browse/c/writing/?loc=indonesia&page=",					//5
				"https://www.upwork.com/o/profiles/browse/c/translation/?loc=indonesia&page=",				//6
				"https://www.upwork.com/o/profiles/browse/c/legal/?loc=indonesia&page=",					//7
				"https://www.upwork.com/o/profiles/browse/c/customer-service/?loc=indonesia&page=",			//8
				"https://www.upwork.com/o/profiles/browse/c/sales-marketing/?loc=indonesia&page=",			//9
				"https://www.upwork.com/o/profiles/browse/c/accounting-consulting/?loc=indonesia&page=",	//10
				"https://www.upwork.com/o/profiles/browse/c/admin-support/?loc=indonesia&page=",];			//11

var startPage = process.argv[3];
var urlID = process.argv[2] - 1;

var browser;
var page;
var agent;
async function doScraping(selectedUrlId,selectedStartPage){
	console.log("URL ID = "+selectedUrlId);
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	await resetPage(false);
	console.log(agent);
	const resultDirectory = ".\\Result\\upwork_links\\";
	const folderName = URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+4);
	//make file directory".\\Result\\upwork_links";

	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory upwork_links created");
			fs.mkdir(resultDirectory+folderName,function(e){
			    if(!e || (e && e.code === 'EEXIST')){
			        console.log("directory " +folderName + " created");
			    } else {
			        //debug
			        console.log(e);
			    }
			});
	    } else {
	        //debug
	        console.log(e);
	    }
	});

  	// Actual Scraping goes Here...
  	let failCounter = 0;
  	var links= [];
  	while(failCounter<10 && selectedStartPage<=500){  
  		console.log("getting links from page " +selectedStartPage);	
  		await page.goto(proxyServer, { timeout: 0, waitUntil : 'domcontentloaded'});
  		let urlStr = URLs[selectedUrlId]+selectedStartPage;
  		await page.waitForSelector("body > .container > .form > .input-append > #input");
  		await page.type("body > .container > .form > .input-append > #input", urlStr);
  		await page.waitForSelector("body > .container > .form > .input-append > .btn");
  		await page.click("body > .container > .form > .input-append > .btn",{delay:250});
  		const navigationPromise = page.waitForNavigation();
  		await navigationPromise;
  		await page.waitFor(2000);
  		// await page.goto(URLs[selectedUrlId]+selectedStartPage, { timeout: 0, waitUntil : 'domcontentloaded'});	
  		links = await getAllEmployeeLinks(page);
  		console.log("getting links process was done");
  		console.log(links);
  		if(links[0]){		
  			let fileExist = -1;
  			let index = 0;
  			let fileName = "";
  			while(fileExist != 0){
  				if(index === 0){
  					fileName = resultDirectory+folderName+"\\page"+selectedStartPage+".txt";
  				}else{
  					fileName = resultDirectory+folderName+"\\page"+selectedStartPage+"("+ index +").txt";
  				}
	  			if(fs.existsSync(fileName)){
	  				index++;
	  			}else{
	  				fileExist = 0;
	  			}
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
  			await resetPage(true);
  		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};

async function getAllEmployeeLinks(){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll('a.freelancer-tile-name')
		for(var element of elements){
			data1.push(element.href);
		}    
		return data1;
	});
	
	return result;
}

async function resetPage(resetBrowser){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	console.log("reset page success");
}


doScraping(urlID,startPage);

