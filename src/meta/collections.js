export const getCollections = ods=>{
  const collections = [];

  for (const key in ods.model.entitySets) {
    collections.push({
      kind: 'EntitySet',
      name: key,
      url: key,
    });
  }

  return JSON.stringify({
    '@odata.context': `${ods.url}/$metadata`,
    value: collections,
  });
}