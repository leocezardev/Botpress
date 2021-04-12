import axios, { AxiosRequestConfig } from 'axios'
import path from 'path'

import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch, fillField, uploadFile } from '../expectPuppeteer'
import { closeToaster, CONFIRM_DIALOG, expectAdminApiCallSuccess, expectCallSuccess } from '../utils'

describe('Admin - UI', () => {
  it('Load server license page', async () => {
    await clickOn('#btn-menu-license')
    await expectMatch(new RegExp('Enable Botpress Professional|Cluster fingerprint|Unofficial Botpress Build'))
  })

  it('Load version control page', async () => {
    await clickOn('#btn-menu-version')
    await expectMatch('pull --url http')
    await expectMatch('Push local to this server')
  })

  it('Change user profile', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-profile')
    await fillField('#input-firstname', 'Bob')
    await fillField('#input-lastname', 'Lalancette')
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/alien.png'))
    const { url } = await expectCallSuccess(`${bpConfig.host}/api/v1/media`, 'POST')
    await Promise.all([expectCallSuccess(`${bpConfig.host}/api/v2/admin/user/profile`, 'POST'), clickOn('#btn-submit')])
    await closeToaster()
    const src = await page.$eval('img.dropdown-picture', img => img.getAttribute('src'))
    expect(src.includes(url)).toBe(true)
    await clickOn('#btn-menu')
    await expectMatch('Signed in as Bob Lalancette')
    await clickOn('#btn-menu')
  })

  it('Load debugging page', async () => {
    await clickOn('#btn-menu-debug')
    await expectMatch('Configure Debug')

    await Promise.all([expectAdminApiCallSuccess('health/debug', 'GET'), clickOn('#btn-refresh')])

    await Promise.all([expectAdminApiCallSuccess('health/debug', 'POST'), clickOn('#btn-save')])
  })

  it('Load languages page', async () => {
    await clickOn('#btn-menu-language')
    await expectMatch('Using lang server at')
    await expectMatch('Installed Languages')
    await expectAdminApiCallSuccess('management/languages', 'GET')
  })

  it('Update password', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-changepass')
    await fillField('#input-password', bpConfig.password)
    await fillField('#input-newPassword', bpConfig.password)
    await fillField('#input-confirmPassword', bpConfig.password)
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v2/admin/auth/login/basic/default`, 'POST'),
      clickOn('#btn-submit')
    ])
  })

  it('Generate API key', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-developer')
    await clickOn('#btn-submit')
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    const key = await expectCallSuccess(`${bpConfig.host}/api/v2/admin/auth/apiKey`, 'POST')

    try {
      const { status } = await axios.post(
        `${bpConfig.host}/api/v1/bots/${bpConfig.botId}/converse/123/secured`,
        {
          type: 'text',
          text: 'test'
        },
        {
          headers: {
            'x-bp-api-key': key.apiKey
          }
        }
      )

      expect(status).toBe(200)
    } catch (err) {
      fail(err)
    }

    await closeToaster()
  })
})
