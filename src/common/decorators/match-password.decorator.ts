import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const relatedPropertyName =
            Array.isArray(args.constraints) &&
            typeof args.constraints[0] === 'string'
              ? args.constraints[0]
              : undefined;

          if (!relatedPropertyName) return false;

          const obj = args.object as Record<string, unknown>;
          return value === obj[relatedPropertyName];
        },
      },
    });
  };
}
