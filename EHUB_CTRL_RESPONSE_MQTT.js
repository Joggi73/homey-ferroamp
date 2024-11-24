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
const bl_ehub_ctrl_resp_status = "bl_ehub_ctrl_resp_status";      // String    
const bl_ehub_ctrl_resp_msg = "bl_ehub_ctrl_resp_msg";            // String
const bl_ehub_ctrl_resp_transId = "bl_ehub_ctrl_resp_transId";    // Number
//const bl_ehub_ctrl_result_ok = "bl_ehub_ctrl_result_ok";          // Number. Recieved by REHUB_CTRL_REQUEST
const bl_ehub_ctrl_resp_ok = "bl_ehub_ctrl_resp_ok";

let ctrl_resp_status = flow_args.status;
let ctrl_resp_msg = flow_args.msg;
let ctrl_resp_transId = flow_args.transId;

//await BLApp.apiPut("/" + bl_ehub_eso_soc + "/" + parseFloat(flow_args.soc.val));
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

await BLApp.apiPut("/" + bl_ehub_ctrl_resp_status + "/" + ctrl_resp_status);
await BLApp.apiPut("/" + bl_ehub_ctrl_resp_msg + "/" + ctrl_resp_msg);
await BLApp.apiPut("/" + bl_ehub_ctrl_resp_transId + "/" + ctrl_resp_transId);

if(ctrl_resp_status == "ack"){
    await BLApp.apiPut("/" + bl_ehub_ctrl_resp_ok + "/" + "1");
} else {
    await BLApp.apiPut("/" + bl_ehub_ctrl_resp_ok + "/" + "0");
} 

return true;