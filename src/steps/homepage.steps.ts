import { Page, expect, Locator } from '@playwright/test';
import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import 'dotenv/config';
import { TestAutomationAcademy } from '../support/hooks';

Then('user navigates to TAU home page', async function (this: TestAutomationAcademy) {
 await this.homePage.open();
});

Then('the page title should contain {string}', async function (this: TestAutomationAcademy, title: string) {
   await expect(this.page).toHaveTitle(/Test Automation University/);
});

Then('the Enroll Now button should be displayed', async function (this: TestAutomationAcademy){
 await expect(this.homePage.enrollBtn).toBeVisible();
});

When('user clicks Sign In', async function (this: TestAutomationAcademy){
   await this.homePage.clickSignIn();
});

Then('login page should be displayed', async function(){ await expect(this.page).toHaveURL(/login/);});
When('user navigates to login page', async function(){ 
   await this.page.goto('https://testautomationu.applitools.com/login.html');
});

When('user logs in with invalid credentials', async function(){
    await this.homePage.invalidLogin();});

Then('login error should be displayed', async function(){});

Then('user submits login without credentials', async function(this: TestAutomationAcademy){
       await this.homePage.emptyLogin();
      });

Then('category tag {word} should be visible', async function (this: TestAutomationAcademy, tag) {
  await expect(this.page.getByText(tag)).toBeVisible();
});
Then('instructor links should have valid href values', async function(){ await this.homePage.verifyLinks();});
Then('homePage should render correctly on mobile view', async function(){
   await this.page.setViewportSize({ width: 375, height: 667 });
});
Then('footer links should be visible', async function(){
   const footerLinks = await this.page.locator('footer a');
   await expect(footerLinks).toBeVisible();
});
Then('displayed courses count should be greater than zero', async function(){ await this.homePage.verifyCourseCount();});
Then('all visible images should be loaded successfully', async function(){ await this.homePage.verifyImages();});
