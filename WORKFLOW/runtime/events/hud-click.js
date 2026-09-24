function handleHudClick(data) {
  if (data.selectModule) { selectedModule = data.selectModule; selectedOverlayId = null; renderPrototype(); return true; }
  if (data.overlayId) { selectedOverlayId = data.overlayId; renderPrototype(); return true; }
  if (data.overlayPalette) { createOverlay(data.overlayPalette); return true; }
  if (data.removeOverlay) { episode.overlays = episode.overlays.filter(item => item.id !== data.removeOverlay); selectedOverlayId = null; renderPrototype(); return true; }
  if (data.setRail) { setPoint('leftRail', data.setRail); renderPrototype(); return true; }
  if (data.railOpen) { if (current === 'configure_hud') templatePreviewState = 'Open'; else setPoint('leftRail','Open'); renderPrototype(); return true; }
  if (data.previewRail) { templatePreviewState = data.previewRail; renderPrototype(); return true; }
  if (data.componentState) { componentPreviewState = data.componentState; renderPrototype(); return true; }
  if (data.previewHide) { previewHidden.has(data.previewHide) ? previewHidden.delete(data.previewHide) : previewHidden.add(data.previewHide); renderPrototype(); return true; }
  if (data.moveModule) { moveModule(data.moveModule, Number(data.direction)); return true; }
  return false;
}
