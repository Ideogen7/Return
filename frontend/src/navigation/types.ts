export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tabs principaux
export type AppTabParamList = {
  LoanTab: undefined;
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

// Stack Borrowers
export type BorrowerStackParamList = {
  BorrowerList: undefined;
  CreateBorrower: undefined;
  BorrowerDetail: { id: string };
  EditBorrower: { id: string };
};
