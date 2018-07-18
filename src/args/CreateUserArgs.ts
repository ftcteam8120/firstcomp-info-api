export interface CreateUserArgs {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photoUrl?: string;
  };
}
