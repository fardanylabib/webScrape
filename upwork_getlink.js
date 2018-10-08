const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");
const cluster 	= require('cluster');
const numCPUs = require("os").cpus().length;

const folderNameOffset = 43;
const TIME_DELAY_2 = 2000;
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

const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

async function doScraping(selectedUrlId,selectedStartPage){
	console.log("URL ID = "+selectedUrlId);
	console.log("START PAGE = "+selectedStartPage);
	
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	
	const filter = (ua) => ua !== "mobile";
	var agent = userAgent.getRandom(filter);
	var page = await browser.newPage();
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
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
  		await page.goto(URLs[selectedUrlId]+selectedStartPage, { timeout: 0, waitUntil : 'domcontentloaded'});	
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
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};

async function getAllEmployeeLinks(page){
	var result = [];
	result = await page.evaluate(()=>{
		let data1 = [];
		let elements = document.querySelectorAll('a.freelancer-tile-name')
		for(var element of elements){
			data1.push(element.href);
		}    
		return data1;
	});
	
	// const next = await page.evaluate(() => {

 //    	const tombol = document.querySelector(".pagination-next a .d-none.d-sm-inline");
 //    	return tombol;
	// });

	// if(next){
	// 	await page.click(".pagination-next a .d-none.d-sm-inline");
	// 	await page.waitFor(TIME_DELAY_2);
	// 	// await page.waitForSelector('.ns_freelancer-list');	// element for display freelancer
	// }else{
	// 	//if result exist
	// 	if(result[0]){
	// 		result.push("LAST");
	// 	}
	// }
	return result;
}


doScraping(urlID,startPage);

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
