// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        btnStart: {
            default: null,
            type: cc.Node
        },

        loginPanel: {
            default: null,
            type: cc.Node,
        },

        accountRegist_Panel: {
            default: null,
            type: cc.Node,
        },

        loading_Panel: {
            default: null,
            type: cc.Node,
        },

        progressBar: {
            default: null,
            type: cc.ProgressBar,
        },
        bar: {
            default: null,
            type: cc.Sprite,
        },
        btnStart: {
            default: null,
            type: cc.Node,
        }
    },

    onLoad() {
        this.installEvent();
    },
    //注册事件
    installEvent() {
        KBEngine.Event.register("onConnectionState", this, "onConnectionState");
    },

    onDestroy() {
        KBEngine.Event.deregister("onConnectionState", this);
    },
    //开始检查是否可以自动登录
    start() {
        if (this.loginPanel) {
            this.loginPanel.active = false;
        }
        
        this.btnStart = this.node.getChildByName("btn_start");
        var platform = ConfigData.getInstance().platForm;
        var self = this;
        if (platform == window.PlatformEnum.WeChat) {
            // let wxMiniGame = new WXMiniGame();
            // ConfigData.getInstance().wxMiniGame = wxMiniGame;
            let wxMiniGame = ConfigData.getInstance().wxMiniGame;
            //初始化banner广告
             wxMiniGame.initBanner();
             wxMiniGame.initAdvert();

            var obj = new Object();
            obj.title = "快来一起对战吧!";
            obj.imageUrl = "https://mmocgame.qpic.cn/wechatgame/zJUQWqa12LHdVWWpLeiafPqUlaz1JvrCD6zzQ1QxXX4ym6pV0A9ias2A1OfXvRHia0n/0";
            obj.imageUrlId = "VjzzGNFHSGSl+Xsidm01zQ==";
            wxMiniGame.showShareMeau(obj);

            //自动登录
            if(ConfigData.getInstance().bLogined){
                wxMiniGame.checkAuthorized(function(ok){
                    if(ok){
                        ConfigData.getInstance().bAuthorize = true;
                        self.btnStart_clickHandle(); 
                    } else {
                        wxMiniGame.createAuthorizeBtn(self.btnStart, function (ok) {
                            if (ok) {
                                ConfigData.getInstance().bAuthorize = true;
                                self.btnStart_clickHandle();
                            } else {
                                ConfigData.getInstance().bAuthorize = false;
                                console.log("授权失败");
                            }
                        });
                    }
                });
            }
        }
    },

    //开始登陆游戏
    btnStart_clickHandle() {
        console.log("btnStart_clickHandle");
        var isAgree = this.node.getChildByName("toggleTip").getChildByName("New Toggle").getComponent(cc.Toggle).isChecked;
        if (!isAgree) {
            __model.ui.show(__model.ui.page.ui_alert, { msg: "请认真阅读并同意用户服务协议",state:1}, (script) => {
                script.setCallback((ok) => {
                    if(ok){
                        this.node.getChildByName("notice_Panel").active = true;
                    }
                })
            });
            return;
        }

        var platform = ConfigData.getInstance().platForm;
        if (platform == window.PlatformEnum.H5) {
            if (this.loginPanel != null) {
                var namestr = cc.find("inputField/account/editbox", this.loginPanel).getComponent(cc.EditBox);
                var pswstr = cc.find("inputField/password/editbox", this.loginPanel).getComponent(cc.EditBox);
                var localName = cc.sys.localStorage.getItem("UserName");
                var localPw = cc.sys.localStorage.getItem("UserPw");
                if (localName && localName.length != 0 && localPw && localPw.length != 0) {
                    namestr.string = localName;
                    pswstr.string = localPw;
                }
                this.loginPanel.active = true;
            }
        } else if (platform == window.PlatformEnum.WeChat) {
            ConfigData.getInstance().bLogined = true;
            var wxMiniGame = ConfigData.getInstance().wxMiniGame;
            var self = this;
            wxMiniGame.login(function (ok, code) {
                if (ok) {
                    wx.clearStorage();
                    console.log("wechat code: " + code);
                    var jsonData = {
                        "code": code,
                        "platform": 1,
                    }
                    http.sendRequest(ConfigData.getInstance().httpURL + "/api?action=oauth_code&&param=" + JSON.stringify(jsonData), "", function (json) {
                        if (json == null) return;
                        if (json["ret"] == 1) {

                            console.log("登录 username: " + json['data'].username + " password: " + json['data'].passwd + " openid: " + json['data'].openid);

                            __model.ui.show(__model.ui.page.ui_tips,"登录中...");
                            KBEngine.Event.fire("login", json['data'].username, json['data'].passwd, "kbengine_unity3d_balls");
                            self.loading_Panel.active = true;
                            ConfigData.getInstance().userName = json["data"].username;
                            ConfigData.getInstance().userPw = json["data"].passwd;
                            ConfigData.getInstance().access_token = json["data"].access_token;
                            ConfigData.getInstance().openid = json["data"].openid;
                            console.log("登录 username: " + ConfigData.getInstance().userName + " password: " + ConfigData.getInstance().userPw);

                            ConfigData.getInstance().dataAnalysis(ConfigData.getInstance().openid,"logining");
                        } else {
                            console.log("登录失败");
                            var str = json["data"]["desc"];
                            __model.ui.show(__model.ui.page.ui_tips,str);
                        }
                    });
                } else {
                    console.log('登录失败！' + code);
                    __model.ui.show(__model.ui.page.ui_tips,"登录失败," + code);
                }
            });
        }
    },


    //注册账号
    regist_btn_clickHandle() {
        var self = this;
        var accountstr = cc.find("inputField/account/editbox", self.accountRegist_Panel).getComponent(cc.EditBox);
        var pswstr = cc.find("inputField/password/editbox", self.accountRegist_Panel).getComponent(cc.EditBox);

        if (accountstr.string.length == 0 || pswstr.string.length == 0) {
            __model.ui.show(__model.ui.page.ui_tips,"账号或密码不能为空，请检查");
            return;
        }

        if (accountstr.string.length < 3) {
            __model.ui.show(__model.ui.page.ui_tips,"账号长度最短三位");
            return;
        }

        if (pswstr.string.length < 6) {
            __model.ui.show(__model.ui.page.ui_tips,"密码长度不正确，请检查");
            return;
        }

        var jsonData = {
            "username": accountstr.string,
            "password": pswstr.string,
            "imei": ""
        }

        http.sendRequest(ConfigData.getInstance().httpURL + "/api?action=registusername&&param=" + JSON.stringify(jsonData), "", function (json) {
            if (json == null) return;
            if (json["ret"] == 1) {
                __model.ui.show(__model.ui.page.ui_tips,"注册成功，正在登陆...");
                KBEngine.Event.fire("login", accountstr.string, pswstr.string, "kbengine_unity3d_balls");
                self.loading_Panel.active = true;
                ConfigData.getInstance().userName = jsonData.username;
                ConfigData.getInstance().userPw = jsonData.password;
            } else {
                console.log("注册失败");
                var str = json["data"]["desc"];
                __model.ui.show(__model.ui.page.ui_tips,str);
            }
        });
    },

});
