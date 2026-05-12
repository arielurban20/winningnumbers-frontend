import fs from "node:fs";
const data = JSON.parse(fs.readFileSync(new URL("../lib/data/drawingSchedules.json", import.meta.url), "utf8"));
const entries = data.entries.filter((e)=>['va','nc','ga','fl','pa'].includes(e.state_slug) && ((e.family_key||'').includes('cash-pop') || (e.game_key||'').includes('cash-pop') || (e.game_name||'').toLowerCase().includes('cash pop')));
for (const e of entries) {
  console.log(e.state_slug, '|', e.game_name, '| session_label=', e.session_label, '| session_key=', e.session_key, '| draw_time=', e.draw_time, '| family_key=', e.family_key, '| game_key=', e.game_key);
}
