import jet from "@randajan/jet-core";

import builder from 'xmlbuilder';
import { unwrap } from "../../tools";

const mapProps = async (props, entity, filter)=>{
  const r = [];
  for (const name in props) {
    const { key, type, nullable } = props[name];
    if (!key && entity && !await filter(entity, name)) { continue; }
    r.push({ '@Name': name, '@Type': type, '@Nullable':nullable });
  }
  return r;
}

export default async (context, res) => {

  const { model } = context;
  const namespace = model.namespace;

  const entityTypes = [];
  const entitySets = [];
  const complexTypes = [];

  for (const name in model.entitySets) {
    if (!await context.filter(name)) { continue; }

    const { entityType, primaryKey, props } = model.entitySets[name];

    entityTypes.push({
      '@Name': unwrap(entityType, namespace+"."),
      Property:await mapProps(props, name, context.filter),
      Key:primaryKey ? { PropertyRef: { '@Name': primaryKey } } : undefined
    });

    entitySets.push({
      '@EntityType': entityType,
      '@Name': name
    });

  }

  for (const name in model.complexTypes) {
    const { props } = model.complexTypes[name];
    complexTypes.push({ '@Name': name, Property:await mapProps(props)});
  }

  const metadata = {
    'edmx:Edmx': {
      '@xmlns:edmx': 'http://docs.oasis-open.org/odata/ns/edmx',
      '@Version': '4.0',
      'edmx:DataServices': {
        Schema: {
          '@xmlns': 'http://docs.oasis-open.org/odata/ns/edm',
          '@Namespace': model.namespace,
          EntityType: entityTypes,
          EntityContainer: {
            '@Name': 'Context',
            EntitySet: entitySets
          },
          ComplexType:complexTypes.length ? complexTypes : undefined
        }
      }
    }
  }

  const out = builder.create(metadata).end({ pretty: true });

  res.setHeader('Content-Type', 'application/xml');
  res.statusCode = 200;
  res.end(out);

}