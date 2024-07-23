// Importing packages
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { uniqueNamesGenerator, names } = require('unique-names-generator');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

// Importing mail provider and antibotmail's api key, you can found it from https://antibotmail.com/dashboard/account/personal
const { antibotmail_api_key, mailProvider } = require("./config");

// Setting browser's configuration.
const BROWSER_CONFIG = {
  product: 'chrome',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--window-size=1600,900',
    '--disable-features=IsolateOrigins,site-per-process,SitePerProcess',
    '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end'
  ],
  defaultViewport: null,
  ignoreHTTPSErrors: true,
  headless: false,
};

// Using puppeteer's stealth plugin
puppeteer.use(StealthPlugin());

// Making loggers.
const o = fs.createWriteStream('./stdout.log', { flags: 'a' });
const errorOutput = fs.createWriteStream('./stderr.log', { flags: 'a' });
const accounts = fs.createWriteStream('accounts.txt', { flags: 'a' });
const logger = new console.Console(o, errorOutput);

const t0 = process.hrtime();
function write_log(goodnews, text) {
  const t1 = process.hrtime(t0);
  const time = (t1[0] * 1000000000 + t1[1]) / 1000000000;
  const color = goodnews ? "\x1b[32m" : "\x1b[31m";

  console.log(`${color} [LOG - ${time}s] \x1b[37m ${text}`);
  logger.log(`[LOG - ${time}s] ${text}`);
}

// Code begin

async function fill_input(page, selector, info) {
  await page.waitForSelector(selector, { timeout: 60000 });
  await page.focus(selector);
  await page.keyboard.type(info);
}

async function fill_instagram_signup(page, username, password, email) {
  try {
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle0', timeout: 120000 });
    write_log(true, "Navigated to Instagram homepage");

    await page.waitForSelector('a[href="/accounts/emailsignup/"]');
    await page.click('a[href="/accounts/emailsignup/"]');
    write_log(true, "Clicked on signup link");

    await page.waitForSelector('input[name="emailOrPhone"]');
    await fill_input(page, 'input[name="emailOrPhone"]', email);
    write_log(true, "Filled email");

    await fill_input(page, 'input[name="fullName"]', username);
    write_log(true, "Filled full name");

    await fill_input(page, 'input[name="username"]', username);
    write_log(true, "Filled username");

    await fill_input(page, 'input[name="password"]', password);
    write_log(true, "Filled password");

    await page.click('button[type="submit"]');
    write_log(true, "Clicked signup button");

    await page.waitForSelector('select[title="Month:"]');
    await page.select('select[title="Month:"]', '5');

    await page.waitForSelector('select[title="Day:"]');
    await page.select('select[title="Day:"]', '15');

    await page.waitForSelector('select[title="Year:"]');
    await page.select('select[title="Year:"]', '1995');

    write_log(true, "Filled birthdate");

    const nextButtonSelector = 'button._acan._acap._acaq._acas._aj1-._ap30';
    await page.waitForSelector(nextButtonSelector, { visible: true, timeout: 60000 });
    await page.click(nextButtonSelector);
    write_log(true, "Clicked continue button");

    return true;
  } catch (error) {
    write_log(false, `Error in fill_instagram_signup: ${error.message}`);
    throw error;
  }
}
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Buying emails from https://antibotmail.com/

async function generate_email() {
  try {
    write_log(true, 'Generating email');
    const payload = {
      "X-ABM-ApiKey": antibotmail_api_key,
      "mailcode": `${mailProvider}_TEMP`,
      "quantity": 1,
      "softId": "6929294f-658f-4c6c-ae99-5363f9d8e119-CruelDev69"
    };
    const headers = {
      "content-type": "application/json"
    };

    while (true) {
      const response = await axios.post('https://api.antibotmail.com/api/mail/buy', payload, { headers });
      if (response.data && response.data.Data && response.data.Data.Emails && response.data.Data.Emails.length > 0) {
        // It returns email's password too, you can use it to generate email verified accounts.
        return response.data.Data.Emails[0].Email;
      } else {
        write_log(false, 'No email generated, retrying...');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    write_log(false, `Error generating email: ${error.message}`);
    throw error;
  }
}

async function create_instagram_account(browser, email) {
  try {
    const page = await browser.newPage();

    // Generatinng username and password for your account.
    const randomNumber = Math.floor(Math.random() * 100);
    const username = "x." + uniqueNamesGenerator({ dictionaries: [names] }) + `._${randomNumber + randomNumber}`;
    const password = crypto.randomBytes(10).toString('hex');

    const success = await fill_instagram_signup(page, username, password, email);
    if (success) {
      write_log(true, `Account created successfully: ${email} | ${password}`);
      accounts.write(`Email: ${email} | Password: ${password}\n`);
    } else {
      write_log(false, "Failed to create Instagram account, retrying...");
    }

    await delay(60000);

    await page.close();
  } catch (error) {
    write_log(false, `Error creating Instagram account: ${error.message}`);
    throw error;
  }
}

(async () => {
  const blue = '\x1b[38;5;93m';
  const reset = '\x1b[0m';
  const bright = '\x1b[1m';
  let art = 
`${bright}

██╗███╗   ██╗███████╗████████╗ █████╗  ██████╗ ██████╗  █████╗ ███╗   ███╗     ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ████████╗ ██████╗ ██████╗ 
██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝ ██╔══██╗██╔══██╗████╗ ████║    ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
██║██╔██╗ ██║███████╗   ██║   ███████║██║  ███╗██████╔╝███████║██╔████╔██║    ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║   ██║   ██║   ██║██████╔╝
██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║    ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║   ██║   ██║   ██║██╔══██╗
██║██║ ╚████║███████║   ██║   ██║  ██║╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║    ╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║   ██║   ╚██████╔╝██║  ██║
╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
    
                ${reset}                                                                                                                                             
`;
  art = art.replace(/█/g, `${blue}█${reset}`);
  console.log(art);

  try {
    const email = await generate_email();
    if (email) {
      const browser = await puppeteer.launch(BROWSER_CONFIG);
      await create_instagram_account(browser, email);
      await browser.close();
    } else {
      write_log(false, "Failed to generate email.");
    }
  } catch (error) {
    write_log(false, `Main script error: ${error.message}`);
  }
})();