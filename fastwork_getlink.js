const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");
const cluster 	= require('cluster');
const numCPUs = require("os").cpus().length;

const folderNameOffset = 20;
const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_PAGE = 100;
const USER_DISPLAY = 36;

const URLs = [	"https://fastwork.id/design-graphic",  //0
				"https://fastwork.id/writing-translation",			//1
				"https://fastwork.id/web-programming",	//2
				"https://fastwork.id/photography-video",	//3
				"https://fastwork.id/marketing-advertising",			//4
				"https://fastwork.id/consultant"];			//5


var parentUrlID = process.argv[2] - 1;
var childUrlID = process.argv[3]-1;
var startPage = process.argv[4];


const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

async function doScraping(selectedUrlId,selectedChildUrlId,selectedStartPage){
	console.log("URL ID = "+selectedUrlId);
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	
	const filter = (ua) => ua !== "mobile";
	var agent = userAgent.getRandom(filter);
	var page = await browser.newPage();
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
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
		while(failCounter<10 && selectedStartPage<=500){  
	  		console.log("getting links from page " +selectedStartPage);	
	  		await page.goto(childPagesURL[selectedChildUrlId] + "?page=" + selectedStartPage, { timeout: 0});
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
	  			browser.close();
	  			if(failCounter%2 === 1){
	  				browser = await puppeteer.launch(usingChromium);
	  			}else{
	  				browser = await puppeteer.launch(usingChrome);
	  			}
				
				page = await browser.newPage();
				agent = userAgent.getRandom(filter);
				console.log(agent);
				page.setExtraHTTPHeaders({ "user-agent": agent});
	  		}
		}
		selectedChildUrlId++;
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};

async function getAllEmployeeLinks(page){
	let userUrl = [];
	console.log("masuk sini udah");
	for(let i = 1; i<=USER_DISPLAY ;i++){
		let selector = '.flex-strech-item:nth-child('+i+') > .fw > .card-avatar > .\_mgl-8px > .username';
		console.log("masuk situ udah");
		await page.waitForSelector(selector);
		console.log("masuk situ udah 1");
  		await page.click(selector);
  		console.log("masuk situ udah 2");
  		await page.waitFor(TIME_DELAY_1);
  		let url = await page.evaluate(()=>{
			return window.location.href;  
		});
		console.log("masuk situ udah 3");
		userUrl.push(url);
		console.log("masuk situ udah 4");
		await page.goBack({waitUntil : 'networkidle0'});
		console.log("masuk situ udah 5");
	}

	return userUrl;
}


doScraping(parentUrlID,childUrlID,startPage);

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
