export class ShippingFeeResponseDto {
  total!: number; // Tổng phí cuối cùng khách phải trả
  service_fee!: number; // Phí dịch vụ gốc
  insurance_fee!: number; // Phí bảo hiểm (nếu có)
  display_fee!: string; // Phí định dạng chuỗi (VD: "25.000đ") - Tiện cho Frontend
  expected_delivery_time?: string; // Thời gian dự kiến giao hàng (nếu bạn gọi thêm API LeadTime)
}
