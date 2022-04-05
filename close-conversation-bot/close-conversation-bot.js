"use strict";
/*
 * This demo try to use most of the API calls of the messaging agent api. It:
 *
 * 1) Connects to all OPEN conversations (Bot should be AGENT MANAGER of MAIN GROUP)
 * 2) Closes each conversation
 *
 */

const Agent = require("../lib/AgentSDK");

class CloseConversationBot extends Agent {
    constructor(conf) {
        super(conf);

        this.conf = conf;

        this.CONTENT_NOTIFICATION_LEGACY = "CloseConversationBot.ContentEvnet"; // deprecated, some old bots might still use this, but example code will not reference this
        this.CONTENT_NOTIFICATION = "CloseConversationBot.ContentEvent";
        this.NEW_CONVERSATION = "CloseConversationBot.NewConversation";

        this.openConvs = {};
        this.totalApplicableForClosing = 0;

        this.on("connected", this.onConnected.bind(this));

        // handle conversation state change notifications
        this.on(
            "cqm.ExConversationChangeNotification",
            this.onConversationNotification.bind(this)
        );

        this.on("error", (err) => console.log("got an error", err));

        this.on("closed", (data) => {
            // For production environments ensure that you implement reconnect logic according to
            // liveperson's retry policy guidelines: https://developers.liveperson.com/guides-retry-policy.html
            console.log("socket closed", data);

            // stop keep alive
            clearInterval(this._pingClock);

            // mark all convs as offline
            Object.keys(this.openConvs).forEach((key) => {
                this.openConvs[key].state = "offline";
            });

            // then reconnect
            this.reconnectWithMessages();
        });
        //console.log(this.subscribeExConversations.toString());
    }

    onConnected(msg) {
        console.log("connected...", this.conf.id || "", msg);

        // subscribe to all conversations
        this.subscribeExConversations(
            {
                convState: ["OPEN"],
                //agentIds: [3072160830, 3072161330, 3090438230, 3090438630],
            },
            (e, resp) =>
                console.log(
                    "subscribeExConversations",
                    this.conf.id || "",
                    resp || e
                )
        );

        // start the keep alive process
        this._pingClock = setInterval(this.getClock, 30000);
    }

    reconnectWithMessages() {
        console.log("reconnecting");
        this.reconnect(); // regenerate token for reasons of authorization (data === 4401 || data === 4407)
    }

    onConversationNotification(notificationBody) {
        // console.log(JSON.stringify(notificationBody));

        notificationBody.changes.forEach((change) => {
            // If skillId is not defined in the constant, this conversation wont be closed
            if (
                !this.closingConvoTimeBySkill[
                    +change.result.conversationDetails.skillId
                ]
            ) {
                // console.log(
                //     `SkillID ${change.result.conversationDetails.skillId} not defined in closingConvoTimeBySkill constant`
                // );
                return; // Skip the rest of this iteration
            }

            if (change.type === "UPSERT") {
                //console.log(`found convId: ${change.result.convId}`);

                // a new conversation
                if (!this.openConvs[change.result.convId]) {
                    this.onNewConversation(change);
                }

                // an existing conversation
                else {
                    // look up the conversation state
                    let conversation = this.openConvs[change.result.convId];

                    // this is the first time we've seen this since reconnect
                    if (conversation.state === "offline") {
                        conversation.state = "active";
                        console.log("conversation resumed after being online");
                    }
                }
                if (this.applicableForClosing(change)) {
                    // TODO: Add logging to save key data from the conversations that are being closed (Important reporting data)
                    this.onCloseConversation(change);
                    this.totalApplicableForClosing += 1;
                    console.log(
                        //`ConvId: ${change.result.convId} is applicable for closing`
                        `Total applicable for closing: ${this.totalApplicableForClosing}`
                    );
                } else {
                    // console.log(
                    //     `ConvId: ${change.result.convId} not applicable for closing`
                    // );
                }
            }
        });
    }

    onNewConversation(change) {
        // create a conversation state object
        let conversation = {
            messages: {},
            consumerId: null,
            state: "active",
        };

        // add it to our list of known conversations
        this.openConvs[change.result.convId] = conversation;
    }

    onCloseConversation(change) {
        console.log(`closing: ${change.result.convId}`);

        this.updateConversationField(
            {
                conversationId: change.result.convId,
                conversationField: [
                    {
                        field: "ConversationStateField",
                        conversationState: "CLOSE",
                    },
                ],
            },
            (e, resp) => {
                if (e) {
                    console.error(e);
                } else {
                    if (this.openConvs.hasOwnProperty(change.result.convId)) {
                        // conversation was closed or transferred
                        delete this.openConvs[change.result.convId];
                    }
                }
                console.log(resp);
            }
        );
    }

    applicableForClosing(change) {
        const hoursNeededToCloseConversation =
            this.closingConvoTimeBySkill[
                +change.result.conversationDetails.skillId
            ];

        const lastConvoEventTs = change.result.lastContentEventNotification
            ? change.result.lastContentEventNotification.serverTimestamp
            : Date.now(); //change.result.conversationDetails.startTs Might be an option;

        const timeNowMillis = Date.now();

        // console.log(
        //     `Time elapsed after last event: ${Math.ceil(
        //         timeNowMillis / 1000 / 60 / 60 -
        //             lastConvoEventTs / 1000 / 60 / 60
        //     )}`
        // );
        // console.log(
        //     `Time needed to close this convo: ${hoursNeededToCloseConversation}`
        // );

        return (
            Math.ceil(
                timeNowMillis / 1000 / 60 / 60 -
                    lastConvoEventTs / 1000 / 60 / 60
            ) >= hoursNeededToCloseConversation
        );
    }
}

module.exports = CloseConversationBot;
