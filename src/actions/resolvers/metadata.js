import { unwrap } from "../../tools";
import builder from 'xmlbuilder';

const mapProps = async (props, entity, filter)=>{
  const r = [];
  for (const name in props) {
    const { key, type, nullable } = props[name];
    if (!key && entity && !await filter(entity, name)) { continue; }
    r.push({ "@Name": name, "@Type": type, "@Nullable":nullable });
  }
  return r;
}

export default async context=> {

  const { model, responder } = context;
  const namespace = model.namespace;

  const entityTypes = [];
  const entitySets = [];
  const complexTypes = [];

  for (const name in model.entitySets) {
    if (!await context.filter(name)) { continue; }

    const { entityType, primaryKey, props } = model.entitySets[name];

    entityTypes.push({
      "@Name": unwrap(entityType, namespace+"."),
      Property:await mapProps(props, name, context.filter),
      Key:primaryKey ? { PropertyRef: { "@Name": primaryKey } } : undefined
    });

    entitySets.push({
      "@EntityType": entityType,
      "@Name": name
    });

  }

  for (const name in model.complexTypes) {
    const { props } = model.complexTypes[name];
    complexTypes.push({ "@Name": name, Property:await mapProps(props)});
  }

  const out = {
    "edmx:Edmx": {
      "@xmlns:edmx": "http://docs.oasis-open.org/odata/ns/edmx",
      "@Version": "4.0",
      "edmx:DataServices": {
        Schema: {
          "@xmlns": "http://docs.oasis-open.org/odata/ns/edm",
          "@Namespace": model.namespace,
          EntityType: entityTypes,
          EntityContainer: {
            "@Name": "Context",
            EntitySet: entitySets
          },
          ComplexType:complexTypes.length ? complexTypes : undefined
        }
      }
    }
  }

  responder.setHeader("Content-Type", "application/xml");
  return responder.setBody(200, builder.create(out).end({ pretty: true }));

}