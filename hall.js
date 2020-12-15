
cc.Class({
    extends: cc.Component,

    properties: {
        txt_name: {
            default: null,
            type: cc.Label,
        },
        txt_level: {
            default: null,
            type: cc.Label,
        },
        img_level: {
            default: null,
            type: cc.Sprite,
        },
        txt_gold: {
            default: null,
            type: cc.Label,
        },

        iconHead: {
            default: null,
            type: cc.Sprite,
        }

    },
    onLoad() {
    },


    update(dt) {
    },


    installEvents: function () {
        KBEngine.Event.register("onPair", this, "onPair");
        KBEngine.Event.register("onPairResult", this, "onPairResult");
    },


    //显示面板
    showPanel: function (node, data) {
        __model.sound.playSound(clipArr.click);
        console.log("openPanel   " + data);
        //打开商店
        if (data == "Shop") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "shopBt");
            __model.ui.show(__model.ui.page.ui_shop, null, (script) => {
                console.log("shop open");
                UIManger.getInstance().showBanner(false);
            });
        }
        //打开设置
         else if (data == "Setting") {
            __model.ui.show(__model.ui.page.ui_setting);
        } 
        //打开邮件
        else if (data == "Mail") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "mailBt");
            __model.ui.show(__model.ui.page.ui_mail);
        } 
        //打开个人中心
        else if (data == "Userinfo") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "personalBt");
            __model.ui.show(__model.ui.page.ui_userInfo);
        } 
        //打开签到
        else if (data == "Sign") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "SignBt");
            UIManger.getInstance().showBanner(false);
            __model.ui.show(__model.ui.page.ui_sign);
        }
         //打开聊天
         else if (data == "Chat") {
            var Chat_Panel = this.node.parent.getChildByName("chat_Panel");
            Chat_Panel.active = true;
            Chat_Panel.getComponent("ChatPanel").openChatPanel();
        } 
         //打开帮助
        else if (data == "Help") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "helpBt");
            __model.ui.show(__model.ui.page.ui_help);
        }
         //打开排行榜
         else if (data == "Ranking") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "rankingBt");
            __model.ui.show(__model.ui.page.ui_rank)
        } 
        //打开分享
        else if (data == "Share") {
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "shareBt");
            if (cc.sys.platform === cc.sys.WECHAT_GAME) {
                var wxMiniGame = ConfigData.getInstance().wxMiniGame;
                var obj = new Object();
                obj.title = "快来一起对战吧!";
                obj.imageUrl = "https://mmocgame.qpic.cn/wechatgame/zJUQWqa12LHdVWWpLeiafPqUlaz1JvrCD6zzQ1QxXX4ym6pV0A9ias2A1OfXvRHia0n/0";
                obj.imageUrlId = "VjzzGNFHSGSl+Xsidm01zQ==";
                wxMiniGame.share(obj);
            }
        }
    },

    //进入游戏--快速开始
    playgame_quickStart() {
        if (this.avatar.diamond > 0) {
            this.avatar.baseCall("pair", 1);
            ConfigData.getInstance().dataAnalysis(this.avatar.did.lo, "quickstartBt");
        } else {
            let str = __json.tipmsg.getTipMsg(321);
            __model.ui.show(__model.ui.page.ui_alert, { msg: str }, (script) => {
                script.setCallback((ok) => {
                    if (ok) {
                        UIManger.getInstance().showBanner(false);
                        __model.ui.show(__model.ui.page.ui_shop);
                    }
                })
            })
        }
    },

    //显示匹配中
    onPair() {
        __model.ui.show(__model.ui.page.ui_matching);
    },
    //关闭匹配
    onPairResult() {
        __model.ui.closeUI(__model.ui.page.ui_matching);
    },

});