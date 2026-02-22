export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tabs principaux
export type AppTabParamList = {
  BorrowerTab: undefined;
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

// Stack Borrowers
export type BorrowerStackParamList = {
  BorrowerList: undefined;
  CreateBorrower: undefined;
  BorrowerDetail: { id: string };
  EditBorrower: { id: string };
};
