export default async (context, res) => {
  await context.fetchEntity();
  
  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) { throw {code:404, msg:"Not found"}; }

  res.statusCode = 204;
  res.end();
};