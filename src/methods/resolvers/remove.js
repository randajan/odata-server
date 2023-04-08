export default async (req, res) => {
  const { server, params, url } = req.odata;
  const { resolver } = vault.get(server.uid);

  const query = {
    _id: req.params.id.replace(/\"/g, '').replace(/'/g, '')
  }

  await resolver("remove", req);

  res.statusCode = 204;
  
};