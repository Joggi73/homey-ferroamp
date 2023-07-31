let bl = await Homey.apps.getApp({ id: 'net.i-dev.betterlogic' } );
if (!bl) {
console.error('Better Logic not installed!')
return false;
}

// Create the following numeric variables in BetterLogic before running the script
// Read from
let bl_ehub_charge_or_discharge = "bl_ehub_charge_or_discharge";
let bl_ehub_ctrl_last_transId = "bl_ehub_ctrl_last_transId";        //Type: Number. Value: 0 (initially)
let bl_ehub_ctrl_result_ok = "bl_ehub_ctrl_result_ok";              // Number
let bl_ehub_ctrl_charge_power = "bl_ehub_ctrl_charge_power";        //Type: Number. Value: 4300 (if that is a good value for your batteries).
let bl_ehub_ctrl_discharge_power = "bl_ehub_ctrl_discharge_power";  //Type: Number. Value: 4400 (if that is a good value for your batteries).

// Write to
let bl_ehub_ctrl_mqtt_message = "bl_ehub_ctrl_mqtt_message";    // String
let bl_ehub_debug_message = "bl_ehub_debug_message";

// Better Logic  
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

//get Better Logic variable
let tmp = await BLApp.apiGet(bl_ehub_charge_or_discharge);
let go_charging = tmp.value;
let tmp2 = await BLApp.apiGet(bl_ehub_ctrl_last_transId);
let lastTransId = tmp2.value;
let tmp3 = await BLApp.apiGet(bl_ehub_ctrl_result_ok);
let lastTranactionOk = tmp3.value;
let tmp4 = await BLApp.apiGet(bl_ehub_ctrl_charge_power);
let chargePower = tmp4.value;
let tmp5 = await BLApp.apiGet(bl_ehub_ctrl_discharge_power);
let dischargePower = tmp5.value;

let newTransactionId = 0;
let newMessage = "";
let debugMessage = "";

if(lastTranactionOk = 1){
    
    // Set new transaction id
    newTransactionId = lastTransId + 1;
    if (newTransactionId >= 1000){
        newTransactionId = 1;
    }

    if (go_charging >= 1) {
        // 5.1.1.1.1 Charging with 5000W:
        //extapi/control/request {"transId":"1", cmd":{"name":"charge","arg":"5000"}}
        newMessage = '{"transId": "' + newTransactionId + '", "cmd": { "name":"charge","arg":"' + chargePower + '"}}';
        await BLApp.apiPut("/" + bl_ehub_ctrl_mqtt_message + "/" + newMessage);
        await BLApp.apiPut("/" + bl_ehub_ctrl_last_transId + "/" + newTransactionId);
        
    } else if (go_charging <= -1) {
        // 5.1.1.1.2 Discharging with 12 kW:
        // extapi/control/request {"transId": "1508459760", "cmd":{"name":"discharge","arg":" 12000"}}
        newMessage = '{"transId": "' + newTransactionId + '", "cmd": { "name":"discharge","arg":"' + dischargePower + '"}}';
        await BLApp.apiPut("/" + bl_ehub_ctrl_mqtt_message + "/" + newMessage);
        await BLApp.apiPut("/" + bl_ehub_ctrl_last_transId + "/" + newTransactionId);

    } else {
        // 5.1.1.1.3 Returning control of batteries to system:
        // extapi/control/request {"transId": "989C6E5C-2CC1-11CA-A044-08002B1BB4F5", "cmd": {"name": "auto"}}
        newMessage = '{"transId": "' + newTransactionId + '", "cmd": {"name":"auto"}}';
        await BLApp.apiPut("/" + bl_ehub_ctrl_mqtt_message + "/" + newMessage);
        await BLApp.apiPut("/" + bl_ehub_ctrl_last_transId + "/" + newTransactionId);
    }

} else {
    debugMessage = "ehub_ctrl_request: Cannot send message to EHUB.";
    let result6 = await BLApp.apiPut("/" + bl_ehub_debug_message + "/" + debugMessage ); 
          
    return false;
}
