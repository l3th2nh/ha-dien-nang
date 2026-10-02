/*
 * Điện năng — panel báo cáo tiêu thụ điện + NLMT (Pha 1).
 * - Tổng quan: thẻ từng đồng hồ (hôm nay kWh, W/V/A, on/off) + dải tóm tắt (nhà / lưới / NLMT).
 * - Chi tiết đồng hồ: Ngày/Tháng/Năm + Chu kỳ chốt số + Tùy chọn (từ→đến) với chart cột (kiểu Tuya).
 * - Cài đặt: khai báo đồng hồ (energy/power/V/A/switch, vai trò, ngày chốt số), sensor NLMT.
 * Báo cáo query thống kê dài hạn của HA: hass.callWS(recorder/statistics_during_period) — không cần helper.
 * Giao diện dùng biến theme của HA -> tự hợp sáng/tối.
 */
const STYLE = `
<style>
:host{
  --dn-bg: var(--primary-background-color, #f5f6f8);
  --dn-card: var(--card-background-color, #fff);
  --dn-text: var(--primary-text-color, #1a1a1a);
  --dn-muted: var(--secondary-text-color, #6b7280);
  --dn-line: var(--divider-color, rgba(0,0,0,.1));
  --dn-accent: var(--primary-color, #2fb87a);
  --dn-radius: 16px;
  --dn-font: var(--paper-font-body1_-_font-family, system-ui,-apple-system,Segoe UI,Roboto,sans-serif);
  --dn-mono: ui-monospace,Menlo,Consolas,monospace;
  --c-grid:#3b82f6; --c-total:#f59e0b; --c-pv:#2fb87a; --c-other:#a855f7;
  display:block;min-height:100vh;background:var(--dn-bg);color:var(--dn-text);font-family:var(--dn-font);
}
*{box-sizing:border-box}
.wrap{max-width:980px;margin:0 auto;padding:14px 14px 90px}
.top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.menu{width:42px;height:42px;border-radius:12px;flex:none;background:var(--dn-card);border:1px solid var(--dn-line);
  color:var(--dn-muted);font-size:20px;display:grid;place-items:center;cursor:pointer}
h1{font-weight:700;font-size:20px;margin:0;letter-spacing:-.02em}
.sub{font-size:12px;color:var(--dn-muted)}
.spacer{flex:1}
.iconbtn{width:40px;height:40px;border-radius:12px;background:var(--dn-card);border:1px solid var(--dn-line);
  color:var(--dn-muted);cursor:pointer;display:grid;place-items:center;font-size:17px}
.iconbtn:hover{color:var(--dn-text);border-color:var(--dn-accent)}
/* dải tóm tắt */
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.sumcard{background:var(--dn-card);border:1px solid var(--dn-line);border-radius:14px;padding:13px 15px}
.sumcard .lbl{font-size:12px;color:var(--dn-muted);display:flex;align-items:center;gap:6px}
.sumcard .dot{width:9px;height:9px;border-radius:50%;flex:none}
.sumcard .val{font-size:23px;font-weight:700;margin-top:4px;line-height:1.1}
.sumcard .val small{font-size:13px;font-weight:500;color:var(--dn-muted)}
.sumcard .note{font-size:11.5px;color:var(--dn-muted);margin-top:2px}
/* lưới thẻ đồng hồ */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{background:var(--dn-card);border:1px solid var(--dn-line);border-radius:var(--dn-radius);padding:15px;cursor:pointer;
  transition:border-color .15s,transform .05s}
.card:hover{border-color:var(--dn-accent)}
.card:active{transform:scale(.995)}
.card .chead{display:flex;align-items:center;gap:10px}
.card .cdot{width:10px;height:10px;border-radius:50%;flex:none}
.card .cname{font-weight:600;font-size:15px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pill{font-size:10.5px;padding:2px 8px;border-radius:999px;background:var(--dn-bg);color:var(--dn-muted);border:1px solid var(--dn-line);flex:none}
.card .today{font-size:27px;font-weight:700;margin:10px 0 2px;line-height:1}
.card .today small{font-size:13px;font-weight:500;color:var(--dn-muted)}
.card .todaylbl{font-size:11.5px;color:var(--dn-muted)}
.rt{display:flex;gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid var(--dn-line)}
.rt .rtitem{font-size:12px;color:var(--dn-muted)}
.rt .rtitem b{display:block;color:var(--dn-text);font-size:14px;font-weight:600;font-family:var(--dn-mono)}
.sw{margin-left:auto;display:flex;align-items:center;gap:6px}
.toggle{width:42px;height:24px;border-radius:999px;background:var(--dn-line);position:relative;cursor:pointer;flex:none;transition:background .15s}
.toggle.on{background:var(--dn-accent)}
.toggle::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.toggle.on::after{left:20px}
/* chi tiết */
.back{display:inline-flex;align-items:center;gap:6px;color:var(--dn-muted);cursor:pointer;font-size:14px;background:none;border:none;font-family:inherit;padding:0}
.back:hover{color:var(--dn-text)}
.tabs{display:inline-flex;background:var(--dn-card);border:1px solid var(--dn-line);border-radius:12px;padding:4px;gap:2px;flex-wrap:wrap}
.tab{padding:8px 16px;border-radius:9px;font-size:13.5px;cursor:pointer;color:var(--dn-muted);border:none;background:none;font-family:inherit;font-weight:500}
.tab.active{background:var(--dn-accent);color:#fff}
.rangebar{display:flex;align-items:center;gap:10px;margin:14px 0;flex-wrap:wrap}
.navbtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--dn-line);background:var(--dn-card);cursor:pointer;color:var(--dn-text);font-size:15px}
.navbtn:disabled{opacity:.35;cursor:default}
.rangelabel{font-weight:600;font-size:15px;min-width:120px;text-align:center}
.bignum{font-size:34px;font-weight:700;line-height:1;margin:4px 0}
.bignum small{font-size:15px;font-weight:500;color:var(--dn-muted)}
.bignote{font-size:12.5px;color:var(--dn-muted);margin-bottom:10px}
.datepick{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.datepick input{background:var(--dn-card);border:1px solid var(--dn-line);border-radius:9px;padding:7px 10px;color:var(--dn-text);font-family:inherit;font-size:13px}
.datepick span{color:var(--dn-muted);font-size:13px}
.panel-box{background:var(--dn-card);border:1px solid var(--dn-line);border-radius:var(--dn-radius);padding:16px;margin-bottom:12px}
/* chart */
.chartwrap{position:relative;width:100%}
svg.chart{width:100%;height:280px;display:block;overflow:visible}
.chart .grid-line{stroke:var(--dn-line);stroke-width:1}
.chart .grid-text,.chart .x-text{fill:var(--dn-muted);font-size:10px;font-family:var(--dn-mono)}
.chart .bar{transition:opacity .1s}
.chart .bar:hover{opacity:.75}
.tip{position:absolute;pointer-events:none;background:var(--dn-text);color:var(--dn-card);font-size:12px;
  padding:6px 9px;border-radius:8px;transform:translate(-50%,-115%);white-space:nowrap;opacity:0;transition:opacity .08s;z-index:5;font-family:var(--dn-mono)}
.tip b{font-family:var(--dn-font)}
.empty{text-align:center;padding:56px 20px;color:var(--dn-muted)}
.empty .big{font-size:44px;opacity:.5}
.empty h3{color:var(--dn-text);margin:12px 0 6px;font-size:17px}
.btn{display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:11px;font-size:14px;font-weight:600;
  cursor:pointer;border:1px solid var(--dn-line);background:var(--dn-card);color:var(--dn-text);font-family:inherit}
.btn.primary{background:var(--dn-accent);color:#fff;border-color:transparent}
.btn:hover{filter:brightness(1.05)}
/* cài đặt */
.setrow{background:var(--dn-card);border:1px solid var(--dn-line);border-radius:14px;padding:14px;margin-bottom:10px}
.setrow .srhead{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.setrow .srhead b{flex:1}
.field{display:flex;flex-direction:column;gap:4px;margin-bottom:9px}
.field label{font-size:12px;color:var(--dn-muted)}
.field select,.field input{background:var(--dn-bg);border:1px solid var(--dn-line);border-radius:9px;padding:9px 10px;color:var(--dn-text);font-family:inherit;font-size:13.5px;width:100%}
.fieldrow{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.linkbtn{background:none;border:none;color:var(--dn-accent);cursor:pointer;font-size:13px;font-family:inherit;padding:0}
.linkbtn.danger{color:#ef4444}
@media(max-width:620px){.summary{grid-template-columns:1fr}.fieldrow{grid-template-columns:1fr}}
</style>`;

const SVG = {
  bolt: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>`,
};

const ROLES = { grid: "Mua lưới", total: "Tiêu thụ nhà", pv: "NLMT", other: "Khác" };
const ROLE_COLOR = { grid: "var(--c-grid)", total: "var(--c-total)", pv: "var(--c-pv)", other: "var(--c-other)" };

class DienNangPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._built) return;
    if (!this._ready) this._init();
    else this._paintRealtime();
  }
  set narrow(_n) {}
  set route(_r) {}
  set panel(_p) {}

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.view = "overview";
    this.cfg = { meters: [], pv_energy: null, default_billing_day: 26 };
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = STYLE + `<div id="root"></div><div class="tip" id="tip"></div>`;
    if (this._hass) this._init();
  }
  disconnectedCallback() {
    if (this._rt) clearInterval(this._rt);
  }
  $(s) { return this.shadowRoot.querySelector(s); }

  async _init() {
    this._ready = true;
    await this._loadConfig();
    this._render();
    if (this._rt) clearInterval(this._rt);
    this._rt = setInterval(() => this._paintRealtime(), 5000);
  }

  async _loadConfig() {
    try {
      const r = await this._hass.connection.sendMessagePromise({ type: "dien_nang/get_config" });
      this.cfg = { meters: [], pv_energy: null, default_billing_day: 26, ...(r || {}) };
    } catch (e) { /* giữ mặc định */ }
  }
  async _saveConfig() {
    try {
      await this._hass.connection.sendMessagePromise({ type: "dien_nang/save_config", config: this.cfg });
    } catch (e) {}
  }

  // ---------- helpers ----------
  _st(entity) {
    if (!entity || !this._hass) return null;
    const s = this._hass.states[entity];
    if (!s || ["unknown", "unavailable", ""].includes(s.state)) return null;
    return s;
  }
  _num(entity) {
    const s = this._st(entity);
    if (!s) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }
  _fmt(v, dec = 1) {
    if (v == null) return "–";
    return v.toLocaleString("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  _grid() { return (this.cfg.meters || []).filter((m) => m.role === "grid"); }
  _totalMeter() { return (this.cfg.meters || []).find((m) => m.role === "total"); }

  // Danh sách entity ứng viên theo loại (quét hass.states)
  _candidates(kind) {
    const out = [];
    const S = this._hass.states;
    for (const id in S) {
      const a = S[id].attributes || {};
      const u = (a.unit_of_measurement || "").toLowerCase();
      const dc = a.device_class;
      const dom = id.split(".")[0];
      let ok = false;
      if (kind === "energy") ok = dom === "sensor" && (u === "kwh" || u === "wh" || dc === "energy");
      else if (kind === "power") ok = dom === "sensor" && (u === "w" || u === "kw" || dc === "power");
      else if (kind === "voltage") ok = dom === "sensor" && (u === "v" || dc === "voltage");
      else if (kind === "current") ok = dom === "sensor" && (u === "a" || dc === "current");
      else if (kind === "switch") ok = dom === "switch";
      if (ok) out.push({ id, name: a.friendly_name || id });
    }
    out.sort((x, y) => x.name.localeCompare(y.name));
    return out;
  }
  // Gợi ý "anh em" cùng thiết bị theo tiền tố entity_id
  _suggestSiblings(energyId) {
    const base = energyId.replace(/^sensor\./, "").replace(/_(total_energy|energy|total_ele)$/i, "");
    const pick = (kind, domain) => {
      const c = this._candidates(kind).filter((x) => x.id.includes(base) || x.id.replace(/^\w+\./, "").startsWith(base));
      return c.length ? c[0].id : null;
    };
    return {
      power: pick("power"), voltage: pick("voltage"), current: pick("current"),
      switch: (this._candidates("switch").find((x) => x.id.includes(base)) || {}).id || null,
    };
  }

  // ---------- date ranges ----------
  _dayRange(d) { const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const e = new Date(s); e.setDate(e.getDate() + 1); return [s, e]; }
  _monthRange(d) { const s = new Date(d.getFullYear(), d.getMonth(), 1); const e = new Date(d.getFullYear(), d.getMonth() + 1, 1); return [s, e]; }
  _yearRange(d) { return [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear() + 1, 0, 1)]; }
  _cycleRange(billingDay, ref) {
    const d = new Date(ref); const day = d.getDate();
    let s;
    if (day >= billingDay) s = new Date(d.getFullYear(), d.getMonth(), billingDay);
    else s = new Date(d.getFullYear(), d.getMonth() - 1, billingDay);
    const e = new Date(s); e.setMonth(e.getMonth() + 1);
    return [s, e];
  }

  async _stats(statId, start, end, period) {
    if (!statId) return [];
    try {
      const r = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(), end_time: end.toISOString(),
        statistic_ids: [statId], period, types: ["change", "sum"],
      });
      const arr = (r && r[statId]) || [];
      return arr.map((x, i) => {
        let v = x.change;
        if (v == null && x.sum != null && i > 0 && arr[i - 1].sum != null) v = x.sum - arr[i - 1].sum;
        return { t: new Date(x.start), value: typeof v === "number" ? v : 0 };
      });
    } catch (e) { return []; }
  }

  // ---------- render router ----------
  _render() {
    if (this.view === "settings") return this._renderSettings();
    if (this.view === "meter") return this._renderMeter();
    return this._renderOverview();
  }
  _header(title, sub, opts = {}) {
    return `<div class="top">
      <button class="menu" id="menu" title="Menu">&#9776;</button>
      <div><h1>${title}</h1><span class="sub">${sub}</span></div>
      <div class="spacer"></div>
      ${opts.settings ? `<button class="iconbtn" id="gear" title="Cài đặt">⚙</button>` : ""}
      ${opts.refresh ? `<button class="iconbtn" id="refresh" title="Làm mới">↻</button>` : ""}
    </div>`;
  }
  _wireHeader() {
    const m = this.$("#menu");
    if (m) m.onclick = () => this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    const g = this.$("#gear"); if (g) g.onclick = () => { this.view = "settings"; this._render(); };
    const r = this.$("#refresh"); if (r) r.onclick = () => this._render();
  }

  // ---------- OVERVIEW ----------
  _renderOverview() {
    const root = this.$("#root");
    const meters = (this.cfg.meters || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!meters.length) {
      root.innerHTML = this._header("⚡ Điện năng", "Báo cáo tiêu thụ điện", { settings: true }) +
        `<div class="empty"><div class="big">⚡</div><h3>Chưa cấu hình đồng hồ nào</h3>
         <p>Vào Cài đặt để chọn các đồng hồ điện (điện lực, Hải Vân, tổng…) và vai trò của chúng.</p>
         <button class="btn primary" id="toSettings">⚙ Mở Cài đặt</button></div>`;
      this._wireHeader();
      this.$("#toSettings").onclick = () => { this.view = "settings"; this._render(); };
      return;
    }
    const cards = meters.map((m) => {
      const color = ROLE_COLOR[m.role] || m.color || "var(--dn-accent)";
      return `<div class="card" data-meter="${m.id}">
        <div class="chead">
          <span class="cdot" style="background:${color}"></span>
          <span class="cname">${m.name}</span>
          <span class="pill">${ROLES[m.role] || "Khác"}</span>
        </div>
        <div class="today" data-today="${m.id}">– <small>kWh</small></div>
        <div class="todaylbl">Hôm nay</div>
        <div class="rt">
          <div class="rtitem">Công suất<b data-w="${m.id}">–</b></div>
          <div class="rtitem">Điện áp<b data-v="${m.id}">–</b></div>
          <div class="rtitem">Dòng<b data-a="${m.id}">–</b></div>
          ${m.switch ? `<div class="sw"><span class="toggle" data-sw="${m.id}"></span></div>` : ""}
        </div>
      </div>`;
    }).join("");
    root.innerHTML = this._header("⚡ Điện năng", `${meters.length} đồng hồ`, { settings: true, refresh: true }) +
      `<div class="summary" id="summary"></div><div class="grid">${cards}</div>`;
    this._wireHeader();
    // click thẻ -> chi tiết
    root.querySelectorAll(".card[data-meter]").forEach((el) => {
      el.onclick = (e) => {
        if (e.target.closest("[data-sw]")) return;
        this.meterId = el.getAttribute("data-meter"); this.view = "meter"; this.range = "day"; this.refDate = new Date(); this._render();
      };
    });
    root.querySelectorAll("[data-sw]").forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); const id = el.getAttribute("data-sw"); const m = meters.find((x) => x.id === id); if (m && m.switch) this._hass.callService("switch", "toggle", { entity_id: m.switch }); };
    });
    this._paintRealtime();
    this._paintOverviewTotals();
  }

  _paintRealtime() {
    if (this.view !== "overview") return;
    const meters = this.cfg.meters || [];
    meters.forEach((m) => {
      const w = this.$(`[data-w="${m.id}"]`); if (w) { const v = this._num(m.power); w.textContent = v == null ? "–" : `${this._fmt(v, 0)} W`; }
      const v = this.$(`[data-v="${m.id}"]`); if (v) { const x = this._num(m.voltage); v.textContent = x == null ? "–" : `${this._fmt(x, 1)} V`; }
      const a = this.$(`[data-a="${m.id}"]`); if (a) { const x = this._num(m.current); a.textContent = x == null ? "–" : `${this._fmt(x, 2)} A`; }
      const sw = this.$(`[data-sw="${m.id}"]`); if (sw && m.switch) { const s = this._st(m.switch); sw.classList.toggle("on", !!s && s.state === "on"); }
    });
  }

  async _paintOverviewTotals() {
    const [s, e] = this._dayRange(new Date());
    const sumOf = async (statId) => (await this._stats(statId, s, e, "hour")).reduce((a, b) => a + b.value, 0);
    // today per meter
    for (const m of this.cfg.meters || []) {
      const el = this.$(`[data-today="${m.id}"]`);
      if (!el) continue;
      const v = await sumOf(m.energy);
      el.innerHTML = `${this._fmt(v, 1)} <small>kWh</small>`;
    }
    // summary strip: nhà / lưới / NLMT
    const total = this._totalMeter();
    const house = total ? await sumOf(total.energy) : null;
    let grid = 0; let hasGrid = false;
    for (const g of this._grid()) { grid += await sumOf(g.energy); hasGrid = true; }
    let pv;
    if (this.cfg.pv_energy) pv = await sumOf(this.cfg.pv_energy);
    else if (house != null && hasGrid) pv = Math.max(0, house - grid);
    const sumEl = this.$("#summary");
    if (!sumEl) return;
    const card = (label, color, val, note) => `<div class="sumcard"><div class="lbl"><span class="dot" style="background:${color}"></span>${label}</div>
      <div class="val">${this._fmt(val, 1)} <small>kWh</small></div><div class="note">${note}</div></div>`;
    sumEl.innerHTML =
      card("Tiêu thụ nhà", "var(--c-total)", house, "Hôm nay (đồng hồ tổng)") +
      card("Mua từ lưới", "var(--c-grid)", hasGrid ? grid : null, "Điện lực + Hải Vân") +
      card(this.cfg.pv_energy ? "NLMT sản xuất" : "NLMT (ước tính)", "var(--c-pv)", pv, this.cfg.pv_energy ? "Hôm nay" : "Tổng − lưới");
  }

  // ---------- METER DETAIL ----------
  _renderMeter() {
    const m = (this.cfg.meters || []).find((x) => x.id === this.meterId);
    if (!m) { this.view = "overview"; return this._render(); }
    const root = this.$("#root");
    const billingDay = m.billing_day || this.cfg.default_billing_day || 26;
    const tabs = [["day", "Ngày"], ["month", "Tháng"], ["year", "Năm"], ["cycle", "Chu kỳ"], ["custom", "Tùy chọn"]];
    root.innerHTML = this._header(m.name, `${ROLES[m.role] || "Khác"} · chốt số ngày ${billingDay}`, {}) +
      `<button class="back" id="back">← Tổng quan</button>
       <div style="height:10px"></div>
       <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${this.range === k ? "active" : ""}" data-r="${k}">${l}</button>`).join("")}</div>
       <div id="rangearea"></div>
       <div class="panel-box"><div class="bignum" id="bignum">– <small>kWh</small></div><div class="bignote" id="bignote"></div>
         <div class="chartwrap"><svg class="chart" id="chart"></svg></div></div>
       <div class="panel-box"><div class="rt" style="border:none;padding:0;margin:0">
         <div class="rtitem">Công suất<b data-w="${m.id}">–</b></div>
         <div class="rtitem">Điện áp<b data-v="${m.id}">–</b></div>
         <div class="rtitem">Dòng<b data-a="${m.id}">–</b></div>
         ${m.switch ? `<div class="sw"><span style="font-size:12px;color:var(--dn-muted)">Bật/tắt</span><span class="toggle" data-sw="${m.id}"></span></div>` : ""}
       </div></div>`;
    this._wireHeader();
    this.$("#back").onclick = () => { this.view = "overview"; this._render(); };
    root.querySelectorAll(".tab[data-r]").forEach((t) => t.onclick = () => { this.range = t.getAttribute("data-r"); this.refDate = new Date(); this._drawMeter(); });
    const sw = this.$(`[data-sw="${m.id}"]`);
    if (sw && m.switch) sw.onclick = () => this._hass.callService("switch", "toggle", { entity_id: m.switch });
    // realtime row
    const paint = () => {
      const w = this.$(`[data-w="${m.id}"]`); if (w) { const v = this._num(m.power); w.textContent = v == null ? "–" : `${this._fmt(v, 0)} W`; }
      const v = this.$(`[data-v="${m.id}"]`); if (v) { const x = this._num(m.voltage); v.textContent = x == null ? "–" : `${this._fmt(x, 1)} V`; }
      const a = this.$(`[data-a="${m.id}"]`); if (a) { const x = this._num(m.current); a.textContent = x == null ? "–" : `${this._fmt(x, 2)} A`; }
      if (sw && m.switch) { const s = this._st(m.switch); sw.classList.toggle("on", !!s && s.state === "on"); }
    };
    this._paintRealtime = () => {}; // overview painter off trong view này
    paint();
    this._rtMeter && clearInterval(this._rtMeter);
    this._rtMeter = setInterval(paint, 5000);
    this._drawMeter();
  }

  async _drawMeter() {
    const m = (this.cfg.meters || []).find((x) => x.id === this.meterId);
    const area = this.$("#rangearea");
    const billingDay = m.billing_day || this.cfg.default_billing_day || 26;
    // active tab highlight
    this.shadowRoot.querySelectorAll(".tab[data-r]").forEach((t) => t.classList.toggle("active", t.getAttribute("data-r") === this.range));

    let start, end, period, xmode, label, note, canNext = true;
    const d = this.refDate || (this.refDate = new Date());
    if (this.range === "day") { [start, end] = this._dayRange(d); period = "hour"; xmode = "hour"; label = this._dLabel(d); note = "Theo giờ trong ngày"; }
    else if (this.range === "month") { [start, end] = this._monthRange(d); period = "day"; xmode = "day"; label = `Th${d.getMonth() + 1}/${d.getFullYear()}`; note = "Theo ngày trong tháng"; }
    else if (this.range === "year") { [start, end] = this._yearRange(d); period = "month"; xmode = "month"; label = `${d.getFullYear()}`; note = "Theo tháng trong năm"; }
    else if (this.range === "cycle") { [start, end] = this._cycleRange(billingDay, d); period = "day"; xmode = "day"; label = `${this._short(start)} – ${this._short(new Date(end - 86400000))}`; note = `Chu kỳ chốt số (ngày ${billingDay})`; }
    else { // custom
      if (!this._cFrom) { const [s] = this._monthRange(d); this._cFrom = s; this._cTo = end2(d); }
      function end2(x) { const e = new Date(x); e.setDate(e.getDate() + 1); return e; }
      start = this._cFrom; end = new Date(this._cTo); end.setDate(end.getDate() + 1); period = "day"; xmode = "day";
      label = `${this._short(start)} – ${this._short(this._cTo)}`; note = "Khoảng tùy chọn";
    }
    // nav/date UI
    if (this.range === "custom") {
      area.innerHTML = `<div class="rangebar"><div class="datepick">
        <span>Từ</span><input type="date" id="cfrom" value="${this._iso(start)}">
        <span>đến</span><input type="date" id="cto" value="${this._iso(this._cTo || new Date(end - 86400000))}">
      </div></div>`;
      this.$("#cfrom").onchange = (e) => { this._cFrom = new Date(e.target.value + "T00:00:00"); this._drawMeter(); };
      this.$("#cto").onchange = (e) => { this._cTo = new Date(e.target.value + "T00:00:00"); this._drawMeter(); };
    } else {
      canNext = end <= new Date() ? true : false;
      area.innerHTML = `<div class="rangebar">
        <button class="navbtn" id="prev">‹</button>
        <div class="rangelabel">${label}</div>
        <button class="navbtn" id="next" ${canNext ? "" : "disabled"}>›</button>
      </div>`;
      this.$("#prev").onclick = () => { this._shift(-1); };
      const nx = this.$("#next"); if (nx && canNext) nx.onclick = () => { this._shift(1); };
    }

    const data = await this._stats(m.energy, start, end, period);
    const total = data.reduce((a, b) => a + b.value, 0);
    this.$("#bignum").innerHTML = `${this._fmt(total, 2)} <small>kWh</small>`;
    this.$("#bignote").textContent = note + (this.range !== "custom" ? ` · ${label}` : "");
    const color = ROLE_COLOR[m.role] || m.color || "var(--dn-accent)";
    this._renderChart(this._bucketize(data, start, end, xmode), xmode, color);
  }

  _shift(dir) {
    const d = new Date(this.refDate);
    if (this.range === "day") d.setDate(d.getDate() + dir);
    else if (this.range === "month" || this.range === "cycle") d.setMonth(d.getMonth() + dir);
    else if (this.range === "year") d.setFullYear(d.getFullYear() + dir);
    this.refDate = d; this._drawMeter();
  }

  // Đổ dữ liệu thống kê vào đúng số cột (giờ/ngày/tháng), điền 0 cho bucket thiếu
  _bucketize(data, start, end, xmode) {
    const bars = [];
    if (xmode === "hour") {
      for (let h = 0; h < 24; h++) bars.push({ label: `${h}:00`, short: h, value: 0 });
      data.forEach((x) => { const h = x.t.getHours(); if (bars[h]) bars[h].value += x.value; });
    } else if (xmode === "day") {
      const days = Math.round((end - start) / 86400000);
      for (let i = 0; i < days; i++) { const dd = new Date(start); dd.setDate(dd.getDate() + i); bars.push({ label: this._short(dd), short: dd.getDate(), value: 0, date: dd }); }
      data.forEach((x) => { const i = Math.round((new Date(x.t.getFullYear(), x.t.getMonth(), x.t.getDate()) - start) / 86400000); if (bars[i]) bars[i].value += x.value; });
    } else { // month
      const names = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      for (let i = 0; i < 12; i++) bars.push({ label: names[i], short: names[i], value: 0 });
      data.forEach((x) => { const mo = x.t.getMonth(); if (bars[mo]) bars[mo].value += x.value; });
    }
    return bars;
  }

  _renderChart(bars, xmode, color) {
    const svg = this.$("#chart");
    const W = svg.clientWidth || 800, H = 280;
    const padL = 38, padR = 8, padT = 12, padB = 24;
    const cw = W - padL - padR, ch = H - padT - padB;
    const max = Math.max(1e-6, ...bars.map((b) => b.value));
    const nice = this._niceMax(max);
    const n = bars.length;
    const gap = n > 40 ? 1 : 2;
    const bw = Math.max(1, cw / n - gap);
    const y = (v) => padT + ch - (v / nice) * ch;
    // gridlines
    let g = "";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = (nice / steps) * i; const yy = y(val);
      g += `<line class="grid-line" x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}"/>`;
      g += `<text class="grid-text" x="${padL - 6}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${this._axisNum(val)}</text>`;
    }
    // bars (đầu bo tròn, neo đáy)
    let b = "";
    bars.forEach((bar, i) => {
      const x = padL + i * (cw / n);
      const yy = y(bar.value); const hgt = padT + ch - yy;
      const r = Math.min(4, bw / 2);
      if (bar.value > 0) {
        b += `<rect class="bar" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, hgt).toFixed(1)}" rx="${r}" fill="${color}" data-i="${i}"/>`;
      }
    });
    // x labels (thưa)
    let xl = "";
    const lblEvery = xmode === "hour" ? 6 : xmode === "month" ? 1 : Math.ceil(n / 7);
    bars.forEach((bar, i) => {
      if (i % lblEvery !== 0 && i !== n - 1) return;
      const x = padL + i * (cw / n) + bw / 2;
      xl += `<text class="x-text" x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle">${bar.short}</text>`;
    });
    svg.innerHTML = g + b + xl;
    // hover tooltip
    const tip = this.$("#tip");
    svg.querySelectorAll(".bar").forEach((rect) => {
      rect.addEventListener("mouseenter", () => {
        const i = +rect.getAttribute("data-i"); const bar = bars[i];
        tip.innerHTML = `<b>${bar.label}</b><br>${this._fmt(bar.value, 2)} kWh`;
        const r = rect.getBoundingClientRect(); const wr = this.$(".chartwrap").getBoundingClientRect();
        tip.style.left = (r.left - wr.left + r.width / 2) + "px";
        tip.style.top = (r.top - wr.top) + "px";
        tip.style.opacity = "1";
      });
      rect.addEventListener("mouseleave", () => { tip.style.opacity = "0"; });
    });
  }

  _niceMax(m) { const p = Math.pow(10, Math.floor(Math.log10(m))); const r = m / p; const n = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10; return n * p; }
  _axisNum(v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + "k" : (v % 1 ? v.toFixed(1) : v.toFixed(0)); }
  _dLabel(d) { return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
  _short(d) { return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; }
  _iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

  // ---------- SETTINGS ----------
  _renderSettings() {
    const root = this.$("#root");
    const meters = (this.cfg.meters || []);
    const eng = this._candidates("energy");
    const rows = meters.map((m, idx) => this._settingRow(m, idx, eng)).join("");
    root.innerHTML = this._header("⚙ Cài đặt Điện năng", "Khai báo đồng hồ & vai trò", {}) +
      `<button class="back" id="back">← Tổng quan</button><div style="height:12px"></div>
       <div class="panel-box">
         <div class="field"><label>Sensor sản lượng NLMT (tùy chọn — để trống sẽ ước tính = Tổng − Lưới)</label>
           <select id="pv"><option value="">— ước tính (Tổng − Lưới) —</option>${this._opts(eng, this.cfg.pv_energy)}</select></div>
         <div class="fieldrow">
           <div class="field"><label>Ngày chốt số mặc định (điện lực)</label><input type="number" id="dbday" min="1" max="28" value="${this.cfg.default_billing_day || 26}"></div>
         </div>
       </div>
       <div id="meters">${rows || `<div class="empty"><p>Chưa có đồng hồ. Bấm "Thêm đồng hồ".</p></div>`}</div>
       <button class="btn primary" id="addm">+ Thêm đồng hồ</button>
       <span style="display:inline-block;width:8px"></span>
       <button class="btn" id="save">Lưu</button>`;
    this._wireHeader();
    this.$("#back").onclick = () => { this.view = "overview"; this._render(); };
    this.$("#pv").onchange = (e) => { this.cfg.pv_energy = e.target.value || null; };
    this.$("#dbday").onchange = (e) => { this.cfg.default_billing_day = parseInt(e.target.value) || 26; };
    this.$("#addm").onclick = () => {
      this.cfg.meters.push({ id: "m" + Date.now(), name: "Đồng hồ mới", energy: "", power: "", voltage: "", current: "", switch: "", role: "grid", billing_day: null, order: this.cfg.meters.length });
      this._renderSettings();
    };
    this.$("#save").onclick = async () => { await this._saveConfig(); this.view = "overview"; this._render(); };
    this._wireSettingRows(eng);
  }
  _settingRow(m, idx, eng) {
    return `<div class="setrow" data-idx="${idx}">
      <div class="srhead"><span class="cdot" style="width:12px;height:12px;border-radius:3px;background:${ROLE_COLOR[m.role] || "var(--dn-accent)"}"></span>
        <b>${m.name || "(chưa đặt tên)"}</b>
        <button class="linkbtn danger" data-del="${idx}">Xóa</button></div>
      <div class="fieldrow">
        <div class="field"><label>Tên hiển thị</label><input data-f="name" value="${(m.name || "").replace(/"/g, "&quot;")}"></div>
        <div class="field"><label>Vai trò</label><select data-f="role">
          ${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${m.role === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Sensor năng lượng (kWh) *</label><select data-f="energy"><option value="">—</option>${this._opts(eng, m.energy)}</select></div>
      <div class="fieldrow">
        <div class="field"><label>Công suất (W)</label><select data-f="power"><option value="">—</option>${this._opts(this._candidates("power"), m.power)}</select></div>
        <div class="field"><label>Điện áp (V)</label><select data-f="voltage"><option value="">—</option>${this._opts(this._candidates("voltage"), m.voltage)}</select></div>
      </div>
      <div class="fieldrow">
        <div class="field"><label>Dòng (A)</label><select data-f="current"><option value="">—</option>${this._opts(this._candidates("current"), m.current)}</select></div>
        <div class="field"><label>Công tắc (on/off)</label><select data-f="switch"><option value="">—</option>${this._opts(this._candidates("switch"), m.switch)}</select></div>
      </div>
      <div class="fieldrow">
        <div class="field"><label>Ngày chốt số riêng (để trống = dùng mặc định)</label><input type="number" min="1" max="28" data-f="billing_day" value="${m.billing_day || ""}"></div>
      </div>
    </div>`;
  }
  _opts(list, sel) { return list.map((x) => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${x.name} — ${x.id}</option>`).join(""); }
  _wireSettingRows(eng) {
    this.shadowRoot.querySelectorAll(".setrow").forEach((row) => {
      const idx = +row.getAttribute("data-idx");
      row.querySelectorAll("[data-f]").forEach((inp) => {
        inp.onchange = (e) => {
          const f = inp.getAttribute("data-f"); let val = e.target.value;
          if (f === "billing_day") val = val ? parseInt(val) : null;
          this.cfg.meters[idx][f] = val;
          if (f === "energy" && val) { // tự gợi ý anh em
            const sib = this._suggestSiblings(val);
            ["power", "voltage", "current", "switch"].forEach((k) => { if (!this.cfg.meters[idx][k] && sib[k]) this.cfg.meters[idx][k] = sib[k]; });
            this._renderSettings();
          }
          if (f === "name" || f === "role") this._renderSettings();
        };
      });
      const del = row.querySelector(`[data-del="${idx}"]`);
      if (del) del.onclick = () => { this.cfg.meters.splice(idx, 1); this._renderSettings(); };
    });
  }
}

if (!customElements.get("dien-nang-panel")) customElements.define("dien-nang-panel", DienNangPanel);
console.info("%c ĐIỆN NĂNG %c panel v1 ", "background:#2fb87a;color:#05301f;border-radius:4px 0 0 4px;padding:2px 6px",
  "background:#145c3f;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
