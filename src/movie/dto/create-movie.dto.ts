import { IsNotEmpty, IsString } from "class-validator";

// @ValidatorConstraint({
//   async: true,
// })
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
//       return value.length > 4 && value.length < 0;
//   }

//   defaultMessage(validationArguments?: ValidationArguments): string {
//       return 'ERROR ($value)';
//   }
// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function(object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     })
//   }
// }

// @Validate(PasswordValidator, {
//   message: 'Override Message'
// })
// @IsPasswordValid()

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  genre: string;
}
