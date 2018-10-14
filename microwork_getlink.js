const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

const URLs = [	"https://microworkers.com/hm_pool.php?Sort=TASKS&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=NEWEST&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=BADGE&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=RANDOM&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=SUBMITTED&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=CITY&Id_badge=",
				"https://microworkers.com/hm_pool.php?Sort=FAVORITE&Id_badge="];

const badges = ["GENERAL&Countrycode=id",
				"FACEBOOK&Countrycode=id",
				"BOOKMARK&Countrycode=id",
				"TWITTER&Countrycode=id",
				"VOTING&Countrycode=id",
				"YOUTUBE&Countrycode=id",
				"PR&Countrycode=id"];				

const email	= "fardanylabib@gmail.com";
const password = "Suudiyah001";

const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;

const scrape = async () => {
	let finishFlag = 0
	var browser = await puppeteer.launch(usingChrome);
	var page = await browser.newPage();
	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
	console.log(agent);
	page.setExtraHTTPHeaders({ "user-agent": agent});
	//make file directory
	const resultDirectory = ".\\Result\\microwork_links";
	fs.mkdir(resultDirectory,function(e){
	    if(!e || (e && e.code === 'EEXIST')){
	        console.log("directory microwork_links created");
	    } else {
	        //debug
	        console.log(e);
	    }
	});

	console.log("going to "+URLs[0]);
	await page.goto(URLs[0], { timeout: 0 });
	
	//login process
	let selector = 'form > .loginform > .loginlist:nth-child(1) > .loginlistright > .txt';
	await page.waitForSelector(selector);
	await page.type(selector, email);
	
	selector = 'form > .loginform > .loginlist:nth-child(2) > .loginlistright > .txt';
	await page.waitForSelector(selector);
	await page.type(selector, password);

	selector = 'form > .loginform > .loginlist:nth-child(4) > .loginlistright > input';
	await page.waitForSelector(selector);
	await page.click(selector);

  	await page.waitFor(TIME_DELAY_2);

  	
  	for(let badgeID = 0; badgeID<badges.length; badgeID++){
	  	let urlID = 0;
		while(urlID < URLs.length){
			var links= [];
			await page.goto(URLs[urlID]+badges[badgeID], { timeout: 0 });
			console.log("getting links from page " +URLs[urlID]+badges[badgeID]);
			links = await getAllEmployeeLinks(page);
			console.log("getting links process was done");	
			console.log(links);

			if(links[0]){		
				let fileExist = -1;
				let index = 0;
				let fileName = "";
				while(fileExist != 0){

					if(index === 0){
						fileName = resultDirectory+"\\page"+urlID+".txt";
					}else{
						fileName = resultDirectory+"\\page"+urlID+"("+ index +").txt";
					}
		  			if(fs.existsSync(fileName)){
		  				index++;
		  			}else{
		  				fileExist = 0;
		  			}
					console.log(fileName);
				}
					
				var stream = fs.createWriteStream(fileName);
				console.log("writing links into file...");
				for(const link of links){
					stream.write(link + '\n');
				}
				stream.end();
				console.log("page "+URLs[urlID]+" was recorded!");
			}
			urlID++;
		}
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllEmployeeLinks(page){
	
	let userLinks = [];
	console.log("get user links")
	userLinks = await page.evaluate(() => {
		let links = [];
    	let elements = document.querySelectorAll(".poollistarea .poollist .poolworker p a");
    	for(let i = 0;i<elements.length;i++){
			links.push(elements[i].href);
		}
    	return links;
	});
	console.log("Number of users = "+userLinks.length);
	return userLinks;
}

scrape();