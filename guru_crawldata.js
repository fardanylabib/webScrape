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
		
	const linksDir 	= ".\\Result\\guru_links\\";
	
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
	await page.goto(url,{ timeout: 0 , waitUntil : 'load'});
	console.log('getting employee data...');
	const res = await page.evaluate(() => {
		let name = document.querySelector(".clearfix h4 span");
		let specialization = document.querySelector(".innerModule .aboutUs .tagline");
		let skillSet = document.querySelectorAll(".profile-skills.profile-skills-title li");
		let projects = document.querySelectorAll(".services.lazyl .serviceItem.clearfix.lazyl .clearfix .serviceHeader.clearfix .servTitle .linkpd");
		let location = document.querySelectorAll("div > .profile-meta > .location-info > span > span");
		let attrib16 = document.querySelector(".dropdown > #statsWell > .grid_list > li > .stats-earnings");

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

		strData = "";
		for(let loc of location){
			if(loc){
					strData = strData + loc.innerText + "//";
			}else{
				strData = strData+"--";
			}
		} 
		data.push(strData);   

		if(attrib16){
			data.push(attrib16.innerText);
		}else{
			data.push("0");
		}		    	
		return data;
	});
	return res;
}

scrape(startLink);
