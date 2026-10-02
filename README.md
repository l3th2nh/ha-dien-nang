# Điện năng — báo cáo tiêu thụ điện & NLMT cho Home Assistant

Panel HA (cài qua HACS) hiển thị **báo cáo chi tiết từng đồng hồ điện** (điện lực, Hải Vân, đồng hồ tổng…)
theo **Ngày / Tháng / Năm / Chu kỳ chốt số / Khoảng tùy chọn**, kèm công suất–điện áp–dòng real-time,
bật/tắt công tắc đồng hồ, và lượng điện **NLMT** tạo ra. Cảnh báo ngưỡng tiêu thụ (Pha 2).

Báo cáo lấy từ **thống kê dài hạn có sẵn của HA** (`recorder/statistics_during_period`) — **không cần tạo
helper `utility_meter`** nào.

## Tính năng (Pha 1)

- **Tổng quan:** thẻ từng đồng hồ (hôm nay kWh, W/V/A, on/off) + dải tóm tắt **Nhà / Mua lưới / NLMT**.
- **Chi tiết đồng hồ:** chart cột kiểu app Tuya — Ngày (theo giờ), Tháng (theo ngày), Năm (theo tháng).
- **Chu kỳ chốt số:** khớp hóa đơn điện lực (vd 26 → 25), đặt **ngày chốt riêng** cho từng đồng hồ.
- **Tùy chọn:** chọn **từ ngày → đến ngày** bất kỳ.
- **NLMT:** chọn sensor sản lượng của inverter, hoặc để trống → ước tính = *Tổng − (Điện lực + Hải Vân)*.
- Giao diện tự hợp **sáng/tối** theo theme HA.

## Lộ trình

- **Pha 2:** rule-builder cảnh báo (ngưỡng kWh theo ngày/chu kỳ của 1 đồng hồ → thông báo điện thoại),
  tái dùng cơ chế notify bền của dự án `inverter_bridge`.
- **Pha 3:** biểu đồ dòng điện, % tự dùng NLMT, chi phí theo giá điện riêng từng đồng hồ.

## Cài qua HACS

1. HACS → ⋮ → **Custom repositories** → dán URL repo này, category **Integration** → **Add**.
2. Tìm **"Điện năng"** → **Download** → **Restart** Home Assistant.
3. **Settings → Devices & Services → + Add Integration → Điện năng**.
4. Mở panel **"Điện năng"** ở sidebar → **⚙ Cài đặt** → **Thêm đồng hồ** (chọn sensor năng lượng kWh;
   hệ thống tự gợi ý công suất/điện áp/dòng/công tắc cùng thiết bị) → đặt **vai trò** (Mua lưới / Tiêu thụ nhà
   / NLMT) + **ngày chốt số** → **Lưu**.

## Yêu cầu

- HA bật **recorder** (mặc định có) để có thống kê dài hạn.
- Các đồng hồ có sensor **năng lượng kWh** (`state_class: total_increasing`).
