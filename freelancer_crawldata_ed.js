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

    const linksDir 	= ".\\DataMatang\\Education\\";

	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"Freelancer.csv";
		}else{
			fileName = linksDir+"Freelancer("+ index +").csv";
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
	const databaseFile 	= linksDir + "FreelancerEd.txt";
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
    outStream.end();
    browser.close(); 
  	// Return a value
  	return result;
};

async function crawlEmployeeData(page, url){
    console.log('going to next page...');
    let userUrl = "https://www.freelancer.com/u/"+url;
    await page.goto(userUrl,{ timeout: 0 , waitUntil : 'load'});
    console.log('getting employee data...');
    const res = await page.evaluate(() => {
        let name = document.querySelector(".profile-intro-username");
        let education =  document.querySelectorAll('.profile-components-row > .profile-components-main > .profile-experience');
        let data = [];

        if(name){
            data.push(name.textContent);
        }else{
            data.push('--');
        }

        if(education[0]){
            let eduStr = "--";
            for(let i = 0; i<education.length;i++){
                eduStr = education[i].innerText.toLowerCase();
                if(eduStr.includes("education")){
                    break;
                }else{
                    eduStr = "--";
                }
            }
            data.push(eduStr);
        }else{
            data.push("--");
        }
        return data;
    });

    let educationLevel;
    let education = res[1].toLowerCase();
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
        }else if(education.includes("d2")){
            educationLevel = "D2";
        }else if(education.includes("d1")){
            educationLevel = "D1";
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
    res.push(educationLevel);
    return res;
}

scrape(startLink);
