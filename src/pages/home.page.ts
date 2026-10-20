import {Locator, Page, expect } from '@playwright/test';

export class HomePage {

  readonly enrollBtn: Locator;
  readonly signIn: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly page: Page;
  readonly signInWithEmail: Locator;

  constructor(page: Page) {
  this.page = page;
  this.enrollBtn =  page.locator('text=Enroll Now').first();
  this.signIn = page.getByRole('link', { name: 'Sign In' });
  this.email = page.locator("//input[@name='email']");
  this.password = page.locator('#password');
  this.signInWithEmail = page.locator("//span[text()='Sign in with email']");
  }

   // NAVIGATION
  async open(){
    console.log(`Navigating to: ${process.env.BASE_URL}`);
    await this.page.goto(`${process.env.BASE_URL}`);
  }

 async clickSignIn(){ 
  await this.signIn.click(); 
}

 async invalidLogin(){
   await this.signIn.click(); 
   await this.signInWithEmail.click(); 
   await this.email.fill('invalid@test.com');
   await this.page.getByRole('button', { name: 'Next' }).click(); }

 async emptyLogin(){ 
  await this.signIn.click(); 
   await this.signInWithEmail.click(); 
   await this.page.getByRole('button', { name: 'Next' }).click();
    await expect(this.page.getByText("Enter your email address to continue")).toBeVisible();}

 async verifyCourseCount(){
   const courses = await this.page.locator('a[href*="index.html"]').count();
   expect(courses).toBeGreaterThan(0);
 }
 
 async verifyImages(){
  const broken = await this.page.locator('img').evaluateAll(imgs => imgs.filter((i:any)=>!i.complete).length);
  expect(broken).toBe(0);
 }
 async verifyLinks(){
  const count = await this.page.locator('a').count();
  expect(count).toBeGreaterThan(0);
 }
    }
   