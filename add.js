import puppeteer from 'puppeteer';
import fs from 'fs';

const events = JSON.parse(fs.readFileSync('events.json').toString());

console.log(events);

(async () => {
	const browser = await puppeteer.launch({ headless: false, defaultViewport: false }); // default is true
	const page = await browser.newPage();
	let i = 0;
	for (const event of events) {
		await page.goto(`https://www.mtgtop8.com/${event.url}`, { waitUntil: 'load' });
		if (i === 0) {
			// accept cookies
			await page.waitForSelector('#cookie_window');
			const cookie_ok = await page.$('#cookie_window button');
			await cookie_ok.click();
			i++;
		} else {
			await page.waitForSelector(
				"body div[class='page'] div[valign='top'] div div div div div[class='S14'] div:nth-child(2)",
				{ visible: true }
			);
		}

		const number_of_players = await page.$(
			"body div[class='page'] div[valign='top'] div div div div div[class='S14'] div:nth-child(2)"
		);
		const name = await page.evaluate((tr) => tr.textContent, number_of_players);
		const num = name.replace(/player.*/, '').trim();
		event.players = num;
		console.log(event);
	}
	fs.appendFile('eventsAttendance.json', JSON.stringify(events), (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
	});
	await browser.close();
})();
