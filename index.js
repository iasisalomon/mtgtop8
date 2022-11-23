import puppeteer from 'puppeteer';
import fs from 'fs';

const paper_events = [];

(async () => {
	const browser = await puppeteer.launch({ headless: false, defaultViewport: false }); // default is true
	const page = await browser.newPage();
	for (let i = 0; i < 20; i++) {
		await page.goto(`https://www.mtgtop8.com/format?f=PI&meta=235&cp=${i}`, { waitUntil: 'load' });

		if (i === 0) {
			// accept cookies
			await page.waitForSelector('#cookie_window');
			const cookie_ok = await page.$('#cookie_window button');
			await cookie_ok.click();
		}
		// get all rows that have an img with this src /graph/online/paper.png
		else {
			await page.waitForSelector(
				'body > div:nth-child(1) > div:nth-child(1) > table:nth-child(5) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > table:nth-child(4) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1)',
				{ visible: true }
			);
		}

		const table_rows = await page.$$(
			'body > div:nth-child(1) > div:nth-child(1) > table:nth-child(5) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > table:nth-child(4) > tbody > tr'
		);
		// loop thru all elements
		for (const t_row of table_rows) {
			try {
				// single element inside
				const row_img_src = await page.evaluate(
					(tr) => tr.querySelector('td:nth-child(1) > img').getAttribute('src'),
					t_row
				);
				if (row_img_src.includes('paper')) {
					const event_url = await page.evaluate(
						(tr) => tr.querySelector('td:nth-child(2) > a').getAttribute('href'),
						t_row
					);
					const name = await page.evaluate((tr) => tr.querySelector('td:nth-child(2) > a').textContent, t_row);
					const date = await page.evaluate((tr) => tr.querySelector('.S12').textContent, t_row);
					paper_events.push({ name: name, url: event_url, date: date });
				}
			} catch (error) {
				console.error(error);
			}
		}
		console.log(paper_events.length);
	}
	fs.appendFile('events.json', JSON.stringify(paper_events), (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
	});
	await browser.close();
})();
