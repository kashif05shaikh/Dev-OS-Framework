const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('CONSOLE [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.error('PAGE_ERROR:', err.message));
  page.on('requestfailed', req => console.error('REQ_FAIL:', req.url(), req.failure()?.errorText));
  page.on('response', async res => {
    if (res.url().includes('supabase.co')) {
      const text = await res.text().catch(() => '');
      console.log('SUPABASE_RES:', res.status(), res.url().slice(0, 100), text.slice(0, 150));
    }
  });

  console.log('Navigating to auth page...');
  await page.goto('https://www.dev-os.app/auth', { waitUntil: 'networkidle' });

  // Use test user
  const email = 'diag_' + Date.now() + '@devostest.com';
  const password = 'Password123!@#';

  const tab = page.locator('button:has-text("Create account"), [role="tab"]:has-text("Create account")').first();
  if (await tab.count()) {
    await tab.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  console.log('Clicking submit...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('URL after submit:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('BODY:', bodyText);

  await browser.close();
})();
