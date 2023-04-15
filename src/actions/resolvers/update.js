export default async (context, res) => {
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) { throw {code:404, msg:"Not found"}; }
  res.stateCode = 204;
  res.end();
};