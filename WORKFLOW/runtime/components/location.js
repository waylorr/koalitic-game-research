function renderLocation(state, label) { return `${label} · ${escapeHtml(state.location?.name || 'NO LOCATION')}`; }
