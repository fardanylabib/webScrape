const fs 		= require("fs");
const natural 	= require("natural");
const nalapa 	= require("nalapa");
const stemmerEn = require("wink-porter2-stemmer");
const stopwordEn = require("stopword");

const stemmerId		= nalapa.word;
const tokenizerEn  	= new natural.WordTokenizer();
const tokenizerId	= nalapa.tokenizer;

const linksDir  = ".\\DataMatang\\Archieve\\";
//input path setup
var source 		= fs.readFileSync(linksDir + "StemTokenSource.csv");
source = source.toString();
source = source.split("\r");

class JobCategory{
	constructor(categoryName){
		this.categoryName = categoryName;
		this.skills = new Array();
		this.mainSkills = new Array();
		this.stemmedSkills = new Array();
		this.skillsID = new Array();
		this.stemmedSkillsID = new Array();
		this.isHasStemmed = false;
		this.isHasStemmedID = false;
	}

	getName(){
		return this.categoryName;
	}	
	addSkill(skill){
		this.skills.push(skill);
	}
	addMainSkill(skill){
		this.mainSkills.push(skill);
	}

	getSkills(){
		return this.skills;
	}
	getMainSkills(){
		return this.mainSkills;
	}

	setStemmedSkills(skill){
		this.isHasStemmed = true;
		this.stemmedSkills = skill;
	}

	getStemmedSkills(){
		if(this.isHasStemmed){
			return this.stemmedSkills;
		}else{
			return null;
		}
	}

	addSkillID(skill){
		this.skillsID.push(skill);
	}

	getSkillsID(){
		return this.skillsID;
	}

	setStemmedSkillsID(skill){
		this.isHasStemmedID = true;
		this.stemmedSkillsID = skill;
	}

	getStemmedSkillsID(){
		if(this.isHasStemmedID){
			return this.stemmedSkillsID;
		}else{
			return null;
		}
	}
}

var jobCategories = new Array();

jobCategories.push(new JobCategory("professional services"));
jobCategories.push(new JobCategory("creative and multimedia"));
jobCategories.push(new JobCategory("clerical and data entry"));
jobCategories.push(new JobCategory("sales and maketing support"));
jobCategories.push(new JobCategory("software development and technology"));
jobCategories.push(new JobCategory("writing and translation"));
jobCategories.push(new JobCategory("other"));

var ontologySource = fs.readFileSync(linksDir + "SkillList.csv");
ontologySource = ontologySource.toString();
ontologySource = ontologySource.split("\r");

let currentMainSkill ="";
for(let i=1;i<ontologySource.length;i++){//skip header
	var src = ontologySource[i];
	src = src.split(",");
	let category = src[2];
	for(let j=0;j<jobCategories.length;j++){
		if(category.includes(jobCategories[j].getName())){			
			jobCategories[j].addSkill(src[0].replace((/  |\r\n|\n|\r/gm),""));
			if(currentMainSkill !== src[1]){
				currentMainSkill = src[1];
				jobCategories[j].addMainSkill(currentMainSkill);
			}	
		}
	}
}

//get ontology for ID
ontologySource = fs.readFileSync(linksDir + "SkillListID.csv");
ontologySource = ontologySource.toString();
ontologySource = ontologySource.split("\r");
for(let i=1;i<ontologySource.length;i++){//skip header
	var src = ontologySource[i];
	src = src.split(",");
	let category = src[2];
	for(let j=0;j<jobCategories.length;j++){
		if(category.includes(jobCategories[j].getName())){			
			jobCategories[j].addSkillID(src[0].replace((/  |\r\n|\n|\r/gm),""));
		}
	}
}

//concat all data in job categories, tokenize, stem, remove stopwords and duplicates
for(let i=0; i<jobCategories.length;i++){
	var skills = jobCategories[i].getSkills();
	skills = skills.concat(jobCategories[i].getMainSkills());
	skills = skills.join(" ");
	skills = tokenizerEn.tokenize(skills);
	for(let j = 0;j<skills.length;j++){
		skills[j] = stemmerEn(skills[j]); //stem all words in skills, return back to skills array
	}
	skills = stopwordEn.removeStopwords(skills); //remove stopwords
	skills = [ ...new Set(skills) ]; //remove duplicates
	jobCategories[i].setStemmedSkills(skills);

	skills = jobCategories[i].getSkillsID();
	skills = skills.join(" ");
	skills = tokenizerId.tokenize(skills);
	var stemmedSkills=[];
	for(let k = 0;k<skills.length;k++){
		let stemmedStr = stemmerId.stem(skills[k]); //stem all words in skills
		if(stemmerId.isStopword(stemmedStr)==false){
			stemmedSkills.push(stemmedStr); //get only non stop words
		}
	}

	stemmedSkills = [ ...new Set(stemmedSkills) ]; //remove duplicates
	console.log("stemmed skill ID for "+jobCategories[i].getName()+": "+stemmedSkills);
	jobCategories[i].setStemmedSkillsID(stemmedSkills);
}


for(let i=1;i<source.length;i++){//skip header
		var src = source[i];
		src = src.split(",");
		let platformName = src[7];
		src = src[2]+src[3]+src[4];
		src = src.replace(/\/|\|/gm," ").toLowerCase();
		src = src.replace(/[^0-9a-z\s]/gi, "");
		let clearSrc = [];
		let isIndonesian = false;
		if(platformName.includes("Sribulancer") || platformName.includes("Fastwork") || platformName.includes("Projects")){
			isIndonesian = true;
			src = tokenizerId.tokenize(src);
			for(let j = 0;j<src.length;j++){
				src[j] = stemmerId.stem(src[j]); //stem all words in src, return back to src array
				if(stemmerId.isStopword(src[j])==false){
					clearSrc.push(src[j]); //get only non stop words
				}
			}	
		}else{
			src = tokenizerEn.tokenize(src);
			for(let j = 0;j<src.length;j++){
				src[j] = stemmerEn(src[j]); //stem all words in src, return back to src array
			}
			clearSrc = stopwordEn.removeStopwords(src);
		}

		console.log("clear string = "+clearSrc);
		//TF-IDF
		let macthChecker =  new natural.TfIdf();
		for(let j=0;j<jobCategories.length;j++){
			var skillSet = jobCategories[j].getStemmedSkills();
			if(isIndonesian){
				skillSet = skillSet.concat(jobCategories[j].getStemmedSkillsID());
			}
			skillSet = [ ...new Set(skillSet) ]; //remove duplicates
			console.log("add document : ");
			console.log(skillSet);
			macthChecker.addDocument(skillSet);
		}
		
		console.log("check this : "+clearSrc);
		let actualCategory="none";
		let values = new Array(jobCategories.length);
		let isZeroMeasure = true;
		macthChecker.tfidfs(clearSrc,function(n,measure){
			console.log("measure ke : "+n+" = "+measure);
			if(measure > 0){
				isZeroMeasure = false;
			}
			values[n] = measure;
		});

		let max1 = 0;
		let max2 = 0;
		let max1Pos = 0;
		let max2Pos = 0;
		if(!isZeroMeasure){
			//get max value and the runner up
			//get #1
			for(let m=0;m<values.length;m++){
				if(max1<values[m]){
					max1 = values[m];
					max1Pos = m;
				}
			}
			//get #2
			for(let m=0;m<values.length;m++){
				if(m==max1Pos){
					continue;
				}
				if(max2<values[m]){
					max2 = values[m];
					max2Pos = m;
				}
			}
		}else{
			console.log("TF-IDF returns Zero Measure");
		}

		if((max1-max2 < 1) && clearSrc && clearSrc.length>0){
			//check string distance
			let strDistances = new Array(jobCategories.length);
			for(let j=0;j<jobCategories.length;j++){
				if(!isZeroMeasure){
					if(!(j == max1Pos || j == max2Pos)){
						console.log("TF-IDF differences is too small");
						strDistances[j] = 0;
						continue;
					}
				}
				var skillSet = jobCategories[j].getSkills();
				skillSet = skillSet.concat(jobCategories[j].getMainSkills());
				// skillSet = skillSet.join(" ");
				if(isIndonesian){
					skillSet = skillSet.concat(jobCategories[j].getSkillsID());
				}
				let nbOfSmallDistance = 0;
				for(var skill of skillSet){
					for(var src of clearSrc){
						let dist = natural.LevenshteinDistance(skill,src);
						if(dist<=1){
							nbOfSmallDistance++;
						}
					}
				}
				strDistances[j] = nbOfSmallDistance;
			}
			//get max number of string with small distance
			let maxNbOfSmallDist = 0;
			for(let k=0;k<strDistances.length;k++){
				if(strDistances[k]>maxNbOfSmallDist){
					maxNbOfSmallDist = strDistances[k];
					actualCategory = jobCategories[k].getName();
				}
			}
			if(maxNbOfSmallDist == 0 && !isZeroMeasure){
				let indexes = [0,0];
				indexes[0] = max1Pos;
				indexes[1] = max2Pos;
				actualCategory = jobCategories[indexes[i%2]].getName();
			}
			source[i] = source[i] + ","+actualCategory+",Small String Distance: "+maxNbOfSmallDist;
		}else{
			actualCategory = jobCategories[max1Pos].getName();
			source[i] = source[i] + ","+actualCategory+",TF-IDF: "+ max1+" : "+max2;
		}
		console.log("Actual Category : "+actualCategory);
		source[i] = source[i].replace((/  |\r\n|\n|\r/gm),"")
}
source[0] = source[0] + ",Job Category,Match Value";


//output setup
let fileExist = -1;
let index = 0;
let fileName = "";
while(fileExist != 0){
	if(index === 0){
		fileName = linksDir+"FinalResult.csv";
	}else{
		fileName = linksDir+"FinalResult("+ index +").csv";
	}
	if(fs.existsSync(fileName)){
		index++;
	}else{
		fileExist = 0;
	}
}
console.log("File Name = "+fileName);
const outStream = fs.createWriteStream(fileName);

for(let src of source){
	outStream.write(src +"\n");
}

outStream.end();
// function categorize(){

// }