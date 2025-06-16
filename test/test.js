// const request = require('supertest');
// const app = require('../index'); // Import the Express app
// const { db, HealthCheck } = require('../models'); 

// jest.setTimeout(10000); // Set test timeout

// beforeAll(async () => {
//     await db.sequelize.sync({ force: true }); // Reset database before tests
// });

// afterAll(async () => {
//     await db.sequelize.close(); // Close DB connection after tests
//     const { closeConnections } = require('../cleanup');
//     closeConnections(); // Close all connections

//     // Give time for resources to clean up
//     await new Promise(resolve => setTimeout(resolve, 1000));
// });

// describe("Healthz API Tests", () => {
//     test("GET /healthz should return 200 OK", async () => {
//         const response = await request(app).get("/healthz");
//         expect(response.status).toBe(200);

//         const record = await HealthCheck.findOne();
//         expect(record).not.toBeNull();
//     });

//     test("POST /healthz should return 405 Method Not Allowed", async () => {
//         const response = await request(app).post("/healthz");
//         expect(response.status).toBe(405);
//     });

//     test("PUT /healthz should return 405 Method Not Allowed", async () => {
//         const response = await request(app).put("/healthz");
//         expect(response.status).toBe(405);
//     });

//     test("DELETE /healthz should return 405 Method Not Allowed", async () => {
//         const response = await request(app).delete("/healthz");
//         expect(response.status).toBe(405);
//     });

//     test("GET /healthz with request body should return 400 Bad Request", async () => {
//         const response = await request(app).get("/healthz").send({ key: "value" });
//         expect(response.status).toBe(400);
//     });

//     test("Simulate database failure, GET /healthz should return 503 Service Unavailable", async () => {
//         jest.spyOn(HealthCheck, "create").mockImplementation(() => {
//             throw new Error("Database error");
//         });

//         const response = await request(app).get("/healthz");
//         expect(response.status).toBe(503);
//     });

//     test("GET /healthz with request body should return 400 Bad Request", async () => {
//         const response = await request(app).get("/healthz?invalid=true");
//         expect(response.status).toBe(400);
//     });

// });


const request = require('supertest');
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock the logger before importing app
jest.mock('../logger', () => mockLogger);

// Now import the app after mocking logger
const app = require('../index'); // Import the Express app
const { db, HealthCheck } = require('../models'); 

jest.setTimeout(10000); // Set test timeout

// Mock metrics to prevent issues during testing
jest.mock('../metrics', () => ({
  incrementApiCall: jest.fn(),
  measureApiTime: jest.fn(),
  measureDbTime: jest.fn(),
  measureS3Time: jest.fn(),
  close: jest.fn()
}));

beforeAll(async () => {
    await db.sequelize.sync({ force: true }); // Reset database before tests
});

afterAll(async () => {
    await db.sequelize.close(); // Close DB connection after tests
    
    // If you have a cleanup module, use it
    try {
        const { closeConnections } = require('../cleanup');
        closeConnections(); // Close all connections
    } catch (error) {
        console.warn('No cleanup module found or error during cleanup');
    }

    // Give time for resources to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Healthz API Tests", () => {
    test("GET /healthz should return 200 OK", async () => {
        const response = await request(app).get("/healthz");
        expect(response.status).toBe(200);

        const record = await HealthCheck.findOne();
        expect(record).not.toBeNull();
    });

    test("POST /healthz should return 405 Method Not Allowed", async () => {
        const response = await request(app).post("/healthz");
        expect(response.status).toBe(405);
    });

    test("PUT /healthz should return 405 Method Not Allowed", async () => {
        const response = await request(app).put("/healthz");
        expect(response.status).toBe(405);
    });

    test("DELETE /healthz should return 405 Method Not Allowed", async () => {
        const response = await request(app).delete("/healthz");
        expect(response.status).toBe(405);
    });

    test("GET /healthz with request body should return 400 Bad Request", async () => {
        const response = await request(app).get("/healthz").send({ key: "value" });
        expect(response.status).toBe(400);
    });

    test("Simulate database failure, GET /healthz should return 503 Service Unavailable", async () => {
        const originalCreate = HealthCheck.create;
        
        // Use mockImplementation instead of mockRejectedValue for better compatibility
        HealthCheck.create = jest.fn().mockImplementation(() => {
            throw new Error("Database error");
        });

        const response = await request(app).get("/healthz");
        expect(response.status).toBe(503);
        
        // Restore the original function
        HealthCheck.create = originalCreate;
    });

    test("GET /healthz with query parameters should return 400 Bad Request", async () => {
        const response = await request(app).get("/healthz?invalid=true");
        expect(response.status).toBe(400);
    });
});
