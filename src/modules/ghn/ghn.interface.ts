// interfaces/ghn-request.interface.ts
export interface IGhnCreateOrderRequest {
  payment_type_id: 1 | 2; // 1: Shop trả, 2: Khách trả phí ship
  note: string;
  required_note: 'CHOTHUHANG' | 'CHOXEMHANGNOTHU' | 'KHONGCHOXEMHANG';
  client_order_code: string;
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  cod_amount: number;
  content: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  service_type_id: number;
  insurance_value: number;
  items: Array<{
    name: string;
    code: string;
    quantity: number;
    price: number;
  }>;
}

export interface IGhnCreateOrderResponse {
  order_code: string; // Mã vận đơn GHN (VD: G567HJK)
  sort_code: string; // Mã phân loại bưu cục
  trans_type: string;
  total_fee: number; // Tổng phí vận chuyển thực tế
  expected_delivery_time: string; // ISO Date string
  fee: {
    main_service: number;
    insurance: number;
    station_do: number;
    station_pu: number;
    return: number;
    r2s: number;
    coupon: number;
    cod_fee: number;
    double_check: number;
    document_return: number;
    total: number;
  };
}
