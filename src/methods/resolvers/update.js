const removeOdataType = (doc) => {
  if (doc instanceof Array) {
    for (const i in doc) {
      if (typeof doc[i] === 'object' && doc[i] !== null) {
        removeOdataType(doc[i]);
      }
    }
  }

  delete doc['@odata.type'];

  for (const prop in doc) {
    if (typeof doc[prop] === 'object' && doc[prop] !== null) {
      removeOdataType(doc[prop]);
    }
  }
};

const processBody = (body, {cfg}, req, res) => {
  removeOdataType(body);

  const query = {
    _id: req.params.id.replace(/\"/g, '').replace(/'/g, '')
  };

  const update = {
    $set: body
  };

  try {
    cfg.base64ToBuffer(req.params.collection, update.$set);
    cfg.executeUpdate(req.params.collection, query, update, req, (e, entity) => {
      if (e) {
        return res.odataError(e);
      }

      res.statusCode = 204;
      
    });
  } catch (e) {
    res.odataError(e);
  }
};

export default (server, req, res) => {
  if (req.body) {
    return processBody(req.body, server, req, res);
  }
  let body = '';
  req.on('data', (data) => {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    return processBody(JSON.parse(body), server, req, res);
  });
};
