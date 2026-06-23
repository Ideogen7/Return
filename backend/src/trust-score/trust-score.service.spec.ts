import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { PrismaService } from '../prisma/prisma.service.js';
import { TrustScoreService } from './trust-score.service.js';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('TrustScoreService', () => {
  let service: TrustScoreService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TrustScoreService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TrustScoreService>(TrustScoreService);
  });

  describe('computeGlobalTrustScore', () => {
    it('aggregates the denormalized counters across all of the user borrower records', async () => {
      prisma.borrower.aggregate.mockResolvedValue({
        _sum: { totalLoans: 10, returnedOnTime: 7, returnedLate: 2, notReturned: 1 },
      } as never);

      const result = await service.computeGlobalTrustScore(USER_ID);

      expect(prisma.borrower.aggregate).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        _sum: {
          totalLoans: true,
          returnedOnTime: true,
          returnedLate: true,
          notReturned: true,
        },
      });
      // (7 * 100 + 2 * 50) / 10 = 80
      expect(result).toEqual({
        trustScore: 80,
        totalLoans: 10,
        returnedOnTime: 7,
        returnedLate: 2,
        notReturned: 1,
      });
    });

    it('returns a zeroed score when the user has no borrower records', async () => {
      prisma.borrower.aggregate.mockResolvedValue({
        _sum: { totalLoans: null, returnedOnTime: null, returnedLate: null, notReturned: null },
      } as never);

      const result = await service.computeGlobalTrustScore(USER_ID);

      expect(result).toEqual({
        trustScore: 0,
        totalLoans: 0,
        returnedOnTime: 0,
        returnedLate: 0,
        notReturned: 0,
      });
    });

    it('rounds the trust score to one decimal', async () => {
      prisma.borrower.aggregate.mockResolvedValue({
        _sum: { totalLoans: 3, returnedOnTime: 1, returnedLate: 1, notReturned: 1 },
      } as never);

      const result = await service.computeGlobalTrustScore(USER_ID);

      // (100 + 50) / 3 = 50 exactly
      expect(result.trustScore).toBe(50);
    });
  });
});
