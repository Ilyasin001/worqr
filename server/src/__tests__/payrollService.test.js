import { jest } from '@jest/globals';

const mockFind = jest.fn();

jest.unstable_mockModule('../models/assignment.js', () => ({
  default: { find: mockFind },
}));

const { calculatePayrollPreview } = await import('../services/payrollService.js');

const PERIOD_START = new Date('2025-01-01');
const PERIOD_END   = new Date('2025-01-31');

describe('calculatePayrollPreview', () => {
  it('returns zero totals when no assignments are found', async () => {
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

    const result = await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(result).toEqual({ totalHours: 0, totalPay: 0, assignments: [] });
  });

  it('excludes assignments where shiftId was not populated (outside period or deleted)', async () => {
    const assignments = [
      { shiftId: null, actualStartTime: new Date('2025-01-01T09:00:00Z'), actualEndTime: new Date('2025-01-01T17:00:00Z'), breakDuration: 0, hourlyRate: 15 },
    ];
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(assignments) });

    const result = await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(result.totalHours).toBe(0);
    expect(result.assignments).toHaveLength(0);
  });

  it('calculates totalHours and totalPay correctly after deducting breakDuration', async () => {
    // 8 h shift − 30 min break = 7.5 billable hours × £15 = £112.50
    const assignments = [{
      shiftId: { _id: 'shift1' },
      actualStartTime: new Date('2025-01-01T09:00:00Z'),
      actualEndTime:   new Date('2025-01-01T17:00:00Z'),
      breakDuration: 30,
      hourlyRate: 15,
    }];
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(assignments) });

    const result = await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(result.totalHours).toBeCloseTo(7.5);
    expect(result.totalPay).toBeCloseTo(112.5);
    expect(result.assignments).toHaveLength(1);
  });

  it('accumulates hours and pay across multiple assignments', async () => {
    const shift = { _id: 'shift1' };
    const assignments = [
      { shiftId: shift, actualStartTime: new Date('2025-01-01T09:00:00Z'), actualEndTime: new Date('2025-01-01T13:00:00Z'), breakDuration: 0, hourlyRate: 10 },
      { shiftId: shift, actualStartTime: new Date('2025-01-02T09:00:00Z'), actualEndTime: new Date('2025-01-02T13:00:00Z'), breakDuration: 0, hourlyRate: 10 },
    ];
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(assignments) });

    const result = await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(result.totalHours).toBeCloseTo(8);
    expect(result.totalPay).toBeCloseTo(80);
  });

  it('clamps hours to zero when break exceeds worked time', async () => {
    const assignments = [{
      shiftId: { _id: 'shift1' },
      actualStartTime: new Date('2025-01-01T09:00:00Z'),
      actualEndTime:   new Date('2025-01-01T09:10:00Z'), // 10 min shift
      breakDuration: 60,                                  // 60 min break
      hourlyRate: 15,
    }];
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(assignments) });

    const result = await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(result.totalHours).toBe(0);
    expect(result.totalPay).toBe(0);
  });

  it('queries DB with staffId (not staff) and isPaid: false', async () => {
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

    await calculatePayrollPreview('uid1', PERIOD_START, PERIOD_END);

    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
      staffId: 'uid1',
      isPaid: false,
    }));
  });
});
