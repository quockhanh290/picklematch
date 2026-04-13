import { expect, test } from '@playwright/test'

import { devLogin } from './helpers/auth'

const SESSION_IDS = {
  openConfirmed: '55555555-5555-5555-5555-555555555551',
  resultsPending: '55555555-5555-5555-5555-555555555558',
}

test.describe('PickleMatch web smoke', () => {
  test('host profile and session detail smoke path', async ({ page }) => {
    await devLogin(page, { email: 'host.confirmed@picklematch.vn' })

    await page.goto('/profile')
    await expect(page.getByText('Mức khởi điểm hiện tại. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận.')).toBeVisible()
    await expect(page.getByText('Đây là ảnh chụp hiện tại để ghép kèo dễ chịu hơn, không phải nhãn cố định.')).toBeVisible()

    await page.goto(`/session/${SESSION_IDS.openConfirmed}`)
    await expect(page.getByText(/^Người chơi/)).toBeVisible()
  })

  test('session detail loads and player can open confirm-result flow', async ({ page }) => {
    await devLogin(page, { email: 'player.matched@picklematch.vn' })

    await page.goto(`/session/${SESSION_IDS.resultsPending}`)
    await expect(page.getByText(/^Người chơi/)).toBeVisible()

    await page.goto(`/session/${SESSION_IDS.resultsPending}/confirm-result`)
    await expect(page.getByText('Xác nhận kết quả')).toBeVisible()
    await expect(page.getByText('Hạn xác nhận')).toBeVisible()
  })
})
