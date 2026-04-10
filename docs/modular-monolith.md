# Modular Monolith Architecture

This project follows a modular monolith architecture where each business capability is isolated in a NestJS module.

## Layering

- `src/core`: technical foundation (configuration, database bootstrap)
- `src/modules`: business modules (features)
- `src/common`: shared cross-cutting concerns (guards, decorators, exception filter, response contract)

## Composition

- `CoreModule` wires global infrastructure:
  - `ConfigModule`
  - `PrismaModule`
- `FeatureModulesModule` composes all business modules:
  - `users`, `roles`, `auth`, `book`, `categories`, `image-book`, `author`
- `AppModule` only composes `CoreModule` and `FeatureModulesModule`.

## Module Rules

- Keep module internals private as much as possible.
- Export only what another module needs.
- Prefer service-to-service interaction over repository-to-repository interaction across modules.
- Keep DTOs local to each module.

## Naming Conventions

- File names: kebab-case (example: `user-update.request.dto.ts`)
- Module files: `<feature>.module.ts`
- Controller files: `<feature>.controller.ts`
- Service files: `<feature>.service.ts`
- Repository files: `<feature>.repository.ts`

## Shared Contracts

- API envelope: `src/common/api-response.ts`
- Global exception formatting: `src/common/exception-handler/http-exception.filter.ts`
- Pagination base query: `src/common/dto/pagination-query.dto.ts`
- Pagination result type: `src/common/types/paginated-result.type.ts`

## Next Recommended Steps

- Add per-module `index.ts` barrel exports for public APIs.
- Add e2e tests for cross-module flows (auth -> users/roles).
- Gradually add application/domain boundaries inside each module if complexity grows.
