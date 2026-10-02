"""Điện năng — panel báo cáo tiêu thụ điện + NLMT (Pha 1).

- Đăng ký panel "Điện năng" ở sidebar.
- Lưu cấu hình (danh sách đồng hồ + vai trò + ngày chốt số...) vào .storage.
- Báo cáo Day/Month/Year/chu-kỳ/tùy-chọn: panel tự query thống kê dài hạn của HA
  (WS recorder/statistics_during_period) — không cần tạo helper.
- Pha 2 (sẽ thêm): rule engine cảnh báo ngưỡng/chu-kỳ + notify (tái dùng pattern inverter_bridge).
"""
import logging
import os

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, PANEL_PATH, PANEL_TITLE, PANEL_ICON, DEFAULT_BILLING_DAY

_LOGGER = logging.getLogger(__name__)

PANEL_URL = "/dien_nang/panel.js"
PANEL_VER = "1"  # tăng mỗi lần sửa panel để chống cache
PANEL_URL_V = f"{PANEL_URL}?v={PANEL_VER}"

DEFAULT_CONFIG = {
    "meters": [],              # [{id,name,energy,power,voltage,current,switch,role,billing_day,color,order}]
    "pv_energy": None,         # sensor sản lượng NLMT (tùy chọn)
    "default_billing_day": DEFAULT_BILLING_DAY,
    "rules": [],               # Pha 2
}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    panel_js = os.path.join(os.path.dirname(__file__), "panel.js")

    store = Store(hass, 1, DOMAIN)
    data = hass.data.setdefault(DOMAIN, {})
    data["store"] = store
    cfg = await store.async_load()
    data["config"] = {**DEFAULT_CONFIG, **(cfg or {})}

    # Phục vụ file JS của panel (1 lần / phiên HA)
    if not data.get("static_registered"):
        data["static_registered"] = True
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_URL, panel_js, False)]
        )

    # Panel sidebar
    if PANEL_PATH not in hass.data.get(frontend.DATA_PANELS, {}):
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_PATH,
            webcomponent_name="dien-nang-panel",
            module_url=PANEL_URL_V,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=False,
            config={},
        )

    # WebSocket (đăng ký 1 lần)
    if not data.get("ws_registered"):
        data["ws_registered"] = True
        websocket_api.async_register_command(hass, ws_get_config)
        websocket_api.async_register_command(hass, ws_save_config)

    _LOGGER.info("Điện năng: đã nạp panel + WebSocket (%d đồng hồ)", len(data["config"].get("meters", [])))
    return True


@websocket_api.websocket_command({vol.Required("type"): "dien_nang/get_config"})
@websocket_api.async_response
async def ws_get_config(hass: HomeAssistant, connection, msg) -> None:
    data = hass.data.get(DOMAIN, {})
    connection.send_result(msg["id"], data.get("config", DEFAULT_CONFIG))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "dien_nang/save_config",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_save_config(hass: HomeAssistant, connection, msg) -> None:
    data = hass.data.get(DOMAIN, {})
    cfg = {**DEFAULT_CONFIG, **(msg.get("config") or {})}
    data["config"] = cfg
    store: Store = data.get("store")
    if store:
        await store.async_save(cfg)
    connection.send_result(msg["id"], {"ok": True})


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if PANEL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_PATH)
    return True
