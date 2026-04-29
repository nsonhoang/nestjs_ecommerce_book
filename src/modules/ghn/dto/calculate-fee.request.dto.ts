export class GhnCalculateFeeRequestDto {
  from_district_id?: number; // Không bắt buộc nếu đã cấu hình ShopId mặc định
  from_ward_code?: string;
  service_id?: number; // Chọn 1 trong 2: service_id hoặc service_type_id
  service_type_id?: number; // Thường dùng 2 (Gói chuẩn)
  to_district_id!: number; // ID quận/huyện khách hàng
  to_ward_code!: string; // Mã phường/xã khách hàng
  height!: number; // cm
  length!: number; // cm
  weight!: number; // gram
  width!: number; // cm
  insurance_value?: number; // Giá trị đơn hàng để tính bảo hiểm (tối đa 5tr)
  coupon?: string; // Mã giảm giá của GHN (nếu có)

  // Các trường bổ sung nếu cần
  cod_failed_amount?: number;
  cod_value?: number; // nếu là Cod thì đây là giá trị của tổng đơn hàng do chưa tích hợp nên đây sẽ là mặc định
}

// export class GetShippingFeeDto {
//   @IsNotEmpty()
//   @IsNumber()
//   to_district_id!: number;

//   @IsNotEmpty()
//   @IsString()
//   to_ward_code!: string;

//   @IsNotEmpty()
//   @IsNumber()
//   weight!: number; // Tổng cân nặng giỏ hàng (gram)

//   @IsOptional()
//   @IsNumber()
//   insurance_value?: number; // Tổng giá trị đơn hàng
// }
