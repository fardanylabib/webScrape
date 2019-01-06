const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 3;
let startLink = process.argv[2] - 1;

var browser;
var page;
var agent;

const scrape = async (start) => {
	//prepare browser
	await resetPage(false);

	const linksDir  =  ".\\DataMatang\\Education\\";
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"Fastwork.csv";
		}else{
			fileName = linksDir+"Fastwork("+ index +").csv";
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
	const databaseFile  = linksDir + "FastworkEd.txt";
	var links = fs.readFileSync(databaseFile);
	links = links.toString();
	links = links.split("\n");

	//process
	let failCounter = 0;
	for (let j = startLink;j<links.length;j++) {
		console.log("==================================== START ====================================");
		var employeeData=[];
		employeeData = await crawlEmployeeData(links[j]);
		console.log("crawl employee data was done");
		if(employeeData[0] !=="--"){
			console.log("writing links into file...");
			console.log("Data ID = "+j);
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
			await resetPage(true);
			if(failCounter<MAX_FAIL_LIMIT){
				j--;
			}
		}
		console.log("===================================== END =====================================");
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
			let userUrl = "https://fastwork.id/user/"+url;
			await page.goto(userUrl, { timeout: 100000, waitUntil : 'load'});
			break; 
		}catch(err){
			await resetPage(true);
  		}
	}

	console.log('getting employee data...');
	const selectors = [	".header > .fw-container > .profile > .profile__info > .username",							//0 NAME
						".content > .content-side > div > .card"													//1 infomasi
						];
	//general variables of employee 				
	let employeeData = [];

	employeeData = await page.evaluate((selectors)=>{
		let output = [];
		//nama, anggota sejak, jml proyek selesai, skills, last project Date,offer name
		var data;		
		try{
			data = document.querySelector(selectors[0]);
			if(data){
				output.push(data.innerText.replace(/,/g, "."));
			}else{
				output.push("--");
			}
			//informasi edukasi
			data = document.querySelectorAll(selectors[1]);
			if(data[0]){
				let eduStr = "--";
				for(let i = 0; i<data.length;i++){
					eduStr = data[i].innerText.toLowerCase();
					if(eduStr.includes("pendidikan")){
						break;
					}else{
						eduStr = "--";
					}
				}
				output.push(eduStr);
			}else{
				output.push("--");
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
            educationLevel = "Doktor";
        }else if(education.includes("magister") || education.includes("master")){
            educationLevel = "Magister";
        }else if(education.includes("sarjana") || education.includes("bachelor") ||  education.includes("b.sc") 
            || education.includes("bsc")|| education.includes("S.T") || education.includes("ST")){
            educationLevel = "Sarjana";
        }else if(education.includes("d4") || education.includes("vokasi")){
            educationLevel = "Diploma 4";
        }else if(education.includes("d3") || education.includes("a.md")|| education.includes("amd")){
            educationLevel = "Diploma 3";
        }else if(education.includes("d2")){
            educationLevel = "Diploma 2";
        }else if(education.includes("d1")){
            educationLevel = "Diploma 1";
        }else if(education.includes("stm") || education.includes("high school")){
            educationLevel = "SMA/SMK";
        }else{
            educationLevel = "Sarjana";
        }
    }else if(education.includes("poltek") || education.includes("politeknik")|| education.includes("poli") || education.includes("polt")){
        educationLevel = "Diploma 3";
    }else if(education.includes("smk") || education.includes("sma") || education.includes("high school")){
        educationLevel = "SMA/SMK";
    }else{
        educationLevel = "--";
    }
    employeeData.push(educationLevel);

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
	console.log("reset page success");
}

function compareArray(arr1, arr2){
	if(arr1.length !== arr2.length){
		return false;
	}
	for(var i = 0; i< arr1.length ; i++){
		if(arr1[i] !== arr2[i]){
			return false;
		}
	}
	return true;
}


async function checkNextButton(selectors){
	let buttonId = await page.evaluate((selectors) => {
		let available = document.querySelector(selectors[8]);
    	if(available){
    		return 8;
    	}
    	available = document.querySelector(selectors[14]);
    	if(available){
    		return 14;
    	}
    	available = document.querySelector(selectors[15]);
    	if(available){
    		return 15;
    	}else{
    		return 0;
    	} 
	},selectors);
	return buttonId;
}

scrape(startLink);
