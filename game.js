
cc.Class({

    //初始游戏地图
    initMap(layer1, box) {

        for (let i = 0; i < box.length; i++) {
            let boxItem = box[i];
            let x = boxItem.gridx;
            let y = boxItem.gridy;
            let newX = boxItem.gridnewx;
            let newY = boxItem.gridnewy;

            let gridCell = this.mapDic.dataStore[this.getIndexByRowAndCol(y, x)];
            let gridCell2 = this.mapDic.dataStore[this.getIndexByRowAndCol(newY, newX)];
            if (gridCell == null) {
                console.log("can not find (" + y + "," + x + ")");
                continue;
            }

            if (gridCell && gridCell.objectType == ObjType.Box) {
                if (gridCell2 == null) {
                    this.mapDic.dataStore[this.getIndexByRowAndCol(y, x)] = null;
                    this.mapDic.dataStore[this.getIndexByRowAndCol(newY, newX)] = gridCell;
                }

                let bubble = gridCell.getComponent("Bubble");
                if (bubble == null) {
                    bubble = gridCell.addComponent("Bubble");
                }
                bubble.speed = 6;
                bubble.canEnabled = true;
                bubble.objectType = ObjType.Box;
                bubble._destPosition = new cc.Vec2(this.gridSize * newX, -this.gridSize * newY);
            }
        }

        for (let k = 0; k < darts.length; k++) {
            let data = darts[k];
            let cellElement = null;
            let target = layer1.getChildByName(data.bid.toString());
            if (target) {
                cellElement = target;
                let bubble = cellElement.getComponent("Bubble");
                bubble.canEnabled = true;
                bubble._destPosition = this.conversionServerToClientPos(new cc.Vec2(data.pos.x, data.pos.y));
            } else {
                if (data.state == 0) {
                    // cellElement = cc.instantiate(this.node.getComponent("mapPrefab").getPrefabByName(null, "feibiao"));
                    cellElement = cc.instantiate(this.getPrefabByName(null, "feibiao"));
                    cellElement.setName(data.bid.toString())
                    cellElement.parent = layer1;

                    let targetPos = this.conversionServerToClientPos(new cc.Vec2(data.pos.x, data.pos.y));

                    cellElement.setPosition(targetPos);
                    let bubble = cellElement.getComponent("Bubble");
                    if (bubble == null) {
                        bubble = cellElement.addComponent("Bubble");
                    }
                    bubble._position = targetPos;
                    bubble._destPosition = targetPos;
                    bubble.speed = 1;
                    bubble.canEnabled = false;

                    if (data.dir == 0) {
                        cellElement.rotation = 270;
                    } else if (data.dir == 1) {
                        cellElement.rotation = 180;
                    } else if (data.dir == 2) {
                        cellElement.rotation = 90;
                    } else if (data.dir == 3) {
                        cellElement.rotation = 0;
                    }
                }
            }
            if (data.state == 1) {
                cellElement.destroy();
            }
        }
    },

    //游戏开始
    startGame(){
        this.playermove();
    },
    //角色移动
    playermove: function (dt) {
        if (!this.isMouseDown) return;

        var _map = this.Map;
        var pos = this.node.getPosition();
        var orginrc = _map.getRowAndColByPos(pos);
        var orginCell = _map.getPosCellByRowAndCol(orginrc.row, orginrc.col);
        var cx = this.vectorDir.x * this.speed;
        var cy = this.vectorDir.y * this.speed;

        var idx = 0;
        var idy = 0;
        if (this.vectorDir.x > 0) {
            idx = 1;
        } else if (this.vectorDir.x < 0) {
            idx = -1;
        }
        if (this.vectorDir.y > 0) {
            idy = 1;
        } else if (this.vectorDir.y < 0) {
            idy = -1;
        }

        var currentrc = _map.getRowAndColByPos(new cc.Vec2(pos.x + cx + idx  / 2, pos.y + cy + idy / 2));
        var destCell = _map.getPosCellByRowAndCol(currentrc.row, currentrc.col);

        if (orginrc == currentrc) {
            this.setPos({ x: cx, y: cy });
            return;
        }

        var collxy = this.collision_move(pos.x + cx, pos.y + cy, idx, idy);
        if (!collxy.collx && !collxy.colly) {
            if (!_map.bGridCanThrough(destCell, this.bUsingFlySaucer)) {
                if (Math.abs(cx) > Math.abs(cy)) {
                    cy = 0;
                } else {
                    cx = 0;
                }
            }
            this.node.x += cx;
            this.node.y += cy;
        }
        if (collxy.collx) {
            if (cx > 0) {
                cx = Math.max(0, orginCell.node.getPosition().x + orginCell.gridSize / 2 - this.sizeRevise / 2 - pos.x);
            } else if (cx < 0) {
                cx = Math.min(0, orginCell.node.getPosition().x - orginCell.gridSize / 2 + this.sizeRevise / 2 - pos.x);
            }
        }
        if (collxy.colly) {
            if (cy > 0) {
                cy = Math.max(0, orginCell.node.getPosition().y + orginCell.gridSize / 2 - this.sizeRevise / 2 - pos.y);
            } else if (cy < 0) {
                cy = Math.min(0, orginCell.node.getPosition().y - orginCell.gridSize / 2 + this.sizeRevise / 2 - pos.y);
            }
        }

        if (collxy.collx && collxy.colly) {
            this.setPos({ x: cx, y: cy });
            return;
        }
        if ((collxy.collx && !collxy.colly) || (!collxy.collx && collxy.colly)) {
            if (collxy.collx) {
                if (idy != 0) {
                    if (Math.abs(destCell.node.getPosition().y - pos.y) <= this.speed) {
                        cy = destCell.node.getPosition().y - pos.y;
                    } else {
                        cy = this.speed * idy;
                    }
                } else {
                    if (this.destCellColl) {
                        if (!this.Map.checkGridCanThroughLayer1(this.destCellColl, this.bUsingFlySaucer)) {
                            if (pos.y < (this.destCellColl.node.getPosition().y - this.destCellColl.gridSize / 4)) {
                                if (this.canPolishing(this.destCellColl, 1, false))
                                    idy = -1;
                            } else if (pos.y > (this.destCellColl.node.getPosition().y + this.destCellColl.gridSize / 4)) {
                                if (this.canPolishing(this.destCellColl, -1, false))
                                    idy = 1;
                            }

                            if (Math.abs(destCell.node.getPosition().y - pos.y) <= this.speed) {
                                cy = destCell.node.getPosition().y - pos.y;
                            } else {
                                cy = this.speed * idy;
                            }
                        }
                    }
                }
            }
            if (collxy.colly) {
                if (idx != 0) {
                    if (Math.abs(destCell.node.getPosition().x - pos.x) <= this.speed) {
                        cx = destCell.node.getPosition().x - pos.x;
                    } else {
                        cx = this.speed * idx;
                    }
                } else {
                    if (this.destCellColl) {
                        if (!this.Map.checkGridCanThroughLayer1(this.destCellColl, this.bUsingFlySaucer)) {
                            if (pos.x < (this.destCellColl.node.getPosition().x - this.destCellColl.gridSize / 4)) {
                                if (this.canPolishing(this.destCellColl, -1, true))
                                    idx = -1;
                            } else if (pos.x > (this.destCellColl.node.getPosition().x + this.destCellColl.gridSize / 4)) {
                                if (this.canPolishing(this.destCellColl, 1, true))
                                    idx = 1;
                            }

                            if (Math.abs(destCell.node.getPosition().x - pos.x) <= this.speed) {
                                cx = destCell.node.getPosition().x - pos.x;
                            } else {
                                cx = this.speed * idx;
                            }
                        }
                    }
                }
            }
        }
        this.setPos({ x: cx, y: cy });
    },
});