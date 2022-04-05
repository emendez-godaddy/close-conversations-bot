const { Client } = require("@elastic/elasticsearch");
const config = require("config");
const elasticConfig = config.get("elastic");

class Elastic {
  client = new Client({
    cloud: {
      id: elasticConfig.cloudID,
    },
    auth: {
      username: elasticConfig.username,
      password: elasticConfig.password,
    },
  });

  async indexCreated(index) {
    return await this.client.exists({ index });
  }

  async isIndexCreated(index, id) {
    const exists = await this.client.indices.exists({
      index,
    });
    //console.log(exists); // true
    return exists;
  }

  async createIndex(indexName, body) {
    await this.client.indices.create(
      {
        index: indexName,
        body,
      },
      { ignore: [400] }
    );
  }

  getClientInfo() {
    this.client
      .info()
      .then((response) => console.log(response))
      .catch((error) => console.error(error));
  }
}

// const getClient = () => {
//   const client = new Client({
//     cloud: {
//       id: elasticConfig.cloudID,
//     },
//     auth: {
//       username: elasticConfig.username,
//       password: elasticConfig.password,
//     },
//   });
//   return client;
// };
//inserting in elastic

// async function run() {
//   await client.index({
//     index: "game-of-thrones",
//     body: {
//       character: "Eliezer Mendez",
//       quote: "keloke con keloke.",
//     },
//   });
//   await client.indices.refresh({ index: "game-of-thrones" });
// }

//reading from elastic
// async function read(client, index, size) {
//   const result = await client.search(
//     {
//       index,
//       size,
//     },
//     {
//       ignore: [404],
//       maxRetries: 3,
//     }
//   );
//   return result;
// }

//read();

// async function run() {
//   await client.indices.create(
//     {
//       index: "tweets",
//       body: {
//         mappings: {
//           properties: {
//             id: { type: "integer" },
//             text: { type: "text" },
//             user: { type: "keyword" },
//             time: { type: "date" },
//           },
//         },
//       },
//     },
//     { ignore: [400] }
//   );

//   const dataset = [
//     {
//       id: 1,
//       text: "If I fall, don't bring me back.",
//       user: "jon",
//       date: new Date(),
//     },
//     {
//       id: 2,
//       text: "Winter is coming",
//       user: "ned",
//       date: new Date(),
//     },
//     {
//       id: 3,
//       text: "A Lannister always pays his debts.",
//       user: "tyrion",
//       date: new Date(),
//     },
//     {
//       id: 4,
//       text: "I am the blood of the dragon.",
//       user: "daenerys",
//       date: new Date(),
//     },
//     {
//       id: 5, // change this value to a string to see the bulk response with errors
//       text: "A girl is Arya Stark of Winterfell. And I'm going home.",
//       user: "arya",
//       date: new Date(),
//     },
//   ];

//   const body = dataset.flatMap((doc) => [{ index: { _index: "tweets" } }, doc]);

//   //const { body: bulkResponse } = await client.bulk({ refresh: true, body });

//   if (bulkResponse.errors) {
//     const erroredDocuments = [];
//     bulkResponse.items.forEach((action, i) => {
//       const operation = Object.keys(action)[0];
//       if (action[operation].error) {
//         erroredDocuments.push({
//           status: action[operation].status,
//           error: action[operation].error,
//           operation: body[i * 2],
//           document: body[i * 2 + 1],
//         });
//       }
//     });
//     console.log(erroredDocuments);
//   }

//   const { body: count } = await client.count({ index: "tweets" });
//   console.log(count);
// }

//run().catch(console.log);

//module.exports = { getClient };
//module.exports = { read };
module.exports = Elastic;
