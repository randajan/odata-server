import"../../chunk-OUWZ2PU5.js";import{ObjectId as d}from"mongodb";import n from"@randajan/jet-core";var{solid:u}=n.prop,r=class{constructor(t){u(this,"connect",t,!1)}optValidator(t,i,e,o){return o==="_id"?d(t):t}optValidate(t){return n.map(t,this.optValidator.bind(this),!0)}async getDB(t){return(await this.connect(t)).db(t.model.namespace)}async getCollection(t){return(await this.getDB(t)).collection(t.params.entity)}async remove(t){let i=await t.fetchOptions(),{$filter:e}=this.optValidate({$filter:i.$filter});return(await(await this.getCollection(t)).deleteOne(e)).deletedCount}async update(t){let i=await t.fetchOptions(),{$filter:e}=this.optValidate({$filter:i.$filter});return(await(await this.getCollection(t)).updateOne(e,{$set:await t.pullRequestBody({})})).matchedCount}async insert(t){let{primaryKey:i}=await t.fetchEntity(),e=await t.pullRequestBody({});i!=="_id"&&!e[i]&&(e[i]=n.uid(16));let o=await this.getCollection(t),a=await o.insertOne(e);return o.findOne({_id:a.insertedId})}async query(t){let i=await t.fetchOptions(),{$select:e,$sort:o,$skip:a,$limit:c,$filter:p}=this.optValidate(i),s=(await this.getCollection(t)).find(p,{projection:e||{}});return o&&(s=s.sort(o)),a&&(s=s.skip(a)),c&&(s=s.limit(c)),s.toArray()}async count(t){return(await this.query(t)).length}},m=l=>new r(l);export{r as MongoAdapter,m as default};
//# sourceMappingURL=Mongo.js.map
