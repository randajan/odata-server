export default async context => {
    const { responder, model, gw:{ url } } = context;

    const collections = [];
  
    for (const name in model.entitySets) {
      if (!(await context.filter(name))) { continue; }
      collections.push({
        kind: "EntitySet",
        name,
        url: name,
      });
    }
  
    const out = {
      "@odata.context": `${url}/$metadata`,
      value: collections,
    }

    responder.setHeader("Content-Type", "application/json");
    return responder.setBody(200, JSON.stringify(out));

}