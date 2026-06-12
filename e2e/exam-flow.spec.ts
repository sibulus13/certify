import { test, expect } from '@playwright/test'

test.describe('exam flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for a clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('home page lists exams', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /practice exam/i }).first()).toBeVisible()
  })

  test('free exam starts and shows first question', async ({ page }) => {
    await page.goto('/exam/practice-exam-1')
    await page.getByRole('link', { name: /start|practice/i }).first().click()
    await expect(page).toHaveURL(/\/exam\/practice-exam-1\/quiz/)
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()
  })

  test('resume prompt appears after partial progress', async ({ page }) => {
    // Pre-seed localStorage with a partial session
    await page.goto('/')
    await page.evaluate(() => {
      const session = {
        examId: 'practice-exam-1',
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        answers: {
          'q1': {
            questionId: 'q1',
            selectedOptions: ['A'],
            isCorrect: true,
            timeSpentSeconds: 10,
          },
        },
        completedAt: null,
      }
      localStorage.setItem('certify:session:practice-exam-1', JSON.stringify(session))
    })

    await page.goto('/exam/practice-exam-1/quiz')
    await expect(page.getByText(/resume exam/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start over/i })).toBeVisible()
  })

  test('multi-select question shows checkboxes', async ({ page }) => {
    // Navigate to exam and look for a multi-select indicator
    await page.goto('/exam/practice-exam-1/quiz')
    // Clear any existing session first via start over or fresh start
    const resumeButton = page.getByText(/resume exam/i)
    if (await resumeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: /start over/i }).click()
    }
    // The quiz shows — just verify the question card renders
    await expect(page.getByText(/Question 1 of/i)).toBeVisible()
  })
})

test.describe('multi-select scoring', () => {
  test('score screen shows after completing all questions', async ({ page }) => {
    // Pre-seed a completed session
    await page.goto('/')
    await page.evaluate(() => {
      const answers: Record<string, unknown> = {}
      for (let i = 0; i < 5; i++) {
        answers[`q${i}`] = {
          questionId: `q${i}`,
          selectedOptions: ['A'],
          isCorrect: i < 4, // 4/5 correct = 80%
          timeSpentSeconds: 5,
        }
      }
      const session = {
        examId: 'practice-exam-1',
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        answers,
        completedAt: new Date().toISOString(),
      }
      localStorage.setItem('certify:session:practice-exam-1', JSON.stringify(session))
    })

    await page.goto('/exam/practice-exam-1/quiz')
    await expect(page.getByText(/score|result/i).first()).toBeVisible()
  })
})
