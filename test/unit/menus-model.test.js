const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const expect = chai.expect;

// Mock Knex instance and its query builder methods
const mockDb = sinon.stub();
const mockWhere = sinon.stub();
const mockSelect = sinon.stub();
const mockInsert = sinon.stub();
const mockUpdate = sinon.stub();
const mockDel = sinon.stub();

// Chainable Knex methods
mockDb.returnsThis(); // For `DB('menus')`
mockWhere.returnsThis();
mockSelect.resolves([]); // Default to resolving with an empty array for SELECT
mockInsert.resolves([1]); // Default to resolving with an array containing an ID for INSERT
mockUpdate.resolves(1);  // Default to resolving with 1 (affected row) for UPDATE
mockDel.resolves(1);     // Default to resolving with 1 (affected row) for DELETE

// Reset stubs before each test if needed, or setup specific returns per test
const resetStubs = () => {
    mockWhere.resetHistory();
    mockSelect.resetHistory();
    mockSelect.resolves([]); // Reset to default
    mockInsert.resetHistory();
    mockInsert.resolves([1]); // Reset to default
    mockUpdate.resetHistory();
    mockUpdate.resolves(1); // Reset to default
    mockDel.resetHistory();
    mockDel.resolves(1); // Reset to default

    // Ensure chainability for different test paths
    mockDb.callsFake(() => {
        const chain = {};
        chain.where = mockWhere.callsFake(() => chain);
        chain.select = mockSelect.callsFake(() => Promise.resolve(mockSelect.getCall(mockSelect.callCount -1)?.returnValue || []));
        chain.insert = mockInsert.callsFake(() => Promise.resolve(mockInsert.getCall(mockInsert.callCount -1)?.returnValue || [1]));
        chain.update = mockUpdate.callsFake(() => Promise.resolve(mockUpdate.getCall(mockUpdate.callCount -1)?.returnValue || 1));
        chain.del = mockDel.callsFake(() => Promise.resolve(mockDel.getCall(mockDel.callCount -1)?.returnValue || 1));
        return chain;
    });
};


// Stubs for Knex methods
let mockWhere, mockSelect, mockInsert, mockUpdate, mockDel, mockKnexChain;

// Function to reinitialize stubs before each test
const initializeMocks = () => {
    mockWhere = sinon.stub();
    mockSelect = sinon.stub();
    mockInsert = sinon.stub();
    mockUpdate = sinon.stub();
    mockDel = sinon.stub();

    // The object that will be returned by the knex instance, simulating the query builder chain
    mockKnexChain = {
        where: mockWhere.returnsThis(), // Chainable
        select: mockSelect, // These will be configured to resolve/reject per test
        insert: mockInsert,
        update: mockUpdate,
        del: mockDel
    };
};

// The actual Knex mock function that will be passed to proxyquire
const knexMock = sinon.stub();

// Load the menus model with the mocked DB
const menusModel = proxyquire('../../menus/model', {
    '../config/db': () => knexMock // This function will be called by menus/model.js
});

describe('Menus Model - Unit Tests', () => {

    beforeEach(() => {
        initializeMocks();
        // Default behavior: knex() call returns the chainable object
        knexMock.returns(mockKnexChain);
    });

    describe('save', () => {
        it('should save a menu item successfully', (done) => {
            const req = {
                body: { item: 'Test Item', description: 'Test Desc', price: '10.00' },
                query: { api_key: 'test_api_key' }
            };
            const expectedInsertData = { ...req.body, api_key: 'test_api_key' };
            const expectedResultId = 1;
            mockInsert.resolves([expectedResultId]); // Simulate Knex returning the ID of the inserted row

            menusModel.save(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockInsert.calledOnceWith(expectedInsertData)).to.be.true;
                expect(result.status).to.equal(201);
                expect(result.data).to.deep.equal({ message: 'Menu saved', id: expectedResultId });
                done();
            });
        });

        it('should return 400 if req.body is undefined', (done) => {
            const req = { query: { api_key: 'test_api_key' } }; // No body

            menusModel.save(req, (result) => {
                expect(result.status).to.equal(400);
                expect(result.data).to.deep.equal({ message: 'Bad Request' });
                expect(mockInsert.called).to.be.false; // Ensure DB not called
                done();
            });
        });

        it('should handle database error on save', (done) => {
            const req = {
                body: { item: 'Test Item', description: 'Test Desc', price: '10.00' },
                query: { api_key: 'test_api_key' }
            };
            const dbError = new Error('DB insert failed');
            mockInsert.rejects(dbError); // Simulate a database error

            menusModel.save(req, (result) => {
                expect(result.status).to.equal(500);
                expect(result.data).to.deep.equal({ message: 'Error saving menu' });
                done();
            });
        });

        it('should handle api_key being an array', (done) => {
            const req = {
                body: { item: 'Test Item Array Key', description: 'Test Desc', price: '10.00' },
                query: { api_key: ['key1', 'test_api_key_array'] } // API key as an array
            };
            const expectedApiKey = 'test_api_key_array';
            const expectedInsertData = { ...req.body, api_key: expectedApiKey };
            mockInsert.resolves([2]);

            menusModel.save(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockInsert.calledOnceWith(sinon.match(expectedInsertData))).to.be.true;
                expect(result.status).to.equal(201);
                done();
            });
        });
    });

    describe('read', () => {
        it('should read all menu items for a given api_key', (done) => {
            const req = { query: { api_key: 'test_api_key' } };
            const mockMenuData = [
                { id: 1, item: 'Item 1', description: 'Desc 1', price: '10.00' },
                { id: 2, item: 'Item 2', description: 'Desc 2', price: '20.00' }
            ];
            // Simulate Knex select resolving with the mock data
            mockSelect.resolves(mockMenuData);

            menusModel.read(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key' })).to.be.true;
                expect(mockSelect.calledOnceWith('id', 'item', 'description', 'price')).to.be.true;
                expect(result.status).to.equal(200);
                expect(result.data).to.deep.equal({ menu: mockMenuData });
                done();
            });
        });

        it('should read a single menu item by id and api_key', (done) => {
            const req = { query: { api_key: 'test_api_key', id: '1' } };
            const mockSingleMenuItem = [{ id: 1, item: 'Item 1', description: 'Desc 1', price: '10.00' }];
            mockSelect.resolves(mockSingleMenuItem);

            menusModel.read(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key', id: '1' })).to.be.true;
                expect(mockSelect.calledOnceWith('id', 'item', 'description', 'price')).to.be.true;
                expect(result.status).to.equal(200);
                expect(result.data).to.deep.equal({ menu: mockSingleMenuItem });
                done();
            });
        });
        
        it('should handle api_key and id being arrays in read', (done) => {
            const req = { query: { api_key: ['key', 'test_api_key_arr'], id: ['id1', '5'] } };
            const mockSingleMenuItem = [{ id: 5, item: 'Item 5', description: 'Desc 5', price: '50.00' }];
            mockSelect.resolves(mockSingleMenuItem);

            menusModel.read(req, (result) => {
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key_arr', id: '5' })).to.be.true;
                expect(result.status).to.equal(200);
                expect(result.data).to.deep.equal({ menu: mockSingleMenuItem });
                done();
            });
        });

        it('should handle database error on read', (done) => {
            const req = { query: { api_key: 'test_api_key' } };
            const dbError = new Error('DB select failed');
            mockSelect.rejects(dbError); // Simulate a database error

            // menusModel.read is expected to throw an error directly if not caught internally
            // For this test, we'll check if the error is thrown as the model currently does.
            // A more robust model would catch this and call the callback with a 500 status.
            // As per current model code: `throw 'ERROR: unable to get menu ' + error;`
            try {
                menusModel.read(req, () => {}); // Callback won't be called if error is thrown
            } catch (e) {
                expect(e).to.equal('ERROR: unable to get menu ' + dbError);
                done();
            }
        });
        
        it('should return empty array if no menu items found', (done) => {
            const req = { query: { api_key: 'non_existent_key' } };
            mockSelect.resolves([]); // Simulate no data found

            menusModel.read(req, (result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.deep.equal({ menu: [] });
                done();
            });
        });
    });

    describe('update', () => {
        it('should update a menu item successfully', (done) => {
            const req = {
                body: { id: '1', item: 'Updated Item', description: 'Updated Desc', price: '15.00' },
                query: { api_key: 'test_api_key' }
            };
            const expectedUpdateData = { item: 'Updated Item', description: 'Updated Desc', price: '15.00' };
            mockUpdate.resolves(1); // Simulate 1 row affected

            menusModel.update(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key', id: '1' })).to.be.true;
                expect(mockUpdate.calledOnceWith(expectedUpdateData)).to.be.true;
                expect(result.status).to.equal(204);
                done();
            });
        });

        it('should return 400 if req.body.id is undefined for update', (done) => {
            const req = {
                body: { item: 'Updated Item', description: 'Updated Desc', price: '15.00' }, // No id
                query: { api_key: 'test_api_key' }
            };

            menusModel.update(req, (result) => {
                expect(result.status).to.equal(400);
                expect(result.data).to.deep.equal({ message: 'Bad Request' });
                expect(mockUpdate.called).to.be.false;
                done();
            });
        });
        
        it('should handle api_key being an array in update', (done) => {
            const req = {
                body: { id: '2', item: 'Updated Item Array', description: 'Updated Desc', price: '25.00' },
                query: { api_key: ['key', 'test_api_key_arr'] }
            };
            mockUpdate.resolves(1);

            menusModel.update(req, (result) => {
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key_arr', id: '2' })).to.be.true;
                expect(result.status).to.equal(204);
                done();
            });
        });

        it('should handle database error on update', (done) => {
            const req = {
                body: { id: '1', item: 'Updated Item', description: 'Updated Desc', price: '15.00' },
                query: { api_key: 'test_api_key' }
            };
            const dbError = new Error('DB update failed');
            mockUpdate.rejects(dbError);

            // As per current model code: `throw 'ERROR: unable to update record ' + error;`
            try {
                menusModel.update(req, () => {});
            } catch (e) {
                expect(e).to.equal('ERROR: unable to update record ' + dbError);
                done();
            }
        });
        
        it('should return 204 even if no menu item found to update', (done) => {
            // Knex update resolves with 0 if no rows are affected, which is not an error
            const req = {
                body: { id: 'non_existent_id', item: 'Updated Item', description: 'Updated Desc', price: '15.00' },
                query: { api_key: 'test_api_key' }
            };
            mockUpdate.resolves(0); // Simulate 0 rows affected

            menusModel.update(req, (result) => {
                expect(result.status).to.equal(204);
                done();
            });
        });
    });

    describe('delete', () => {
        it('should delete a menu item successfully', (done) => {
            const req = { query: { api_key: 'test_api_key', id: '1' } };
            mockDel.resolves(1); // Simulate 1 row affected

            menusModel.delete(req, (result) => {
                expect(knexMock.calledOnceWith('menus')).to.be.true;
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key', id: '1' })).to.be.true;
                expect(mockDel.calledOnce).to.be.true;
                expect(result.status).to.equal(204);
                done();
            });
        });

        it('should return 400 if req.query.id is undefined for delete', (done) => {
            const req = { query: { api_key: 'test_api_key' } }; // No id

            menusModel.delete(req, (result) => {
                expect(result.status).to.equal(400);
                expect(result.data).to.deep.equal({ message: 'Bad Request' });
                expect(mockDel.called).to.be.false;
                done();
            });
        });

        it('should handle api_key and id being arrays in delete', (done) => {
            const req = { query: { api_key: ['key', 'test_api_key_arr'], id: ['id1', '5'] } };
            mockDel.resolves(1);

            menusModel.delete(req, (result) => {
                expect(mockWhere.calledOnceWith({ api_key: 'test_api_key_arr', id: '5' })).to.be.true;
                expect(result.status).to.equal(204);
                done();
            });
        });
        
        it('should handle database error on delete', (done) => {
            const req = { query: { api_key: 'test_api_key', id: '1' } };
            const dbError = new Error('DB delete failed');
            mockDel.rejects(dbError);

            // As per current model code: `throw error;`
            try {
                menusModel.delete(req, () => {});
            } catch (e) {
                expect(e).to.equal(dbError);
                done();
            }
        });

        it('should return 204 even if no menu item found to delete', (done) => {
            // Knex delete resolves with 0 if no rows are affected
            const req = { query: { api_key: 'test_api_key', id: 'non_existent_id' } };
            mockDel.resolves(0); // Simulate 0 rows affected

            menusModel.delete(req, (result) => {
                expect(result.status).to.equal(204);
                done();
            });
        });
    });
});
