const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs 		= require("fs");

const folderNameOffset = 20;
const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_PAGE = 100;

const URLs = [	"design-graphic",  //0
				"writing-translation",			//1
				"web-programming",	//2
				"photography-video",	//3
				"marketing-advertising",			//4
				"consultant"];			//5

const filter = (ua) => ua !== "mobile";

const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",args: ['--start-maximized','--window-size=1920,1040'] };
// const usingChromium = { headless: false,args: ['--start-maximized','--window-size=1920,1040']};

async function doScraping(){
	var browser = await puppeteer.launch(usingChrome);
	var page = await openNewPage(browser);

	//output setup
	const linksDir  = ".\\DataMatang\\Archieve\\";
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"FastwokSkill.csv";
		}else{
			fileName = linksDir+"FastwokSkill("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
	const outStream = fs.createWriteStream(fileName);

	for(let url of URLs){
		await page.goto("https://fastwork.id/" + url,{ timeout: 0 , waitUntil : 'load'});
		let skills = await page.evaluate(() => {
			let list = document.querySelectorAll('.browse-sidebar > .\_mb-big > .subcategory > .subcategory-list > .pointer');
			let listStr=[];
			if(list[0]){
				for(var element of list){
					element = element.innerText.replace((/  |\r\n|\n|\r/gm),"");
					element = element.replace(/,/g, "");
					listStr.push(element);
				}
			}else{
				listStr.push("--");
			}
			return listStr;
		});

		for(let skill of skills){
			outStream.write(skill + ","+url+"\n");
		}
	} 	
	outStream.end(); 
	return 1; 	
};


async function openNewPage(browser){
	let page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1040 });
	let agent = userAgent.getRandom(filter);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	return page;
}

doScraping();
