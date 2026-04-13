import { type Page } from '@playwright/test'

type DevLoginOptions = {
  email: string
  password?: string
}

export async function devLogin(page: Page, options: DevLoginOptions) {
  const password = options.password ?? process.env.E2E_DUMMY_PASSWORD ?? 'Pickle123!'

  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(options.email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByText('Đăng nhập (dev)').locator('..').click()
  await page.waitForFunction(() =>
    Object.keys(window.localStorage).some((key) => key.includes('auth-token') && !!window.localStorage.getItem(key)),
  )
}
