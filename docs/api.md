# Tài liệu API – NestJS E-Commerce (Books)

## 0) Tổng quan

- **Swagger UI**: `GET /api-docs`
- **Base URL (local)**: `http://localhost:3000`
- **Prefix**: hầu hết endpoint nằm dưới `/v1/*`
- **CORS**: hiện bật `origin: http://localhost:5173`, `credentials: true`
- **ValidationPipe (global)**:
  - `whitelist: true`: loại bỏ field không có trong DTO
  - `forbidNonWhitelisted: true`: nếu gửi field lạ sẽ trả 400
  - `transform: true`: tự convert query/body theo decorator `@Type`, `@Transform`

## 1) Chuẩn response & lỗi

### 1.1) Envelope chuẩn (`ApiResponse<T>`)

Tất cả endpoint **đa số** trả về theo cấu trúc:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "code": 200,
  "timestamp": "2026-05-20T00:00:00.000Z"
}
```

- `success` (boolean): thành công hay không
- `message` (string, optional): mô tả
- `data` (T, optional): payload
- `code` (number): HTTP status code
- `errors` (unknown, optional): chi tiết lỗi
- `timestamp` (Date)

### 1.2) Format lỗi (Global exception filter)

- Với lỗi validate (DTO): thường trả:

```json
{
  "success": false,
  "message": "Lỗi",
  "code": 400,
  "errors": ["<message 1>", "<message 2>"]
}
```

- Với lỗi `HttpException` có message string: trả `ApiResponse.message(message, status)`.

## 2) Authentication & Headers

### 2.1) Bearer JWT (Access Token)

Các endpoint dùng `JwtAuthGuard` yêu cầu:

- `Authorization: Bearer <accessToken>`

### 2.2) Device header (bắt buộc ở Auth)

Một số endpoint Auth bắt buộc:

- `x-device-id: <string>`

Ghi chú:

- `AuthService.getDeviceId()` **ném 400** nếu thiếu `x-device-id`.

### 2.3) Refresh token + CSRF

Luồng refresh token hiện tại dùng **cookie + header CSRF**:

- Cookie do server set sau login/refresh:
  - `refreshToken` (httpOnly, path: `/v1/auth/refresh-token`)
  - `csrfToken` (không httpOnly, path: `/v1/auth/refresh-token`)
- Khi gọi refresh:
  - Header: `x-csrf-token: <csrfToken>` (bắt buộc, phải khớp cookie `csrfToken`)
  - Header: `x-device-id: <string>` (bắt buộc)
  - Client phải gửi cookie (fetch/axios cần `withCredentials: true`)

### 2.4) GHN Webhook secret header

Endpoint webhook GHN yêu cầu header:

- `token: <GHN_TOKEN>`

## 3) Content-Types

- `application/json` cho hầu hết endpoint.
- `multipart/form-data` cho upload:
  - `POST /v1/books`
  - `POST /v1/book-images`

## 4) Schema DTO (Body/Query)

> Quy ước trình bày:
>
> - **Required**: bắt buộc
> - **Optional**: không bắt buộc
> - **Type**: kiểu dữ liệu
> - **Constraints**: ràng buộc validation

### 4.1) Common query pagination (`PaginationQueryDto`)

- `page` (Optional, int, default=1, min=1)
- `limit` (Optional, int, default=10, min=1, max=100)
- `keyword` (Optional, string)
- `sortBy` (Optional, string, default=`createdAt`)
- `sortOrder` (Optional, enum: `asc|desc`, default=`desc`)

### 4.2) Auth

#### AuthRequestDto (Login)

- `email` (Required, string, email)
- `password` (Required, string, minLen=6, maxLen=50)
- `fcmToken` (Optional, string)
- `deviceOs` (Optional, string)

#### AuthRegisterRequestDto (Register)

- `email` (Required, string, email)
- `password` (Required, string, minLen=6, maxLen=50)
- `confirmPassword` (Required, string, phải match `password`)
- `name` (Required, string)
- `phone` (Optional, string, regex: `^[0-9]{9,11}$`)

#### ValidateOtpRequestDto

- `otp` (Required, string, regex: `^[0-9]{6}$`)

#### LogoutRequestDto

- `fcmToken` (Optional, string)

#### AuthChangePasswordRequestDto

- `oldPassword` (Required, string, minLen=6, maxLen=50)
- `newPassword` (Required, string, minLen=6, maxLen=50)
- `confirmNewPassword` (Required, string, phải match `newPassword`)

#### ResetPasswordRequestDto

- `email` (Required, string, email)

#### ConfirmResetPasswordRequestDto

- `newPassword` (Required, string, minLen=6, maxLen=50)

### 4.3) Users

#### User model (summary)

- `id` (string, uuid)
- `email` (string, unique)
- `name` (string)
- `phone` (string | null)
- `status` (enum: `ACTIVE | INACTIVE`, default=`ACTIVE`) — user trạng thái, dùng để bật/tắt tài khoản
- `roleId` (string)

#### UserUpdateByUserRequestDto

- `name` (Optional, string, minLen=2, maxLen=100, not empty)
- `phone` (Optional, string, regex: `^[0-9]{9,11}$`)

> Note: `UserUpdateByUserRequestDto` explicitly excludes `roleId` and `status` — regular users cannot change their role or status.

#### UserUpdateRequestDto (admin)

- `name` (Optional, string, minLen=2, maxLen=100, not empty)
- `phone` (Optional, string, regex: `^[0-9]{9,11}$`)
- `roleId` (Optional, string)
- `status` (Optional, enum: `ACTIVE|INACTIVE`) — Admin only. When provided, updates the user's `status` field in the database.

#### UserQueryDto

Kế thừa `PaginationQueryDto` và giới hạn `sortBy`:

- `sortBy` (Optional, enum: `createdAt|email|name`, default=`createdAt`)

### 4.4) Books

#### PaginateBookDto

Kế thừa `PaginationQueryDto`:

- `categoryId` (Optional, string, uuid v4)
- `authorId` (Optional, string, uuid v4)
- `promotionId` (Optional, string, uuid v4)

#### BookRequestDto (create)

- `title` (Required, string, not empty)
- `description` (Optional, string)
- `price` (Required, number, min=0)
- `categoryId` (Required, string[], array not empty)
- `authorId` (Required, string[], array not empty)
- `file` (Required ở controller runtime, binary, png|jpg|jpeg, max 2MB)
- `thumbnail` (Optional, string) – backend tự set từ upload

#### BookUpdateRequestDto (update)

- Kế thừa `PartialType(BookRequestDto)` → các field của `BookRequestDto` đều **Optional**
- Thêm:
  - `status` (Required, enum `BookStatus` từ Prisma)

### 4.5) Categories

#### CategoryRequestDto

- `name` (Required, string, not empty)

### 4.6) Authors

#### AuthorRequestDto

- `name` (Required, not empty)
- `dateOfBirth` (Optional, Date)
- `info` (Optional)
- `nationality` (Optional)

#### AuthorUpdateRequestDto

- `name` (Optional, not empty)
- `dateOfBirth` (Optional, Date)
- `info` (Optional)
- `nationality` (Optional)

### 4.7) Carts

#### CartItemRequestDto

- `bookId` (Required)
- `quantity` (Required, int, min=1)

#### UpdateCartItemDto

- `quantity` (Optional, int, min=1)

#### DeleteCartItemRequestDto

- `cartItemid` (Required, uuid v4[])

### 4.8) Orders

#### CreateOrderRequestDto

- `cardItemIds` (Required, string[]) – danh sách cart-item-id
- `paymentMethod` (Required, enum `OrderPaymentMethod`)
- `addressId` (Required, string)
- `note` (Optional, string)
- `voucherCode` (Optional, string, maxLen=50)

#### PaginateOrderDto

Kế thừa `PaginationQueryDto` + filter:

- `userId` (Optional, uuid v4)
- `createFrom` (Optional, ISO 8601 date string)
- `createTo` (Optional, ISO 8601 date string)
- `updateFrom` (Optional, ISO 8601 date string)
- `updateTo` (Optional, ISO 8601 date string)
- `paymentMethod` (Optional, enum `OrderPaymentMethod`)
- `minAmount` (Optional, number, min=0)
- `maxAmount` (Optional, number, min=0)
- `status` (Optional, enum `OrderStatus`)
- `code` (Optional, string)
- `shippingPhone` (Optional, string)
- `shippingAddress` (Optional, string)
- `shippingWard` (Optional, string)
- `shippingDistrict` (Optional, string)
- `shippingCity` (Optional, string)

#### UpdateOrderStatusRequestDto

- `status` (Required, enum `OrderStatus`)

### 4.9) Vouchers

#### VouchersRequestDto

- `code` (Required, string, not empty, maxLen=50)
- `description` (Optional, string, maxLen=255)
- `discountType` (Required, enum: `FIXED_AMOUNT|PERCENTAGE`)
- `discountValue` (Required, number, min=0)
- `maxDiscount` (Optional, number|null, min=0)
- `minOrderValue` (Optional, number, min=0)
- `usageLimit` (Optional, number, min=1)
- `startDate` (Required, ISO date string)
- `endDate` (Required, ISO date string)
- `isActive` (Optional, boolean)

#### VouchersUpdateRequestDto

Partial + chỉ cho update một số field:

- `description` (Optional)
- `usageLimit` (Optional)
- `startDate` (Optional)
- `endDate` (Optional)
- `isActive` (Optional)

#### PaginateVouchersDto

Kế thừa `PaginationQueryDto`:

- `isActive` (Optional, boolean)
- `now` (Optional, boolean)
- `sortBy` (Optional, enum: `createdAt|code|startDate|endDate|usedCount`, default=`createdAt`)

### 4.10) Reviews

#### ReviewCreateRequestDto

- `bookId` (Required, uuid)
- `rating` (Required, int, min=1, max=5)
- `content` (Optional, string, maxLen=1000)

#### ReviewUpdateRequestDto

- `rating` (Optional, int, min=1, max=5)
- `content` (Optional, string, maxLen=1000)

### 4.11) Promotions

#### PromotionRequestDto

- `name` (Required, string, not empty)
- `discountRate` (Required, int, min=1, max=100)
- `startDate` (Required, ISO date string)
- `endDate` (Required, ISO date string)
- `bookIds` (Required, uuid v4[])

#### PaginatePromotionDto (query)

Kế thừa `PaginationQueryDto`:

- `isActive` (Optional, boolean)
- `startDate` (Optional, ISO 8601 date string)
- `endDate` (Optional, ISO 8601 date string)
- `now` (Optional, boolean)

#### PromotionUpdateRequestDto

Partial(PromotionRequestDto) +

- `isActive` (Optional, boolean)

#### PromotionNotifyRequestDto

- `title` (Required, string, not empty)
- `body` (Required, string, not empty)

### 4.12) Notifications

#### NotificationUsersRequestDto

- `userIds` (Required, string[], array not empty)
- `title` (Required, string, not empty)
- `body` (Required, string, not empty)

### 4.13) Inventory

#### InventoryRequestDto

- `bookId` (Required, uuid v4)

#### InventoryLogRequestDto

- `inventoryId` (Required, string)
- `change` (Required, int)
- `type` (Required, enum `InventoryLogType`)
- `reason` (Optional, string)

### 4.14) GHN

#### GetDistrictsQueryDto

- `provinceId` (Required, int)

#### GetWardsQueryDto

- `districtId` (Required, int)

#### GhnCalculateShippingRequestDto

- `to_district_id` (Required, int)
- `to_ward_code` (Required, string)
- `weight` (Required, int, min=1)
- `height` (Required, int, min=1)
- `length` (Required, int, min=1)
- `width` (Required, int, min=1)
- `orderAmount` (Required, int, min=0)
- `paymentMethod` (Required, enum: `COD|VNPAY`)
- `insurance_value` (Optional, int, min=0)
- `coupon` (Optional, string)

### 4.15) Shipments

#### PaginateShipmentsDto

Kế thừa `PaginationQueryDto`:

- `orderId` (Optional, uuid v4)
- `ghnOrderCode` (Optional, string)
- `status` (Optional, string)
- `shippingService` (Optional, string)
- `createFrom/createTo` (Optional, ISO 8601)
- `shippedFrom/shippedTo` (Optional, ISO 8601)
- `deliveredFrom/deliveredTo` (Optional, ISO 8601)
- `sortBy` (Optional, enum: `createdAt|updatedAt|expectedDelivery|shippedAt|deliveredAt|shippingFee|codAmount|status`, default=`createdAt`)

### 4.16) Address

#### AddressRequestDTO

- `fullName` (Required, string, minLen=2, maxLen=100, not empty)
- `phone` (Required, string, regex: `^[0-9]{9,11}$`)
- `addressLine` (Required, string, minLen=5, maxLen=255, not empty)
- `wardCode` (Required, string, not empty)
- `districtId` (Required, int)
- `provinceId` (Required, int)
- `note` (Optional, string, maxLen=255)
- `country` (Optional, string)
- `label` (Optional, string, maxLen=50)
- `isDefault` (Optional, boolean)

#### UpdateAddressDto

- `PartialType(AddressRequestDTO)` → tất cả field của `AddressRequestDTO` đều **Optional**

### 4.17) Roles

#### RolesRequestDto

- `name` (Required, string, not empty)

## 5) Danh sách Endpoint

### 5.1) App

#### `GET /`

- Auth: Không
- Response: `ApiResponse<string>`

### 5.2) Auth (`/v1/auth`)

#### `POST /v1/auth/login`

- Headers:
  - `x-device-id` (Required)
- Body: `AuthRequestDto`
- Response: `ApiResponse<{ accessToken, expiresAt, csrfToken, tokenType }>`
- Side effects:
  - Set cookie `refreshToken` (httpOnly)
  - Set cookie `csrfToken` (readable)

#### `POST /v1/auth/register`

- Body: `AuthRegisterRequestDto`
- Response: `ApiResponse<string>` (trả `otpToken`)

#### `POST /v1/auth/register/:otpToken`

- Path params:
  - `otpToken` (Required, string)
- Body: `ValidateOtpRequestDto`
- Response: `ApiResponse<UserResponseDto>`

#### `POST /v1/auth/refresh-token`

- Headers:
  - `x-device-id` (Required)
  - `x-csrf-token` (Required, phải trùng cookie `csrfToken`)
- Cookies:
  - `refreshToken` (Required)
  - `csrfToken` (Required)
- Response: `ApiResponse<AuthResponse>`
- Side effects: set lại cookie `refreshToken`, `csrfToken`

#### `POST /v1/auth/logout`

- Auth: Bearer JWT (Required)
- Body: `LogoutRequestDto`
- Response: `ApiResponse<string>`

#### `POST /v1/auth/change-password`

- Auth: Bearer JWT (Required)
- Body: `AuthChangePasswordRequestDto`
- Response: `ApiResponse<string>`

#### `POST /v1/auth/reset-password`

- Body: `ResetPasswordRequestDto`
- Response: `ApiResponse<string>` (trả `otpToken`)

#### `POST /v1/auth/reset-password/:otpToken`

- Path params:
  - `otpToken` (Required)
- Body: `ValidateOtpRequestDto`
- Response: `ApiResponse<string>` (trả reset-token)

#### `PATCH /v1/auth/reset-password/confirm`

- Guard: `ResetPasswordConfirmGuard` (yêu cầu Bearer token loại reset-password)
- Body: `ConfirmResetPasswordRequestDto`
- Response: `ApiResponse<string>`

### 5.3) Users (`/v1/users`)

#### `GET /v1/users/profile`

- Auth: Bearer JWT (Required)
- Response: `ApiResponse<UserResponseDto>`

#### `PATCH /v1/users/profile`

- Auth: Bearer JWT (Required)
- Body: `UserUpdateByUserRequestDto`
- Response: `ApiResponse<UserResponseDto>`

#### `GET /v1/users` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Query: `UserQueryDto`
- Response: `ApiResponse<PaginatedResult<UserResponseDto>>`

#### `GET /v1/users/:id` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Path params:
  - `id` (Required)
- Response: `ApiResponse<UserResponseDto>`

#### `PATCH /v1/users/:id` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Body: `UserUpdateRequestDto`
- Response: `ApiResponse<UserResponseDto>`

### 5.4) Books (`/v1/books`)

#### `GET /v1/books`

- Query: `PaginateBookDto`
- Response: `ApiResponse<PaginatedResult<BookResponseDto>>`

#### `GET /v1/books/:id`

- Path params:
  - `id` (Required)
- Response: `ApiResponse<BookDetailResponseDto>`

#### `POST /v1/books` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Content-Type: `multipart/form-data`
- Form fields:
  - `file` (Required, binary)
  - các field còn lại theo `BookRequestDto`
- Response: `ApiResponse<BookResponseDto>`

#### `PATCH /v1/books/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `BookUpdateRequestDto`
- Response: `ApiResponse<BookResponseDto>`

#### `DELETE /v1/books/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<unknown>` (message)

### 5.5) Categories (`/v1/categories`)

#### `GET /v1/categories`

- Response: `ApiResponse<CategoryResponseDto[]>`

#### `GET /v1/categories/:id`

- Path params: `id` (Required)
- Response: `ApiResponse<CategoryResponseDto>`

#### `POST /v1/categories` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `CategoryRequestDto`
- Response: `ApiResponse<CategoryResponseDto>`

#### `PATCH /v1/categories/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `CategoryRequestDto`
- Response: `ApiResponse<CategoryResponseDto>`

#### `DELETE /v1/categories/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<void>`

### 5.6) Authors (`/v1/authors`)

#### `GET /v1/authors`

- Response: `ApiResponse<AuthorResponseDto[]>`

#### `GET /v1/authors/:id`

- Path params: `id` (Required)
- Response: `ApiResponse<AuthorResponseDto>`

#### `POST /v1/authors` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `AuthorRequestDto`
- Response: `ApiResponse<AuthorResponseDto>`

#### `PATCH /v1/authors/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `AuthorUpdateRequestDto`
- Response: `ApiResponse<AuthorResponseDto>`

#### `DELETE /v1/authors/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<unknown>` (message)

### 5.7) Roles (`/v1/roles`) (admin)

#### `GET /v1/roles`

- Auth: Bearer JWT + Role `ADMIN`
- Response: `ApiResponse<RolesResponseDto[]>`

#### `POST /v1/roles`

- Auth: Bearer JWT + Role `ADMIN`
- Body: `RolesRequestDto`
- Response: `ApiResponse<RolesResponseDto>`

#### `DELETE /v1/roles/:id`

- Auth: Bearer JWT + Role `ADMIN`
- Response: `ApiResponse<unknown>` (message)

### 5.8) Carts (`/v1/carts`) (user)

#### `POST /v1/carts/items`

- Auth: Bearer JWT
- Body: `CartItemRequestDto`
- Response: `ApiResponse<CartItemResponseDto>`

#### `GET /v1/carts/user`

- Auth: Bearer JWT
- Response: `ApiResponse<CartResponseDto>`

#### `PATCH /v1/carts/items/:id`

- Auth: Bearer JWT
- Path params: `id` (Required, uuid)
- Body: `UpdateCartItemDto`
- Response: `ApiResponse<unknown>`

#### `DELETE /v1/carts/items/:id`

- Auth: Bearer JWT
- Path params: `id` (Required, uuid)
- Response: `ApiResponse<unknown>` (message)

#### `DELETE /v1/carts/items`

- Auth: Bearer JWT
- Body: `DeleteCartItemRequestDto`
- Response: `ApiResponse<unknown>` (message)

#### `GET /v1/carts/count`

- Auth: Bearer JWT
- Response: `ApiResponse<number>`

### 5.9) Orders (`/v1/orders`)

#### `POST /v1/orders`

- Auth: Bearer JWT
- Body: `CreateOrderRequestDto`
- Response: `ApiResponse<OrderResponseDto>`

#### `GET /v1/orders` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Query: `PaginateOrderDto`
- Response: `ApiResponse<PaginatedResult<OrderResponseDto>>`

#### `GET /v1/orders/me`

- Auth: Bearer JWT
- Query: `PaginateOrderDto`
- Response: `ApiResponse<PaginatedResult<OrderResponseDto>>`

#### `GET /v1/orders/me/:id`

- Auth: Bearer JWT
- Path params: `id` (Required, uuid)
- Response: `ApiResponse<OrderResponseDto>`

#### `PATCH /v1/orders/:id/status` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `UpdateOrderStatusRequestDto`
- Response: `ApiResponse<OrderResponseDto>`

### 5.10) Vouchers (`/v1/vouchers`)

#### `GET /v1/vouchers`

- Query: `PaginateVouchersDto`
- Response: `ApiResponse<PaginatedResult<VouchersResponseDto>>`

#### `GET /v1/vouchers/:id`

- Path params: `id` (Required, uuid)
- Response: `ApiResponse<VouchersResponseDto>`

#### `POST /v1/vouchers` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Body: `VouchersRequestDto`
- Response: `ApiResponse<VouchersResponseDto>`

#### `PATCH /v1/vouchers/:id` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Body: `VouchersUpdateRequestDto`
- Response: `ApiResponse<VouchersResponseDto>`

#### `DELETE /v1/vouchers/:id` (admin)

- Auth: Bearer JWT + Role `ADMIN`
- Response: `ApiResponse<unknown>` (message)

### 5.11) Reviews (`/v1/reviews`)

#### `GET /v1/reviews/book/:bookId`

- Path params: `bookId` (Required)
- Query: `PaginationQueryDto`
- Response: `ApiResponse<PaginatedResult<ReviewResponseDto>>`

#### `GET /v1/reviews/me/:bookId`

- Auth: Bearer JWT
- Path params: `bookId` (Required)
- Response: `ApiResponse<ReviewResponseDto | null>`

#### `POST /v1/reviews`

- Auth: Bearer JWT
- Body: `ReviewCreateRequestDto`
- Response: `ApiResponse<ReviewResponseDto>`

#### `PATCH /v1/reviews/:id`

- Auth: Bearer JWT
- Body: `ReviewUpdateRequestDto`
- Response: `ApiResponse<ReviewResponseDto>`

#### `DELETE /v1/reviews/:id`

- Auth: Bearer JWT
- Response: `ApiResponse<string>`

### 5.12) Promotions (`/v1/promotions`)

#### `GET /v1/promotions`

- Query: `PaginatePromotionDto`
- Response: `ApiResponse<PaginatedResult<PromotionResponseDto>>`

#### `GET /v1/promotions/active`

- Response: `ApiResponse<PromotionResponseDto[]>`

#### `GET /v1/promotions/:id`

- Path params: `id` (Required, uuid)
- Response: `ApiResponse<PromotionResponseDto | null>`

#### `POST /v1/promotions` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `PromotionRequestDto`
- Response: `ApiResponse<PromotionResponseDto>`

#### `PATCH /v1/promotions/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `PromotionUpdateRequestDto`
- Response: `ApiResponse<PromotionResponseDto>`

#### `DELETE /v1/promotions/:id` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<unknown>` (message)

#### `POST /v1/promotions/:id/notify` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `PromotionNotifyRequestDto`
- Response: `ApiResponse<unknown>` (message)

### 5.13) Address (`/v1/address`) (user)

#### `POST /v1/address`

- Auth: Bearer JWT
- Body: `AddressRequestDTO`
- Response: `ApiResponse<AddressResponseDTO>`

#### `GET /v1/address`

- Auth: Bearer JWT
- Response: `ApiResponse<AddressResponseDTO[]>`

#### `GET /v1/address/:id`

- Auth: Bearer JWT
- Response: `ApiResponse<AddressResponseDTO>`

#### `PATCH /v1/address/:id`

- Auth: Bearer JWT
- Body: `UpdateAddressDto`
- Response: `ApiResponse<AddressResponseDTO>`

#### `DELETE /v1/address/:id`

- Auth: Bearer JWT
- Response: `ApiResponse<unknown>` (message)

### 5.14) Book Images (`/v1/book-images`)

#### `GET /v1/book-images`

- Response: `ApiResponse<BookImageResponseDto[]>`

#### `POST /v1/book-images` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Content-Type: `multipart/form-data`
- Form fields:
  - `files` (Required, binary[], max 10 files, mỗi file <= 2MB)
  - `bookId` (Required, string)
- Response: `ApiResponse<unknown>`

#### `DELETE /v1/book-images`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body:
  - `publicId` (Required, string[])
- Response: `ApiResponse<unknown>` (message)

#### `DELETE /v1/book-images/:id`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<unknown>` (message)

### 5.15) Notifications (`/v1/notifications`) (JWT required)

> Module này ghi chú trong code: dùng để test gửi thông báo + lưu token.

#### `POST /v1/notifications/send` (admin/staff)

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `NotificationUsersRequestDto`
- Response: `ApiResponse<unknown>` (message)

#### `POST /v1/notifications/test-send`

- Auth: Bearer JWT
- Body:
  - `title` (Required, string)
  - `body` (Required, string)
- Response: `ApiResponse<unknown>` (message)

#### `POST /v1/notifications/token`

- Auth: Bearer JWT
- Body:
  - `token` (Required, string)
  - `deviceOs` (Optional, string)
- Response: (service response, không bọc `ApiResponse`)

### 5.16) Inventory (`/v1/inventory`) (admin/staff)

#### `POST /v1/inventory`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `InventoryRequestDto`
- Response: `ApiResponse<InventoryResponseDto>`

#### `POST /v1/inventory/logs`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Body: `InventoryLogRequestDto`
- Response: `ApiResponse<InventoryLogResponseDto>`

#### `GET /v1/inventory/logs`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Query:
  - `page` (Optional, int, default=1)
  - `limit` (Optional, int, default=10, max=100)
  - `inventoryId` (Optional, string, uuid) — lọc log cho kho cụ thể
  - `type` (Optional, enum: `IN|OUT|ADJUST`) — lọc theo loại log
  - `from` (Optional, string, ISO date) — lọc các log tạo từ ngày này (inclusive)
  - `to` (Optional, string, ISO date) — lọc các log tạo đến ngày này (inclusive)
- Response: `ApiResponse<PaginatedResult<InventoryLogResponseDto>>`
- Description: Trả về danh sách log theo trang, sắp xếp theo `createdAt desc`.

Example: `GET /v1/inventory/logs?page=2&limit=20&inventoryId=...&type=IN&from=2026-05-01T00:00:00.000Z&to=2026-05-26T23:59:59.999Z`

#### `GET /v1/inventory`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<InventoryResponseDto[]>`

#### `GET /v1/inventory/:id`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<InventoryResponseDto | null>`

#### `DELETE /v1/inventory/:id`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ApiResponse<unknown>` (message)

### 5.17) GHN (`/v1/ghn`)

#### `GET /v1/ghn/provinces`

- Response: `ApiResponse<ProvinceResponse[]>`

#### `GET /v1/ghn/districts?provinceId=...`

- Query: `GetDistrictsQueryDto`
- Response: `ApiResponse<DistrictResponse[]>`

#### `GET /v1/ghn/wards?districtId=...`

- Query: `GetWardsQueryDto`
- Response: `ApiResponse<WardResponse[]>`

#### `POST /v1/ghn/calculate-shipping`

- Auth: Bearer JWT
- Body: `GhnCalculateShippingRequestDto`
- Response: `ApiResponse<{ shippingFee: number }>`

#### `POST /v1/ghn/webhook`

- Headers:
  - `token` (Required, phải khớp `process.env.GHN_TOKEN`)
- Body: `Record<string, unknown>` (payload động)
- Response: `ApiResponse<{ handled: boolean }>`

### 5.18) Shipments (`/v1/shipments`) (admin/staff)

> Lưu ý: 2 endpoint dưới đây trả về trực tiếp từ service (không bọc `ApiResponse`).

#### `GET /v1/shipments`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Query: `PaginateShipmentsDto`
- Response: `ApiResponse<PaginatedResult<ShipmentWithOrder>>`

#### `GET /v1/shipments/order/:orderId`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ShipmentResponseDto | null` (raw)

#### `GET /v1/shipments/:id`

- Auth: Bearer JWT + Role `ADMIN|STAFF`
- Response: `ShipmentResponseDto | null` (raw)
