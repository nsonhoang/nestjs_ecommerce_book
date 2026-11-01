export enum AppPermission {
  // Books
  BOOK_READ = 'book:read',
  BOOK_CREATE = 'book:create',
  BOOK_UPDATE = 'book:update',
  BOOK_DELETE = 'book:delete',

  // Authors
  AUTHOR_READ = 'author:read',
  AUTHOR_CREATE = 'author:create',
  AUTHOR_UPDATE = 'author:update',
  AUTHOR_DELETE = 'author:delete',

  // Categories
  CATEGORY_READ = 'category:read',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  // Book Images
  BOOK_IMAGE_UPLOAD = 'book_image:upload',
  BOOK_IMAGE_DELETE = 'book_image:delete',

  // Orders
  ORDER_READ = 'order:read',
  ORDER_UPDATE_STATUS = 'order:update_status',
  ORDER_CANCEL = 'order:cancel',
  ORDER_RETURN = 'order:return',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_ADJUST = 'inventory:adjust',
  INVENTORY_VIEW_LOGS = 'inventory:view_logs',

  // Promotions
  PROMOTION_READ = 'promotion:read',
  PROMOTION_CREATE = 'promotion:create',
  PROMOTION_UPDATE = 'promotion:update',
  PROMOTION_DELETE = 'promotion:delete',
  PROMOTION_NOTIFY = 'promotion:notify',

  // Vouchers
  VOUCHER_READ = 'voucher:read',
  VOUCHER_CREATE = 'voucher:create',
  VOUCHER_UPDATE = 'voucher:update',
  VOUCHER_DELETE = 'voucher:delete',

  // Shipments
  SHIPMENT_READ = 'shipment:read',

  // Users
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',

  // Roles & Permissions
  ROLE_READ = 'role:read',
  ROLE_CREATE = 'role:create',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',

  // Reviews
  REVIEW_DELETE = 'review:delete',

  // Notifications
  NOTIFICATION_SEND = 'notification:send',
}

export interface PermissionDefinition {
  name: AppPermission;
  description: string;
  module: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Books
  { name: AppPermission.BOOK_READ, description: 'Xem danh sách và chi tiết sách', module: 'Books' },
  { name: AppPermission.BOOK_CREATE, description: 'Tạo sách mới', module: 'Books' },
  { name: AppPermission.BOOK_UPDATE, description: 'Cập nhật thông tin sách', module: 'Books' },
  { name: AppPermission.BOOK_DELETE, description: 'Xóa sách', module: 'Books' },

  // Authors
  { name: AppPermission.AUTHOR_READ, description: 'Xem danh sách và thông tin tác giả', module: 'Authors' },
  { name: AppPermission.AUTHOR_CREATE, description: 'Tạo tác giả mới', module: 'Authors' },
  { name: AppPermission.AUTHOR_UPDATE, description: 'Cập nhật thông tin tác giả', module: 'Authors' },
  { name: AppPermission.AUTHOR_DELETE, description: 'Xóa tác giả', module: 'Authors' },

  // Categories
  { name: AppPermission.CATEGORY_READ, description: 'Xem danh sách danh mục', module: 'Categories' },
  { name: AppPermission.CATEGORY_CREATE, description: 'Tạo danh mục mới', module: 'Categories' },
  { name: AppPermission.CATEGORY_UPDATE, description: 'Cập nhật danh mục', module: 'Categories' },
  { name: AppPermission.CATEGORY_DELETE, description: 'Xóa danh mục', module: 'Categories' },

  // Book Images
  { name: AppPermission.BOOK_IMAGE_UPLOAD, description: 'Tải lên album ảnh sách', module: 'Book Images' },
  { name: AppPermission.BOOK_IMAGE_DELETE, description: 'Xóa ảnh sách', module: 'Book Images' },

  // Orders
  { name: AppPermission.ORDER_READ, description: 'Xem tất cả đơn hàng hệ thống', module: 'Orders' },
  { name: AppPermission.ORDER_UPDATE_STATUS, description: 'Cập nhật trạng thái đơn hàng', module: 'Orders' },
  { name: AppPermission.ORDER_CANCEL, description: 'Hủy đơn hàng', module: 'Orders' },
  { name: AppPermission.ORDER_RETURN, description: 'Xác nhận hoàn/trả đơn hàng', module: 'Orders' },

  // Inventory
  { name: AppPermission.INVENTORY_VIEW, description: 'Xem danh sách tồn kho', module: 'Inventory' },
  { name: AppPermission.INVENTORY_ADJUST, description: 'Tạo phiếu nhập/xuất/điều chỉnh kho', module: 'Inventory' },
  { name: AppPermission.INVENTORY_VIEW_LOGS, description: 'Xem lịch sử biến động kho', module: 'Inventory' },

  // Promotions
  { name: AppPermission.PROMOTION_READ, description: 'Xem danh sách khuyến mãi', module: 'Promotions' },
  { name: AppPermission.PROMOTION_CREATE, description: 'Tạo chương trình khuyến mãi mới', module: 'Promotions' },
  { name: AppPermission.PROMOTION_UPDATE, description: 'Cập nhật chương trình khuyến mãi', module: 'Promotions' },
  { name: AppPermission.PROMOTION_DELETE, description: 'Xóa chương trình khuyến mãi', module: 'Promotions' },
  { name: AppPermission.PROMOTION_NOTIFY, description: 'Gửi thông báo đẩy về khuyến mãi', module: 'Promotions' },

  // Vouchers
  { name: AppPermission.VOUCHER_READ, description: 'Xem danh sách mã giảm giá', module: 'Vouchers' },
  { name: AppPermission.VOUCHER_CREATE, description: 'Tạo voucher mới', module: 'Vouchers' },
  { name: AppPermission.VOUCHER_UPDATE, description: 'Cập nhật thông tin voucher', module: 'Vouchers' },
  { name: AppPermission.VOUCHER_DELETE, description: 'Xóa mã voucher', module: 'Vouchers' },

  // Shipments
  { name: AppPermission.SHIPMENT_READ, description: 'Xem danh sách và tra cứu vận đơn', module: 'Shipments' },

  // Users
  { name: AppPermission.USER_READ, description: 'Xem danh sách và chi tiết người dùng', module: 'Users' },
  { name: AppPermission.USER_UPDATE, description: 'Cập nhật thông tin và vai trò người dùng', module: 'Users' },

  // Roles & Permissions
  { name: AppPermission.ROLE_READ, description: 'Xem danh sách vai trò và quyền hạn', module: 'Roles' },
  { name: AppPermission.ROLE_CREATE, description: 'Tạo vai trò mới', module: 'Roles' },
  { name: AppPermission.ROLE_UPDATE, description: 'Cập nhật vai trò và gán quyền', module: 'Roles' },
  { name: AppPermission.ROLE_DELETE, description: 'Xóa vai trò', module: 'Roles' },

  // Reviews
  { name: AppPermission.REVIEW_DELETE, description: 'Xóa đánh giá của người dùng vi phạm', module: 'Reviews' },

  // Notifications
  { name: AppPermission.NOTIFICATION_SEND, description: 'Gửi thông báo hệ thống', module: 'Notifications' },
];
