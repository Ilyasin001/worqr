// Cross-tenant isolation: a member of one company must never see or touch
// another company's data. This is the core multi-tenancy security guarantee.
import { startDb, clearDb, stopDb, buildApp, seedCompany, seedAdmin, seedEvent } from './helper.js';
import request from 'supertest';

let app;
let adminA, adminB, eventA;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  const companyA = await seedCompany({ code: 'AAAA1111' });
  const companyB = await seedCompany({ code: 'BBBB2222' });
  adminA = await seedAdmin(companyA);
  adminB = await seedAdmin(companyB);
  // An event owned by company A.
  eventA = await seedEvent(adminA.user._id.toString(), companyA._id.toString());
});

const auth = (admin) => ({ Authorization: `Bearer ${admin.token}` });

describe('event isolation', () => {
  it("company B cannot list company A's events", async () => {
    const res = await request(app).get('/api/events').set(auth(adminB));
    expect(res.status).toBe(200);
    expect(res.body.find(e => e._id === eventA._id.toString())).toBeUndefined();
  });

  it("company B gets 404 fetching company A's event by id", async () => {
    const res = await request(app).get(`/api/events/${eventA._id}`).set(auth(adminB));
    expect(res.status).toBe(404);
  });

  it("company B cannot update company A's event", async () => {
    const res = await request(app)
      .put(`/api/events/${eventA._id}`)
      .set(auth(adminB))
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
  });

  it("company B cannot delete company A's event", async () => {
    const res = await request(app).delete(`/api/events/${eventA._id}`).set(auth(adminB));
    expect(res.status).toBe(404);

    // Confirm it still exists for company A.
    const stillThere = await request(app).get(`/api/events/${eventA._id}`).set(auth(adminA));
    expect(stillThere.status).toBe(200);
  });
});

describe('user isolation', () => {
  it("company B's user list never includes company A's members", async () => {
    const res = await request(app).get('/api/users').set(auth(adminB));
    expect(res.status).toBe(200);
    const ids = res.body.map(u => u._id);
    expect(ids).toContain(adminB.user._id.toString());
    expect(ids).not.toContain(adminA.user._id.toString());
  });

  it("company B gets 404 reading company A's admin by id", async () => {
    const res = await request(app).get(`/api/users/${adminA.user._id}`).set(auth(adminB));
    expect(res.status).toBe(404);
  });
});

describe('payroll isolation', () => {
  it("company B cannot draft payroll for company A's staff", async () => {
    const res = await request(app)
      .post('/api/payroll/draft')
      .set(auth(adminB))
      .send({
        staffId: adminA.user._id.toString(),
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      });
    expect(res.status).toBe(400); // staff not found in company B
  });
});
