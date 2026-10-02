"""Config flow cho Điện năng — cài 1 lần, cấu hình chi tiết trong panel."""
from homeassistant import config_entries

from .const import DOMAIN


class DienNangConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Điện năng", data={})
        return self.async_show_form(step_id="user")
