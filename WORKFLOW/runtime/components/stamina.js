function renderStamina(state, label) {
  return `${label} <strong>${state.stamina}%</strong><span class="hud-valuebar"><i style="width:${Math.max(0,Math.min(100,state.stamina))}%"></i></span>`;
}
