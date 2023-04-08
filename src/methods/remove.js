export const remove = async (req, res) => {
  const { ods, params, url } = req.odata;
  const { resolver } = vault.get(ods.uid);

  const query = {
    _id: req.params.id.replace(/\"/g, '').replace(/'/g, '')
  }

  await resolver("remove", req);

  res.statusCode = 204;
  
};