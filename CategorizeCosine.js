const fs 		= require("fs");
const natural 	= require("natural");
const nalapa 	= require("nalapa");
const stemmerEn = require("wink-porter2-stemmer");
const stopwordEn 	= require("stopword");
const Array2D 		= require("array-2d");
const similarity 	= require( "compute-cosine-similarity" );

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
			jobCategories[j].addSkill(src[0].trim());
			if(currentMainSkill !== src[1].trim()){
				currentMainSkill = src[1].trim();
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
			jobCategories[j].addSkillID(src[0].trim());
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
		skills[j] = stemmerEn(skills[j]).trim(); //stem all words in skills, return back to skills array
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
			stemmedSkills.push(stemmedStr.trim()); //get only non stop words
		}
	}

	stemmedSkills = [ ...new Set(stemmedSkills) ]; //remove duplicates
	console.log("stemmed skill ID for "+jobCategories[i].getName()+": "+stemmedSkills);
	jobCategories[i].setStemmedSkillsID(stemmedSkills);
}

//make term library in english and indonesian
var libraryEN = [];
var libraryID = [];

for(let category of jobCategories){
	var terms = category.getStemmedSkills();
	for(let term of terms){
		libraryEN.push(term);
		libraryID.push(term);
	}
	terms = category.getStemmedSkillsID();
	for(let term of terms){
		libraryID.push(term);
	}
}

libraryEN = [...new Set(libraryEN)];
libraryID = [...new Set(libraryID)];

//BEGIN PROCESS FOR EACH ROW
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
				clearSrc.push(src[j].trim()); //get only non stop words
			}
		}	
	}else{
		src = tokenizerEn.tokenize(src);
		for(let j = 0;j<src.length;j++){
			src[j] = stemmerEn(src[j]).trim(); //stem all words in src, return back to src array
		}
		clearSrc = stopwordEn.removeStopwords(src);
	}
	
	//library pointer
	let library;
	if(isIndonesian){
		library = libraryID;
	}else{
		library = libraryEN;
	}

	//Filter similarity
	let filteredSrc = new Array();
	for(let itemCheck of clearSrc){
		let matchIndicator = false;
		for(let lib of library){
			if(lib === itemCheck){
				matchIndicator = true;
				filteredSrc.push(lib);
				break;
			}
		}
		if(!matchIndicator){
			//calculate string distance
			let maxMatchValue = 0;
			let maxMatchIndex = 0;
			for(let k=0;k<library.length;k++){
				let matchValue = natural.JaroWinklerDistance(library[k],itemCheck);
				if(matchValue>maxMatchValue){
					maxMatchValue = matchValue;
					maxMatchIndex = k;
				}
			}
			//ambil match yang paling besar
			if(maxMatchValue>=0.8){
				filteredSrc.push(library[maxMatchIndex]);
			}
		}
	}

	let actualCategory1="none";
	let actualCategory2="none";

	console.log("filtered string = ");
	console.log(filteredSrc);

	if(filteredSrc.length == 0){
		//nothing to compare
		//TODO:
		console.log("null filtered source")
		source[i] = source[i] + ","+ actualCategory1 +","+ actualCategory2 +","+0+" > "+0;
		source[i] = source[i].trim();
		continue;
	}

	//TF-IDF --> processing filteredSrc
	let tfIdfCalc = new natural.TfIdf();
	tfIdfCalc.addDocument(filteredSrc);
	for(let category of jobCategories){
		tfIdfCalc.addDocument(category.getStemmedSkills());
	}
	//calculate each term in filteredSrc
	let tfIdfSizeRow = library.length;
	let tfIdfSizeCol = jobCategories.length+1;
	var tfIdfMatrix = new Array2D(tfIdfSizeRow,tfIdfSizeCol,0);
	for(let row=0 ; row<tfIdfSizeRow; row++){
		tfIdfCalc.tfidfs(library[row],function(col,measure){
			tfIdfMatrix.set(row,col,measure);
		});
	}
	
	let maxSimilarity1 = 0;
	let maxSimilarity2 = 0;
	let maxSimilarity1Id = 0;
	let inputVector = [];
	for(let row = 0; row<tfIdfSizeRow;row++){
		inputVector.push(tfIdfMatrix.get(row,0));
	}
	let similarities = [];
	for(let col=1;col < tfIdfSizeCol;col++){
		let compareVector=[];
		for(let row = 0; row<tfIdfSizeRow;row++){
			compareVector.push(tfIdfMatrix.get(row,col));
		}
		let similarValue = similarity(inputVector,compareVector);
		similarities.push(similarValue);
		if(maxSimilarity1 < similarValue){
			maxSimilarity1 = similarValue;
			maxSimilarity1Id = col-1;
			actualCategory1 = jobCategories[maxSimilarity1Id].getName();
		}
	}
	console.log("Similarities : "+similarities);
	for(let id=0;id<similarities.length;id++){
		if(id==maxSimilarity1Id){
			continue;
		}
		if(maxSimilarity2 < similarities[id]){
			maxSimilarity2 = similarities[id];
			actualCategory2 = jobCategories[id].getName();
		}
	}

	console.log("Actual Category : "+actualCategory1 +" > "+actualCategory2);
	source[i] = source[i] + ","+ actualCategory1 +","+ actualCategory2 +","+maxSimilarity1 +" > "+maxSimilarity2;
	source[i] = source[i].trim();
}
source[0] = source[0] + ",Job Category#1,Job Category#2,Similarity";


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