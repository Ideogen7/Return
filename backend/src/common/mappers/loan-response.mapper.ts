import type { Loan, Item, Photo, User, Borrower } from '@prisma/client';
import type {
  LoanResponse,
  LoanItemResponse,
  LoanLenderResponse,
  LoanBorrowerResponse,
} from '../../loans/interfaces/loan-response.interface.js';
import type { PhotoResponse } from '../../items/interfaces/photo-response.interface.js';

// =============================================================================
// Shared Loan-Response Mappers
// =============================================================================
// Centralises the Prisma-to-response transformation logic used by both
// LoansService and HistoryService, following the same pattern as user.mapper.ts.
// =============================================================================

export type LoanWithRelations = Loan & {
  item: Item & { photos: Photo[] };
  lender: User;
  borrower: Borrower;
};

export function toPhotoResponse(photo: Photo): PhotoResponse {
  return {
    id: photo.id,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    uploadedAt: photo.uploadedAt.toISOString(),
  };
}

export function toItemResponse(item: Item & { photos: Photo[] }): LoanItemResponse {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    estimatedValue: item.estimatedValue,
    photos: item.photos.map((p) => toPhotoResponse(p)),
    createdAt: item.createdAt.toISOString(),
  };
}

export function toLenderResponse(user: User): LoanLenderResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture,
  };
}

export function toBorrowerResponse(borrower: Borrower): LoanBorrowerResponse {
  return {
    id: borrower.id,
    firstName: borrower.firstName,
    lastName: borrower.lastName,
    email: borrower.email,
    phoneNumber: borrower.phoneNumber,
    userId: borrower.userId,
    statistics: {
      totalLoans: borrower.totalLoans,
      returnedOnTime: borrower.returnedOnTime,
      returnedLate: borrower.returnedLate,
      notReturned: borrower.notReturned,
      averageReturnDelay: borrower.averageReturnDelay,
      trustScore: borrower.trustScore,
    },
  };
}

export function toLoanResponse(loan: LoanWithRelations): LoanResponse {
  return {
    id: loan.id,
    item: toItemResponse(loan.item),
    lender: toLenderResponse(loan.lender),
    borrower: toBorrowerResponse(loan.borrower),
    returnDate: loan.returnDate ? loan.returnDate.toISOString().slice(0, 10) : null,
    status: loan.status,
    confirmationDate: loan.confirmationDate?.toISOString() ?? null,
    returnedDate: loan.returnedDate?.toISOString() ?? null,
    notes: loan.notes,
    contestReason: loan.contestReason,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}
