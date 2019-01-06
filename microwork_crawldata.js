const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;
const MAX_WAIT_LIMIT = 30;
const LOGIN_PAGE = "https://www.microworkers.com/login.php";
const EMAIL	= "fardanylabib@gmail.com";
const PASSWORD	= "Suudiyah001";

let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	// Actual Scraping goes Here...
	await resetPage(false);

	const linksDir  = ".\\Result\\microwork_links\\";

	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"RawData.csv";
		}else{
			fileName = linksDir+"RawData("+ index +").csv";
		}
		if(fs.existsSync(fileName)){
			index++;
		}else{
			fileExist = 0;
		}
	}
	console.log("File Name = "+fileName);
	const outStream = fs.createWriteStream(fileName);

	//input path setup
	const databaseFile  = linksDir + "database.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
			outStream.write(j+",");
			for(let data of employeeData){
				data = data.replace(/,/g, ".");
				data = data.replace((/  |\r\n|\n|\r/gm),"");
				outStream.write(data + ",");
			}
			outStream.write("\n");
			console.log(employeeData);
			failCounter = 0;
		}else{
			failCounter++;
			await resetPage(true);
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}
		}
	}
	stream.end();
	browser.close(); 
	// Return a value
	return result;
};

async function crawlEmployeeData(url){
	console.log('going to next page...');

	while(true){
		try{
			await page.goto(url, { timeout: 0, waitUntil : 'domcontentloaded'});
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".usershortinfoleft > ul > li > span > strong", 									//0 NAME
						".usershortinfo > .usershortinfoleft:nth-child(1) > ul > li:nth-child(3) > span",	//1	MEMBER SINCE
						".usershortinfo > .usershortinfoleft > ul > li:nth-child(5) > span",				//2	CITY
						".usershortinfo > .usershortinforight > ul > li:nth-child(2) > span",				//3 LAST TASK SUBMIT
						".workerstatistics > .staticticscol01 > .staticticssinglebox:nth-child(1) > .staticsboxheader > span",	//4 TOTAL EARNED
						".workerstatistics > .staticticscol01 > .staticticssinglebox:nth-child(1) > .staticsboxlist > span",	//5 TASK DONE
						];

	let employeeData = await page.evaluate((selectors)=>{
		let result = [];
		var dataPoint;
		for(let selector of selectors){
			dataPoint = document.querySelector(selector);
			if(dataPoint){
				result.push(dataPoint.innerText);
			}else{
				result.push("--");
			}
		}
		return result;
	},selectors);
	return employeeData;
}


async function resetPage(resetBrowser){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	

	//login
	await page.goto(LOGIN_PAGE,{ timeout:0, waitUntil : 'domcontentloaded'});
	await page.waitForSelector('form > .loginform > .loginlist:nth-child(1) > .loginlistright > .txt');
	await page.type('form > .loginform > .loginlist:nth-child(1) > .loginlistright > .txt',EMAIL);

	await page.waitForSelector('form > .loginform > .loginlist:nth-child(2) > .loginlistright > .txt');
	await page.type('form > .loginform > .loginlist:nth-child(2) > .loginlistright > .txt',PASSWORD);

	await page.waitForSelector('form > .loginform > .loginlist:nth-child(4) > .loginlistright > input');
	await page.click('form > .loginform > .loginlist:nth-child(4) > .loginlistright > input',{delay:250});

	while(true){
		try{
			//wait until my page emerged
			console.log("wait until my page emerged");
			await page.waitFor(300);
			let myName = await page.evaluate(()=>{
				let name = document.querySelector(".outer > .employeestatus > .clo01:nth-child(1) > p:nth-child(1) > strong");
				if(name){
					return name.innerText;
				}else{
					return null;
				}
			});
			console.log("still waiting");
			if(myName && myName.includes("Ahmad Labib")){
				break;
			}
		}catch(err){
			console.log("error : "+err);
		}
	}
	console.log("reset page success");
}

scrape(startLink);
