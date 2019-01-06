const puppeteer = require("puppeteer");
const userAgent = require("random-useragent");
const fs = require("fs");

var URL = "https://projects.co.id/public/past_projects/listing";
const usingChrome = { headless: false, executablePath : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" };
const usingChromium = { headless: false};

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
let clickCounter=0;
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
  	const resultDirectory = ".\\Result\\projects_links\\projects";
  	fs.mkdir(resultDirectory,function(e){
  	if(!e || (e && e.code === 'EEXIST')){
  		console.log("directory projects_links_project created");
  	} else {
		  //debug
		  console.log(e);
		}
	});

	// Actual Scraping goes Here...
	console.log("going to "+URL);
	await page.goto(URL, { timeout: 0 });
	
	var projects = [];
	let showPage = 1;
	let nextButtonChildId = 10;
  	while(showPage<=1200){
  		console.log("\n\n");  
  		console.log("======================= START ============================");
	  	console.log("getting project details from page " +showPage);    
	  	projects = await getAllProjectDetails(page,nextButtonChildId);
	  	console.log("getting project details process was done");
	  	console.log(projects);
	  	 
  		let fileExist = -1;
  		let index = 0;
  		let fileName = "";
  		while(fileExist != 0){

  			if(index === 0){
  				fileName = resultDirectory+"\\page"+showPage+".txt";
  			}else{
  				fileName = resultDirectory+"\\page"+showPage+"("+ index +").txt";
  			}
  			if(fs.existsSync(fileName)){
  				index++;
  			}else{
  				fileExist = 0;
  			}
  		}

  		var outStream = fs.createWriteStream(fileName);
  		console.log("writing links into file: "+fileName);

	  	if(projects[0]){  	
  	  		for(let project of projects){
  	  			// project = project.replace((/  |\r\n|\n|\r/gm),"");
				outStream.write(project + "\n");
			}
	  		outStream.end();
	  		console.log("page "+showPage+" was recorded!");

	  		if(nextButtonChildId<15){
	  			nextButtonChildId++;
	  		}
	  		
	  	}else{
			outStream.write("error occured when reading this page\n");
	  		outStream.end();
	  		console.log("page "+showPage+" was recorded!");
	  	}
	  	showPage++;
	  	console.log("======================== END ============================");
	}
	browser.close(); 
	finishFlag = 1;
	return finishFlag;
};


async function getAllProjectDetails(page,nextBtnId){
	let project = [];
	let project1 = [];
	let projectDetails = [];

	try{
		project = await page.evaluate(() => {
			let name = [];
			let elements = document.querySelectorAll('.form-body > .row > .col-md-10 > h2 > a');
			for(let i = 0;i<elements.length;i++){
				name.push(elements[i].innerText.replace((/  |\r\n|\n|\r/gm),"").replace(/,/g, "."));
			}
			return name;
		});

		for(let pro of project){
			project1.push(pro);
		}
		if(project[0]){
			let elements = [];
			projectDetails = await page.evaluate(() => {
				let theDetails = [];
				elements = document.querySelectorAll('.row > .col-md-10 > .col-md-12 > .row > .col-md-6:nth-child(2)');				
				if(elements[0]){
					let dateElements = document.querySelectorAll(".row > .col-md-10 > .col-md-12 > .row > .col-md-6:nth-child(1)");
					for(let i=0;i<elements.length;i++){
						let details = elements[i].textContent.replace((/  |\r\n|\n|\r/gm),"//").replace(/,/g, ".").split("//");
						let detailStr = "";
						detailStr = detailStr + details[3].substring(0,details[3].indexOf("Accepted")) + ",";
						detailStr = detailStr + details[4].substring(0,details[4].indexOf("Project")) + ",";
						detailStr = detailStr + details[5].substring(0,details[5].indexOf("Finish"))+ ",";
						if(dateElements[0]){
							//date
							let date = dateElements[i].innerText.toLowerCase().replace(/ /g,'');
							let index = date.indexOf("startdate:")+10;
							detailStr = detailStr + date.substring(index,index+10);
						}else{
							detailStr = detailStr + "--";
						}
						theDetails.push(detailStr);
					}	
				}
				return theDetails;
			});

			for(let i=0;i<project.length;i++){
				let projectName = project[i];
				project[i] = projectName + ","+projectDetails[i];
			}
		}else{
			project.push("no project in this page");
		}
	}catch(err1){
		console.log("Data parsing error : "+ err1);
	}

	console.log("click to next page")
	try{
		//click next page
		let selector = '.row:nth-child(1) > .col-md-12 > .pull-right > .pagination > li:nth-child('+ nextBtnId +') > .ajax-url';
		await page.waitForSelector(selector);
		await page.click(selector,{delay:250});
		await page.waitFor(500);	
	  	while(true){
		  	let project2 = [];
		  	project2 = await page.evaluate(() => {
				let name = [];
				let elements = document.querySelectorAll('.form-body > .row > .col-md-10 > h2 > a');
				for(let i = 0;i<elements.length;i++){
					name.push(elements[i].innerText.replace((/  |\r\n|\n|\r/gm),""));
				}
				return name;
			});

		  	if(compareArray(project1, project2)){
		  		await page.waitFor(TIME_DELAY_1);
		  		console.log("Wait until next page page reloaded")
		  	}else{
		  		await page.waitFor(TIME_DELAY_1);
		  		break;
		  	}
	  	}
  	}catch(err2){
		console.log("Click to next page error : "+ err2);
	}

  	return project;
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

scrape();