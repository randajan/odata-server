export default async (req, res, resolver) => {
  await resolver("remove", req.context);
};