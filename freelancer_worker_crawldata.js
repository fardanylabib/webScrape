const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;

var startLink = process.argv[2] - 1;

const scrape = async (start) => {
 	// Actual Scraping goes Here...
  	var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
  	var page = await browser.newPage();
  	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
  	console.log(agent);
  	page.setExtraHTTPHeaders({ 'user-agent': agent});
  	
	const linksDir 	= ".\\Result\\freelancer_links\\";
	
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"RawDataWorker.csv";
		}else{
			fileName = linksDir+"RawDataWorker("+ index +").csv";
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
	const databaseFile 	= linksDir + "database_worker.txt";
  	var links = fs.readFileSync(databaseFile);
  	links = links.toString();
  	links = links.split("\n");
  	let failCounter = 0;
  	for (let j = startLink;j<links.length;j++) {
  		var employeeData=[];
      let urlString = "https://www.freelancer.com/u/"+links[j];
  		employeeData = await crawlEmployeeData(page,urlString);
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
  	  	let name = document.querySelector(".profile-intro-username");
  	  	let specialization = document.querySelector(".profile-user-byline");
  	  	let skillSet = document.querySelectorAll('#profile-skills-wrapper > #skills > .VerificationsList-item > .VerificationsList-label > a');
  	  	let projects = document.querySelectorAll('.profile-components-main > #profile-reviews > .user-reviews > .user-review > .user-review-title');
  	  	let city = document.querySelector(".PageProfile-info-locality");
  	  	let attrib17 = document.querySelector(".Earnings .Earnings-label");
  	  	let attrib3 = document.querySelector(".profile-membership-length");

        let lastProjectDate = document.querySelector("#profile-reviews > .user-reviews > .user-review:nth-child(1) > .user-review-details > span:nth-child(2)");

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

    	if(city){
  	  		data.push(city.textContent);
  	  	}else{
  	  		data.push('--');
  	  	}

    	if(attrib17){
    		data.push(attrib17.textContent);
    	}else{
    		data.push("0.0");
    	}		    	
		
    	if(attrib3){
    		data.push(attrib3.textContent);
    	}else{
    		data.push("--");
    	}

      if(lastProjectDate){
        data.push(lastProjectDate.textContent);
      }else{
        data.push("--");
      }

		return data;
  	});
  	return res;
}

scrape(startLink);
