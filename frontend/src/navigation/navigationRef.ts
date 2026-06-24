import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootAppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootAppStackParamList>();

/**
 * Deep-link to a loan's detail screen from a push-notification tap.
 * No-op when the loanId is missing or the navigation tree is not mounted yet.
 */
export function navigateToLoanDetail(loanId: string | undefined): void {
  if (!loanId || !navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate('Tabs', {
    screen: 'LoanTab',
    params: {
      screen: 'LoanDetail',
      params: { id: loanId },
    },
  });
}
