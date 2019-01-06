const puppeteer = require('puppeteer');
const userAgent = require('random-useragent');
const fs = require("fs");

const TIME_DELAY_1 = 1000;
const TIME_DELAY_2 = 2000;
const MAX_FAIL_LIMIT = 5;

const scrape = async () => {
 	// Actual Scraping goes Here...
  	var browser = await puppeteer.launch({ headless: false, executablePath : 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' });
  	var page = await browser.newPage();
  	var agent = userAgent.getRandom(function (ua) {
		return ua.osName === 'Linux';
	});
  	console.log(agent);
  	page.setExtraHTTPHeaders({ 'user-agent': agent});
  	
	const linksDir 	= ".\\DataMatang\\";
	
	//output path setup
	let fileExist = -1;
	let index = 0;
	let fileName = "";
	while(fileExist != 0){
		if(index === 0){
			fileName = linksDir+"SkillList.csv";
		}else{
			fileName = linksDir+"SkillList("+ index +").csv";
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
    var skillData=[];
    skillData = await crawlSkillData(page);
  	for (let skill of skillData) {
        skill = skill.toLowerCase();
        outStream.write(skill + "\n");
        console.log(skill);
    }
	outStream.end();
	browser.close(); 
  	// Return a value
  	return 1;
};

async function crawlSkillData(page){
	console.log("going to: https://www.freelancer.com/freelancers/");
	await page.goto("https://www.freelancer.com/freelancers/",{ timeout: 0 , waitUntil : 'load'});
	let result = await page.evaluate(() => {
        let skillData = [];
        let mainSkill = document.querySelectorAll("#filters-more-content > #skill_selector_div > #category_group > .filter-slider-folding > .category_jobs_name");
        if(mainSkill[0]){
            for(let i = 0;i<mainSkill.length;i++){
                let mainSkillStr = mainSkill[i].innerText;
                mainSkillStr = mainSkillStr.replace(/,/g, "");
                mainSkillStr = mainSkillStr.replace((/  |\r\n|\n|\r/gm),"");
                var subSkills = document.querySelectorAll('.category_jobs_div')[i];
                if(subSkills){
                    subSkills = subSkills.innerText;
                    subSkills = subSkills.replace(/,/g, "");
                    subSkills = subSkills.replace((/  |\r|\r/gm),"");
                    subSkills = subSkills.split("\n");
                    for(let skill of subSkills){
                        skillData.push(skill + "," +mainSkillStr);
                    }
                }else{
                    console.log("Sub Skill "+ (i+1) +" selector not found");
                }
            }
        }else{
            console.log("Main Skill selector not found");
        }

        let unitSkill = document.querySelectorAll('.nav.nav-list li');
        if(unitSkill[0]){
            for(let skill of unitSkill){
                let skillStr = skill.innerText.replace((/  |\r\n|\n|\r/gm),"");
                skillStr = skillStr.replace(/,/g, "");
                skillData.push(skillStr);
            }
        }else{
             console.log("Unit Skill selector not found");
        }
        return skillData;
  	});
  	return result;
}

scrape();
