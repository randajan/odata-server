export default async (req, res) => {
    const { model, url } = req.context.server;

    const collections = [];
  
    for (const key in model.entitySets) {
      collections.push({
        kind: 'EntitySet',
        name: key,
        url: key,
      });
    }
  
    const out = {
      '@odata.context': `${url}/$metadata`,
      value: collections,
    }

    res.setHeader('Content-Type', 'application/json');
    res.stateCode = 200;
    res.end(JSON.stringify(out));
}