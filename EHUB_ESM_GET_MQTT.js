// ESM is the battery it self - Energy Storage Module 

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
let bl_ehub_esm_soc = "bl_ehub_esm_soc";          // Type: Number. Value: 0. State Of Charge for battery [%]
let bl_ehub_esm_soh = "bl_ehub_esm_soh";          // //Type: Number. Value: 0. State Of Health for battery [%]

var var_soc = parseFloat(flow_args.soc.val);
var var_soh = parseFloat(flow_args.soh.val);

//await BLApp.apiPut("/" + bl_ehub_eso_soc + "/" + parseFloat(flow_args.soc.val));
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

await BLApp.apiPut("/" + bl_ehub_esm_soc + "/" + var_soc);
await BLApp.apiPut("/" + bl_ehub_esm_soh + "/" + var_soh);

return true;