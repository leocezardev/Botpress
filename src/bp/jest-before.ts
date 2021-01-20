import { EventEmitter } from 'events'

import { Distro } from './common/getos'

const { Debug: _Debug } = require('./debug')

global.DEBUG = _Debug

if (!process.core_env) {
  process.core_env = process.env as BotpressEnvironmentVariables
}

if (!process.BOTPRESS_EVENTS) {
  process.BOTPRESS_EVENTS = new EventEmitter()
}

const os = require('os').platform()

const distribution =
  os !== 'linux'
    ? {
        os,
        codename: '',
        dist: '',
        release: ''
      }
    : {
        os,
        codename: '',
        dist: 'Alpine Linux', // github checks runs on alpine...
        release: '3.11.6'
      }
process.distro = new Distro(distribution)
