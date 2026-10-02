"""Hằng số cho tích hợp Điện năng (báo cáo tiêu thụ điện + NLMT + cảnh báo)."""
DOMAIN = "dien_nang"

PANEL_PATH = "dien-nang"
PANEL_TITLE = "Điện năng"
PANEL_ICON = "mdi:transmission-tower"

# Mặc định ngày chốt số của điện lực (có thể đổi theo từng đồng hồ trong Cài đặt)
DEFAULT_BILLING_DAY = 26

MAX_LOG = 300  # số dòng nhật ký cảnh báo lưu tối đa (Pha 2)
