function handleAssetsClick(data) {
  if (data.assetsTab) { assetsTab = data.assetsTab; assetSearch = ''; renderPrototype(); return true; }
  if (data.mediaId) { selectedMediaId = data.mediaId; renderPrototype(); return true; }
  if (data.recordId) { selectedRecordId = data.recordId; renderPrototype(); return true; }
  if (data.componentId) { selectedComponent = data.componentId; componentPreviewState = null; renderPrototype(); return true; }
  if (data.dataFilter) { dataFilter = data.dataFilter; renderPrototype(); return true; }
  if (data.addRecord) {
    const item = {id:'record_'+Date.now(),type:'Gear',name:'New record',note:'',mediaId:'',archived:false};
    records.push(item); selectedRecordId = item.id; renderPrototype(); persistProject('Data library'); return true;
  }
  if (data.recordAction) {
    const item = recordById(selectedRecordId); if (!item) return true;
    if (data.recordAction === 'delete' && !recordUsage(item.id).length) {
      records.splice(records.indexOf(item),1); selectedRecordId = records[0]?.id || null;
    } else if (data.recordAction === 'archive') item.archived = true;
    else if (data.recordAction === 'restore') item.archived = false;
    renderPrototype(); persistProject('Data library'); return true;
  }
  if (data.openComponent) { selectedComponent = data.openComponent; componentPreviewState = null; assetsTab = 'components'; openScreen('assets'); return true; }
  if (data.configureComponent) { selectedModule = data.configureComponent; openScreen('configure_hud'); return true; }
  return false;
}
