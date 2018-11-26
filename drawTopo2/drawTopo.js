
     /* 使用 jsPlumb 根据指定的拓扑数据结构绘制拓扑图
     * 使用 drawTopo(topoData, nodeTypeArray) 方法
     *
     */

    /**
     * 初始化拓扑图实例及外观设置
     */
    (function() {

        jsPlumb.importDefaults({

            DragOptions : { cursor: 'pointer', zIndex:2000 },

            EndpointStyles: [{fill: 'transparent'}, {fill: 'transparent'}],
            Endpoints: [["Dot", {radius: 4}], ["Dot", {radius: 4}]],

            // ConnectionOverlays : [
            //     [ "Arrow", {
            //         location: 1,
            //         width:0,
            //         length:0,
            //         id:"ARROW",
            //     } ],
            //     [ "Label", {
            //         location:0.1,
            //         id:"label",
            //         cssClass:"Label",
            //     }]
            // ]
        });

        var connectorPaintStyle = {
            lineWidth: 10,
            strokeStyle: "#096EBB",
            joinstyle:"round",
            outlineColor: "#096EBB",
            outlineWidth: 10,
            "stroke-width": 100,
            stroke: "rgba(153, 153, 153, 1)",
            // 'stroke-dasharray':"5,5"
        };

        var connectorHoverStyle = {
            lineWidth: 2,
            strokeStyle: "#5C96BC",
            outlineWidth: 2,
            outlineColor:"white"
        };

        var endpointHoverStyle = {
            fillStyle:"#5C96BC"
        };

        window.topoDrawUtil = {
            sourceEndpoint: {
                endpoint:"Dot",
                paintStyle:{
                    strokeStyle:"#1e8151",
                    fillStyle:"transparent",
                    radius: 2,
                    lineWidth:10,
                },
                isSource:true,
                maxConnections:-1,
                connector:[ "Flowchart", { stub:[40, 60], gap:10, cornerRadius:5, alwaysRespectStubs:true } ],
                connectorStyle: connectorPaintStyle,
                hoverPaintStyle: endpointHoverStyle,
                connectorHoverStyle: connectorHoverStyle,
                dragOptions:{},
                overlays:[
                    "Arrow",
                ]
            },

            targetEndpoint: {
                endpoint: "Dot",
                paintStyle: { fillStyle:"#1e8151",radius: 2 },
                hoverPaintStyle: endpointHoverStyle,
                maxConnections:-1,
                dropOptions:{ hoverClass:"hover", activeClass:"active" },
                isTarget:true,
                overlays:[
                    [ "Label", { location:[0.5, -0.5], label:"", cssClass:"endpointTargetLabel" } ]
                ]
            },

            initConnection: function(connection) {
                connection.getOverlay("label").setLabel(connection.sourceId + "-" + connection.targetId);
                connection.bind("editCompleted", function(o) {
                    if (typeof console != "undefined")
                        console.log("connection edited. path is now ", o.path);
                });
            },

            addEndpoints: function(toId, sourceAnchors, targetAnchors) {
                // console.log(toId, this.sourceEndpoint,sourceAnchors, targetAnchors)
                // if(toId.split('-')[0] == 'LEFT' || toId.split('-')[0] == 'RIGHT') {
                //     this.sourceEndpoint.connectorStyle['stroke-dasharray'] = '5,5'
                // }else {
                //     this.sourceEndpoint.connectorStyle['stroke-dasharray'] = ''
                // }
                for (var i = 0; i < sourceAnchors.length; i++) {
                    var sourceUUID = toId + sourceAnchors[i];
                    jsPlumb.addEndpoint(toId, this.sourceEndpoint, { anchor:sourceAnchors[i], uuid:sourceUUID });
                }
                for (var j = 0; j < targetAnchors.length; j++) {
                    var targetUUID = toId + targetAnchors[j];
                    jsPlumb.addEndpoint(toId,this.sourceEndpoint, { anchor:targetAnchors[j], uuid:targetUUID });
                }
            }
        };


    })();

/**
 * drawTopo 根据给定拓扑数据绘制拓扑图
 * @param topoData 拓扑数据
 * @param rootPosition 拓扑图根节点的位置
 * @param nodeTypeArray 节点类型数组
 *
 * 拓扑图的所有节点是自动生成的, DIV class = "node" , id= nodeType.toUpperCase + "-" + key
 * 拓扑图的所有节点连接也是自动生成的, 可以进行算法改善与优化, 但使用者不需要关心此问题
 * 需要定义节点类型数组 nodeTypeArray
 *
 * 拓扑数据结构:
 * 1. 节点数据结构: node = { type: 'typeName', key: 'key', rel: [], data: {'More Info'}}
 *    rel, data 可选 , type-key 唯一标识该节点
 * 2. 关联关系: rel: [node1, node2, ..., nodeN]
 * 3. 更多详情: 关于节点的更多信息可放置于此属性中
 * 4. 示例:
 *   var topoData = {
 *          type: 'VM', key: '110.75.188.35',
 *          rel: [
 *               {   type: 'RIGHT', key: '3-120343' },
 *               {   type: 'RIGHT', key: '3-120344' },
 *               {   type: 'LEFT',    key: '223.6.250.2',
 *                   rel: [
 *                       { type: 'VM', key: '110.75.189.12' },
 *                       { type: 'VM', key: '110.75.189.12' }
 *                   ]
 *               },
 *               {   type: 'NC',  key: '10.242.192.2',
 *                   rel: [
 *                       { type: 'VM', key: '110.75.188.132' },
 *                       { type: 'VM', key: '110.75.188.135' },
 *                       { type: 'VM', key: '110.75.188.140' }
 *                   ]
 *
 *               }
 *          ]
 *      };
 *
 */
function drawTopo(topoData, rootPosition, nodeTypeArray) {

    // 创建所有拓扑节点及连接并确定其位置
    createNodes(topoData, rootPosition, nodeTypeArray);

    // 调整重合节点的位置, 添加节点的附着点, 即连接线的端点
    adjust(topoData, nodeTypeArray);

    // 创建所有节点连接
    createConnections(topoData, nodeTypeArray);
  $(".node[type='MIDDLE']:last").css('margin-top','-10px');
}

/**
 * 根据给定拓扑数据绘制拓扑节点并确定其位置, 使用深度优先遍历
 * @param topoData 拓扑数据
 * @param rootPosition 根节点的位置设定
 * @param nodeTypeArray 拓扑节点类型
 */
function createNodes(rootData, rootPosition, nodeTypeArray) {
    if (rootData == null) {
        return ;
    }

    var topoRegion = $('#topoRegion');
    var relData = rootData.rel;
    var i=0, relLen = relLength(relData);;

    // 根节点的位置, 单位: px
    var rootTop = rootPosition[0];
    var rootLeft = rootPosition[1];

    var nextRootData = {};

    var nextRootPosition = rootPosition
    // 自动生成并插入根节点的 DIV
    var divStr = createDiv(rootData);
    var nodeDivId = obtainNodeDivId(rootData);
    topoRegion.append(divStr);

    // 设置节点位置
    $('#'+nodeDivId).css('top', rootTop + 'px');
    $('#'+nodeDivId).css('left', rootLeft + 'px');

    for (i=0; i < relLen; i++) {
        if(relLen>1) {   //流程小于等于一个不展示
            nextRootData = relData[i];
            nextRootPosition = obtainNextRootPosition(rootData, nextRootData, nextRootPosition, nodeTypeArray);
            createNodes(nextRootData, nextRootPosition, nodeTypeArray);
        }
    }
}
/**
 * 调整重合节点的位置, 并添加节点的附着点, 即连接线的端点
 */
function adjust(topoData, nodeTypeArray) {

    var vm_RIGHTOffset = 0;   // 起始节点为 vn , 终止节点为 RIGHT, RIGHT div 的偏移量
    var vm_LEFTOffset = 0;      // 起始节点为 vn , 终止节点为 LEFT, LEFT div 的偏移量
    var verticalDistance = 30;

    var VM_TYPE = nodeTypeArray[0];
    var RIGHT_TYPE = nodeTypeArray[1];
    var NC_TYPE = nodeTypeArray[2];
    var LEFT_TYPE = nodeTypeArray[3];
    var isRight = true;
    var isLeft = true;
    $('.node').each(function(index, element) {
        var nodeDivId = $(element).attr('id');
        var nodeType = nodeDivId.split('-')[0];
        var offset = $(element).offset();
        var originalTop = offset.top;

        switch (nodeType) {
            case VM_TYPE:
                topoDrawUtil.addEndpoints(nodeDivId, ['Bottom'], []);
                break;
            case RIGHT_TYPE:
                // RIGHT 位置垂直偏移
                var rigtObj = adjustLR($(element),isRight,originalTop,verticalDistance,vm_RIGHTOffset,RIGHT_TYPE);
                vm_RIGHTOffset = rigtObj.vm_offset;
                isRight = rigtObj.position;
                $(element).css('top', (originalTop + (vm_RIGHTOffset-1)*verticalDistance) + 'px');
                vm_RIGHTOffset++;
                topoDrawUtil.addEndpoints(nodeDivId, [],['Left']);
                break;
            case LEFT_TYPE:
                // LEFT 位置垂直偏移
                var leftObj = adjustLR($(element),isLeft,originalTop,verticalDistance,vm_LEFTOffset,LEFT_TYPE);
                vm_LEFTOffset = leftObj .vm_offset;
                isLeft = leftObj.position;
                $(element).css('top', (originalTop + (vm_LEFTOffset-1)*verticalDistance) + 'px');
                vm_LEFTOffset++;
                topoDrawUtil.addEndpoints(nodeDivId, [], ['Right']);
                break;
            case NC_TYPE:
                topoDrawUtil.addEndpoints(nodeDivId, ['Top', 'Right','Left'], []);
                break;
            default:
                break;
        }
    });
}
/**
* 调整左右节点的上下间距
*/
 function adjustLR(ele,position,originalTop,verticalDistance,vm_offset,direction) {
    var ele1 = $(ele.prevAll(".node[type='MIDDLE']")[0]);
    if(direction == 'RIGHT' ) {
        var ele2 = ele1.prevAll(".node[type='RIGHT']")[0];
    }else {
        var ele2 = ele1.prevAll(".node[type='LEFT']")[0];
    }
    //向前找最近的NC的最近的相同方向的dom，获取offsetTop，计算偏移量
    if (ele2 && position && ele1.length>0) {
            var offsetTop = $(ele2)[0].offsetTop;
            var diffOffset = (offsetTop - originalTop) / verticalDistance;
            console.log(offsetTop,originalTop,diffOffset,)
            if (offsetTop < originalTop) {
                vm_offset = 0;
                if (-diffOffset == 1) {
                    vm_offset = 1;
                }
            } else if (offsetTop == originalTop) {
                vm_offset = 3;
            } else if (offsetTop > originalTop) {
                vm_offset = diffOffset + 3;
            }
            position = false;
        }
        if(ele.next().attr('type') == 'MIDDLE') {
            position = true;
        }

        var obj = {
            position:position,
            vm_offset:vm_offset
        }
        return obj;
}
/**
 * 获取下一个根节点的位置, 若节点类型相同, 则位置会重合, 需要后续调整一次
 * @root            当前根节点
 * @nextRoot        下一个根节点
 * @rootPosition    当前根节点的位置
 * @nodeTypeArray   节点类型数组
 */
function obtainNextRootPosition(root, nextRoot, rootPosition, nodeTypeArray) {
    var VM_TYPE = nodeTypeArray[0];
    var RIGHT_TYPE = nodeTypeArray[1];
    var NC_TYPE = nodeTypeArray[2];
    var LEFT_TYPE = nodeTypeArray[3];

    var startNodeType = root.type;
    var endNodeType = nextRoot.type;
    var nextRootPosition = rootPosition

    var rootTop = rootPosition[0];
    var rootLeft = rootPosition[1];
    if(root.type == NC_TYPE && nextRoot.type == RIGHT_TYPE) {
        rootLeft = 400;
        // rootTop = 120
    }else if(root.type == NC_TYPE && nextRoot.type == LEFT_TYPE) {
        rootLeft = -250;
        // rootTop = 120
    }
    var verticalDistance = 90;
    var horizontalDistance = 250;

    switch (startNodeType) {
        case VM_TYPE:
            if (endNodeType == NC_TYPE) {
                nextRootPosition = [rootTop+verticalDistance, rootLeft];
            }
            break;
        case NC_TYPE:
            if (endNodeType == RIGHT_TYPE || endNodeType == LEFT_TYPE) {
                nextRootPosition = [rootTop, rootLeft+horizontalDistance];
            }
            break;
        default:
            break;
    }
    return nextRootPosition;
}

/**
 * 根据给定拓扑数据, 绘制节点之间的连接关系, 使用深度优先遍历
 * @param topoData 拓扑数据
 * @param nodeTypeArray 节点类型数组
 */
function createConnections(topoData, nodeTypeArray) {
    if (topoData == null) {
        return ;
    }
    var rootData = topoData;
    var relData = topoData.rel;
    var i=0, len = relLength(relData);
    for (i=0; i < len; i++) {
        connectionNodes(rootData, relData[i], nodeTypeArray);
        createConnections(relData[i], nodeTypeArray);
    }
}

/**
 * 连接起始节点和终止节点
 * @beginNode 起始节点
 * @endNode 终止节点
 * NOTE: 根据是起始节点与终止节点的类型
 */
function connectionNodes(beginNode, endNode, nodeTypeArray)
{
    var startNodeType = beginNode.type;
    var endNodeType = endNode.type;
    var startDirection = '';
    var endDirection = '';

    var VM_TYPE = nodeTypeArray[0];
    var RIGHT_TYPE = nodeTypeArray[1];
    var NC_TYPE = nodeTypeArray[2];
    var LEFT_TYPE = nodeTypeArray[3];

    switch (startNodeType) {
        case VM_TYPE:
           if (endNodeType == NC_TYPE) {
                // NC 绘制于 VM 下方
                startDirection = 'Bottom';
                endDirection = 'Top';
            }
            break;
        case NC_TYPE:
          if (endNodeType == RIGHT_TYPE) {
                // RIGHT 绘制于 VN 右方
                startDirection = 'Right';
                endDirection = 'Left';
            }else if (endNodeType == LEFT_TYPE) {
                // RIGHT 绘制于 VN 左方
                startDirection = 'Left';
                endDirection = 'Right';
            }
            break;
        default:
            break;
    }
    var startPoint = obtainNodeDivId(beginNode) + startDirection;
    var endPoint = obtainNodeDivId(endNode) + endDirection;
    console.log('dddddddddddddd  ',startPoint, endPoint)
    jsPlumb.connect({uuids:[startPoint, endPoint],editable: false});
}

function createDiv(metaNode) {
    return '<div class="node" id="' + obtainNodeDivId(metaNode) + '" type="' + metaNode.type + '"><span>'
        + metaNode.type +  metaNode.node_name + '</span></div>'
}

/**
 * 生成节点的 DIV id
 * divId = nodeType.toUpperCase + "-" + key
 * key 可能为 IP , 其中的 . 将被替换成 ZZZ , 因为 jquery id 选择器中 . 属于转义字符.
 * eg. {type: 'VM', key: '1.1.1.1' }, divId = 'VM-1ZZZ1ZZZ1ZZZ1'
 */
function obtainNodeDivId(metaNode) {
    if(metaNode && metaNode.type) {
        return metaNode.type.toUpperCase() + '-' + transferKey(metaNode.node_name);
    }

}

function transferKey(key) {
    return key.replace(/\./g, 'ZZZ');
}
function relLength(relData) {
    if (isArray(relData)) {
        return relData.length;
    }
    return 0;
}

function isArray(value) {
    return value && (typeof value === 'object') && (typeof value.length === 'number');
}
