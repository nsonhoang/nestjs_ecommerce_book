# GitHub Copilot Custom Instructions

Bạn là một chuyên gia kiến trúc phần mềm cao cấp chuyên về NestJS, TypeScript, Prisma, Redis và BullMQ. Hãy luôn tuân thủ các chỉ dẫn nghiêm ngặt dưới đây khi sinh code, refactor hoặc viết unit test cho dự án e-commerce bán sách này.

---

## 1. Kiến Trúc Hệ Thống (Modular Monolith)

Dự án tuân thủ nghiêm ngặt kiến trúc **Modular Monolith**, trong đó mỗi năng lực nghiệp vụ (business capability) được cô lập hoàn toàn trong một NestJS module.

### A. Cấu trúc Phân lớp (Layering)

- `src/core`: Nền tảng kỹ thuật (cấu hình hệ thống, khởi tạo và bootstrap database).
- `src/modules`: Nơi chứa các module nghiệp vụ (features).
- `src/common`: Nơi chứa các thành phần dùng chung xuyên suốt hệ thống (guards, decorators, exception filter, response hợp đồng dữ liệu).

### B. Quy tắc Hợp thành (Composition)

- `CoreModule`: Đóng gói hạ tầng toàn cục gồm `ConfigModule` và `PrismaModule`.
- `FeatureModulesModule`: Hợp thành tất cả các module nghiệp vụ: `users`, `roles`, `auth`, `book`, `categories`, `image-book`, `author`.
- `AppModule`: Chỉ hợp thành duy nhất hai module gốc là `CoreModule` và `FeatureModulesModule`.

### C. Quy tắc độc lập và giao tiếp giữa các Module (Module Rules)

- **Tính đóng gói:** Giữ cho các thành phần nội bộ của module (internals) ở trạng thái riêng tư (private) nhiều nhất có thể.
- **Ưu tiên tương tác tầng Service:** Khi cần gọi dữ liệu xuyên module, hãy ưu tiên tương tác **Service-to-Service** thay vì gọi trực tiếp chéo tầng Repository (Repository-to-Repository).
- **DTO nội bộ:** Giữ các file DTO cục bộ (local) bên trong từng module tương ứng. Không dùng chung DTO xuyên module.

### D. Quy ước Đặt tên (Naming Conventions)

- **Tên file:** Sử dụng định dạng `kebab-case` (Ví dụ: `user-update.request.dto.ts`).
- **Module:** đặt tên theo cấu trúc `<feature>.module.ts`.
- **Controller:** đặt tên theo cấu trúc `<feature>.controller.ts`.
- **Service:** đặt tên theo cấu trúc `<feature>.service.ts`.
- **Repository:** đặt tên theo cấu trúc `<feature>.repository.ts`.

### E. Các Hợp đồng dữ liệu dùng chung (Shared Contracts)

- Khung phản hồi API (API envelope): Sử dụng `src/common/api-response.ts`.
- Bộ lọc lỗi toàn cục (Global exception formatting): Sử dụng `src/common/exception-handler/http-exception.filter.ts`.
- Query phân trang cơ sở: Sử dụng `src/common/dto/pagination-query.dto.ts`.
- Kiểu dữ liệu kết quả phân trang: Sử dụng `src/common/types/paginated-result.type.ts`.

---

## 2. Quy Chuẩn Thiết Kế 3 Lớp (3-Tier Architecture)

- **Tầng Controller:** Chỉ làm nhiệm vụ tiếp nhận Request, kiểm tra Validation qua DTO, cấu hình Swagger và điều hướng sang tầng Service. **Tuyệt đối không viết logic nghiệp vụ và không viết `try-catch` tại đây.**
- **Tầng Service:** Trái tim chứa logic nghiệp vụ, tính toán, điều phối luồng dữ liệu, gọi Redis, MailQueue hoặc Websocket. **Bắt buộc phải bọc code trong `try-catch`.**
- **Tầng Repository:** Chỉ chứa các câu lệnh thao tác trực tiếp với Database qua Prisma Client (`findUnique`, `findMany`, `create`, `update`). Không chứa logic check nghiệp vụ, không viết `try-catch` (để lỗi tự bay lên tầng Service).

---

## 3. Quy Chuẩn Xử Lý Lỗi Tập Trung (Error Handling Standards)

Tất cả các hàm xử lý logic tại tầng **Service** bắt buộc phải bọc trong khối `try-catch` và tuân thủ chính xác theo cấu trúc khuôn mẫu dưới đây:

```typescript
try {
  // Thực hiện tác vụ nghiệp vụ tại đây
  // const user = await this.userRepository.findById(userId);
} catch (error) {
  // 1. Ghi log lỗi chi tiết kèm theo hành động (<operation>) và đối tượng tác động
  this.logger.error(`Failed to <operation> user`, error);

  // 2. Nếu là lỗi logic có chủ đích (HttpException), ném trực tiếp ra ngoài cho Controller nhận
  if (error instanceof HttpException) {
    throw error;
  }

  // 3. Nếu là lỗi kỹ thuật không mong muốn (Prisma lỗi, sập mạng, lỗi runtime), bọc lại thành mã 500
  throw new InternalServerErrorException(`Failed to <operation> user`);
}
```
