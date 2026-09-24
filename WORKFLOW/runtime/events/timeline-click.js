function handleTimelineClick(data) {
  if (data.timelineToggle) { timelineOpen.has(data.timelineToggle) ? timelineOpen.delete(data.timelineToggle) : timelineOpen.add(data.timelineToggle); renderPrototype(); return true; }
  if (data.gotoKeyframe !== undefined) { playhead = Number(data.gotoKeyframe); renderPrototype(); return true; }
  if (data.addKeyframe) { const property = timelineProperty(data.addKeyframe); if (property) setTimelineValue(property, property.kind === 'location' ? timelineValue(property)?.id || '' : timelineValue(property)); renderPrototype(); return true; }
  if (data.deleteKeyframe) { const points = episode.tracks[data.deleteKeyframe]; if (points?.length > 1) episode.tracks[data.deleteKeyframe] = points.filter(point => point.t !== playhead); renderPrototype(); return true; }
  return false;
}
