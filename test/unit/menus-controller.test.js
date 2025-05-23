const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const expect = chai.expect;

// Stubs for menusModel methods
let mockMenuModelSave, mockMenuModelRead, mockMenuModelUpdate, mockMenuModelDelete;

// Mock Express req/res objects
let mockReq, mockRes, statusStub, sendStub;

// Function to initialize mocks before each test
const initializeMocks = () => {
    // Mock model methods
    mockMenuModelSave = sinon.stub();
    mockMenuModelRead = sinon.stub();
    mockMenuModelUpdate = sinon.stub();
    mockMenuModelDelete = sinon.stub();

    // Mock Express response methods
    statusStub = sinon.stub();
    sendStub = sinon.stub();
    
    // Chain status to send for res.status(code).send(data)
    statusStub.returns({ send: sendStub });

    mockRes = {
        status: statusStub,
        send: sendStub // Though status().send() is common, direct send might be used.
    };
    
    // Default mockReq
    mockReq = {
        body: {},
        query: {}
    };
};

// Load the menus controller with the mocked model
const menusController = proxyquire('../../menus/controller', {
    '../menus/model': { // Path to the model, relative to the controller file
        save: (req, callback) => mockMenuModelSave(req, callback),
        read: (req, callback) => mockMenuModelRead(req, callback),
        update: (req, callback) => mockMenuModelUpdate(req, callback),
        delete: (req, callback) => mockMenuModelDelete(req, callback)
    }
});

describe('Menus Controller - Unit Tests', () => {

    beforeEach(() => {
        initializeMocks();
    });

    describe('save', () => {
        it('should call model.save and send response from model callback', (done) => {
            const modelResponse = { status: 201, data: { message: 'Menu saved', id: 1 } };
            mockReq.body = { item: 'New Item' }; // Example request body
            
            // Configure the mock model's save function to call its callback
            mockMenuModelSave.callsFake((req, callback) => {
                callback(modelResponse);
            });

            menusController.save(mockReq, mockRes);

            // Verify model.save was called correctly
            expect(mockMenuModelSave.calledOnceWith(mockReq, sinon.match.func)).to.be.true;
            
            // Verify response methods were called with model's response
            expect(statusStub.calledOnceWith(modelResponse.status)).to.be.true;
            expect(sendStub.calledOnceWith(modelResponse.data)).to.be.true;
            done();
        });
    });

    describe('read', () => {
        it('should call model.read and send response from model callback', (done) => {
            const modelResponse = { status: 200, data: { menu: [{ id: 1, item: 'Test Item' }] } };
            mockReq.query = { api_key: 'testkey' }; // Example request query

            mockMenuModelRead.callsFake((req, callback) => {
                callback(modelResponse);
            });

            menusController.read(mockReq, mockRes);

            expect(mockMenuModelRead.calledOnceWith(mockReq, sinon.match.func)).to.be.true;
            expect(statusStub.calledOnceWith(modelResponse.status)).to.be.true;
            expect(sendStub.calledOnceWith(modelResponse.data)).to.be.true;
            done();
        });
    });

    describe('update', () => {
        it('should call model.update and send response from model callback', (done) => {
            const modelResponse = { status: 204, data: null }; // Typically no data on 204
            mockReq.body = { id: 1, item: 'Updated Item' };

            mockMenuModelUpdate.callsFake((req, callback) => {
                callback(modelResponse);
            });

            menusController.update(mockReq, mockRes);

            expect(mockMenuModelUpdate.calledOnceWith(mockReq, sinon.match.func)).to.be.true;
            expect(statusStub.calledOnceWith(modelResponse.status)).to.be.true;
            if (modelResponse.data) { // Send is only called if there's data
                expect(sendStub.calledOnceWith(modelResponse.data)).to.be.true;
            } else {
                expect(sendStub.calledOnce).to.be.true; // For res.status(204).send()
            }
            done();
        });
    });

    describe('delete', () => {
        it('should call model.delete and send response from model callback', (done) => {
            const modelResponse = { status: 204, data: null };
            mockReq.query = { id: '1', api_key: 'testkey' };

            mockMenuModelDelete.callsFake((req, callback) => {
                callback(modelResponse);
            });

            menusController.delete(mockReq, mockRes);

            expect(mockMenuModelDelete.calledOnceWith(mockReq, sinon.match.func)).to.be.true;
            expect(statusStub.calledOnceWith(modelResponse.status)).to.be.true;
            if (modelResponse.data) {
                expect(sendStub.calledOnceWith(modelResponse.data)).to.be.true;
            } else {
                expect(sendStub.calledOnce).to.be.true;
            }
            done();
        });
    });
});
