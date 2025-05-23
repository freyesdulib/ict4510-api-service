const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const should = chai.should();

chai.use(chaiHttp);

describe('Ping Routes', () => {

  after((done) => {
    // Ensure server is closed after tests if it was started
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET /api/ping', () => {
    it('it should return API information', (done) => {
      chai.request(server)
        .get('/api/ping')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('info');
          res.body.info.should.have.property('version').eql('2.0');
          res.body.info.should.have.property('description').eql('ICT4510 Final Project Example.');
          done();
        });
    });
  });
});
