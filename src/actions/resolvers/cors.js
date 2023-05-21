export default async context => {
    const { responder } = context;
    
    return responder.setBody(204);
};