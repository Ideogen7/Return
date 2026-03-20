import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Stack racine (wraps tabs + écrans globaux)
export type RootAppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList> | undefined;
  NotificationList: undefined;
};

// Tabs principaux
export type AppTabParamList = {
  LoanTab: NavigatorScreenParams<LoanStackParamList> | undefined;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList> | undefined;
  BorrowerTab: undefined;
  ItemTab: undefined;
  ProfileTab: undefined;
};

// Stack Profile (anciennement AppStackParamList)
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  Settings: undefined;
};

// Backward compat — les écrans existants utilisent NativeStackScreenProps<AppStackParamList, ...>
export type AppStackParamList = ProfileStackParamList;

// Stack Items
export type ItemStackParamList = {
  ItemList: undefined;
  CreateItem: undefined;
  ItemDetail: { id: string };
  EditItem: { id: string };
};

// Stack Loans
export type LoanStackParamList = {
  LoanList: undefined;
  CreateLoan: undefined;
  LoanDetail: { id: string };
  ConfirmLoan: { id: string };
};

// Stack History
export type HistoryStackParamList = {
  Dashboard: undefined;
  History: undefined;
  Statistics: undefined;
};

// Stack Borrowers
export type BorrowerStackParamList = {
  BorrowerList: undefined;
  CreateBorrower: undefined;
  BorrowerDetail: { id: string };
  EditBorrower: { id: string };
  SearchBorrower: undefined;
  BorrowerInvitations: undefined;
  SentInvitations: undefined;
};
