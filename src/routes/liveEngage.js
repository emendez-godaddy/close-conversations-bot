const express = require("express");
const { api } = require("../services/provider");
const router = express.Router();
const CloseConversationBot = require("../../close-conversation-bot/close-conversation-bot-noevent");
const ElasticSearch = require("../integrations/Elastic");
const CONST = require("../../lib/Const");
const fs = require("fs");

const elastic = new ElasticSearch();
const conf = {
  accountId: process.env.ACCOUNT_ID,
  username: process.env.USERNAME,
  appKey: process.env.BOT_APP_KEY,
  secret: process.env.BOT_APP_SECRET,
  accessToken: process.env.BOT_ACCESS_TOKEN,
  accessTokenSecret: process.env.BOT_ACCESS_TOKEN_SECRET,
};

router.get("/close-conversations", (req, res) => {
  const PAGE_SIZE = 50;
  const arr_data = [];
  let offset = 0;

  async function callApiService(offset) {
    const url = `https://va.msghist.liveperson.net/messaging_history/api/account/${conf.accountId}/conversations/search?offset=${offset}&limit=50&source=GD_AgentUI_History`;
    const options = {
      url,
      method: "POST",
    };

    const body = {
      start: {
        from: 1640995200000 /*1644029518000*/,
        to: 1642204800000 /*Date.now()*/,
      },
      skillIds: [3072159530],
      status: ["OPEN"],
    };
    // 3721371038 Test Skill
    // 2327456130, 2327443530, 2327447030, 2327444230, 2327452930 LATAM
    const data = await api(options, {}, body);

    arr_data.push(...data.conversationHistoryRecords);
    offset += PAGE_SIZE;
    console.log(offset);

    if (data.conversationHistoryRecords.length < PAGE_SIZE) {
      const convosToClose = getApplicableForClosingConvos(arr_data);
      new CloseConversationBot(conf, convosToClose.idsToClose);

      // indexDataIntoElastic(cc
      //   convosToClose.convosToPersistInElastic,
      //   CONST.CLOSEDCONVOSELASTICBODYINDEX,
      //   CONST.CLOSEDCONVOSELASTICINDEXNAME
      // );

      console.log(`Total conversations: ${convosToClose.conversations.length}`);

      return res.json(convosToClose.idsToClose);
    } else {
      callApiService(offset);
    }
  }
  callApiService(offset);
});

// Route to test elastic functions
router.get("/existing-index", async (req, res) => {
  indexDataIntoElastic(
    "Hello",
    CONST.CLOSEDCONVOSELASTICBODYINDEX,
    "le-bot-closed-conversations"
  );
});

const getApplicableForClosingConvos = (convoArray) => {
  const applicableConvos = {
    idsToClose: [],
    conversations: [],
  };
  for (let index = 0; index < convoArray.length; index++) {
    if (isConvoApplicable(convoArray[index].messageRecords)) {
      const convoId = convoArray[index].info.conversationId;
      const conversation = {
        ...convoArray[index].info,
        startTime: new Date(convoArray[index].info.startTime),
        endTime: new Date(),
        endTimeL: Date.now(),
        campaign: {
          ...convoArray[index].campaign,
        },
        responseTime: {
          ...convoArray[index].responseTime,
        },
        monitoring: {
          ...convoArray[index].monitoring,
        },
        agentParticipants: {
          ...convoArray[index].agentParticipants,
        },
      };
      applicableConvos.idsToClose.push(convoId);
      applicableConvos.conversations.push(conversation);
    } else {
      continue;
    }
  }
  return applicableConvos;
};

const isConvoApplicable = (messageRecords) => {
  const hoursNeededToCloseConvo = 48;
  const { timeL } = messageRecords[messageRecords.length - 1] || 0;
  const timeNowMillis = Date.now();

  // return (
  //   Math.ceil(timeNowMillis / 1000 - timeL / 1000) >= hoursNeededToCloseConvo
  // );

  return (
    Math.ceil(timeNowMillis / 1000 / 60 / 60 - timeL / 1000 / 60 / 60) >=
    hoursNeededToCloseConvo
  );
};

const indexDataIntoElastic = async (
  convosToPersist,
  indexStructure,
  indexName
) => {
  const failedConvos = [];

  if (!(await elastic.isIndexCreated(indexName))) {
    await elastic.createIndex(indexName, indexStructure);
  }

  const result = await elastic.client.helpers.bulk({
    datasource: convosToPersist,
    onDocument(doc) {
      return {
        index: { _index: indexName },
      };
    },
    onDrop(doc) {
      failedConvos.push(doc);
    },
  });

  if (failedConvos.length > 0) {
    let jsonData = JSON.stringify(failedConvos, null, 2);
    fs.writeFileSync("failedConversations.json", jsonData);
  }
  console.log(result);
};

module.exports = router;
