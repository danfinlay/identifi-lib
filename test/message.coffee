###global describe, it, after, before ###

'use strict'
crypto = require('crypto')
Message = require('../message.js')
chai = require('chai')
chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use chaiAsPromised
describe 'Message', ->
  msg = undefined
  describe 'createRating method', ->
    before ->
      msg = Message.createRating
        author: [['email', 'alice@example.com']]
        recipient: [['email', 'bob@example.com']]
        rating: 5
        comment: 'Good guy'
    it 'should create a message', ->
      msg.should.have.deep.property 'signedData.timestamp'
  describe 'Validate method', ->
    it 'should not accept a message without signedData', ->
      data = signedData: {}

      f = ->
        Message.validate JSON.stringify(data)

      f.should.throw Error
  describe 'Message signature', ->
    msg = undefined
    privKey = undefined
    pubKey = undefined
    before ->
      msg = Message.createRating
        author: [['email', 'alice@example.com']]
        recipient: [['email', 'bob@example.com']]
        rating: 5
        comment: 'Good guy'
      privKey = '-----BEGIN EC PRIVATE KEY-----\n' + 'MHQCAQEEINY+49rac3jkC+S46XN0f411svOveILjev4R3aBehwUKoAcGBSuBBAAK\n' + 'oUQDQgAEKn3lQ3+/aN6xNd9DSFrYbaPSGOzLMbb1kQZ9lCMtwc6Og4hfCMLhaSbE\n' + '3sXek8e2fvKrTp8FY1MyCL4qMeVviA==\n' + '-----END EC PRIVATE KEY-----'
      pubKey = '-----BEGIN PUBLIC KEY-----\n' + 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEKn3lQ3+/aN6xNd9DSFrYbaPSGOzLMbb1\n' + 'kQZ9lCMtwc6Og4hfCMLhaSbE3sXek8e2fvKrTp8FY1MyCL4qMeVviA==\n' + '-----END PUBLIC KEY-----'
    it 'should be created with sign()', ->
      Message.sign msg, privKey, 'someKeyID'
      msg.should.have.property 'jws'
      msg.should.have.property 'jwsHeader'
      msg.should.have.property 'hash'
    it 'should be accepted by verify()', ->
      Message.verify msg, pubKey
  describe 'Deserialize method', ->
    it 'should not accept invalid data', ->
      jws = 'asdf'

      f = ->
        Message.deserialize jws

      f.should.throw Error
  describe 'Decode method', ->
    it 'should successfully decode signedData from jws', ->
      newMessage = { jws: msg.jws }
      Message.decode(newMessage)
      newMessage.signedData.should.not.be.empty
