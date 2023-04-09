export default (req, res) => {
    const { model, url } = req.context.server

    const collections = [];
  
    for (const key in model.entitySets) {
      collections.push({
        kind: 'EntitySet',
        name: key,
        url: key,
      });
    }
  
    return {
      '@odata.context': `${url}/$metadata`,
      value: collections,
    }

}