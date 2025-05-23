const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const should = chai.should();
const knex = require('../config/db')();
const bcrypt = require('../libs/bcrypt'); // For password hashing if needed in setup
const hat = require('hat'); // For generating api_key

chai.use(chaiHttp);

describe('Users Routes', () => {
  let adminApiKey = ''; // To store the API key of the admin user

  beforeEach(async () => {
    // Clear the users table
    await knex('users').del();

    // Create a primary admin user for authenticating API requests
    const adminUserData = {
      username: 'admin_user_test@example.com',
      password: 'securePassword123',
      first_name: 'Admin',
      last_name: 'Tester',
      role: 'admin' // Assuming a 'role' column exists and 'admin' has privileges
    };
    adminApiKey = hat(); // Generate API key for this admin user
    const hashedPassword = bcrypt.encrypt(adminUserData.password);

    await knex('users').insert({
      username: adminUserData.username,
      password: hashedPassword,
      first_name: adminUserData.first_name,
      last_name: adminUserData.last_name,
      api_key: adminApiKey,
      role: adminUserData.role
    });
  });

  after((done) => {
    if (server && server.listening) {
      server.close(() => {
        knex.destroy(done);
      });
    } else {
      knex.destroy(done);
    }
  });

  // Test cases for CRUD operations on users will go here

  describe('GET /api/users (Read Own Profile)', () => {
    it('it should get the profile of the user associated with the api_key', (done) => {
      chai.request(server)
        .get('/api/users')
        .query({ api_key: adminApiKey }) // Use the admin's api_key
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('user');
          res.body.user.should.have.property('username').eql('admin_user_test@example.com');
          res.body.user.should.have.property('first_name').eql('Admin');
          res.body.user.should.have.property('last_name').eql('Tester');
          res.body.user.should.not.have.property('password'); // Password should not be returned
          res.body.user.should.not.have.property('api_key'); // API key should ideally not be returned here either
          done();
        });
    });

    it('it should return 401 or error if api_key is invalid or missing for GET', (done) => {
        chai.request(server)
          .get('/api/users')
          // No api_key provided
          .end((err, res) => {
            // The TOKEN.verify middleware likely returns 401 or 403.
            // Depending on its exact implementation, the status might differ.
            // For now, let's expect a non-200 status.
            // A more specific check would require knowing TOKEN.verify's response.
            res.should.have.status(401); // Or 403, based on TOKEN.verify
            done();
          });
      });
  });

  describe('PUT /api/users (Update Own Profile)', () => {
    it('it should update the profile of the user associated with the api_key', (done) => {
      // First, get the current user ID (needed for the update body)
      chai.request(server)
        .get('/api/users')
        .query({ api_key: adminApiKey })
        .end((err, res) => {
          res.should.have.status(200);
          const userId = res.body.user.id;

          const updatedUserData = {
            id: userId, // ID of the user to update
            first_name: 'UpdatedAdmin',
            last_name: 'UpdatedTester',
            // username and password can also be part of update if desired and handled by model/validation
            // For this test, we'll stick to first_name and last_name
            // We also need to provide all fields expected by FIELDS.validate_user
            username: 'admin_user_test@example.com', // Keep username same or update
            password: 'newSecurePassword123' // Send a new password or the old one if not changing
          };

          chai.request(server)
            .put('/api/users')
            .query({ api_key: adminApiKey }) // Authenticate with the user's api_key
            .send(updatedUserData)
            .end((err, res) => {
              res.should.have.status(204); // No content on successful update

              // Verify the update by fetching the profile again
              chai.request(server)
                .get('/api/users')
                .query({ api_key: adminApiKey })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.user.should.have.property('first_name').eql(updatedUserData.first_name);
                  res.body.user.should.have.property('last_name').eql(updatedUserData.last_name);
                  done();
                });
            });
        });
    });
    
    it('it should not update if user ID in body does not match api_key owner', (done) => {
        const otherUserId = 99999; // An ID that does not belong to adminApiKey's user
        const updatedUserData = {
          id: otherUserId, 
          first_name: 'AttemptedUpdate',
          last_name: 'ShouldFail',
          username: 'admin_user_test@example.com', 
          password: 'password123' 
        };
  
        chai.request(server)
          .put('/api/users')
          .query({ api_key: adminApiKey })
          .send(updatedUserData)
          .end((err, res) => {
            // Expecting an error or no change. The USERS.update model logic updates
            // DB('users').where({ api_key: api_key, id: id }).update(User)
            // If the ID doesn't match the user owning the api_key, Knex update won't find a row.
            // It will likely still return 204 as Knex update returns number of affected rows,
            // and 0 affected rows is not an error for PUT.
            // A more robust API might return 403 or 404 here.
            // For now, we'll check that the data wasn't actually changed for the admin user.
            res.should.have.status(204); // Still 204 as 0 rows updated is not an error

            chai.request(server)
            .get('/api/users')
            .query({ api_key: adminApiKey })
            .end((err, resGet) => {
              resGet.should.have.status(200);
              resGet.body.user.should.have.property('first_name').eql('Admin'); // Original name
              done();
            });
          });
      });
  });
});
