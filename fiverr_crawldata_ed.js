const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;


const PROXY_LIST = ["no-proxy",
					"--proxy-server=http://36.37.85.50:41367",
					"--proxy-server=http://36.37.89.99:32323",
					"--proxy-server=http://36.89.39.10:3128",
					"--proxy-server=http://203.99.123.25:61502",
					"--proxy-server=http://36.91.48.82:8080",//lemot tapi ok
					"--proxy-server=http://203.77.215.250:61474",
					"--proxy-server=http://110.232.86.6:54022",
					"--proxy-server=http://222.124.131.211:47343",
					"--proxy-server=http://202.93.128.98:3128",
					"--proxy-server=http://203.142.64.35:45458",
					"--proxy-server=http://123.231.230.130:42259",
					"--proxy-server=http://222.165.222.137:30687",
					"--proxy-server=http://117.54.234.36:42455",
					"--proxy-server=http://203.77.215.250:61474"
					];

const MAX_FAIL_LIMIT = PROXY_LIST.length;
let proxyId = 0;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	//prepare browser
	await resetPage(false,false);

	const linksDir  = ".\\DataMatang\\Education\\";
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"Fiverr.csv";
		}else{
			fileName = linksDir+"Fiverr("+ index +").csv";
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
	// const databaseFile  = linksDir + "database.txt";
	const databaseFile  = linksDir + "FiverrEd.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	//process
	let failCounter = 0;
	let previousLink = "";
	for (let j = startLink;j<links.length;j++) {
		console.log("==================================== START ====================================");
		console.log("Data ID = "+j);
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		console.log("crawl employee data was done");
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
			console.log("reset browser...");
			await resetPage(true,true);
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}else{
				failCounter = 0;
			}
		}
		previousLink = links[j];
		console.log("===================================== END =====================================");
	}
	outStream.end();
	browser.close(); 
	// Return a value
	return 1;
};

async function crawlEmployeeData(url){
	console.log('going to next page...');
	let userUrl = "https://www.fiverr.com/"+url; //comment this 
	while(true){
		try{
			await page.goto(userUrl, { timeout: 180000, waitUntil : 'load'});
			// await page.goto(url, { timeout: 180000, waitUntil : 'load'});
			break; 
		}catch(err){
			await resetPage(true,true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".seller-card > .user-profile-info > .user-profile-label > .username-line > .seller-link",	//0 NAME
						".education > section > .items-list"														//1 EDU
						];
	//general variables of employee 				
	let employeeData = [];

	employeeData = await page.evaluate((selectors)=>{
		let output = [];
		//nama, anggota sejak, jml proyek selesai, skills, last project Date,offer name
		var data;		
		try{
			for(let i = 0; i<2;i++){
				data = document.querySelector(selectors[i]);
				if(data){
					output.push(data.innerText.replace(/,/g, "."));
				}else{
					output.push("--");
				}
			}
		}catch(err){
			console.log("Error in retreive employee data:");
			console.log(err);
			output.push("-------");
		}
		return output;
	},selectors);

	let educationLevel;
	let education = employeeData[1].toLowerCase();
	if(education.includes("universitas") || education.includes("university") || education.includes("univ") 
		|| education.includes("institut") || education.includes("institute") || education.includes("institution")
		|| education.includes("stt") || education.includes("sekolah tinggi") || education.includes("st")){
		if(education.includes("doctor") || education.includes("phd")){
			educationLevel = "S3";
		}else if(education.includes("magister") || education.includes("master")){
			educationLevel = "S2";
		}else if(education.includes("sarjana") || education.includes("bachelor") ||  education.includes("b.sc") 
			|| education.includes("bsc")|| education.includes("S.T") || education.includes("ST")){
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
	}else{
		educationLevel = "unknown";
	}
	employeeData.push(educationLevel);
	return employeeData;	
}



async function resetPage(resetBrowser,rotateProxy){
	if(resetBrowser){
		console.log("reset browser...");
		browser.close();
	}
	//rotate proxy

	if(rotateProxy){
		proxyId++;
		if(proxyId >= PROXY_LIST.length){
			proxyId = 0;
		}	
	}

	let proxyStr = PROXY_LIST[proxyId];
	console.log("using proxy: "+ proxyId + ". "+proxyStr);
	if(proxyId==0){
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
	}else{
		browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'args' : [proxyStr]});
	}
	page = await browser.newPage();
	agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ 'user-agent': agent});
	console.log("reset page success");
}

await scrape(startLink);
console.log("done");
