const natural 	= require("natural");

var dataTrain1 = ["account management","business analytics"];
var dataTrain2 = ["econometrics","economics"];

//TF-IDF
let macthChecker =  new natural.TfIdf();
macthChecker.addDocument(dataTrain1);
macthChecker.addDocument(dataTrain2);

let dataTest = ["account management", "economics"];
macthChecker.tfidfs(dataTest,function(n,measure){
	console.log("measure ke : "+n+" = "+measure);
});

dataTrain1 = dataTrain1.concat(dataTrain2);

for(let data of dataTrain1){
	let distance = natural.LevenshteinDistance("accounting",data);
	console.log(distance);
}


