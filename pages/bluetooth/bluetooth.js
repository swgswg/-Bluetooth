// 初始化蓝牙(判断用户有没有开蓝牙) --> 搜索蓝牙 --> 连接蓝牙 --> 根据连接的deviceId获取服务serviceUUID -->
// 根据服务serviceUUID获取特征值 --> 根据特征值获取 读写权限 --> 根据读写 数据交互

// var connectingDeviceId = '';
// var services_UUID = '';
// var characteristic_UUID = '';
// var wvalue = '';
var zeroClearingValue   = 'FE08010000000000000108'; // 清零
var noZeroClearingValue = 'FE08010000000000000007'; // 不清零
// var test             = 'FE0801010101000000010b';
// var test             = 'FE0800010101000000010a';
// var test                = 'FE08010000010000000109';
// var test                = 'FE08010000010000000109';
var test               = 'FE08010000000000000108';
var writeValueQueue = [];
var queueSuccess = true;
Page({
    data: {
        openBluetoothAdapter:false,
        available:false,
        discovering:false,
        deviceList:[],
        connected:false,
        connectingDeviceId:'',
        services_UUID:'',
        characteristic_UUID:'',
        readValue:'',
        shakeNum:0,
    },

    onLoad(){

    },

    // 初始化蓝牙
    openEvent(){
        this.openBluetooth();
    },
    
    // 搜索蓝牙
    searchEvent(){
        let that = this;
        if (that.data.discovering){
           toast('正在搜索');
            return;
        }
        that.setData({
            deviceList:[]
        });

        // 停止搜寻附近的蓝牙外围设备
        that.stopDiscovery();

        // 获取本机蓝牙适配器状态
        if(that.getBluetoothState()){
            return;
        }

        // 监听蓝牙适配器状态变化事件
        that.onBluetoothStateChange();

        // 开始搜寻附近的蓝牙外围设备
        that.startDiscovery();

        // 监听寻找到新设备
        that.onFoundBluetooth();
    },

    // 连接设备
    connectEvent(e){
        if(this.data.connected){
            return;
        }
        let deviceId = e.currentTarget.dataset.deviceid;
        // 停止搜寻附近的蓝牙外围设备
        this.stopDiscovery();

        // 断开与低功耗蓝牙设备的连接 然后再连接新的设备
        this.closeConnection(deviceId);

        // 连接低功耗蓝牙设备
        this.BLEConnection(deviceId);

    },

    inputValue(e){
        // wvalue = e.detail.value;
    },

    // 发送
    sendvalue() {
        let connectingDeviceId = this.data.connectingDeviceId;
        let services_UUID = this.data.services_UUID;
        let characteristic_UUID = this.data.characteristic_UUID;
        this.writeValue(connectingDeviceId,services_UUID,characteristic_UUID,test);
    },

    // 初始化蓝牙模块
    openBluetooth(){
        let that = this;
        wx.openBluetoothAdapter({
            success(e){
                if (e.errMsg == 'openBluetoothAdapter:ok'){
                    that.setData({
                        openBluetoothAdapter: true
                    });
                    that.getBluetoothState();
                }
            },
            fail(){
                wx.showModal({
                    title: '温馨提示',
                    content: '请检查手机蓝牙是否开启',
                    showCancel:false
                });
                that.setData({
                    openBluetoothAdapter: false
                });
            },

        })
    },

    // 获取本机蓝牙适配器状态
    getBluetoothState(){
        let that = this;
        wx.getBluetoothAdapterState({
            success(e){
                that.setData({
                    available:e.available,
                    discovering:e.discovering,
                });
                return true;
            },
            fail(){
                that.setData({
                    available:false,
                    discovering:false,
                });
                return false;
            }
        });
    },

    // 监听蓝牙适配器状态变化事件
    onBluetoothStateChange(){
        let that = this;
        wx.onBluetoothAdapterStateChange(function(res){
            console.log('监听蓝牙适配器状态变化');
            that.setData({
                available:res.available,
                discovering:res.discovering,
            });
        });
    },

    // 开始搜寻附近的蓝牙外围设备
    startDiscovery(){
        let that = this;
        wx.startBluetoothDevicesDiscovery({
            success (res) {
                that.setData({
                    discovering:res.isDiscovering,
                });
                // that.getDevices();
            },
            fail(){
                that.setData({
                    discovering:false,
                });
                toast('搜索失败');
            }
        })
    },

    // 监听寻找到新设备的事件
    onFoundBluetooth(){
        let that = this;
        wx.onBluetoothDeviceFound(function (res) {
            // that.getDevices();
            // 兼容安卓及iOS设备
            if(res.deviceId){
                that.devicesData(res);
            } else if(res.devices){
                that.devicesData(res.devices[0]);
            } else if(res[0]){
                that.devicesData(res[0]);
            }
        });
    },

    devicesData(new_devices){
        let that = this;
        let deviceList = that.data.deviceList;
        let len = deviceList.length;
        let isExist = false;
        console.log(new_devices);
        if(!new_devices.name){
            new_devices.name = '空';
            return;
        }
        let advertisData = ab2hex(new_devices.advertisData);
        if(!advertisData){
            advertisData = '空';
        }
        new_devices.advertisData = advertisData;
        for(let i = 0; i < len; i++){
            if(new_devices.deviceId == deviceList[i].deviceId){
                isExist = true;
                deviceList.splice(i,1,new_devices);
            }
        }
        if(!isExist){
            deviceList.push(new_devices);
        }
        that.setData({
            deviceList: deviceList
        });
    },

    // 获取在蓝牙模块生效期间所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备
    getDevices(){
        let that = this;
        wx.getBluetoothDevices({
            success: function (res) {
                console.log('获取在蓝牙模块生效期间所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备');
                console.log(res);
                that.setData({
                    deviceList:res.devices
                });
            }
        })
    },

    // 停止搜寻附近的蓝牙外围设备
    stopDiscovery(){
        let that = this;
        wx.stopBluetoothDevicesDiscovery({
            success(res){
                console.log('停止搜寻附近的蓝牙外围设备');
                console.log(res);
                that.setData({
                    discovering:false
                });
            },
            fail(){
                toast('停止搜索失败');
            },
        });
    },

    // 连接低功耗蓝牙设备
    BLEConnection(deviceId){
        let that = this;
        loading('连接中');
        // console.log('连接中');
        // console.log(deviceId);
        wx.createBLEConnection({
            deviceId: deviceId,
            timeout: 600000,
            success(res){
                console.log('连接成功');
                console.log(res);
                // connectingDeviceId = deviceId;
                that.setData({
                    connected: true,
                    connectingDeviceId: deviceId
                });
                that.getServices(deviceId);
                hide_Loading();
                toast('连接成功');
            },
            fail(res){
                console.log('连接失败');
                console.log(res);
                that.setData({
                    connected:false,
                });
                hide_Loading();
                toast('连接失败');
            },
        });
    },

    // 断开与低功耗蓝牙设备的连接
    closeConnection(){
        let connectingDeviceId = this.data.connectingDeviceId;
        if(!connectingDeviceId){
            return;
        }
        wx.closeBLEConnection({
            deviceId: connectingDeviceId,
            success(res){
                console.log('断开与低功耗蓝牙设备的连接');
                console.log(res);
            },
            fail(){
                toast('断开连接失败');
            }
        });
    },

    // 获取蓝牙设备所有服务(service) 为了获取service的UUID
    getServices(deviceId){
        let that = this;
        // console.log(deviceId);
        wx.getBLEDeviceServices({
            deviceId:deviceId,
            success(res){
                // console.log('获取蓝牙设备service');
                // console.log(res);
                that.setData({
                    services:res.services
                });
                let uuid = res.services;
                let len = uuid.length;
                for(let i = 0; i < len; i++){
                    that.getCharacteristics(deviceId,res.services[i].uuid);
                }
            },
            fail(res){
                toast('获取服务失败');
                console.log(res);
            },
        });
    },

    // 获取蓝牙设备某个服务中所有特征值(characteristic) 为了该特征值UUID支持的操作类型
    getCharacteristics(deviceId,services_UUID){
        let that = this;
        wx.getBLEDeviceCharacteristics({
            deviceId:deviceId,
            serviceId:services_UUID,
            success(res){
                // console.log('获取蓝牙设备characteristic');
                // console.log(res);
                if(res.errCode == 0){
                    let characteristics = res.characteristics;
                    let len = characteristics.length;
                    for(let k = 0; k < len; k++){
                        let indicate = characteristics[k].properties.indicate;
                        let notify = characteristics[k].properties.notify;
                        let read = characteristics[k].properties.read;
                        let write = characteristics[k].properties.write;
                        console.log(indicate,notify,read,write);
                        if(indicate && notify && read && write){
                            let connectingDeviceId = res.deviceId;
                            // console.log('connectingDeviceId');
                            // console.log(connectingDeviceId);
                            let services_UUID = res.serviceId;
                            // console.log('services_UUID');
                            // console.log(services_UUID);
                            let characteristic_UUID = characteristics[k].uuid;
                            // console.log('characteristic_UUID');
                            // console.log(characteristic_UUID);
                            that.setData({
                                connectingDeviceId: connectingDeviceId,
                                services_UUID: services_UUID,
                                characteristic_UUID: characteristic_UUID
                            });
                            that.notifyValueChange(connectingDeviceId,services_UUID,characteristic_UUID);
                        }
                    }
                }

            },
            fail(){
                toast('获取特征值失败');
            }
        });
    },

    // 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值
    notifyValueChange(deviceId,services_UUID,characteristic_UUID){
        let that = this;
        wx.notifyBLECharacteristicValueChange({
            deviceId:deviceId,
            serviceId:services_UUID,
            characteristicId:characteristic_UUID,
            state:true,
            success(res){
                console.log('启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值: 成功---');
                console.log(res);

                setTimeout(function () {
                    let connectingDeviceId = that.data.connectingDeviceId;
                    let services_UUID = that.data.services_UUID;
                    let characteristic_UUID = that.data.characteristic_UUID;
                    that.writeValue(connectingDeviceId,services_UUID,characteristic_UUID,test);
                },1000);

                that.onValueChange();
            },
            fail(res){
                console.log('启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值: 失败---');
                console.log(res);
            },
        });
    },

    // 监听低功耗蓝牙设备的特征值变化
    // 必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
    onValueChange(){
        let that = this;
        wx.onBLECharacteristicValueChange(function(res){
            console.log('监听低功耗蓝牙设备的特征值变化');
            console.log(res);
            console.log(ab2hex(res.value));
            // 获取设备返回的数据
            let hex = ab2hex(res.value);
            // 获取总次数
            let num = hexSlice(hex);
            that.setData({
                shakeNum:num
            });
        });
    },

    // 读取低功耗蓝牙设备的特征值的二进制数据值
    // 接口读取到的信息需要在 onBLECharacteristicValueChange 方法注册的回调中获取
    readValue(){
        let connectingDeviceId = this.data.connectingDeviceId;
        let services_UUID = this.data.services_UUID;
        let characteristic_UUID = this.data.characteristic_UUID;
        wx.readBLECharacteristicValue({
            deviceId:connectingDeviceId,
            serviceId:services_UUID,
            characteristicId:characteristic_UUID,
            success(res){
                console.log('读取低功耗蓝牙设备的特征值的二进制数据值: 成功---');
                console.log(res);
            },
            fail(res){
                console.log('读取低功耗蓝牙设备的特征值的二进制数据值: 失败---');
                console.log(res);
            }
        });
    },

    // 向低功耗蓝牙设备特征值中写入二进制数据 建议每次写入不超过20字节
    writeValue(deviceId,services_UUID,characteristic_UUID,value){
        let that = this;
        // LegthGt20(value);
        // let len = writeValueQueue.length;
        // for(let i = 0; i < len; i++){
        //     // let buffer = hex2ab(queue[i]);
        //     if(queueSuccess){
        //         that.writeToBluetoothValue(deviceId,services_UUID,characteristic_UUID,writeValueQueue[i]);
        //     }
        // }
        that.writeToBluetoothValue(deviceId,services_UUID,characteristic_UUID,value);
    },

    // 蓝牙写数据
    writeToBluetoothValue(deviceId,services_UUID,characteristic_UUID,buffer){
        let value = hex2ab(buffer);
        wx.writeBLECharacteristicValue({
            deviceId:deviceId,
            serviceId:services_UUID,
            characteristicId:characteristic_UUID,
            value:value,
            success(res){
                console.log('向低功耗蓝牙设备特征值中写入二进制数据: 成功---');
                console.log(res);
                queueSuccess = true;
            },
            fail(res){
                console.log('向低功耗蓝牙设备特征值中写入二进制数据: 失败---');
                console.log(res);
                queueSuccess = false;
                writeValueQueue.push(buffer);
            }
        })
    },

    // 关闭蓝牙模块
    closeBluetooth(){
        wx.closeBluetoothAdapter({
            success(){
                toast('关闭成功');
            },
            fail(){
                toast('关闭失败');
            }
        });
    },
});

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
    let hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2);
        }
    );
    return hexArr.join('');
}


/**
 * 16进制字符串转ArrayBuffer
 */
function hex2ab(str) {
    if (!str) {
        return new ArrayBuffer(0);
    }
    // let count = str.length;
    // let buffer = new ArrayBuffer(count);
    // let dataView = new DataView(buffer);

    // let ind = 0;
    // // for (let i =0; i < count; i+=2) {
    // //     let code  = parseInt(str.substr(i, 2), 16);
    // //     dataView.setUint8(i, code);
    // //     ind++;
    // // }

    // for (let i = 0; i < count; i++) {
    //     dataView.setUint8(i, str.charAt(i).charCodeAt())
    // }

    let typedArray = new Uint8Array(str.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
    let buffer1 = typedArray.buffer;
    console.log(buffer1);
    return buffer1;
}

// 超过20字节分包
function LegthGt20(str) {
    let val_len = str.length;
    // let writeValueQueue = [];
    if(val_len > 20){
        for(let i = 0; i <= val_len; i+=21){
            let sub = str.slice(i,i+21);
            writeValueQueue.push(sub);
        }
    } else {
        writeValueQueue.push(str);
    }
}

// 16进制字符串取需要的字节(fe 08 01 00 01 01 01 7a0b 008f)
function hexSlice(hex) {
    // 取k8位
    let k8 = hex.slice(14,16);
    //取k9位
    let k9 = hex.slice(16,18);
    return parseInt(k9+k8,16);
}

function toast(title) {
    wx.showToast({
        title: title,
        icon:'none',
        duration:1500,
        success(){
            setTimeout(()=>{
                wx.hideToast();
            },2000);

        }
    });
}

function loading(title) {
    wx.showLoading({
        title:title,
        mask:true,
    });
}

function hide_Loading() {
    wx.hideLoading();
}

