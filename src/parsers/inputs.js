import jet from "@randajan/jet-core";

export const _fetchBody = async req => {
    if (req.body) { return req.body; }

    return new Promise((res, rej) => {
        let body = "";
        req.on('data', data => {
            if ((body += data).length > 1e6) { rej({ code: 400, msg: "Request is too long" }); }
        });
        req.on('end', _ => {
            try { res(JSON.parse(body)); }
            catch(e) { rej({ code:400, msg:e.message }); }
        });
    });
}