export default async context=> {
  const { responder } = context;

  await context.fetchEntity();

  const rawBody = await context.fetchResponseBodyRaw();
  if (!rawBody) { throw {code:404, msg:"Not found"}; }

  return responder.setBody(204);
  
};