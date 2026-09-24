function renderGearRadial(state, label) {
  const sectors = Array.from({length:5},(_,i) => `<i class="${state.selectedGear === i+1 ? 'active' : ''}" title="${escapeHtml(state.gear[i]?.name || 'Empty slot')}">${state.gear[i] ? '◈' : '·'}</i>`).join('');
  return `${label}<div class="gear-wheel">${sectors}</div><small>${escapeHtml(state.gear[state.selectedGear-1]?.name || 'No gear selected')}</small>`;
}
