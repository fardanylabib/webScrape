const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

var startLink = process.argv[2] - 1;

var browser;
var page;
var agent;
var links; 

const scrape = async (startLink) => {

 	console.log("URL ID = "+startLink);
	/*INITIALIZATION START
	*/
	//output path setup
 	const linksDir 	= ".\\Result\\projects_links\\";	
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

  	//output path setup
  	const databaseFile 	= linksDir + "database.txt";
  	links = fs.readFileSync(databaseFile);
  	links = links.toString();
  	links = links.split("\n");

  	/*INITIALIZATION DONE
	*/

  	await resetPage(false);
  	let failCounter = 0;
  	for (let j = startLink;j<links.length;j++) {
  		console.log("======================= START ============================");
  		var employeeData=[];
  		employeeData = await crawlEmployeeData(j);

  		if(employeeData[0] !== "--" || employeeData[1] !== "--"){
  			console.log("writing links into file...");
  	  		for(let data of employeeData){
  	  			data = data.replace(/,/g, ".");
  	  			data = data.replace((/  |\r\n|\n|\r/gm),"");
				outStream.write(data + ",");
			}
			outStream.write("\n");
			
			failCounter = 0;
  		}else{
  			if(failCounter>3){
  				failCounter=0; //skip this error user
  				continue;
  			}else{
  				failCounter++; //raise fail counter
	  			j--; //repeat current user
	  			await resetPage(true);
  			}
  		}
  		console.log("====================== END =============================");
  	}

 	outStream.end();
 	browser.close(); 
  	// Return a value
  	return result;
  };

scrape(startLink);

async function crawlEmployeeData(urlID){
  	console.log('going to next page...');
  	let repeat = true;
  	let failCounter = 0;
  	while(repeat && failCounter<10){
  		try{
  			console.log("go to URL_ID "+ urlID);
  			await page.goto(links[urlID],{ timeout: 0 , waitUntil : 'domcontentloaded'});

  			let pageHeader = await page.evaluate(()=>{
				return document.title; 
			});
			pageHeader = pageHeader.toLowerCase();
			if(pageHeader.includes("user profile")){
				console.log("berhasil masuk page");
  				repeat = false;
  				failCounter = 0;
  			}else{
  				failCounter+=2;
  				console.log("masuk page gagal");
  				await resetPage(true);
  			}
  		}catch(err){
  			failCounter++;
  			console.log("masuk page error");
  			await resetPage(true);
  		}
  	}
  	
  	console.log('getting employee data...');
  	let result = [];
  	result = await page.evaluate((urlID) => {
  		let profile = document.querySelectorAll('.align-left > .table-striped > tbody > tr > td:nth-child(2)');
  		let skills = document.querySelectorAll('.row > .align-left > p > .label-default > .white');
  		let services = document.querySelectorAll('#ds_services > .row > .align-left > h4 > .more'); 
  		let data = [];
  		data.push(""+urlID); 		
  	  	if(profile[0]){
  	  		for(var detail of profile){
  	  			detail = detail.textContent;
  	  			if(detail.length > 0){
  	  				data.push(detail);
  	  			}else{
  	  				data.push("--");
  	  			}
  	  		}
  	  	}else{
  	  		for(let i=0;i<11;i++){
  	  			data.push('--');
  	  		}
  	  	}

  	  	if(skills[0]){
  	  		let strSkill="";
  	  		for(var skill of skills){
  	  			skill = skill.textContent;
  	  			strSkill = strSkill+skill+"//";
  	  		}
  	  		data.push(strSkill);
  	  	}else{
  	  		data.push('--');
  	  	}

  	  	if(services[0]){
  	  		let strServ="";
  	  		for(var service of services){
  	  			service = service.textContent;
  	  			strServ = strServ+service+"//";
  	  		}
  	  		data.push(strServ);
  	  	}else{
  	  		data.push('--');
  	  	}
  	  	return data;	
  	},urlID);
  	console.log(result);
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