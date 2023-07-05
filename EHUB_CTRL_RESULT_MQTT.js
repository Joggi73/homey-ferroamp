if (args[0] == undefined) {
console.log ('Missing argument looser')
return false;
}

let bl = await Homey.apps.getApp({ id: 'net.i-dev.betterlogic' } );
if (!bl) {
console.error('Better Logic not installed!')
return false;
}

// Get the json message from EHUB
const flow_args = JSON.parse(args[0]);

// Create the following variables in BetterLogic
let bl_ehub_ctrl_result_status = "bl_ehub_ctrl_result_status";  //String        
let bl_ehub_ctrl_result_msg = "bl_ehub_ctrl_result_msg";        //String  
let bl_ehub_ctrl_result_transId = "bl_ehub_ctrl_result_transId"; //Number
let bl_ehub_ctrl_result_ok = "bl_ehub_ctrl_result_ok";           // Number. Recieved by REHUB_CTRL_REQUEST

let ctrl_resp_status = flow_args.status;
let ctrl_resp_msg = flow_args.msg;
let ctrl_resp_transId = flow_args.msg.transId;

//await BLApp.apiPut("/" + bl_ehub_eso_soc + "/" + parseFloat(flow_args.soc.val));
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

await BLApp.apiPut("/" + bl_ehub_ctrl_result_status + "/" + ctrl_resp_status);
await BLApp.apiPut("/" + bl_ehub_ctrl_result_msg + "/" + ctrl_resp_msg);
await BLApp.apiPut("/" + bl_ehub_ctrl_result_transId + "/" + ctrl_resp_transId);

if(ctrl_resp_status == "ack"){
    await BLApp.apiPut("/" + bl_ehub_ctrl_result_ok + "/" + "1");
} else {
    await BLApp.apiPut("/" + bl_ehub_ctrl_result_ok + "/" + "0");
} 

return true;