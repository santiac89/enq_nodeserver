var should = require('should');
var assert = require('assert');
var request = require('supertest');
var session = require('supertest-session');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('../config');
var app = require('../app');
var paydesk = {};

describe('Paydesk Router', function() {

  before(function(done) {
    mongoose.connect('mongodb://'+config.mongo.address+':'+config.mongo.port+'/'+config.mongo.test_db);
    session = session(app);
    session.post('/caller/login').send({ username: 'admin', password: 'admin' }).end(done);
  });

  describe("POST /", function() {
    it('should create and return a new paydesk', function(done) {

      session.post('/paydesks')
        .send({ number: 1, group: '56c3a7ddddf71cf2c1013a79' })
        .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);

          paydesk = res.body;

          done();
        });
    });
  });

  describe("GET /", function() {
    it('should return all paydesks', function(done) {

      session.get('/paydesks')
        .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);
          res.body.length.should.be.equal(1);
          done();
        });
    });
  });

  describe("GET /:id", function() {
    it('should return single paydesk by the id', function(done) {

      session.get(`/paydesks/${paydesk._id}`)
        .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);
          res.body._id.should.be.equal(paydesk._id);
          res.body.number.should.be.equal(paydesk.number);
          res.body.group._id.should.be.equal(paydesk.group);

          done();
        });
    });
  });

  describe("DELETE /:id", function() {
    it('should delete and return a single paydesk by the id', function(done) {

      session.delete(`/paydesks/${paydesk._id}`)
        .end(function(err, res) {
          if (err) {
            throw err;
          }

          res.status.should.be.equal(200);
          res.body.number.should.be.equal(paydesk.number)

          done();
        });
    });
  });

});
