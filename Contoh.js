// var xray = require('x-ray')()
// const makeDriver = require('request-x-ray')



var url = 'https://www.upwork.com/o/profiles/browse/?loc=indonesia'
var headers = {
	'user-agent': 'siap'
}

async function getLinks(url) {
	var nightmare = require('nightmare')({ show: true })
	var result = await nightmare
					.goto(url, headers)
					// .wait('.air-card-hover.air-card-hover_tile')
					.evaluate(() => {
						nodeList = document.querySelectorAll('a.freelancer-tile-name')
						links = []
						nodeList.forEach(value => { links.push(value.href)})

						return links 
					})
					.end()
				
	return result
}

async function process(url) {
	var links = await getLinks(url)
	// console.log(nightmare)
	links.map(async link => {
		var nightmare = require('nightmare')({ show: true })
		console.log(link)
		await nightmare.goto(link, headers).evaluate(() => {
			text = document.querySelector('.m-xs-bottom span span').textContent
			return text
		}).end().then(console.log)
	})
	
}

// iterate
process(url)


