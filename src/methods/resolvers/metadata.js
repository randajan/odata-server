
import builder from 'xmlbuilder';

export const buildMetadata = (model) => {
  const entityTypes = []
  for (const typeKey in model.entityTypes) {
    const entityType = {
      '@Name': typeKey,
      Property: []
    }

    for (const propKey in model.entityTypes[typeKey]) {
      const property = model.entityTypes[typeKey][propKey]
      const finalObject = { '@Name': propKey, '@Type': property.type }
      if (Object.prototype.hasOwnProperty.call(property, 'nullable')) {
        finalObject['@Nullable'] = property.nullable
      }
      entityType.Property.push(finalObject)

      if (property.key) {
        entityType.Key = {
          PropertyRef: {
            '@Name': propKey
          }
        }
      }
    }

    entityTypes.push(entityType)
  }

  const complexTypes = []
  for (const typeKey in model.complexTypes) {
    const complexType = {
      '@Name': typeKey,
      Property: []
    }

    for (const propKey in model.complexTypes[typeKey]) {
      const property = model.complexTypes[typeKey][propKey]

      complexType.Property.push({ '@Name': propKey, '@Type': property.type })
    }

    complexTypes.push(complexType)
  }

  const container = {
    '@Name': 'Context',
    EntitySet: []
  }

  for (const setKey in model.entitySets) {
    container.EntitySet.push({
      '@EntityType': model.entitySets[setKey].entityType,
      '@Name': setKey
    })
  }

  const returnObject = {
    'edmx:Edmx': {
      '@xmlns:edmx': 'http://docs.oasis-open.org/odata/ns/edmx',
      '@Version': '4.0',
      'edmx:DataServices': {
        Schema: {
          '@xmlns': 'http://docs.oasis-open.org/odata/ns/edm',
          '@Namespace': model.namespace,
          EntityType: entityTypes,
          EntityContainer: container
        }
      }
    }
  }

  if (complexTypes.length) {
    returnObject['edmx:Edmx']['edmx:DataServices'].Schema.ComplexType = complexTypes
  }

  return builder.create(returnObject).end({ pretty: true })
}

export default (req, res) => {
  console.log(req.context.server.model);
  const result = buildMetadata(req.context.server.model);

  res.setHeader('Content-Type', 'application/xml');

  return result;
}