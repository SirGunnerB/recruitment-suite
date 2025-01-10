import { test, expect } from '@playwright/test';

test.describe('Recruitment Software E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display the dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('candidate workflow', async ({ page }) => {
    // Navigate to candidates page
    await page.click('text=Candidates');
    
    // Add new candidate
    await page.click('button:has-text("Add Candidate")');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.selectOption('select[name="status"]', 'Applied');
    await page.click('button:has-text("Save")');

    // Verify candidate was added
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('john.doe@example.com')).toBeVisible();
  });

  test('job posting workflow', async ({ page }) => {
    // Navigate to jobs page
    await page.click('text=Jobs');
    
    // Add new job
    await page.click('button:has-text("Add Job")');
    await page.fill('input[name="title"]', 'Software Engineer');
    await page.fill('input[name="department"]', 'Engineering');
    await page.fill('input[name="location"]', 'Remote');
    await page.fill('input[name="salary.min"]', '100000');
    await page.fill('input[name="salary.max"]', '150000');
    await page.click('button:has-text("Post Job")');

    // Verify job was added
    await expect(page.getByText('Software Engineer')).toBeVisible();
    await expect(page.getByText('Engineering')).toBeVisible();
  });

  test('reports generation', async ({ page }) => {
    // Navigate to reports page
    await page.click('text=Reports');
    
    // Generate predictive report
    await page.click('text=Predictive Reports');
    await page.selectOption('select[name="timeframe"]', '6months');
    await page.click('button:has-text("Generate Report")');

    // Verify report components are visible
    await expect(page.getByText('Hiring Trends')).toBeVisible();
    await expect(page.getByText('Demand Analysis')).toBeVisible();
  });

  test('accessibility checks', async ({ page }) => {
    // Check main landmarks
    await expect(page.locator('main')).toHaveAttribute('role', 'main');
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation');

    // Check form labels
    const forms = await page.locator('form').all();
    for (const form of forms) {
      const inputs = await form.locator('input').all();
      for (const input of inputs) {
        const labelFor = await input.getAttribute('id');
        if (labelFor) {
          await expect(page.locator(`label[for="${labelFor}"]`)).toBeVisible();
        }
      }
    }
  });
});
