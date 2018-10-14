const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;

let startLink = process.argv[2] - 1;

const scrape = async (start) => {
	// Actual Scraping goes Here...
	var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
	var page = await browser.newPage();
	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
		
	const linksDir 	= ".\\Result\\truelancer_links\\";
	
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
	const databaseFile 	= linksDir + "database.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");
	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		var employeeData=[];
		employeeData = await crawlEmployeeData(page,links[j]);
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
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

async function crawlEmployeeData(page, url){
	console.log('going to next page...');
	await page.goto(url,{ timeout: 0 , waitUntil : 'domcontentloaded'});
	console.log('getting employee data...');
	const res = await page.evaluate(() => {
		let name = document.querySelector(".padding0.col-md-12.user_name.tl_gap_top_10 .col-md-7.padding0 .profile_name");
		let specialization = document.querySelector(".padding0.col-md-8.col-xs-12.tagline");
		let skillSet = document.querySelectorAll(".skill-tag.pull-left.label.label-default.space.no-shad.left-smspace.bot-smspace.uppercase");
		let projects = document.querySelectorAll(".user_jobfeedbacks > .row-fluid > .col-md-10 > .endorsement_text > div");
		let location = document.querySelector(".bg_white > .col-xs-12 > .col-md-5 > span > small");
		let attrib3 = document.querySelector(".tab-content > #information > .bg_white > .col-md-12 > .tl_gap_5");
		let attrib15 = document.querySelector(".col-md-12 > .tl-table:nth-child(2) > tbody > tr:nth-child(1) > .value");

		let data = [];

		if(name){
			data.push(name.textContent);
		}else{
			data.push('--');
		}

		if(specialization){
			data.push(specialization.textContent);
		}else{
			data.push('--');
		}
		
		let strData = "";
		for(let skill of skillSet){
			if(skill){
				strData = strData + skill.innerText + "//";
			}else{
				strData = strData+"--";
			}
		} 
		data.push(strData);

		strData = "";
		for(let project of projects){
			if(project){
				strData = strData + project.innerText + "//";
			}else{
				strData = strData+"--";
			}
		} 
		data.push(strData);    	

		if(location){
			data.push(location.innerText);
		}else{
			data.push("--");
		}   

		if(attrib15){
			data.push(attrib15.innerText);
		}else{
			data.push("0");
		}		    	
		return data;
	});
	return res;
}

scrape(startLink);
