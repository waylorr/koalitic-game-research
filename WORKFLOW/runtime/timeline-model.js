function trackValue(points, time, fallback) {
  if (!points?.length) return fallback;
  const sorted = [...points].sort((a,b) => a.t - b.t);
  if (time < sorted[0].t) return fallback;
  if (time === sorted[0].t) return sorted[0].v;
  for (let i = 1; i < sorted.length; i++) {
    if (time <= sorted[i].t) {
      const a = sorted[i-1], b = sorted[i];
      return typeof a.v === 'number' && typeof b.v === 'number'
        ? a.v + (b.v - a.v) * (time - a.t) / (b.t - a.t) : a.v;
    }
  }
  return sorted.at(-1).v;
}
function setPoint(key, value) {
  const points = episode.tracks[key] ??= [];
  const existing = points.find(point => point.t === playhead);
  if (existing) existing.v = value;
  else points.push({ t: playhead, v: value });
  points.sort((a,b) => a.t-b.t);
}
function timelineValue(property) {
  const fallback = property.key === 'leftRail' ? 'Open' : property.key === 'stamina' ? 100 : property.key === 'gearSelection' ? 1 : property.key === 'xp' ? playerForEpisode()?.defaultXp ?? 0 : episode.bindings.location;
  return trackValue(episode.tracks[property.key], playhead, fallback);
}
function timelineProperty(key) {
  return [...Object.values(DATA.timeline_zone_properties).flat(),...componentNames.flatMap(name => components[name].timeline_properties || [])].find(property => property.key === key);
}
function setTimelineValue(property, raw) {
  let value = raw;
  if (property.kind === 'number') value = Math.min(property.max ?? Infinity,Math.max(property.min ?? 0,Number(raw)));
  else if (property.kind === 'sector') value = Number(raw);
  else if (property.kind === 'location') { const chosen = recordById(raw); value = chosen ? clone(chosen) : null; if (playhead === 0) episode.bindings.location = value; }
  setPoint(property.key,value);
}
function setEpisodeBinding(key,id) {
  const chosen = recordById(id), snapshot = chosen ? clone(chosen) : null;
  if (key === 'player') {
    episode.bindings.player = snapshot;
    if (snapshot) episode.tracks.xp = [{t:0,v:snapshot.defaultXp ?? 0}];
  } else if (key.startsWith('gear:')) episode.bindings.gear[Number(key.split(':')[1])] = snapshot;
}
function overlayPosition(item, time) {
  const points = [...item.positions].sort((a,b) => a.t-b.t);
  if (time <= points[0].t) return points[0];
  for (let i = 1; i < points.length; i++) {
    if (time <= points[i].t) {
      const a = points[i-1], b = points[i], ratio = (time-a.t)/(b.t-a.t);
      return {x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio};
    }
  }
  return points.at(-1);
}
function setOverlayPosition(item, x, y) {
  const position = {t:playhead,x:Math.max(0,Math.min(100,x)),y:Math.max(0,Math.min(100,y))};
  const index = item.positions.findIndex(point => point.t === playhead);
  if (index >= 0) item.positions[index] = position; else item.positions.push(position);
  item.positions.sort((a,b) => a.t-b.t);
}
function timeLabel(time) { const sec = Math.round(time); return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0'); }
