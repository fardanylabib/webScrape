const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;
const MAX_WAIT_LIMIT = 30;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	// Actual Scraping goes Here...
	await resetPage(false);

	const linksDir  = ".\\DataMatang\\Education\\";

	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"Sribulancer.csv";
		}else{
			fileName = linksDir+"Sribulancer("+ index +").csv";
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
	const databaseFile  = linksDir + "SribulancerEd.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");
	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
			for(let data of employeeData){
				data = data.replace(/,/g, ".");
				data = data.replace((/  |\r\n|\n|\r/gm),"//");
				outStream.write(data + ",");
			}
			outStream.write("\n");
			console.log(employeeData);
			failCounter = 0;
		}else{
			failCounter++;
			console.log("reset browser...");
			browser.close();
			browser = await puppeteer.launch({ headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
			page = await browser.newPage();
			agent = userAgent.getRandom(function (ua) {
				return ua.osName === 'Linux';
			});
			console.log(agent);
			page.setExtraHTTPHeaders({ "user-agent": agent});
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
			await page.goto(url, { timeout: 180000, waitUntil : 'domcontentloaded'});
			await page.waitFor(TIME_DELAY_1/2);
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".row > .col-md-5 > .col-md-12 > .user__info-app > .user__username:nth-child(1)", 	//0 NAME
						".row > .col-md-5 > .col-md-12 > .user__info-app > .user__username:nth-child(3)", 	//1 nickname	
						".row > .col-sm-12 > #myTab > .active > a",											//2 ACTIVE TAB	
						".row > .col-sm-12 > #myTab > li > a",												//3 REVIEW TAB	
						".tab-content > #profile_tab > .compact > .educationShow"							//4 education
						];
	//check if all selector needed were available

	let resetPageCounter = 0;
	while (resetPageCounter<3){
		let wait = true;
		let waitCounter = 0;
		while(wait){
			wait = await page.evaluate((selectors) => {
				let flag = null;
				for(let i = 0 ;i<2;i++){
					flag = document.querySelector(selectors[i]);
					if(flag){
						//do nothing
					}else{
						return true;
					}
				}
				return false; //end point inside loop
			},selectors);
			console.log("wait counter = " + waitCounter + " reset page counter = "+resetPageCounter);
			if(waitCounter > MAX_WAIT_LIMIT){
				await resetPage(true);
				while(true){
					try{
						await page.goto(url, { timeout: 180000, waitUntil : 'domcontentloaded'});
						await page.waitFor(TIME_DELAY_1/2);
						break; 
					}catch(err){
						await resetPage(true);
					}
				}
				resetPageCounter++;
				break;
			}
			waitCounter++;
			await page.waitFor(TIME_DELAY_1);
		}
		if(wait == false){
			break; //end point outside loop
		}
		console.log('waiting done');	
	}

	let res = [];
	if(resetPageCounter>=3){
		res.push("account closed");
		return res;
	}
	
	res = await page.evaluate((selectors) => {
		let name = document.querySelector(selectors[0]);
		let nickname = document.querySelector(selectors[1]);

		let data = [];

		if(name){
			data.push(name.textContent);
		}else{
			data.push('--');
		}

		if(nickname){
			data.push(nickname.textContent);
		}else{
			data.push('--');
		}
		return data;
	},selectors);

	//go to review tab
	// let nbOfTab = await page.evaluate((selectors) =>{
	// 	let tabs  = document.querySelectorAll(selectors[3]);
	// 	if(tabs){
	// 		return tabs.length;
	// 	}else{
	// 		return 0;
	// 	}
	// },selectors);

	let currentTabName = await page.evaluate((selectors) =>{
		let currentTab  = document.querySelector(selectors[2]);
		if(currentTab){
			return currentTab.innerText;
		}else{
			return null;
		}
	},selectors);

	if(currentTabName){
		if(currentTabName !== "Profile"){
			await page.waitForSelector(".row > .col-sm-12 > #myTab > li:nth-child(2) > a");
			await page.click(".row > .col-sm-12 > #myTab > li:nth-child(2) > a",{delay:250});
		}
	}
	
	await page.waitFor(TIME_DELAY_1);
	let education = await page.evaluate((selectors) => {
		let edu = document.querySelector(selectors[4]);
		if(edu){
			return edu.innerText;
		}else{
			return "--";
		}
	},selectors);

	let educationLevel;
	education = education.toLowerCase();
	if(education.includes("universitas") || education.includes("university") || education.includes("univ") 
		|| education.includes("institut") || education.includes("institute") || education.includes("institution")
		|| education.includes("stt") || education.includes("sekolah tinggi") || education.includes("st")){
		if(education.includes("doctor") || education.includes("phd")){
			educationLevel = "S3";
		}else if(education.includes("magister") || education.includes("master")){
			educationLevel = "S2";
		}else if(education.includes("sarjana") || education.includes("bachelor")){
			educationLevel = "S1";
		}else if(education.includes("d3") || education.includes("vokasi")){
			educationLevel = "D3";
		}else if(education.includes("stm")){
			educationLevel = "SMA/SMK";
		}else{
			educationLevel = "S1";
		}

	}else if(education.includes("poltek") || education.includes("politeknik")|| education.includes("poli") || education.includes("polt")){
		educationLevel = "D3";
	}else if(education.includes("smk") || education.includes("sma")){
		educationLevel = "SMA/SMK";
	}else if(education.includes("bachelor")|| education.includes("sarjana")){
		educationLevel = "S1";
	}else{
		educationLevel = "unknown";
	}

	res.push(educationLevel);
	res.push(education);
	return res;
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
	console.log("reset page success");
}

scrape(startLink);
