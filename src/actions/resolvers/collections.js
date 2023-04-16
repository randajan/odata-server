export default async (context, res) => {
    const { model, int:{ url } } = context;

    const collections = [];
  
    for (const name in model.entitySets) {
      if (!(await context.filter(name))) { continue; }
      collections.push({
        kind: 'EntitySet',
        name,
        url: name,
      });
    }
  
    const out = {
      '@odata.context': `${url}/$metadata`,
      value: collections,
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(out));
}