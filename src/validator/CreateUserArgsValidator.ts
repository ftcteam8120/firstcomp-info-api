import { Service } from 'typedi';
import { CreateUserArgs } from '../args/CreateUserArgs';
import * as PasswordValidator from 'password-validator';
import * as emailValidator from 'email-validator';

@Service()
export class CreateUserArgsValidator {

  validate(args: CreateUserArgs) {
    if (!args.user.firstName) throw new Error('A first name is required');
    if (!args.user.lastName) throw new Error('A last name is required');
    if (!emailValidator.validate(args.user.email)) throw new Error('Invalid email address');
    
    // Define the password schema
    const schema = new PasswordValidator();
    schema
      .is().min(8)
      .is().max(100)
      .has().uppercase()
      .has().lowercase()
      .has().digits()
      .has().not().spaces()
      .is().not().oneOf(['Passw0rd', 'Password123']);
    
    if (!schema.validate(args.user.password)) throw new Error('Invalid password');
  }

}
