var  connectingDeviceId = '';
var servicesUUID = ["000018F0-0000-1000-8000-00805F9B34FB","E7810A71-73AE-499D-8C15-FAA9AEF0C3F2"];
Page({
    data: {
        openBluetoothAdapter:false,
        available:false,
        discovering:false,
        deviceList:[],
        connected:false,
        services:'',
        characteristics:'',
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
        let deviceId = e.currentTarget.dataset.deviceid;
        // 停止搜寻附近的蓝牙外围设备
        this.stopDiscovery();

        // 断开与低功耗蓝牙设备的连接 然后再连接新的设备
        this.closeConnection(deviceId);

        // 连接低功耗蓝牙设备
        this.BLEConnection(deviceId);

    },

    // 根据 uuid 获取处于已连接状态的设备
    getConnected(){
        wx.getConnectedBluetoothDevices({
            services:servicesUUID,
            success(res){
                console.log('根据 uuid 获取处于已连接状态的设备:成功---');
                console.log(res);
            },
            fail(res){
                console.log('根据 uuid 获取处于已连接状态的设备:失败---')
                console.log(res);
            },
        });
    },

    // 获取服务
    getServiceEvent(e){
        let deviceId = e.currentTarget.dataset.deviceid;
        this.getServices(deviceId);
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
                that.getDevices();
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
            that.getDevices();
            // 兼容安卓及iOS设备
            // if(res.deviceId){
            //     that.devicesData(res);
            //
            // } else if(res.devices){
            //     that.devicesData(res.devices[0]);
            //
            // } else if(res[0]){
            //     that.devicesData(res[0]);
            // }
        });
    },

    devicesData(new_devices){
        let that = this;
        let deviceList = that.data.deviceList;
        let len = deviceList.length;
        let isExist = false;
        console.log(new_devices);
        let advertisData = ab2hex(new_devices.advertisData);
        if(!advertisData){
            advertisData = '空';
        }
        new_devices.advertisData = advertisData;
        if(!new_devices.name){
            new_devices.name = '空'
        }
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
                    discovering:res.isDiscovering
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
        console.log('连接中');
        console.log(deviceId);
        wx.createBLEConnection({
            deviceId: deviceId,
            timeout: 300000,
            success(res){
                console.log('连接成功');
                console.log(res);
                connectingDeviceId = deviceId;
                that.setData({
                    connected:true,
                });
                hide_Loading();
                toast('连接成功');
            },
            fail(res){
                console.log('连接失败');
                console.log(res);
                that.setData({
                    connected:true,
                });
                hide_Loading();
                toast('连接失败');
            },
        });
    },

    // 断开与低功耗蓝牙设备的连接
    closeConnection(){
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
        console.log(deviceId);
        wx.getBLEDeviceServices({
            deviceId:deviceId,
            success(res){
                console.log('获取蓝牙设备service');
                console.log(res);
                that.setData({
                    services:res.services
                });
            },
            fail(res){
                toast('获取服务失败');
                console.log(res);
            },
        });
    },

    // 获取蓝牙设备某个服务中所有特征值(characteristic) 为了该特征值UUID支持的操作类型
    getCharacteristics(deviceId,serviceId_UUID){
        let that = this;
        wx.getBLEDeviceCharacteristics({
            deviceId:deviceId,
            serviceId:serviceId_UUID,
            success(res){
                console.log('获取蓝牙设备characteristic');
                console.log(res);
                that.setData({
                    characteristics:res.characteristics
                });
            },
            fail(){
                toast('获取特征值失败');
            }
        });
    },

    // 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值
    notifyValueChange(deviceId,serviceId_UUID,characteristicId_UUID){
        let that = this;
        wx.notifyBLECharacteristicValueChange({
            deviceId:deviceId,                          // 设备mac   IOS和安卓系统不一样
            serviceId:serviceId_UUID,                   // 服务通道，这里主要是notify
            characteristicId:characteristicId_UUID,     //notify uuid
            state:true,
            success(res){
                console.log('启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值: 成功---');
                console.log(res);
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
        wx.onBLECharacteristicValueChange(function(res){
            console.log('监听低功耗蓝牙设备的特征值变化');
            console.log(res);
            console.log(ab2hex(res.value));
        });
    },

    // 读取低功耗蓝牙设备的特征值的二进制数据值
    // 接口读取到的信息需要在 onBLECharacteristicValueChange 方法注册的回调中获取
    readValue(deviceId,serviceId_UUID,characteristicId_UUID){
        wx.readBLECharacteristicValue({
            deviceId:deviceId,
            serviceId:serviceId_UUID,
            characteristicId:characteristicId_UUID,
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

    // 向低功耗蓝牙设备特征值中写入二进制数据
    // 建议每次写入不超过20字节
    writeValue(deviceId,serviceId_UUID,characteristicId_UUID,value){
        wx.writeBLECharacteristicValue({
            deviceId:deviceId,
            serviceId:serviceId_UUID,
            characteristicId:characteristicId_UUID,
            value:value,
            success(res){
                console.log('向低功耗蓝牙设备特征值中写入二进制数据: 成功---');
                console.log(res);
            },
            fail(res){
                console.log('向低功耗蓝牙设备特征值中写入二进制数据: 失败---');
                console.log(res);
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
            return ('00' + bit.toString(16)).slice(-2)
        }
    );
    return hexArr.join('');
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