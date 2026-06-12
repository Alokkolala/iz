import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTranslatePrompt, normaliseLang, isSameLanguage } from './translate.js'

test('normaliseLang maps tourist UI langs', () => {
  assert.equal(normaliseLang('en'), 'en')
  assert.equal(normaliseLang('ru'), 'ru')
  assert.equal(normaliseLang('kk'), 'kk')
  assert.equal(normaliseLang('EN'), 'en')
  assert.equal(normaliseLang('kazakh'), 'kk')
  assert.equal(normaliseLang('russian'), 'ru')
  assert.equal(normaliseLang('english'), 'en')
  assert.equal(normaliseLang('xx'), null)
  assert.equal(normaliseLang(null), null)
})

test('isSameLanguage compares post-normalisation', () => {
  assert.equal(isSameLanguage('ru', 'russian'), true)
  assert.equal(isSameLanguage('en', 'EN'), true)
  assert.equal(isSameLanguage('ru', 'kk'), false)
  assert.equal(isSameLanguage('ru', null), false)
})

test('buildTranslatePrompt embeds both language names and the source text', () => {
  const p = buildTranslatePrompt({ text: 'How much to Bozzhyra?', from: 'en', to: 'ru' })
  assert.match(p, /English/)
  assert.match(p, /Russian/)
  assert.match(p, /How much to Bozzhyra\?/)
  // Must instruct: one line, no quotes, no explanation
  assert.match(p, /one line/i)
})
