const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const should = chai.should();
const knex = require('../config/db')();

chai.use(chaiHttp);

describe('Menus Routes', () => {
  let adminApiKey = ''; // To store admin api_key

  beforeEach(async () => {
    // Clear relevant tables, e.g., users and menus
    await knex('menus').del();
    await knex('users').del();

    // Create an admin user
    const adminUser = {
      username: 'admin_menu@example.com',
      password: 'password123',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin' // Assuming there's a role field for admin
    };

    const hashedPassword = require('../libs/bcrypt').encrypt(adminUser.password);
    adminApiKey = require('hat')(); // Generate and store the api_key

    await knex('users').insert({
        username: adminUser.username,
        password: hashedPassword,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        api_key: adminApiKey, // Use the generated api_key
        role: adminUser.role // Ensure your 'users' table has a 'role' column
    });
  });

  after((done) => {
    server.close(() => {
      knex.destroy(done);
    });
  });

  // Test cases for CRUD operations on menus will go here

  describe('POST /api/menus', () => {
    it('it should create a new menu item', (done) => {
      const menuItem = {
        item: 'Pizza Margherita',
        description: 'Classic pizza with tomatoes, mozzarella, and basil',
        price: '12.99'
      };
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey }) // Add api_key to query
        .send(menuItem)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('message').eql('Menu saved');
          res.body.should.have.property('id'); // Check if the ID of the new item is returned
          done();
        });
    });

    it('it should not create a menu item without required fields', (done) => {
      const menuItem = {
        item: 'Incomplete Item'
        // Missing description and price
      };
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey })
        .send(menuItem)
        .end((err, res) => {
          res.should.have.status(400); // Or whatever status code your validation returns
          // Add assertions for the error message/structure if applicable
          done();
        });
    });
  });

  describe('GET /api/menus', () => {
    it('it should get all menu items', (done) => {
      // First, create a menu item to ensure there's data
      const menuItem = { item: 'Pasta Carbonara', description: 'Creamy pasta with bacon', price: '15.00' };
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey })
        .send(menuItem)
        .end((err, res) => {
          res.should.have.status(201);
          // Now, get all menu items
          chai.request(server)
            .get('/api/menus')
            .query({ api_key: adminApiKey })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('menu').that.is.an('array');
              res.body.menu.length.should.be.eql(1);
              done();
            });
        });
    });

    it('it should get a single menu item by id', (done) => {
      const menuItem = { item: 'Steak Frites', description: 'Grilled steak with french fries', price: '25.50' };
      let menuItemId;
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey })
        .send(menuItem)
        .end((err, res) => {
          res.should.have.status(201);
          menuItemId = res.body.id; // Get the ID of the created item
          // Now, get the item by its ID
          chai.request(server)
            .get('/api/menus')
            .query({ api_key: adminApiKey, id: menuItemId })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('menu').that.is.an('array');
              res.body.menu.length.should.be.eql(1);
              res.body.menu[0].should.have.property('id').eql(menuItemId);
              res.body.menu[0].should.have.property('item').eql(menuItem.item);
              done();
            });
        });
    });
  });

  describe('PUT /api/menus', () => {
    it('it should update an existing menu item', (done) => {
      const initialMenuItem = { item: 'Old Salad', description: 'Old boring salad', price: '9.00' };
      let menuItemId;
      // First, create a menu item
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey })
        .send(initialMenuItem)
        .end((err, res) => {
          res.should.have.status(201);
          menuItemId = res.body.id;

          const updatedMenuItem = {
            id: menuItemId, // Important: ID is needed in the body for update
            item: 'New Super Salad',
            description: 'New exciting salad with lots of toppings',
            price: '11.50'
          };
          // Now, update the item
          chai.request(server)
            .put('/api/menus')
            .query({ api_key: adminApiKey })
            .send(updatedMenuItem)
            .end((err, res) => {
              res.should.have.status(204); // No content on successful update
              // Optionally, verify the update by fetching the item
              chai.request(server)
                .get('/api/menus')
                .query({ api_key: adminApiKey, id: menuItemId })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.menu[0].should.have.property('item').eql(updatedMenuItem.item);
                  res.body.menu[0].should.have.property('description').eql(updatedMenuItem.description);
                  res.body.menu[0].should.have.property('price').eql(updatedMenuItem.price);
                  done();
                });
            });
        });
    });
  });

  describe('DELETE /api/menus', () => {
    it('it should delete an existing menu item', (done) => {
      const menuItem = { item: 'Temporary Item', description: 'Will be deleted soon', price: '1.00' };
      let menuItemId;
      // First, create a menu item
      chai.request(server)
        .post('/api/menus')
        .query({ api_key: adminApiKey })
        .send(menuItem)
        .end((err, res) => {
          res.should.have.status(201);
          menuItemId = res.body.id;

          // Now, delete the item
          chai.request(server)
            .delete('/api/menus')
            .query({ api_key: adminApiKey, id: menuItemId }) // ID in query for delete
            .end((err, res) => {
              res.should.have.status(204); // No content on successful delete
              // Optionally, verify the deletion by trying to fetch the item
              chai.request(server)
                .get('/api/menus')
                .query({ api_key: adminApiKey, id: menuItemId })
                .end((err, res) => {
                  res.should.have.status(200); // Still 200
                  res.body.should.be.a('object');
                  res.body.should.have.property('menu').that.is.an('array').with.lengthOf(0); // Menu array should be empty
                  done();
                });
            });
        });
    });
  });

});
