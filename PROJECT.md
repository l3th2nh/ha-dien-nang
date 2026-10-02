# ⚡ Dự án: Báo cáo Điện năng (HA custom integration — HACS)

> **Mục tiêu:** Panel HA báo cáo tiêu thụ điện từng đồng hồ (điện lực, Hải Vân, tổng…) theo
> Ngày/Tháng/Năm + chu kỳ chốt số + khoảng tùy chọn; lượng NLMT tạo ra; cảnh báo ngưỡng.

- **Trạng thái:** 🟡 **Pha 1 xong** (báo cáo). Repo public `github.com/l3th2nh/ha-dien-nang` (v0.1.0).
- **Cập nhật:** 2026-10-02
- **Bối cảnh HA chung:** xem memory `ha-system-context`.

## Topology điện của nhà (QUAN TRỌNG — hiểu đúng mới báo cáo đúng)

```
   [Điện lực] ─┐
               ├─(ATS: chỉ 1 nguồn chạy/lần)─► [Inverter Solis + PV + Pin]
   [Hải Vân] ──┘                                        │
                                              [Đồng hồ TỔNG] ──► tiêu thụ toàn nhà
```
- **Điện lực + Hải Vân** = 2 nguồn lưới *trước* inverter, luân phiên qua ATS → **mua lưới = điện lực + Hải Vân** (không chồng nhau). Người dùng muốn **tách riêng** mua từ mỗi nguồn.
- **Đồng hồ tổng** = *sau* inverter → **tiêu thụ toàn nhà**.
- **NLMT sản lượng** = PV của inverter Solis; hoặc ước tính = **Tổng − (Điện lực + Hải Vân)** = "phần nhà dùng không từ lưới" (gồm cả pin — nhãn rõ để không nhầm với "sản xuất ra").

## Quyết định kiến trúc

- **Báo cáo = thống kê dài hạn HA**, query thẳng từ frontend: `hass.callWS({type:"recorder/statistics_during_period", period, types:["change","sum"]})`. **KHÔNG tạo helper `utility_meter`.** `change` = kWh mỗi bucket (giờ/ngày/tháng) = chiều cao cột.
- **Chu kỳ chốt số:** điện lực đọc số ~ngày 26 (đổi được). Báo cáo range-based: ngày chốt cấu hình được từng đồng hồ → khớp hóa đơn (Energy Dashboard mặc định KHÔNG làm được chu kỳ 26→25 ⇒ lý do làm panel riêng).
- **Cấu hình trong panel** (WS `dien_nang/get_config`/`save_config` → Store). Mỗi đồng hồ: `{name, energy, power, voltage, current, switch, role(grid/total/pv/other), billing_day, order}`. Settings tự gợi ý anh em cùng thiết bị theo tiền tố entity_id.
- **Giao diện** dùng biến theme HA (`--primary-text-color`…) → tự hợp sáng/tối. Chart SVG theo chuẩn skill `dataviz` (cột 1 series, đầu bo 4px, khe 2px, trục mờ, hover tooltip).

## Sensor (đọc từ ảnh dropdown của người dùng — xác nhận lại khi cấu hình)
`sensor.dien_luc_total_energy`, `sensor.dong_ho_hai_van_total_energy`, `sensor.dong_ho_tong_total_energy`
(+ `..._power/voltage/current`, `switch.*`). NLMT: PV inverter Solis (`sensor.ib_*`) hoặc ước tính.

## Lộ trình
- **Pha 1 ✅** báo cáo Day/Month/Year/cycle/custom + real-time + on/off + tóm tắt Nhà/Lưới/NLMT.
- **Pha 2** rule-builder cảnh báo ngưỡng kWh/ngày|chu-kỳ → notify. **Tái dùng `_send_notification` + rule engine
  của `D:\Iot\InverterLogs\custom_components\inverter_bridge\__init__.py`** (xử lý mobile_app cũ / notify entity
  mới / fallback persistent, `blocking=True` để không nuốt lỗi — đúng bài học `ha-custom-integration-bay-callback`).
- **Pha 3** biểu đồ dòng điện, % tự dùng NLMT, chi phí theo giá điện riêng từng đồng hồ.

## Tham khảo tái dùng
- `ha-chuong-cua` — scaffold integration + panel + WS + HACS.
- `InverterLogs/inverter_bridge` — rule engine + `_send_notification` + panel rule-builder (ảnh 3).
