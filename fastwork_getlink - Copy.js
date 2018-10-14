const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");
const cluster 	= require('cluster');
const numCPUs = require("os").cpus().length;

const folderNameOffset = 20;
const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_PAGE = 100;

const URLs = [	"https://fastwork.id/design-graphic",  //0
				"https://fastwork.id/writing-translation",			//1
				"https://fastwork.id/web-programming",	//2
				"https://fastwork.id/photography-video",	//3
				"https://fastwork.id/marketing-advertising",			//4
				"https://fastwork.id/consultant"];			//5

const filter = (ua) => ua !== "mobile";

var parentUrlID = process.argv[2] - 1;
var childUrlID = process.argv[3]-1;
var startPage = process.argv[4];


const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",args: ['--start-maximized','--window-size=1920,1040'] };
// const usingChromium = { headless: false,args: ['--start-maximized','--window-size=1920,1040']};

async function doScraping(selectedUrlId,selectedChildUrlId,selectedStartPage){
	console.log("URL ID = "+selectedUrlId);
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	var page = await openNewPage(browser);
	const resultDirectory = ".\\Result\\fastwork_links\\";
	const folderName = URLs[selectedUrlId].substring(folderNameOffset,folderNameOffset+4);
	//make file directory".\\Result\\upwork_links";

	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory fastwork_links created");
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

  	console.log("getting links of child pages");	

  	await page.goto(URLs[selectedUrlId], { timeout: 0});
	
	let nbOfChildPages = await page.evaluate(()=>{
		let elements = document.getElementsByClassName("pointer subcategory-item noFancy");    
		return elements.length;
	});
	console.log("number of child pages = "+nbOfChildPages);
	let childPagesURL = [];
	var selector;

	for(let i = 1;i<=nbOfChildPages;i++){
		selector = '.browse-sidebar > .\_mb-big > .subcategory > .mainSpaceBetween:nth-child('+i+') > .noFancy';
		await page.waitForSelector(selector);
  		await page.click(selector);
		await page.waitFor(300);
		let url = await page.evaluate(()=>{
			return window.location.href;  
		});
		childPagesURL.push(url);
	}

	console.log(childPagesURL);

	//get freelancer link for each child pages
	
	while(selectedChildUrlId < nbOfChildPages){
		console.log("masuk pak eko");
		while(failCounter<5 && selectedStartPage<=500){  
	  		console.log("getting links from page " +selectedStartPage);	
	  		await page.goto(childPagesURL[selectedChildUrlId] + "?page=" + selectedStartPage, {timeout: 0, waitUntil : 'load'});
	  		console.log("masuk pak eko 1");
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
				page.close();
				page = await openNewPage(browser);
	  		}else{
	  			failCounter++
	  			await page.waitFor(300);
	  			console.log("reset browser...");
	  			browser.close();
	  			browser = await puppeteer.launch(usingChrome);
	  			page = await openNewPage(browser);
	  		}
		}
		selectedChildUrlId++;
		selectedStartPage = 1;
		failCounter = 0;
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};

async function getAllEmployeeLinks(page){
	console.log("masuk pak eko 2");
	let pageUrl = page.url();
	let nbOfUser = await page.evaluate(()=>{
		let elements = document.querySelectorAll('.flex-strech-item > .fw > .card-avatar > .\_mgl-8px > .username');    
		return elements.length;
	});
	console.log("User in this page = "+nbOfUser);
	let userUrl = [];
	for(let i = 1; i<=nbOfUser ;i++){
		try{
			let selector = '.flex-strech-item:nth-child('+i+') > .fw > .card-avatar > .\_mgl-8px > .username';
			await page.waitForSelector(selector);
	  		await page.click(selector);
	  		await page.waitFor(TIME_DELAY_1);
	  		let url = await page.evaluate(()=>{
				return window.location.href;  
			});
			userUrl.push(url);
			if(i % 5 != 0){
				page.goBack({waitUntil : 'load'});
			}else{
				page.goto(pageUrl,{timeout: 0, waitUntil : 'load'});
			}
		}catch(err){
			console.log("An error occured, restart the page");
			page.goto(pageUrl,{timeout: 0, waitUntil : 'load'});
			i--;
		}
	}
	console.log("All user in the page was recorded");
	return userUrl;
}

async function openNewPage(browser){
	let page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1040 });
	let agent = userAgent.getRandom(filter);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	return page;
}

async function scrapAll(parentUrlID,childUrlID,startPage){
	while(parentUrlID <= URLs.length){
		await doScraping(parentUrlID,childUrlID,startPage);
		parentUrlID++;
		childUrlID = 1;
		startPage = 1
	}
}

scrapAll(parentUrlID,childUrlID,startPage);

// async function parallelScrap(beginUrlIndex, threadNumber){

// 	let finishFlag = 0;
// 	for(let i = beginUrlIndex ; i<(beginUrlIndex+threadNumber); i++ ){
// 		if(i < URLs.length){
// 			finishFlag += doScraping(i);
// 		}
// 	}
// 	return finishFlag;
// }

// parallelScrap(0,6);
